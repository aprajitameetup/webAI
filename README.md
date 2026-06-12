<div align="center">

# webAI — The New Web AI Stack

**Real AI models, running entirely in the browser. No server. No API key. Often offline.**

A hands-on learning hub and a small set of reusable libraries demonstrating that the browser has
become a complete, production-grade AI runtime — with 18+ live, on-device demos to prove it.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Inference: on-device](https://img.shields.io/badge/inference-on--device-success)
![Server: not required](https://img.shields.io/badge/server-not%20required-success)
![pnpm](https://img.shields.io/badge/pnpm-workspaces-f69220?logo=pnpm&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)

</div>

---

## Overview

For years, "AI in a web app" meant a network call to someone else's GPU. That is no longer the only
option. WebGPU exposes raw GPU compute to JavaScript. WebAssembly runs C, C++, and Rust at
near-native speed. Chrome now ships its own on-device language model. Quantized model weights stream
in once and persist to disk. Together, these make it possible to run a full Llama model, a vision
network, or even CPython entirely client-side — private by default, and able to keep working with
the network disconnected.

This repository is a working demonstration of that shift: a learning hub with 18+ live, on-device
demos, backed by framework-agnostic libraries that handle capability detection, engine routing,
token streaming, and offline caching.

> Disconnect the network, reload the page, and ask the chatbot a question — it still answers. That
> behaviour is the central point of the project.

---

## Quick start

```bash
# Requires Node 18+ and pnpm 9+
pnpm install
pnpm dev          # → http://localhost:3005
```

Open the **Models & Runtimes** tab and run a demo. The first run downloads a model and caches it;
subsequent runs are instant and work offline.

Some demos require a WebGPU-capable browser (Chrome, Edge, or recent Safari). The Built-in AI demos
require Chrome with the Prompt API enabled via `chrome://flags`. Every demo degrades gracefully and
reports exactly what is unavailable — nothing crashes.

---

## What's inside

Every capability the hub describes, it also demonstrates live and on-device.

### Models and runtimes — six ways to run a model in the browser

| Demo | Library | What it demonstrates |
|---|---|---|
| On-device chat | WebLLM | A full Llama 3.2 model over WebGPU in a Web Worker — streams tokens, caches weights, works offline |
| Sentiment analysis | Transformers.js | A DistilBERT classifier running on ONNX Runtime Web |
| Image classification | TensorFlow.js | MobileNet labelling an uploaded photo |
| Python in the browser | Pyodide | CPython and NumPy compiled to WebAssembly |
| Face landmarks | MediaPipe | A 468-point face mesh rendered over a photo |
| Handwritten digit recognition | ONNX Runtime Web | An MNIST CNN classifying a drawn digit |

### Built-in AI — the browser as the model

| Demo | API | What it demonstrates |
|---|---|---|
| Capability panel | All six | Live availability of the Prompt, Summarizer, Writer, Rewriter, Translator, and Language Detector APIs |
| Prompt | `LanguageModel` | Chat against Gemini Nano with no model download in the application |
| Summarizer | `Summarizer` | Long-form text reduced to a concise summary |
| Translator | `Translator` | English to Spanish, French, Hindi, or Japanese |
| Language detector | `LanguageDetector` | Text to detected language with confidence |

### The supporting stack

| Demo | Technology | What it demonstrates |
|---|---|---|
| WebGPU compute | WebGPU | A WGSL compute shader returning a computed buffer |
| WebAssembly benchmark | WebAssembly | An honest tight-loop comparison against the JavaScript JIT |
| Microphone waveform | Web Audio | A live waveform and volume meter from microphone input |
| Raw camera frames | WebCodecs | `VideoFrame`s read directly from the camera track |
| Non-blocking computation | Web Workers | Heavy work moved off the main thread to keep the UI responsive |
| Model cache | OPFS | Reading and writing the Origin Private File System |
| Token streaming | Server-Sent Events | The progressive-rendering pattern behind responsive AI UIs |

A live capability dashboard also probes the browser for twelve platform features in real time.

---

## Architecture

A pnpm monorepo with a deliberate dependency direction: a framework-agnostic core, a thin React
layer above it, and an application that consumes both.

```
                ┌───────────────────────────────────────────────┐
                │                   apps/hub                      │
                │   The learning hub — 18+ live demos, the        │
                │   capability dashboard, and the learning path   │
                └───────────────┬───────────────┬────────────────┘
                                │               │
                  ┌─────────────▼──────┐  ┌─────▼──────────────────┐
                  │   @webai/react      │  │   Browser platform      │
                  │  useLocalLLM()      │  │  WebGPU · Wasm · OPFS    │
                  │  <CapabilityGate>   │  │  Web Audio · WebCodecs   │
                  └─────────────┬──────┘  └─────────────────────────┘
                                │
                  ┌─────────────▼─────────────────────────────────┐
                  │                  @webai/core                    │
                  │   detect → route → stream → fallback            │
                  │   on-device (WebLLM)  ⇄  server (SSE)            │
                  └─────────────────────────────────────────────────┘
```

**`@webai/core`** is the engine. `detectCapabilities()` inspects the browser, `createEngine()` routes
to the best available path (on-device WebGPU, or a streaming server fallback), and every engine
exposes the same interface — an async-iterator token stream. The backend can change without touching
the UI.

```ts
import { createEngine } from "@webai/core";

const engine = await createEngine({ serverUrl: "/api/chat" }); // selects on-device when WebGPU is present
for await (const token of engine.chat([{ role: "user", content: "hi" }])) {
  if (!token.done) process.stdout.write(token.delta);          // streams token by token
}
```

**`@webai/react`** provides the hooks. `useLocalLLM()` wraps the engine in React state
(`status`, `progress`, `messages`, `source`, `send`), and `<CapabilityGate>` renders a fallback when
a feature is absent.

```tsx
const { status, progress, messages, source, send } = useLocalLLM({ serverUrl: "/api/chat" });
// status transitions: "detecting" → "loading" (with progress) → "ready" → "streaming"
```

---

## Engineering notes

The non-obvious problems this project had to solve, documented because they are where the real work
was.

<details>
<summary><b>The HuggingFace Xet CDN CORS failure</b></summary>

WebLLM downloads model weights from `huggingface.co`, which issues a 302 redirect to a Xet CDN.
After a cross-origin redirect the browser sends `Origin: null`; the CDN responds with a specific
origin in `Access-Control-Allow-Origin`, the two do not match, and every weight shard is blocked.
This is not a COEP problem — the error names `Access-Control-Allow-Origin`, not
`Cross-Origin-Resource-Policy` — so switching the embedder policy to `credentialless` does not help.

The fix is a same-origin development proxy (`/hf`) that follows the redirect server-side, combined
with a `withProxiedModel()` helper that rewrites the model host. The browser only ever issues
same-origin requests. The same pattern (`/jsdelivr`, `/gstorage`) unblocks Pyodide and MediaPipe.
</details>

<details>
<summary><b>OPFS versus Cache Storage for offline weights</b></summary>

The original design specified OPFS-cached weights. In testing on real hardware, WebLLM's `"opfs"`
backend in v0.2.84 wedges on an interrupted download (`Unexpected end of JSON input`) in a state
that even clearing site data struggles to recover, whereas the default Cache Storage backend
tolerates interruption and is equally offline-capable. The trade-off is documented in the engine.
</details>

<details>
<summary><b>Cross-origin isolation (COOP and COEP)</b></summary>

Threaded WebAssembly and `SharedArrayBuffer` require the page to be cross-origin isolated
(`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`). These
headers are set in the dev server, `vercel.json`, and the Netlify `_headers` file. Enabling isolation
is also what makes the browser strict about every cross-origin subresource, which is the root of the
CORS issue above.
</details>

<details>
<summary><b>An honest WebAssembly benchmark</b></summary>

The WebAssembly-versus-JavaScript demo is built to report the real result: for a trivial scalar loop,
V8's JIT matches or beats WebAssembly, and the demo says so. WebAssembly's value is not winning a
`for`-loop against the JIT — it is predictable performance, SIMD and threads, and the ability to run
existing C, C++, and Rust code, which is precisely why llama.cpp, ONNX Runtime, and Pyodide are
WebAssembly ports.
</details>

<details>
<summary><b>Lazy library loading</b></summary>

Transformers.js, TensorFlow.js, Pyodide, MediaPipe, and ONNX Runtime are each several megabytes.
Every demo dynamically imports its library inside the click handler, so the initial bundle stays
small and a library is fetched only when its demo is run.
</details>

---

## Project structure

```
webAI/
├─ packages/
│  ├─ core/          @webai/core  — detect, route, engines (server SSE + WebLLM worker), stream
│  └─ react/         @webai/react — useLocalLLM, CapabilityGate
└─ apps/
   └─ hub/           the learning hub (Vite + React)
      ├─ src/sections/                one tab per layer of the stack
      ├─ src/components/demos/        live mini-demos (WebGPU, Wasm, Web Audio, WebCodecs, …)
      │  ├─ builtin/                  Built-in AI demos and the capability panel
      │  └─ runtimes/                 Transformers.js, TensorFlow.js, Pyodide, MediaPipe, ONNX
      ├─ src/ChatDemo.tsx             the flagship on-device LLM chat
      ├─ public/models/               committed MNIST model
      ├─ vercel.json, public/_headers COOP/COEP headers for production
      └─ vite.config.ts               dev server and the CORS-handling proxies
```

Each feature was delivered as a small specification → plan → build → verify increment; the
specifications and plans are in [`docs/`](docs/).

---

## Learning path

The **10-Day Plan** tab turns the hub into a structured curriculum — one coherent layer of the stack
per day, each anchored to a live demo: compute, WebLLM, Transformers.js and ONNX, computer vision,
Pyodide, Built-in AI, transport and storage, multimodal I/O, in-browser RAG, and a final capstone.

---

## Testing

The test strategy reflects a hard constraint: browser AI cannot run in Node.

- **Unit-tested with Vitest:** pure logic — capability detection, the engine router, the SSE stream
  parser, availability normalization, model-URL rewriting, and the React hook (against a mocked
  engine).
- **Verified manually in the browser:** anything requiring WebGPU, WebLLM, OPFS, Web Audio,
  WebCodecs, or Gemini Nano, with an explicit checklist in each plan.

```bash
pnpm -r test      # runs every package's unit tests
pnpm -r build     # type-checks and builds every package
```

---

## Roadmap

- In-browser RAG — embeddings via Transformers.js plus vector search, feeding retrieved context into
  an on-device model.
- Production model proxies — edge-function equivalents of the development `/hf`, `/jsdelivr`, and
  `/gstorage` proxies, so a deployed site can download weights.
- A Built-in AI engine in `@webai/core` that routes to Gemini Nano automatically when available.
- WebRTC — currently an explainer; a meaningful demo requires signaling and a remote peer.

---

## Tech stack

pnpm workspaces · Vite 5 · React 18 · TypeScript (strict) · Vitest · WebLLM · Transformers.js ·
TensorFlow.js · Pyodide · MediaPipe · ONNX Runtime Web · WebGPU · WebAssembly · OPFS · Web Audio ·
WebCodecs · Web Workers

---

## License

[MIT](LICENSE). Built for the React Delhi community.
