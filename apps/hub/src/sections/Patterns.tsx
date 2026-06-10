import React from "react";

export default function Patterns() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `
      <div class="eyebrow">Putting it together</div>
      <h1>Architecture patterns</h1>
      <h2>🔀 Hybrid (on-device → escalate)</h2>
      <p>The defining pattern of the new stack. Try the <strong>on-device</strong> model (Built-in AI / WebLLM) for speed, privacy, and zero cost. Escalate to a <strong>server</strong> model only when the task exceeds local capability. Decide by task size, confidence, or capability detection.</p>
      <h2>🧩 Deterministic shell, probabilistic core</h2>
      <p>(Ties to your usability talk.) Keep the UI deterministic; let only the AI-generated content vary. Stream it, label it, make it overridable.</p>
      <h2>📐 The decision grid</h2>
      <div class="grid3">
        <div class="card"><h3>On-device</h3><p style="margin:0;font-size:13px">✅ private, offline, free, instant<br/>❌ smaller models, big first download</p></div>
        <div class="card"><h3>Server</h3><p style="margin:0;font-size:13px">✅ biggest models, no client load<br/>❌ cost, latency, data leaves device</p></div>
        <div class="card"><h3>Hybrid</h3><p style="margin:0;font-size:13px">✅ best of both, graceful<br/>❌ more engineering, two code paths</p></div>
      </div>
      <div class="takeaway"><b>The closing line for your talk:</b> "The browser used to be where AI was <i>displayed</i>. Now it's where AI <i>runs</i>. That changes what we can build — private, offline, instant, free."</div>
    ` }} />
  );
}
