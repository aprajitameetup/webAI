# MediaPipe Demo — Slice 5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live MediaPipe demo to the hub's Runtimes section — face-landmark detection on an uploaded photo, drawing the 468-point face mesh on a canvas.

**Architecture:** Hub-only. A `MediaPipeDemo` component lazy-imports `@mediapipe/tasks-vision`, loads the wasm fileset via the existing `/jsdelivr` proxy and the `.task` model via a new `/gstorage` proxy (both same-origin to satisfy our COEP page), runs `FaceLandmarker` in IMAGE mode, and overlays the mesh with `DrawingUtils`. Mounted after `PyodideDemo` in `Runtimes.tsx`.

**Tech Stack:** React 18 · TypeScript · Vite · `@mediapipe/tasks-vision`.

**Verification note:** Wraps a third-party WASM vision runtime that downloads its model at runtime, so it is **verified manually in-browser**, not unit-tested.

**Spec:** `docs/specs/2026-06-12-mediapipe-demo-design.md`

---

### Task 1: Add dependency

**Files:**
- Modify: `apps/hub/package.json`

- [ ] **Step 1: Add to `dependencies`** (alongside the other runtime libs)

```json
    "@mediapipe/tasks-vision": "0.10.18"
```

- [ ] **Step 2: Install**

Run: `pnpm install`
Expected: resolves; if pnpm reports ignored build scripts, add them to `pnpm-workspace.yaml` `allowBuilds` with `false` (same as Slice 3) so install exits clean.

- [ ] **Step 3: Commit**

```bash
git add apps/hub/package.json pnpm-lock.yaml pnpm-workspace.yaml
git commit -m "chore(hub): add @mediapipe/tasks-vision dep (Slice 5)"
```

---

### Task 2: Add the `/gstorage` dev proxy

**Files:**
- Modify: `apps/hub/vite.config.ts`

- [ ] **Step 1: Add a `/gstorage` entry to `server.proxy`** (alongside `/hf` and `/jsdelivr`)

```ts
      // MediaPipe model (.task) files live on storage.googleapis.com; proxy them
      // same-origin to satisfy our cross-origin-isolated (COEP) page.
      "/gstorage": {
        target: "https://storage.googleapis.com",
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/gstorage/, ""),
      },
```

- [ ] **Step 2: Commit** (dev server auto-restarts on config change)

```bash
git add apps/hub/vite.config.ts
git commit -m "chore(hub): add /gstorage dev proxy for MediaPipe models (Slice 5)"
```

---

### Task 3: MediaPipeDemo component

**Files:**
- Create: `apps/hub/src/components/demos/runtimes/MediaPipeDemo.tsx`

- [ ] **Step 1: Implement the demo**

```tsx
// apps/hub/src/components/demos/runtimes/MediaPipeDemo.tsx
import React, { useRef, useState } from "react";

const MP_VERSION = "0.10.18";
const WASM_DIR = `${location.origin}/jsdelivr/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL_URL = `${location.origin}/gstorage/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`;

type Phase = "idle" | "loading" | "running" | "ready" | "error";

export default function MediaPipeDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [output, setOutput] = useState("");
  const [hasImage, setHasImage] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<any>(null);

  function drawImage(img: HTMLImageElement) {
    const c = canvasRef.current;
    if (!c) return;
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d")!.drawImage(img, 0, 0);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      drawImage(img);
    };
    img.src = URL.createObjectURL(file);
    setHasImage(true);
    setOutput("");
    setPhase("idle");
  }

  async function ensureLandmarker() {
    if (landmarkerRef.current) return landmarkerRef.current;
    setPhase("loading");
    setOutput("Loading MediaPipe…");
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_DIR);
    landmarkerRef.current = await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: "IMAGE",
      numFaces: 2,
    });
    landmarkerRef.current.__vision = vision; // keep DrawingUtils + connectors handy
    return landmarkerRef.current;
  }

  async function detect() {
    if (!imgRef.current) return;
    try {
      const landmarker = await ensureLandmarker();
      setPhase("running");
      const result = landmarker.detect(imgRef.current);
      drawImage(imgRef.current);
      const vision = landmarker.__vision;
      const ctx = canvasRef.current!.getContext("2d")!;
      const drawingUtils = new vision.DrawingUtils(ctx);
      for (const landmarks of result.faceLandmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          vision.FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          { color: "#30c8ff55", lineWidth: 1 },
        );
        drawingUtils.drawConnectors(
          landmarks,
          vision.FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
          { color: "#30c8ff", lineWidth: 2 },
        );
      }
      const n = result.faceLandmarks.length;
      setOutput(n ? `Detected ${n} face(s) · 468 landmarks each` : "No face detected — try a clearer face photo.");
      setPhase("ready");
    } catch (e: any) {
      setPhase("error");
      setOutput("❌ " + (e?.message ?? String(e)));
    }
  }

  const busy = phase === "loading" || phase === "running";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">👤 Live: MediaPipe — face landmarks</div>
        <button className="btn" disabled={busy || !hasImage} onClick={detect}>
          {phase === "loading" ? "Loading…" : "Detect faces"}
        </button>
      </div>
      <div className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
        Runtime: <b>MediaPipe Tasks (vision)</b> · FaceLandmarker — 468 3D landmarks per face, on-device
      </div>
      <input type="file" accept="image/*" onChange={onPick} style={{ marginBottom: 4, color: "#e6edf3" }} />
      <div className="muted" style={{ marginBottom: 8, fontSize: 12 }}>
        Tip: use a clear, front-facing face photo.
      </div>
      <canvas
        ref={canvasRef}
        style={{ maxWidth: "100%", maxHeight: 280, height: "auto", borderRadius: 8, display: hasImage ? "block" : "none", marginBottom: 8 }}
      />
      <div className={"demo-out" + (phase === "error" ? " err" : "")}>
        {output || <span className="muted">Pick a face photo; MediaPipe maps the face mesh on-device.</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/src/components/demos/runtimes/MediaPipeDemo.tsx
git commit -m "feat(hub): MediaPipe face-landmark demo (Slice 5)"
```

---

### Task 4: Mount in the Runtimes section

**Files:**
- Modify: `apps/hub/src/sections/Runtimes.tsx`

- [ ] **Step 1: Add the import** (after `import PyodideDemo ...`)

```tsx
import MediaPipeDemo from "../components/demos/runtimes/MediaPipeDemo";
```

- [ ] **Step 2: Mount it** after `<PyodideDemo />`

Replace:
```tsx
      <PyodideDemo />
    </>
```
with:
```tsx
      <PyodideDemo />
      <MediaPipeDemo />
    </>
```

- [ ] **Step 3: Build to verify it compiles**

Run: `pnpm --filter @webai/hub build`
Expected: build succeeds, no TypeScript errors.

- [ ] **Step 4: Manual verification in the browser**

Run: `pnpm --filter @webai/hub dev`, open **Models & Runtimes** → MediaPipe demo.
- Pick a clear front-facing face photo → **Detect faces** → first run loads MediaPipe (Network → `localhost:3005/jsdelivr/...` wasm + `localhost:3005/gstorage/...` model, 200s), then the face mesh is drawn over the photo and output reads "Detected 1 face(s) · 468 landmarks each".
- Try a group photo → multiple meshes (up to numFaces=2).
- Try a non-face image → "No face detected…".
- If asset loading errors with CORS/COEP, confirm both `/jsdelivr` and `/gstorage` proxies exist and the dev server restarted.

- [ ] **Step 5: Commit**

```bash
git add apps/hub/src/sections/Runtimes.tsx
git commit -m "feat(hub): mount MediaPipe demo in Runtimes (Slice 5)"
```

**✅ Slice 5 done:** the Runtimes section now also runs MediaPipe face-mesh detection on-device.

---

## Self-review notes

- **Spec coverage:** dep → Task 1; `/gstorage` proxy → Task 2; MediaPipeDemo (lazy import, proxied wasm+model, FaceLandmarker IMAGE mode, DrawingUtils mesh overlay, error handling) → Task 3; mount → Task 4; manual testing → Task 4 Step 4.
- **Type consistency:** `MediaPipeDemo` default export imported as such in Task 4. `MP_VERSION` used for both the npm dep (Task 1) and the wasm path (Task 3) — keep them equal on any bump. `Phase` local.
- **Known verification gaps (honest):** wasm/model load through `/jsdelivr` + `/gstorage` proxies under COEP — flagged with the proxies as the fix; `FilesetResolver`/`FaceLandmarker`/`DrawingUtils` API + the `FACE_LANDMARKS_*` connector constants are confirmed at run time against the installed `@mediapipe/tasks-vision@0.10.18`.
- **Deferred:** webcam/video mode, hand/pose/gesture tasks, ONNX Runtime Web (MNIST) — the final runtime slice; production asset proxy.
```
