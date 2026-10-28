/**
 * A real agent loop with a scripted stand-in for the model, so it runs offline and is deterministic.
 * The message array, the cache accounting and every lever are real code (see agentLevers.ts).
 * Only the model's replies are scripted, and token counts are estimates.
 */
import {
  Message,
  budgetReached,
  cachedPrefixCount,
  clearToolResults,
  compactHistory,
  keysOf,
  repeatedCall,
  tokensOf,
} from "./agentLevers";
import { DEFAULT_PRICES, Prices, TurnRow, estimateTokens } from "./tokenLab";

export interface AgentConfig {
  turns: number;
  system: number;
  question: number;
  answer: number;
  /** size of the tool result returned each turn (0 = the agent calls no tools) */
  tool: number;
  summary: number;
  prices: Prices;
  // levers
  caching: boolean;
  compactEvery: number | null;
  clearTools: boolean;
  maxTurns: number | null;
  stopOnRepeat: number | null;
  // scenario
  /** from this turn on, the agent keeps making the same failing call (null = never) */
  stuckAfter: number | null;
}

export const LEVERS_OFF = { caching: false, compactEvery: null, clearTools: false, maxTurns: null, stopOnRepeat: null } as const;

export const AGENT_START: AgentConfig = {
  turns: 50,
  system: 60000,
  question: 200,
  answer: 5000,
  tool: 0,
  summary: 3000,
  prices: DEFAULT_PRICES,
  stuckAfter: null,
  ...LEVERS_OFF,
};

export interface ToolCall {
  name: string;
  args: string;
  resultTokens: number;
}

/** The stand-in for an LLM. In production this is the only part that would call a provider. */
export interface Model {
  respond(history: Message[], turn: number): Promise<{ text: string; toolCall: ToolCall | null }>;
  summarise(history: Message[]): Promise<string>;
}

const filler = (tokens: number) => "tok ".repeat(Math.max(0, tokens));

export function createScriptedModel(cfg: Pick<AgentConfig, "answer" | "tool" | "summary" | "stuckAfter">): Model {
  return {
    async respond(_history, turn) {
      const stuck = cfg.stuckAfter !== null && turn >= cfg.stuckAfter;
      let toolCall: ToolCall | null = null;
      if (stuck) toolCall = { name: "fetch_page", args: "url=https://example.test/missing", resultTokens: Math.max(cfg.tool, 300) };
      else if (cfg.tool > 0) toolCall = { name: "fetch_page", args: `page=${turn}`, resultTokens: cfg.tool };
      return { text: filler(cfg.answer), toolCall };
    },
    async summarise() {
      return filler(cfg.summary);
    },
  };
}

export interface AgentEvent {
  turn: number;
  text: string;
}

/** One message of one turn's prompt, and whether the provider served it from cache. */
export interface PromptBlock {
  label: "system" | "conversation" | "tool result" | "cleared" | "summary";
  tokens: number;
  cached: boolean;
}

export interface AgentResult {
  rows: TurnRow[];
  prompts: PromptBlock[][];
  totals: { cost: number; input: number; read: number; write: number; output: number; turns: number };
  events: AgentEvent[];
  stoppedBy: "done" | "budget" | "repeat";
}

const M = 1e6;

export async function runAgent(cfg: AgentConfig, model: Model): Promise<AgentResult> {
  let nextId = 1;
  const make = (role: Message["role"], content: string): Message => ({ id: nextId++, version: 0, role, content, tokens: estimateTokens(content) });

  let messages: Message[] = [make("system", filler(cfg.system))];
  let previousKeys: string[] = [];
  const calls: string[] = [];
  const rows: TurnRow[] = [];
  const prompts: PromptBlock[][] = [];
  const events: AgentEvent[] = [];
  const t = { cost: 0, input: 0, read: 0, write: 0, output: 0 };
  let cumulative = 0;
  let stoppedBy: AgentResult["stoppedBy"] = "done";
  const { prices: p } = cfg;

  for (let turn = 1; turn <= cfg.turns; turn++) {
    messages.push(make("user", filler(cfg.question)));

    // what the provider would bill for this prompt
    const total = tokensOf(messages);
    const prefixCount = cfg.caching ? cachedPrefixCount(previousKeys, messages) : 0;
    const cached = tokensOf(messages.slice(0, prefixCount));
    prompts.push(
      messages.map((m, i) => ({
        label: m.summary ? "summary" : m.content === "[cleared]" ? "cleared" : m.role === "system" ? "system" : m.role === "tool" ? "tool result" : "conversation",
        tokens: m.tokens,
        cached: i < prefixCount,
      })),
    );
    const fresh = total - cached;
    let cost = cfg.caching ? (cached * p.cacheRead + fresh * p.cacheWrite) / M : (total * p.input) / M;
    previousKeys = keysOf(messages);

    // the model replies; any tool result it asked for arrives for the next turn
    const reply = await model.respond(messages, turn);
    for (const m of messages) if (m.role === "tool") m.read = true;
    const answer = make("assistant", reply.text);
    messages.push(answer);
    cost += (answer.tokens * p.output) / M;
    if (reply.toolCall) {
      messages.push(make("tool", filler(reply.toolCall.resultTokens)));
      calls.push(`${reply.toolCall.name}(${reply.toolCall.args})`);
    }

    // lever 3: clear tool results that were read once
    if (cfg.clearTools) {
      const r = clearToolResults(messages);
      messages = r.messages;
      if (r.cleared > 0 && (turn <= 3 || turn % 10 === 0)) events.push({ turn, text: `cleared ${r.cleared} tool result, freed ${r.freed.toLocaleString()} tokens` });
    }

    // lever 4b: loop detection
    let stop: AgentResult["stoppedBy"] | null = null;
    if (cfg.stopOnRepeat !== null && repeatedCall(calls, cfg.stopOnRepeat)) {
      events.push({ turn, text: `same call repeated ${cfg.stopOnRepeat} times, stopped` });
      stop = "repeat";
    }

    // lever 2: compaction (itself a model call, so it has a cost)
    if (!stop && cfg.compactEvery !== null && turn % cfg.compactEvery === 0 && turn < cfg.turns) {
      const before = tokensOf(messages);
      const out = await compactHistory(messages, (h) => model.summarise(h), nextId++);
      cost += (before * p.input + estimateTokens(out.messages[1].content) * p.output) / M;
      messages = out.messages;
      const sys = out.messages[0].tokens;
      events.push({ turn, text: `compacted history from ${(out.before - sys).toLocaleString()} to ${(out.after - sys).toLocaleString()} tokens (system prompt kept)` });
    }

    // lever 4a: step budget
    if (!stop && budgetReached(turn, cfg.maxTurns) && turn < cfg.turns) {
      events.push({ turn, text: `step budget reached after ${turn} turns, stopped` });
      stop = "budget";
    }

    cumulative += cost;
    rows.push({ turn, input: total, read: cached, write: cfg.caching ? fresh : 0, output: answer.tokens, cost, cumulative });
    t.cost += cost;
    t.input += total;
    t.read += cached;
    t.write += cfg.caching ? fresh : 0;
    t.output += answer.tokens;

    if (stop) {
      stoppedBy = stop;
      break;
    }
  }

  return { rows, prompts, totals: { ...t, turns: rows.length }, events, stoppedBy };
}
