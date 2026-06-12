import React, { useRef, useState } from "react";

const SUPPORTED =
  typeof (window as any).MediaStreamTrackProcessor !== "undefined" &&
  typeof (window as any).VideoFrame !== "undefined";

export default function WebCodecsDemo() {
  const [active, setActive] = useState(false);
  const [info, setInfo] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopRef = useRef(false);

  async function start() {
    try {
      stopRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      const processor = new (window as any).MediaStreamTrackProcessor({ track });
      const reader = processor.readable.getReader();
      const canvas = canvasRef.current!;
      const c = canvas.getContext("2d")!;
      setActive(true);
      setInfo("");
      let count = 0;
      while (!stopRef.current) {
        const { value: frame, done } = await reader.read();
        if (done || !frame) break;
        canvas.width = frame.displayWidth;
        canvas.height = frame.displayHeight;
        c.drawImage(frame, 0, 0);
        count++;
        if (count % 5 === 0) {
          setInfo(`frame ${count} · ${frame.displayWidth}×${frame.displayHeight} — raw VideoFrame via WebCodecs`);
        }
        frame.close();
      }
      try {
        await reader.cancel();
      } catch {
        /* ignore */
      }
    } catch (e: any) {
      setInfo("❌ " + (e?.message ?? String(e)));
      setActive(false);
    }
  }

  function stop() {
    stopRef.current = true;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setActive(false);
  }

  if (!SUPPORTED) {
    return (
      <div className="demo">
        <div className="demo-head">
          <div className="title">🎞️ Live: WebCodecs — raw video frames</div>
        </div>
        <div className="demo-out">Not supported in this browser — WebCodecs (MediaStreamTrackProcessor) is Chrome/Edge only.</div>
      </div>
    );
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🎞️ Live: WebCodecs — raw video frames</div>
        <button className="btn" onClick={active ? stop : start}>
          {active ? "Stop camera" : "Start camera"}
        </button>
      </div>
      <div className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
        Pulls raw VideoFrames off the camera track (no &lt;video&gt; element) — how you'd feed a vision model.
      </div>
      <canvas ref={canvasRef} style={{ width: "100%", maxWidth: 360, height: "auto", borderRadius: 8, border: "1px solid #2a3342", display: active ? "block" : "none" }} />
      <div className={"demo-out" + (info.startsWith("❌") ? " err" : "")} style={{ marginTop: 8 }}>
        {info || <span className="muted">Start the camera to read raw frames via WebCodecs.</span>}
      </div>
    </div>
  );
}
