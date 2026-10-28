/** Sample data for the WebMCP demo: an operations incidents table. */

export interface Incident {
  id: string;
  title: string;
  service: string;
  severity: 1 | 2 | 3 | 4;
  status: "open" | "resolved";
  owner: string;
  opened: string;
  description: string;
  runbookUrl: string;
  timeline: string[];
}

export const SERVICES = ["billing", "auth", "search", "notifications"] as const;

// [title, service, severity, status]
const ROWS: [string, string, 1 | 2 | 3 | 4, "open" | "resolved"][] = [
  ["Card payments failing for one region", "billing", 1, "resolved"],
  ["Invoice generation timing out", "billing", 2, "open"],
  ["Refund webhook delayed", "billing", 3, "open"],
  ["Tax rounding mismatch on exports", "billing", 4, "open"],
  ["Duplicate receipts emailed", "billing", 3, "resolved"],
  ["Login latency above target", "auth", 2, "open"],
  ["SSO callback returns 500", "auth", 1, "open"],
  ["Password reset links expire early", "auth", 3, "resolved"],
  ["Token refresh storm after deploy", "auth", 2, "resolved"],
  ["Audit log missing one field", "auth", 4, "open"],
  ["Search results stale by 10 minutes", "search", 2, "open"],
  ["Index rebuild stuck at 80 percent", "search", 3, "open"],
  ["Autocomplete drops accented characters", "search", 4, "open"],
  ["Query timeout on long filters", "search", 3, "resolved"],
  ["Ranking regression on exact matches", "search", 2, "resolved"],
  ["Push notifications not delivered on one platform", "notifications", 2, "open"],
  ["Digest email sent twice", "notifications", 3, "open"],
  ["Unsubscribe link broken in footer", "notifications", 4, "resolved"],
  ["SMS provider rate limiting", "notifications", 2, "resolved"],
  ["Quiet hours ignored for one time zone", "notifications", 3, "open"],
  ["Billing export job skipped a day", "billing", 3, "resolved"],
  ["Search suggestions show deleted items", "search", 4, "resolved"],
  ["Session cookie missing SameSite attribute", "auth", 3, "open"],
  ["Notification preferences not saved", "notifications", 3, "resolved"],
];

export const INCIDENTS: Incident[] = ROWS.map(([title, service, severity, status], i) => ({
  id: `INC-${1001 + i}`,
  title,
  service,
  severity,
  status,
  owner: `team-${service}`,
  opened: new Date(Date.UTC(2026, 9, 1 + i)).toISOString(),
  description: `${title}. Reported by monitoring and confirmed by the on-call engineer. Customer impact is being tracked in the incident channel.`,
  runbookUrl: `https://runbooks.example.com/${service}/${1001 + i}`,
  timeline: ["Alert fired", "On-call acknowledged", status === "resolved" ? "Fix deployed and verified" : "Investigating"],
}));

export interface IncidentQuery {
  service?: string;
  status?: "open" | "resolved";
  sortBy?: "severity";
  limit?: number;
}

export function queryIncidents(q: IncidentQuery = {}): Incident[] {
  let rows = INCIDENTS.filter((i) => (!q.service || i.service === q.service) && (!q.status || i.status === q.status));
  if (q.sortBy === "severity") rows = [...rows].sort((a, b) => a.severity - b.severity || b.opened.localeCompare(a.opened));
  return q.limit ? rows.slice(0, q.limit) : rows;
}

/** The closest of `options` to `word`, by edit distance. */
export function nearest(word: string, options: readonly string[]): string {
  const dist = (a: string, b: string) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  };
  return [...options].sort((x, y) => dist(word, x) - dist(word, y))[0];
}

/** The task every approach has to answer. */
export const TASK = "Find the highest-severity open incident for the billing service.";
export const TASK_ANSWER = "INC-1002";
