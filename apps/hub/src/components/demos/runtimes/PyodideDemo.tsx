import React, { useRef, useState } from "react";

const PYODIDE_VERSION = "0.26.4";
// Same-origin proxied index URL (see /jsdelivr proxy in vite.config.ts).
const INDEX_URL = `${location.origin}/jsdelivr/pyodide/v${PYODIDE_VERSION}/full/`;

type Phase = "idle" | "loading" | "running" | "ready" | "error";

const EXAMPLES: Array<{ chip: string; code: string; pkg?: string }> = [
  {
    chip: "🐍 Stdlib",
    code:
      "import statistics\n" +
      "data = [4, 8, 15, 16, 23, 42]\n" +
      "print('mean:', statistics.mean(data))\n" +
      "print('stdev:', round(statistics.pstdev(data), 2))\n" +
      "sum(data)",
  },
  {
    chip: "🔢 NumPy",
    pkg: "numpy",
    code:
      "import numpy as np\n" +
      "a = np.arange(9).reshape(3, 3)\n" +
      "print(a)\n" +
      "print('sum =', a.sum())\n" +
      "float(a.mean())",
  },
];

export default function PyodideDemo() {
  const [code, setCode] = useState(EXAMPLES[0].code);
  const [output, setOutput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const pyRef = useRef<any>(null);
  const outRef = useRef("");

  async function ensurePyodide() {
    if (pyRef.current) return pyRef.current;
    setPhase("loading");
    setOutput("Loading Python runtime (~10 MB)…");
    if (!(window as any).loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = `${INDEX_URL}pyodide.js`;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("failed to load pyodide.js"));
        document.head.appendChild(s);
      });
    }
    pyRef.current = await (window as any).loadPyodide({
      indexURL: INDEX_URL,
      stdout: (s: string) => {
        outRef.current += s + "\n";
        setOutput(outRef.current);
      },
      stderr: (s: string) => {
        outRef.current += s + "\n";
        setOutput(outRef.current);
      },
    });
    return pyRef.current;
  }

  async function run(src: string, pkg?: string) {
    try {
      const py = await ensurePyodide();
      if (pkg) {
        setOutput(`Loading package: ${pkg}…`);
        await py.loadPackage(pkg);
      }
      setPhase("running");
      outRef.current = "";
      setOutput("");
      const result = await py.runPythonAsync(src);
      if (result !== undefined && result !== null) {
        outRef.current += `→ ${result}\n`;
        setOutput(outRef.current);
      }
      if (!outRef.current) setOutput("(no output)");
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
        <div className="title">🐍 Live: Pyodide — Python in the browser</div>
        <button className="btn" disabled={busy || !code.trim()} onClick={() => run(code)}>
          {phase === "loading" ? "Loading Python…" : "Run"}
        </button>
      </div>
      <div className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
        Runtime: <b>CPython compiled to WebAssembly</b> — real Python (and numpy/pandas/scikit-learn) on-device
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={6}
        spellCheck={false}
        style={{ width: "100%", padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3", marginBottom: 8, fontFamily: "monospace", fontSize: 13 }}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.chip}
            className="btn"
            disabled={busy}
            style={{ fontSize: 12, padding: "4px 10px", opacity: 0.9 }}
            onClick={() => {
              setCode(ex.code);
              run(ex.code, ex.pkg);
            }}
          >
            {ex.chip}
          </button>
        ))}
      </div>
      <div className={"demo-out" + (phase === "error" ? " err" : "")} style={{ whiteSpace: "pre-wrap" }}>
        {output || <span className="muted">Edit the Python above (or tap an example) and run it on-device.</span>}
      </div>
    </div>
  );
}
