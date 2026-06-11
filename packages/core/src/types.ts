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
  /** Progress callback for on-device model download (0..1). */
  onProgress?: (p: number) => void;
  /** Force a path (testing / override). */
  prefer?: EngineSource;
}
