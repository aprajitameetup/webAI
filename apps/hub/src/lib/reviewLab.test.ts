import { describe, expect, it } from "vitest";
import { buildTickets, filterTickets, relativeTime, HOSTILE_TICKET_ID } from "./reviewLab";

const NOW = Date.UTC(2026, 10, 12);

describe("buildTickets", () => {
  it("is deterministic and carries one ticket with script-bearing markup", () => {
    const a = buildTickets(50, NOW);
    const b = buildTickets(50, NOW);
    expect(a).toEqual(b);
    expect(buildTickets(2500, NOW).filter((t) => /onerror/i.test(t.description)).map((t) => t.id)).toEqual([HOSTILE_TICKET_ID]);
  });
});

describe("filterTickets", () => {
  const tickets = buildTickets(300, NOW);

  it("filters by status", () => {
    const open = filterTickets(tickets, "", "open");
    expect(open.length).toBeGreaterThan(0);
    expect(open.every((t) => t.status === "open")).toBe(true);
  });

  it("matches subject, customer and id, ignoring case", () => {
    const hit = tickets[7];
    expect(filterTickets(tickets, String(hit.id), "all").map((t) => t.id)).toContain(hit.id);
    expect(filterTickets(tickets, hit.customer.toUpperCase(), "all").every((t) => t.customer === hit.customer || t.subject.toLowerCase().includes(hit.customer.toLowerCase()))).toBe(true);
  });

  it("returns newest first and does not mutate its input", () => {
    const before = tickets.map((t) => t.id);
    const out = filterTickets(tickets, "", "all");
    expect(tickets.map((t) => t.id)).toEqual(before);
    for (let i = 1; i < out.length; i++) expect(out[i - 1].created >= out[i].created).toBe(true);
  });

  it("returns nothing for a query that matches nothing", () => {
    expect(filterTickets(tickets, "zzzz-no-such-ticket", "all")).toEqual([]);
  });
});

describe("relativeTime", () => {
  it("speaks in days up to a month, then months", () => {
    expect(relativeTime(new Date(NOW - 3 * 86400000).toISOString(), NOW)).toBe("3 days ago");
    expect(relativeTime(new Date(NOW - 86400000).toISOString(), NOW)).toBe("yesterday");
    expect(relativeTime(new Date(NOW - 65 * 86400000).toISOString(), NOW)).toBe("2 months ago");
  });
});
