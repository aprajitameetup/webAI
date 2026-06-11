import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock the core engine so the hook is tested in isolation (no WebGPU/WebLLM).
vi.mock("@webai/core", () => ({
  createEngine: vi.fn(async () => ({
    source: "on-device",
    async *chat() {
      yield { delta: "Hi", done: false };
      yield { delta: "!", done: false };
      yield { delta: "", done: true };
    },
  })),
}));

import { useLocalLLM } from "./useLocalLLM";

describe("useLocalLLM", () => {
  it("becomes ready then streams an assistant reply", async () => {
    const { result } = renderHook(() => useLocalLLM({ serverUrl: "/x" }));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.source).toBe("on-device");

    await act(async () => {
      await result.current.send("hello");
    });

    const last = result.current.messages.at(-1)!;
    expect(last.role).toBe("assistant");
    expect(last.content).toBe("Hi!");
    expect(result.current.messages[0]).toEqual({ role: "user", content: "hello" });
  });
});
