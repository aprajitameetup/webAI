# Runtime Demos (Transformers.js + TensorFlow.js) — Slice 3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two live runtime demos to the hub's Runtimes section — Transformers.js (sentiment analysis) and TensorFlow.js (MobileNet image classification) — each lazy-loaded so they don't bloat the initial bundle.

**Architecture:** Hub-only (`apps/hub`). Two self-contained demo components under `components/demos/runtimes/`, mounted after `ChatDemo` in `sections/Runtimes.tsx`. Each component dynamically `import()`s its heavy library inside the click handler. Transformers.js reuses the existing `/hf` dev proxy (via `env.remoteHost`) to dodge the HuggingFace Xet CDN CORS failure; TensorFlow.js classifies a user-uploaded image (no webcam, no cross-origin asset).

**Tech Stack:** React 18 · TypeScript · Vite · `@huggingface/transformers` · `@tensorflow/tfjs` · `@tensorflow-models/mobilenet`.

**Verification note:** Both demos wrap third-party runtimes that download models at runtime and depend on WebGPU/Wasm, so they are **verified manually in-browser**, not unit-tested (same category as WebLLM / Built-in AI).

**Spec:** `docs/specs/2026-06-12-runtime-demos-design.md`

---

## File structure (locked decomposition)

```
apps/hub/
├─ package.json                              MODIFIED: add 3 deps
└─ src/
   ├─ components/demos/runtimes/
   │  ├─ TransformersDemo.tsx                NEW: sentiment-analysis pipeline
   │  └─ TensorFlowDemo.tsx                  NEW: MobileNet image classify
   └─ sections/Runtimes.tsx                  MODIFIED: mount both demos after ChatDemo
```

---

### Task 1: Add dependencies

**Files:**
- Modify: `apps/hub/package.json`

- [ ] **Step 1: Add the three deps to `apps/hub/package.json` `dependencies`**

Add these entries (alongside the existing `react`, `@webai/core`, `@webai/react`):

```json
    "@huggingface/transformers": "^3.0.0",
    "@tensorflow/tfjs": "^4.22.0",
    "@tensorflow-models/mobilenet": "^2.1.1"
```

- [ ] **Step 2: Install**

Run: `pnpm install`
Expected: lockfile updates, the three packages resolve, no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/hub/package.json pnpm-lock.yaml
git commit -m "chore(hub): add Transformers.js + TensorFlow.js deps (Slice 3)"
```

---

### Task 2: Transformers.js sentiment-analysis demo

**Files:**
- Create: `apps/hub/src/components/demos/runtimes/TransformersDemo.tsx`

- [ ] **Step 1: Implement the demo**

```tsx
// apps/hub/src/components/demos/runtimes/TransformersDemo.tsx
import React, { useRef, useState } from "react";

type Phase = "idle" | "loading" | "running" | "ready" | "error";

export default function TransformersDemo() {
  const [input, setInput] = useState("Web AI running in the browser is incredible!");
  const [output, setOutput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const pipeRef = useRef<any>(null);

  async function run() {
    try {
      if (!pipeRef.current) {
        setPhase("loading");
        setOutput("Loading model…");
        const { pipeline, env } = await import("@huggingface/transformers");
        // No local models; in dev, route HF downloads through the /hf proxy to
        // dodge the Xet CDN cross-origin CORS failure (same fix as WebLLM).
        env.allowLocalModels = false;
        if (import.meta.env.DEV) {
          (env as any).remoteHost = `${location.origin}/hf`;
        }
        pipeRef.current = await pipeline("sentiment-analysis");
      }
      setPhase("running");
      setOutput("Analyzing…");
      const result = await pipeRef.current(input);
      const top = Array.isArray(result) ? result[0] : result;
      setOutput(`${top.label} — ${(top.score * 100).toFixed(1)}%`);
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
        <div className="title">🤗 Live: Transformers.js — sentiment analysis</div>
        <button className="btn" disabled={busy || !input.trim()} onClick={run}>
          {phase === "loading" ? "Loading model…" : "Analyze"}
        </button>
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "100%", padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3", marginBottom: 8 }}
      />
      <div className={"demo-out" + (phase === "error" ? " err" : "")}>
        {output || <span className="muted">Type a sentence and analyze its sentiment on-device.</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/src/components/demos/runtimes/TransformersDemo.tsx
git commit -m "feat(hub): Transformers.js sentiment-analysis demo (Slice 3)"
```

---

### Task 3: TensorFlow.js MobileNet image-classification demo

**Files:**
- Create: `apps/hub/src/components/demos/runtimes/TensorFlowDemo.tsx`

- [ ] **Step 1: Implement the demo**

> **VERIFY in browser:** MobileNet weights load from `storage.googleapis.com`. A cors-mode fetch that passes CORS satisfies `require-corp`, so this should work under our COEP page without a proxy. If it IS blocked, add a `/tfmodels` proxy to `vite.config.ts` (`target: "https://storage.googleapis.com", changeOrigin: true, followRedirects: true, rewrite: p => p.replace(/^\/tfmodels/, "")`) and pass `{ modelUrl: \`${location.origin}/tfmodels/tfjs-models/...\` }` to `mobilenet.load`.

```tsx
// apps/hub/src/components/demos/runtimes/TensorFlowDemo.tsx
import React, { useRef, useState } from "react";

type Phase = "idle" | "loading" | "running" | "ready" | "error";

export default function TensorFlowDemo() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const modelRef = useRef<any>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgUrl(URL.createObjectURL(file));
    setOutput("");
    setPhase("idle");
  }

  async function classify() {
    if (!imgRef.current) return;
    try {
      if (!modelRef.current) {
        setPhase("loading");
        setOutput("Loading MobileNet…");
        await import("@tensorflow/tfjs");
        const mobilenet = await import("@tensorflow-models/mobilenet");
        modelRef.current = await mobilenet.load();
      }
      setPhase("running");
      setOutput("Classifying…");
      const preds: Array<{ className: string; probability: number }> =
        await modelRef.current.classify(imgRef.current, 3);
      setOutput(
        preds.map((p) => `${p.className} — ${(p.probability * 100).toFixed(1)}%`).join("\n"),
      );
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
        <div className="title">📊 Live: TensorFlow.js — MobileNet image classify</div>
        <button className="btn" disabled={busy || !imgUrl} onClick={classify}>
          {phase === "loading" ? "Loading model…" : "Classify"}
        </button>
      </div>
      <input type="file" accept="image/*" onChange={onPick} style={{ marginBottom: 8, color: "#e6edf3" }} />
      {imgUrl && (
        <img
          ref={imgRef}
          src={imgUrl}
          alt="to classify"
          crossOrigin="anonymous"
          style={{ maxHeight: 160, borderRadius: 8, display: "block", marginBottom: 8 }}
        />
      )}
      <div className={"demo-out" + (phase === "error" ? " err" : "")}>
        {output || <span className="muted">Pick an image; MobileNet labels it on-device.</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/src/components/demos/runtimes/TensorFlowDemo.tsx
git commit -m "feat(hub): TensorFlow.js MobileNet image-classify demo (Slice 3)"
```

---

### Task 4: Mount both demos in the Runtimes section

**Files:**
- Modify: `apps/hub/src/sections/Runtimes.tsx`

- [ ] **Step 1: Add imports** at the top of `Runtimes.tsx` (after the existing `import ChatDemo from "../ChatDemo";`)

```tsx
import TransformersDemo from "../components/demos/runtimes/TransformersDemo";
import TensorFlowDemo from "../components/demos/runtimes/TensorFlowDemo";
```

- [ ] **Step 2: Mount them** after `<ChatDemo />` in the returned JSX

Replace:
```tsx
      <ChatDemo />
    </>
```
with:
```tsx
      <ChatDemo />
      <TransformersDemo />
      <TensorFlowDemo />
    </>
```

- [ ] **Step 3: Build to verify it compiles**

Run: `pnpm --filter @webai/hub build`
Expected: build succeeds, no TypeScript errors. (Bundle includes the new libs only in lazily-loaded chunks.)

- [ ] **Step 4: Manual verification in the browser**

Run: `pnpm --filter @webai/hub dev`, open the **Models & Runtimes** section.

- **Transformers.js:** type a sentence → Analyze → first run loads the model (watch Network → requests go to `localhost:3005/hf/...` with 200), then shows `POSITIVE`/`NEGATIVE` + score. Try a clearly negative sentence to confirm the label flips.
- **TensorFlow.js:** pick an image file → Classify → first run loads MobileNet, then shows top-3 labels with probabilities. (If model load fails with a CORS/COEP error, apply the `/tfmodels` proxy noted in Task 3.)
- Initial page load is unaffected (libs are in lazy chunks, not the main bundle).

- [ ] **Step 5: Commit**

```bash
git add apps/hub/src/sections/Runtimes.tsx
git commit -m "feat(hub): mount Transformers.js + TensorFlow.js demos in Runtimes (Slice 3)"
```

**✅ Slice 3 done:** the Runtimes section now has three live runtime demos — WebLLM (chat), Transformers.js (sentiment), and TensorFlow.js (image classification).

---

## Self-review notes

- **Spec coverage:** deps → Task 1; Transformers.js sentiment demo (lazy import + `/hf` proxy via `env.remoteHost`) → Task 2; TensorFlow.js MobileNet on uploaded image (lazy import, file picker) → Task 3; mount in Runtimes → Task 4; manual-verification testing approach → Task 4 Step 4.
- **Type consistency:** both components are default exports, imported as such in Task 4. Local `Phase` type is defined within each component (independent). No shared symbols to drift.
- **Known verification gaps (honest):** (1) Transformers.js model fetch relies on the `/hf` proxy in dev — same as WebLLM, already proven; (2) TensorFlow.js MobileNet weights from `storage.googleapis.com` under COEP — expected to pass (cors fetch), with the `/tfmodels` proxy as a documented fallback in Task 3.
- **Deferred (out of scope):** ONNX Runtime Web / MediaPipe demos; production model-download proxy; webcam-based TF.js demos; other Transformers.js tasks.
```
