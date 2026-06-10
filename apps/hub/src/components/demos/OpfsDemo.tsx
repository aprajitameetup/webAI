import React, { useState } from "react";

export default function OpfsDemo() {
  const [output, setOutput] = useState<string>(
    "Writes a string to OPFS, reads it back, and reports your storage quota."
  );
  const [isErr, setIsErr] = useState(false);

  async function run() {
    setIsErr(false);
    setOutput("Writing…");
    try {
      if (!(navigator.storage && navigator.storage.getDirectory)) {
        setIsErr(true);
        setOutput("❌ OPFS not available here.");
        return;
      }
      const root = await navigator.storage.getDirectory();
      const fh = await root.getFileHandle("waih-demo.txt", { create: true });
      const w = await fh.createWritable();
      const payload = `saved at ${new Date().toISOString()}`;
      await w.write(payload);
      await w.close();

      const fh2 = await root.getFileHandle("waih-demo.txt");
      const file = await fh2.getFile();
      const text = await file.text();

      let quota = "";
      try {
        const est = await navigator.storage.estimate();
        quota = `\nQuota: ${((est.usage ?? 0) / 1e6).toFixed(1)} MB used of ${((est.quota ?? 0) / 1e9).toFixed(1)} GB`;
      } catch (_e) {
        // quota not available
      }

      setOutput(`✓ wrote → OPFS, read back:\n"${text}"${quota}`);
    } catch (err: any) {
      setIsErr(true);
      setOutput("❌ " + (err?.message ?? String(err)));
    }
  }

  return (
    <div className="demo">
      <div className="demo-head">
        <div className="title">💾 Live: write &amp; read a file in OPFS</div>
        <button className="btn" onClick={run}>
          Round-trip a file
        </button>
      </div>
      <div className={"demo-out" + (isErr ? " err" : "")}>{output}</div>
    </div>
  );
}
