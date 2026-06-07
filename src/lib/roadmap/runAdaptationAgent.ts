import type { SupabaseClient } from "@supabase/supabase-js";
import { query, queryMaybe, queryCount } from "@/lib/supabase/query";
import { evaluateAdaptationDecision } from "./adaptationAgent";
import { claudeReasoningWriter, type ReasoningWriter } from "./adaptationReasoning";

export async function runAdaptationAgent(
  supabase: SupabaseClient,
  userId: string,
  activeNodeId: string,
  writeReasoning: ReasoningWriter = claudeReasoningWriter,
) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const recentAdaptations = await queryCount(
    supabase
      .from("roadmap_adaptation_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .contains("change_before", { activeNodeId })
      .gte("created_at", since.toISOString()),
    "recent adaptations",
  );
  if (recentAdaptations > 0) return;

  const [activeState, requiredEdges] = await Promise.all([
    queryMaybe<{
      node_id: string;
      quiz_score_best: number | null;
      quiz_attempts: number;
      project_submitted: boolean;
      scheduled_week: number;
    }>(
      supabase
        .from("user_node_states")
        .select("node_id, quiz_score_best, quiz_attempts, project_submitted, scheduled_week")
        .eq("user_id", userId)
        .eq("node_id", activeNodeId)
        .maybeSingle(),
      "active node state",
    ),
    query<{ from_node_id: string }>(
      supabase
        .from("master_roadmap_edges")
        .select("from_node_id")
        .eq("to_node_id", activeNodeId)
        .eq("edge_type", "required"),
      "required edges",
    ),
  ]);
  if (!activeState || activeState.quiz_score_best === null) return;

  const prerequisiteIds = requiredEdges.map((edge) => edge.from_node_id);
  const prerequisiteStates = prerequisiteIds.length > 0
    ? await query<{ node_id: string; state: string; quiz_score_best: number | null }>(
        supabase
          .from("user_node_states")
          .select("node_id, state, quiz_score_best")
          .eq("user_id", userId)
          .in("node_id", prerequisiteIds),
        "prerequisite states",
      )
    : [];

  const decision = evaluateAdaptationDecision({
    activeNodeId,
    quizScoreBest: activeState.quiz_score_best,
    quizAttempts: activeState.quiz_attempts,
    projectSubmitted: activeState.project_submitted,
    unsatisfiedRequiredPrerequisites: prerequisiteStates
      .filter((state) => state.state !== "completed" && state.state !== "skipped")
      .map((state) => ({ nodeId: state.node_id, quizScoreBest: state.quiz_score_best })),
  });
  if (!decision) return;

  const reasoning = await writeReasoning({
    type: decision.type,
    nodeId: decision.affectedNodeId,
    score: activeState.quiz_score_best,
    attempts: activeState.quiz_attempts,
  });
  const status = decision.type === "INSERT" ? "pending" : "auto_applied";

  const { error: logError } = await supabase.from("roadmap_adaptation_log").insert({
    user_id: userId,
    decision_type: decision.type,
    affected_node_id: decision.affectedNodeId,
    change_before: { activeNodeId },
    change_after: decision.type === "INSERT"
      ? { insertBefore: activeNodeId, nodeId: decision.affectedNodeId }
      : { skippedNodeId: decision.affectedNodeId },
    triggering_signals: {
      quizScoreBest: activeState.quiz_score_best,
      quizAttempts: activeState.quiz_attempts,
      projectSubmitted: activeState.project_submitted,
    },
    reasoning,
    confidence: decision.type === "INSERT" ? 0.8 : 0.95,
    status,
  });
  if (logError) throw new Error("Failed to write Adaptation Log");

  if (decision.type !== "REMOVE") return;

  await supabase
    .from("user_node_states")
    .update({ state: "skipped", skip_reason: reasoning })
    .eq("user_id", userId)
    .eq("node_id", decision.affectedNodeId);

  const { data: nextNode } = await supabase
    .from("user_node_states")
    .select("node_id")
    .eq("user_id", userId)
    .in("state", ["available", "locked"])
    .gt("scheduled_week", activeState.scheduled_week)
    .order("scheduled_week")
    .limit(1)
    .maybeSingle();

  if (!nextNode) {
    await supabase.from("user_roadmaps").update({ status: "completed", active_node_id: null }).eq("user_id", userId);
    return;
  }

  await Promise.all([
    supabase
      .from("user_node_states")
      .update({ state: "in_progress", started_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("node_id", nextNode.node_id),
    supabase
      .from("user_roadmaps")
      .update({ active_node_id: nextNode.node_id })
      .eq("user_id", userId),
  ]);
}
