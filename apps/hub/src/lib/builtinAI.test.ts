import { describe, it, expect } from "vitest";
import { normalizeAvailability } from "./builtinAI";

describe("normalizeAvailability", () => {
  it("maps current 'available' strings", () => {
    expect(normalizeAvailability("available")).toBe("available");
    expect(normalizeAvailability("readily")).toBe("available"); // legacy
  });
  it("maps downloadable/downloading variants to 'downloadable'", () => {
    expect(normalizeAvailability("downloadable")).toBe("downloadable");
    expect(normalizeAvailability("downloading")).toBe("downloadable");
    expect(normalizeAvailability("after-download")).toBe("downloadable"); // legacy
  });
  it("treats everything else as 'unavailable'", () => {
    expect(normalizeAvailability("unavailable")).toBe("unavailable");
    expect(normalizeAvailability("no")).toBe("unavailable"); // legacy
    expect(normalizeAvailability(undefined)).toBe("unavailable");
    expect(normalizeAvailability("")).toBe("unavailable");
    expect(normalizeAvailability(42)).toBe("unavailable");
  });
});
