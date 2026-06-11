import { describe, it, expect, vi, afterEach } from "vitest";
import { detectCapabilities } from "./detect";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("detectCapabilities (core)", () => {
  it("reports webgpu=false when navigator.gpu absent", () => {
    vi.stubGlobal("navigator", {});
    expect(detectCapabilities().webgpu).toBe(false);
  });

  it("reports webgpu=true when navigator.gpu present", () => {
    vi.stubGlobal("navigator", { gpu: {} });
    expect(detectCapabilities().webgpu).toBe(true);
  });

  it("returns booleans for all keys", () => {
    const caps = detectCapabilities();
    expect(typeof caps.webgpu).toBe("boolean");
    expect(typeof caps.builtinAI).toBe("boolean");
    expect(typeof caps.wasm).toBe("boolean");
  });
});
