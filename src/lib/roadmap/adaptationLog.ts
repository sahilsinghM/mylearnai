export type AdaptationLogStatus = "pending" | "accepted" | "overridden" | "auto_applied";
export type AdaptationLogAction = "accepted" | "overridden";

interface AdaptationLogDecision {
  decisionType: "INSERT" | "REMOVE";
  affectedNodeId: string;
}

export interface AdaptationLogEntry {
  id: string;
  decisionType: "INSERT" | "REMOVE";
  affectedNodeId: string;
  affectedNodeTitle: string;
  reasoning: string;
  triggeringSignals: {
    quizScoreBest?: number;
    quizAttempts?: number;
    projectSubmitted?: boolean;
  };
  status: AdaptationLogStatus;
  createdAt: string;
}

interface AdaptationLogRow {
  id: string;
  decision_type: "INSERT" | "REMOVE";
  affected_node_id: string;
  reasoning: string;
  triggering_signals: AdaptationLogEntry["triggeringSignals"];
  status: AdaptationLogStatus;
  created_at: string;
}

export function buildAdaptationLogEntries(
  rows: AdaptationLogRow[],
  nodeTitles: Map<string, string>
): AdaptationLogEntry[] {
  return rows.map((row) => ({
    id: row.id,
    decisionType: row.decision_type,
    affectedNodeId: row.affected_node_id,
    affectedNodeTitle: nodeTitles.get(row.affected_node_id) ?? row.affected_node_id,
    reasoning: row.reasoning,
    triggeringSignals: row.triggering_signals,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export function buildAdaptationLogAction(
  action: AdaptationLogAction,
  decision: AdaptationLogDecision
) {
  return {
    logStatus: action,
    nodeStateUpdate: action === "accepted" && decision.decisionType === "INSERT"
      ? { nodeId: decision.affectedNodeId, state: "available" as const }
      : null,
  };
}

export function formatTriggeringSignals(signals: AdaptationLogEntry["triggeringSignals"]): string {
  const parts: string[] = [];
  if (signals.quizScoreBest !== undefined) parts.push(`Quiz score: ${Math.round(signals.quizScoreBest * 100)}%`);
  if (signals.quizAttempts !== undefined) parts.push(`${signals.quizAttempts} attempt(s)`);
  if (signals.projectSubmitted) parts.push("Project submitted");
  return parts.join(" · ") || "No signal summary";
}
