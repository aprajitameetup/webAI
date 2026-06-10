import React from "react";

export default function Storage() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: `
        <div class="eyebrow">Layer 5 · Hold the weights</div>
        <h1>Storage: OPFS, Cache, IndexedDB</h1>
        <p class="lead">In-browser models are 100 MB – 2 GB+. Re-downloading on every page load is a non-starter. This is the unsexy layer that makes client-side AI actually usable.</p>

        <h2>🗄️ Origin Private File System (OPFS) <span class="pill new">Best for weights</span></h2>
        <p>A private, high-performance, origin-scoped file system. Synchronous access from workers, ideal for big binary blobs like model weights. This is where WebLLM/Transformers.js cache models.</p>
        <pre><code><span class="tok-key">const</span> root = <span class="tok-key">await</span> navigator.storage.<span class="tok-fn">getDirectory</span>();
<span class="tok-key">const</span> fh = <span class="tok-key">await</span> root.<span class="tok-fn">getFileHandle</span>(<span class="tok-str">'model.bin'</span>, { create:<span class="tok-key">true</span> });
<span class="tok-key">const</span> w = <span class="tok-key">await</span> fh.<span class="tok-fn">createWritable</span>(); <span class="tok-key">await</span> w.<span class="tok-fn">write</span>(blob); <span class="tok-key">await</span> w.<span class="tok-fn">close</span>();</code></pre>
      ` }} />

      <div className="demo">
        <div className="demo-head">
          <div className="title">💾 Live: write &amp; read a file in OPFS</div>
        </div>
        <div className="demo-out">…demo coming in next task…</div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: `
        <div class="grid2">
          <div class="card"><h3>📦 Cache API</h3><p style="margin:0">Request/response caching (Service Workers). Good for caching model shards fetched over HTTP, enables offline.</p></div>
          <div class="card"><h3>🗃️ IndexedDB</h3><p style="margin:0">Structured key-value store. Older, async, fine for metadata/embeddings; OPFS is better for big binaries.</p></div>
        </div>
        <div class="takeaway"><b>Rule of thumb:</b> big binary weights → OPFS · HTTP-fetched shards / offline → Cache API · structured data &amp; vectors → IndexedDB.</div>
      ` }} />
    </>
  );
}
