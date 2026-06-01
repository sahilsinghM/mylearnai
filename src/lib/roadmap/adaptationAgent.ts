interface PrerequisiteSignal {
  nodeId: string;
  quizScoreBest: number | null;
}

interface AdaptationSignals {
  activeNodeId: string;
  quizScoreBest: number | null;
  quizAttempts: number;
  projectSubmitted: boolean;
  unsatisfiedRequiredPrerequisites: PrerequisiteSignal[];
}

export interface AdaptationDecision {
  type: "INSERT" | "REMOVE";
  affectedNodeId: string;
}

export function evaluateAdaptationDecision(
  signals: AdaptationSignals
): AdaptationDecision | null {
  if (
    signals.quizScoreBest !== null
    && signals.quizScoreBest > 0.9
    && signals.projectSubmitted
  ) {
    return { type: "REMOVE", affectedNodeId: signals.activeNodeId };
  }

  if (
    signals.quizScoreBest === null
    || signals.quizScoreBest >= 0.65
    || signals.quizAttempts < 2
    || signals.unsatisfiedRequiredPrerequisites.length === 0
  ) {
    return null;
  }

  const weakestPrerequisite = [...signals.unsatisfiedRequiredPrerequisites].sort(
    (a, b) => (a.quizScoreBest ?? 0) - (b.quizScoreBest ?? 0)
  )[0];

  return { type: "INSERT", affectedNodeId: weakestPrerequisite.nodeId };
}
