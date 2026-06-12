import React, { useState } from "react";
import { useBuiltinSession } from "../../../hooks/useBuiltinSession";

const UNAVAILABLE_NOTE =
  "Not available here. The Language Detector API needs Chrome/Edge with Built-in AI enabled and the model downloaded.";

export default function LanguageDetectorDemo() {
  const [input, setInput] = useState("Bonjour, comment ça va aujourd'hui ?");
  const { state, progress, output, error, run } = useBuiltinSession<any, string>({
    availability: () => (self as any).LanguageDetector.availability(),
    create: (onProgress) =>
      (self as any).LanguageDetector.create({
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: any) => onProgress(e.loaded ?? 0));
        },
      }),
    run: async (session, text, onText) => {
      const results: Array<{ detectedLanguage: string; confidence: number }> =
        await session.detect(text);
      const top = results
        .slice(0, 3)
        .map((r) => `${r.detectedLanguage} — ${(r.confidence * 100).toFixed(1)}%`)
        .join("\n");
      onText(top || "no result");
    },
  });

  const busy = state === "running" || state === "downloading";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🔤 Live: Language Detector API</div>
        <button
          className="btn"
          disabled={state === "unavailable" || busy || !input.trim()}
          onClick={() => run(input)}
        >
          {state === "downloading" ? `Downloading… ${(progress * 100).toFixed(0)}%` : "Detect"}
        </button>
      </div>
      {state === "unavailable" ? (
        <div className="demo-out">{UNAVAILABLE_NOTE}</div>
      ) : (
        <>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3", marginBottom: 8 }}
          />
          <div className={"demo-out" + (error ? " err" : "")}>
            {error ? `❌ ${error}` : output || <span className="muted">Detected language(s) appear here.</span>}
          </div>
        </>
      )}
    </div>
  );
}
