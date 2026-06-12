import React, { useRef, useState } from "react";

// Hand-assembled module exporting sumsq(n:i32)->i64 = sum of i*i for i in [0,n).
// Verified in Node before embedding (sumsq(1000) = 332833500).
const WASM_BYTES = new Uint8Array([
  0, 97, 115, 109, 1, 0, 0, 0,
  1, 6, 1, 96, 1, 127, 1, 126,
  3, 2, 1, 0,
  7, 9, 1, 5, 115, 117, 109, 115, 113, 0, 0,
  10, 44, 1, 42,
  2, 1, 127, 1, 126,
  2, 64, 3, 64,
  32, 1, 32, 0, 79, 13, 1,
  32, 2, 32, 1, 173, 32, 1, 173, 126, 124, 33, 2,
  32, 1, 65, 1, 106, 33, 1,
  12, 0, 11, 11,
  32, 2, 11,
]);
const N = 50_000_000;

export default function WasmDemo() {
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const fnRef = useRef<((n: number) => bigint) | null>(null);

  async function run() {
    setBusy(true);
    setOutput("Running…");
    try {
      if (!fnRef.current) {
        const { instance } = await WebAssembly.instantiate(WASM_BYTES);
        fnRef.current = instance.exports.sumsq as (n: number) => bigint;
      }
      const t0 = performance.now();
      const wasmRes = fnRef.current(N);
      const t1 = performance.now();
      let acc = 0;
      for (let i = 0; i < N; i++) acc += i * i;
      const t2 = performance.now();
      const wms = t1 - t0;
      const jms = t2 - t1;
      // Reference both results so the JIT can't dead-code-eliminate the JS loop.
      const verdict =
        Math.abs(wms - jms) / Math.max(wms, jms) < 0.25
          ? "≈ a tie — JS JITs tight loops superbly."
          : wms < jms
            ? `WASM ${(jms / wms).toFixed(1)}× faster here.`
            : `JS ${(wms / jms).toFixed(1)}× faster here — the JIT wins simple loops.`;
      setOutput(
        `WASM:  ${wms.toFixed(1)} ms\n` +
          `JS:    ${jms.toFixed(1)} ms   →  ${verdict}\n` +
          `\nWASM isn't magically faster for a trivial loop — modern JS JITs are\n` +
          `excellent. WASM's real edge: predictable speed (no warmup/deopt),\n` +
          `SIMD + threads, and running existing C/C++/Rust — that's why\n` +
          `llama.cpp and ONNX Runtime are WASM ports.\n` +
          `\n(checksum w=${(wasmRes % 100000n).toString()} js=${(acc % 100000).toFixed(0)}, i² for i<${N.toLocaleString()})`,
      );
    } catch (e: any) {
      setOutput("❌ " + (e?.message ?? String(e)));
    }
    setBusy(false);
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🧩 Live: WebAssembly vs JS — tight-loop benchmark</div>
        <button className="btn" disabled={busy} onClick={run}>
          {busy ? "Running…" : "Run benchmark"}
        </button>
      </div>
      <div className="demo-out" style={{ whiteSpace: "pre-wrap" }}>
        {output || <span className="muted">Runs the same integer loop in a tiny WASM module and in JS, and times both.</span>}
      </div>
    </div>
  );
}
