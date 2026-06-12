# Capability Demos (WebAssembly + Web Audio + WebCodecs) — Slice 7 Design

**Status:** Approved (2026-06-12)
**Scope:** Hub-only (`apps/hub`). No `@webai/core` / `@webai/react` changes. (WebRTC intentionally
left as an explainer card — a single-page demo can only do a contrived loopback.)

## Goal

Add three live capability demos so the supporting-cast browser APIs the hub describes are
demonstrated, not just explained:
1. **WebAssembly** (Compute section) — near-native CPU.
2. **Web Audio API** (Multimodal section) — mic capture / real-time audio.
3. **WebCodecs** (Multimodal section) — raw video frames.

These are the "I/O + compute rig" behind the AI runtimes already demoed.

## Demos

### 1. WebAssembly — JS-vs-WASM micro-benchmark (Compute)
- A hand-assembled ~88-byte WASM module exporting `sumsq(n: i32) -> i64` (sum of i² for i in 0..n).
  The exact bytes are **verified to run correctly in Node** before embedding (sumsq(1000)=332833500).
- On Run: instantiate once (cached), run `sumsq(N)` for a large N and time it; run the equivalent
  tight loop in JS and time it; show both timings + the speedup.
- Always available (WASM is universal) — no degradation path. Copy notes it's a tight-loop
  microbenchmark and that SIMD/threads push it further.

### 2. Web Audio — live mic waveform + volume (Multimodal)
- Start/Stop. `getUserMedia({audio})` → `AudioContext` → `AnalyserNode`; a `requestAnimationFrame`
  loop draws the time-domain waveform on a canvas and shows RMS volume.
- Needs mic permission; if denied/unavailable, show a clear message (no crash).
- Copy notes AudioWorklet is the production real-time-thread path; we use AnalyserNode for the
  visual.

### 3. WebCodecs — raw camera frames (Multimodal)
- Feature-detect `MediaStreamTrackProcessor` + `VideoFrame`; if absent → "Not supported here
  (Chrome/Edge only)".
- Start/Stop. `getUserMedia({video})` → `MediaStreamTrackProcessor` → read `VideoFrame`s from the
  track's `ReadableStream`, draw each to a canvas, `frame.close()`, and show frame count + resolution.
- Needs camera permission; degrade gracefully on denial/absence.

## Architecture

```
apps/hub/src/
├─ components/demos/
│  ├─ WasmDemo.tsx        NEW (alongside WebGPUDemo etc.)
│  ├─ WebAudioDemo.tsx    NEW
│  └─ WebCodecsDemo.tsx   NEW
└─ sections/
   ├─ Compute.tsx         MODIFIED: mount <WasmDemo/> after the WebAssembly heading
   └─ Multimodal.tsx      MODIFIED: mount <WebCodecsDemo/> + <WebAudioDemo/> after <AudioDemo/>
```

Each demo is a self-contained component following the existing mini-demo pattern
(`.demo` / `demo-head` / `title` / `btn` / `demo-out`), with local `useState`.

## Testing

No unit tests — these wrap browser media/compute APIs that need real hardware/permissions (same
category as the other browser demos). Verified **manually in-browser**. The WASM bytes are verified
in Node during implementation. Each task ends with `pnpm --filter @webai/hub build` + a manual
checklist.

## Out of scope

- WebRTC live demo (kept as explainer; needs signaling + remote peer).
- AudioWorklet custom processor (AnalyserNode suffices for the visual; mentioned in copy).
- WebCodecs encode path / video-file decode (camera-frame read only).
- In-browser RAG — deferred to a future session.
