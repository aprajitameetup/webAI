import React, { useState } from "react";

export default function WorkerDemo() {
  const [output, setOutput] = useState<string>(
    "Spins up an inline worker, computes a heavy loop off the main thread, returns the result — UI stays responsive."
  );
  const [isErr, setIsErr] = useState(false);

  function run() {
    setIsErr(false);
    setOutput("Spawning worker…");
    try {
      const code = `onmessage=(e)=>{let s=0;for(let i=0;i<e.data;i++){s+=Math.sqrt(i);}postMessage(s);}`;
      const url = URL.createObjectURL(
        new Blob([code], { type: "text/javascript" })
      );
      const w = new Worker(url);
      const t = performance.now();
      w.onmessage = (e: MessageEvent) => {
        setOutput(
          `✓ Worker computed sum of sqrt(0..50,000,000)\n= ${(e.data as number).toFixed(0)}\nin ${(performance.now() - t).toFixed(0)}ms — off the main thread (UI never froze).`
        );
        w.terminate();
        URL.revokeObjectURL(url);
      };
      w.onerror = (e) => {
        setIsErr(true);
        setOutput("❌ " + (e.message ?? "Worker error"));
        w.terminate();
        URL.revokeObjectURL(url);
      };
      w.postMessage(50000000);
    } catch (err: any) {
      setIsErr(true);
      setOutput("❌ " + (err?.message ?? String(err)));
    }
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🧵 Live: offload work to a Web Worker</div>
        <button className="btn" onClick={run}>
          Compute on a worker
        </button>
      </div>
      <div className={"demo-out" + (isErr ? " err" : "")}>{output}</div>
    </div>
  );
}
