export const config = { runtime: "edge" };

// Same-origin proxy for HuggingFace model downloads. Follows the Xet CDN redirect
// server-side so the browser never makes the cross-origin request that fails CORS.
export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/hf/, "");
  const target = "https://huggingface.co" + path + url.search;
  const upstream = await fetch(target, { redirect: "follow" });
  const headers = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) headers.set("content-type", ct);
  const cl = upstream.headers.get("content-length");
  if (cl) headers.set("content-length", cl);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(upstream.body, { status: upstream.status, headers });
}
