/** The tool the page registers. Shown on screen in the demo. */
import type { ModelContextTool } from "./webmcp";
import { INCIDENTS, IncidentQuery, SERVICES, queryIncidents } from "./incidents";

export interface ToolOptions {
  /** accept service, status, sortBy and limit, and filter on the page */
  filter: boolean;
  /** return only id, title, service, severity and status */
  compact: boolean;
  /** say what was wrong and which values are valid, instead of a bare code */
  richErrors: boolean;
}

export function incidentTool({ filter, compact, richErrors }: ToolOptions): ModelContextTool {
  const shape = (rows: typeof INCIDENTS) =>
    compact ? rows.map(({ id, title, service, severity, status }) => ({ id, title, service, severity, status })) : rows;

  const reject = (service: string): never => {
    throw new Error(
      richErrors
        ? JSON.stringify({ code: "UNKNOWN_SERVICE", message: `No service called "${service}".`, validValues: [...SERVICES], retryable: false })
        : "ERR_400",
    );
  };

  return {
    name: "get_incidents",
    description: filter
      ? "List incidents. Filter by service and status, sort by severity (1 is most severe), and limit the count."
      : "List all incidents.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: filter
        ? {
            service: { type: "string", description: "Service name" },
            status: { type: "string", enum: ["open", "resolved"] },
            sortBy: { type: "string", enum: ["severity"] },
            limit: { type: "integer", minimum: 1 },
          }
        : {},
    },
    execute: async (input) => {
      if (!filter) return shape(INCIDENTS);
      const q = input as IncidentQuery;
      if (q.service && !(SERVICES as readonly string[]).includes(q.service)) reject(q.service);
      return shape(queryIncidents(q));
    },
  };
}
