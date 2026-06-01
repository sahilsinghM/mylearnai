import { createClient } from "@/lib/supabase/server";
import { buildAdaptationLogEntries, type AdaptationLogEntry } from "./adaptationLog";
import { getMasterRoadmap } from "./masterRoadmap";

export async function getAdaptationLog(userId: string): Promise<AdaptationLogEntry[]> {
  const supabase = await createClient();
  const [{ data: rows }, graph] = await Promise.all([
    supabase
      .from("roadmap_adaptation_log")
      .select("id, decision_type, affected_node_id, reasoning, triggering_signals, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    getMasterRoadmap(),
  ]);

  return buildAdaptationLogEntries(
    (rows ?? []) as Parameters<typeof buildAdaptationLogEntries>[0],
    new Map(graph.nodes.map((node) => [node.id, node.title]))
  );
}
