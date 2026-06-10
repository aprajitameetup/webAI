import React from "react";

export default function BuiltinAI() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: `
        <div class="eyebrow">Layer 3 · The browser ships a model</div>
        <h1>Built-in AI &amp; the Prompt API</h1>
        <p class="lead">The newest, most "wow" piece. Chrome ships <strong>Gemini Nano on-device</strong> and exposes it through JS APIs — no download in your app, no server, no API key. The browser <em>is</em> the model.</p>

        <h2>The APIs</h2>
        <ul>
          <li><strong>Prompt API</strong> (<code>LanguageModel</code>) — general chat/completion against the built-in model.</li>
          <li><strong>Task APIs</strong> — <code>Summarizer</code>, <code>Writer</code>, <code>Rewriter</code>, <code>Translator</code>, <code>LanguageDetector</code>. Purpose-built, higher quality for their task.</li>
        </ul>
        <pre><code><span class="tok-com">// availability + create a session (API surface evolves — check current docs)</span>
<span class="tok-key">const</span> avail = <span class="tok-key">await</span> LanguageModel.<span class="tok-fn">availability</span>();
<span class="tok-key">const</span> session = <span class="tok-key">await</span> LanguageModel.<span class="tok-fn">create</span>();
<span class="tok-key">const</span> answer = <span class="tok-key">await</span> session.<span class="tok-fn">prompt</span>(<span class="tok-str">'Explain WebGPU in one line'</span>);
<span class="tok-com">// streaming:</span>
<span class="tok-key">for await</span> (<span class="tok-key">const</span> chunk <span class="tok-key">of</span> session.<span class="tok-fn">promptStreaming</span>(text)) { … }</code></pre>
      ` }} />

      <div className="demo">
        <div className="demo-head">
          <div className="title">✨ Live: is Built-in AI available here?</div>
        </div>
        <div className="demo-out">…demo coming in next task…</div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: `
        <div class="takeaway"><b>Why it matters:</b> zero-cost, private, offline, instant. The killer pattern is <b>hybrid</b> — try the on-device model first, escalate to a server model only when the task is too big. See the Patterns tab.</div>
        <div class="warn"><b>Moving target:</b> the exact API names changed during origin trials (<code>window.ai</code> → <code>LanguageModel</code> / <code>self.ai</code>). Always check the current Chrome docs the day of your talk.</div>
      ` }} />
    </>
  );
}
