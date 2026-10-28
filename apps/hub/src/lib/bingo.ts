export interface BingoTile {
  id: string;
  name: string;
  detail: string;
  ok: boolean;
}

export interface BingoScore {
  known: number;
  green: number;
  total: number;
  points: number;
}

/** One point for every tile the player knows, plus one for every tile that is green in their browser. */
export function bingoScore(tiles: BingoTile[], known: string[]): BingoScore {
  const knownSet = new Set(known);
  const knownCount = tiles.filter((t) => knownSet.has(t.id)).length;
  const green = tiles.filter((t) => t.ok).length;
  return { known: knownCount, green, total: tiles.length, points: knownCount + green };
}

export function toggleKnown(known: string[], id: string): string[] {
  return known.includes(id) ? known.filter((k) => k !== id) : [...known, id];
}

const KEY = "bingoKnown";

export function loadKnown(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveKnown(known: string[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(known));
  } catch {
    /* storage can be blocked */
  }
}
