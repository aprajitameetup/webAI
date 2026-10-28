import { ModelContextShim } from "./webmcp";

export interface Capabilities {
  webgpu: boolean; webnn: boolean; wasm: boolean; workers: boolean;
  opfs: boolean; webtransport: boolean; webrtc: boolean; sse: boolean;
  webcodecs: boolean; webaudio: boolean; builtinAI: boolean;
  crossOriginIsolated: boolean; webmcp: boolean;
  summarizer: boolean; translator: boolean; languageDetector: boolean;
  writer: boolean; rewriter: boolean; proofreader: boolean; wasmSimd: boolean;
}

const safe = (fn: () => boolean): boolean => { try { return !!fn(); } catch { return false; } };

export function detectCapabilities(): Capabilities {
  return {
    webgpu: safe(() => "gpu" in navigator),
    webnn: safe(() => "ml" in navigator),
    wasm: safe(() => typeof WebAssembly === "object"),
    workers: safe(() => typeof Worker !== "undefined"),
    opfs: safe(() => !!navigator.storage && "getDirectory" in navigator.storage),
    webtransport: safe(() => typeof (globalThis as any).WebTransport !== "undefined"),
    webrtc: safe(() => typeof RTCPeerConnection !== "undefined"),
    sse: safe(() => typeof EventSource !== "undefined"),
    webcodecs: safe(() => typeof (globalThis as any).VideoEncoder !== "undefined"),
    webaudio: safe(() => typeof (window.AudioContext || (window as any).webkitAudioContext) !== "undefined"),
    builtinAI: safe(() => "LanguageModel" in self || !!(window as any).ai),
    crossOriginIsolated: safe(() => self.crossOriginIsolated === true),
    summarizer: safe(() => "Summarizer" in self),
    translator: safe(() => "Translator" in self),
    languageDetector: safe(() => "LanguageDetector" in self),
    writer: safe(() => "Writer" in self),
    rewriter: safe(() => "Rewriter" in self),
    proofreader: safe(() => "Proofreader" in self),
    // A tiny module that uses a SIMD instruction: it validates only where Wasm SIMD is supported.
    wasmSimd: safe(() => WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]))),
    // The browser's own implementation only. The hub attaches a shim for its WebMCP demos, which must not count.
    webmcp: safe(() => {
      const ctx = (document as any).modelContext ?? (navigator as any).modelContext;
      return !!ctx && !(ctx instanceof ModelContextShim);
    }),
  };
}
