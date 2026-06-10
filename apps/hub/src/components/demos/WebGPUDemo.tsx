import React, { useState } from "react";

export default function WebGPUDemo() {
  const [output, setOutput] = useState<string>(
    "Click to request a GPU device and run a tiny element-wise add shader."
  );
  const [isErr, setIsErr] = useState(false);

  async function run() {
    setIsErr(false);
    setOutput("Requesting GPU…");
    try {
      const nav = navigator as any;
      if (!("gpu" in navigator)) {
        setIsErr(true);
        setOutput("❌ WebGPU not available in this browser.");
        return;
      }
      const adapter = await nav.gpu.requestAdapter();
      if (!adapter) {
        setIsErr(true);
        setOutput("❌ No GPU adapter.");
        return;
      }
      const device = await adapter.requestDevice();
      const a = new Float32Array([1, 2, 3, 4]);
      const b = new Float32Array([10, 20, 30, 40]);

      const GPUBufferUsage = (window as any).GPUBufferUsage;
      const GPUMapMode = (window as any).GPUMapMode;

      const mk = (arr: Float32Array) => {
        const buf = device.createBuffer({
          size: arr.byteLength,
          usage:
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC |
            GPUBufferUsage.COPY_DST,
        });
        device.queue.writeBuffer(buf, 0, arr);
        return buf;
      };

      const bufA = mk(a);
      const bufB = mk(b);
      const bufOut = device.createBuffer({
        size: a.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      });
      const read = device.createBuffer({
        size: a.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });

      const shader = device.createShaderModule({
        code: `@group(0)@binding(0) var<storage,read> a:array<f32>;@group(0)@binding(1) var<storage,read> b:array<f32>;@group(0)@binding(2) var<storage,read_write> o:array<f32>;@compute @workgroup_size(4) fn main(@builtin(global_invocation_id) gid:vec3u){o[gid.x]=a[gid.x]+b[gid.x];}`,
      });
      const pipe = device.createComputePipeline({
        layout: "auto",
        compute: { module: shader, entryPoint: "main" },
      });
      const bind = device.createBindGroup({
        layout: pipe.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: bufA } },
          { binding: 1, resource: { buffer: bufB } },
          { binding: 2, resource: { buffer: bufOut } },
        ],
      });
      const enc = device.createCommandEncoder();
      const pass = enc.beginComputePass();
      pass.setPipeline(pipe);
      pass.setBindGroup(0, bind);
      pass.dispatchWorkgroups(1);
      pass.end();
      enc.copyBufferToBuffer(bufOut, 0, read, 0, a.byteLength);
      device.queue.submit([enc.finish()]);
      await read.mapAsync(GPUMapMode.READ);
      const result = Array.from(new Float32Array(read.getMappedRange()));

      setOutput(
        `✓ GPU device acquired: ${adapter.info?.vendor || "gpu"} ${adapter.info?.architecture || ""}\n\n[1,2,3,4] + [10,20,30,40]\n= [${result.join(", ")}]\n\n↑ computed on the GPU via a WGSL compute shader.`
      );
    } catch (err: any) {
      setIsErr(true);
      setOutput("❌ " + (err?.message ?? String(err)));
    }
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">🎮 Live: WebGPU compute shader</div>
        <button className="btn" onClick={run}>
          Run a + b on the GPU
        </button>
      </div>
      <div className={"demo-out" + (isErr ? " err" : "")}>{output}</div>
    </div>
  );
}
