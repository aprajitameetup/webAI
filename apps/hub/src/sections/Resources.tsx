import React from "react";

export default function Resources() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `
      <div class="eyebrow">Go deeper</div>
      <h1>Curated resources</h1>
      <div class="res"><div class="rico">🎮</div><div class="rbody"><div class="rt">WebGPU Fundamentals</div><div class="rd">webgpufundamentals.org — the best WebGPU intro</div></div></div>
      <div class="res"><div class="rico">🧠</div><div class="rbody"><div class="rt">WebNN spec &amp; samples</div><div class="rd">webmachinelearning.github.io/webnn — W3C draft + demos</div></div></div>
      <div class="res"><div class="rico">🤗</div><div class="rbody"><div class="rt">Transformers.js docs</div><div class="rd">huggingface.co/docs/transformers.js</div></div></div>
      <div class="res"><div class="rico">🦙</div><div class="rbody"><div class="rt">WebLLM</div><div class="rd">github.com/mlc-ai/web-llm — in-browser LLMs over WebGPU</div></div></div>
      <div class="res"><div class="rico">✨</div><div class="rbody"><div class="rt">Chrome Built-in AI</div><div class="rd">developer.chrome.com/docs/ai/built-in — Prompt &amp; task APIs</div></div></div>
      <div class="res"><div class="rico">🚀</div><div class="rbody"><div class="rt">WebTransport explainer</div><div class="rd">developer.mozilla.org/en-US/docs/Web/API/WebTransport</div></div></div>
      <div class="res"><div class="rico">💾</div><div class="rbody"><div class="rt">OPFS guide</div><div class="rd">developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system</div></div></div>
      <div class="res"><div class="rico">🧵</div><div class="rbody"><div class="rt">Cross-origin isolation</div><div class="rd">web.dev/articles/coop-coep</div></div></div>
      <div class="res"><div class="rico">🎬</div><div class="rbody"><div class="rt">WebCodecs</div><div class="rd">developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API</div></div></div>
      <div class="res"><div class="rico">📊</div><div class="rbody"><div class="rt">web.dev — On-device AI</div><div class="rd">web.dev/explore/ai — Googles hub for client-side AI</div></div></div>
      <div class="warn"><b>Tip:</b> the fastest way to learn is to clone a WebLLM example, run it, then read its source — you'll see WebGPU + OPFS + Web Workers + streaming all working together in one real app.</div>
    ` }} />
  );
}
