import type { DepthLevel, MasterNode, NodeState } from "./types";

interface RoadmapRow {
  active_node_id: string | null;
  generated_at: string;
}

export interface UserNodeStateRow {
  node_id: string;
  state: NodeState;
  depth_target: DepthLevel;
  depth_achieved: DepthLevel | null;
  scheduled_week: number;
  skip_reason: string | null;
  started_at: string | null;
}

export interface RoadmapDashboardNode {
  nodeId: string;
  title: string;
  depthTarget: DepthLevel;
  depthAchieved: DepthLevel | null;
  scheduledWeek: number;
  state: NodeState;
  skipReason: string | null;
}

export interface RoadmapDashboardData {
  activeNode: (RoadmapDashboardNode & {
    daysSinceStarted: number;
    estimatedDaysRemaining: number;
  }) | null;
  pathAhead: RoadmapDashboardNode[];
  history: RoadmapDashboardNode[];
  pendingAdaptationCount: number;
}

function daysBetween(startedAt: string | null, now: Date): number {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 86_400_000));
}

export function buildRoadmapDashboardData(
  roadmap: RoadmapRow | null,
  states: UserNodeStateRow[],
  nodes: MasterNode[],
  pendingAdaptationCount: number,
  now = new Date()
): RoadmapDashboardData | null {
  if (!roadmap) return null;

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const dashboardNodes = states
    .map((state) => {
      const node = nodesById.get(state.node_id);
      if (!node) return null;
      return {
        nodeId: state.node_id,
        title: node.title,
        depthTarget: state.depth_target,
        depthAchieved: state.depth_achieved,
        scheduledWeek: state.scheduled_week,
        state: state.state,
        skipReason: state.skip_reason,
      };
    })
    .filter(Boolean) as RoadmapDashboardNode[];

  const activeState = states.find((state) => state.node_id === roadmap.active_node_id);
  const activeNode = activeState && nodesById.get(activeState.node_id)
    ? {
        ...dashboardNodes.find((node) => node.nodeId === activeState.node_id)!,
        daysSinceStarted: daysBetween(activeState.started_at, now),
        estimatedDaysRemaining: Math.max(1, Math.ceil(nodesById.get(activeState.node_id)!.hours[1] / 2)),
      }
    : null;

  return {
    activeNode,
    pathAhead: dashboardNodes
      .filter((node) => node.state === "locked" || node.state === "available")
      .sort((a, b) => a.scheduledWeek - b.scheduledWeek)
      .slice(0, 10),
    history: dashboardNodes
      .filter((node) => node.state === "completed" || node.state === "skipped")
      .sort((a, b) => a.scheduledWeek - b.scheduledWeek),
    pendingAdaptationCount,
  };
}
