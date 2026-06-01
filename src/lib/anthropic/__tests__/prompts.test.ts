import { describe, expect, it } from "vitest";
import { buildInitialPlanPrompt } from "../prompts";
import { makeProfile } from "@/lib/roadmap/__tests__/helpers";

describe("buildInitialPlanPrompt", () => {
  it("grounds a weekly plan in the Active Node curated material when available", () => {
    const prompt = buildInitialPlanPrompt(makeProfile(), {
      activeNodeTitle: "Self-Attention",
      depthTarget: "working",
      resources: [{
        title: "The Illustrated Transformer",
        url: "https://jalammar.github.io/illustrated-transformer/",
        resourceType: "blog",
        estimatedMinutes: 60,
      }],
      project: {
        title: "Implement scaled dot-product attention",
        description: "Build attention from Q, K, and V tensors.",
        deliverable: "Tested implementation.",
        estimatedHours: 6,
      },
    });

    expect(prompt).toContain("Active Node: Self-Attention");
    expect(prompt).toContain("Depth target: working");
    expect(prompt).toContain("https://jalammar.github.io/illustrated-transformer/");
    expect(prompt).toContain("Implement scaled dot-product attention");
  });
});
