import React from "react";

export default function Overview() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `
      <div class="eyebrow">The big picture</div>
      <h1>The browser is becoming<br/>a full AI runtime.</h1>
      <p class="lead">Five years ago, "AI in a web app" meant one thing: call a server API. Today the browser itself can run models, talk over real-time transports, store gigabytes of weights, and tap on-device accelerators. This hub walks every layer of that new stack — with live demos that run right here, in <em>your</em> browser.</p>

      <h2>The stack, as layers</h2>
      <div class="stacklayer"><div class="num">1</div><div class="ltext"><b>Compute</b> &nbsp;<span>WebGPU · WebAssembly · WebNN — run the math</span></div></div>
      <div class="stacklayer"><div class="num">2</div><div class="ltext"><b>Runtimes</b> &nbsp;<span>Transformers.js · WebLLM · ONNX Runtime Web · TF.js</span></div></div>
      <div class="stacklayer"><div class="num">3</div><div class="ltext"><b>Built-in AI</b> &nbsp;<span>Prompt API · Gemini Nano on-device</span></div></div>
      <div class="stacklayer"><div class="num">4</div><div class="ltext"><b>Transport</b> &nbsp;<span>WebTransport · SSE · WebRTC — tokens &amp; data in/out</span></div></div>
      <div class="stacklayer"><div class="num">5</div><div class="ltext"><b>Storage</b> &nbsp;<span>OPFS · Cache API · IndexedDB — hold the weights</span></div></div>
      <div class="stacklayer"><div class="num">6</div><div class="ltext"><b>Concurrency</b> &nbsp;<span>Web Workers · SharedArrayBuffer · COOP/COEP</span></div></div>
      <div class="stacklayer"><div class="num">7</div><div class="ltext"><b>Multimodal I/O</b> &nbsp;<span>WebCodecs · Web Audio — voice &amp; vision</span></div></div>

      <div class="takeaway"><b>Talk thesis:</b> "Compute + Models + Transport + Storage + I/O have all matured at once — so the browser can now be the AI runtime, not just the AI client."</div>

      <h2>How to use this over 3 days</h2>
      <p>Each section has: <strong>what it is</strong>, <strong>why it matters</strong>, a <strong>code snippet</strong>, and where possible a <strong>live demo</strong>. Tick sections off in the sidebar as you go. The <strong>Live Capabilities</strong> tab shows what your current browser supports — start there to see the stack is real.</p>
    ` }} />
  );
}
