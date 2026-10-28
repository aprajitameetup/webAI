import React, { useEffect, useMemo, useState } from "react";
import { runGate, estimateTokens } from "../../lib/tokenLab";
import { useBuiltinSession, buttonLabel } from "../../hooks/useBuiltinSession";

/** A deliberately messy tool dump: repeated debug noise plus a few real events. */
function buildMessyPayload(): string {
  const lines: string[] = ["Question: what is the status of order 4821?", ""];
  for (let i = 0; i < 70; i++) lines.push("[debug]   heartbeat ok     worker=7   queue=0");
  lines.push("");
  const hubs = ["Ludhiana", "Ambala", "Chandigarh", "Mohali", "Panchkula"];
  for (let i = 0; i < 30; i++) {
    lines.push(
      `{"order_id":4821,"event":"scan","seq":${i},"hub":"${hubs[i % hubs.length]}","ts":"2026-10-23T10:${String(i).padStart(2, "0")}:00Z",   "status":"${
        i < 29 ? "in_transit" : "out_for_delivery"
      }","carrier":"BlueDart","meta":{"debug":true,"trace":"abc-${i}"}}`,
    );
    lines.push("[debug]   heartbeat ok     worker=7   queue=0");
  }
  return lines.join("\n");
}

const card: React.CSSProperties = {
  background: "#070a0f",
  border: "1px solid #2a3342",
  borderRadius: 10,
  padding: 12,
};

function Bar({ label, tokens, max, color }: { label: string; tokens: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.max(2, Math.round((tokens / max) * 100));
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span>{label}</span>
        <span style={{ fontFamily: "monospace" }}>{tokens.toLocaleString()} tokens</span>
      </div>
      <div style={{ height: 10, background: "#161d29", borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width .35s" }} />
      </div>
    </div>
  );
}

export default function BeforeTheWireDemo() {
  const [raw, setRaw] = useState(buildMessyPayload);
  const [question, setQuestion] = useState("What is the status of order 4821?");
  const [dedupe, setDedupe] = useState(false);
  const [collapse, setCollapse] = useState(false);
  const [truncate, setTruncate] = useState(false);
  const [truncateTo, setTruncateTo] = useState(400);
  const [requests, setRequests] = useState(0);

  const gate = useMemo(
    () => runGate(raw, { dedupe, collapse, truncate, truncateTo }),
    [raw, dedupe, collapse, truncate, truncateTo],
  );

  // count fetch/XHR requests that happen while this panel is open
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    const po = new PerformanceObserver((list) => {
      const n = list
        .getEntries()
        .filter((e) => ["fetch", "xmlhttprequest"].includes((e as PerformanceResourceTiming).initiatorType)).length;
      if (n) setRequests((c) => c + n);
    });
    try {
      po.observe({ type: "resource", buffered: false });
    } catch {
      /* resource timing not available */
    }
    return () => po.disconnect();
  }, []);

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

  const onDevice = gate.route.where === "device";
  const sentTokens = onDevice ? 0 : gate.finalTokens;
  const busy = state === "running" || state === "downloading" || state === "loading";
  const toggle = (label: string, v: boolean, set: (b: boolean) => void) => (
    <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13 }}>
      <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} /> {label}
    </label>
  );

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🚪 Live: a gate on the device (before the wire)</div>
        <button className="btn ghost" onClick={() => { setRaw(buildMessyPayload()); setDedupe(false); setCollapse(false); setTruncate(false); }}>
          Reset
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
            The payload an agent is about to send (a noisy tool result). Edit it freely.
          </div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={11}
            style={{ width: "100%", padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3", fontFamily: "monospace", fontSize: 11 }}
          />
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
            {toggle("1. dedupe lines", dedupe, setDedupe)}
            {toggle("2. collapse whitespace", collapse, setCollapse)}
            {toggle("3. truncate", truncate, setTruncate)}
          </div>
          <div style={{ marginTop: 6, opacity: truncate ? 1 : 0.4 }}>
            <label style={{ fontSize: 12 }}>
              keep at most {truncateTo} tokens{" "}
              <input type="range" min={100} max={2000} step={50} value={truncateTo} disabled={!truncate} onChange={(e) => setTruncateTo(Number(e.target.value))} />
            </label>
          </div>
        </div>

        <div>
          <div style={card}>
            {gate.stages.map((s, i) => (
              <Bar key={s.name} label={s.name} tokens={s.tokens} max={gate.rawTokens} color={i === 0 ? "#f78166" : "#3fb950"} />
            ))}
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Saved before leaving the device: <b style={{ color: "#3fb950" }}>{gate.savedPct}%</b> (estimate, about 4 characters per token)
            </div>
          </div>

          <div style={{ ...card, marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Local router</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: onDevice ? "#3fb950" : "#f78166", margin: "2px 0" }}>
              {onDevice ? "Answer on the device" : "Escalate to the server"}
            </div>
            <div style={{ fontSize: 12 }}>{gate.route.reasons.join("; ")}</div>
            {gate.routeRaw.where !== gate.route.where && (
              <div style={{ fontSize: 12, marginTop: 4, color: "#d2a8ff" }}>
                Before cleaning this would have gone to the server.
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <div style={{ ...card, flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Tokens sent to a server</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace" }}>{sentTokens.toLocaleString()}</div>
            </div>
            <div style={{ ...card, flex: 1 }}>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>fetch/XHR since this panel opened</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: requests === 0 ? "#3fb950" : "#f78166" }}>{requests}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
          When the router says "device", the cleaned payload goes to the on-device model (Prompt API, Gemini Nano). Nothing leaves the browser.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            style={{ flex: 1, padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3" }}
          />
          <button
            className="btn"
            disabled={!onDevice || state === "unavailable" || busy || !question.trim()}
            onClick={() => run(`Answer in one or two sentences using only this context.\n\nContext:\n${gate.final}\n\nQuestion: ${question}`)}
          >
            {buttonLabel(state, progress, "Answer on the device")}
          </button>
        </div>
        <div className={"demo-out" + (error ? " err" : "")} style={{ marginTop: 8 }}>
          {state === "unavailable" ? (
            "The Prompt API is not available in this browser. The gate and the router still work. To see the model answer, use Chrome or Edge with Built-in AI enabled."
          ) : error ? (
            `❌ ${error}`
          ) : output ? (
            output
          ) : (
            <span className="muted">
              {onDevice ? `Ready. The model would read ${estimateTokens(gate.final).toLocaleString()} cleaned tokens.` : "Clean the payload until the router picks the device."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
