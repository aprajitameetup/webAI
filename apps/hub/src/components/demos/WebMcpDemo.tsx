import React, { useEffect, useMemo, useRef, useState } from "react";
import { installModelContext, RegisteredTool } from "../../lib/webmcp";
import { TASK, TASK_ANSWER, nearest } from "../../lib/incidents";
import type { Incident } from "../../lib/incidents";
import { incidentTool } from "../../lib/incidentTools";
import { highestSeverityOpen, scrapeIncidents } from "../../lib/scrape";
import { estimateTokens } from "../../lib/tokenLab";
import IncidentPage, { Layout } from "./IncidentPage";
import scrapeSource from "../../lib/scrape.ts?raw";
import toolSource from "../../lib/incidentTools.ts?raw";

type Outcome = { tokens?: number; line: string; ok: boolean };
type Step = { kind: "call" | "error" | "ok" | "fail"; text: string };

const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, marginBottom: 6 };
const card: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 10, padding: 12, background: "var(--surface)" };
const fmt = (n: number) => n.toLocaleString("en-IN");

const RUN_LABEL: Record<string, string> = { "": "Tool as registered", F: "+ filter on the page", C: "+ compact fields", FC: "+ filter and compact" };
const ORDER = ["", "F", "C", "FC"];
const STEP_COLOR: Record<Step["kind"], string> = { call: "var(--accent2)", error: "var(--accent3)", ok: "var(--accent)", fail: "var(--accent3)" };

export default function WebMcpDemo() {
  const { ctx, source } = useMemo(() => installModelContext(document as unknown as { modelContext?: unknown }), []);
  const pageRef = useRef<HTMLDivElement>(null);

  const [layout, setLayout] = useState<Layout>("original");
  const [filter, setFilter] = useState(false);
  const [compact, setCompact] = useState(false);
  const [richErrors, setRichErrors] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [tools, setTools] = useState<RegisteredTool[]>([]);
  const [runs, setRuns] = useState<Record<string, Outcome>>({});
  const [last, setLast] = useState<{ scrape?: Outcome; mcp?: Outcome }>({});

  // The page registers its tool, and registers it again when the design changes.
  useEffect(() => {
    let stale = false;
    const refresh = () => ctx.getTools().then((t) => !stale && setTools(t));
    const ac = new AbortController();
    ctx.addEventListener("toolchange", refresh);
    ctx.registerTool(incidentTool({ filter, compact, richErrors }), { signal: ac.signal });
    refresh();
    return () => {
      stale = true;
      ac.abort();
      ctx.removeEventListener("toolchange", refresh);
    };
  }, [ctx, filter, compact, richErrors]);

  const record = (key: string, o: Outcome) => setRuns((r) => ({ ...r, [key]: o }));

  const runScrape = () => {
    const html = pageRef.current?.outerHTML ?? "";
    const rows = scrapeIncidents(html);
    const hit = highestSeverityOpen(rows, "billing");
    const out: Outcome =
      rows.length === 0
        ? { ok: false, line: 'Found 0 incidents: the selector "tr.row" matches nothing on this page.' }
        : { ok: !!hit, line: hit ? `${hit.title} (P${hit.severity})` : "No match" };
    setLast((l) => ({ ...l, scrape: out }));
  };

  const runMcp = async () => {
    const tool = (await ctx.getTools()).find((t) => t.name === "get_incidents");
    if (!tool) return;
    const props = (tool.inputSchema as { properties?: Record<string, unknown> }).properties ?? {};
    const args: Record<string, unknown> = {};
    if ("service" in props) args.service = "billing";
    if ("status" in props) args.status = "open";
    if ("sortBy" in props) args.sortBy = "severity";
    if ("limit" in props) args.limit = 1;
    const raw = await ctx.executeTool(tool, args);
    const rows = JSON.parse(raw) as Incident[];
    // the caller only filters locally for what the tool could not filter for it
    const pool = "service" in props ? rows : rows.filter((r) => r.service === "billing" && r.status === "open").sort((a, b) => a.severity - b.severity);
    const best = pool[0];
    const out: Outcome = { tokens: estimateTokens(raw), ok: best?.id === TASK_ANSWER, line: best ? `${best.title} (P${best.severity})` : "No match" };
    setLast((l) => ({ ...l, mcp: out }));
    record(`${filter ? "F" : ""}${compact ? "C" : ""}`, out);
  };

  const runTypo = async () => {
    const tool = (await ctx.getTools()).find((t) => t.name === "get_incidents");
    if (!tool) return;
    const out: Step[] = [];
    const base = { status: "open", sortBy: "severity", limit: 1 };
    const attempt = async (service: string) => {
      const args = { service, ...base };
      out.push({ kind: "call", text: `get_incidents(${JSON.stringify(args)})` });
      try {
        return JSON.parse(await ctx.executeTool(tool, args)) as Incident[];
      } catch (e) {
        out.push({ kind: "error", text: (e as Error).message });
        return (e as Error).message;
      }
    };
    let res = await attempt("biling");
    if (typeof res === "string") {
      let valid: string[] | undefined;
      try {
        valid = JSON.parse(res).validValues;
      } catch {
        /* a bare code carries nothing to act on */
      }
      if (valid) {
        const fixed = nearest("biling", valid);
        out.push({ kind: "ok", text: `The error lists the valid values, so retry with "${fixed}".` });
        res = await attempt(fixed);
      } else {
        out.push({ kind: "fail", text: "The error is a bare code. There is nothing to retry with." });
      }
    }
    if (Array.isArray(res)) out.push({ kind: res[0]?.id === TASK_ANSWER ? "ok" : "fail", text: res[0] ? `Answer: ${res[0].title} (P${res[0].severity})` : "No match" });
    setSteps(out);
  };

  const max = Math.max(1, ...ORDER.map((k) => runs[k]?.tokens ?? 0));

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🧰 Live: scraping, registerTool, then tuning the tool</div>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>
          document.modelContext: <b style={{ color: "var(--accent2)" }}>{source === "native" ? "native" : "stand-in"}</b>
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
        <div style={{ fontSize: 13 }}><b>Task:</b> {TASK}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--muted)" }}>Page layout</span>
          <button className={layout === "original" ? "btn" : "btn ghost"} onClick={() => setLayout("original")}>Original</button>
          <button className={layout === "redesigned" ? "btn" : "btn ghost"} onClick={() => setLayout("redesigned")}>Redesigned</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        <div>
          <div style={label}>The page</div>
          <IncidentPage ref={pageRef} layout={layout} />
        </div>

        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <div style={card}>
            <div style={label}>1. Scraping: read the HTML, find values with selectors</div>
            <button className="btn" onClick={runScrape}>Run scraper</button>
            {last.scrape && <Result o={last.scrape} />}
            <details style={{ marginTop: 8, fontSize: 12 }}>
              <summary style={{ cursor: "pointer" }}>Show the scraper (scrape.ts)</summary>
              <pre className="demo-out" style={{ maxHeight: 260, marginTop: 6 }}>{scrapeSource}</pre>
            </details>
          </div>

          <div style={card}>
            <div style={label}>2. WebMCP: the page registers a tool, the caller reads its schema</div>
            <div className="demo-out" style={{ maxHeight: 120, marginBottom: 8 }}>
              {tools.length === 0 && <span className="muted">[]</span>}
              {tools.map((t) => (
                <div key={t.name}>
                  <b>{t.name}</b> {t.annotations.readOnlyHint && <span style={{ fontSize: 10, border: "1px solid var(--border)", borderRadius: 8, padding: "0 6px" }}>read-only</span>}
                  <div className="muted">{t.description}</div>
                  <div className="muted">{JSON.stringify(t.inputSchema)}</div>
                </div>
              ))}
            </div>
            <button className="btn" onClick={runMcp}>Call the tool</button>
            {last.mcp && <Result o={last.mcp} />}
            <details style={{ marginTop: 8, fontSize: 12 }}>
              <summary style={{ cursor: "pointer" }}>Show the registered tool (incidentTools.ts)</summary>
              <pre className="demo-out" style={{ maxHeight: 260, marginTop: 6 }}>{toolSource}</pre>
            </details>
          </div>

          <div style={card}>
            <div style={label}>3. Optimise the tool, then call it again</div>
            <label style={{ display: "flex", gap: 8, fontSize: 12, marginBottom: 6, cursor: "pointer" }}>
              <input type="checkbox" checked={filter} onChange={(e) => setFilter(e.target.checked)} style={{ marginTop: 3 }} />
              <span><b>Filter on the page</b><br /><span style={{ color: "var(--muted)" }}>service, status, sort and limit become parameters, so the caller gets one row, not the table</span></span>
            </label>
            <label style={{ display: "flex", gap: 8, fontSize: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} style={{ marginTop: 3 }} />
              <span><b>Return only what the caller needs</b><br /><span style={{ color: "var(--muted)" }}>id, title, service, severity, status. No description, owner, runbook or timeline</span></span>
            </label>
          </div>

          <div style={card}>
            <div style={label}>4. When the call is wrong</div>
            <label style={{ display: "flex", gap: 8, fontSize: 12, marginBottom: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={richErrors} onChange={(e) => setRichErrors(e.target.checked)} style={{ marginTop: 3 }} />
              <span><b>Errors the caller can act on</b><br /><span style={{ color: "var(--muted)" }}>say what was wrong and which values are valid, not just a code</span></span>
            </label>
            <button className="btn" onClick={runTypo} disabled={!filter} title={filter ? "" : "Needs the filter option, which adds the service parameter"}>Call with a typo ("biling")</button>
            {!filter && <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>Tick "Filter on the page" first</span>}
            {steps.length > 0 && (
              <div className="demo-out" style={{ marginTop: 8, maxHeight: 180 }}>
                {steps.map((st, i) => (
                  <div key={i} style={{ color: STEP_COLOR[st.kind] }}>{st.text}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={label}>Size of the tool response as the tool is tuned (estimated tokens, about 4 characters each)</div>
        <div style={{ display: "grid", gap: 6 }}>
          {ORDER.map((k) => {
            const r = runs[k];
            return (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "150px 1fr 70px", gap: 8, alignItems: "center", fontSize: 12, opacity: r ? 1 : 0.4 }}>
                <span>{RUN_LABEL[k]}</span>
                <div style={{ background: "var(--surface)", borderRadius: 4, height: 14 }}>
                  <div style={{ width: r ? `${Math.max(2, ((r.tokens ?? 0) / max) * 100)}%` : 0, height: "100%", borderRadius: 4, background: r?.ok === false ? "var(--accent3)" : "var(--accent)" }} />
                </div>
                <span style={{ fontFamily: "monospace", textAlign: "right" }}>{r ? fmt(r.tokens ?? 0) : "not run"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Result({ o }: { o: Outcome }) {
  return (
    <div className="demo-out" style={{ marginTop: 8, maxHeight: 110 }}>
      <div className={o.ok ? "" : "err"}>{o.ok ? "Answer: " : "Failed: "}{o.line}</div>
      {o.tokens !== undefined && <div className="muted">Read about {fmt(o.tokens)} tokens</div>}
    </div>
  );
}
