export interface Capabilities {
  webgpu: boolean; webnn: boolean; wasm: boolean; workers: boolean;
  opfs: boolean; webtransport: boolean; webrtc: boolean; sse: boolean;
  webcodecs: boolean; webaudio: boolean; builtinAI: boolean;
  crossOriginIsolated: boolean;
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
  };
}
