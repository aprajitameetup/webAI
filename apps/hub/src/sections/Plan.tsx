import React from "react";

export default function Plan() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `
      <div class="eyebrow">Your study plan</div>
      <h1>3 days to fluent</h1>
      <div class="day">
        <div class="day-h">Day 1 — Compute &amp; Runtimes</div>
        <div class="day-sub">Get the foundation + a real win on screen</div>
        <div class="task"><div class="tbox"></div><span>Read the Compute tab; run the live WebGPU demo and read the WGSL idea behind it</span></div>
        <div class="task"><div class="tbox"></div><span>Skim the WebGPU fundamentals article (webgpufundamentals.org)</span></div>
        <div class="task"><div class="tbox"></div><span>Understand WebGPU vs WebNN vs Wasm — write the 3-line summary in your own words</span></div>
        <div class="task"><div class="tbox"></div><span>Clone &amp; run a WebLLM example locally; watch the model cache to OPFS</span></div>
        <div class="task"><div class="tbox"></div><span>Run a Transformers.js sentiment/embedding pipeline in a blank HTML file</span></div>
      </div>
      <div class="day">
        <div class="day-h">Day 2 — Built-in AI, Transport &amp; Storage</div>
        <div class="day-sub">The "new" parts + how data moves and persists</div>
        <div class="task"><div class="tbox"></div><span>Enable Built-in AI in Chrome (chrome://flags) and run the Prompt API live demo</span></div>
        <div class="task"><div class="tbox"></div><span>Build a tiny SSE/fetch-stream token UI (use any mock endpoint)</span></div>
        <div class="task"><div class="tbox"></div><span>Read the WebTransport explainer; note how it differs from WebSockets</span></div>
        <div class="task"><div class="tbox"></div><span>Do the OPFS read/write demo; inspect storage in DevTools → Application</span></div>
        <div class="task"><div class="tbox"></div><span>Set COOP/COEP headers on a local server and confirm crossOriginIsolated === true</span></div>
      </div>
      <div class="day">
        <div class="day-h">Day 3 — Multimodal, RAG &amp; build the demo</div>
        <div class="day-sub">Tie it together into one thing you can show</div>
        <div class="task"><div class="tbox"></div><span>Run the Web Worker + Web Audio demos; sketch a voice pipeline</span></div>
        <div class="task"><div class="tbox"></div><span>Read one in-browser RAG example (transformers.js embeddings + a Wasm vector store)</span></div>
        <div class="task"><div class="tbox"></div><span>Decide your talk demo: WebLLM offline chat OR Built-in AI summarizer</span></div>
        <div class="task"><div class="tbox"></div><span>Build the demo end-to-end; test with wifi OFF to prove on-device</span></div>
        <div class="task"><div class="tbox"></div><span>Write your 5 key takeaways (lift them from each tab's takeaway box)</span></div>
      </div>
    ` }} />
  );
}
