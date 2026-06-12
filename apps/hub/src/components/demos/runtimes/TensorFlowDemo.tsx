import React, { useRef, useState } from "react";

type Phase = "idle" | "loading" | "running" | "ready" | "error";

export default function TensorFlowDemo() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const modelRef = useRef<any>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUrl(URL.createObjectURL(file));
    setOutput("");
    setPhase("idle");
  }

  async function classify() {
    if (!imgRef.current) return;
    try {
      if (!modelRef.current) {
        setPhase("loading");
        setOutput("Loading MobileNet…");
        await import("@tensorflow/tfjs");
        const mobilenet = await import("@tensorflow-models/mobilenet");
        modelRef.current = await mobilenet.load();
      }
      setPhase("running");
      setOutput("Classifying…");
      const preds: Array<{ className: string; probability: number }> =
        await modelRef.current.classify(imgRef.current, 3);
      setOutput(
        preds.map((p) => `${p.className} — ${(p.probability * 100).toFixed(1)}%`).join("\n"),
      );
      setPhase("ready");
    } catch (e: any) {
      setPhase("error");
      setOutput("❌ " + (e?.message ?? String(e)));
    }
  }

  const busy = phase === "loading" || phase === "running";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">📊 Live: TensorFlow.js — MobileNet image classify</div>
        <button className="btn" disabled={busy || !imgUrl} onClick={classify}>
          {phase === "loading" ? "Loading model…" : "Classify"}
        </button>
      </div>
      <input type="file" accept="image/*" onChange={onPick} style={{ marginBottom: 8, color: "#e6edf3" }} />
      {imgUrl && (
        <img
          ref={imgRef}
          src={imgUrl}
          alt="to classify"
          crossOrigin="anonymous"
          style={{ maxHeight: 160, borderRadius: 8, display: "block", marginBottom: 8 }}
        />
      )}
      <div className={"demo-out" + (phase === "error" ? " err" : "")}>
        {output || <span className="muted">Pick an image; MobileNet labels it on-device.</span>}
      </div>
    </div>
  );
}
