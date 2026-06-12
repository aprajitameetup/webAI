import type { AppConfig } from "@mlc-ai/web-llm";

/**
 * Return a copy of `base` with the target model's weight host rewritten to `hfProxy`.
 *
 * WebLLM resolves weight shards relative to each model's `model` URL, which points at
 * `https://huggingface.co/...`. HuggingFace 302-redirects large files to its Xet CDN, and
 * that cross-origin redirect fails the browser CORS check. Rewriting the host to a
 * same-origin proxy (which follows the redirect server-side) sidesteps the problem.
 */
export function withProxiedModel(base: AppConfig, model: string, hfProxy: string): AppConfig {
  return {
    ...base,
    model_list: base.model_list.map((record) =>
      record.model_id === model
        ? { ...record, model: record.model.replace("https://huggingface.co/", hfProxy) }
        : record,
    ),
  };
}
