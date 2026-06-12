import React from "react";

export default function Plan() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `
      <div class="eyebrow">Your study plan</div>
      <h1>10 days to fluent</h1>
      <p class="lead">One coherent chunk of the stack per day, each anchored to a live demo in this hub. Run the demo, read the tab, then do the hands-on task.</p>

      <div class="day">
        <div class="day-h">Day 1 — Compute foundation</div>
        <div class="day-sub">WebGPU + WebAssembly — how the math actually runs</div>
        <div class="task"><div class="tbox"></div><span>Run the WebGPU compute demo; read the WGSL idea behind it (webgpufundamentals.org)</span></div>
        <div class="task"><div class="tbox"></div><span>Run the WebAssembly-vs-JS benchmark; understand why JITs win simple loops and what WASM is really for (SIMD, threads, C/C++/Rust ports)</span></div>
        <div class="task"><div class="tbox"></div><span>Write the 3-line summary: WebGPU vs WebNN vs Wasm, in your own words</span></div>
      </div>

      <div class="day">
        <div class="day-h">Day 2 — WebLLM: full LLMs in the browser</div>
        <div class="day-sub">The showstopper — a real LLM, on-device, offline</div>
        <div class="task"><div class="tbox"></div><span>Run the on-device chat demo; watch the model download and cache (OPFS / Cache Storage)</span></div>
        <div class="task"><div class="tbox"></div><span>Reload with the network OFF and confirm it still answers — the "pull the wifi" moment</span></div>
        <div class="task"><div class="tbox"></div><span>Read how WebLLM runs in a Web Worker over WebGPU; skim the model list</span></div>
      </div>

      <div class="day">
        <div class="day-h">Day 3 — Transformers.js + ONNX Runtime Web</div>
        <div class="day-sub">Task models and the engine beneath them</div>
        <div class="task"><div class="tbox"></div><span>Run the Transformers.js sentiment demo; try positive / negative / sarcastic inputs</span></div>
        <div class="task"><div class="tbox"></div><span>Run the ONNX Runtime Web draw-a-digit (MNIST) demo; note it's the same engine under Transformers.js</span></div>
        <div class="task"><div class="tbox"></div><span>Build a blank-HTML Transformers.js pipeline (embeddings or classification)</span></div>
      </div>

      <div class="day">
        <div class="day-h">Day 4 — Vision: TensorFlow.js + MediaPipe</div>
        <div class="day-sub">Image classification and real-time landmarks</div>
        <div class="task"><div class="tbox"></div><span>Run the TensorFlow.js MobileNet demo on a few photos; note the ImageNet vocabulary</span></div>
        <div class="task"><div class="tbox"></div><span>Run the MediaPipe face-mesh demo; understand the 468-landmark model</span></div>
        <div class="task"><div class="tbox"></div><span>Pick the right tool per job: classification vs landmarks vs segmentation</span></div>
      </div>

      <div class="day">
        <div class="day-h">Day 5 — Pyodide &amp; the WebAssembly ecosystem</div>
        <div class="day-sub">Whole language runtimes in the tab</div>
        <div class="task"><div class="tbox"></div><span>Run the Pyodide demo; run numpy in-browser; try your own snippet</span></div>
        <div class="task"><div class="tbox"></div><span>Map the pattern: llama.cpp, ONNX Runtime, Pyodide are all WASM ports — why that matters</span></div>
        <div class="task"><div class="tbox"></div><span>Read about WASM SIMD + threads (SharedArrayBuffer) and when they help</span></div>
      </div>

      <div class="day">
        <div class="day-h">Day 6 — Built-in AI (Prompt + Task APIs)</div>
        <div class="day-sub">The browser ships the model</div>
        <div class="task"><div class="tbox"></div><span>Enable Built-in AI in Chrome (chrome://flags); check the capability panel</span></div>
        <div class="task"><div class="tbox"></div><span>Run the Prompt, Summarizer, Translator, and Language Detector demos against Gemini Nano</span></div>
        <div class="task"><div class="tbox"></div><span>Note the availability lifecycle (unavailable → downloadable → available) and graceful fallback</span></div>
      </div>

      <div class="day">
        <div class="day-h">Day 7 — Transport, Storage &amp; isolation</div>
        <div class="day-sub">How tokens stream and weights persist</div>
        <div class="task"><div class="tbox"></div><span>Run the streaming-UX demo; build a tiny SSE/fetch-stream token UI</span></div>
        <div class="task"><div class="tbox"></div><span>Do the OPFS read/write demo; inspect Application → Storage in DevTools</span></div>
        <div class="task"><div class="tbox"></div><span>Set COOP/COEP headers locally; confirm crossOriginIsolated === true; skim WebTransport</span></div>
      </div>

      <div class="day">
        <div class="day-h">Day 8 — Multimodal I/O</div>
        <div class="day-sub">The capture rig for voice &amp; vision AI</div>
        <div class="task"><div class="tbox"></div><span>Run the Web Audio mic-waveform demo; read where AudioWorklet fits</span></div>
        <div class="task"><div class="tbox"></div><span>Run the WebCodecs raw-frames demo; see how you'd feed frames to a vision model</span></div>
        <div class="task"><div class="tbox"></div><span>Run the Web Worker demo; sketch a full voice pipeline (mic → ASR → LLM → TTS)</span></div>
      </div>

      <div class="day">
        <div class="day-h">Day 9 — In-browser RAG</div>
        <div class="day-sub">Retrieval that never leaves the device</div>
        <div class="task"><div class="tbox"></div><span>Generate embeddings with Transformers.js (feature-extraction pipeline)</span></div>
        <div class="task"><div class="tbox"></div><span>Store + cosine-search vectors in memory (or a Wasm vector store); retrieve top-k</span></div>
        <div class="task"><div class="tbox"></div><span>Wire retrieved context into a WebLLM or Built-in AI prompt — fully on-device RAG</span></div>
      </div>

      <div class="day">
        <div class="day-h">Day 10 — Capstone: ship it</div>
        <div class="day-sub">Tie it into one thing you can show</div>
        <div class="task"><div class="tbox"></div><span>Build an end-to-end demo: on-device chat, summarizer, or RAG over your own notes</span></div>
        <div class="task"><div class="tbox"></div><span>Test with wifi OFF to prove it's truly on-device; handle the unavailable/fallback paths</span></div>
        <div class="task"><div class="tbox"></div><span>Write your key takeaways — lift them from each tab's takeaway box</span></div>
      </div>
    ` }} />
  );
}
