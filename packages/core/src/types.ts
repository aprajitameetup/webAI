export type Role = "system" | "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export type EngineSource = "on-device" | "server";

export interface Capabilities {
  webgpu: boolean;
  builtinAI: boolean;
  wasm: boolean;
}

/** A token chunk yielded during streaming. */
export interface Token {
  delta: string;
  done: boolean;
}

/** Progress of on-device model initialization. */
export interface ModelLoadProgress {
  /** Fraction complete, 0..1. */
  progress: number;
  /**
   * Human-readable phase from the runtime, e.g. "Fetching param cache[3/24]"
   * (downloading) or "Loading model from cache[5/24]" (served from cache, offline).
   */
  text: string;
}

export interface Engine {
  readonly source: EngineSource;
  /** Async-iterator streaming chat. */
  chat(messages: Message[]): AsyncIterable<Token>;
}

export interface CreateEngineOptions {
  /** WebLLM model id for the on-device path. */
  model?: string;
  /** Server endpoint for the fallback path. */
  serverUrl?: string;
  /** Progress callback for on-device model load (download or cache read). */
  onProgress?: (p: ModelLoadProgress) => void;
  /** Force a path (testing / override). */
  prefer?: EngineSource;
  /**
   * Same-origin base URL to substitute for `https://huggingface.co/` when fetching
   * on-device model weights (e.g. a dev proxy). Works around HuggingFace's Xet CDN
   * failing the browser CORS check after a cross-origin redirect.
   */
  hfProxy?: string;
}
