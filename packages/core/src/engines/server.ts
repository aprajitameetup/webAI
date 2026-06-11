import type { Engine, Message, Token } from "../types";

/**
 * Server-fallback engine: POSTs the messages to an endpoint and streams the
 * response as SSE-style `data: {json}\n\n` lines, yielding tokens.
 */
export function createServerEngine(opts: { serverUrl: string }): Engine {
  return {
    source: "server",
    async *chat(messages: Message[]): AsyncIterable<Token> {
      const res = await fetch(opts.serverUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`server ${(res as any).status ?? ""}`.trim());
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            yield { delta: "", done: true };
            return;
          }
          try {
            yield { delta: JSON.parse(data).delta ?? "", done: false };
          } catch {
            /* skip malformed line */
          }
        }
      }
      yield { delta: "", done: true };
    },
  };
}
