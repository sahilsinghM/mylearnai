import { createClient } from "@/lib/supabase/server";
import { query, queryMaybe, queryCount } from "@/lib/supabase/query";
import { getMasterRoadmap } from "./masterRoadmap";
import { buildRoadmapDashboardData, type UserNodeStateRow } from "./roadmapDashboard";

export async function getRoadmapDashboard(userId: string) {
  const supabase = await createClient();
  const [roadmap, states, pendingCount, graph] = await Promise.all([
    queryMaybe<{ active_node_id: string | null; generated_at: string }>(
      supabase
        .from("user_roadmaps")
        .select("active_node_id, generated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      "user_roadmaps",
    ),
    query<UserNodeStateRow>(
      supabase
        .from("user_node_states")
        .select("node_id, state, depth_target, depth_achieved, scheduled_week, skip_reason, started_at")
        .eq("user_id", userId),
      "user_node_states",
    ),
    queryCount(
      supabase
        .from("roadmap_adaptation_log")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "pending"),
      "pending adaptations",
    ),
    getMasterRoadmap(),
  ]);

  const dashboard = buildRoadmapDashboardData(roadmap, states, graph.nodes, pendingCount);

  return dashboard ? { dashboard, graph } : null;
}
