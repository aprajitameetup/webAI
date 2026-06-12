# Built-in AI Demo — Slice 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `…demo coming in next task…` placeholder in the hub's Built-in AI section with a capability panel for all 6 browser Built-in AI APIs plus 4 interactive live demos (Prompt, Summarizer, Translator, Language Detector).

**Architecture:** Hub-only (`apps/hub`), no `@webai/core` changes. A defensive detection lib (`lib/builtinAI.ts`) probes each API and normalizes its availability; a shared lifecycle hook (`hooks/useBuiltinSession.ts`) handles availability → download-with-progress → ready → run for every demo; one component per demo plus a panel; `BuiltinAI.tsx` mounts them. Built-in AI is Chrome/Edge-only and flag-gated, so every path degrades gracefully to "unavailable" instead of crashing.

**Tech Stack:** React 18 · TypeScript · Vite · Vitest · Chrome Built-in AI APIs (`LanguageModel`, `Summarizer`, `Writer`, `Rewriter`, `Translator`, `LanguageDetector`).

**Verification note:** The Built-in AI globals only exist in Chrome/Edge with the Prompt API enabled, so the demos are **verified manually in that browser**. Only the pure `normalizeAvailability()` mapping is unit-tested in Vitest. Because the API surface is unstable (`window.ai` → `self.ai` → global classes; availability strings changed across origin trials), the exact call shapes below — especially streaming (cumulative vs delta) — **must be confirmed against the live Chrome build during implementation**; they are written defensively so absence/renames degrade to "unavailable".

**Spec:** `docs/specs/2026-06-12-builtin-ai-demo-design.md`

---

## File structure (locked decomposition)

```
apps/hub/src/
├─ lib/
│  ├─ builtinAI.ts            normalizeAvailability() + probeBuiltinAI() + types
│  └─ builtinAI.test.ts       unit tests for normalizeAvailability()
├─ hooks/
│  └─ useBuiltinSession.ts    shared availability→download→ready→run lifecycle hook
├─ components/demos/builtin/
│  ├─ BuiltinAIPanel.tsx      status grid for all 6 APIs
│  ├─ PromptDemo.tsx          LanguageModel streaming chat
│  ├─ SummarizerDemo.tsx      text → summary
│  ├─ TranslatorDemo.tsx      text + target language → translation
│  └─ LanguageDetectorDemo.tsx text → detected language(s)
└─ sections/BuiltinAI.tsx     MODIFIED: mount panel + 4 demos in place of placeholder
```

---

### Task 1: Detection lib + `normalizeAvailability` (TDD)

**Files:**
- Create: `apps/hub/src/lib/builtinAI.ts`
- Test: `apps/hub/src/lib/builtinAI.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/hub/src/lib/builtinAI.test.ts
import { describe, it, expect } from "vitest";
import { normalizeAvailability } from "./builtinAI";

describe("normalizeAvailability", () => {
  it("maps current 'available' strings", () => {
    expect(normalizeAvailability("available")).toBe("available");
    expect(normalizeAvailability("readily")).toBe("available"); // legacy
  });
  it("maps downloadable/downloading variants to 'downloadable'", () => {
    expect(normalizeAvailability("downloadable")).toBe("downloadable");
    expect(normalizeAvailability("downloading")).toBe("downloadable");
    expect(normalizeAvailability("after-download")).toBe("downloadable"); // legacy
  });
  it("treats everything else as 'unavailable'", () => {
    expect(normalizeAvailability("unavailable")).toBe("unavailable");
    expect(normalizeAvailability("no")).toBe("unavailable"); // legacy
    expect(normalizeAvailability(undefined)).toBe("unavailable");
    expect(normalizeAvailability("")).toBe("unavailable");
    expect(normalizeAvailability(42)).toBe("unavailable");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter @webai/hub test`
Expected: FAIL — cannot resolve `./builtinAI`.

- [ ] **Step 3: Implement `builtinAI.ts`**

```ts
// apps/hub/src/lib/builtinAI.ts

export type Availability = "available" | "downloadable" | "unavailable";

/** The six Built-in AI global classes Chrome exposes. */
export const API_KEYS = [
  "LanguageModel",
  "Summarizer",
  "Writer",
  "Rewriter",
  "Translator",
  "LanguageDetector",
] as const;
export type ApiKey = (typeof API_KEYS)[number];

export const API_LABELS: Record<ApiKey, { name: string; detail: string }> = {
  LanguageModel: { name: "Prompt API", detail: "LanguageModel — chat" },
  Summarizer: { name: "Summarizer", detail: "text → summary" },
  Writer: { name: "Writer", detail: "generate prose" },
  Rewriter: { name: "Rewriter", detail: "rephrase text" },
  Translator: { name: "Translator", detail: "translate text" },
  LanguageDetector: { name: "Language Detector", detail: "detect language" },
};

/**
 * Normalize the various availability strings the API has used across origin trials
 * (`readily`/`after-download`/`no` → and the current `available`/`downloadable`/
 * `downloading`/`unavailable`) into a coarse three-state enum. Unknown input → "unavailable".
 */
export function normalizeAvailability(raw: unknown): Availability {
  switch (raw) {
    case "available":
    case "readily":
      return "available";
    case "downloadable":
    case "downloading":
    case "after-download":
      return "downloadable";
    default:
      return "unavailable";
  }
}

async function probeOne(key: ApiKey): Promise<Availability> {
  try {
    const api = (self as any)[key];
    if (!api || typeof api.availability !== "function") return "unavailable";
    // Translator requires a language pair to report availability.
    const raw =
      key === "Translator"
        ? await api.availability({ sourceLanguage: "en", targetLanguage: "es" })
        : await api.availability();
    return normalizeAvailability(raw);
  } catch {
    return "unavailable";
  }
}

/** Probe all six APIs. Never rejects; absent/erroring APIs report "unavailable". */
export async function probeBuiltinAI(): Promise<Record<ApiKey, Availability>> {
  const entries = await Promise.all(
    API_KEYS.map(async (key) => [key, await probeOne(key)] as const),
  );
  return Object.fromEntries(entries) as Record<ApiKey, Availability>;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `pnpm --filter @webai/hub test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/hub/src/lib/builtinAI.ts apps/hub/src/lib/builtinAI.test.ts
git commit -m "feat(hub): built-in AI detection + normalizeAvailability (Slice 2)"
```

---

### Task 2: `useBuiltinSession` lifecycle hook

> Shared by all four demos. Detects availability on mount; on first `run`, lazily creates the session (showing download progress if the model must download), then runs. `reset()` drops the cached session (Translator uses it when the target language changes). No unit test — it is exercised by the demos and verified manually in Chrome.

**Files:**
- Create: `apps/hub/src/hooks/useBuiltinSession.ts`

- [ ] **Step 1: Implement the hook**

```ts
// apps/hub/src/hooks/useBuiltinSession.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeAvailability } from "../lib/builtinAI";

export type SessionState =
  | "detecting"
  | "unavailable"
  | "ready"
  | "downloading"
  | "running"
  | "error";

export interface BuiltinSessionConfig<S, I> {
  /** Resolve the API's raw availability value (or throw / be absent → unavailable). */
  availability: () => Promise<unknown>;
  /** Create the session; call `onProgress(0..1)` for download progress. */
  create: (onProgress: (p: number) => void) => Promise<S>;
  /** Run the session on `input`; call `onText` with the cumulative text to display. */
  run: (session: S, input: I, onText: (text: string) => void) => Promise<void>;
}

export function useBuiltinSession<S, I>(cfg: BuiltinSessionConfig<S, I>) {
  const [state, setState] = useState<SessionState>("detecting");
  const [progress, setProgress] = useState(0);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<S | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.resolve()
      .then(() => cfg.availability())
      .then((raw) => {
        if (!alive) return;
        setState(normalizeAvailability(raw) === "unavailable" ? "unavailable" : "ready");
      })
      .catch(() => {
        if (alive) setState("unavailable");
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    sessionRef.current = null;
    setOutput("");
    setError(null);
    setState((s) => (s === "unavailable" ? s : "ready"));
  }, []);

  const run = useCallback(
    async (input: I) => {
      setError(null);
      try {
        if (!sessionRef.current) {
          setState("downloading");
          setProgress(0);
          sessionRef.current = await cfg.create((p) => setProgress(p));
        }
        setState("running");
        setOutput("");
        await cfg.run(sessionRef.current, input, (text) => setOutput(text));
        setState("ready");
      } catch (e) {
        setError(String((e as Error)?.message ?? e));
        setState("error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { state, progress, output, error, run, reset };
}
```

- [ ] **Step 2: Typecheck (no test — browser-only logic)**

Run: `pnpm --filter @webai/hub build`
Expected: build succeeds (the hook is imported by demos next; this just confirms it compiles).
*Note:* if `build` reports "no input" because the hook isn't imported yet, skip — it's covered by Task 8's build.

- [ ] **Step 3: Commit**

```bash
git add apps/hub/src/hooks/useBuiltinSession.ts
git commit -m "feat(hub): useBuiltinSession lifecycle hook (Slice 2)"
```

---

### Task 3: `BuiltinAIPanel` — capability grid

**Files:**
- Create: `apps/hub/src/components/demos/builtin/BuiltinAIPanel.tsx`

- [ ] **Step 1: Implement the panel**

```tsx
// apps/hub/src/components/demos/builtin/BuiltinAIPanel.tsx
import React, { useEffect, useState } from "react";
import {
  API_KEYS,
  API_LABELS,
  probeBuiltinAI,
  type ApiKey,
  type Availability,
} from "../../../lib/builtinAI";

const GLYPH: Record<Availability, string> = {
  available: "✓",
  downloadable: "⤓",
  unavailable: "✕",
};
const STATUS_CLASS: Record<Availability, string> = {
  available: "yes",
  downloadable: "",
  unavailable: "no",
};

export default function BuiltinAIPanel() {
  const [avail, setAvail] = useState<Record<ApiKey, Availability> | null>(null);

  useEffect(() => {
    let alive = true;
    probeBuiltinAI().then((a) => {
      if (alive) setAvail(a);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">✨ Live: which Built-in AI APIs are available here?</div>
      </div>
      <div className="cap-grid">
        {API_KEYS.map((key: ApiKey) => {
          const a = avail?.[key];
          const cls = a ? STATUS_CLASS[a] : "";
          const glyph = a ? GLYPH[a] : "…";
          return (
            <div className="cap" key={key}>
              <div className={`status ${cls}`}>{glyph}</div>
              <div className="info">
                <div className="name">{API_LABELS[key].name}</div>
                <div className="detail">
                  {API_LABELS[key].detail}
                  {a === "downloadable" ? " · downloadable" : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/src/components/demos/builtin/BuiltinAIPanel.tsx
git commit -m "feat(hub): Built-in AI capability panel (Slice 2)"
```

---

### Task 4: `PromptDemo` — LanguageModel streaming chat

**Files:**
- Create: `apps/hub/src/components/demos/builtin/PromptDemo.tsx`

- [ ] **Step 1: Implement the demo**

> **VERIFY in Chrome:** `promptStreaming` chunk semantics have changed across versions (cumulative snapshots vs incremental deltas). This code treats chunks as **deltas** and accumulates. If output appears duplicated/repeated, switch `acc += chunk` to `acc = chunk`.

```tsx
// apps/hub/src/components/demos/builtin/PromptDemo.tsx
import React, { useState } from "react";
import { useBuiltinSession } from "../../../hooks/useBuiltinSession";

const UNAVAILABLE_NOTE =
  "Not available here. The Prompt API needs Chrome/Edge with Built-in AI enabled (chrome://flags → Prompt API for Gemini Nano) and the model downloaded.";

export default function PromptDemo() {
  const [input, setInput] = useState("Explain WebGPU in one sentence.");
  const { state, progress, output, error, run } = useBuiltinSession<any, string>({
    availability: () => (self as any).LanguageModel.availability(),
    create: (onProgress) =>
      (self as any).LanguageModel.create({
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: any) => onProgress(e.loaded ?? 0));
        },
      }),
    run: async (session, text, onText) => {
      let acc = "";
      const stream = await session.promptStreaming(text);
      for await (const chunk of stream) {
        acc += chunk;
        onText(acc);
      }
    },
  });

  const busy = state === "running" || state === "downloading";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">💬 Live: Prompt API (Gemini Nano)</div>
        <button
          className="btn"
          disabled={state === "unavailable" || busy || !input.trim()}
          onClick={() => run(input)}
        >
          {state === "downloading" ? `Downloading… ${(progress * 100).toFixed(0)}%` : "Prompt"}
        </button>
      </div>
      {state === "unavailable" ? (
        <div className="demo-out">{UNAVAILABLE_NOTE}</div>
      ) : (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={2}
            style={{ width: "100%", padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3", marginBottom: 8 }}
          />
          <div className={"demo-out" + (error ? " err" : "")}>
            {error ? `❌ ${error}` : output || <span className="muted">Reply streams here.</span>}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/src/components/demos/builtin/PromptDemo.tsx
git commit -m "feat(hub): Built-in AI Prompt demo (Slice 2)"
```

---

### Task 5: `SummarizerDemo` — text → summary

**Files:**
- Create: `apps/hub/src/components/demos/builtin/SummarizerDemo.tsx`

- [ ] **Step 1: Implement the demo**

```tsx
// apps/hub/src/components/demos/builtin/SummarizerDemo.tsx
import React, { useState } from "react";
import { useBuiltinSession } from "../../../hooks/useBuiltinSession";

const UNAVAILABLE_NOTE =
  "Not available here. The Summarizer API needs Chrome/Edge with Built-in AI enabled and the model downloaded.";

const SAMPLE =
  "The new web AI stack runs models directly in the browser. WebGPU provides the compute, " +
  "runtimes like WebLLM and Transformers.js load quantized models, and the browser can even " +
  "ship its own model via the Prompt API. Everything runs on-device: private, offline-capable, " +
  "and free of server costs.";

export default function SummarizerDemo() {
  const [input, setInput] = useState(SAMPLE);
  const { state, progress, output, error, run } = useBuiltinSession<any, string>({
    availability: () => (self as any).Summarizer.availability(),
    create: (onProgress) =>
      (self as any).Summarizer.create({
        type: "tldr",
        format: "plain-text",
        length: "short",
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: any) => onProgress(e.loaded ?? 0));
        },
      }),
    run: async (session, text, onText) => {
      const summary = await session.summarize(text);
      onText(summary);
    },
  });

  const busy = state === "running" || state === "downloading";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">📝 Live: Summarizer API</div>
        <button
          className="btn"
          disabled={state === "unavailable" || busy || !input.trim()}
          onClick={() => run(input)}
        >
          {state === "downloading" ? `Downloading… ${(progress * 100).toFixed(0)}%` : "Summarize"}
        </button>
      </div>
      {state === "unavailable" ? (
        <div className="demo-out">{UNAVAILABLE_NOTE}</div>
      ) : (
        <>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3", marginBottom: 8 }}
          />
          <div className={"demo-out" + (error ? " err" : "")}>
            {error ? `❌ ${error}` : output || <span className="muted">Summary appears here.</span>}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/src/components/demos/builtin/SummarizerDemo.tsx
git commit -m "feat(hub): Built-in AI Summarizer demo (Slice 2)"
```

---

### Task 6: `TranslatorDemo` — text + target language → translation

> Translator availability and sessions are per language-pair, so this demo calls `reset()` when the target language changes (dropping the cached session so the next run creates one for the new pair). Source is fixed to English.

**Files:**
- Create: `apps/hub/src/components/demos/builtin/TranslatorDemo.tsx`

- [ ] **Step 1: Implement the demo**

```tsx
// apps/hub/src/components/demos/builtin/TranslatorDemo.tsx
import React, { useRef, useState } from "react";
import { useBuiltinSession } from "../../../hooks/useBuiltinSession";

const UNAVAILABLE_NOTE =
  "Not available here. The Translator API needs Chrome/Edge with Built-in AI enabled and the language pack downloaded.";

const TARGETS: Array<{ code: string; label: string }> = [
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "hi", label: "Hindi" },
  { code: "ja", label: "Japanese" },
];

export default function TranslatorDemo() {
  const [input, setInput] = useState("The browser is the model.");
  const [target, setTarget] = useState("es");
  const targetRef = useRef(target);
  targetRef.current = target;

  const { state, progress, output, error, run, reset } = useBuiltinSession<any, string>({
    availability: () =>
      (self as any).Translator.availability({ sourceLanguage: "en", targetLanguage: "es" }),
    create: (onProgress) =>
      (self as any).Translator.create({
        sourceLanguage: "en",
        targetLanguage: targetRef.current,
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: any) => onProgress(e.loaded ?? 0));
        },
      }),
    run: async (session, text, onText) => {
      const translated = await session.translate(text);
      onText(translated);
    },
  });

  const busy = state === "running" || state === "downloading";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🌐 Live: Translator API (English →)</div>
        <button
          className="btn"
          disabled={state === "unavailable" || busy || !input.trim()}
          onClick={() => run(input)}
        >
          {state === "downloading" ? `Downloading… ${(progress * 100).toFixed(0)}%` : "Translate"}
        </button>
      </div>
      {state === "unavailable" ? (
        <div className="demo-out">{UNAVAILABLE_NOTE}</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3" }}
            />
            <select
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                reset();
              }}
              style={{ padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3" }}
            >
              {TARGETS.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className={"demo-out" + (error ? " err" : "")}>
            {error ? `❌ ${error}` : output || <span className="muted">Translation appears here.</span>}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/src/components/demos/builtin/TranslatorDemo.tsx
git commit -m "feat(hub): Built-in AI Translator demo (Slice 2)"
```

---

### Task 7: `LanguageDetectorDemo` — text → detected language(s)

**Files:**
- Create: `apps/hub/src/components/demos/builtin/LanguageDetectorDemo.tsx`

- [ ] **Step 1: Implement the demo**

```tsx
// apps/hub/src/components/demos/builtin/LanguageDetectorDemo.tsx
import React, { useState } from "react";
import { useBuiltinSession } from "../../../hooks/useBuiltinSession";

const UNAVAILABLE_NOTE =
  "Not available here. The Language Detector API needs Chrome/Edge with Built-in AI enabled and the model downloaded.";

export default function LanguageDetectorDemo() {
  const [input, setInput] = useState("Bonjour, comment ça va aujourd'hui ?");
  const { state, progress, output, error, run } = useBuiltinSession<any, string>({
    availability: () => (self as any).LanguageDetector.availability(),
    create: (onProgress) =>
      (self as any).LanguageDetector.create({
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: any) => onProgress(e.loaded ?? 0));
        },
      }),
    run: async (session, text, onText) => {
      const results: Array<{ detectedLanguage: string; confidence: number }> =
        await session.detect(text);
      const top = results
        .slice(0, 3)
        .map((r) => `${r.detectedLanguage} — ${(r.confidence * 100).toFixed(1)}%`)
        .join("\n");
      onText(top || "no result");
    },
  });

  const busy = state === "running" || state === "downloading";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🔤 Live: Language Detector API</div>
        <button
          className="btn"
          disabled={state === "unavailable" || busy || !input.trim()}
          onClick={() => run(input)}
        >
          {state === "downloading" ? `Downloading… ${(progress * 100).toFixed(0)}%` : "Detect"}
        </button>
      </div>
      {state === "unavailable" ? (
        <div className="demo-out">{UNAVAILABLE_NOTE}</div>
      ) : (
        <>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{ width: "100%", padding: 8, borderRadius: 8, background: "#070a0f", border: "1px solid #2a3342", color: "#e6edf3", marginBottom: 8 }}
          />
          <div className={"demo-out" + (error ? " err" : "")}>
            {error ? `❌ ${error}` : output || <span className="muted">Detected language(s) appear here.</span>}
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/src/components/demos/builtin/LanguageDetectorDemo.tsx
git commit -m "feat(hub): Built-in AI Language Detector demo (Slice 2)"
```

---

### Task 8: Wire everything into `BuiltinAI.tsx`

**Files:**
- Modify: `apps/hub/src/sections/BuiltinAI.tsx`

- [ ] **Step 1: Replace the placeholder demo block with the panel + 4 demos**

In `apps/hub/src/sections/BuiltinAI.tsx`, replace this block:

```tsx
      <div className="demo">
        <div className="demo-head">
          <div className="title">✨ Live: is Built-in AI available here?</div>
        </div>
        <div className="demo-out">…demo coming in next task…</div>
      </div>
```

with:

```tsx
      <BuiltinAIPanel />
      <PromptDemo />
      <SummarizerDemo />
      <TranslatorDemo />
      <LanguageDetectorDemo />
```

- [ ] **Step 2: Add the imports** at the top of `BuiltinAI.tsx` (after `import React from "react";`)

```tsx
import BuiltinAIPanel from "../components/demos/builtin/BuiltinAIPanel";
import PromptDemo from "../components/demos/builtin/PromptDemo";
import SummarizerDemo from "../components/demos/builtin/SummarizerDemo";
import TranslatorDemo from "../components/demos/builtin/TranslatorDemo";
import LanguageDetectorDemo from "../components/demos/builtin/LanguageDetectorDemo";
```

- [ ] **Step 3: Build to verify everything compiles**

Run: `pnpm --filter @webai/hub build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 4: Manual verification in the browser**

Run: `pnpm --filter @webai/hub dev`, open the **Built-in AI** section.

In **any** browser:
  - The page does not crash; the capability panel renders 6 rows.
  - On a non-Chrome / flags-off browser, every API shows ✕ and each demo shows its "Not available here…" note (no enabled dead buttons).

In **Chrome/Edge with Built-in AI enabled** (`chrome://flags` → "Prompt API for Gemini Nano" + "Optimization Guide On Device Model"; restart):
  - Panel reflects real availability (✓ / ⤓ / ✕ per API).
  - **Prompt:** click Prompt → if downloadable, progress shows, then a reply streams in. (If text duplicates, apply the cumulative-vs-delta fix noted in Task 4.)
  - **Summarizer:** Summarize → a short summary appears.
  - **Translator:** pick a language → Translate → translated text; changing language re-runs cleanly.
  - **Language Detector:** Detect → language code(s) with confidence.

- [ ] **Step 5: Commit**

```bash
git add apps/hub/src/sections/BuiltinAI.tsx
git commit -m "feat(hub): mount Built-in AI panel + 4 live demos (Slice 2)"
```

**✅ Slice 2 done:** the Built-in AI section detects all 6 APIs and runs 4 live demos against on-device Gemini Nano, degrading gracefully where unavailable.

---

## Self-review notes

- **Spec coverage:** capability panel (6 APIs) → Task 3; Prompt/Summarizer/Translator/LanguageDetector demos → Tasks 4–7; `normalizeAvailability` + `probeBuiltinAI` → Task 1; shared lifecycle hook → Task 2; graceful degradation (unavailable note + try/catch probes) → Tasks 1–7; mount/replace placeholder → Task 8; testing split (unit for `normalizeAvailability`, manual for the rest) → Tasks 1 + 8.
- **Type consistency:** `Availability`, `ApiKey`, `API_KEYS`, `API_LABELS`, `normalizeAvailability`, `probeBuiltinAI` defined in Task 1 and used identically in Tasks 2–3. `useBuiltinSession` + `BuiltinSessionConfig` (`availability`/`create`/`run`) defined in Task 2 and consumed identically in Tasks 4–7 (`reset` used in Task 6). Demo components are default exports, imported as such in Task 8.
- **Known verification gaps (honest):** (1) exact Built-in AI global names and method shapes (`availability`/`create`/`monitor`/`promptStreaming`/`summarize`/`translate`/`detect`) must be confirmed against the live Chrome build — written defensively so absence → "unavailable"; (2) `promptStreaming` cumulative-vs-delta behavior is flagged in Task 4 with the one-line fix.
- **Deferred (out of scope):** Writer/Rewriter interactive demos (panel status only); any `@webai/core` built-in-AI engine.
```
