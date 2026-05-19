import type { OnboardingProfile } from "@/types/onboarding";
import type { ClaudePlanJSON } from "@/types/plan";

export const SYSTEM_PROMPT = `You are DeepPath, an adaptive AI learning curriculum designer for software engineers learning AI/ML.
You produce structured, realistic, opinionated learning plans.
No motivational fluff. Focus on hands-on building over theory.
All build tasks must produce a real, runnable artifact (script, notebook, function — not toy examples).
Return ONLY valid JSON matching the schema provided. No markdown wrapper, no prose, no code fences.`;

const PLAN_JSON_SCHEMA = {
  difficulty: "gentle | normal | accelerated",
  days: [
    {
      dayNumber: "number 1-7",
      theme: "one-line topic focus",
      summary: "1-2 sentence description of the day",
      tasks: [
        {
          position: "number starting at 1",
          type: "study | build | review | exercise",
          title: "concise task title",
          description: "specific instructions — what exactly to do, not vague",
          resourceUrl: "url string or null",
          durationMin: "estimated minutes as integer",
          difficulty: "easy | medium | hard",
        },
      ],
    },
  ],
  project: {
    name: "Build a Vector Search Engine from Scratch",
    description: "project description",
    milestones: [
      { position: "number 1-6", title: "milestone title", description: "specific deliverable" },
    ],
  },
};

export function buildInitialPlanPrompt(profile: OnboardingProfile): string {
  const goalList = profile.goals.join(", ").replace(/_/g, " ");
  const interestList = profile.interestAreas.join(", ").replace(/_/g, " ");
  const topicsText = profile.familiarTopics.length
    ? `${profile.familiarTopics.join(", ")} — depth: ${profile.topicDepth.replace(/_/g, " ")}`
    : "none";

  return `Generate a 7-day personalized AI/ML learning plan for an engineer with this exact profile:

PROFILE:
- Programming level: ${profile.programmingLevel}
- AI/ML familiarity: ${profile.aimlFamiliarity.replace(/_/g, " ")}
- Math confidence: ${profile.mathConfidence}
- Goals: ${goalList}
- Hours available per day: ${profile.hoursPerDay}
- Interest areas: ${interestList}
- Already familiar with: ${topicsText}

HARD CONSTRAINTS:
- Total task time per day must fit within ${profile.hoursPerDay} hours (${profile.hoursPerDay * 60} minutes)
- For topics the user already knows at "have_implemented" depth: skip entirely. At "can_explain" depth: go straight to advanced application, no basics. At "heard_of" depth: keep but compress foundations.
- Each day must have at least 1 build task (type: "build") that produces a real runnable artifact
- Difficulty selection: use "gentle" if programming_level=beginner OR math_confidence=low; use "accelerated" if programming_level=senior AND math_confidence=high; otherwise "normal"
- The foundational project MUST be named exactly: "Build a Vector Search Engine from Scratch"
- The project MUST have EXACTLY 6 milestones
- Milestones must be concrete and specific (e.g., "Implement cosine similarity function and test with 5 sample vectors")

SEQUENCING RULES:
- Day 1: foundations/setup (install deps, understand core concept, write first real function)
- Days 2-5: progressive skill building with increasing complexity
- Day 6: integration (combine skills from earlier days)
- Day 7: project milestone and reflection

Return ONLY this JSON schema (no prose, no markdown):
${JSON.stringify(PLAN_JSON_SCHEMA, null, 2)}`;
}

interface AdaptationSignals {
  completionRate: number;
  tooEasyCount: number;
  tooHardCount: number;
  skipCount: number;
  failCount: number;
  totalTasks: number;
}

interface PreviousPlanSummary {
  difficulty: string;
  weekNumber: number;
  lastDayNumber: number;
  completedThemes: string[];
}

export function buildAdaptationPrompt(
  profile: OnboardingProfile,
  previous: PreviousPlanSummary,
  signals: AdaptationSignals
): string {
  let difficultyInstruction = `Keep difficulty at "${previous.difficulty}"`;
  if (signals.completionRate < 50 || signals.failCount / Math.max(signals.totalTasks, 1) > 0.3) {
    const lower = previous.difficulty === "accelerated" ? "normal" : "gentle";
    difficultyInstruction = `Drop difficulty to "${lower}" and reduce to max 3 tasks per day`;
  } else if (signals.tooEasyCount / Math.max(signals.totalTasks, 1) > 0.6) {
    const higher = previous.difficulty === "gentle" ? "normal" : "accelerated";
    difficultyInstruction = `Increase difficulty to "${higher}" and add one extra build task per day`;
  }

  return `Generate the NEXT 7-day continuation plan for this engineer.

PROFILE (same as before):
- Programming level: ${profile.programmingLevel}
- AI/ML familiarity: ${profile.aimlFamiliarity.replace(/_/g, " ")}
- Math confidence: ${profile.mathConfidence}
- Hours available per day: ${profile.hoursPerDay}
- Interest areas: ${profile.interestAreas.join(", ").replace(/_/g, " ")}

WHAT HAPPENED LAST WEEK (week ${previous.weekNumber}):
- Completion rate: ${Math.round(signals.completionRate)}%
- Tasks marked too easy: ${signals.tooEasyCount}
- Tasks marked too hard: ${signals.tooHardCount}
- Tasks skipped: ${signals.skipCount}
- Tasks failed: ${signals.failCount}
- Topics already covered: ${previous.completedThemes.join(", ")}

ADJUSTMENT: ${difficultyInstruction}

CONSTRAINTS:
- Do NOT repeat any topics from the list above
- Build on demonstrated knowledge; go deeper or broader
- Each day must have at least 1 build task
- Total task time per day must fit within ${profile.hoursPerDay} hours
- The project section should be the SAME project (vector search engine) with the SAME 6 milestones — user continues working on it

Return ONLY this JSON schema (no prose, no markdown):
${JSON.stringify(PLAN_JSON_SCHEMA, null, 2)}`;
}

export function extractJsonFromResponse(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) return fenceMatch[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text.trim();
}
