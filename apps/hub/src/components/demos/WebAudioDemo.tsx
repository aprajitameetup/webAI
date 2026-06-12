import React, { useRef, useState } from "react";

export default function WebAudioDemo() {
  const [active, setActive] = useState(false);
  const [msg, setMsg] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      ctxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const canvas = canvasRef.current!;
      const c = canvas.getContext("2d")!;
      setActive(true);
      setMsg("");
      const draw = () => {
        analyser.getByteTimeDomainData(data);
        c.fillStyle = "#070a0f";
        c.fillRect(0, 0, canvas.width, canvas.height);
        c.lineWidth = 2;
        c.strokeStyle = "#30c8ff";
        c.beginPath();
        const slice = canvas.width / data.length;
        let x = 0;
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = data[i] / 128 - 1;
          sum += v * v;
          const y = (v * 0.5 + 0.5) * canvas.height;
          if (i === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
          x += slice;
        }
        c.stroke();
        const rms = Math.sqrt(sum / data.length);
        c.fillStyle = "#9aa7b5";
        c.font = "12px monospace";
        c.fillText(`volume: ${(rms * 100).toFixed(0)}%`, 8, 16);
        rafRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch (e: any) {
      setMsg("❌ " + (e?.message ?? String(e)));
      setActive(false);
    }
  }

  function stop() {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    setActive(false);
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🔊 Live: Web Audio — mic waveform</div>
        <button className="btn" onClick={active ? stop : start}>
          {active ? "Stop mic" : "Start mic"}
        </button>
      </div>
      <div className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
        Captures mic audio via Web Audio (AnalyserNode). AudioWorklet is the production real-time-thread path.
      </div>
      <canvas ref={canvasRef} width={480} height={100} style={{ width: "100%", maxWidth: 480, height: 100, borderRadius: 8, border: "1px solid #2a3342", display: "block" }} />
      {msg && <div className="demo-out err" style={{ marginTop: 8 }}>{msg}</div>}
    </div>
  );
}
