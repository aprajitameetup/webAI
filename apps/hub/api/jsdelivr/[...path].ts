export const config = { runtime: "edge" };

// Same-origin proxy for jsdelivr CDN assets (Pyodide, MediaPipe wasm, ONNX Runtime wasm).
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/jsdelivr/, "");
  const target = "https://cdn.jsdelivr.net" + path + url.search;
  const upstream = await fetch(target, { redirect: "follow" });
  const headers = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  const cl = upstream.headers.get("content-length");
  if (cl) headers.set("content-length", cl);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(upstream.body, { status: upstream.status, headers });
}
