# Runtime Demos (Transformers.js + TensorFlow.js) — Design

**Status:** Approved (2026-06-12)
**Scope:** Hub-only (`apps/hub`). No `@webai/core` / `@webai/react` changes.

## Goal

The Runtimes section currently advertises Transformers.js, TensorFlow.js, ONNX Runtime Web, and
MediaPipe as text, but only WebLLM has a live demo (`ChatDemo`). Add two live runtime demos —
**Transformers.js** and **TensorFlow.js** — so the section demonstrates the libraries it names,
reinforcing the talk's thesis ("you rarely touch WebGPU directly — you pick a runtime").

## What it contains

Two new demos mounted in the Runtimes section, after `ChatDemo`:

1. **Transformers.js — sentiment analysis.** `pipeline('sentiment-analysis')` over a text input →
   label (POSITIVE/NEGATIVE) + confidence. Text-only, fast, instantly graspable. The default
   model (`Xenova/distilbert-base-uncased-finetuned-sst-2-english`) is small (tens of MB).
2. **TensorFlow.js — image classification.** MobileNet classifies a **user-uploaded image**
   (file picker; no webcam, no bundled asset, no cross-origin image) → top-3 labels with
   probabilities.

## Key constraints learned from Slice 1

- **Transformers.js hits the same HuggingFace Xet CDN CORS failure** as WebLLM (it fetches ONNX
  weights from `huggingface.co`, which 302-redirects to the Xet CDN and fails the cross-origin
  CORS check under our COEP page). **Fix:** reuse the existing `/hf` Vite dev proxy by setting
  Transformers.js's `env.remoteHost` to `\`${location.origin}/hf\`` in dev. Production download
  is deferred (same edge-rewrite gap as WebLLM).
- **Bundle weight:** both libraries are large. **Both demos lazy-load their library via dynamic
  `import()` inside the click handler**, so nothing is added to the initial bundle — the lib only
  loads when the user runs that demo.

## Architecture / components

```
apps/hub/src/
└─ components/demos/runtimes/
   ├─ TransformersDemo.tsx   sentiment-analysis pipeline (lazy import @huggingface/transformers)
   └─ TensorFlowDemo.tsx     MobileNet image classify (lazy import @tensorflow/tfjs + mobilenet)
```
`sections/Runtimes.tsx` is MODIFIED to mount `<TransformersDemo/>` and `<TensorFlowDemo/>` after
`<ChatDemo/>`.

New dependencies in `apps/hub/package.json`:
- `@huggingface/transformers` (v3.x — current package, supports WebGPU/Wasm)
- `@tensorflow/tfjs`
- `@tensorflow-models/mobilenet`

### TransformersDemo.tsx
- State machine via local `useState`: `idle | loading | running | ready | error` + output.
- On first run: `const { pipeline, env } = await import("@huggingface/transformers")`; set
  `env.allowLocalModels = false` and, in dev, `env.remoteHost = \`${location.origin}/hf\``; create
  the pipeline once (cache in a ref); run it on the input text.
- Output: `{label} — {(score*100).toFixed(1)}%`.
- Errors (e.g. model fetch blocked) render in the `demo-out err` style.

### TensorFlowDemo.tsx
- File `<input type="file" accept="image/*">` → render the chosen image in an `<img>` (object URL).
- On classify: lazy-import `@tensorflow/tfjs` + `@tensorflow-models/mobilenet`, load MobileNet once
  (cache in a ref), call `model.classify(imgEl)`, render the top-3 `{className} — {prob}`.
- MobileNet weights load from `storage.googleapis.com`. **Verify under COEP:** a cors-mode fetch
  that passes CORS satisfies `require-corp`, so this is expected to work without a proxy — but if
  it is blocked, add a `/tfmodels` Vite proxy → `https://storage.googleapis.com` and point the
  loader at it (mirrors the `/hf` fix). Flagged as a verification step, not pre-built.

## Graceful degradation & errors

- Neither library needs special browser flags (unlike Built-in AI), so the demos are interactive
  by default. WebGPU is used when available; both libs fall back to Wasm otherwise.
- Any load/run failure (CORS, model fetch, unsupported input) is caught and shown in the output
  area with the `err` style; the page never crashes.
- TensorFlow demo's Classify button is disabled until an image is chosen.

## Testing

- No new unit tests: both demos are thin wrappers over third-party runtimes whose behavior is
  browser- and model-download-dependent (same category as WebLLM / Built-in AI). Verified
  **manually in-browser**. The pure logic in the hub is already covered.
- Each task ends with `pnpm --filter @webai/hub build` (compile check) and a manual checklist.

## Out of scope

- ONNX Runtime Web and MediaPipe demos (still text-only in the section).
- Production model-download proxy/edge rewrite (deferred, same as WebLLM).
- Webcam / streaming-video TF.js demos; embeddings/other Transformers.js tasks (one demo each).
