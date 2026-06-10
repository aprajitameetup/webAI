import React from "react";

export default function Compute() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: `
        <div class="eyebrow">Layer 1 · Run the math</div>
        <h1>Compute: WebGPU, Wasm, WebNN</h1>
        <p class="lead">Before a model can run in the browser, you need a way to do billions of multiply-adds fast. Three technologies, three trade-offs.</p>

        <h2>🎮 WebGPU <span class="pill ship">Shipping</span></h2>
        <p>The modern GPU API for the web — successor to WebGL, but built for <strong>general compute</strong>, not just graphics. You write <strong>compute shaders</strong> in WGSL and dispatch them across thousands of GPU threads. This is what powers in-browser LLMs (WebLLM) and fast inference.</p>
        <pre><code><span class="tok-key">const</span> adapter = <span class="tok-key">await</span> navigator.gpu.<span class="tok-fn">requestAdapter</span>();
<span class="tok-key">const</span> device  = <span class="tok-key">await</span> adapter.<span class="tok-fn">requestDevice</span>();
<span class="tok-com">// upload buffers, write a WGSL compute shader, dispatch, read back</span></code></pre>
      ` }} />

      <div className="demo">
        <div className="demo-head">
          <div className="title">🎮 Live: WebGPU compute shader</div>
        </div>
        <div className="demo-out">…demo coming in next task…</div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: `
        <h2>🧩 WebAssembly <span class="pill ship">Shipping</span></h2>
        <p>Near-native CPU performance in the browser. The <strong>fallback path</strong> when WebGPU isn't available, and the foundation for ONNX Runtime Web and llama.cpp ports. Key extensions for AI: <strong>SIMD</strong> (vectorised math), <strong>threads</strong> (needs SharedArrayBuffer), and <strong>Wasm GC</strong>.</p>
        <div class="takeaway"><b>Mental model:</b> WebGPU = the fast lane (GPU), Wasm = the reliable lane (CPU). Good runtimes try WebGPU and fall back to Wasm automatically.</div>

        <h2>🧠 WebNN — Web Neural Network API <span class="pill new">The new one</span></h2>
        <p>This is the piece most "web AI" talks miss. WebNN is a <strong>W3C standard built specifically for ML inference</strong>. Instead of you hand-writing compute shaders, you describe a <em>graph</em> of neural-network ops and the browser routes it to the OS's native accelerator — <strong>DirectML</strong> (Windows), <strong>Core ML</strong> (Apple), <strong>NNAPI</strong> (Android), even NPUs.</p>
        <ul>
          <li><strong>WebGPU</strong> = low-level, you build the kernels.</li>
          <li><strong>WebNN</strong> = high-level, you describe the model and the OS picks the best hardware (including dedicated AI chips / NPUs).</li>
        </ul>
        <pre><code><span class="tok-key">const</span> context = <span class="tok-key">await</span> navigator.ml.<span class="tok-fn">createContext</span>({ deviceType: <span class="tok-str">'gpu'</span> });
<span class="tok-key">const</span> builder = <span class="tok-key">new</span> <span class="tok-fn">MLGraphBuilder</span>(context);
<span class="tok-com">// describe ops: conv2d, matmul, relu… then build() and compute()</span></code></pre>
        <div class="warn"><b>Status:</b> WebNN is still behind flags in most browsers (Chrome/Edge origin trials). Worth knowing deeply because it's where the platform is heading — and it's a strong "you haven't heard of this yet" moment for your talk.</div>
      ` }} />
    </>
  );
}
