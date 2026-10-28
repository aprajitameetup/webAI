import React, { useEffect, useState } from "react";
import { AGENT_START, AgentConfig, AgentResult, LEVERS_OFF, PromptBlock, createScriptedModel, runAgent } from "../../lib/agentRunner";
import leversSource from "../../lib/agentLevers.ts?raw";

const PRESETS: { name: string; patch: Partial<AgentConfig> }[] = [
  { name: "Naive loop", patch: { ...LEVERS_OFF, tool: 0, stuckAfter: null, turns: 50 } },
  { name: "+ prompt caching", patch: { ...LEVERS_OFF, caching: true, tool: 0, stuckAfter: null, turns: 50 } },
  { name: "+ caching + compaction", patch: { ...LEVERS_OFF, caching: true, compactEvery: 10, tool: 0, stuckAfter: null, turns: 50 } },
  { name: "Tool-heavy, all levers", patch: { caching: true, compactEvery: 10, clearTools: true, maxTurns: 40, stopOnRepeat: null, tool: 3000, stuckAfter: null, turns: 50 } },
  { name: "Stuck agent", patch: { ...LEVERS_OFF, stopOnRepeat: 3, tool: 0, stuckAfter: 8, turns: 100 } },
];

const money = (n: number) => `$${n.toFixed(n < 10 ? 2 : 1)}`;
const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : String(n));

function Slider(props: { label: string; value: number; min: number; max: number; step: number; set: (n: number) => void; fmt?: (n: number) => string; disabled?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: 12, opacity: props.disabled ? 0.4 : 1, marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{props.label}</span>
        <span style={{ fontFamily: "monospace" }}>{props.fmt ? props.fmt(props.value) : props.value}</span>
      </div>
      <input type="range" min={props.min} max={props.max} step={props.step} value={props.value} disabled={props.disabled} onChange={(e) => props.set(Number(e.target.value))} style={{ width: "100%" }} />
    </label>
  );
}


const SEG_STYLE: Record<PromptBlock["label"], string> = { system: "system prompt", conversation: "conversation", "tool result": "tool result", cleared: "cleared", summary: "summary" };

function mergeBlocks(blocks: PromptBlock[]) {
  const segs: { label: PromptBlock["label"]; tokens: number; cached: boolean }[] = [];
  for (const b of blocks) {
    const last = segs[segs.length - 1];
    if (last && last.label === b.label && last.cached === b.cached) last.tokens += b.tokens;
    else segs.push({ label: b.label, tokens: b.tokens, cached: b.cached });
  }
  return segs;
}

function PromptInspector({ cfg, result }: { cfg: AgentConfig; result: AgentResult }) {
  const n = result.rows.length;
  const [turn, setTurn] = useState(n);
  const [playing, setPlaying] = useState(false);
  const t = Math.min(Math.max(1, turn), n);

  useEffect(() => setTurn(n), [n, cfg.caching, cfg.compactEvery, cfg.clearTools, cfg.maxTurns, cfg.stopOnRepeat]);
  useEffect(() => {
    if (!playing) return;
    if (t >= n) { setPlaying(false); return; }
    const id = setTimeout(() => setTurn(t + 1), 450);
    return () => clearTimeout(id);
  }, [playing, t, n]);

  const blocks = result.prompts[t - 1] ?? [];
  const segs = mergeBlocks(blocks);
  const total = blocks.reduce((a, b) => a + b.tokens, 0);
  const cachedTokens = blocks.filter((b) => b.cached).reduce((a, b) => a + b.tokens, 0);
  const fresh = total - cachedTokens;
  const p = cfg.prices;
  const cachedCost = (cachedTokens * p.cacheRead) / 1e6;
  const freshCost = (fresh * (cfg.caching ? p.cacheWrite : p.input)) / 1e6;
  const naiveCost = (total * p.input) / 1e6;

  const printToConsole = () => {
    // eslint-disable-next-line no-console
    console.log(`%cTurn ${t}: ${cachedTokens.toLocaleString()} of ${total.toLocaleString()} tokens served from cache`, "color:#3fb950;font-weight:bold");
    // eslint-disable-next-line no-console
    console.table(segs.map((s) => ({ part: SEG_STYLE[s.label], tokens: s.tokens, source: s.cached ? "CACHE (cheap)" : "NEW (full price)" })));
  };

  return (
    <div style={{ marginTop: 12, background: "#070a0f", border: "1px solid #2a3342", borderRadius: 10, padding: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Look inside one prompt: what the provider received on turn {t}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn ghost" onClick={() => { if (t >= n) setTurn(1); setPlaying((v) => !v); }}>{playing ? "Pause" : "Play turns"}</button>
          <button className="btn ghost" onClick={printToConsole}>Print to console</button>
        </div>
      </div>
      <input type="range" min={1} max={n} step={1} value={t} onChange={(e) => { setPlaying(false); setTurn(Number(e.target.value)); }} style={{ width: "100%" }} aria-label="turn" />

      <div style={{ display: "flex", height: 44, borderRadius: 8, overflow: "hidden", border: "1px solid #2a3342", marginTop: 6 }}>
        {segs.map((s, i) => (
          <div
            key={i}
            title={`${SEG_STYLE[s.label]}: ${s.tokens.toLocaleString()} tokens, ${s.cached ? "from cache" : "full price"}`}
            style={{
              flex: s.tokens,
              minWidth: 24,
              background: s.cached ? "rgba(63,185,80,.40)" : "rgba(247,129,102,.50)",
              borderRight: "2px solid #070a0f",
              fontSize: 10,
              padding: "3px 4px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              color: "#e6edf3",
            }}
          >
            <div style={{ fontWeight: 700 }}>{SEG_STYLE[s.label]}</div>
            <div style={{ fontFamily: "monospace" }}>{compact(s.tokens)}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, fontSize: 11, marginTop: 6 }}>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(63,185,80,.6)", marginRight: 4 }} />served from cache (cheap)</span>
        <span><span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(247,129,102,.7)", marginRight: 4 }} />new this turn (full price)</span>
      </div>

      <div style={{ fontFamily: "monospace", fontSize: 12, marginTop: 8, lineHeight: 1.6 }}>
        {cfg.caching ? (
          <>
            <div style={{ color: "#3fb950" }}>from cache: {cachedTokens.toLocaleString()} tokens x ${p.cacheRead}/M = ${cachedCost.toFixed(3)}</div>
            <div style={{ color: "#f78166" }}>new: {fresh.toLocaleString()} tokens x ${p.cacheWrite}/M = ${freshCost.toFixed(3)}</div>
            <div>this prompt: ${(cachedCost + freshCost).toFixed(3)} instead of ${naiveCost.toFixed(3)} without caching</div>
          </>
        ) : (
          <div style={{ color: "#f78166" }}>no caching: all {total.toLocaleString()} tokens x ${p.input}/M = ${naiveCost.toFixed(3)} for this one prompt</div>
        )}
      </div>
    </div>
  );
}

export default function AfterTheWireDemo() {
  const [p, setP] = useState<AgentConfig>(AGENT_START);
  const [res, setRes] = useState<{ base: AgentResult; cur: AgentResult } | null>(null);
  const patch = (x: Partial<AgentConfig>) => setP((cur) => ({ ...cur, ...x }));

  // run the real agent loop twice: once naive, once with the chosen levers
  useEffect(() => {
    let alive = true;
    (async () => {
      const base = await runAgent({ ...p, ...LEVERS_OFF }, createScriptedModel(p));
      const cur = await runAgent(p, createScriptedModel(p));
      if (alive) setRes({ base, cur });
    })();
    return () => {
      alive = false;
    };
  }, [p]);

  const base = res?.base;
  const cur = res?.cur;
  const savedPct = base && cur && base.totals.cost > 0 ? Math.round((1 - cur.totals.cost / base.totals.cost) * 100) : 0;

  const W = 560, H = 190, padL = 8, padB = 18;
  const n = base?.rows.length ?? 1;
  const maxCost = base?.rows[n - 1]?.cumulative || 1;
  const xs = (i: number) => padL + (i / Math.max(1, n - 1)) * (W - padL - 8);
  const ys = (v: number) => H - padB - (v / maxCost) * (H - padB - 10);
  const line = (rows: { cumulative: number }[]) => rows.map((r, i) => `${xs(i).toFixed(1)},${ys(r.cumulative).toFixed(1)}`).join(" ");

  const check = (label: string, v: boolean, set: (b: boolean) => void) => (
    <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 13, marginBottom: 4 }}>
      <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} /> {label}
    </label>
  );

  const stopNote = cur?.stoppedBy === "budget" ? " (budget stop)" : cur?.stoppedBy === "repeat" ? " (loop detected)" : "";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🔁 Live: a real agent loop (after the wire)</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PRESETS.map((pr) => (
            <button key={pr.name} className="btn ghost" onClick={() => setP({ ...AGENT_START, ...pr.patch })}>
              {pr.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "250px minmax(0, 1fr)", gap: 16 }}>
        <div>
          <Slider label="turns" value={p.turns} min={5} max={100} step={5} set={(n) => patch({ turns: n })} />
          <Slider label="system prompt + tool schemas" value={p.system} min={1000} max={100000} step={1000} set={(n) => patch({ system: n })} fmt={(n) => `${compact(n)} tokens`} />
          <Slider label="tool output per turn" value={p.tool} min={0} max={8000} step={500} set={(n) => patch({ tool: n })} fmt={(n) => `${compact(n)} tokens`} />
          {check("the agent gets stuck from turn 8", p.stuckAfter !== null, (b) => patch({ stuckAfter: b ? 8 : null }))}
          <div style={{ borderTop: "1px solid #2a3342", margin: "10px 0 8px" }} />
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>LEVERS</div>
          {check("1. prompt caching", p.caching, (b) => patch({ caching: b }))}
          {check(`2. compaction every ${p.compactEvery ?? 10} turns`, p.compactEvery !== null, (b) => patch({ compactEvery: b ? 10 : null }))}
          <Slider label="compact every" value={p.compactEvery ?? 10} min={5} max={25} step={5} set={(n) => patch({ compactEvery: n })} disabled={p.compactEvery === null} fmt={(n) => `${n} turns`} />
          {check("3. clear tool results after one read", p.clearTools, (b) => patch({ clearTools: b }))}
          {check("4a. step budget", p.maxTurns !== null, (b) => patch({ maxTurns: b ? Math.min(30, p.turns) : null }))}
          <Slider label="stop after" value={p.maxTurns ?? 30} min={5} max={p.turns} step={5} set={(n) => patch({ maxTurns: n })} disabled={p.maxTurns === null} fmt={(n) => `${n} turns`} />
          {check("4b. stop on 3 identical calls", p.stopOnRepeat !== null, (b) => patch({ stopOnRepeat: b ? 3 : null }))}
        </div>

        <div>
          <div style={{ background: "#070a0f", border: "1px solid #2a3342", borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>Cumulative cost per turn</div>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Cumulative cost per turn, naive versus selected levers">
              {base && <polyline points={line(base.rows)} fill="none" stroke="#f78166" strokeWidth="2.5" strokeDasharray="5 4" />}
              {cur && <polyline points={line(cur.rows)} fill="none" stroke="#3fb950" strokeWidth="3" />}
              {base && <text x={W - 6} y={ys(base.totals.cost) - 6} textAnchor="end" fontSize="12" fill="#f78166">naive {money(base.totals.cost)}</text>}
              {cur && <text x={xs(cur.rows.length - 1)} y={ys(cur.totals.cost) - 8} textAnchor="end" fontSize="12" fill="#3fb950">now {money(cur.totals.cost)}</text>}
              <text x={padL} y={H - 4} fontSize="10" fill="#8b949e">turn 1</text>
              <text x={W - 8} y={H - 4} fontSize="10" fill="#8b949e" textAnchor="end">turn {n}</text>
            </svg>
          </div>

          {base && cur && (
            <table style={{ width: "100%", marginTop: 10, fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--muted)" }}><th></th><th>naive loop</th><th>with your levers</th></tr>
              </thead>
              <tbody>
                <tr><td>Cost</td><td style={{ color: "#f78166", fontFamily: "monospace" }}>{money(base.totals.cost)}</td><td style={{ color: "#3fb950", fontFamily: "monospace" }}>{money(cur.totals.cost)} ({savedPct >= 0 ? `-${savedPct}` : `+${-savedPct}`}%)</td></tr>
                <tr><td>Input tokens processed</td><td style={{ fontFamily: "monospace" }}>{compact(base.totals.input)}</td><td style={{ fontFamily: "monospace" }}>{compact(cur.totals.input)}</td></tr>
                <tr><td>Served from cache</td><td style={{ fontFamily: "monospace" }}>{compact(base.totals.read)}</td><td style={{ fontFamily: "monospace" }}>{compact(cur.totals.read)}</td></tr>
                <tr><td>Turns completed</td><td style={{ fontFamily: "monospace" }}>{base.totals.turns}</td><td style={{ fontFamily: "monospace" }}>{cur.totals.turns}{stopNote}</td></tr>
              </tbody>
            </table>
          )}

          {cur && <PromptInspector cfg={p} result={cur} />}

          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>What the code just did</div>
            <div className="demo-out" style={{ maxHeight: 120 }}>
              {cur && cur.events.length > 0 ? (
                cur.events.slice(-6).map((e, i) => <div key={i}>turn {e.turn}: {e.text}</div>)
              ) : (
                <span className="muted">No lever fired. Switch one on.</span>
              )}
            </div>
          </div>

          <details style={{ marginTop: 10, fontSize: 12 }}>
            <summary style={{ cursor: "pointer" }}>Show the real code behind the levers (agentLevers.ts)</summary>
            <pre style={{ background: "#070a0f", border: "1px solid #2a3342", borderRadius: 8, padding: 10, maxHeight: 280, overflow: "auto", fontSize: 11, lineHeight: 1.5 }}>{leversSource}</pre>
          </details>

          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            This is a real agent loop: the message array, the cache accounting (the unchanged prefix of each prompt) and all four levers are real code. Only the model is scripted, so it runs offline. Token counts are estimates and prices are illustrative.
          </div>
        </div>
      </div>
    </div>
  );
}
