import { describe, it, expect, vi, afterEach } from "vitest";
import { createServerEngine } from "./server";

afterEach(() => {
  vi.unstubAllGlobals();
});

function sseStream(chunks: string[]) {
  return new ReadableStream({
    start(c) {
      const enc = new TextEncoder();
      for (const ch of chunks) {
        c.enqueue(enc.encode(`data: ${JSON.stringify({ delta: ch })}\n\n`));
      }
      c.enqueue(enc.encode("data: [DONE]\n\n"));
      c.close();
    },
  });
}

describe("createServerEngine", () => {
  it("yields tokens parsed from the SSE stream and marks done", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, body: sseStream(["Hel", "lo"]) }))
    );
    const engine = createServerEngine({ serverUrl: "/api/chat" });
    const out: string[] = [];
    let sawDone = false;
    for await (const t of engine.chat([{ role: "user", content: "hi" }])) {
      if (t.done) sawDone = true;
      else out.push(t.delta);
    }
    expect(out.join("")).toBe("Hello");
    expect(sawDone).toBe(true);
    expect(engine.source).toBe("server");
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, body: null })));
    const engine = createServerEngine({ serverUrl: "/api/chat" });
    await expect(async () => {
      // eslint-disable-next-line no-unused-vars
      for await (const _ of engine.chat([{ role: "user", content: "hi" }])) {
        /* consume */
      }
    }).rejects.toThrow(/server 500/);
  });
});
