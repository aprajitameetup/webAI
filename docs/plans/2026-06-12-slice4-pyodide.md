# Pyodide Demo — Slice 4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live Pyodide demo to the hub's Runtimes section — run real Python (CPython/WASM) in the browser and show its output — loaded lazily through a `/jsdelivr` dev proxy.

**Architecture:** Hub-only. A new `PyodideDemo` component loads Pyodide's CDN loader at runtime (no npm dep) via a same-origin `/jsdelivr` Vite proxy to avoid the COEP/CORS wall, runs Python with `runPythonAsync`, and renders captured stdout + the last expression value. Mounted after `TensorFlowDemo` in `Runtimes.tsx`.

**Tech Stack:** React 18 · TypeScript · Vite · Pyodide (CDN, v0.26.4).

**Verification note:** Pyodide downloads its runtime at runtime and runs WASM, so the demo is **verified manually in-browser**, not unit-tested.

**Spec:** `docs/specs/2026-06-12-pyodide-demo-design.md`

---

### Task 1: Add the `/jsdelivr` dev proxy

**Files:**
- Modify: `apps/hub/vite.config.ts`

- [ ] **Step 1: Add a `/jsdelivr` entry to `server.proxy`** (alongside the existing `/hf` entry)

```ts
      // Pyodide (and other CDN assets) load from jsdelivr; route through a same-origin
      // proxy so they aren't blocked by our cross-origin-isolated (COEP) page.
      "/jsdelivr": {
        target: "https://cdn.jsdelivr.net",
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/jsdelivr/, ""),
      },
```

- [ ] **Step 2: Restart dev server picks up the config** (Vite auto-restarts on `vite.config.ts` change). Verify it still serves:

Run: `pnpm --filter @webai/hub dev`
Expected: server starts on :3005, no config errors.

- [ ] **Step 3: Commit**

```bash
git add apps/hub/vite.config.ts
git commit -m "chore(hub): add /jsdelivr dev proxy for Pyodide CDN assets (Slice 4)"
```

---

### Task 2: PyodideDemo component

**Files:**
- Create: `apps/hub/src/components/demos/runtimes/PyodideDemo.tsx`

- [ ] **Step 1: Implement the demo**

```tsx
// apps/hub/src/components/demos/runtimes/PyodideDemo.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/src/components/demos/runtimes/PyodideDemo.tsx
git commit -m "feat(hub): Pyodide 'Python in the browser' demo (Slice 4)"
```

---

### Task 3: Mount in the Runtimes section

**Files:**
- Modify: `apps/hub/src/sections/Runtimes.tsx`

- [ ] **Step 1: Add the import** (after the existing `import TensorFlowDemo ...` line)

```tsx
import PyodideDemo from "../components/demos/runtimes/PyodideDemo";
```

- [ ] **Step 2: Mount it** after `<TensorFlowDemo />`

Replace:
```tsx
      <TensorFlowDemo />
    </>
```
with:
```tsx
      <TensorFlowDemo />
      <PyodideDemo />
    </>
```

- [ ] **Step 3: Build to verify it compiles**

Run: `pnpm --filter @webai/hub build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 4: Manual verification in the browser**

Run: `pnpm --filter @webai/hub dev`, open **Models & Runtimes** → Pyodide demo.
- Click **Run** (or **🐍 Stdlib**) → first run loads Python (~10 MB via `localhost:3005/jsdelivr/...`, watch Network → 200s), then prints `mean:`/`stdev:` and `→ 108`.
- Click **🔢 NumPy** → loads the numpy package, prints the 3×3 array and `→ 4.0`.
- Edit the code (e.g. `print(2**100)`) → Run → shows the big integer (Python bignums!).
- If asset loading fails with a CORS/COEP error, confirm the `/jsdelivr` proxy is in `vite.config.ts` and the dev server restarted.

- [ ] **Step 5: Commit**

```bash
git add apps/hub/src/sections/Runtimes.tsx
git commit -m "feat(hub): mount Pyodide demo in Runtimes (Slice 4)"
```

**✅ Slice 4 done:** the Runtimes section now also runs real Python in the browser via Pyodide.

---

## Self-review notes

- **Spec coverage:** `/jsdelivr` proxy → Task 1; PyodideDemo (lazy CDN load, stdout capture, stdlib + numpy examples, error handling) → Task 2; mount → Task 3; manual testing → Task 3 Step 4.
- **Type consistency:** `PyodideDemo` is a default export, imported as such in Task 3. `Phase` type is local. `INDEX_URL`/`PYODIDE_VERSION` defined once in Task 2.
- **Known verification gaps (honest):** Pyodide asset loading relies on the `/jsdelivr` proxy under our COEP page — flagged with the proxy as the fix; `loadPyodide` global + `runPythonAsync`/`loadPackage` shapes are stable Pyodide API but confirmed at run time.
- **Deferred:** ONNX Runtime Web (MNIST) and MediaPipe demos are the next two slices; production CDN proxy/edge rewrite deferred.
```
