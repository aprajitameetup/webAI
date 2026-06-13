import React from "react";

export default function Connect() {
  return (
    <div>
      <div className="eyebrow">Connect</div>
      <h1>Let&apos;s connect</h1>
      <p className="lead">
        Built for the React Delhi community. If this was useful, the whole project is open source —
        and I&apos;d love to hear what you build with it.
      </p>

      <div
        style={{
          display: "flex",
          gap: 28,
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: 24,
        }}
      >
        <img
          src="/linkedin-qr.png"
          alt="Scan to connect on LinkedIn"
          width={240}
          height={240}
          style={{ borderRadius: 12, border: "1px solid #2a3342", background: "#0d1219" }}
        />
        <div style={{ minWidth: 240 }}>
          <h2 style={{ marginTop: 0 }}>Scan to connect on LinkedIn</h2>
          <p style={{ color: "#c2cdd9", lineHeight: 1.7 }}>
            Point your phone camera at the code to open my LinkedIn profile.
          </p>
          <p className="muted" style={{ fontSize: 14, marginTop: 16 }}>
            Source code:{" "}
            <a
              href="https://github.com/aprajitameetup/webAI"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#30c8ff" }}
            >
              github.com/aprajitameetup/webAI
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
