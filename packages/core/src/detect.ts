import type { Capabilities } from "./types";

const safe = (fn: () => boolean): boolean => {
  try {
    return !!fn();
  } catch {
    return false;
  }
};

export function detectCapabilities(): Capabilities {
  return {
    webgpu: safe(() => "gpu" in navigator),
    builtinAI: safe(
      () => "LanguageModel" in (globalThis as any) || !!(globalThis as any).ai
    ),
    wasm: safe(() => typeof WebAssembly === "object"),
  };
}
