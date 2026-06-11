import { describe, it, expect } from "vitest";
import { selectSource } from "./create-engine";

describe("selectSource", () => {
  it("chooses on-device when webgpu available", () => {
    expect(
      selectSource({ webgpu: true, builtinAI: false, wasm: true }, {})
    ).toBe("on-device");
  });

  it("falls back to server when webgpu missing", () => {
    expect(
      selectSource({ webgpu: false, builtinAI: false, wasm: true }, { serverUrl: "/x" })
    ).toBe("server");
  });

  it("honors the prefer override", () => {
    expect(
      selectSource(
        { webgpu: true, builtinAI: false, wasm: true },
        { prefer: "server", serverUrl: "/x" }
      )
    ).toBe("server");
  });
});
