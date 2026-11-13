import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const params = new URLSearchParams(window.location.search);
const lab = params.get("lab");
const root = createRoot(document.getElementById("root")!);

// The review lab pages open on their own so audit tools do not measure the hub around them.
if (lab === "before" || lab === "after") {
  import("./LabPage").then(({ default: LabPage }) => root.render(<LabPage version={lab} mode={params.get("mode")} />));
} else {
  import("./App").then(({ default: App }) => root.render(<React.StrictMode><App /></React.StrictMode>));
}
