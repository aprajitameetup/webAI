import { describe, it, expect } from "vitest";
import { withProxiedModel } from "./model-config";
import type { AppConfig } from "@mlc-ai/web-llm";

const fake = {
  model_list: [
    { model: "https://huggingface.co/mlc-ai/Foo-MLC", model_id: "Foo-MLC", model_lib: "x" },
    { model: "https://huggingface.co/mlc-ai/Bar-MLC", model_id: "Bar-MLC", model_lib: "y" },
  ],
} as unknown as AppConfig;

describe("withProxiedModel", () => {
  it("rewrites only the target model's HuggingFace host to the proxy base", () => {
    const out = withProxiedModel(fake, "Foo-MLC", "http://localhost:3005/hf/");
    expect(out.model_list[0].model).toBe("http://localhost:3005/hf/mlc-ai/Foo-MLC");
    expect(out.model_list[1].model).toBe("https://huggingface.co/mlc-ai/Bar-MLC");
  });

  it("leaves the config unchanged when the model id is not found", () => {
    const out = withProxiedModel(fake, "Missing-MLC", "http://localhost:3005/hf/");
    expect(out.model_list.map((r) => r.model)).toEqual([
      "https://huggingface.co/mlc-ai/Foo-MLC",
      "https://huggingface.co/mlc-ai/Bar-MLC",
    ]);
  });

  it("does not mutate the input config", () => {
    withProxiedModel(fake, "Foo-MLC", "http://localhost:3005/hf/");
    expect(fake.model_list[0].model).toBe("https://huggingface.co/mlc-ai/Foo-MLC");
  });
});
