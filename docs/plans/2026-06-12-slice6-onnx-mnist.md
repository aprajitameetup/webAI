# ONNX Runtime Web (MNIST) Demo — Slice 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live ONNX Runtime Web demo to the hub's Runtimes section — draw a digit on a canvas, an MNIST CNN classifies it on-device.

**Architecture:** Hub-only. The MNIST `.onnx` model is committed under `public/models/` and loaded same-origin. An `OnnxMnistDemo` component lazy-imports `onnxruntime-web`, points `ort.env.wasm.wasmPaths` at the jsdelivr copy via the existing `/jsdelivr` proxy, preprocesses the canvas to a 28×28 tensor, runs inference, and shows the predicted digit + confidence. Mounted after `MediaPipeDemo` in `Runtimes.tsx`.

**Tech Stack:** React 18 · TypeScript · Vite · `onnxruntime-web`.

**Verification note:** Wraps a third-party WASM runtime + model asset, so it is **verified manually in-browser**, not unit-tested.

**Spec:** `docs/specs/2026-06-12-onnx-mnist-demo-design.md`

---

### Task 1: Add dependency (model already committed)

> The MNIST model is already fetched to `apps/hub/public/models/mnist-8.onnx` (~26 KB, verified a real binary). This task just adds the ORT Web library.

**Files:**
- Modify: `apps/hub/package.json`

- [ ] **Step 1: Add to `dependencies`**

```json
    "onnxruntime-web": "1.20.1"
```

- [ ] **Step 2: Install**

Run: `pnpm install`
Expected: resolves; if pnpm reports ignored build scripts, add them to `pnpm-workspace.yaml` `allowBuilds` with `false` (same pattern as Slice 3).

- [ ] **Step 3: Commit** (include the model asset)

```bash
git add apps/hub/package.json pnpm-lock.yaml pnpm-workspace.yaml apps/hub/public/models/mnist-8.onnx
git commit -m "chore(hub): add onnxruntime-web dep + MNIST model asset (Slice 6)"
```

---

### Task 2: OnnxMnistDemo component

**Files:**
- Create: `apps/hub/src/components/demos/runtimes/OnnxMnistDemo.tsx`

- [ ] **Step 1: Implement the demo**

```tsx
// apps/hub/src/components/demos/runtimes/OnnxMnistDemo.tsx
import React, { useEffect, useRef, useState } from "react";

const ORT_VERSION = "1.20.1";
const WASM_PATHS = `${location.origin}/jsdelivr/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
const MODEL_URL = "/models/mnist-8.onnx";
const SIZE = 280;

type Phase = "idle" | "loading" | "running" | "ready" | "error";

function softmax(logits: Float32Array): number[] {
  const max = Math.max(...logits);
  const exps = Array.from(logits, (v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

export default function OnnxMnistDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [output, setOutput] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<any>(null);
  const ortRef = useRef<any>(null);
  const drawing = useRef(false);

  function clear() {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);
    setOutput("");
    setPhase("idle");
  }

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE };
  }
  function down(e: React.PointerEvent) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function up() {
    drawing.current = false;
  }

  async function ensureSession() {
    if (sessionRef.current) return sessionRef.current;
    setPhase("loading");
    setOutput("Loading ONNX Runtime…");
    const ort = await import("onnxruntime-web");
    ort.env.wasm.wasmPaths = WASM_PATHS;
    ortRef.current = ort;
    sessionRef.current = await ort.InferenceSession.create(MODEL_URL);
    return sessionRef.current;
  }

  function to28x28(): Float32Array {
    const small = document.createElement("canvas");
    small.width = 28;
    small.height = 28;
    const sctx = small.getContext("2d")!;
    sctx.drawImage(canvasRef.current!, 0, 0, 28, 28);
    const { data } = sctx.getImageData(0, 0, 28, 28);
    const out = new Float32Array(28 * 28);
    for (let i = 0; i < 28 * 28; i++) {
      out[i] = data[i * 4] / 255; // red channel; white stroke on black → ~1 for ink
    }
    return out;
  }

  async function predict() {
    try {
      const session = await ensureSession();
      const ort = ortRef.current;
      setPhase("running");
      const input = to28x28();
      const tensor = new ort.Tensor("float32", input, [1, 1, 28, 28]);
      const feeds: Record<string, any> = { [session.inputNames[0]]: tensor };
      const results = await session.run(feeds);
      const logits = results[session.outputNames[0]].data as Float32Array;
      const probs = softmax(logits);
      let best = 0;
      for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i;
      setOutput(`Predicted: ${best} · ${(probs[best] * 100).toFixed(1)}% confident`);
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
        <div className="title">✍️ Live: ONNX Runtime Web — draw a digit (MNIST)</div>
        <button className="btn" disabled={busy} onClick={predict}>
          {phase === "loading" ? "Loading…" : "Predict"}
        </button>
      </div>
      <div className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
        Runtime: <b>ONNX Runtime Web</b> · a small MNIST CNN (the engine under Transformers.js, used directly here)
      </div>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        style={{ width: 200, height: 200, borderRadius: 8, border: "1px solid #2a3342", touchAction: "none", cursor: "crosshair", display: "block", marginBottom: 8 }}
      />
      <div style={{ marginBottom: 8 }}>
        <button className="btn" disabled={busy} style={{ fontSize: 12, padding: "4px 10px", opacity: 0.9 }} onClick={clear}>
          Clear
        </button>
      </div>
      <div className={"demo-out" + (phase === "error" ? " err" : "")}>
        {output || <span className="muted">Draw a single digit (0–9) above, then Predict.</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/src/components/demos/runtimes/OnnxMnistDemo.tsx
git commit -m "feat(hub): ONNX Runtime Web draw-a-digit MNIST demo (Slice 6)"
```

---

### Task 3: Mount in the Runtimes section

**Files:**
- Modify: `apps/hub/src/sections/Runtimes.tsx`

- [ ] **Step 1: Add the import** (after `import MediaPipeDemo ...`)

```tsx
import OnnxMnistDemo from "../components/demos/runtimes/OnnxMnistDemo";
```

- [ ] **Step 2: Mount it** after `<MediaPipeDemo />`

Replace:
```tsx
      <MediaPipeDemo />
    </>
```
with:
```tsx
      <MediaPipeDemo />
      <OnnxMnistDemo />
    </>
```

- [ ] **Step 3: Build to verify it compiles**

Run: `pnpm --filter @webai/hub build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 4: Manual verification in the browser**

Run: `pnpm --filter @webai/hub dev`, open **Models & Runtimes** → the MNIST demo (bottom).
- Draw a clear digit (e.g. 3) → **Predict** → first run loads ORT wasm (Network → `localhost:3005/jsdelivr/npm/onnxruntime-web@.../dist/...`, 200) and the model (`/models/mnist-8.onnx`, 200), then shows e.g. "Predicted: 3 · 97.5% confident".
- **Clear** → draw another digit → Predict. Try a few digits.
- Draw big and centered for best accuracy (MNIST digits are centered).
- If wasm fails to load with a CORS/COEP error, confirm the `/jsdelivr` proxy exists and the dev server is running.

- [ ] **Step 5: Commit**

```bash
git add apps/hub/src/sections/Runtimes.tsx
git commit -m "feat(hub): mount ONNX MNIST demo in Runtimes (Slice 6)"
```

**✅ Slice 6 done:** the Runtimes section now has six live runtimes — WebLLM, Transformers.js, TensorFlow.js, Pyodide, MediaPipe, and ONNX Runtime Web — covering every library the section names.

---

## Self-review notes

- **Spec coverage:** dep + committed model → Task 1; OnnxMnistDemo (canvas drawing, lazy ORT import, proxied wasmPaths, same-origin model, 28×28 preprocess, softmax/argmax) → Task 2; mount → Task 3; manual testing → Task 3 Step 4.
- **Type consistency:** `OnnxMnistDemo` default export imported as such in Task 3. `ORT_VERSION` used for both the npm dep (Task 1) and `wasmPaths` (Task 2) — keep equal on a bump. Input/output names read from `session.inputNames/outputNames` (not hard-coded). `Phase` local.
- **Known verification gaps (honest):** ORT wasm loads through `/jsdelivr` under COEP — flagged with the proxy as the fix; the committed `mnist-8.onnx` was verified as a 26 KB real binary during prep; tensor shape `[1,1,28,28]` + grayscale-from-red-channel preprocessing matches the standard MNIST ONNX model and is confirmed at run time by a correct prediction.
- **Deferred:** other ONNX models/tasks; production wasm-download proxy. This completes the runtime-demo set.
```
