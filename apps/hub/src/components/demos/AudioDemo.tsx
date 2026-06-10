import React, { useState } from "react";

export default function AudioDemo() {
  const [output, setOutput] = useState<string>(
    "Click (a user gesture is required) to spin up an AudioContext and play a short tone."
  );
  const [isErr, setIsErr] = useState(false);

  function run() {
    setIsErr(false);
    try {
      const AC =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) {
        setIsErr(true);
        setOutput("❌ Web Audio not available.");
        return;
      }
      const ctx: AudioContext = new AC();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 440;
      gain.gain.value = 0.08;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
      }, 500);
      setOutput(
        "✓ Played 440 Hz for 0.5s via AudioContext.\nSame rig (mic in → AudioWorklet → model → tone out) powers voice AI."
      );
    } catch (err: any) {
      setIsErr(true);
      setOutput("❌ " + (err?.message ?? String(err)));
    }
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🔊 Live: Web Audio (play a tone)</div>
        <button className="btn" onClick={run}>
          Play 440 Hz
        </button>
      </div>
      <div className={"demo-out" + (isErr ? " err" : "")}>{output}</div>
    </div>
  );
}
