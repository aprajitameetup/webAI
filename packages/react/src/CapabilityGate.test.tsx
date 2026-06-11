import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CapabilityGate } from "./CapabilityGate";

describe("CapabilityGate", () => {
  it("renders children when capability present", () => {
    render(
      <CapabilityGate has fallback={<span>no</span>}>
        <span>yes</span>
      </CapabilityGate>
    );
    expect(screen.getByText("yes")).toBeTruthy();
    expect(screen.queryByText("no")).toBeNull();
  });

  it("renders fallback when capability absent", () => {
    render(
      <CapabilityGate has={false} fallback={<span>no</span>}>
        <span>yes</span>
      </CapabilityGate>
    );
    expect(screen.getByText("no")).toBeTruthy();
    expect(screen.queryByText("yes")).toBeNull();
  });
});
