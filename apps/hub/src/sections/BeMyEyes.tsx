import React from "react";
import BeMyEyesDemo from "../components/demos/BeMyEyesDemo";
import BeMyEyesArchitecture from "../components/diagrams/BeMyEyesArchitecture";

export default function BeMyEyes() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: `
        <div class="eyebrow">Capstone demo · Accessibility</div>
        <h1>AI, Be My Eyes</h1>
        <p class="lead">This is an accessibility tool first, not a tech demo wearing one as a costume. It looks through the camera and describes what's in front of it out loud, for someone who genuinely can't look at the screen themselves. It's also proof of something this hub keeps saying: a vision model and an on-device language model, the same layers covered everywhere else in this hub, are enough to build that, and because it all runs on-device, nothing your camera sees ever leaves the browser.</p>

        <h2>📷 The pipeline</h2>
        <p>Four steps, all running on the device in front of you, nothing here calls out to a server. Here's the actual data flow, including what happens when Gemini Nano isn't available:</p>
      ` }} />

      <BeMyEyesArchitecture />

      <div dangerouslySetInnerHTML={{ __html: `
        <p class="lead" style="font-size:13px">And spelled out as a stack, layer by layer:</p>
        <div class="stacklayer"><div class="num">1</div><div class="ltext"><b>Camera</b> &nbsp;<span><code>getUserMedia</code> streams live video into the page &mdash; no upload, ever</span></div></div>
        <div class="stacklayer"><div class="num">2</div><div class="ltext"><b>Vision</b> &nbsp;<span>TensorFlow.js <b>MobileNet</b> classifies a frame every ~1.8s (e.g. <code>"coffee mug, cup" · 62%</code>)</span></div></div>
        <div class="stacklayer"><div class="num">3</div><div class="ltext"><b>Language</b> &nbsp;<span>Chrome's built-in <b>Gemini Nano</b> (Prompt API) turns that label into a natural sentence &mdash; falls back to a plain template if unavailable</span></div></div>
        <div class="stacklayer"><div class="num">4</div><div class="ltext"><b>Voice</b> &nbsp;<span>Web Speech API's <code>SpeechSynthesisUtterance</code> reads the sentence out loud</span></div></div>

        <h2>👁️ Try the real test</h2>
        <p>Start the camera below, then close your eyes and point it at something on your desk. That's the actual test: not whether the code compiles, but whether what it says is fast and clear enough to trust.</p>
      ` }} />

      <BeMyEyesDemo />

      <div dangerouslySetInnerHTML={{ __html: `
        <div class="takeaway"><b>This is the stack, not just a demo:</b> Runtimes (MobileNet) + Built-in AI (Gemini Nano) + Multimodal I/O (camera + Web Speech), composed into one accessibility tool that runs entirely on-device.</div>
      ` }} />
    </>
  );
}
