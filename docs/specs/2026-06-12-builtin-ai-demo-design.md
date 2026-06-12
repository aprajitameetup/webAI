# Built-in AI Demo — Design

**Status:** Approved (2026-06-12)
**Scope:** Hub-only (`apps/hub`). No changes to `@webai/core` or `@webai/react`.

## Goal

Replace the `…demo coming in next task…` placeholder in `apps/hub/src/sections/BuiltinAI.tsx`
with a rich, honest showcase of the browser's **Built-in AI** APIs (Chrome's on-device
Gemini Nano, exposed via the Prompt + Task APIs). The browser ships and manages the model —
**the app downloads nothing** — which contrasts with the WebLLM `ChatDemo` (which downloads a
~710 MB model to OPFS). Both demos coexist as two distinct "LLM in the browser" approaches.

## What it contains

1. **Capability panel** — a status row for all **6** built-in APIs:
   `LanguageModel` (Prompt), `Summarizer`, `Writer`, `Rewriter`, `Translator`, `LanguageDetector`.
   Each shows a normalized state: **available** / **downloadable** / **unavailable**.
2. **4 interactive demos:**
   - **Prompt** (`LanguageModel`) — type a prompt, stream Gemini Nano's reply.
   - **Summarizer** — paste text → concise summary.
   - **Translator** — text + target language → translation.
   - **Language Detector** — text → detected language(s) with confidence.

`Writer` and `Rewriter` appear in the panel only (status row), no interactive demo.

## Architecture

```
apps/hub/src/
├─ lib/builtinAI.ts            async probe of each API → normalized availability map;
│                              + pure normalizeAvailability() helper (unit-tested)
├─ hooks/useBuiltinSession.ts  shared lifecycle hook: availability → (download+progress)
│                              → session → run/stream; each demo supplies create() + run()
└─ components/demos/builtin/
   ├─ BuiltinAIPanel.tsx       status grid for all 6 APIs
   ├─ PromptDemo.tsx
   ├─ SummarizerDemo.tsx
   ├─ TranslatorDemo.tsx
   └─ LanguageDetectorDemo.tsx
```

`BuiltinAI.tsx` keeps its existing explanatory copy and mounts `<BuiltinAIPanel/>` plus the
4 demo components in place of the placeholder.

### `lib/builtinAI.ts`
- `normalizeAvailability(raw: unknown): "available" | "downloadable" | "unavailable"` — **pure,
  unit-tested.** Maps both the legacy strings (`"readily"`, `"after-download"`, `"no"`) and the
  current strings (`"available"`, `"downloadable"`, `"downloading"`, `"unavailable"`) into the
  normalized enum (`"downloading"` normalizes to `"downloadable"` for panel purposes).
- `probeBuiltinAI(): Promise<Record<ApiKey, Availability>>` — feature-detects each global
  (`"LanguageModel" in self`, etc.), calls its async `availability()` inside try/catch, and
  returns `"unavailable"` for any API that is absent or throws. Never rejects.

### `hooks/useBuiltinSession.ts`
Generic over a session type. Inputs: an `availability()` thunk, a `create(opts)` thunk (with a
download-progress monitor), and a `run(session, input)` thunk. Exposes
`{ state, progress, output, error, run }` where `state ∈ detecting | unavailable | downloadable
| downloading | ready | running`. Centralizes the availability → download → ready → run flow so
each demo component stays small.

## Data flow per demo

`availability()` →
- **`available`** → interactive immediately; `run()` streams output into the UI.
- **`downloadable` / `downloading`** → show a **"Download model"** button; on click, create the
  session with a download-progress monitor, stream progress %, flip to `ready`.
- **`unavailable`** → show a muted explainer (see Degradation); no dead/enabled controls.

## Graceful degradation

Built-in AI is Chrome/Edge-only and flag-gated, so most machines will show APIs as unavailable.
This must be informative, not broken:
- **`unavailable`** demos render a muted note: *"Not available in this browser. Built-in AI needs
  Chrome/Edge with the Prompt API enabled (`chrome://flags`) and the model downloaded."*
- The **capability panel** is the at-a-glance truth for all 6 APIs, so the section teaches even
  when nothing is available ("this is bleeding-edge — here's how to turn it on").
- Every probe is wrapped in try/catch + feature-detection; the page never crashes on a browser
  that lacks these APIs.

## Testing

- **Unit (Vitest):** `normalizeAvailability()` — covers legacy + current strings + unknown input.
- **Manual (in-browser, Chrome with flags):** the panel reflects real availability; each demo's
  three states (available / downloadable / unavailable) behave correctly; Prompt streams; the
  download-progress flow works. Browser APIs cannot run in Node/Vitest, mirroring the WebLLM path.

## Known unknown (honest)

The Built-in AI API surface is unstable (`window.ai` → `self.ai` → global classes; availability
strings changed across origin trials). Exact API names/shapes are **confirmed against the live
Chrome build during implementation**; `normalizeAvailability` and the probes are written
defensively so absence/renames degrade to `"unavailable"` rather than crashing.

## Out of scope

- No `@webai/core` built-in-AI engine (deferred; `ChatDemo` keeps using WebLLM).
- No `Writer`/`Rewriter` interactive demos (panel status only).
- Production deploy concerns unchanged.
