import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Tower bricks, bottom to top. `layer` is the narrative step at which a brick lights up —
// the three "plumbing" bricks (Concurrency / Storage / Transport) share layer 3, so they
// all activate together on that one step while staying visually distinct.
const BRICKS: Array<{ name: string; tech: string; layer: number }> = [
  { name: "Compute", tech: "WebGPU · WebAssembly", layer: 0 },
  { name: "Runtimes", tech: "Transformers.js · ONNX · TensorFlow.js · MediaPipe · Pyodide", layer: 1 },
  { name: "The model", tech: "WebLLM · Built-in AI (Gemini Nano)", layer: 2 },
  { name: "Concurrency", tech: "Web Workers · SharedArrayBuffer · COOP/COEP", layer: 3 },
  { name: "Storage", tech: "OPFS · Cache · IndexedDB", layer: 3 },
  { name: "Transport", tech: "WebTransport · SSE · WebRTC", layer: 3 },
  { name: "Multimodal I/O", tech: "Web Audio · WebCodecs", layer: 4 },
  { name: "In-browser RAG", tech: "Embeddings · Vector search", layer: 5 },
];

interface Step {
  kicker: string;
  question: string;
  body: string;
  activeLayer: number; // -1 intro, 0..5 a layer, 6 thesis (all lit)
  demo?: string;
}

const STEPS: Step[] = [
  {
    kicker: "The shift",
    question: "How did the browser become a complete AI runtime?",
    body:
      "For a decade, “AI in a web app” meant one thing — a network call to someone else’s GPU. " +
      "That is no longer the only option. This is the story of the stack that changed it, built one " +
      "layer at a time. Press Next: each layer solves a problem the previous one created.",
    activeLayer: -1,
  },
  {
    kicker: "Layer 1 — the problem: raw math",
    question: "Before any model can run, something must do billions of multiply-adds — fast.",
    body:
      "WebGPU exposes the GPU to JavaScript for general computation (the fast lane); WebAssembly runs " +
      "C, C++, and Rust at near-native CPU speed (the reliable fallback). This is the bedrock everything " +
      "else stands on — and WebAssembly is the reason the runtimes ahead can exist in the browser at all: " +
      "they are compiled from existing native code.",
    activeLayer: 0,
    demo: "See it live: the Compute tab — a WebGPU shader and a WASM-vs-JS benchmark.",
  },
  {
    kicker: "Layer 2 — the problem: nobody writes shaders by hand",
    question: "You have raw compute. What do you actually build with?",
    body:
      "Libraries that sit on the compute layer, target WebGPU, and fall back to WebAssembly automatically. " +
      "Transformers.js runs task models like sentiment analysis; ONNX Runtime Web is the engine beneath it; " +
      "TensorFlow.js and MediaPipe handle vision; Pyodide runs real CPython. You get inference without ever " +
      "touching a shader.",
    activeLayer: 1,
    demo: "See it live: the Models & Runtimes tab — six runtimes running on-device.",
  },
  {
    kicker: "Layer 3 — the problem: you need a model",
    question: "Runtimes can run a model. But where does the model come from?",
    body:
      "Two answers, and this is the heart of it. With WebLLM you download a quantized LLM once and run it " +
      "over WebGPU. With Built-in AI, the browser already ships its own model — Chrome bundles Gemini Nano, " +
      "so you just call it: no download, no API key. Either way, the intelligence now lives on the device. " +
      "The browser is the model.",
    activeLayer: 2,
    demo: "See it live: the on-device chat demo, and the Built-in AI tab.",
  },
  {
    kicker: "Layer 4 — the problem: making it usable",
    question: "It runs — but it freezes the tab, re-downloads every visit, and feels slow.",
    body:
      "Web Workers move inference off the main thread so the interface stays responsive. OPFS and Cache " +
      "Storage persist the model weights — which is exactly why it still answers with the network switched " +
      "off. Streaming reveals tokens as they are produced, so it feels instant. And cross-origin isolation " +
      "(the COOP/COEP headers) unlocks the threading underneath. Unglamorous, and essential.",
    activeLayer: 3,
    demo: "See it live: the Concurrency, Storage, and Transport tabs.",
  },
  {
    kicker: "Layer 5 — the problem: text is the easy case",
    question: "What about voice and vision?",
    body:
      "Web Audio captures the microphone; WebCodecs pulls raw frames straight off the camera with no hidden " +
      "video element. Chain them together and an entire voice assistant becomes browser APIs end to end: " +
      "microphone → speech recognition → language model → text-to-speech → speaker.",
    activeLayer: 4,
    demo: "See it live: the Multimodal tab — mic waveform and raw camera frames.",
  },
  {
    kicker: "Layer 6 — the problem: it doesn’t know your data",
    question: "Can it answer about my documents — privately?",
    body:
      "Turn your documents into embeddings with Transformers.js, search them in an in-browser vector store, " +
      "and feed the closest matches into the on-device model as context. Now it answers questions about your " +
      "own notes — and not a byte of them ever leaves your machine.",
    activeLayer: 5,
    demo: "Coming soon: the In-browser RAG tab.",
  },
  {
    kicker: "The payoff",
    question: "The browser is no longer a thin client. It is a complete AI runtime.",
    body:
      "Stack every layer and you get something that was impossible a few years ago: AI that is private, " +
      "offline-capable, zero-cost, and instant. The pattern that ties it together is simple — detect what the " +
      "device can do, route to the best available engine, and fall back gracefully when something is missing.",
    activeLayer: 6,
  },
];

const ACCENT = "#30c8ff";

function blockAnim(layerIndex: number, activeLayer: number) {
  const lit = activeLayer === 6;
  const isActive = layerIndex === activeLayer;
  const isPlaced = activeLayer >= 0 && layerIndex < activeLayer;
  if (isActive) {
    return {
      opacity: 1,
      scale: 1.03,
      borderColor: ACCENT,
      boxShadow: `0 0 26px rgba(48,200,255,0.35)`,
      background: "rgba(48,200,255,0.10)",
    };
  }
  if (lit || isPlaced) {
    return {
      opacity: lit ? 1 : 0.6,
      scale: 1,
      borderColor: lit ? "rgba(48,200,255,0.45)" : "#2a3342",
      boxShadow: lit ? `0 0 14px rgba(48,200,255,0.18)` : "none",
      background: "#0d1219",
    };
  }
  // ghost (not yet introduced)
  return {
    opacity: 0.16,
    scale: 0.98,
    borderColor: "#2a3342",
    boxShadow: "none",
    background: "transparent",
  };
}

export default function TheStack() {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const last = STEPS.length - 1;

  const next = useCallback(() => setStep((s) => Math.min(s + 1, last)), [last]);
  const prev = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div>
      <div className="eyebrow">The story</div>
      <h1>The Stack</h1>
      <p className="lead">
        How the browser became a complete AI runtime — built one layer at a time. Use{" "}
        <b>Next</b> / <b>Prev</b> (or the <b>←</b> / <b>→</b> keys); each layer answers a problem
        the previous one created.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
          gap: 28,
          alignItems: "center",
          margin: "24px 0",
        }}
      >
        {/* Narrative card */}
        <div style={{ minHeight: 320 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <div
                style={{
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: 12,
                  color: ACCENT,
                  marginBottom: 12,
                }}
              >
                {current.kicker}
              </div>
              <h2 style={{ fontSize: 26, lineHeight: 1.25, margin: "0 0 16px" }}>
                {current.question}
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "#c2cdd9", margin: 0 }}>
                {current.body}
              </p>
              {current.demo && (
                <div className="muted" style={{ marginTop: 16, fontSize: 14 }}>
                  {current.demo}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Stack tower */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...BRICKS].reverse().map((brick) => (
            <motion.div
              key={brick.name}
              animate={blockAnim(brick.layer, current.activeLayer)}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
              style={{
                border: "1px solid #2a3342",
                borderRadius: 10,
                padding: "11px 14px",
              }}
            >
              <div style={{ fontWeight: 700, color: "#e6edf3" }}>{brick.name}</div>
              <div className="detail" style={{ fontSize: 12.5, marginTop: 2 }}>
                {brick.tech}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
        <button className="btn" onClick={prev} disabled={step === 0}>
          ‹ Prev
        </button>
        <button className="btn" onClick={next} disabled={step === last}>
          Next ›
        </button>
        <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                cursor: "pointer",
                background: i === step ? ACCENT : "#2a3342",
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>
        <div className="muted" style={{ marginLeft: "auto", fontSize: 13 }}>
          Step {step + 1} / {STEPS.length}
        </div>
      </div>
    </div>
  );
}
