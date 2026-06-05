import { describe, expect, it } from "vitest";
import { buildMasterRoadmapData } from "../masterRoadmap";

describe("buildMasterRoadmapData", () => {
  it("returns curated resources and projects with their Master Node", () => {
    const data = buildMasterRoadmapData(
      [{
        id: "self-attention",
        title: "Self-Attention",
        blurb: "Q, K, V.",
        phase: 4,
        row_index: 1,
        track: "internals",
        difficulty: 4,
        hours_awareness: 1,
        hours_working: 8,
        hours_fluent: 22,
        hours_expert: 55,
        relevance_fintech: 0.6,
        relevance_research: 1,
        relevance_mlops: 0.65,
        relevance_dev_tools: 0.7,
        relevance_education_ai: 0.85,
        skip_for_levels: [],
        depth_awareness: null,
        depth_working: null,
        depth_fluent: null,
        depth_expert: null,
      }],
      [],
      [{
        id: "resource-1",
        node_id: "self-attention",
        title: "The Illustrated Transformer",
        url: "https://jalammar.github.io/illustrated-transformer/",
        resource_type: "blog",
        depth_level: "awareness",
        estimated_minutes: 30,
        is_free: true,
      }],
      [{
        id: "project-1",
        node_id: "self-attention",
        title: "Implement scaled dot-product attention",
        description: "Build attention from Q, K, and V tensors.",
        depth_level: "working",
        deliverable: "A tested implementation.",
        estimated_hours: 3,
      }]
    );

    expect(data.nodes[0].resources).toEqual([
      expect.objectContaining({ title: "The Illustrated Transformer" }),
    ]);
    expect(data.nodes[0].projects).toEqual([
      expect.objectContaining({ title: "Implement scaled dot-product attention" }),
    ]);
  });
});
