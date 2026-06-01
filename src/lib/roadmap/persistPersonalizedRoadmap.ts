import type { SupabaseClient } from "@supabase/supabase-js";
import type { PersonalizedRoadmap } from "./types";

export function toRoadmapPersistenceRows(userId: string, roadmap: PersonalizedRoadmap) {
  const startedAt = new Date().toISOString();

  return {
    roadmap: {
      user_id: userId,
      active_node_id: roadmap.activeNodeId,
      status: "active",
      agent_version: "v1",
    },
    nodeStates: roadmap.nodeStates.map((node) => ({
      user_id: userId,
      node_id: node.nodeId,
      depth_target: node.depthTarget,
      scheduled_week: node.scheduledWeek,
      state: node.state,
      started_at: node.state === "in_progress" ? startedAt : null,
    })),
  };
}

export async function persistPersonalizedRoadmap(
  supabase: SupabaseClient,
  userId: string,
  roadmap: PersonalizedRoadmap
) {
  const rows = toRoadmapPersistenceRows(userId, roadmap);

  const { error: roadmapError } = await supabase
    .from("user_roadmaps")
    .upsert(rows.roadmap, { onConflict: "user_id" });
  if (roadmapError) throw new Error("Failed to save personalized roadmap");

  const { error: deleteError } = await supabase
    .from("user_node_states")
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw new Error("Failed to reset personalized roadmap nodes");

  if (rows.nodeStates.length === 0) return;

  const { error: stateError } = await supabase
    .from("user_node_states")
    .insert(rows.nodeStates);
  if (stateError) throw new Error("Failed to save personalized roadmap nodes");
}
