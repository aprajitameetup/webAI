import React from "react";
import BeforePage from "./components/demos/review/BeforePage";
import AfterPage from "./components/demos/review/AfterPage";
import type { LabMode } from "./lib/reviewLab";

// ?lab=before|after opens just the review-lab page, without the hub around it,
// so audit tools measure the page and not the hub.
export default function LabPage({ version, mode }: { version: "before" | "after"; mode: string | null }) {
  const labMode: LabMode = mode === "fail" || mode === "empty" ? mode : "normal";
  const Page = version === "before" ? BeforePage : AfterPage;
  return (
    <div className="rl-bare" style={{ background: "#0b1020", minHeight: "100vh" }}>
      <Page mode={labMode} />
    </div>
  );
}
