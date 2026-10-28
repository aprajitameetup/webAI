import React from "react";

// Static architecture diagram for the "AI, Be My Eyes" demo: components as boxes,
// arrows as data flow, a trust boundary (everything stays in the tab), and the
// Gemini-unavailable fallback shown as a real branch, not just prose.
export default function BeMyEyesArchitecture() {
  return (
    <svg
      viewBox="0 0 1080 480"
      style={{ width: "100%", height: "auto", display: "block", margin: "16px 0" }}
      role="img"
      aria-label="Architecture diagram: camera feeds MobileNet, which produces a label consumed by Gemini Nano (or a plain-template fallback), which feeds the Web Speech API. Everything runs inside the browser tab, with no server round trip."
    >
      <defs>
        <marker id="bme-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)" />
        </marker>
        <marker id="bme-arrow-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
        </marker>
      </defs>

      {/* Trust boundary */}
      <rect x="20" y="40" width="860" height="400" rx="14" fill="none" stroke="var(--border)" strokeWidth="2" strokeDasharray="6 6" />
      <text x="40" y="68" fill="var(--muted)" fontSize="13" fontWeight="700" letterSpacing="0.5">
        YOUR BROWSER TAB — everything inside this line runs on-device
      </text>

      {/* Camera */}
      <rect x="50" y="190" width="150" height="64" rx="10" fill="var(--surface2)" stroke="var(--border)" strokeWidth="1.5" />
      <text x="125" y="216" textAnchor="middle" fill="var(--text)" fontSize="15" fontWeight="700">📷 Camera</text>
      <text x="125" y="238" textAnchor="middle" fill="var(--muted)" fontSize="11">getUserMedia</text>

      {/* MobileNet */}
      <rect x="260" y="190" width="170" height="64" rx="10" fill="var(--surface2)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="345" y="214" textAnchor="middle" fill="var(--text)" fontSize="15" fontWeight="700">🧠 MobileNet</text>
      <text x="345" y="234" textAnchor="middle" fill="var(--muted)" fontSize="11">TensorFlow.js · every ~1.8s</text>
      <text x="345" y="248" textAnchor="middle" fill="var(--muted)" fontSize="11">on-device inference</text>

      <path d="M200,222 L258,222" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#bme-arrow)" fill="none" />

      {/* Label chip */}
      <rect x="275" y="290" width="140" height="32" rx="16" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
      <text x="345" y="311" textAnchor="middle" fill="var(--text)" fontSize="11" fontFamily="monospace">"coffee mug" · 62%</text>
      <path d="M345,254 L345,288" stroke="var(--muted)" strokeWidth="2" markerEnd="url(#bme-arrow-muted)" fill="none" />

      {/* Gemini Nano (primary branch) */}
      <rect x="500" y="110" width="200" height="64" rx="10" fill="var(--surface2)" stroke="var(--accent4)" strokeWidth="1.5" />
      <text x="600" y="134" textAnchor="middle" fill="var(--text)" fontSize="15" fontWeight="700">✨ Gemini Nano</text>
      <text x="600" y="154" textAnchor="middle" fill="var(--muted)" fontSize="11">Chrome Prompt API</text>
      <text x="600" y="168" textAnchor="middle" fill="var(--muted)" fontSize="11">"There's a coffee mug ahead."</text>

      {/* Fallback template (secondary branch) */}
      <rect x="500" y="300" width="200" height="64" rx="10" fill="var(--surface)" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="5 4" />
      <text x="600" y="324" textAnchor="middle" fill="var(--muted)" fontSize="14" fontWeight="700">📝 Plain template</text>
      <text x="600" y="344" textAnchor="middle" fill="var(--muted)" fontSize="11">if Gemini Nano unavailable</text>
      <text x="600" y="358" textAnchor="middle" fill="var(--muted)" fontSize="11">"I see a coffee mug."</text>

      <path d="M415,296 C450,270 460,160 498,148" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#bme-arrow)" fill="none" />
      <path d="M415,314 C450,330 460,340 498,336" stroke="var(--muted)" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#bme-arrow-muted)" fill="none" />

      {/* Speech output */}
      <rect x="620" y="220" width="200" height="64" rx="10" fill="var(--surface2)" stroke="var(--accent2)" strokeWidth="1.5" />
      <text x="720" y="244" textAnchor="middle" fill="var(--text)" fontSize="15" fontWeight="700">🔊 Web Speech API</text>
      <text x="720" y="264" textAnchor="middle" fill="var(--muted)" fontSize="11">SpeechSynthesisUtterance</text>
      <text x="720" y="278" textAnchor="middle" fill="var(--muted)" fontSize="11">spoken out loud</text>

      <path d="M600,174 C630,190 660,200 680,218" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#bme-arrow)" fill="none" />
      <path d="M600,300 C630,290 660,282 680,270" stroke="var(--muted)" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#bme-arrow-muted)" fill="none" />

      {/* No server round trip */}
      <rect x="920" y="212" width="140" height="80" rx="10" fill="none" stroke="var(--accent3)" strokeWidth="1.5" strokeDasharray="4 4" />
      <line x1="935" y1="227" x2="1045" y2="277" stroke="var(--accent3)" strokeWidth="2" />
      <text x="990" y="240" textAnchor="middle" fill="var(--accent3)" fontSize="20">🌐</text>
      <text x="990" y="268" textAnchor="middle" fill="var(--accent3)" fontSize="12" fontWeight="700">No server</text>
      <text x="990" y="282" textAnchor="middle" fill="var(--muted)" fontSize="10">0 network calls</text>
      <text x="990" y="294" textAnchor="middle" fill="var(--muted)" fontSize="10">during inference</text>
    </svg>
  );
}
