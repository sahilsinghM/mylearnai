import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TUTOR_MODEL } from "@/lib/anthropic/prompts";
import { evaluateAdaptationDecision } from "./adaptationAgent";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function generateReasoning(
  type: "INSERT" | "REMOVE",
  nodeId: string,
  score: number,
  attempts: number
) {
  const fallback = type === "INSERT"
    ? `Quiz score ${Math.round(score * 100)}% after ${attempts} attempts suggests reviewing ${nodeId} before continuing.`
    : `Quiz score ${Math.round(score * 100)}% and submitted project proof demonstrate mastery of ${nodeId}.`;

  try {
    const message = await anthropic.messages.create({
      model: TUTOR_MODEL,
      max_tokens: 120,
      messages: [{
        role: "user",
        content: `Write 1-3 plain-English sentences explaining this roadmap adaptation. Include the quiz score. Decision: ${type}. Node: ${nodeId}. Quiz score: ${Math.round(score * 100)}%. Attempts: ${attempts}. Output only the explanation.`,
      }],
    });
    return message.content[0]?.type === "text" ? message.content[0].text.trim() : fallback;
  } catch {
    return fallback;
  }
}

export async function runAdaptationAgent(
  supabase: SupabaseClient,
  userId: string,
  activeNodeId: string
) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("roadmap_adaptation_log")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .contains("change_before", { activeNodeId })
    .gte("created_at", since.toISOString());
  if ((count ?? 0) > 0) return;

  const [{ data: activeState }, { data: requiredEdges }] = await Promise.all([
    supabase
      .from("user_node_states")
      .select("node_id, quiz_score_best, quiz_attempts, project_submitted, scheduled_week")
      .eq("user_id", userId)
      .eq("node_id", activeNodeId)
      .maybeSingle(),
    supabase
      .from("master_roadmap_edges")
      .select("from_node_id")
      .eq("to_node_id", activeNodeId)
      .eq("edge_type", "required"),
  ]);
  if (!activeState || activeState.quiz_score_best === null) return;

  const prerequisiteIds = (requiredEdges ?? []).map((edge) => edge.from_node_id);
  const { data: prerequisiteStates } = prerequisiteIds.length > 0
    ? await supabase
        .from("user_node_states")
        .select("node_id, state, quiz_score_best")
        .eq("user_id", userId)
        .in("node_id", prerequisiteIds)
    : { data: [] };

  const decision = evaluateAdaptationDecision({
    activeNodeId,
    quizScoreBest: activeState.quiz_score_best,
    quizAttempts: activeState.quiz_attempts,
    projectSubmitted: activeState.project_submitted,
    unsatisfiedRequiredPrerequisites: (prerequisiteStates ?? [])
      .filter((state) => state.state !== "completed" && state.state !== "skipped")
      .map((state) => ({ nodeId: state.node_id, quizScoreBest: state.quiz_score_best })),
  });
  if (!decision) return;

  const reasoning = await generateReasoning(
    decision.type,
    decision.affectedNodeId,
    activeState.quiz_score_best,
    activeState.quiz_attempts
  );
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
