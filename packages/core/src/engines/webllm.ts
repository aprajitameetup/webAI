import {
  CreateWebWorkerMLCEngine,
  type MLCEngineInterface,
} from "@mlc-ai/web-llm";
import type { Engine, Message, Token } from "../types";

const DEFAULT_MODEL = "Llama-3.2-1B-Instruct-q4f32_1-MLC";

/**
 * On-device engine: spins up a Web Worker running WebLLM over WebGPU.
 * The first run downloads + caches the model (OPFS); afterwards it works offline.
 */
export async function createLocalEngine(opts: {
  model?: string;
  onProgress?: (p: number) => void;
}): Promise<Engine> {
  const worker = new Worker(new URL("./webllm.worker.ts", import.meta.url), {
    type: "module",
  });
  const engine: MLCEngineInterface = await CreateWebWorkerMLCEngine(
    worker,
    opts.model ?? DEFAULT_MODEL,
    { initProgressCallback: (r) => opts.onProgress?.(r.progress) }
  );

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
