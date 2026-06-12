import React, { useEffect, useState } from "react";
import {
  API_KEYS,
  API_LABELS,
  probeBuiltinAI,
  type ApiKey,
  type Availability,
} from "../../../lib/builtinAI";

const GLYPH: Record<Availability, string> = {
  available: "✓",
  downloadable: "⤓",
  unavailable: "✕",
};
const STATUS_CLASS: Record<Availability, string> = {
  available: "yes",
  downloadable: "",
  unavailable: "no",
};

export default function BuiltinAIPanel() {
  const [avail, setAvail] = useState<Record<ApiKey, Availability> | null>(null);

  useEffect(() => {
    let alive = true;
    probeBuiltinAI().then((a) => {
      if (alive) setAvail(a);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">✨ Live: which Built-in AI APIs are available here?</div>
      </div>
      <div className="cap-grid">
        {API_KEYS.map((key: ApiKey) => {
          const a = avail?.[key];
          const cls = a ? STATUS_CLASS[a] : "";
          const glyph = a ? GLYPH[a] : "…";
          return (
            <div className="cap" key={key}>
              <div className={`status ${cls}`}>{glyph}</div>
              <div className="info">
                <div className="name">{API_LABELS[key].name}</div>
                <div className="detail">
                  {API_LABELS[key].detail}
                  {a === "downloadable" ? " · downloadable" : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
