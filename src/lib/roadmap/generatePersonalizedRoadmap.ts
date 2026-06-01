import type { OnboardingProfile } from "@/types/onboarding";
import type {
  DepthLevel,
  MasterNode,
  PersonalizedNode,
  PersonalizedRoadmap,
  ProgrammingLevel,
  RoadmapReveal,
  RoadmapGraph,
} from "./types";

const PROGRAMMING_LEVEL_RANK: Record<ProgrammingLevel, number> = {
  beginner: 0,
  intermediate: 1,
  senior: 2,
  staff: 3,
};

function shouldSkipNode(node: MasterNode, profile: OnboardingProfile): boolean {
  if (node.skipForLevels.length === 0) return false;
  const userRank = PROGRAMMING_LEVEL_RANK[profile.programmingLevel as ProgrammingLevel] ?? 0;
  return node.skipForLevels.some(
    (level) => userRank >= PROGRAMMING_LEVEL_RANK[level]
  );
}

function depthTargetForNode(_nodeId: string, profile: OnboardingProfile): DepthLevel {
  if (profile.goals.includes("research")) return "fluent";
  return "working";
}

function requiredPrerequisiteIds(graph: RoadmapGraph): Set<string> {
  // Nodes that are required prerequisites of any other node
  const ids = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.type === "required") ids.add(edge.from);
  }
  return ids;
}

export function generatePersonalizedRoadmap(
  profile: OnboardingProfile,
  graph: RoadmapGraph
): PersonalizedNode[] {
  const requiredPrereqs = requiredPrerequisiteIds(graph);

  const included = graph.nodes.filter(
    (node) => !shouldSkipNode(node, profile) || requiredPrereqs.has(node.id)
  );

  // Sort by phase then row
  const sorted = [...included].sort((a, b) =>
    a.phase !== b.phase ? a.phase - b.phase : a.row - b.row
  );

  let week = 1;
  return sorted.map((node) => {
    const result: PersonalizedNode = {
      nodeId: node.id,
      depthTarget: depthTargetForNode(node.id, profile),
      scheduledWeek: week++,
    };
    return result;
  });
}

export function buildPersonalizedRoadmap(
  profile: OnboardingProfile,
  graph: RoadmapGraph
): PersonalizedRoadmap {
  const nodes = generatePersonalizedRoadmap(profile, graph);
  const includedIds = new Set(nodes.map((node) => node.nodeId));
  const activeNodeId = nodes[0]?.nodeId ?? null;

  return {
    activeNodeId,
    nodeStates: nodes.map((node) => ({
      ...node,
      state: node.nodeId === activeNodeId ? "in_progress" : "locked",
    })),
    skippedNodes: graph.nodes
      .filter((node) => !includedIds.has(node.id))
      .map((node) => ({
        nodeId: node.id,
        title: node.title,
        reason: "Strong programming background declared",
      })),
  };
}

export function buildRoadmapReveal(
  roadmap: PersonalizedRoadmap,
  graph: RoadmapGraph
): RoadmapReveal {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const revealNodes = roadmap.nodeStates.map((node) => ({
    nodeId: node.nodeId,
    title: nodesById.get(node.nodeId)?.title ?? node.nodeId,
    depthTarget: node.depthTarget,
    scheduledWeek: node.scheduledWeek,
  }));

  return {
    skippedNodes: roadmap.skippedNodes,
    startingNode: revealNodes[0] ?? null,
    nextNodes: revealNodes.slice(1, 5),
    estimatedTotalWeeks: revealNodes.length,
  };
}
