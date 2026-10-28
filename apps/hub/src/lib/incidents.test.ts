import { describe, expect, it } from "vitest";
import { ModelContextShim } from "./webmcp";
import { INCIDENTS, TASK_ANSWER, nearest, queryIncidents } from "./incidents";
import { incidentTool } from "./incidentTools";
import { estimateTokens } from "./tokenLab";

const run = async (opts: { filter: boolean; compact: boolean; richErrors: boolean }, args = {}) => {
  const ctx = new ModelContextShim();
  await ctx.registerTool(incidentTool(opts));
  return ctx.executeTool("get_incidents", args);
};

describe("incidents", () => {
  it("the task has one clear answer, and the trap is a resolved P1", () => {
    const [top] = queryIncidents({ service: "billing", status: "open", sortBy: "severity", limit: 1 });
    expect(top.id).toBe(TASK_ANSWER);
    expect(INCIDENTS.find((i) => i.service === "billing" && i.severity === 1)?.status).toBe("resolved");
  });

  it("each optimisation lowers what the caller has to read", async () => {
    const args = { service: "billing", status: "open", sortBy: "severity", limit: 1 };
    const asIs = estimateTokens(await run({ filter: false, compact: false, richErrors: false }));
    const compact = estimateTokens(await run({ filter: false, compact: true, richErrors: false }));
    const filtered = estimateTokens(await run({ filter: true, compact: false, richErrors: false }, args));
    const both = estimateTokens(await run({ filter: true, compact: true, richErrors: false }, args));
    expect(asIs).toBeGreaterThan(compact);
    expect(asIs).toBeGreaterThan(filtered);
    expect(Math.min(compact, filtered)).toBeGreaterThan(both);
  });

  it("without the filter option the schema has no parameters", async () => {
    const ctx = new ModelContextShim();
    await ctx.registerTool(incidentTool({ filter: false, compact: false, richErrors: false }));
    expect((await ctx.getTools())[0].inputSchema).toEqual({ type: "object", properties: {} });
  });
});

describe("errors", () => {
  const call = async (richErrors: boolean) => {
    const ctx = new ModelContextShim();
    await ctx.registerTool(incidentTool({ filter: true, compact: true, richErrors }));
    return ctx.executeTool("get_incidents", { service: "biling" }).catch((e: Error) => e.message);
  };

  it("an opaque error carries nothing to retry with", async () => {
    expect(await call(false)).toBe("ERR_400");
  });

  it("a rich error names the problem and the valid values", async () => {
    const e = JSON.parse((await call(true)) as string);
    expect(e).toMatchObject({ code: "UNKNOWN_SERVICE", retryable: false });
    expect(e.validValues).toContain("billing");
    expect(nearest("biling", e.validValues)).toBe("billing");
  });
});
