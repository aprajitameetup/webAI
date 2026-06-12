# Capability Demos (WASM + Web Audio + WebCodecs) — Slice 7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three live capability demos — WebAssembly (JS-vs-WASM benchmark) in Compute, and Web Audio (mic waveform) + WebCodecs (raw camera frames) in Multimodal.

**Architecture:** Hub-only. Three self-contained components in `components/demos/`, following the existing mini-demo pattern, mounted in `Compute.tsx` and `Multimodal.tsx`. The WASM module is a hand-assembled byte array verified in Node. Media demos degrade gracefully when permission/support is missing.

**Tech Stack:** React 18 · TypeScript · WebAssembly · Web Audio API · WebCodecs (`MediaStreamTrackProcessor`).

**Verification note:** Browser media/compute APIs need real hardware/permissions, so verified **manually in-browser**. WASM bytes verified in Node.

**Spec:** `docs/specs/2026-06-12-capability-demos-design.md`

---

### Task 1: WebAssembly benchmark demo (Compute)

**Files:**
- Create: `apps/hub/src/components/demos/WasmDemo.tsx`
- Modify: `apps/hub/src/sections/Compute.tsx`

- [ ] **Step 1: Create `WasmDemo.tsx`** (bytes verified: `sumsq(1000)=332833500`)

```tsx
import React, { useRef, useState } from "react";

// Hand-assembled module exporting sumsq(n:i32)->i64 = sum of i*i for i in [0,n).
// Verified in Node before embedding.
const WASM_BYTES = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0,
  1, 6, 1, 96, 1, 127, 1, 126,
  3, 2, 1, 0,
  7, 9, 1, 5, 115, 117, 109, 115, 113, 0, 0,
  10, 44, 1, 42,
  2, 1, 127, 1, 126,
  2, 64, 3, 64,
  32, 1, 32, 0, 79, 13, 1,
  32, 2, 32, 1, 173, 32, 1, 173, 126, 124, 33, 2,
  32, 1, 65, 1, 106, 33, 1,
  12, 0, 11, 11,
  32, 2, 11,
]);
const N = 50_000_000;

export default function WasmDemo() {
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const fnRef = useRef<((n: number) => bigint) | null>(null);

  async function run() {
    setBusy(true);
    setOutput("Running…");
    try {
      if (!fnRef.current) {
        const { instance } = await WebAssembly.instantiate(WASM_BYTES);
        fnRef.current = instance.exports.sumsq as (n: number) => bigint;
      }
      const t0 = performance.now();
      fnRef.current(N);
      const t1 = performance.now();
      let acc = 0;
      for (let i = 0; i < N; i++) acc += i * i;
      const t2 = performance.now();
      const wms = t1 - t0;
      const jms = t2 - t1;
      setOutput(
        `WASM:    ${wms.toFixed(1)} ms\n` +
          `JS:      ${jms.toFixed(1)} ms\n` +
          `speedup: ${(jms / wms).toFixed(1)}×\n` +
          `(sum of i² for i < ${N.toLocaleString()}, tight loop)`,
      );
    } catch (e: any) {
      setOutput("❌ " + (e?.message ?? String(e)));
    }
    setBusy(false);
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🧩 Live: WebAssembly vs JS — tight-loop benchmark</div>
        <button className="btn" disabled={busy} onClick={run}>
          {busy ? "Running…" : "Run benchmark"}
        </button>
      </div>
      <div className="demo-out" style={{ whiteSpace: "pre-wrap" }}>
        {output || <span className="muted">Runs the same integer loop in a tiny WASM module and in JS, and times both.</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mount in `Compute.tsx`** — add `import WasmDemo from "../components/demos/WasmDemo";` at the top, and split the second `dangerouslySetInnerHTML` block so `<WasmDemo />` sits right after the WebAssembly heading/paragraph (before the WebNN heading). Concretely, end the first part after the WASM `takeaway` div, insert `<WasmDemo />`, then open a new block starting at the WebNN `<h2>`:

```tsx
      <WebGPUDemo />

      <div dangerouslySetInnerHTML={{ __html: `
        <h2>🧩 WebAssembly <span class="pill ship">Shipping</span></h2>
        <p>Near-native CPU performance in the browser. The <strong>fallback path</strong> when WebGPU isn't available, and the foundation for ONNX Runtime Web and llama.cpp ports. Key extensions for AI: <strong>SIMD</strong> (vectorised math), <strong>threads</strong> (needs SharedArrayBuffer), and <strong>Wasm GC</strong>.</p>
        <div class="takeaway"><b>Mental model:</b> WebGPU = the fast lane (GPU), Wasm = the reliable lane (CPU). Good runtimes try WebGPU and fall back to Wasm automatically.</div>
      ` }} />

      <WasmDemo />

      <div dangerouslySetInnerHTML={{ __html: `
        <h2>🧠 WebNN — Web Neural Network API <span class="pill new">The new one</span></h2>
        <p>This is the piece most "web AI" overviews miss. WebNN is a <strong>W3C standard built specifically for ML inference</strong>. Instead of you hand-writing compute shaders, you describe a <em>graph</em> of neural-network ops and the browser routes it to the OS's native accelerator — <strong>DirectML</strong> (Windows), <strong>Core ML</strong> (Apple), <strong>NNAPI</strong> (Android), even NPUs.</p>
        <ul>
          <li><strong>WebGPU</strong> = low-level, you build the kernels.</li>
          <li><strong>WebNN</strong> = high-level, you describe the model and the OS picks the best hardware (including dedicated AI chips / NPUs).</li>
        </ul>
        <pre><code><span class="tok-key">const</span> context = <span class="tok-key">await</span> navigator.ml.<span class="tok-fn">createContext</span>({ deviceType: <span class="tok-str">'gpu'</span> });
<span class="tok-key">const</span> builder = <span class="tok-key">new</span> <span class="tok-fn">MLGraphBuilder</span>(context);
<span class="tok-com">// describe ops: conv2d, matmul, relu… then build() and compute()</span></code></pre>
        <div class="warn"><b>Status:</b> WebNN is still behind flags in most browsers (Chrome/Edge origin trials). Worth knowing deeply because it's where the platform is heading — and it's the part of the stack most developers haven't met yet.</div>
      ` }} />
```

- [ ] **Step 3: Build**

Run: `pnpm --filter @webai/hub build`
Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/hub/src/components/demos/WasmDemo.tsx apps/hub/src/sections/Compute.tsx
git commit -m "feat(hub): WebAssembly vs JS benchmark demo (Slice 7)"
```

---

### Task 2: Web Audio mic-waveform demo (Multimodal)

**Files:**
- Create: `apps/hub/src/components/demos/WebAudioDemo.tsx`

- [ ] **Step 1: Create `WebAudioDemo.tsx`**

```tsx
import React, { useRef, useState } from "react";

export default function WebAudioDemo() {
  const [active, setActive] = useState(false);
  const [msg, setMsg] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const canvas = canvasRef.current!;
      const c = canvas.getContext("2d")!;
      setActive(true);
      setMsg("");
      const draw = () => {
        analyser.getByteTimeDomainData(data);
        c.fillStyle = "#070a0f";
        c.fillRect(0, 0, canvas.width, canvas.height);
        c.lineWidth = 2;
        c.strokeStyle = "#30c8ff";
        c.beginPath();
        const slice = canvas.width / data.length;
        let x = 0;
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128 - 1;
          sum += v * v;
          const y = (v * 0.5 + 0.5) * canvas.height;
          if (i === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
          x += slice;
        }
        c.stroke();
        const rms = Math.sqrt(sum / data.length);
        c.fillStyle = "#9aa7b5";
        c.font = "12px monospace";
        c.fillText(`volume: ${(rms * 100).toFixed(0)}%`, 8, 16);
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch (e: any) {
      setMsg("❌ " + (e?.message ?? String(e)));
      setActive(false);
    }
  }

  function stop() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    setActive(false);
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🔊 Live: Web Audio — mic waveform</div>
        <button className="btn" onClick={active ? stop : start}>
          {active ? "Stop mic" : "Start mic"}
        </button>
      </div>
      <div className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
        Captures mic audio via Web Audio (AnalyserNode). AudioWorklet is the production real-time-thread path.
      </div>
      <canvas ref={canvasRef} width={480} height={100} style={{ width: "100%", maxWidth: 480, height: 100, borderRadius: 8, border: "1px solid #2a3342", display: "block" }} />
      {msg && <div className="demo-out err" style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/src/components/demos/WebAudioDemo.tsx
git commit -m "feat(hub): Web Audio mic-waveform demo (Slice 7)"
```

---

### Task 3: WebCodecs raw-frames demo (Multimodal)

**Files:**
- Create: `apps/hub/src/components/demos/WebCodecsDemo.tsx`

- [ ] **Step 1: Create `WebCodecsDemo.tsx`**

```tsx
import React, { useRef, useState } from "react";

const SUPPORTED =
  typeof (window as any).MediaStreamTrackProcessor !== "undefined" &&
  typeof (window as any).VideoFrame !== "undefined";

export default function WebCodecsDemo() {
  const [active, setActive] = useState(false);
  const [info, setInfo] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopRef = useRef(false);

  async function start() {
    try {
      stopRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const processor = new (window as any).MediaStreamTrackProcessor({ track });
      const reader = processor.readable.getReader();
      const canvas = canvasRef.current!;
      const c = canvas.getContext("2d")!;
      setActive(true);
      setInfo("");
      let count = 0;
      while (!stopRef.current) {
        const { value: frame, done } = await reader.read();
        if (done || !frame) break;
        canvas.width = frame.displayWidth;
        canvas.height = frame.displayHeight;
        c.drawImage(frame, 0, 0);
        count++;
        if (count % 5 === 0) {
          setInfo(`frame ${count} · ${frame.displayWidth}×${frame.displayHeight} — raw VideoFrame via WebCodecs`);
        }
        frame.close();
      }
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
    } catch (e: any) {
      setInfo("❌ " + (e?.message ?? String(e)));
      setActive(false);
    }
  }

  function stop() {
    stopRef.current = true;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setActive(false);
  }

  if (!SUPPORTED) {
    return (
      <div className="demo">
        <div className="demo-head">
          <div className="title">🎞️ Live: WebCodecs — raw video frames</div>
        </div>
        <div className="demo-out">Not supported in this browser — WebCodecs (MediaStreamTrackProcessor) is Chrome/Edge only.</div>
      </div>
    );
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🎞️ Live: WebCodecs — raw video frames</div>
        <button className="btn" onClick={active ? stop : start}>
          {active ? "Stop camera" : "Start camera"}
        </button>
      </div>
      <div className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
        Pulls raw VideoFrames off the camera track (no &lt;video&gt; element) — how you'd feed a vision model.
      </div>
      <canvas ref={canvasRef} style={{ width: "100%", maxWidth: 360, height: "auto", borderRadius: 8, border: "1px solid #2a3342", display: active ? "block" : "none" }} />
      <div className={"demo-out" + (info.startsWith("❌") ? " err" : "")} style={{ marginTop: 8 }}>
        {info || <span className="muted">Start the camera to read raw frames via WebCodecs.</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/hub/src/components/demos/WebCodecsDemo.tsx
git commit -m "feat(hub): WebCodecs raw-frames demo (Slice 7)"
```

---

### Task 4: Mount the media demos in Multimodal + build/verify

**Files:**
- Modify: `apps/hub/src/sections/Multimodal.tsx`

- [ ] **Step 1: Add imports** (after `import AudioDemo ...`)

```tsx
import WebCodecsDemo from "../components/demos/WebCodecsDemo";
import WebAudioDemo from "../components/demos/WebAudioDemo";
```

- [ ] **Step 2: Mount them** after `<AudioDemo />` (before the takeaway block)

Replace:
```tsx
      <AudioDemo />

      <div dangerouslySetInnerHTML={{ __html: `
        <div class="takeaway">
```
with:
```tsx
      <AudioDemo />
      <WebCodecsDemo />
      <WebAudioDemo />

      <div dangerouslySetInnerHTML={{ __html: `
        <div class="takeaway">
```

- [ ] **Step 3: Build**

Run: `pnpm --filter @webai/hub build`
Expected: succeeds.

- [ ] **Step 4: Manual verification in the browser**

Run: `pnpm --filter @webai/hub dev`.
- **Compute → WebAssembly:** Run benchmark → shows WASM ms, JS ms, and a speedup (WASM faster on the tight loop).
- **Multimodal → Web Audio:** Start mic → grant permission → live cyan waveform + volume %; Stop ends it.
- **Multimodal → WebCodecs:** Start camera → grant permission → live frames drawn to canvas + "frame N · W×H"; in a non-supporting browser it shows the "not supported" note instead.

- [ ] **Step 5: Commit**

```bash
git add apps/hub/src/sections/Multimodal.tsx
git commit -m "feat(hub): mount WebCodecs + Web Audio demos in Multimodal (Slice 7)"
```

**✅ Slice 7 done:** Compute and Multimodal now have live WebAssembly, Web Audio, and WebCodecs demos.

---

## Self-review notes

- **Spec coverage:** WASM benchmark → Task 1; Web Audio mic waveform → Task 2; WebCodecs frames → Task 3; mounting → Tasks 1 + 4; manual testing → Task 4.
- **Type consistency:** all three are default exports imported as such. `WASM_BYTES`/`N` local to Task 1; `SUPPORTED` local to Task 3. No shared symbols.
- **Known verification gaps (honest):** WASM bytes verified in Node; Web Audio + WebCodecs need mic/camera permission and (WebCodecs) Chrome — both degrade gracefully. `MediaStreamTrackProcessor` is feature-detected.
- **Deferred:** WebRTC live demo (explainer only); AudioWorklet custom processor; WebCodecs encode/file-decode; in-browser RAG (future session).
```
