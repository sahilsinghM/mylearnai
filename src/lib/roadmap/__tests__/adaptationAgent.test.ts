import { describe, expect, it } from "vitest";
import { evaluateAdaptationDecision } from "../adaptationAgent";

describe("evaluateAdaptationDecision", () => {
  it("proposes INSERT only after repeated comprehension failure", () => {
    const base = {
      activeNodeId: "self-attention",
      quizScoreBest: 0.58,
      projectSubmitted: false,
      unsatisfiedRequiredPrerequisites: [
        { nodeId: "linear-algebra", quizScoreBest: 0.7 },
        { nodeId: "embeddings-tokenization", quizScoreBest: 0.4 },
      ],
    };

    expect(evaluateAdaptationDecision({ ...base, quizAttempts: 1 })).toBeNull();
    expect(evaluateAdaptationDecision({ ...base, quizAttempts: 2 })).toEqual({
      type: "INSERT",
      affectedNodeId: "embeddings-tokenization",
    });
  });

  it("auto-removes a node only when mastery and project proof are both present", () => {
    const base = {
      activeNodeId: "self-attention",
      quizScoreBest: 0.95,
      quizAttempts: 1,
      unsatisfiedRequiredPrerequisites: [],
    };

    expect(evaluateAdaptationDecision({ ...base, projectSubmitted: false })).toBeNull();
    expect(evaluateAdaptationDecision({ ...base, projectSubmitted: true })).toEqual({
      type: "REMOVE",
      affectedNodeId: "self-attention",
    });
  });
});
