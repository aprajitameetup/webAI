# ONNX Runtime Web Demo (Slice 6) — Design

**Status:** Approved (2026-06-12)
**Scope:** Hub-only (`apps/hub`). No `@webai/core` / `@webai/react` changes.

## Goal

Add a live **ONNX Runtime Web** demo to the Runtimes section: the user **draws a digit** on a
canvas, and a small MNIST CNN (in ONNX format) classifies it on-device. This shows ORT Web directly
and interactively — distinct from Transformers.js, which already runs *on* ORT but hides it.

## What it contains

One new component mounted after `MediaPipeDemo` in the Runtimes section:
- A drawing canvas (white stroke on black, the MNIST convention), a **Clear** button, and a
  **Predict** button.
- On Predict: preprocess the canvas to a 28×28 grayscale tensor, run the MNIST ONNX model via ORT
  Web, and show the predicted digit + confidence (softmax over the 10 logits).

## Model & library

- **Model:** the classic MNIST ONNX model (~26 KB) is **committed into `apps/hub/public/models/`**
  and loaded **same-origin** (`/models/mnist-8.onnx`). Bundling it avoids CORS, the COEP wall, and
  git-LFS/CDN path fragility. Input/output tensor names are read from the session at runtime
  (`session.inputNames` / `session.outputNames`) rather than hard-coded.
- **Library:** `onnxruntime-web` (npm), **lazy-imported** on first Predict. Its wasm runtime loads
  via `ort.env.wasm.wasmPaths` pointed at the jsdelivr copy **through the existing `/jsdelivr`
  proxy** (same-origin, COEP-safe; version pinned to match the npm dep). Cross-origin isolation
  (already set) enables threaded/SIMD wasm.

## Architecture

```
apps/hub/
├─ package.json                                MODIFIED: add onnxruntime-web
├─ public/models/mnist-8.onnx                  NEW: committed model asset
└─ src/
   ├─ components/demos/runtimes/OnnxMnistDemo.tsx  NEW
   └─ sections/Runtimes.tsx                          MODIFIED: mount <OnnxMnistDemo/>
```

### OnnxMnistDemo.tsx
- A 280×280 canvas with pointer-event drawing (black background, white round stroke ~18 px).
- `clear()`: repaint the canvas black.
- `ensureSession()` (cached): set `ort.env.wasm.wasmPaths` to the proxied dist dir; lazy-import
  `onnxruntime-web`; `InferenceSession.create("/models/mnist-8.onnx")`.
- `predict()`:
  1. Downscale the 280×280 canvas to a 28×28 offscreen canvas, read pixels, take one channel as
     grayscale, normalize to 0..1 into a `Float32Array(784)`.
  2. Build `new ort.Tensor("float32", data, [1, 1, 28, 28])`, feed under the session's input name.
  3. Read the 10 output logits, softmax → argmax = predicted digit + confidence.
- Output: `Predicted: 7 · 98.2% confident`. Errors caught and shown in `demo-out err`.

## Versions

Pin `onnxruntime-web` to a single version constant used for both the npm dep and the `wasmPaths`
CDN path (they must match), so a bump happens in one place.

## Testing

No unit tests — wraps a third-party WASM runtime with a model asset (same category as the other
runtime demos). Verified **manually in-browser**. The implementation task verifies the committed
model file is a real binary (tens of KB), not a git-LFS pointer. Each task ends with
`pnpm --filter @webai/hub build` + a manual checklist.

## Out of scope

- Other ONNX models / tasks (MNIST only).
- Production wasm-download proxy/edge rewrite (deferred, same as other runtimes).
- This is the final runtime demo; ONNX Runtime Web, MediaPipe, and Pyodide complete the
  "rest worth naming" set from the Runtimes section.
