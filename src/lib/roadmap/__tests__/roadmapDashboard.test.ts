import { describe, expect, it } from "vitest";
import { buildRoadmapDashboardData } from "../roadmapDashboard";
import { makeGraph } from "./helpers";

describe("buildRoadmapDashboardData", () => {
  it("returns the active position, path ahead, history, and pending change count", () => {
    const graph = makeGraph([
      { id: "linear-algebra", title: "Linear Algebra" },
      { id: "self-attention", title: "Self-Attention" },
      { id: "python-basics", title: "Python Basics" },
    ]);

    const dashboard = buildRoadmapDashboardData(
      { active_node_id: "linear-algebra", generated_at: "2026-05-30T00:00:00.000Z" },
      [
        { node_id: "linear-algebra", state: "in_progress", depth_target: "working", depth_achieved: null, scheduled_week: 1, skip_reason: null, started_at: "2026-05-30T00:00:00.000Z" },
        { node_id: "self-attention", state: "locked", depth_target: "working", depth_achieved: null, scheduled_week: 2, skip_reason: null, started_at: null },
        { node_id: "python-basics", state: "skipped", depth_target: "working", depth_achieved: null, scheduled_week: 3, skip_reason: "Strong programming background declared", started_at: null },
      ],
      graph.nodes,
      2,
      new Date("2026-06-01T00:00:00.000Z")
    );

    expect(dashboard?.activeNode).toEqual(expect.objectContaining({
      nodeId: "linear-algebra",
      title: "Linear Algebra",
      daysSinceStarted: 2,
    }));
    expect(dashboard?.pathAhead.map((node) => node.nodeId)).toEqual(["self-attention"]);
    expect(dashboard?.history).toEqual([
      expect.objectContaining({ nodeId: "python-basics", skipReason: "Strong programming background declared" }),
    ]);
    expect(dashboard?.pendingAdaptationCount).toBe(2);
  });
});
