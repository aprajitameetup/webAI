import { describe, it, expect } from "vitest";
import { detectCapabilities } from "./detect";

describe("detectCapabilities", () => {
  it("returns a boolean for every known capability key", () => {
    const caps = detectCapabilities();
    for (const key of ["webgpu","webnn","wasm","workers","opfs","webtransport","webrtc","sse","webcodecs","webaudio","builtinAI","crossOriginIsolated"]) {
      expect(typeof caps[key as keyof typeof caps]).toBe("boolean");
    }
  });
});
