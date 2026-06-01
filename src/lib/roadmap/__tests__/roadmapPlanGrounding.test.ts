import { describe, expect, it } from "vitest";
import { buildRoadmapPlanGrounding } from "../roadmapPlanGrounding";

describe("buildRoadmapPlanGrounding", () => {
  it("selects curated material for the Active Node depth target", () => {
    const grounding = buildRoadmapPlanGrounding(
      { title: "Self-Attention" },
      { depth_target: "working" },
      [{
        title: "The Illustrated Transformer",
        url: "https://jalammar.github.io/illustrated-transformer/",
        resource_type: "blog",
        estimated_minutes: 60,
      }],
      [{
        title: "Implement attention",
        description: "Build scaled dot-product attention.",
        deliverable: "Tested module.",
        estimated_hours: 6,
      }]
    );

    expect(grounding).toEqual({
      activeNodeTitle: "Self-Attention",
      depthTarget: "working",
      resources: [{
        title: "The Illustrated Transformer",
        url: "https://jalammar.github.io/illustrated-transformer/",
        resourceType: "blog",
        estimatedMinutes: 60,
      }],
      project: {
        title: "Implement attention",
        description: "Build scaled dot-product attention.",
        deliverable: "Tested module.",
        estimatedHours: 6,
      },
    });
  });
});
