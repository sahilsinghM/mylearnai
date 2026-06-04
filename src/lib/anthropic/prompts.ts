import type { OnboardingProfile } from "@/types/onboarding";

export const TUTOR_MODEL = "claude-sonnet-4-6";
export const TUTOR_BOOTSTRAP_TURN = "Begin the session.";

export const SYSTEM_PROMPT = `You are DeepPath, an adaptive AI learning curriculum designer for software engineers learning AI/ML.
You produce structured, realistic, opinionated learning plans.
No motivational fluff. Focus on hands-on building over theory.
All build tasks must produce a real, runnable artifact (script, notebook, function — not toy examples).
Return ONLY valid JSON matching the schema provided. No markdown wrapper, no prose, no code fences.`;

export interface RoadmapPlanGrounding {
  activeNodeTitle: string;
  depthTarget: string;
  resources: {
    title: string;
    url: string;
    resourceType: string | null;
    estimatedMinutes: number | null;
  }[];
  project: {
    title: string;
    description: string;
    deliverable: string | null;
    estimatedHours: number | null;
  } | null;
}

function planJsonSchema(projectName = "Build a Vector Search Engine from Scratch") {
  return {
  difficulty: "gentle | normal | accelerated",
  narrative: "2-3 sentences connecting the user's stated goals to what they will concretely be able to build/do by day 7. Make it personal and specific — reference their background, their goals, and the exact artifact they'll produce. No generic phrases.",
  days: [
    {
      dayNumber: "number 1-7",
      theme: "one-line topic focus",
      summary: "1-2 sentence description of the day",
      hook: "One sentence starting with 'By the end of today,' describing the exact runnable artifact or concrete skill the user will have — specific enough to be genuinely exciting",
      tasks: [
        {
          position: "number starting at 1",
          type: "study | build | review | exercise",
          title: "concise task title",
          description: "specific instructions — what exactly to do, not vague",
          resourceUrl: "url string or null",
          durationMin: "estimated minutes as integer",
          difficulty: "easy | medium | hard",
          why: "One sentence: why this specific task is in the plan right now — connect it to the user's goals or explain what the next task depends on it for",
        },
      ],
    },
  ],
  project: {
    name: projectName,
    description: "project description",
    milestones: [
      { position: "number 1-6", title: "milestone title", description: "specific deliverable" },
    ],
  },
};
}

function buildRoadmapGroundingPrompt(grounding?: RoadmapPlanGrounding | null): string {
  if (!grounding) return "";

  const resources = grounding.resources
    .map((resource) => `- ${resource.title}: ${resource.url}${resource.estimatedMinutes ? ` (${resource.estimatedMinutes} minutes)` : ""}`)
    .join("\n");
  const project = grounding.project
    ? `Title: ${grounding.project.title}
Description: ${grounding.project.description}
Deliverable: ${grounding.project.deliverable ?? "A runnable proof artifact"}
Estimated hours: ${grounding.project.estimatedHours ?? "unknown"}`
    : "No curated project available. Generate a focused proof project for this node.";

  return `
ACTIVE PERSONALIZED ROADMAP CONTEXT:
- Active Node: ${grounding.activeNodeTitle}
- Depth target: ${grounding.depthTarget}

CURATED RESOURCES — use these as the primary study material. Do not invent replacements:
${resources || "- No curated resources available. Use the fallback curriculum behavior."}

CURATED PROJECT — use this project for the week when available:
${project}
`;
}

export function buildInitialPlanPrompt(
  profile: OnboardingProfile,
  grounding?: RoadmapPlanGrounding | null
): string {
  const goalList = profile.goals.join(", ").replace(/_/g, " ");
  const interestList = profile.interestAreas.join(", ").replace(/_/g, " ");
  const topicsText = profile.familiarTopics.length
    ? `${profile.familiarTopics.join(", ")} — depth: ${profile.topicDepth.replace(/_/g, " ")}`
    : "none";
  const roadmapContext = buildRoadmapGroundingPrompt(grounding);
  const projectName = grounding?.project?.title ?? "Build a Vector Search Engine from Scratch";
  const projectConstraint = grounding?.project
    ? `- The project MUST be the curated Active Node project named exactly: "${projectName}"`
    : '- The foundational project MUST be named exactly: "Build a Vector Search Engine from Scratch"';

  return `Generate a 7-day personalized AI/ML learning plan for an engineer with this exact profile:

PROFILE:
- Programming level: ${profile.programmingLevel}
- AI/ML familiarity: ${profile.aimlFamiliarity.replace(/_/g, " ")}
- Math confidence: ${profile.mathConfidence}
- Goals: ${goalList}
- Hours available per day: ${profile.hoursPerDay}
- Interest areas: ${interestList}
- Already familiar with: ${topicsText}
${roadmapContext}

HARD CONSTRAINTS:
- Total task time per day must fit within ${profile.hoursPerDay} hours (${profile.hoursPerDay * 60} minutes)
- For topics the user already knows at "have_implemented" depth: skip entirely. At "can_explain" depth: go straight to advanced application, no basics. At "heard_of" depth: keep but compress foundations.
- Each day must have at least 1 build task (type: "build") that produces a real runnable artifact
- Difficulty selection: use "gentle" if programming_level=beginner OR math_confidence=low; use "accelerated" if programming_level=senior AND math_confidence=high; otherwise "normal"
${projectConstraint}
- The project MUST have EXACTLY 6 milestones
- Milestones must be concrete and specific (e.g., "Implement cosine similarity function and test with 5 sample vectors")

SEQUENCING RULES:
- Day 1: foundations/setup (install deps, understand core concept, write first real function)
- Days 2-5: progressive skill building with increasing complexity
- Day 6: integration (combine skills from earlier days)
- Day 7: project milestone and reflection

NARRATIVE REQUIREMENTS:
- The "narrative" field must reference the user's actual goals (${goalList}) and their current level (${profile.aimlFamiliarity.replace(/_/g, " ")})
- Each day's "hook" must name the exact artifact or skill — e.g. "By the end of today, you'll have a working Python script that encodes sentences into vectors and prints their cosine similarity" not "you'll understand embeddings"
- Each task's "why" must be specific — explain the causal chain: what this unlocks, or why it's sequenced here

Return ONLY this JSON schema (no prose, no markdown):
${JSON.stringify(planJsonSchema(projectName), null, 2)}`;
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
  signals: AdaptationSignals,
  grounding?: RoadmapPlanGrounding | null
): string {
  let difficultyInstruction = `Keep difficulty at "${previous.difficulty}"`;
  if (signals.completionRate < 50 || signals.failCount / Math.max(signals.totalTasks, 1) > 0.3) {
    const lower = previous.difficulty === "accelerated" ? "normal" : "gentle";
    difficultyInstruction = `Drop difficulty to "${lower}" and reduce to max 3 tasks per day`;
  } else if (signals.tooEasyCount / Math.max(signals.totalTasks, 1) > 0.6) {
    const higher = previous.difficulty === "gentle" ? "normal" : "accelerated";
    difficultyInstruction = `Increase difficulty to "${higher}" and add one extra build task per day`;
  }
  const roadmapContext = buildRoadmapGroundingPrompt(grounding);
  const projectName = grounding?.project?.title ?? "Build a Vector Search Engine from Scratch";
  const projectConstraint = grounding?.project
    ? `- The project section MUST use the curated Active Node project named exactly: "${projectName}"`
    : "- The project section should be the SAME project (vector search engine) with the SAME 6 milestones — user continues working on it";

  return `Generate the NEXT 7-day continuation plan for this engineer.

PROFILE (same as before):
- Programming level: ${profile.programmingLevel}
- AI/ML familiarity: ${profile.aimlFamiliarity.replace(/_/g, " ")}
- Math confidence: ${profile.mathConfidence}
- Hours available per day: ${profile.hoursPerDay}
- Interest areas: ${profile.interestAreas.join(", ").replace(/_/g, " ")}
${roadmapContext}

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
${projectConstraint}

Return ONLY this JSON schema (no prose, no markdown):
${JSON.stringify(planJsonSchema(projectName), null, 2)}`;
}

export function sanitizeTopicForPrompt(topic: string): string {
  return topic.replace(/[\n\r<>]/g, " ").trim().slice(0, 200);
}

export function escapeTranscriptContent(content: string): string {
  return content.replace(/[<>]/g, "");
}

export function buildTutorSystemPrompt(weekTopic: string, weekNumber: number, gapConcepts?: string[]): string {
  const gapLine = gapConcepts && gapConcepts.length > 0
    ? `\n\nGap areas identified (probe these in upcoming questions): ${gapConcepts.join(", ")}`
    : "";
  return `You are a rigorous mentor tutoring an engineer on: ${weekTopic}.${gapLine}
Context: They are on Week ${weekNumber} of their AI/ML learning path.

OPENING MESSAGE REQUIREMENT: In your very first question, end with one sentence telling the user about the "I think I get it" button below the chat — e.g. "Tap 'I think I get it' when you feel confident about a concept and want to move on."

RESPONSE FORMAT — always output valid JSON, nothing else:
{
  "question": "Your single question (1-3 sentences)",
  "choices": [
    { "text": "A correct, precise answer" },
    { "text": "A plausible but incomplete or slightly wrong answer" },
    { "text": "A common misconception or clearly wrong answer" }
  ]
}

Rules:
- Ask ONE question at a time. Never give explanations or answers unprompted.
- Start with a foundational question on ${weekTopic}.
- When they answer correctly, probe deeper or adjacent.
- When they fumble, ask a clarifying question that exposes the gap — never fill it in.
- Keep question text short (1-3 sentences max).
- Never say "great answer" or give praise — just probe further.
- Always produce exactly 3 choices in the order: solid → shaky → wrong.
- Choices must be plausible and distinct — no obvious filler options.
- Return ONLY the JSON object. No prose, no markdown fences.`;
}

export function buildCloseSessionPrompt(weekTopic: string): string {
  return `You are analyzing a Socratic tutoring transcript on ${weekTopic}.
Output JSON only (no prose):
{
  "gaps": [{ "concept": "string", "severity": "low|med|high", "evidence": "string" }],
  "projectAssignment": {
    "title": "string",
    "description": "string",
    "acceptance_criteria": ["string"]
  }
}
Rules:
- Maximum 2 gaps (highest severity only)
- Project MUST be derived from the gaps, not generic to the topic
- Acceptance criteria are checkable by running code or inspecting output
- If gaps are too scattered, pick the one gap with the most fumbled turns`;
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
