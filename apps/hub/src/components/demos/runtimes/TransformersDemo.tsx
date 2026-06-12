import React, { useRef, useState } from "react";

type Phase = "idle" | "loading" | "running" | "ready" | "error";

const EXAMPLES: Array<{ chip: string; text: string }> = [
  { chip: "😍 Positive", text: "This is hands down the best conference I've been to." },
  { chip: "😤 Negative", text: "The food was cold and the service was painfully slow." },
  { chip: "🤔 Sarcasm", text: "Oh great, another meeting." },
];

export default function TransformersDemo() {
  const [input, setInput] = useState("This is hands down the best conference I've been to.");
  const [output, setOutput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const pipeRef = useRef<any>(null);

  async function run(text: string) {
    try {
      if (!pipeRef.current) {
        setPhase("loading");
        setOutput("Loading model…");
        const { pipeline, env } = await import("@huggingface/transformers");
        // No local models; route HF downloads through the same-origin /hf proxy (Vite
        // in dev, Vercel edge function in prod) to dodge the Xet CDN CORS failure.
        env.allowLocalModels = false;
        (env as any).remoteHost = `${location.origin}/hf`;
        pipeRef.current = await pipeline("sentiment-analysis");
      }
      setPhase("running");
      setOutput("Analyzing…");
      const result = await pipeRef.current(text);
      const top = Array.isArray(result) ? result[0] : result;
      setOutput(`${top.label} — ${(top.score * 100).toFixed(1)}%`);
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
        <div className="title">🤗 Live: Transformers.js — sentiment analysis</div>
        <button className="btn" disabled={busy || !input.trim()} onClick={() => run(input)}>
          {phase === "loading" ? "Loading model…" : "Analyze"}
        </button>
      </div>
      <div className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
        Model: <b>DistilBERT</b> fine-tuned on SST-2 · a text classifier running in ONNX Runtime Web
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "100%", padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3", marginBottom: 8 }}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.chip}
            className="btn"
            disabled={busy}
            style={{ fontSize: 12, padding: "4px 10px", opacity: 0.9 }}
            onClick={() => {
              setInput(ex.text);
              run(ex.text);
            }}
          >
            {ex.chip}
          </button>
        ))}
      </div>
      <div className={"demo-out" + (phase === "error" ? " err" : "")}>
        {output || <span className="muted">Type a sentence (or tap an example) and classify its sentiment on-device.</span>}
      </div>
    </div>
  );
}
