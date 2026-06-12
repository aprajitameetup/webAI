# MediaPipe Demo (Slice 5) — Design

**Status:** Approved (2026-06-12)
**Scope:** Hub-only (`apps/hub`). No `@webai/core` / `@webai/react` changes.

## Goal

Add a live **MediaPipe** demo to the Runtimes section: detect **face landmarks** on a user-uploaded
photo and draw the 468-point face mesh on a canvas. Showcases Google's MediaPipe Tasks vision
runtime — a different flavor from the chat LLMs / classifiers already demoed.

## What it contains

One new component mounted after `PyodideDemo` in the Runtimes section:
- A file picker → the chosen image is drawn onto a `<canvas>`.
- **Detect faces** button → runs MediaPipe `FaceLandmarker` (IMAGE mode), redraws the image, and
  overlays the face-mesh tesselation + face-oval using MediaPipe's `DrawingUtils`.
- Output text: number of faces detected (each with 468 landmarks).

## Library & asset loading

- **npm dep:** `@mediapipe/tasks-vision` (the JS API: `FilesetResolver`, `FaceLandmarker`,
  `DrawingUtils`). Lazy-imported on first Detect so it isn't in the initial bundle.
- **WASM fileset:** loaded at runtime via `FilesetResolver.forVisionTasks(<wasm dir>)`, pointed at
  the jsdelivr copy **through the existing `/jsdelivr` proxy** so it's same-origin (COEP-safe). The
  wasm version must match the installed npm version.
- **Model (`.task`):** `face_landmarker.task` from `storage.googleapis.com/mediapipe-models/...`,
  routed through a **new `/gstorage` Vite proxy** (→ `https://storage.googleapis.com`).
- Both proxies make every asset request same-origin, avoiding the cross-origin CORS/CORP block our
  COEP page would otherwise impose. Production download is deferred (same as the other runtimes).

## Architecture

```
apps/hub/
├─ package.json                                MODIFIED: add @mediapipe/tasks-vision
├─ vite.config.ts                              MODIFIED: add /gstorage proxy
└─ src/
   ├─ components/demos/runtimes/MediaPipeDemo.tsx  NEW
   └─ sections/Runtimes.tsx                          MODIFIED: mount <MediaPipeDemo/>
```

### MediaPipeDemo.tsx
- State: `phase = idle|loading|running|ready|error`, `output`, `hasImage`.
- Refs: the loaded `HTMLImageElement`, the `<canvas>`, and the cached `FaceLandmarker`.
- On file pick: load the image, draw it to the canvas at its natural size, reset state.
- `ensureLandmarker()` (cached): lazy-import `@mediapipe/tasks-vision`; `FilesetResolver.forVisionTasks`
  with the proxied wasm dir; `FaceLandmarker.createFromOptions` with the proxied model path,
  `runningMode: "IMAGE"`, `numFaces: 2`.
- `detect()`: redraw the image to the canvas, run `landmarker.detect(img)`, draw the mesh tesselation
  + face oval per detected face via `DrawingUtils`, set the count output.
- Errors caught and shown in the `demo-out err` style.

## Versions

Pin `@mediapipe/tasks-vision` to a single version constant used for both the npm dep and the wasm
CDN path (they must match), so a bump happens in one place.

## Testing

No unit tests — wraps a third-party WASM vision runtime with runtime model download (same category
as the other runtime demos). Verified **manually in-browser**. Each task ends with
`pnpm --filter @webai/hub build` + a manual checklist.

## Out of scope

- Webcam / live-video landmarks (uploaded image only).
- Hand / pose / gesture / segmentation tasks (face landmarks only for this slice).
- Production asset-download proxy/edge rewrite (deferred).
- ONNX Runtime Web (MNIST) demo — the next slice.
