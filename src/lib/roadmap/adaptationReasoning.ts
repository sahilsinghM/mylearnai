import { anthropic } from "@/lib/anthropic/client";
import { TUTOR_MODEL } from "@/lib/anthropic/prompts";

/*
 * The seam for the human-readable reasoning the Adaptation Agent writes to the
 * Adaptation Log. The orchestrator (runAdaptationAgent) depends on the
 * ReasoningWriter port, not on Anthropic directly — so prod injects the Claude
 * adapter while tests inject a fake, and runAdaptationAgent runs without a key.
 */

export interface AdaptationReasoningInput {
  type: "INSERT" | "REMOVE";
  nodeId: string;
  score: number;
  attempts: number;
}

export type ReasoningWriter = (input: AdaptationReasoningInput) => Promise<string>;

/** Deterministic reasoning, used when the LLM is unavailable. Pure — unit-testable. */
export function fallbackReasoning({ type, nodeId, score, attempts }: AdaptationReasoningInput): string {
  const pct = Math.round(score * 100);
  return type === "INSERT"
    ? `Quiz score ${pct}% after ${attempts} attempts suggests reviewing ${nodeId} before continuing.`
    : `Quiz score ${pct}% and submitted project proof demonstrate mastery of ${nodeId}.`;
}

/** Default adapter: Claude writes the reasoning, falling back to the deterministic text. */
export const claudeReasoningWriter: ReasoningWriter = async (input) => {
  const fallback = fallbackReasoning(input);
  try {
    const message = await anthropic.messages.create({
      model: TUTOR_MODEL,
      max_tokens: 120,
      messages: [{
        role: "user",
        content: `Write 1-3 plain-English sentences explaining this roadmap adaptation. Include the quiz score. Decision: ${input.type}. Node: ${input.nodeId}. Quiz score: ${Math.round(input.score * 100)}%. Attempts: ${input.attempts}. Output only the explanation.`,
      }],
    });
    return message.content[0]?.type === "text" ? message.content[0].text.trim() : fallback;
  } catch {
    return fallback;
  }
};
