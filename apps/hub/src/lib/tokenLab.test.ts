import { describe, it, expect } from "vitest";
import {
  estimateTokens,
  dedupeLines,
  collapseWhitespace,
  truncateToTokens,
  routeTask,
  runGate,
  simulateRun,
  DEFAULT_PRICES,
  NAIVE,
  RunParams,
} from "./tokenLab";

const base: RunParams = {
  turns: 50,
  system: 60000,
  question: 200,
  answer: 5000,
  tool: 0,
  prices: DEFAULT_PRICES,
  summary: 3000,
  ...NAIVE,
};

describe("estimateTokens", () => {
  it("is about four characters per token", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcde")).toBe(2);
  });
});

describe("before the wire", () => {
  it("dedupeLines keeps the first copy of a repeated line and keeps blank lines", () => {
    expect(dedupeLines("a\nb\na\n\nb\nc")).toBe("a\nb\n\nc");
  });

  it("collapseWhitespace squeezes spaces and blank runs", () => {
    expect(collapseWhitespace("a   b\n\n\n\nc  ")).toBe("a b\n\nc");
  });

  it("truncateToTokens keeps head and tail and reports what it removed", () => {
    const long = "x".repeat(4000);
    const out = truncateToTokens(long, 100);
    expect(out).toContain("tokens removed locally");
    expect(estimateTokens(out)).toBeLessThan(160);
    expect(truncateToTokens("short", 100)).toBe("short");
  });

  it("routeTask sends long or tool-heavy work to the server and short work to the device", () => {
    expect(routeTask("what is the status of order 4821?").where).toBe("device");
    expect(routeTask("y".repeat(8000)).where).toBe("server");
    expect(routeTask("compare these three vendors").where).toBe("server");
  });

  it("runGate never grows the payload and can flip the route to the device", () => {
    const messy = "[debug] heartbeat ok\n".repeat(400) + "status: in_transit\n";
    const g = runGate(messy, { dedupe: true, collapse: true, truncate: true, truncateTo: 300 });
    expect(g.routeRaw.where).toBe("server");
    expect(g.route.where).toBe("device");
    for (let i = 1; i < g.stages.length; i++) expect(g.stages[i].tokens).toBeLessThanOrEqual(g.stages[i - 1].tokens);
    expect(g.savedPct).toBeGreaterThan(90);
  });
});

describe("after the wire: simulateRun", () => {
  it("reproduces the talk's naive 50-turn example (about $42)", () => {
    const r = simulateRun(base);
    expect(r.totals.cost).toBeGreaterThan(42.3);
    expect(r.totals.cost).toBeLessThan(42.7);
    expect(r.rows[0].cost).toBeCloseTo(0.3408, 3);
    // input on turn 50 is about 5x input on turn 1
    const inputCost = (n: number) => (r.rows[n - 1].input * 4) / 1e6;
    expect(inputCost(50)).toBeCloseTo(1.26, 2);
    expect(inputCost(50) / inputCost(1)).toBeGreaterThan(5);
  });

  it("prompt caching brings the same run to about $8, with a pricier first turn", () => {
    const r = simulateRun({ ...base, caching: true });
    expect(r.totals.cost).toBeGreaterThan(8.2);
    expect(r.totals.cost).toBeLessThan(8.6);
    expect(r.rows[0].cost).toBeCloseTo(0.4012, 3);
    expect(r.rows[0].cost).toBeGreaterThan(simulateRun(base).rows[0].cost);
  });

  it("compaction cuts the tokens processed and the naive cost, and is not free", () => {
    const naive = simulateRun(base);
    const compact = simulateRun({ ...base, compactEvery: 10 });
    expect(compact.totals.input).toBeLessThan(naive.totals.input);
    expect(compact.totals.cost).toBeLessThan(naive.totals.cost);
  });

  it("clearing tool results shrinks a tool-heavy run", () => {
    const heavy = { ...base, tool: 3000 };
    expect(simulateRun({ ...heavy, clearTools: true }).totals.input).toBeLessThan(simulateRun(heavy).totals.input);
  });

  it("a step budget stops the run early and says so", () => {
    const r = simulateRun({ ...base, maxTurns: 10 });
    expect(r.rows).toHaveLength(10);
    expect(r.stoppedByBudget).toBe(true);
    expect(simulateRun(base).stoppedByBudget).toBe(false);
  });
});
