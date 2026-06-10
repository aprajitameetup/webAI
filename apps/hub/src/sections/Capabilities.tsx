import React from "react";
import CapabilityDashboard from "../components/CapabilityDashboard";

export default function Capabilities() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: `
        <div class="eyebrow">Feature detection</div>
        <h1>What can <em>your</em> browser do?</h1>
        <p class="lead">This is real feature detection, run live. Green = available right now. This is the fastest way to internalise "what's shipping vs experimental." Try it in Chrome Canary too — you'll light up more.</p>
      ` }} />
      <CapabilityDashboard />
      <div dangerouslySetInnerHTML={{ __html: `
        <div class="warn"><b>Note:</b> some APIs (SharedArrayBuffer, full WebGPU threads) require <b>cross-origin isolation</b> (COOP/COEP headers). Opening this file via <code>file://</code> or a plain static server limits a few of them — that's expected, and itself a lesson (see the Concurrency tab).</div>
      ` }} />
    </>
  );
}
