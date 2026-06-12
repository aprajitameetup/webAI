import React, { useRef, useState } from "react";
import { useBuiltinSession } from "../../../hooks/useBuiltinSession";

const UNAVAILABLE_NOTE =
  "Not available here. The Translator API needs Chrome/Edge with Built-in AI enabled and the language pack downloaded.";

const TARGETS: Array<{ code: string; label: string }> = [
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "hi", label: "Hindi" },
  { code: "ja", label: "Japanese" },
];

export default function TranslatorDemo() {
  const [input, setInput] = useState("The browser is the model.");
  const [target, setTarget] = useState("es");
  const targetRef = useRef(target);
  targetRef.current = target;

  const { state, progress, output, error, run, reset } = useBuiltinSession<any, string>({
    availability: () =>
      (self as any).Translator.availability({ sourceLanguage: "en", targetLanguage: "es" }),
    create: (onProgress) =>
      (self as any).Translator.create({
        sourceLanguage: "en",
        targetLanguage: targetRef.current,
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: any) => onProgress(e.loaded ?? 0));
        },
      }),
    run: async (session, text, onText) => {
      const translated = await session.translate(text);
      onText(translated);
    },
  });

  const busy = state === "running" || state === "downloading";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🌐 Live: Translator API (English →)</div>
        <button
          className="btn"
          disabled={state === "unavailable" || busy || !input.trim()}
          onClick={() => run(input)}
        >
          {state === "downloading" ? `Downloading… ${(progress * 100).toFixed(0)}%` : "Translate"}
        </button>
      </div>
      {state === "unavailable" ? (
        <div className="demo-out">{UNAVAILABLE_NOTE}</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3" }}
            />
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                reset();
              }}
              style={{ padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3" }}
            >
              {TARGETS.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className={"demo-out" + (error ? " err" : "")}>
            {error ? `❌ ${error}` : output || <span className="muted">Translation appears here.</span>}
          </div>
        </>
      )}
    </div>
  );
}
