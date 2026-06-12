import React, { useState } from "react";
import { useBuiltinSession } from "../../../hooks/useBuiltinSession";

const UNAVAILABLE_NOTE =
  "Not available here. The Summarizer API needs Chrome/Edge with Built-in AI enabled and the model downloaded.";

const SAMPLE =
  "The new web AI stack runs models directly in the browser. WebGPU provides the compute, " +
  "runtimes like WebLLM and Transformers.js load quantized models, and the browser can even " +
  "ship its own model via the Prompt API. Everything runs on-device: private, offline-capable, " +
  "and free of server costs.";

export default function SummarizerDemo() {
  const [input, setInput] = useState(SAMPLE);
  const { state, progress, output, error, run } = useBuiltinSession<any, string>({
    availability: () => (self as any).Summarizer.availability(),
    create: (onProgress) =>
      (self as any).Summarizer.create({
        type: "tldr",
        format: "plain-text",
        length: "short",
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: any) => onProgress(e.loaded ?? 0));
        },
      }),
    run: async (session, text, onText) => {
      const summary = await session.summarize(text);
      onText(summary);
    },
  });

  const busy = state === "running" || state === "downloading";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">📝 Live: Summarizer API</div>
        <button
          className="btn"
          disabled={state === "unavailable" || busy || !input.trim()}
          onClick={() => run(input)}
        >
          {state === "downloading" ? `Downloading… ${(progress * 100).toFixed(0)}%` : "Summarize"}
        </button>
      </div>
      {state === "unavailable" ? (
        <div className="demo-out">{UNAVAILABLE_NOTE}</div>
      ) : (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3", marginBottom: 8 }}
          />
          <div className={"demo-out" + (error ? " err" : "")}>
            {error ? `❌ ${error}` : output || <span className="muted">Summary appears here.</span>}
          </div>
        </>
      )}
    </div>
  );
}
