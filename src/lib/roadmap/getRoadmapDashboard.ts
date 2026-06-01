import { createClient } from "@/lib/supabase/server";
import { getMasterRoadmap } from "./masterRoadmap";
import { buildRoadmapDashboardData, type UserNodeStateRow } from "./roadmapDashboard";

export async function getRoadmapDashboard(userId: string) {
  const supabase = await createClient();
  const [{ data: roadmap }, { data: states }, { count }, graph] = await Promise.all([
    supabase
      .from("user_roadmaps")
      .select("active_node_id, generated_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_node_states")
      .select("node_id, state, depth_target, depth_achieved, scheduled_week, skip_reason, started_at")
      .eq("user_id", userId),
    supabase
      .from("roadmap_adaptation_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "pending"),
    getMasterRoadmap(),
  ]);

  const dashboard = buildRoadmapDashboardData(
    roadmap,
    (states ?? []) as UserNodeStateRow[],
    graph.nodes,
    count ?? 0
  );

  return dashboard ? { dashboard, graph } : null;
}
