import { describe, expect, it } from "vitest";
import {
  findNodeIdBySearch,
  getDependencyNeighborhood,
  isRelevantToDomain,
} from "../graphInteractions";
import { makeGraph } from "./helpers";
import type { MasterEdge } from "../types";

const edges: MasterEdge[] = [
  { from: "linear-algebra", to: "self-attention", type: "required" },
  { from: "self-attention", to: "multi-head-attention", type: "required" },
  { from: "multi-head-attention", to: "transformer-block", type: "required" },
];

describe("getDependencyNeighborhood", () => {
  it("returns every upstream prerequisite and downstream unlock for a selected node", () => {
    const neighborhood = getDependencyNeighborhood("self-attention", edges);

    expect([...neighborhood.prerequisiteIds]).toEqual(["linear-algebra"]);
    expect([...neighborhood.unlockIds]).toEqual(["multi-head-attention", "transformer-block"]);
  });
});

describe("roadmap discovery helpers", () => {
  const nodes = makeGraph([
    {
      id: "self-attention",
      title: "Self-Attention",
      relevance: {
        fintech: 0.4,
        research: 1,
        mlops: 0.5,
        dev_tools: 0.5,
        education_ai: 0.7,
      },
    },
    { id: "multi-head-attention", title: "Multi-Head Attention" },
  ]).nodes;

  it("finds the first title match and reports whether a node should remain emphasized", () => {
    expect(findNodeIdBySearch("multi head", nodes)).toBe("multi-head-attention");
    expect(isRelevantToDomain(nodes[0], "fintech")).toBe(false);
    expect(isRelevantToDomain(nodes[0], "research")).toBe(true);
    expect(isRelevantToDomain(nodes[0], "all")).toBe(true);
  });
});
