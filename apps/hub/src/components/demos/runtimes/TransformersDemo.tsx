import React, { useRef, useState } from "react";

type Phase = "idle" | "loading" | "running" | "ready" | "error";

export default function TransformersDemo() {
  const [input, setInput] = useState("Web AI running in the browser is incredible!");
  const [output, setOutput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const pipeRef = useRef<any>(null);

  async function run() {
    try {
      if (!pipeRef.current) {
        setPhase("loading");
        setOutput("Loading model…");
        const { pipeline, env } = await import("@huggingface/transformers");
        // No local models; in dev, route HF downloads through the /hf proxy to
        // dodge the Xet CDN cross-origin CORS failure (same fix as WebLLM).
        env.allowLocalModels = false;
        if (import.meta.env.DEV) {
          (env as any).remoteHost = `${location.origin}/hf`;
        }
        pipeRef.current = await pipeline("sentiment-analysis");
      }
      setPhase("running");
      setOutput("Analyzing…");
      const result = await pipeRef.current(input);
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
        <button className="btn" disabled={busy || !input.trim()} onClick={run}>
          {phase === "loading" ? "Loading model…" : "Analyze"}
        </button>
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "100%", padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3", marginBottom: 8 }}
      />
      <div className={"demo-out" + (phase === "error" ? " err" : "")}>
        {output || <span className="muted">Type a sentence and analyze its sentiment on-device.</span>}
      </div>
    </div>
  );
}
