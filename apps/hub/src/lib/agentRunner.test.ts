import { describe, it, expect } from "vitest";
import { AGENT_START, AgentConfig, LEVERS_OFF, createScriptedModel, runAgent } from "./agentRunner";
import { cachedPrefixTokens, clearToolResults, repeatedCall, Message } from "./agentLevers";
import { NAIVE, simulateRun } from "./tokenLab";

const run = (patch: Partial<AgentConfig>) => {
  const cfg = { ...AGENT_START, ...patch };
  return runAgent(cfg, createScriptedModel(cfg));
};

describe("the real agent loop agrees with the cost model", () => {
  it("naive 50 turns costs about $42.5", async () => {
    const r = await run({});
    expect(r.totals.cost).toBeCloseTo(simulateRun({ ...AGENT_START, ...NAIVE }).totals.cost, 6);
    expect(r.totals.cost).toBeGreaterThan(42.3);
    expect(r.totals.cost).toBeLessThan(42.7);
    expect(r.stoppedBy).toBe("done");
  });

  it("prompt caching: about $8.4, found by comparing real message prefixes", async () => {
    const r = await run({ caching: true });
    expect(r.totals.cost).toBeCloseTo(simulateRun({ ...AGENT_START, ...NAIVE, caching: true }).totals.cost, 6);
    expect(r.totals.read).toBeGreaterThan(9e6);
  });

  it("compaction matches the model and lowers naive cost", async () => {
    const r = await run({ compactEvery: 10 });
    expect(r.totals.cost).toBeCloseTo(simulateRun({ ...AGENT_START, ...NAIVE, compactEvery: 10 }).totals.cost, 6);
    expect(r.totals.cost).toBeLessThan((await run({})).totals.cost);
    expect(r.events.some((e) => e.text.startsWith("compacted history"))).toBe(true);
  });
});

describe("levers", () => {
  it("clearing tool results shrinks a tool-heavy run and logs what it freed", async () => {
    const heavy = await run({ tool: 3000 });
    const cleared = await run({ tool: 3000, clearTools: true });
    expect(cleared.totals.input).toBeLessThan(heavy.totals.input);
    expect(cleared.events.some((e) => e.text.includes("cleared"))).toBe(true);
  });

  it("a step budget stops the run early", async () => {
    const r = await run({ maxTurns: 10 });
    expect(r.rows).toHaveLength(10);
    expect(r.stoppedBy).toBe("budget");
  });

  it("loop detection stops a stuck agent on the third identical call", async () => {
    const stuck = await run({ turns: 100, stuckAfter: 8 });
    expect(stuck.rows).toHaveLength(100);
    const guarded = await run({ turns: 100, stuckAfter: 8, stopOnRepeat: 3 });
    expect(guarded.stoppedBy).toBe("repeat");
    expect(guarded.rows).toHaveLength(10);
    expect(guarded.totals.cost).toBeLessThan(stuck.totals.cost / 5);
  });

  it("clearing a tool result ends the cached prefix at that message (an honest interaction)", () => {
    const mk = (id: number, role: Message["role"], tokens: number, read = false): Message => ({ id, version: 0, role, content: "x", tokens, read });
    const before = [mk(1, "system", 100), mk(2, "tool", 500, true), mk(3, "user", 10)];
    const keys = before.map((m) => `${m.id}:${m.version}`);
    const { messages } = clearToolResults(before);
    expect(cachedPrefixTokens(keys, before)).toBe(610);
    expect(cachedPrefixTokens(keys, messages)).toBe(100);
  });

  it("repeatedCall needs N identical calls in a row", () => {
    expect(repeatedCall(["a", "b", "b"], 3)).toBe(false);
    expect(repeatedCall(["a", "b", "b", "b"], 3)).toBe(true);
  });
});

describe("levers off is the naive loop", () => {
  it("LEVERS_OFF changes nothing", async () => {
    expect((await run({ ...LEVERS_OFF })).totals.cost).toBeCloseTo((await run({})).totals.cost, 6);
  });
});
