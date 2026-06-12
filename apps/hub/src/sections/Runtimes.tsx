import React from "react";
import ChatDemo from "../ChatDemo";
import TransformersDemo from "../components/demos/runtimes/TransformersDemo";
import TensorFlowDemo from "../components/demos/runtimes/TensorFlowDemo";

export default function Runtimes() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: `
      <div class="eyebrow">Layer 2 · The frameworks you actually use</div>
      <h1>Models &amp; Runtimes</h1>
      <p class="lead">You rarely touch WebGPU directly — you use a runtime that sits on top of it and falls back to Wasm. These are the libraries to know.</p>

      <h2>🤗 Transformers.js <span class="pill ship">Popular</span></h2>
      <p>Hugging Face's library to run transformer models in the browser with a Python-like API. Pulls ONNX models, runs on WebGPU/Wasm. Great for embeddings, classification, ASR, small LLMs.</p>
      <pre><code><span class="tok-key">import</span> { pipeline } <span class="tok-key">from</span> <span class="tok-str">'@huggingface/transformers'</span>;
<span class="tok-key">const</span> pipe = <span class="tok-key">await</span> <span class="tok-fn">pipeline</span>(<span class="tok-str">'sentiment-analysis'</span>);
<span class="tok-key">const</span> out  = <span class="tok-key">await</span> <span class="tok-fn">pipe</span>(<span class="tok-str">'Web AI is incredible'</span>); <span class="tok-com">// [{label:'POSITIVE', score:.99}]</span></code></pre>

      <h2>🦙 WebLLM <span class="pill new">The showstopper</span></h2>
      <p>By MLC — runs <strong>full LLMs entirely in-browser</strong> over WebGPU (Llama 3, Phi-3, Mistral, Qwen, Gemma). Downloads a quantized model once (cached via OPFS), then inference is fully local — works offline, nothing leaves the device. This is your "pull the wifi and it still answers" demo.</p>
      <pre><code><span class="tok-key">import</span> { CreateMLCEngine } <span class="tok-key">from</span> <span class="tok-str">'@mlc-ai/web-llm'</span>;
<span class="tok-key">const</span> engine = <span class="tok-key">await</span> <span class="tok-fn">CreateMLCEngine</span>(<span class="tok-str">'Llama-3.2-1B-Instruct-q4f32_1-MLC'</span>);
<span class="tok-key">const</span> reply = <span class="tok-key">await</span> engine.chat.completions.<span class="tok-fn">create</span>({ messages, stream:<span class="tok-key">true</span> });</code></pre>

      <h2>The rest worth naming</h2>
      <div class="grid2">
        <div class="card"><h3>⚙️ ONNX Runtime Web</h3><p style="margin:0">Microsoft's runtime. Runs any ONNX model on WebGPU/Wasm. The engine under many other libs.</p></div>
        <div class="card"><h3>📊 TensorFlow.js</h3><p style="margin:0">The veteran. Big model zoo, WebGL/WebGPU backends, good for vision.</p></div>
        <div class="card"><h3>🎯 MediaPipe</h3><p style="margin:0">Google's task runtime — face/hand/pose, segmentation, on-device LLM tasks. Drop-in "solutions."</p></div>
        <div class="card"><h3>🐍 Pyodide</h3><p style="margin:0">CPython compiled to Wasm — run numpy/scikit-learn in the browser. Niche but mind-bending.</p></div>
      </div>
      <div class="takeaway"><b>Pick by job:</b> embeddings/NLP → Transformers.js · chat LLM offline → WebLLM · arbitrary ONNX → ONNX Runtime Web · vision tasks → MediaPipe.</div>
    ` }} />

      <ChatDemo />
      <TransformersDemo />
      <TensorFlowDemo />
    </>
  );
}
