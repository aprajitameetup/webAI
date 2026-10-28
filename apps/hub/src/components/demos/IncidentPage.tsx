import React from "react";
import { INCIDENTS } from "../../lib/incidents";

export type Layout = "original" | "redesigned";

const LABEL = { 1: "Critical", 2: "High", 3: "Medium", 4: "Low" } as const;
const cell: React.CSSProperties = { padding: "4px 8px", textAlign: "left", borderBottom: "1px solid #2a3340", fontSize: 12 };

/** The page whose HTML the scraper reads. The redesign renames classes and changes the markup. */
const IncidentPage = React.forwardRef<HTMLDivElement, { layout: Layout }>(function IncidentPage({ layout }, ref) {
  return (
    <div ref={ref} data-layout={layout} style={{ maxHeight: 420, overflow: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
      {layout === "original" ? (
        <table className="incident-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={cell}>Sev</th>
              <th style={cell}>Incident</th>
              <th style={cell}>Service</th>
              <th style={cell}>Status</th>
              <th style={cell}>Owner</th>
            </tr>
          </thead>
          <tbody>
            {INCIDENTS.map((i) => (
              <tr className="row" key={i.id} data-id={i.id}>
                <td className="sev" style={cell}>P{i.severity}</td>
                <td className="title" style={cell}>{i.title}</td>
                <td className="svc" style={cell}>{i.service}</td>
                <td className="status" style={cell}>{i.status === "open" ? "Open" : "Resolved"}</td>
                <td className="owner" style={cell}>{i.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="incident-list" style={{ listStyle: "none", margin: 0, padding: 8, display: "grid", gap: 6 }}>
          {INCIDENTS.map((i) => (
            <li className="card" key={i.id} data-incident={i.id} style={{ border: "1px solid #2a3340", borderRadius: 8, padding: "6px 10px", fontSize: 12 }}>
              <span className="badge" style={{ fontWeight: 700, marginRight: 8 }}>{LABEL[i.severity]}</span>
              <span className="heading">{i.title}</span>
              <div style={{ color: "var(--muted)" }}>
                <span className="chip">{i.service}</span> · <span className="state">{i.status === "open" ? "● Open" : "Resolved"}</span> · {i.owner}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default IncidentPage;
