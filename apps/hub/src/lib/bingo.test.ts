import { describe, it, expect } from "vitest";
import { bingoScore, toggleKnown, type BingoTile } from "./bingo";

const tiles: BingoTile[] = [
  { id: "a", name: "A", detail: "", ok: true },
  { id: "b", name: "B", detail: "", ok: false },
  { id: "c", name: "C", detail: "", ok: true },
];

describe("bingoScore", () => {
  it("gives one point per known tile plus one per green tile", () => {
    expect(bingoScore(tiles, ["a", "b"])).toEqual({ known: 2, green: 2, total: 3, points: 4 });
  });
  it("starts at the green count when nothing is known", () => {
    expect(bingoScore(tiles, []).points).toBe(2);
  });
  it("ignores ids that are not tiles", () => {
    expect(bingoScore(tiles, ["zzz"]).known).toBe(0);
  });
});

describe("toggleKnown", () => {
  it("adds and removes an id", () => {
    expect(toggleKnown([], "a")).toEqual(["a"]);
    expect(toggleKnown(["a", "b"], "a")).toEqual(["b"]);
  });
});
