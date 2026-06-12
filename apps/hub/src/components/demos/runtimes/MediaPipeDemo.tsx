import React, { useRef, useState } from "react";

const MP_VERSION = "0.10.18";
const WASM_DIR = `${location.origin}/jsdelivr/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL_URL = `${location.origin}/gstorage/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`;

type Phase = "idle" | "loading" | "running" | "ready" | "error";

export default function MediaPipeDemo() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [output, setOutput] = useState("");
  const [hasImage, setHasImage] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<any>(null);

  function drawImage(img: HTMLImageElement) {
    const c = canvasRef.current;
    if (!c) return;
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d")!.drawImage(img, 0, 0);
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      drawImage(img);
    };
    img.src = URL.createObjectURL(file);
    setHasImage(true);
    setOutput("");
    setPhase("idle");
  }

  async function ensureLandmarker() {
    if (landmarkerRef.current) return landmarkerRef.current;
    setPhase("loading");
    setOutput("Loading MediaPipe…");
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_DIR);
    landmarkerRef.current = await vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: "IMAGE",
      numFaces: 2,
    });
    landmarkerRef.current.__vision = vision; // keep DrawingUtils + connectors handy
    return landmarkerRef.current;
  }

  async function detect() {
    if (!imgRef.current) return;
    try {
      const landmarker = await ensureLandmarker();
      setPhase("running");
      const result = landmarker.detect(imgRef.current);
      drawImage(imgRef.current);
      const vision = landmarker.__vision;
      const ctx = canvasRef.current!.getContext("2d")!;
      const drawingUtils = new vision.DrawingUtils(ctx);
      for (const landmarks of result.faceLandmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          vision.FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          { color: "#30c8ff55", lineWidth: 1 },
        );
        drawingUtils.drawConnectors(
          landmarks,
          vision.FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
          { color: "#30c8ff", lineWidth: 2 },
        );
      }
      const n = result.faceLandmarks.length;
      setOutput(n ? `Detected ${n} face(s) · 468 landmarks each` : "No face detected — try a clearer face photo.");
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
        <div className="title">👤 Live: MediaPipe — face landmarks</div>
        <button className="btn" disabled={busy || !hasImage} onClick={detect}>
          {phase === "loading" ? "Loading…" : "Detect faces"}
        </button>
      </div>
      <div className="muted" style={{ marginBottom: 8, fontSize: 13 }}>
        Runtime: <b>MediaPipe Tasks (vision)</b> · FaceLandmarker — 468 3D landmarks per face, on-device
      </div>
      <input type="file" accept="image/*" onChange={onPick} style={{ marginBottom: 4, color: "#e6edf3" }} />
      <div className="muted" style={{ marginBottom: 8, fontSize: 12 }}>
        Tip: use a clear, front-facing face photo.
      </div>
      <canvas
        ref={canvasRef}
        style={{ maxWidth: "100%", maxHeight: 280, height: "auto", borderRadius: 8, display: hasImage ? "block" : "none", marginBottom: 8 }}
      />
      <div className={"demo-out" + (phase === "error" ? " err" : "")}>
        {output || <span className="muted">Pick a face photo; MediaPipe maps the face mesh on-device.</span>}
      </div>
    </div>
  );
}
