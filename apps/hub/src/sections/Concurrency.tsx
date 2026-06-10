import React from "react";

export default function Concurrency() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: `
        <div class="eyebrow">Layer 6 · Don't freeze the tab</div>
        <h1>Concurrency: Workers, SAB, COOP/COEP</h1>
        <p class="lead">Inference is heavy. Run it on the main thread and the UI locks up. This layer is how you keep things smooth — and the source of the most common "why doesn't it work" gotchas.</p>

        <h2>👷 Web Workers</h2>
        <p>Run inference on a background thread; post messages back to the UI. Every serious in-browser AI lib runs the model in a worker (or <strong>OffscreenCanvas</strong> for rendering).</p>
      ` }} />

      <div className="demo">
        <div className="demo-head">
          <div className="title">🧵 Live: offload work to a Web Worker</div>
        </div>
        <div className="demo-out">…demo coming in next task…</div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: `
        <h2>🔗 SharedArrayBuffer + cross-origin isolation <span class="pill exp">The gotcha</span></h2>
        <p>Wasm threads and some WebGPU paths need <code>SharedArrayBuffer</code>, which is gated behind <strong>cross-origin isolation</strong>. You must serve these headers:</p>
        <pre><code>Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp</code></pre>
        <p>Then check <code>crossOriginIsolated === true</code>. Miss this and multi-threaded Wasm silently falls back to single-thread (slow) — a classic "works in the demo, slow in prod" trap.</p>
        <div class="warn"><b>You'll hit this:</b> opening this very file without those headers means <code>SharedArrayBuffer</code> may be unavailable — check the Live Capabilities tab to see your current state.</div>
      ` }} />
    </>
  );
}
