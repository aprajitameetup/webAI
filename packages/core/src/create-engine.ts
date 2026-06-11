import type {
  Capabilities,
  CreateEngineOptions,
  Engine,
  EngineSource,
} from "./types";
import { detectCapabilities } from "./detect";
import { createServerEngine } from "./engines/server";

/** Pure routing decision — easy to unit-test. */
export function selectSource(
  caps: Capabilities,
  opts: CreateEngineOptions
): EngineSource {
  if (opts.prefer) return opts.prefer;
  if (caps.webgpu) return "on-device";
  return "server";
}

export async function createEngine(
  opts: CreateEngineOptions = {}
): Promise<Engine> {
  const caps = detectCapabilities();
  const source = selectSource(caps, opts);

  if (source === "server") {
    if (!opts.serverUrl) {
      throw new Error("serverUrl required for server fallback");
    }
    return createServerEngine({ serverUrl: opts.serverUrl });
  }

  // Lazy-load the heavy WebLLM runtime only when the on-device path is chosen,
  // so server-only consumers never download it (and tests stay isolated).
  const { createLocalEngine } = await import("./engines/webllm");
  return createLocalEngine({ model: opts.model, onProgress: opts.onProgress });
}
