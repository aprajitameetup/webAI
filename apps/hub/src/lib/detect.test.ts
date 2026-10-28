import { describe, it, expect } from "vitest";
import { detectCapabilities } from "./detect";

describe("detectCapabilities", () => {
  it("returns a boolean for every known capability key", () => {
    const caps = detectCapabilities();
    for (const key of ["webgpu","webnn","wasm","workers","opfs","webtransport","webrtc","sse","webcodecs","webaudio","builtinAI","crossOriginIsolated","webmcp","summarizer","translator","languageDetector","writer","rewriter","proofreader","wasmSimd"]) {
      expect(typeof caps[key as keyof typeof caps]).toBe("boolean");
    }
  });
});
