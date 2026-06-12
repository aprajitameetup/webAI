# Pyodide Demo (Slice 4) — Design

**Status:** Approved (2026-06-12)
**Scope:** Hub-only (`apps/hub`). No `@webai/core` / `@webai/react` changes.

## Goal

Add a live **Pyodide** demo to the Runtimes section: run real **CPython (compiled to WebAssembly)**
in the browser and show its output. Demonstrates the talk's "it's not just JavaScript — the browser
runs whole language runtimes" point, alongside the existing WebLLM / Transformers.js / TensorFlow.js
demos.

## What it contains

One new demo component mounted in the Runtimes section after `TensorFlowDemo`:
- An editable code box pre-filled with a real Python snippet.
- **Run** button → executes the Python via Pyodide; output shows captured `stdout`/`stderr` plus the
  value of the last expression.
- Two example chips:
  - **🐍 Stdlib** — pure-Python stdlib (e.g. `statistics`) — runs instantly once Pyodide is loaded.
  - **🔢 NumPy** — `loadPackage("numpy")` then numpy code — proves the scientific package ecosystem works in-browser.

## Loading strategy

- **Lazy:** Pyodide (~10 MB runtime + stdlib) loads only on the first Run, not at page load.
- **No npm dependency:** load Pyodide's CDN loader script at runtime and call `loadPyodide({ indexURL })`.
  This is Pyodide's documented browser approach and avoids bundling its large wasm/data assets.
- **Via a `/jsdelivr` dev proxy:** the hub page is cross-origin isolated (`COEP: require-corp`).
  Loading Pyodide's assets directly from `cdn.jsdelivr.net` risks the same cross-origin CORS/CORP
  block we hit with the HuggingFace Xet CDN. To make the demo reliable, add a Vite `/jsdelivr` proxy
  (→ `https://cdn.jsdelivr.net`, follows redirects server-side) and load both the loader script and
  the `indexURL` through it, so every request is same-origin. Production download is deferred (same
  edge-rewrite gap as WebLLM/Transformers.js).

## Architecture

```
apps/hub/
├─ vite.config.ts                              MODIFIED: add /jsdelivr proxy
└─ src/
   ├─ components/demos/runtimes/PyodideDemo.tsx  NEW
   └─ sections/Runtimes.tsx                       MODIFIED: mount <PyodideDemo/>
```

### PyodideDemo.tsx
- Local state: `phase = idle|loading|running|ready|error`, `code`, `output`.
- `ensurePyodide()` (cached in a ref): inject the loader `<script>` from the proxied indexURL if
  `window.loadPyodide` is absent, then `loadPyodide({ indexURL, stdout, stderr })` with callbacks that
  append to the output.
- `run(code, pkg?)`: ensure Pyodide; if `pkg` given, `loadPackage(pkg)`; `runPythonAsync(code)`;
  append the return value; show `(no output)` if nothing printed.
- Errors (load failure, Python exceptions) caught and rendered in the `demo-out err` style.

## Pyodide version

Pin to a known-good CDN version (`v0.26.4`) in a single constant so it can be bumped in one place.

## Testing

No unit tests — it's a thin wrapper over a third-party WASM runtime that downloads at runtime
(same category as WebLLM / Built-in AI / the other runtime demos). Verified **manually in-browser**.
Each task ends with `pnpm --filter @webai/hub build` + a manual checklist.

## Out of scope

- Persistent REPL / multi-cell notebook, virtual filesystem, arbitrary `micropip install`.
- Production model/runtime-download proxy (deferred, same as the other runtimes).
- ONNX Runtime Web and MediaPipe demos (later slices).
