import React, { useState } from "react";
import { useLocalLLM } from "@webai/react";

export default function ChatDemo() {
  // In dev, route weight downloads through the Vite /hf proxy to dodge the HF Xet CDN
  // cross-origin redirect CORS failure. (Prod on-device download needs an edge rewrite.)
  const { status, progress, progressText, messages, source, error, send } = useLocalLLM({
    serverUrl: "/api/chat",
    hfProxy: import.meta.env.DEV ? `${location.origin}/hf/` : undefined,
  });
  const [input, setInput] = useState("");
  const busy = status === "streaming" || status === "loading" || status === "detecting";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">💬 On-device LLM chat</div>
        <span className="pill ship">{source ? `source: ${source}` : status}</span>
      </div>
      {status === "loading" && (
        <div className="muted">
          {progressText || "Loading model…"} {(progress * 100).toFixed(0)}%
        </div>
      )}
      {error && <div className="demo-out err">{error}</div>}
      <div className="demo-out" style={{ minHeight: 120 }}>
        {messages.length === 0 ? (
          <span className="muted">Ask something — it answers on-device once ready.</span>
        ) : (
          messages.map((m, i) => (
            <div key={i}>
              <b>{m.role}:</b> {m.content}
            </div>
          ))
        )}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !busy && input.trim()) {
              const t = input;
              setInput("");
              send(t);
            }
          }}
          placeholder={status === "ready" ? "Type a message…" : "Loading model…"}
          disabled={status !== "ready" && status !== "streaming"}
          style={{ flex: 1, padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3" }}
        />
        <button
          className="btn"
          disabled={busy || !input.trim()}
          onClick={() => {
            const t = input;
            setInput("");
            send(t);
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
