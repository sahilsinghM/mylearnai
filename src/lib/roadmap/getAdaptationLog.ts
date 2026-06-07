import { createClient } from "@/lib/supabase/server";
import { query } from "@/lib/supabase/query";
import { buildAdaptationLogEntries, type AdaptationLogEntry } from "./adaptationLog";
import { getMasterRoadmap } from "./masterRoadmap";

type AdaptationLogRow = Parameters<typeof buildAdaptationLogEntries>[0][number];

export async function getAdaptationLog(userId: string): Promise<AdaptationLogEntry[]> {
  const supabase = await createClient();
  const [rows, graph] = await Promise.all([
    query<AdaptationLogRow>(
      supabase
        .from("roadmap_adaptation_log")
        .select("id, decision_type, affected_node_id, reasoning, triggering_signals, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      "roadmap_adaptation_log",
    ),
    getMasterRoadmap(),
  ]);

  return buildAdaptationLogEntries(
    rows,
    new Map(graph.nodes.map((node) => [node.id, node.title])),
  );
}
