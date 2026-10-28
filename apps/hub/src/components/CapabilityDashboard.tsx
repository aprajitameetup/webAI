import React from "react";
import { detectCapabilities } from "../lib/detect";

export const CAP_META: Array<{ key: keyof ReturnType<typeof detectCapabilities>; name: string; detail: string }> = [
  { key: "webgpu",             name: "WebGPU",                  detail: "navigator.gpu" },
  { key: "webnn",              name: "WebNN",                   detail: "navigator.ml" },
  { key: "wasm",               name: "WebAssembly",             detail: "core Wasm" },
  { key: "workers",            name: "Web Workers",             detail: "background threads" },
  { key: "crossOriginIsolated",name: "Cross-origin isolated",   detail: "COOP+COEP set" },
  { key: "opfs",               name: "OPFS",                    detail: "private file system" },
  { key: "webtransport",       name: "WebTransport",            detail: "HTTP/3 transport" },
  { key: "webrtc",             name: "WebRTC",                  detail: "realtime audio/video" },
  { key: "sse",                name: "Server-Sent Events",      detail: "token streaming" },
  { key: "webcodecs",          name: "WebCodecs",               detail: "video/audio frames" },
  { key: "webaudio",           name: "Web Audio",               detail: "voice I/O" },
  { key: "builtinAI",          name: "Built-in AI (Prompt)",    detail: "Gemini Nano" },
  { key: "summarizer",         name: "Summarizer API",          detail: "Gemini Nano, on device" },
  { key: "translator",         name: "Translator API",          detail: "on-device translation" },
  { key: "languageDetector",   name: "Language Detector API",   detail: "on-device detection" },
  { key: "writer",             name: "Writer API",              detail: "built-in AI, experimental" },
  { key: "rewriter",           name: "Rewriter API",            detail: "built-in AI, experimental" },
  { key: "proofreader",        name: "Proofreader API",         detail: "built-in AI, experimental" },
  { key: "wasmSimd",           name: "Wasm SIMD",               detail: "fast vector maths" },
  { key: "webmcp",             name: "WebMCP",                  detail: "document.modelContext" },
];

// These are detected separately from the detect.ts lib but we add them inline
export const EXTRA_CAPS: Array<{ name: string; detail: string; value: boolean }> = [
  {
    name: "SharedArrayBuffer",
    detail: "needs COOP/COEP",
    value: (() => { try { return typeof SharedArrayBuffer !== "undefined"; } catch { return false; } })(),
  },
  {
    name: "Service Worker",
    detail: "offline / cache",
    value: (() => { try { return "serviceWorker" in navigator; } catch { return false; } })(),
  },
  {
    name: "Cache API",
    detail: "HTTP cache",
    value: (() => { try { return "caches" in window; } catch { return false; } })(),
  },
  {
    name: "IndexedDB",
    detail: "structured store",
    value: (() => { try { return "indexedDB" in window; } catch { return false; } })(),
  },
];

export default function CapabilityDashboard() {
  const caps = detectCapabilities();

  return (
    <div className="cap-grid">
      {CAP_META.map(({ key, name, detail }) => {
        const ok = caps[key];
        return (
          <div className="cap" key={key}>
            <div className={`status ${ok ? "yes" : "no"}`}>{ok ? "✓" : "✕"}</div>
            <div className="info">
              <div className="name">{name}</div>
              <div className="detail">{detail}</div>
            </div>
          </div>
        );
      })}
      {EXTRA_CAPS.map(({ name, detail, value }) => (
        <div className="cap" key={name}>
          <div className={`status ${value ? "yes" : "no"}`}>{value ? "✓" : "✕"}</div>
          <div className="info">
            <div className="name">{name}</div>
            <div className="detail">{detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
