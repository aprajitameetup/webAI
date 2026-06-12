import React, { useState } from "react";
import { useBuiltinSession } from "../../../hooks/useBuiltinSession";

const UNAVAILABLE_NOTE =
  "Not available here. The Prompt API needs Chrome/Edge with Built-in AI enabled (chrome://flags → Prompt API for Gemini Nano) and the model downloaded.";

export default function PromptDemo() {
  const [input, setInput] = useState("Explain WebGPU in one sentence.");
  const { state, progress, output, error, run } = useBuiltinSession<any, string>({
    availability: () => (self as any).LanguageModel.availability(),
    create: (onProgress) =>
      (self as any).LanguageModel.create({
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: any) => onProgress(e.loaded ?? 0));
        },
      }),
    run: async (session, text, onText) => {
      let acc = "";
      const stream = await session.promptStreaming(text);
      for await (const chunk of stream) {
        acc += chunk;
        onText(acc);
      }
    },
  });

  const busy = state === "running" || state === "downloading";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">💬 Live: Prompt API (Gemini Nano)</div>
        <button
          className="btn"
          disabled={state === "unavailable" || busy || !input.trim()}
          onClick={() => run(input)}
        >
          {state === "downloading" ? `Downloading… ${(progress * 100).toFixed(0)}%` : "Prompt"}
        </button>
      </div>
      {state === "unavailable" ? (
        <div className="demo-out">{UNAVAILABLE_NOTE}</div>
      ) : (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            style={{ width: "100%", padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3", marginBottom: 8 }}
          />
          <div className={"demo-out" + (error ? " err" : "")}>
            {error ? `❌ ${error}` : output || <span className="muted">Reply streams here.</span>}
          </div>
        </>
      )}
    </div>
  );
}
