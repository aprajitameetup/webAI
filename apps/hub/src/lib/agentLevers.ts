/**
 * The four token-saving levers for an agent loop, as plain functions over a message array.
 * This file is shown on screen in the demo, so it is kept short and readable.
 */
import { estimateTokens } from "./tokenLab";

export type Role = "system" | "user" | "assistant" | "tool";

export interface Message {
  id: number;
  /** bumped whenever the content changes, so a cache knows the prefix is no longer the same */
  version: number;
  role: Role;
  content: string;
  tokens: number;
  /** tool results only: the model has already read this once */
  read?: boolean;
  /** set on the summary that replaces the history after a compaction */
  summary?: boolean;
}

export const tokensOf = (ms: Message[]) => ms.reduce((n, m) => n + m.tokens, 0);
const keyOf = (m: Message) => `${m.id}:${m.version}`;
export const keysOf = (ms: Message[]) => ms.map(keyOf);

/** 1. Prompt caching: the part of this prompt that is identical to the last prompt is served from cache. */
export function cachedPrefixCount(previousKeys: string[], ms: Message[]): number {
  let i = 0;
  while (i < ms.length && i < previousKeys.length && keyOf(ms[i]) === previousKeys[i]) i++; // the first change ends the cached prefix
  return i;
}

export const cachedPrefixTokens = (previousKeys: string[], ms: Message[]): number =>
  tokensOf(ms.slice(0, cachedPrefixCount(previousKeys, ms)));

/** 2. Compaction: replace the whole history with one summary. The summary is itself a model call. */
export async function compactHistory(
  ms: Message[],
  summarise: (history: Message[]) => Promise<string>,
  nextId: number,
): Promise<{ messages: Message[]; before: number; after: number }> {
  const [system, ...history] = ms;
  const text = await summarise(history);
  const summary: Message = { id: nextId, version: 0, role: "user", content: text, tokens: estimateTokens(text), summary: true };
  return { messages: [system, summary], before: tokensOf(ms), after: system.tokens + summary.tokens };
}

/** 3. Tool-result clearing: once the model has read a tool result, keep a stub instead of the payload. */
export function clearToolResults(ms: Message[]): { messages: Message[]; cleared: number; freed: number } {
  const stub = "[cleared]";
  const stubTokens = estimateTokens(stub);
  let cleared = 0;
  let freed = 0;
  const messages = ms.map((m) => {
    if (m.role !== "tool" || !m.read || m.tokens <= stubTokens) return m;
    cleared++;
    freed += m.tokens - stubTokens;
    return { ...m, content: stub, tokens: stubTokens, version: m.version + 1 };
  });
  return { messages, cleared, freed };
}

/** 4a. Step budget: a hard stop after N turns. */
export const budgetReached = (turn: number, maxTurns: number | null) => maxTurns !== null && turn >= maxTurns;

/** 4b. Loop detection: stop when the last N tool calls are identical. */
export function repeatedCall(calls: string[], times: number): boolean {
  if (calls.length < times) return false;
  const tail = calls.slice(-times);
  return tail.every((c) => c === tail[0]);
}
