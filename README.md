<div align="center">

# ⚡ webAI — The New Web AI Stack

### Real AI models. Running in your browser tab. No server. No API key. Often offline.

A hands-on learning hub + reusable libraries that prove the browser has quietly become a
**complete, production-grade AI runtime** — and let you feel it, live, in a few clicks.

[![License: MIT](https://img.shields.io/badge/License-MIT-30c8ff.svg)](LICENSE)
![On-device](https://img.shields.io/badge/inference-100%25%20on--device-1e8e3e)
![No server](https://img.shields.io/badge/server-not%20required-1e8e3e)
![pnpm](https://img.shields.io/badge/pnpm-workspaces-f69220?logo=pnpm&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)

</div>

---

## 💡 The big idea

For years, "AI in a web app" meant one thing: a `fetch()` to someone else's GPU.

That's no longer true. **WebGPU** gives the browser raw GPU compute. **WebAssembly** runs C/C++/Rust
at near-native speed. Chrome now **ships its own LLM** (Gemini Nano). Quantized models stream in
once and cache to disk. Put it together and you can run a **full Llama model, a vision network, even
CPython** — entirely client-side, private by default, working with the wifi switched off.

This repo is the proof. It's a learning hub with **18+ live, on-device demos**, backed by a small
set of framework-agnostic libraries that handle the messy parts (capability detection, engine
routing, streaming, offline caching) so you don't have to.

> **Pull the wifi out, reload the page, ask the chatbot a question — it still answers.** That moment
> is what this project is about.

---

## 🚀 Quick start

```bash
# requires Node 18+ and pnpm 9+
pnpm install
pnpm dev          # → http://localhost:3005
```

Open the **Models & Runtimes** tab and hit a demo. The first run downloads a model (cached after);
every run after that is instant — and offline.

> Some demos need a **WebGPU** browser (Chrome/Edge/recent Safari). The **Built-in AI** demos need
> Chrome with the Prompt API enabled (`chrome://flags`). Every demo **degrades gracefully** and tells
> you exactly what's missing — nothing crashes.

---

## ✨ What's inside — 18+ live demos

Every capability the hub *describes*, it also **demonstrates live, on-device**.

### 🦙 Models & Runtimes — six ways to run a model in a tab
| Demo | Library | What it shows |
|---|---|---|
| **On-device chat** | WebLLM | A full **Llama 3.2** LLM over WebGPU in a Web Worker — streams tokens, caches to OPFS, **works offline** |
| **Sentiment analysis** | Transformers.js | **DistilBERT** classifier via ONNX Runtime Web |
| **Image classification** | TensorFlow.js | **MobileNet** labels an uploaded photo |
| **Python in the browser** | Pyodide | **CPython + NumPy** compiled to WebAssembly |
| **Face landmarks** | MediaPipe | **468-point face mesh** drawn on your photo |
| **Draw a digit** | ONNX Runtime Web | A **MNIST CNN** classifies your handwriting |

### ✨ Built-in AI — the browser *is* the model
| Demo | API | What it shows |
|---|---|---|
| **Capability panel** | all six | Live availability of Prompt / Summarizer / Writer / Rewriter / Translator / Language Detector |
| **Prompt** | `LanguageModel` | Chat with **Gemini Nano** — zero download in your app |
| **Summarizer** | `Summarizer` | Long text → TL;DR |
| **Translator** | `Translator` | English → Spanish/French/Hindi/Japanese |
| **Language Detector** | `LanguageDetector` | Text → detected language + confidence |

### 🧮 The supporting stack — the rig that makes it all work
| Demo | Tech | What it shows |
|---|---|---|
| **WebGPU compute** | WebGPU | A WGSL compute shader returns `[11, 22, 33, 44]` |
| **WASM vs JS benchmark** | WebAssembly | An honest tight-loop race (spoiler: the JIT is *very* good) |
| **Mic waveform** | Web Audio | Live waveform + volume from your microphone |
| **Raw camera frames** | WebCodecs | `VideoFrame`s pulled straight off the camera track |
| **Non-blocking worker** | Web Workers | Heavy compute off the main thread, UI stays smooth |
| **Model cache** | OPFS | Write/read the Origin Private File System + storage quota |
| **Token streaming** | SSE | The "read while it writes" streaming-UX pattern |

Plus a **live capability dashboard** that probes your browser for all 12 platform features in real time.

---

## 🏗️ Architecture

A **pnpm monorepo** with a clean dependency direction: a framework-agnostic core, a thin React layer
on top, and an app that consumes both.

```
                ┌─────────────────────────────────────────────┐
                │                 apps/hub                      │
                │   The learning hub — 18+ live demos, the      │
                │   capability dashboard, the 10-day plan       │
                └───────────────┬───────────────┬──────────────┘
                                │               │
                  ┌─────────────▼──────┐  ┌─────▼─────────────────┐
                  │   @webai/react      │  │   (browser APIs)       │
                  │  useLocalLLM()      │  │  WebGPU · Wasm · OPFS   │
                  │  <CapabilityGate>   │  │  Web Audio · WebCodecs  │
                  └─────────────┬──────┘  └────────────────────────┘
                                │
                  ┌─────────────▼───────────────────────────────┐
                  │                @webai/core                    │
                  │   detect() → route() → stream() → fallback    │
                  │   on-device (WebLLM)  ⇄  server (SSE)          │
                  └───────────────────────────────────────────────┘
```

**`@webai/core`** — the engine. `detectCapabilities()` reads the browser, `createEngine()` **routes**
to the best path (on-device WebGPU vs. a streaming server fallback), and every engine exposes the
*same* interface: an **async-iterator token stream**. Swap the backend, keep your UI.

```ts
import { createEngine } from "@webai/core";

const engine = await createEngine({ serverUrl: "/api/chat" });   // picks on-device if WebGPU is present
for await (const tok of engine.chat([{ role: "user", content: "hi" }])) {
  if (!tok.done) process.stdout.write(tok.delta);                // streams token-by-token
}
```

**`@webai/react`** — the hooks. `useLocalLLM()` wraps the engine into React state
(`status · progress · messages · source · send`), and `<CapabilityGate>` renders fallbacks when a
feature is missing.

```tsx
const { status, progress, messages, source, send } = useLocalLLM({ serverUrl: "/api/chat" });
// status: "detecting" → "loading" (with progress) → "ready" → "streaming"
```

---

## 🧠 Engineering depth — the parts that were actually hard

This is where the project earns the "in-depth" label. A few of the battles:

<details>
<summary><b>🌐 The HuggingFace Xet-CDN CORS war</b></summary>

WebLLM downloads weights from `huggingface.co`, which **302-redirects to a Xet CDN**. After a
cross-origin redirect the browser sends `Origin: null`, the CDN echoes back a *specific* origin in
`Access-Control-Allow-Origin`, they don't match → **every weight shard is blocked**. This is *not* a
COEP problem (the error names `Access-Control-Allow-Origin`, not `Cross-Origin-Resource-Policy`), so
the obvious "use `credentialless`" fix does nothing.

**Solution:** a same-origin dev proxy (`/hf`) that follows the redirect *server-side*, plus
`withProxiedModel()` to rewrite the model host. The browser only ever sees same-origin requests. The
same pattern (`/jsdelivr`, `/gstorage`) unblocks Pyodide and MediaPipe.
</details>

<details>
<summary><b>💾 OPFS vs. Cache Storage for offline weights</b></summary>

The plan called for OPFS-cached weights. In practice, WebLLM's `"opfs"` backend in v0.2.84 **wedges
on an interrupted download** (`Unexpected end of JSON input`) in a way even "Clear site data"
struggles to recover — while the default **Cache Storage** backend tolerates interruption and is
offline-capable just the same. Both were tried, on real hardware. The trade-off is documented in the
engine.
</details>

<details>
<summary><b>🔒 Cross-origin isolation (COOP/COEP)</b></summary>

Threaded WebAssembly and `SharedArrayBuffer` require the page to be **cross-origin isolated**
(`Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`). The dev
server, `vercel.json`, and Netlify `_headers` all set them — which then *causes* the CORS battle
above, because isolation makes the browser strict about every cross-origin subresource.
</details>

<details>
<summary><b>🧩 An honest WASM benchmark</b></summary>

The WASM-vs-JS demo was *built to lose gracefully*: for a trivial scalar loop, **V8's JIT matches or
beats WebAssembly**. The demo says so, out loud. WASM's real value isn't beating the JIT at a
`for`-loop — it's **predictable** performance, **SIMD/threads**, and running **existing C/C++/Rust**
(which is exactly why llama.cpp, ONNX Runtime, and Pyodide are WASM ports). Honesty > a rigged win.
</details>

<details>
<summary><b>⚡ Lazy everything</b></summary>

Transformers.js, TensorFlow.js, Pyodide, MediaPipe, and ONNX Runtime are *megabytes*. Each demo
**dynamically `import()`s its library inside the click handler**, so the initial bundle stays small
and a library only loads when you actually run its demo.
</details>

---

## 🗂️ Project structure

```
webAI/
├─ packages/
│  ├─ core/          @webai/core  — detect · route · engines (server SSE + WebLLM worker) · stream
│  └─ react/         @webai/react — useLocalLLM · CapabilityGate
└─ apps/
   └─ hub/           the learning hub (Vite + React)
      ├─ src/sections/     one tab per stack layer
      ├─ src/components/demos/        live mini-demos (WebGPU, Wasm, Web Audio, WebCodecs, …)
      │                    ├─ builtin/    Built-in AI demos + capability panel
      │                    └─ runtimes/   Transformers.js · TensorFlow.js · Pyodide · MediaPipe · ONNX
      ├─ src/ChatDemo.tsx              the flagship on-device LLM chat
      ├─ public/models/               committed MNIST model
      ├─ vercel.json / public/_headers  COOP/COEP for production
      └─ vite.config.ts               dev server + the CORS-dodging proxies
```

Every feature was shipped as a small **spec → plan → build → verify** slice; the specs and plans live
in [`docs/`](docs/).

---

## 📅 Bonus: a 10-day learning path

The **10-Day Plan** tab turns the hub into a curriculum — one coherent chunk of the stack per day,
each anchored to a live demo: compute → WebLLM → Transformers.js/ONNX → vision → Pyodide → Built-in
AI → transport/storage → multimodal → in-browser RAG → ship a capstone.

---

## 🧪 Testing

A deliberate split, because browser AI can't run in Node:
- **Unit-tested (Vitest):** pure logic — capability detection, the engine router, the SSE stream
  parser, availability normalization, model-URL rewriting, the React hook (with a mocked engine).
- **Manually verified in-browser:** everything that needs WebGPU / WebLLM / OPFS / Web Audio /
  WebCodecs / Gemini Nano — with explicit checklists in each plan.

```bash
pnpm -r test      # runs every package's unit tests
pnpm -r build     # type-checks + builds everything
```

---

## 🚧 Roadmap

- [ ] **In-browser RAG** — embeddings (Transformers.js) + vector search, feeding retrieved context
      into an on-device LLM. The natural finale.
- [ ] **Production model proxies** — replicate the dev `/hf`, `/jsdelivr`, `/gstorage` proxies as
      edge functions so the heavy demos download weights on a deployed site, not just locally.
- [ ] **Built-in AI engine in `@webai/core`** — route to Gemini Nano automatically when present.
- [ ] **WebRTC** — currently an explainer (a meaningful demo needs signaling + a remote peer).

---

## 🛠️ Tech stack

**pnpm** workspaces · **Vite 5** · **React 18** · **TypeScript** (strict) · **Vitest** ·
**WebLLM** · **Transformers.js** · **TensorFlow.js** · **Pyodide** · **MediaPipe** ·
**ONNX Runtime Web** · **WebGPU / WebAssembly / OPFS / Web Audio / WebCodecs / Web Workers**

---

## 📄 License

[MIT](LICENSE) — built for the React Delhi community. Fork it, learn from it, run it offline. ⚡
