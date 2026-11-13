// Data layer for the Review Lab demo (Kanpur): a tiny in-browser "backend" so the
// generated page and the reviewed page talk to the same thing, with no server.

export type TicketStatus = "open" | "pending" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface Ticket {
  id: number;
  subject: string;
  customer: string;
  status: TicketStatus;
  priority: TicketPriority;
  created: string;
  /** Rich text from the API. Treat as untrusted. */
  description: string;
}

/** How the "network" behaves, so each state of the page can be shown on demand. */
export type LabMode = "normal" | "fail" | "empty";

const STATUSES: TicketStatus[] = ["open", "pending", "closed"];
const PRIORITIES: TicketPriority[] = ["low", "normal", "high", "urgent"];
const CUSTOMERS = ["Northwind Telecom", "Contoso Energy", "Fabrikam Rail", "Adventure Works", "Tailspin Air", "Litware Bank"];
const SUBJECTS = [
  "Cannot export monthly usage report",
  "Dashboard times out on large date ranges",
  "Invoice total does not match line items",
  "Password reset email never arrives",
  "Alert rule fires twice for one event",
  "Scheduled report missing from inbox",
  "Search returns no results for exact ID",
  "Chart colours are hard to tell apart",
  "Bulk upload stops at row 500",
  "Mobile layout cuts off the action column",
];

/** Ticket index whose description carries a script-bearing payload, as a customer could paste one. */
export const HOSTILE_TICKET_ID = 1006;

function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

export function buildTickets(count = 2500, now = Date.UTC(2026, 10, 12)): Ticket[] {
  const r = rng(42);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  return Array.from({ length: count }, (_, i) => {
    const id = 1000 + i;
    return {
      id,
      subject: pick(SUBJECTS),
      customer: pick(CUSTOMERS),
      status: pick(STATUSES),
      priority: pick(PRIORITIES),
      created: new Date(now - Math.floor(r() * 90 * 86400000)).toISOString(),
      description:
        id === HOSTILE_TICKET_ID
          ? `Customer pasted this into the form: <img src=x onerror="document.querySelector('[data-lab] h1').textContent='Hacked by a ticket'">`
          : `<p>${pick(SUBJECTS)}. Reported by the <b>${pick(CUSTOMERS)}</b> team.</p>`,
    };
  });
}

const TICKETS = buildTickets();
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function fetchTickets(mode: LabMode = "normal", signal?: AbortSignal): Promise<Ticket[]> {
  await sleep(1200);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  if (mode === "fail") throw new Error("The server did not answer in time");
  return mode === "empty" ? [] : TICKETS.map((t) => ({ ...t }));
}

export interface NewTicketInput {
  subject: string;
  customer: string;
  priority: TicketPriority;
}

export async function createTicket(input: NewTicketInput): Promise<Ticket> {
  await sleep(400);
  return {
    id: 9999,
    status: "open",
    created: new Date().toISOString(),
    description: `<p>${input.subject}</p>`,
    ...input,
  };
}

/** The assistant answers the way a model often does: as an HTML string. `text` is the same answer as plain text. */
export async function askAssistant(question: string, _apiKey?: string): Promise<{ html: string; text: string }> {
  // `_apiKey` stands for a client-held credential. The mock ignores it; a real backend would not need it in the browser.
  await sleep(700);
  const q = question.trim().slice(0, 80) || "that";
  return {
    html: `<p>For <b>${q}</b>, check the <i>delivery rule</i> on the schedule, then re-run the report.</p>`,
    text: `For ${q}, check the delivery rule on the schedule, then re-run the report.`,
  };
}

// ---- pure helpers the reviewed page uses (and the tests cover) ----

export function filterTickets(tickets: Ticket[], search: string, status: TicketStatus | "all"): Ticket[] {
  const q = search.trim().toLowerCase();
  return tickets
    .filter((t) => status === "all" || t.status === status)
    .filter((t) => !q || `${t.subject} ${t.customer} ${t.id}`.toLowerCase().includes(q))
    .sort((a, b) => (a.created < b.created ? 1 : a.created > b.created ? -1 : 0));
}

const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
export function relativeTime(iso: string, now = Date.now()): string {
  const days = Math.round((new Date(iso).getTime() - now) / 86400000);
  if (Math.abs(days) >= 30) return RTF.format(Math.round(days / 30), "month");
  return RTF.format(days, "day");
}

/** Plain text of an HTML string, without ever inserting it into the page. */
export function htmlToText(html: string): string {
  return new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
}
