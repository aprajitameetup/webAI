import React, { useState } from "react";
import BeforePage from "../components/demos/review/BeforePage";
import AfterPage from "../components/demos/review/AfterPage";
import type { LabMode } from "../lib/reviewLab";

type Version = "before" | "after";
type Width = "desktop" | "phone";

const KIT: { title: string; hint: string; code: string }[] = [
  { title: "Accessibility", hint: "axe, on the standalone page", code: `npx @axe-core/cli "http://localhost:3005/?lab=before"` },
  { title: "Performance", hint: "Lighthouse, same page", code: `npx lighthouse "http://localhost:3005/?lab=before" --only-categories=performance,accessibility --view` },
  { title: "Same checks, second page", hint: "swap before for after", code: `npx @axe-core/cli "http://localhost:3005/?lab=after"` },
];

const SECTION_TOOLTIP = "Standalone pages open without the hub around them, so the tools measure only the page.";

export default function ReviewLab() {
  const [version, setVersion] = useState<Version>("before");
  const [mode, setMode] = useState<LabMode>("normal");
  const [width, setWidth] = useState<Width>("desktop");
  const [copied, setCopied] = useState<number | null>(null);

  const copy = async (i: number) => {
    try {
      await navigator.clipboard.writeText(KIT[i].code);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500);
    } catch {
      /* clipboard can be blocked */
    }
  };

  const Page = version === "before" ? BeforePage : AfterPage;

  return (
    <>
      <div className="eyebrow">Live demo · Code review</div>
      <h1>AI wrote your frontend. Now review it.</h1>
      <p className="lead">
        A support-desk page, written by a model from one prompt. It loads, it filters, it looks finished. Review it the way you would review a pull request.
      </p>

      <div className="demo">
        <div className="demo-head">
          <div className="title">🔍 Live: the support desk</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, flexWrap: "wrap" }}>
            <span style={{ color: "var(--muted)" }}>Page</span>
            <button className={version === "before" ? "btn" : "btn ghost"} onClick={() => setVersion("before")}>Generated</button>
            <button className={version === "after" ? "btn" : "btn ghost"} onClick={() => setVersion("after")}>Reviewed</button>
            <span style={{ color: "var(--muted)", marginLeft: 8 }}>Network</span>
            <button className={mode === "normal" ? "btn" : "btn ghost"} onClick={() => setMode("normal")}>Normal</button>
            <button className={mode === "fail" ? "btn" : "btn ghost"} onClick={() => setMode("fail")}>Fails</button>
            <button className={mode === "empty" ? "btn" : "btn ghost"} onClick={() => setMode("empty")}>Empty</button>
            <span style={{ color: "var(--muted)", marginLeft: 8 }}>Screen</span>
            <button className={width === "desktop" ? "btn" : "btn ghost"} onClick={() => setWidth("desktop")}>Desktop</button>
            <button className={width === "phone" ? "btn" : "btn ghost"} onClick={() => setWidth("phone")}>Phone</button>
          </div>
        </div>

        <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ background: "var(--surface)", padding: "6px 10px", fontSize: 12, color: "var(--muted)", borderBottom: "1px solid var(--border)", fontFamily: "monospace", display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <span>https://support.example/tickets</span>
            <span title={SECTION_TOOLTIP}>
              <a href={`?lab=${version}${mode === "normal" ? "" : "&mode=" + mode}`} target="_blank" rel="noreferrer">
                Open standalone
              </a>
            </span>
          </div>
          <div style={{ height: 560, overflow: "auto", background: "#0b1020" }}>
            <div style={{ width: width === "phone" ? 375 : "100%", margin: "0 auto", borderInline: width === "phone" ? "1px solid var(--border)" : 0, minHeight: "100%" }}>
              <Page key={`${version}-${mode}`} mode={mode} />
            </div>
          </div>
        </div>
      </div>

      <h2>Evidence kit</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {KIT.map((k, i) => (
          <div key={k.title} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10, background: "var(--surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12 }}>
                <b>{k.title}</b> <span style={{ color: "var(--muted)" }}>· {k.hint}</span>
              </span>
              <button className="btn ghost" style={{ padding: "3px 10px", fontSize: 12 }} onClick={() => copy(i)}>
                {copied === i ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="demo-out" style={{ margin: 0, fontSize: 11 }}>{k.code}</pre>
          </div>
        ))}
      </div>

      <h2>Run of show</h2>
      <div className="stacklayer"><div className="num">1</div><div className="ltext"><b>Look</b> &nbsp;<span>the generated page, as a user would see it</span></div></div>
      <div className="stacklayer"><div className="num">2</div><div className="ltext"><b>Keyboard</b> &nbsp;<span>unplug the mouse and use the page</span></div></div>
      <div className="stacklayer"><div className="num">3</div><div className="ltext"><b>Measure</b> &nbsp;<span>run the checks, read the numbers</span></div></div>
      <div className="stacklayer"><div className="num">4</div><div className="ltext"><b>Stress it</b> &nbsp;<span>slow network, failure, empty data, a phone-width screen</span></div></div>
      <div className="stacklayer"><div className="num">5</div><div className="ltext"><b>Read the code</b> &nbsp;<span><code>BeforePage.tsx</code>, line by line</span></div></div>
      <div className="stacklayer"><div className="num">6</div><div className="ltext"><b>Compare</b> &nbsp;<span>switch to Reviewed and repeat the same checks</span></div></div>
    </>
  );
}
