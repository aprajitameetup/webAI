import {
  CreateWebWorkerMLCEngine,
  prebuiltAppConfig,
  type AppConfig,
  type MLCEngineInterface,
} from "@mlc-ai/web-llm";
import type { Engine, Message, ModelLoadProgress, Token } from "../types";
import { withProxiedModel } from "./model-config";

const DEFAULT_MODEL = "Llama-3.2-1B-Instruct-q4f32_1-MLC";

/**
 * On-device engine: spins up a Web Worker running WebLLM over WebGPU.
 * The first run downloads + caches the model (OPFS); afterwards it works offline.
 */
export async function createLocalEngine(opts: {
  model?: string;
  onProgress?: (p: ModelLoadProgress) => void;
  hfProxy?: string;
}): Promise<Engine> {
  const model = opts.model ?? DEFAULT_MODEL;
  const worker = new Worker(new URL("./webllm.worker.ts", import.meta.url), {
    type: "module",
  });
  // Cache weights in OPFS so reloads work offline. Apply the dev proxy host rewrite
  // on top when provided (see model-config.ts for why).
  let appConfig: AppConfig = { ...prebuiltAppConfig, cacheBackend: "opfs" };
  if (opts.hfProxy) appConfig = withProxiedModel(appConfig, model, opts.hfProxy);
  const engine: MLCEngineInterface = await CreateWebWorkerMLCEngine(worker, model, {
    initProgressCallback: (r) =>
      opts.onProgress?.({ progress: r.progress, text: r.text }),
    appConfig,
  });

  return {
    source: "on-device",
    async *chat(messages: Message[]): AsyncIterable<Token> {
      const stream = await engine.chat.completions.create({
        messages: messages as any, // Message[] is OpenAI-compatible
        stream: true,
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? "";
        if (delta) yield { delta, done: false };
      }
      yield { delta: "", done: true };
    },
  };
}
