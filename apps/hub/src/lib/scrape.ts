/** The scraping way: read the rendered HTML and pull values out with selectors. */

export interface ScrapedIncident {
  title: string;
  service: string;
  severity: number;
  open: boolean;
}

export function scrapeIncidents(html: string): ScrapedIncident[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [...doc.querySelectorAll("tr.row")].map((row) => ({
    title: row.querySelector(".title")?.textContent?.trim() ?? "",
    service: row.querySelector(".svc")?.textContent?.trim() ?? "",
    severity: Number(/P(\d)/.exec(row.querySelector(".sev")?.textContent ?? "")?.[1]),
    open: row.querySelector(".status")?.textContent?.trim() === "Open",
  }));
}

export function highestSeverityOpen(rows: ScrapedIncident[], service: string) {
  return rows.filter((r) => r.service === service && r.open).sort((a, b) => a.severity - b.severity)[0];
}
