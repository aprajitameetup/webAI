import React, { useState, useRef } from "react";

export default function StreamDemo() {
  const [output, setOutput] = useState<string>(
    "This simulates the SSE streaming pattern so you can feel why streaming UX matters."
  );
  const [isDone, setIsDone] = useState(false);
  const [isErr] = useState(false);
  const indexRef = useRef(0);

  function run() {
    const words =
      "Streaming makes AI feel instant — tokens arrive one by one, so the user reads while the model writes, instead of staring at a spinner.".split(
        " "
      );
    indexRef.current = 0;
    setIsDone(false);
    setOutput("");

    const tick = () => {
      const i = indexRef.current;
      if (i >= words.length) {
        setIsDone(true);
        return;
      }
      setOutput((prev) => prev + (i > 0 ? " " : "") + words[i]);
      indexRef.current = i + 1;
      setTimeout(tick, 90);
    };
    tick();
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">📡 Live: token-streaming UX (simulated)</div>
        <button className="btn" onClick={run}>
          Stream a response
        </button>
      </div>
      <div className={"demo-out" + (isErr ? " err" : "")}>
        {output}
        {isDone && <span className="muted"> [done]</span>}
      </div>
    </div>
  );
}
