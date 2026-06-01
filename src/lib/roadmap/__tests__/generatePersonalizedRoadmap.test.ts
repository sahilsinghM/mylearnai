import { describe, it, expect } from "vitest";
import {
  buildPersonalizedRoadmap,
  generatePersonalizedRoadmap,
} from "../generatePersonalizedRoadmap";
import { makeGraph, makeProfile } from "./helpers";

describe("generatePersonalizedRoadmap", () => {
  it("orders output by phase then row within a phase", () => {
    const graph = makeGraph([
      { id: "c", phase: 2, row: 0 },
      { id: "a", phase: 1, row: 0 },
      { id: "b", phase: 1, row: 1 },
    ]);

    const result = generatePersonalizedRoadmap(makeProfile(), graph);

    expect(result.map((n) => n.nodeId)).toEqual(["a", "b", "c"]);
  });

  it("assigns fluent depth target to all nodes for a research-goal user", () => {
    const graph = makeGraph([
      { id: "linear-algebra", phase: 1, row: 0 },
      { id: "backpropagation", phase: 2, row: 0 },
    ]);

    const profile = makeProfile({ goals: ["research"] });

    const result = generatePersonalizedRoadmap(profile, graph);

    expect(result.every((n) => n.depthTarget === "fluent")).toBe(true);
  });

  it("keeps a required prerequisite even if background would normally skip it", () => {
    const graph = makeGraph([
      // senior would normally skip this...
      { id: "linear-algebra", phase: 1, row: 0, skipForLevels: ["senior", "staff"] },
      // ...but this node requires it
      { id: "backpropagation", phase: 2, row: 0 },
    ], [
      { from: "linear-algebra", to: "backpropagation", type: "required" },
    ]);

    const profile = makeProfile({ programmingLevel: "senior" });

    const result = generatePersonalizedRoadmap(profile, graph);

    expect(result.find((n) => n.nodeId === "linear-algebra")).toBeDefined();
    expect(result.find((n) => n.nodeId === "backpropagation")).toBeDefined();
  });

  it("skips python-basics for a senior engineer with strong programming background", () => {
    const graph = makeGraph([
      { id: "python-basics", phase: 1, row: 0, skipForLevels: ["senior", "staff"] },
      { id: "numpy-pandas", phase: 1, row: 1 },
    ], [
      { from: "python-basics", to: "numpy-pandas", type: "recommended" },
    ]);

    const profile = makeProfile({ programmingLevel: "senior" });

    const result = generatePersonalizedRoadmap(profile, graph);

    expect(result.find((n) => n.nodeId === "python-basics")).toBeUndefined();
    expect(result.find((n) => n.nodeId === "numpy-pandas")).toBeDefined();
  });

  it("builds persistence rows and a transparent reveal for onboarding", () => {
    const graph = makeGraph([
      { id: "python-basics", title: "Python Basics", phase: 1, row: 0, skipForLevels: ["senior", "staff"] },
      { id: "linear-algebra", title: "Linear Algebra", phase: 1, row: 1 },
      { id: "self-attention", title: "Self-Attention", phase: 2, row: 0 },
    ]);

    const roadmap = buildPersonalizedRoadmap(
      makeProfile({ programmingLevel: "senior" }),
      graph
    );

    expect(roadmap.activeNodeId).toBe("linear-algebra");
    expect(roadmap.nodeStates).toEqual([
      expect.objectContaining({ nodeId: "linear-algebra", state: "in_progress" }),
      expect.objectContaining({ nodeId: "self-attention", state: "locked" }),
    ]);
    expect(roadmap.skippedNodes).toEqual([
      { nodeId: "python-basics", title: "Python Basics", reason: "Strong programming background declared" },
    ]);
  });
});
