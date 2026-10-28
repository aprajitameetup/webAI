import React, { useEffect, useMemo, useState } from "react";
import { CAP_META, EXTRA_CAPS } from "../components/CapabilityDashboard";
import { detectCapabilities } from "../lib/detect";
import { bingoScore, loadKnown, saveKnown, toggleKnown, type BingoTile } from "../lib/bingo";

function buildTiles(): BingoTile[] {
  const caps = detectCapabilities();
  return [
    ...CAP_META.map(({ key, name, detail }) => ({ id: name, name, detail, ok: caps[key] })),
    ...EXTRA_CAPS.map(({ name, detail, value }) => ({ id: name, name, detail, ok: value })),
  ];
}

export default function Bingo() {
  const tiles = useMemo(buildTiles, []);
  const [known, setKnown] = useState<string[]>(loadKnown);

  useEffect(() => saveKnown(known), [known]);

  const score = bingoScore(tiles, known);

  return (
    <>
      <div className="eyebrow">The game</div>
      <h1>Bingo</h1>
      <p className="lead">
        How much of the web AI stack do you already know? Tick every tile you have used or at least heard of. One
        point for each tick. The green and red marks show what your own browser supports.
      </p>

      <div className="bingo-score" role="status" aria-live="polite">
        <div className="bingo-points">{score.points}</div>
        <div className="bingo-break">
          <strong>points</strong>
          <span>{score.known} of {score.total} tiles known</span>
        </div>
        <button type="button" className="bingo-reset" onClick={() => setKnown([])} disabled={known.length === 0}>
          Reset ticks
        </button>
      </div>

      <div className="cap-grid">
        {tiles.map((t) => {
          const isKnown = known.includes(t.id);
          return (
            <button
              type="button"
              key={t.id}
              className={`cap bingo-tile${isKnown ? " known" : ""}`}
              aria-pressed={isKnown}
              aria-label={`${t.name}. ${t.ok ? "Works in your browser" : "Not available in your browser"}. ${isKnown ? "Marked as known" : "Not marked"}`}
              onClick={() => setKnown((k) => toggleKnown(k, t.id))}
            >
              <div className={`status ${t.ok ? "yes" : "no"}`}>{t.ok ? "✓" : "✕"}</div>
              <div className="info">
                <div className="name">{t.name}</div>
                <div className="detail">{t.detail}</div>
              </div>
              <div className="bingo-know">{isKnown ? "I know this" : "Tap if you know it"}</div>
            </button>
          );
        })}
      </div>
    </>
  );
}
