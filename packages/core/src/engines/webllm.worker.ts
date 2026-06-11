import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// Runs inside a Web Worker: the WebLLM engine does all inference here so the
// main thread never blocks. Weights are cached to OPFS by WebLLM automatically.
const handler = new WebWorkerMLCEngineHandler();
self.onmessage = (e: MessageEvent) => handler.onmessage(e);
