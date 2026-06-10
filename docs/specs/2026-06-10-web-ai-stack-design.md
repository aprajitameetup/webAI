# Web AI Stack — Ecosystem Design

> **Status:** Draft for review · **Date:** 2026-06-10 · **Author:** Aprajita
> **Working name:** `webai` (final brand TBD before publish)

## 1. Vision

An open-source ecosystem that makes the **new web AI stack** (WebGPU · WebNN · WebAssembly · Built-in AI · WebTransport · OPFS · Workers) usable by ordinary React developers — and, through building and publishing it, establishes the author as an authority on client-side AI.

Adoption is the success metric: developers `npm install` it and ship web-AI features they couldn't have built alone. The companion site doubles as the author's public brand surface.

## 2. The product is one ecosystem, four layers

The four "options" considered are not separate projects — they are dependency-ordered layers of a single product. **Everything depends on the Core.**

```
  D · Hub / Playground      docs + live demos + brand surface   (showcases all)
  C · create-webai-app      scaffolds a working app             (depends on A)
  A · @webai/react          hooks + components                  (depends on B)
  B · @webai/core           detect → route → fallback engine    (foundation)
```

| Layer | Package | Responsibility |
|---|---|---|
| **B · Core** | `@webai/core` | Framework-agnostic. Capability detection, runtime routing, on-device→server fallback, streaming interface, worker orchestration. Designed up front to host **all** capabilities (on-device LLM, Built-in AI, embeddings/RAG). |
| **A · React** | `@webai/react` | Hooks + components over the core: `useLocalLLM`, `useEmbeddings`, `<CapabilityGate>`, `<StreamingResponse>`, `<ModelDownload>`. |
| **C · Starter** | `create-webai-app` | Scaffolds Vite + React + core + worker + OPFS + COOP/COEP headers. Clone-and-ship. |
| **D · Hub** | `apps/hub` | The learning hub (already prototyped) evolved into docs + live playground. Brand surface. |

The "capability-router" idea is **not** a separate layer — it *is* the Core, and its live dashboard is the Core's visible UI.

## 3. Guiding principle: vertical slice first

Building bottom-up (finish Core, then A, then C, then D) is correct but produces nothing shareable for weeks — fatal for a brand project. Instead, each capability ships as a **thin vertical slice through all layers**: just enough Core to power it → one hook → one hub demo. Prove the architecture end-to-end, ship something shareable, then widen.

## 4. Roadmap (all four capabilities, sequenced)

- **Phase 0 — Finish the Hub (learning vehicle).** The author is still learning the stack; finishing the hub is how they learn it, and it seeds Layer D. Shareable on its own.
- **Phase 1 — Slice 1: on-device LLM chat** through Core → `useLocalLLM` → hub demo. Flagship; exercises the most stack.
- **Phase 2 — Slice 2: Built-in AI** (Prompt API) on the same Core/router.
- **Phase 3 — Slice 3: in-browser RAG** (local embeddings + Wasm vector store) on the same Core.
- **Phase 4 — `create-webai-app` + harden the hub into real docs → publish + announce.**

Each phase/slice gets its own spec → plan → build cycle. This document covers **Phase 0 + Slice 1** in detail; later phases are deliberately deferred (not dropped).

## 5. Technical foundation

- **Monorepo:** pnpm workspaces. `packages/core`, `packages/react`, `apps/hub`, later `packages/create-webai-app`.
- **Language/build:** TypeScript + Vite. (Author is a frontend architect — React/Vite tooling is no friction; the *learning* is the web-AI APIs, not the tooling.)
- **On-device LLM runtime:** WebLLM (MLC) over WebGPU; model weights cached in OPFS; inference in a Web Worker.
- **Streaming:** async-iterator token interface in the Core; `fetch`+`ReadableStream` (SSE-style) for the server-fallback path.
- **Hosting (for real demos):** a host that can set COOP/COEP headers (Vercel or Netlify) — required for SharedArrayBuffer / multi-threaded Wasm. GitHub Pages cannot, so it is **not** the demo host.
- **License:** MIT (default for adoption; confirm on review).

## 6. Phase 0 — Finish the Hub (detailed scope)

**Goal:** a complete, shareable, single-purpose learning hub that teaches the whole stack and seeds Layer D. Primary value to the author: *learning by building*.

**In scope**
- Evolve the prototype `index.html` into the monorepo as `apps/hub` (Vite + React + TS), so it is **not** rebuilt later.
- One page/section per stack layer (Compute, Runtimes, Built-in AI, Transport, Storage, Concurrency, Multimodal, RAG, Patterns) with concise authoritative content.
- Live capability dashboard (real feature detection) — already prototyped.
- Real, self-contained mini-demos where feasible without heavy downloads: WebGPU compute, Web Worker, OPFS round-trip, Web Audio, streaming-UX simulation — already prototyped; port into components.
- 3-day study plan + curated resources — already prototyped.

**Out of scope (Phase 0)**
- The Core package, hooks, real WebLLM/Built-in AI inference (those are Slice 1+).
- SEO, custom domain, analytics (Phase 4).

**Done when:** the hub runs as `apps/hub` in the monorepo, covers every layer, all prototyped demos work as React components, and it is deployable to the chosen host.

## 7. Slice 1 — On-device LLM chat (detailed scope)

**Goal:** prove the entire architecture end-to-end with the flagship use case — *"pull the wifi, it still answers."*

**`@webai/core` (minimal)**
- `detectCapabilities()` → `{ webgpu, builtinAI, wasm, … }`.
- `createEngine(opts)` → routes: WebGPU present → WebLLM (on-device); else → server endpoint (fallback). Returns a unified `chat({ messages })` that yields tokens via async iterator.
- Worker orchestration + OPFS model caching encapsulated inside.

**`@webai/react` (minimal)**
- `useLocalLLM()` → `{ status: 'detecting'|'downloading'|'ready'|'streaming'|'error', progress, send, messages, source: 'on-device'|'server' }`.
- `<CapabilityGate require="webgpu" fallback={…}>`.

**`apps/hub` demo**
- A working chat that uses `useLocalLLM`: capability badge, model-download progress, on-device vs server source indicator, streaming responses, and a visible "works offline" proof.

**Out of scope (Slice 1):** Built-in AI, RAG, embeddings, starter-kit, multi-framework wrappers, polished docs.

**Done when:** a developer can import `useLocalLLM` from `@webai/react`, render the demo, get a streaming on-device answer with WebGPU, see it fall back to a server path without WebGPU, and watch it answer offline once cached.

## 8. Non-goals (whole project, for now)
- Not a model-training tool. Inference/UX only.
- Not multi-framework at launch (React first; Vue/Svelte wrappers are post-1.0).
- Not a hosted SaaS. Libraries + static hub only.

## 9. Success criteria
- **Phase 0:** hub shipped & shareable; author can explain every layer unaided.
- **Slice 1:** flagship demo works on-device + fallback + offline; first hook published.
- **Ecosystem:** GitHub stars / npm installs / inbound (talks, mentions) as adoption signals.

## 10. Open questions (resolve before publish, not before building)
- **Brand/name** — `webai` is a placeholder; needs a unique, ownable name + npm scope + domain.
- **Hosting** — Vercel vs Netlify (both support COOP/COEP).
- **License** — MIT assumed.
- **Server-fallback endpoint** — which provider/model backs the fallback path in the demo.
