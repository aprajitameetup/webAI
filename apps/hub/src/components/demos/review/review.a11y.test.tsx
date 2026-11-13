// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { afterEach, describe, expect, it, vi } from "vitest";
import BeforePage from "./BeforePage";
import AfterPage from "./AfterPage";

expect.extend(toHaveNoViolations);

// A short list, answered at once, so the tests do not wait on the demo's simulated network.
vi.mock("../../../lib/reviewLab", async (importOriginal) => {
  const real = await importOriginal<typeof import("../../../lib/reviewLab")>();
  return { ...real, fetchTickets: async () => real.buildTickets(30) };
});

afterEach(cleanup);

async function renderReady(Page: React.ComponentType) {
  const view = render(<Page />);
  await screen.findAllByText(/#10\d\d/);
  return view;
}

describe("reviewed page", () => {
  it("has no axe violations", async () => {
    const { container } = await renderReady(AfterPage);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("exposes every action as a real button with a name", async () => {
    await renderReady(AfterPage);
    expect(screen.getByRole("button", { name: "New ticket" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^View ticket 10\d\d$/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole("table", { name: /tickets/i })).toBeTruthy();
  });

  it("labels every field", async () => {
    await renderReady(AfterPage);
    expect(screen.getByLabelText("Search tickets")).toBeTruthy();
    expect(screen.getByLabelText("Filter by status")).toBeTruthy();
    expect(screen.getByLabelText("Your question")).toBeTruthy();
  });
});

describe("generated page", () => {
  // The baseline: this is the page as written. `it.fails` passes only while the page still fails the check,
  // so it records the defect today and goes red the day someone fixes it without updating the test.
  it.fails("has no axe violations", async () => {
    const { container } = await renderReady(BeforePage);
    expect(await axe(container)).toHaveNoViolations();
  });

  it.fails("exposes its actions as buttons", async () => {
    await renderReady(BeforePage);
    expect(screen.getByRole("button", { name: "New ticket" })).toBeTruthy();
  });
});
