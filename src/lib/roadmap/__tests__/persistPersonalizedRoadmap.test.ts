import { describe, expect, it } from "vitest";
import { toRoadmapPersistenceRows } from "../persistPersonalizedRoadmap";

describe("toRoadmapPersistenceRows", () => {
  it("maps a generated Personalized Roadmap into owned Supabase rows", () => {
    const rows = toRoadmapPersistenceRows("user-1", {
      activeNodeId: "linear-algebra",
      skippedNodes: [],
      nodeStates: [
        { nodeId: "linear-algebra", depthTarget: "working", scheduledWeek: 1, state: "in_progress" },
        { nodeId: "self-attention", depthTarget: "working", scheduledWeek: 2, state: "locked" },
      ],
    });

    expect(rows.roadmap).toEqual({
      user_id: "user-1",
      active_node_id: "linear-algebra",
      status: "active",
      agent_version: "v1",
    });
    expect(rows.nodeStates).toEqual([
      {
        user_id: "user-1",
        node_id: "linear-algebra",
        depth_target: "working",
        scheduled_week: 1,
        state: "in_progress",
        started_at: expect.any(String),
      },
      {
        user_id: "user-1",
        node_id: "self-attention",
        depth_target: "working",
        scheduled_week: 2,
        state: "locked",
        started_at: null,
      },
    ]);
  });
});
