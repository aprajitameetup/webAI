import { describe, expect, it } from "vitest";
import { ModelContextShim, installModelContext } from "./webmcp";

const tool = (name = "t", extra: object = {}) => ({ name, description: "does a thing", execute: async () => ({ a: 1 }), ...extra });

describe("ModelContextShim", () => {
  it("registers, lists and executes, returning a string", async () => {
    const c = new ModelContextShim();
    await c.registerTool(tool("order_thali", { annotations: { readOnlyHint: true } }));
    const [t] = await c.getTools();
    expect(t.name).toBe("order_thali");
    expect(t.annotations.readOnlyHint).toBe(true);
    expect(t.annotations.consequentialHint).toBe(false);
    expect(await c.executeTool(t, {})).toBe('{"a":1}');
  });

  it("rejects bad names, empty descriptions, duplicates", async () => {
    const c = new ModelContextShim();
    await expect(c.registerTool(tool("bad name"))).rejects.toThrow(TypeError);
    await expect(c.registerTool({ ...tool("x"), description: " " })).rejects.toThrow(TypeError);
    await c.registerTool(tool("x"));
    await expect(c.registerTool(tool("x"))).rejects.toThrow(/already registered/);
  });

  it("aborting the signal unregisters and fires toolchange", async () => {
    const c = new ModelContextShim();
    const ac = new AbortController();
    let changes = 0;
    c.addEventListener("toolchange", () => changes++);
    await c.registerTool(tool("x"), { signal: ac.signal });
    ac.abort();
    expect(await c.getTools()).toHaveLength(0);
    expect(changes).toBe(2);
    await expect(c.executeTool("x")).rejects.toThrow(/NotFoundError/);
  });

  it("installModelContext prefers a native implementation", () => {
    const native = {};
    expect(installModelContext({ modelContext: native })).toEqual({ ctx: native, source: "native" });
    const target: { modelContext?: unknown } = {};
    expect(installModelContext(target).source).toBe("shim");
    expect(installModelContext(target).source).toBe("shim");
  });
});
