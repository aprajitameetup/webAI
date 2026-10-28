import React, { useEffect, useRef, useState } from "react";
import { normalizeAvailability } from "../../lib/builtinAI";

const CONFIDENCE_THRESHOLD = 0.35;
const TICK_MS = 1800;
const LOG_LIMIT = 5;
// mobilenet.load()'s default fetches from tfhub.dev (via loadGraphModel's fromTFHub
// transform: <url>/model.json?tfjs-format=file), which isn't proxied and gets blocked
// by this app's COEP header. Build that same URL ourselves through the /tfhub proxy.
const MOBILENET_MODEL_URL =
  `${location.origin}/tfhub/google/imagenet/mobilenet_v1_100_224/classification/1/model.json?tfjs-format=file`;

type GeminiState = "probing" | "available" | "unavailable";
type Phase = "idle" | "loading-model" | "watching" | "speaking";

function humanize(rawLabel: string): string {
  // MobileNet/ImageNet labels are often comma-separated synonyms, e.g. "coffee mug, cup".
  return rawLabel.split(",")[0].trim();
}

// ImageNet classes 151-268 are all dog breeds (118 of them) - MobileNet is forced to
// pick one even when none fit, and a small on-device model asked to describe an
// unfamiliar breed name (e.g. "bluetick") tends to hallucinate a plausible-sounding
// but wrong simplification instead of saying "dog" (this is the literal bug that
// made a live demo describe a dog as "blue"). Collapsing to the safe general
// category before it ever reaches the phrasing step removes the failure mode instead
// of trying to prompt around it.
const NARROW_DOG_BREED_LABELS = new Set([
  "Chihuahua", "Japanese spaniel", "Maltese dog, Maltese terrier, Maltese", "Pekinese, Pekingese, Peke",
  "Shih-Tzu", "Blenheim spaniel", "papillon", "toy terrier", "Rhodesian ridgeback", "Afghan hound, Afghan",
  "basset, basset hound", "beagle", "bloodhound, sleuthhound", "bluetick", "black-and-tan coonhound",
  "Walker hound, Walker foxhound", "English foxhound", "redbone", "borzoi, Russian wolfhound",
  "Irish wolfhound", "Italian greyhound", "whippet", "Ibizan hound, Ibizan Podenco",
  "Norwegian elkhound, elkhound", "otterhound, otter hound", "Saluki, gazelle hound",
  "Scottish deerhound, deerhound", "Weimaraner", "Staffordshire bullterrier, Staffordshire bull terrier",
  "American Staffordshire terrier, Staffordshire terrier, American pit bull terrier, pit bull terrier",
  "Bedlington terrier", "Border terrier", "Kerry blue terrier", "Irish terrier", "Norfolk terrier",
  "Norwich terrier", "Yorkshire terrier", "wire-haired fox terrier", "Lakeland terrier",
  "Sealyham terrier, Sealyham", "Airedale, Airedale terrier", "cairn, cairn terrier", "Australian terrier",
  "Dandie Dinmont, Dandie Dinmont terrier", "Boston bull, Boston terrier", "miniature schnauzer",
  "giant schnauzer", "standard schnauzer", "Scotch terrier, Scottish terrier, Scottie",
  "Tibetan terrier, chrysanthemum dog", "silky terrier, Sydney silky", "soft-coated wheaten terrier",
  "West Highland white terrier", "Lhasa, Lhasa apso", "flat-coated retriever", "curly-coated retriever",
  "golden retriever", "Labrador retriever", "Chesapeake Bay retriever", "German short-haired pointer",
  "vizsla, Hungarian pointer", "English setter", "Irish setter, red setter", "Gordon setter",
  "Brittany spaniel", "clumber, clumber spaniel", "English springer, English springer spaniel",
  "Welsh springer spaniel", "cocker spaniel, English cocker spaniel, cocker", "Sussex spaniel",
  "Irish water spaniel", "kuvasz", "schipperke", "groenendael", "malinois", "briard", "kelpie",
  "komondor", "Old English sheepdog, bobtail", "Shetland sheepdog, Shetland sheep dog, Shetland",
  "collie", "Border collie", "Bouvier des Flandres, Bouviers des Flandres", "Rottweiler",
  "German shepherd, German shepherd dog, German police dog, alsatian", "Doberman, Doberman pinscher",
  "miniature pinscher", "Greater Swiss Mountain dog", "Bernese mountain dog", "Appenzeller",
  "EntleBucher", "boxer", "bull mastiff", "Tibetan mastiff", "French bulldog", "Great Dane",
  "Saint Bernard, St Bernard", "Eskimo dog, husky", "malamute, malemute, Alaskan malamute",
  "Siberian husky", "dalmatian, coach dog, carriage dog", "affenpinscher, monkey pinscher, monkey dog",
  "basenji", "pug, pug-dog", "Leonberg", "Newfoundland, Newfoundland dog", "Great Pyrenees",
  "Samoyed, Samoyede", "Pomeranian", "chow, chow chow", "keeshond", "Brabancon griffon",
  "Pembroke, Pembroke Welsh corgi", "Cardigan, Cardigan Welsh corgi", "toy poodle", "miniature poodle",
  "standard poodle", "Mexican hairless",
]);

// Prefer a safe general category over a specific guess the model (or the phrasing
// step after it) is prone to mangling. Returns null when no narrower category applies.
function generalize(rawLabel: string): string | null {
  if (NARROW_DOG_BREED_LABELS.has(rawLabel)) return "dog";
  return null;
}

export default function BeMyEyesDemo() {
  const [active, setActive] = useState(false);
  const [caption, setCaption] = useState("");
  const [source, setSource] = useState<"mobilenet" | "gemini" | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [geminiState, setGeminiState] = useState<GeminiState>("probing");
  const [phase, setPhase] = useState<Phase>("idle");
  const [lastGuess, setLastGuess] = useState<{ label: string; probability: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const mobilenetRef = useRef<any>(null);
  const geminiSessionRef = useRef<any>(null);
  const lastLabelRef = useRef<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(() => (self as any).LanguageModel?.availability?.())
      .then((raw) => {
        if (!alive) return;
        setGeminiState(normalizeAvailability(raw) === "unavailable" ? "unavailable" : "available");
      })
      .catch(() => {
        if (alive) setGeminiState("unavailable");
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => stop, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function ensureMobilenet() {
    if (mobilenetRef.current) return mobilenetRef.current;
    setPhase("loading-model");
    await import("@tensorflow/tfjs");
    const mobilenet = await import("@tensorflow-models/mobilenet");
    mobilenetRef.current = await mobilenet.load({ version: 1, alpha: 1.0, modelUrl: MOBILENET_MODEL_URL });
    return mobilenetRef.current;
  }

  async function ensureGeminiSession() {
    if (geminiSessionRef.current) return geminiSessionRef.current;
    geminiSessionRef.current = await (self as any).LanguageModel.create();
    return geminiSessionRef.current;
  }

  async function phrase(label: string): Promise<{ text: string; source: "mobilenet" | "gemini" }> {
    const safeLabel = generalize(label) ?? humanize(label);
    const plain = `I see a ${safeLabel}.`;
    if (geminiState !== "available") return { text: plain, source: "mobilenet" };
    try {
      const session = await ensureGeminiSession();
      const text = await session.prompt(
        `In one short, natural sentence (under 12 words), describe this out loud for someone who can't see it: "${safeLabel}". ` +
          `Only describe what's given here, don't invent a more specific type, color, or detail you weren't told.`,
      );
      return { text: text.trim() || plain, source: "gemini" };
    } catch {
      return { text: plain, source: "mobilenet" };
    }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  async function tick() {
    if (busyRef.current || !videoRef.current) return;
    busyRef.current = true;
    try {
      const model = await ensureMobilenet();
      setPhase("watching");
      const preds: Array<{ className: string; probability: number }> = await model.classify(videoRef.current, 1);
      const top = preds[0];
      if (!top) return;
      setLastGuess({ label: humanize(top.className), probability: top.probability });
      if (top.probability < CONFIDENCE_THRESHOLD) return;
      if (top.className === lastLabelRef.current) return;
      lastLabelRef.current = top.className;

      setPhase("speaking");
      const { text, source: usedSource } = await phrase(top.className);
      setCaption(text);
      setSource(usedSource);
      setLog((prev) => [text, ...prev].slice(0, LOG_LIMIT));
      speak(text);
      setPhase("watching");
    } catch (e: any) {
      setError("❌ " + (e?.message ?? String(e)));
    } finally {
      busyRef.current = false;
    }
  }

  async function start() {
    setError(null);
    setCaption("");
    setLastGuess(null);
    setLog([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      setPhase("watching");
      lastLabelRef.current = null;
      tick(); // run one immediately instead of waiting a full TICK_MS for the first result
      intervalRef.current = window.setInterval(tick, TICK_MS);
    } catch (e: any) {
      setError("❌ " + (e?.message ?? String(e)));
      setActive(false);
    }
  }

  function stop() {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setActive(false);
    setPhase("idle");
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">👁️ Live: Be My Eyes — describe the camera aloud</div>
        <button className="btn" onClick={active ? stop : start}>
          {active ? "Stop camera" : "Start camera"}
        </button>
      </div>
      <div className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
        Runtime: <b>TensorFlow.js MobileNet</b> classifies the frame, then{" "}
        <b>{geminiState === "available" ? "Gemini Nano (on-device)" : "a plain template"}</b> turns the label into a
        spoken sentence. Everything runs on this device — nothing leaves the browser.
      </div>

      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          maxWidth: "100%",
          maxHeight: 280,
          borderRadius: 8,
          display: active ? "block" : "none",
          marginBottom: 8,
          transform: "scaleX(-1)",
        }}
      />

      {active && (
        <div className="muted" style={{ marginBottom: 8, fontSize: 12 }}>
          {phase === "loading-model" && "⏳ Loading the vision model (first run only, ~13MB — usually 5–15s)…"}
          {phase === "watching" && (
            <>
              👀 Watching — checking every {(TICK_MS / 1000).toFixed(1)}s.{" "}
              {lastGuess
                ? `Last guess: ${lastGuess.label} (${(lastGuess.probability * 100).toFixed(0)}%)${
                    lastGuess.probability < CONFIDENCE_THRESHOLD ? " — too unsure to speak yet, try a clearer object" : ""
                  }`
                : "Looking…"}
            </>
          )}
          {phase === "speaking" && "🗣️ Describing what it sees…"}
        </div>
      )}

      <div className={"demo-out" + (error ? " err" : "")}>
        {error ? (
          error
        ) : caption ? (
          <>
            {caption}
            <div className="muted" style={{ marginTop: 6, fontSize: 11 }}>
              via {source === "gemini" ? "Gemini Nano" : "MobileNet label"}
            </div>
          </>
        ) : (
          <span className="muted">Start the camera and point it at something nearby.</span>
        )}
      </div>

      {log.length > 1 && (
        <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
          {log.slice(1).map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}
