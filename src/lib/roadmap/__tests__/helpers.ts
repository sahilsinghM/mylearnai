import type { MasterNode, MasterEdge, RoadmapGraph } from "../types";
import type { OnboardingProfile } from "@/types/onboarding";

export function makeGraph(
  nodes: Partial<MasterNode>[],
  edges: MasterEdge[] = []
): RoadmapGraph {
  return {
    nodes: nodes.map((n) => ({
      id: n.id ?? "node",
      phase: n.phase ?? 1,
      row: n.row ?? 0,
      track: n.track ?? "spine",
      title: n.title ?? n.id ?? "node",
      blurb: n.blurb ?? "",
      hours: n.hours ?? [2, 8, 16, 32],
      diff: n.diff ?? 3,
      relevance: n.relevance ?? {
        fintech: 0.5,
        research: 0.5,
        mlops: 0.5,
        dev_tools: 0.5,
        education_ai: 0.5,
      },
      skipForLevels: n.skipForLevels ?? [],
      resources: n.resources ?? [],
      projects: n.projects ?? [],
    })),
    edges,
  };
}

export function makeProfile(overrides: Partial<OnboardingProfile> = {}): OnboardingProfile {
  return {
    programmingLevel: "intermediate",
    languages: ["python"],
    aimlFamiliarity: "heard_of",
    mathConfidence: "medium",
    goals: ["build_product"],
    hoursPerDay: 2,
    interestAreas: ["nlp"],
    familiarTopics: [],
    topicDepth: "heard_of",
    ...overrides,
  };
}
