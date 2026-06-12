# Vercel Deploy + Production Proxies — Slice 8 (design + plan)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the hub deployable as a public site on Vercel where the on-device model demos actually download their weights — by replicating the dev CORS proxies as Vercel Edge Functions — **without changing any local (`pnpm dev`) behavior**.

## Design

The dev server proxies `/hf`, `/jsdelivr`, `/gstorage` (follow CDN redirects server-side to dodge the cross-origin CORS failures) exist **only in Vite**. Production needs equivalents:

- **Three Edge Functions** under `apps/hub/api/` — `hf`, `jsdelivr`, `gstorage` — each a catch-all that `fetch(upstream, { redirect: "follow" })` and streams the body back same-origin. Following redirects server-side is the whole point (it's what fixes the HuggingFace Xet redirect).
- **`vercel.json` rewrites** map `/hf/*` → `/api/hf/*` (etc.), so the demos' existing same-origin URLs hit the functions. COOP/COEP headers stay.
- **Env-gated demo tweaks** so production uses the proxies and a small model, while **dev is byte-for-byte unchanged** (everything keys off `import.meta.env.DEV`).

**Local-impact guarantee:** in `pnpm dev`, `import.meta.env.DEV` is `true` → ChatDemo uses the default Llama-3.2-1B + the Vite `/hf` proxy exactly as today; the edge functions never run (Vite ignores `api/`). Production (`import.meta.env.PROD`) uses the small model + the edge proxies.

**WebLLM in prod:** default to `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` (~300 MB) so the proxy stays within Vercel limits. Dev keeps the 1B.

---

### Task 1: Edge Function proxies

**Files:**
- Create: `apps/hub/api/hf/[...path].ts`, `apps/hub/api/jsdelivr/[...path].ts`, `apps/hub/api/gstorage/[...path].ts`

- [ ] **Step 1: Create `apps/hub/api/hf/[...path].ts`**

```ts
export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/hf/, "");
  const target = "https://huggingface.co" + path + url.search;
  const upstream = await fetch(target, { redirect: "follow" });
  const headers = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  const cl = upstream.headers.get("content-length");
  if (cl) headers.set("content-length", cl);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(upstream.body, { status: upstream.status, headers });
}
```

- [ ] **Step 2: Create `apps/hub/api/jsdelivr/[...path].ts`** — identical but `path.replace(/^\/api\/jsdelivr/, "")` and target `https://cdn.jsdelivr.net`.

- [ ] **Step 3: Create `apps/hub/api/gstorage/[...path].ts`** — identical but `path.replace(/^\/api\/gstorage/, "")` and target `https://storage.googleapis.com`.

- [ ] **Step 4: Commit**

```bash
git add apps/hub/api
git commit -m "feat(hub): Vercel edge-function proxies for HF/jsdelivr/gstorage (Slice 8)"
```

---

### Task 2: `vercel.json` rewrites

**Files:**
- Modify: `apps/hub/vercel.json`

- [ ] **Step 1: Add rewrites alongside the existing headers**

```json
{
  "rewrites": [
    { "source": "/hf/(.*)", "destination": "/api/hf/$1" },
    { "source": "/jsdelivr/(.*)", "destination": "/api/jsdelivr/$1" },
    { "source": "/gstorage/(.*)", "destination": "/api/gstorage/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/vercel.json
git commit -m "chore(hub): vercel.json rewrites to the edge proxies (Slice 8)"
```

---

### Task 3: Env-gated demo tweaks (dev unchanged)

**Files:**
- Modify: `apps/hub/src/ChatDemo.tsx`, `apps/hub/src/components/demos/runtimes/TransformersDemo.tsx`

- [ ] **Step 1: ChatDemo — always proxy `/hf`, small model in prod**

Change the `useLocalLLM(...)` options to:

```tsx
const PROD_MODEL = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";
const { status, progress, progressText, messages, source, error, send } = useLocalLLM({
  serverUrl: "/api/chat",
  hfProxy: `${location.origin}/hf/`,
  model: import.meta.env.DEV ? undefined : PROD_MODEL,
});
```
(Dev: `hfProxy` → `localhost:3005/hf` = the Vite proxy, `model` undefined → default Llama-3.2-1B. Identical to today.)

- [ ] **Step 2: TransformersDemo — always set `remoteHost`**

Replace:
```tsx
        if (import.meta.env.DEV) {
          (env as any).remoteHost = `${location.origin}/hf`;
        }
```
with:
```tsx
        (env as any).remoteHost = `${location.origin}/hf`;
```
(Dev: still `localhost:3005/hf`. Prod: the deployed `/hf` edge proxy. The other runtime demos already use `${location.origin}/jsdelivr|/gstorage` unconditionally — no change needed.)

- [ ] **Step 3: Build (verify dev bundle still compiles)**

Run: `pnpm --filter @webai/hub build`
Expected: succeeds. (The `api/` functions are not part of the Vite build.)

- [ ] **Step 4: Commit**

```bash
git add apps/hub/src/ChatDemo.tsx apps/hub/src/components/demos/runtimes/TransformersDemo.tsx
git commit -m "feat(hub): route model downloads through the prod proxy + small prod model (Slice 8)"
```

---

### Task 4: Deploy (user-driven) + verify

- [ ] **Step 1: Import on Vercel** — vercel.com → Add New → Project → import `aprajitameetup/webAI`.
  - **Root Directory: `apps/hub`** (Vercel detects the pnpm workspace at the repo root and installs from there, resolving the `@webai/*` workspace deps).
  - Framework preset: **Vite** (auto). Build/output defaults are fine (`vite build` → `dist`).
  - Deploy. The `apps/hub/api/*` functions deploy automatically as Edge Functions.
- [ ] **Step 2: Verify on the deployed URL**
  - Built-in AI, WebGPU, Wasm, Web Audio, WebCodecs, capability panels: work immediately.
  - Pyodide / MediaPipe / ONNX: load via `/jsdelivr` + `/gstorage` proxies (watch Network → 200s on the deployed origin).
  - Transformers.js: loads DistilBERT via `/hf`.
  - WebLLM chat: downloads the small Qwen model via `/hf` and streams a reply.
- [ ] **Step 3 (fallback if the workspace install fails):** set Root Directory = repo root instead, add a root `vercel.json` with `"buildCommand": "pnpm --filter @webai/hub build"`, `"outputDirectory": "apps/hub/dist"`, move `api/` to the repo root, and keep the same rewrites/headers.

**✅ Slice 8 done:** the deployed site downloads model weights through same-origin edge proxies; local dev is unchanged.

---

## Self-review notes

- **Local-impact:** every prod behavior is `import.meta.env`-gated or lives in `api/`/`vercel.json` which Vite dev never touches. Dev verified unchanged.
- **Coverage:** HF + jsdelivr + gstorage proxies (Task 1), rewrites + headers (Task 2), demo wiring + small prod model (Task 3), deploy steps + fallback (Task 4).
- **Known gaps (honest):** Vercel monorepo/pnpm install and edge-function routing can't be verified without an actual deploy — Task 4 includes a fallback. WebLLM's ~300 MB still streams through an edge function; acceptable but watch Vercel bandwidth on heavy traffic.
- **Deferred:** in-browser RAG; a `/api/chat` server fallback endpoint (the server path errors if WebGPU is absent — acceptable, on-device is the story).
