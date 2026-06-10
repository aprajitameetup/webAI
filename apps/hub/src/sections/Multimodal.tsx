import React from "react";

export default function Multimodal() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: `
        <div class="eyebrow">Layer 7 · Voice &amp; vision</div>
        <h1>Multimodal I/O: WebCodecs &amp; Web Audio</h1>
        <p class="lead">Text is the easy case. Voice and vision AI need efficient ways to capture, decode, and feed media to models in real time.</p>

        <h2>🎞️ WebCodecs</h2>
        <p>Low-level access to encode/decode video &amp; audio frames. Lets you pull raw frames out of a camera/video stream to feed a vision model without the overhead of <code>&lt;video&gt;</code> + canvas hacks. The backbone of in-browser video AI.</p>

        <h2>🔊 Web Audio API + AudioWorklet</h2>
        <p>Capture mic audio, process it in a real-time audio thread (<strong>AudioWorklet</strong>), and pipe to an ASR model — or play TTS output. The input/output rig for voice assistants.</p>
        <pre><code><span class="tok-key">const</span> ctx = <span class="tok-key">new</span> <span class="tok-fn">AudioContext</span>();
<span class="tok-key">await</span> ctx.audioWorklet.<span class="tok-fn">addModule</span>(<span class="tok-str">'processor.js'</span>); <span class="tok-com">// runs on the audio thread</span></code></pre>
      ` }} />

      <div className="demo">
        <div className="demo-head">
          <div className="title">🔊 Live: Web Audio (play a tone)</div>
        </div>
        <div className="demo-out">…demo coming in next task…</div>
      </div>

      <div dangerouslySetInnerHTML={{ __html: `
        <div class="takeaway"><b>Voice AI pipeline:</b> mic → Web Audio/AudioWorklet → ASR (Transformers.js Whisper) → LLM → TTS → Web Audio out. Every box is a browser API on this list.</div>
      ` }} />
    </>
  );
}
