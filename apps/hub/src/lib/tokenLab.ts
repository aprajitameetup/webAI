/**
 * Token lab: the maths behind the "Before the wire, after the wire" demo.
 * Pure functions, no browser APIs, so they are easy to test and to trust on stage.
 */

// ---------------------------------------------------------------- estimation
/** Rough token estimate (about 4 characters per token for English). Approximate by design. */
export function estimateTokens(text: string): number {
  return text ? Math.ceil(text.length / 4) : 0;
}

// -------------------------------------------------------- before the wire
export function dedupeLines(text: string): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split("\n")) {
    const key = line.trim();
    if (key === "") {
      out.push(line);
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out.join("\n");
}

export function collapseWhitespace(text: string): string {
  return text
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Keep the head and the tail, drop the middle, and say how much was dropped. */
export function truncateToTokens(text: string, maxTokens: number): string {
  const total = estimateTokens(text);
  if (total <= maxTokens) return text;
  const maxChars = Math.max(40, maxTokens * 4);
  const head = Math.floor(maxChars * 0.7);
  const tail = maxChars - head;
  const removed = total - maxTokens;
  return `${text.slice(0, head)}\n... [${removed} tokens removed locally] ...\n${text.slice(text.length - tail)}`;
}

export interface Route {
  where: "device" | "server";
  reasons: string[];
}

const NEEDS_SERVER = /\b(analy[sz]e|compare|plan|multi-?step|search the web|draft a (report|brief)|using tools?)\b/i;

/** A deliberately simple local router. The point is where it runs, not how clever it is. */
export function routeTask(text: string, deviceLimitTokens = 1000): Route {
  const tokens = estimateTokens(text);
  const reasons: string[] = [];
  let server = false;
  if (tokens > deviceLimitTokens) {
    server = true;
    reasons.push(`too long for the device model (${tokens} tokens)`);
  }
  if (NEEDS_SERVER.test(text)) {
    server = true;
    reasons.push("needs multi-step reasoning or tools");
  }
  if (!server) reasons.push(`short, focused task (${tokens} tokens)`);
  return { where: server ? "server" : "device", reasons };
}

export interface GateOptions {
  dedupe: boolean;
  collapse: boolean;
  truncate: boolean;
  truncateTo: number;
}

export interface GateStage {
  name: string;
  tokens: number;
}

export interface GateResult {
  stages: GateStage[];
  final: string;
  rawTokens: number;
  finalTokens: number;
  savedPct: number;
  routeRaw: Route;
  route: Route;
}

export function runGate(raw: string, opts: GateOptions): GateResult {
  const stages: GateStage[] = [{ name: "raw payload", tokens: estimateTokens(raw) }];
  let text = raw;
  if (opts.dedupe) {
    text = dedupeLines(text);
    stages.push({ name: "dedupe lines", tokens: estimateTokens(text) });
  }
  if (opts.collapse) {
    text = collapseWhitespace(text);
    stages.push({ name: "collapse whitespace", tokens: estimateTokens(text) });
  }
  if (opts.truncate) {
    text = truncateToTokens(text, opts.truncateTo);
    stages.push({ name: `truncate to ${opts.truncateTo}`, tokens: estimateTokens(text) });
  }
  const rawTokens = stages[0].tokens;
  const finalTokens = estimateTokens(text);
  return {
    stages,
    final: text,
    rawTokens,
    finalTokens,
    savedPct: rawTokens === 0 ? 0 : Math.round(((rawTokens - finalTokens) / rawTokens) * 100),
    routeRaw: routeTask(raw),
    route: routeTask(text),
  };
}

// --------------------------------------------------------- after the wire
/** Dollars per million tokens. Illustrative defaults, check your provider. */
export interface Prices {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export const DEFAULT_PRICES: Prices = { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 };

export interface RunParams {
  turns: number;
  system: number;
  question: number;
  answer: number;
  /** tool output produced per turn and read by the model on the next turn */
  tool: number;
  prices: Prices;
  caching: boolean;
  /** compact the history every N turns (null = never) */
  compactEvery: number | null;
  /** size of the summary that replaces the history */
  summary: number;
  /** drop tool results from the history after they were read once */
  clearTools: boolean;
  /** step budget: stop after this many turns (null = no budget) */
  maxTurns: number | null;
}

export interface TurnRow {
  turn: number;
  input: number;
  read: number;
  write: number;
  output: number;
  cost: number;
  cumulative: number;
}

export interface RunResult {
  rows: TurnRow[];
  totals: { cost: number; input: number; read: number; write: number; output: number; turns: number };
  stoppedByBudget: boolean;
}

export const NAIVE: Pick<RunParams, "caching" | "compactEvery" | "clearTools" | "maxTurns"> = {
  caching: false,
  compactEvery: null,
  clearTools: false,
  maxTurns: null,
};

const M = 1e6;

export function simulateRun(p: RunParams): RunResult {
  const turns = p.maxTurns ? Math.min(p.turns, p.maxTurns) : p.turns;
  const rows: TurnRow[] = [];
  let history = 0; // conversation tokens after the system prompt
  let cached = 0; // tokens of the previous prompt that are still a valid cached prefix
  let pendingTool = 0; // tool output waiting to be read on this turn
  let cumulative = 0;
  const t = { cost: 0, input: 0, read: 0, write: 0, output: 0 };

  for (let turn = 1; turn <= turns; turn++) {
    const total = p.system + history + p.question + pendingTool;
    const read = p.caching ? Math.min(cached, total) : 0;
    const write = p.caching ? total - read : 0;
    const plain = p.caching ? 0 : total;
    let cost = (plain * p.prices.input + read * p.prices.cacheRead + write * p.prices.cacheWrite + p.answer * p.prices.output) / M;

    // the prompt that was just sent becomes the cached prefix, unless the tool result is dropped
    cached = p.clearTools ? total - pendingTool : total;
    history += p.question + p.answer + (p.clearTools ? 0 : pendingTool);
    pendingTool = p.tool;

    // compaction is itself a model call, so it is not free
    if (p.compactEvery && turn % p.compactEvery === 0 && turn < turns) {
      cost += ((total + p.answer) * p.prices.input + p.summary * p.prices.output) / M;
      history = p.summary;
      pendingTool = 0;
      cached = p.system;
    }

    cumulative += cost;
    rows.push({ turn, input: total, read, write, output: p.answer, cost, cumulative });
    t.cost += cost;
    t.input += total;
    t.read += read;
    t.write += write;
    t.output += p.answer;
  }

  return { rows, totals: { ...t, turns }, stoppedByBudget: p.maxTurns !== null && p.maxTurns < p.turns };
}
