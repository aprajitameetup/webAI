import React from "react";

export default function Rag() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `
      <div class="eyebrow">Bonus · The sleeper feature</div>
      <h1>RAG, entirely in the browser</h1>
      <p class="lead">You can do retrieval-augmented generation with <strong>zero server</strong> — embeddings, a vector store, and an LLM all client-side. Great "I didn't know that was possible" moment.</p>
      <ul>
        <li><strong>Embeddings</strong> — Transformers.js (<code>feature-extraction</code> pipeline) turns text into vectors locally.</li>
        <li><strong>Vector store</strong> — Wasm SQLite (<code>wa-sqlite</code>, <code>sqlite-vec</code>), <code>pglite</code> (Postgres in Wasm), or lightweight libs like <code>voy</code> (Rust→Wasm HNSW).</li>
        <li><strong>Generation</strong> — WebLLM or Built-in AI with the retrieved context.</li>
      </ul>
      <pre><code><span class="tok-com">// 1) embed query locally  2) cosine-search local vectors  3) prompt local LLM</span>
<span class="tok-key">const</span> embed = <span class="tok-key">await</span> <span class="tok-fn">pipeline</span>(<span class="tok-str">'feature-extraction'</span>, <span class="tok-str">'Xenova/all-MiniLM-L6-v2'</span>);
<span class="tok-key">const</span> qVec  = <span class="tok-key">await</span> <span class="tok-fn">embed</span>(query, { pooling:<span class="tok-str">'mean'</span>, normalize:<span class="tok-key">true</span> });</code></pre>
      <div class="takeaway"><b>Why it's powerful:</b> private (documents never leave the device), offline, free. Perfect for personal-knowledge or sensitive-data apps.</div>
    ` }} />
  );
}
