import React, { useEffect, useRef, useState } from "react";

const ORT_VERSION = "1.20.1";
const WASM_PATHS = `${location.origin}/jsdelivr/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
const MODEL_URL = "/models/mnist-8.onnx";
const SIZE = 280;

type Phase = "idle" | "loading" | "running" | "ready" | "error";

function softmax(logits: Float32Array): number[] {
  const max = Math.max(...logits);
  const exps = Array.from(logits, (v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

export default function OnnxMnistDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [output, setOutput] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sessionRef = useRef<any>(null);
  const ortRef = useRef<any>(null);
  const drawing = useRef(false);

  function clear() {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, SIZE, SIZE);
    setOutput("");
    setPhase("idle");
  }

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE };
  }
  function down(e: React.PointerEvent) {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function up() {
    drawing.current = false;
  }

  async function ensureSession() {
    if (sessionRef.current) return sessionRef.current;
    setPhase("loading");
    setOutput("Loading ONNX Runtime…");
    const ort = await import("onnxruntime-web");
    ort.env.wasm.wasmPaths = WASM_PATHS;
    ortRef.current = ort;
    sessionRef.current = await ort.InferenceSession.create(MODEL_URL);
    return sessionRef.current;
  }

  function to28x28(): Float32Array {
    const small = document.createElement("canvas");
    small.width = 28;
    small.height = 28;
    const sctx = small.getContext("2d")!;
    sctx.drawImage(canvasRef.current!, 0, 0, 28, 28);
    const { data } = sctx.getImageData(0, 0, 28, 28);
    const out = new Float32Array(28 * 28);
    for (let i = 0; i < 28 * 28; i++) {
      out[i] = data[i * 4] / 255; // red channel; white stroke on black → ~1 for ink
    }
    return out;
  }

  async function predict() {
    try {
      const session = await ensureSession();
      const ort = ortRef.current;
      setPhase("running");
      const input = to28x28();
      const tensor = new ort.Tensor("float32", input, [1, 1, 28, 28]);
      const feeds: Record<string, any> = { [session.inputNames[0]]: tensor };
      const results = await session.run(feeds);
      const logits = results[session.outputNames[0]].data as Float32Array;
      const probs = softmax(logits);
      let best = 0;
      for (let i = 1; i < probs.length; i++) if (probs[i] > probs[best]) best = i;
      setOutput(`Predicted: ${best} · ${(probs[best] * 100).toFixed(1)}% confident`);
      setPhase("ready");
    } catch (e: any) {
      setPhase("error");
      setOutput("❌ " + (e?.message ?? String(e)));
    }
  }

  const busy = phase === "loading" || phase === "running";

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">✍️ Live: ONNX Runtime Web — draw a digit (MNIST)</div>
        <button className="btn" disabled={busy} onClick={predict}>
          {phase === "loading" ? "Loading…" : "Predict"}
        </button>
      </div>
      <div className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
        Runtime: <b>ONNX Runtime Web</b> · a small MNIST CNN (the engine under Transformers.js, used directly here)
      </div>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        style={{ width: 200, height: 200, borderRadius: 8, border: "1px solid #2a3342", touchAction: "none", cursor: "crosshair", display: "block", marginBottom: 8 }}
      />
      <div style={{ marginBottom: 8 }}>
        <button className="btn" disabled={busy} style={{ fontSize: 12, padding: "4px 10px", opacity: 0.9 }} onClick={clear}>
          Clear
        </button>
      </div>
      <div className={"demo-out" + (phase === "error" ? " err" : "")}>
        {output || <span className="muted">Draw a single digit (0–9) above, then Predict.</span>}
      </div>
    </div>
  );
}
