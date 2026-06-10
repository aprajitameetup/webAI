import React from "react";
import StreamDemo from "../components/demos/StreamDemo";

export default function Transport() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: `
        <div class="eyebrow">Layer 4 · Tokens &amp; data in/out</div>
        <h1>Transport: SSE, WebTransport, WebRTC</h1>
        <p class="lead">When the model runs on a server, how the tokens reach the browser defines the experience. Know what ships today vs what's next.</p>

        <h2>📡 Server-Sent Events (SSE) <span class="pill ship">What ships today</span></h2>
        <p>The unglamorous workhorse. <strong>OpenAI and Anthropic stream tokens over SSE.</strong> One-way server→client, plain HTTP, auto-reconnect. If you build an LLM app this year, you'll use this (often via <code>fetch</code> + <code>ReadableStream</code> rather than <code>EventSource</code>, to send POST bodies + headers).</p>
        <pre><code><span class="tok-key">const</span> res = <span class="tok-key">await</span> <span class="tok-fn">fetch</span>(url, { method:<span class="tok-str">'POST'</span>, body });
<span class="tok-key">const</span> reader = res.body.<span class="tok-fn">getReader</span>();
<span class="tok-key">while</span> (<span class="tok-key">true</span>) { <span class="tok-key">const</span> {done,value} = <span class="tok-key">await</span> reader.<span class="tok-fn">read</span>(); <span class="tok-key">if</span>(done) <span class="tok-key">break</span>; <span class="tok-com">/* decode + append */</span> }</code></pre>
      ` }} />

      <StreamDemo />

      <div dangerouslySetInnerHTML={{ __html: `
        <h2>🚀 WebTransport <span class="pill new">Where it's going</span></h2>
        <p>Built on <strong>HTTP/3 + QUIC</strong>. Bidirectional, multiplexed streams + unreliable datagrams, lower latency than WebSockets, no head-of-line blocking. Great for agentic / bidirectional / multi-stream AI. Not yet the default, but the future of low-latency web transport.</p>

        <h2>🎙️ WebRTC <span class="pill ship">Voice AI</span></h2>
        <p>Real-time peer audio/video + data channels. The backbone of <strong>realtime voice assistants</strong> (e.g. OpenAI Realtime). Sub-100ms audio in/out for speech-to-speech models.</p>
        <div class="takeaway"><b>The honest summary:</b> SSE is what you ship today; WebTransport is where it's heading; WebRTC is how you do voice now.</div>
      ` }} />
    </>
  );
}
