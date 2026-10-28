import { describe, expect, it } from "vitest";
import { buttonLabel } from "./useBuiltinSession";

describe("buttonLabel", () => {
  it("says Downloading only when a download is happening", () => {
    expect(buttonLabel("downloading", 0.42, "Detect")).toBe("Downloading… 42%");
  });
  it("says Loading when the model is already on disk", () => {
    expect(buttonLabel("loading", 1, "Detect")).toBe("Loading model…");
  });
  it("shows the idle label otherwise", () => {
    expect(buttonLabel("ready", 0, "Detect")).toBe("Detect");
    expect(buttonLabel("running", 0, "Detect")).toBe("Detect");
  });
});
