export type DepthLevel = "awareness" | "working" | "fluent" | "expert";
export type EdgeType = "required" | "recommended" | "contextual";
export type ProgrammingLevel = "beginner" | "intermediate" | "senior" | "staff";
export type ResourceType = "paper" | "video" | "blog" | "docs" | "book";

export interface MasterResource {
  id: string;
  title: string;
  url: string;
  resourceType: ResourceType | null;
  depthLevel: DepthLevel;
  estimatedMinutes: number | null;
  isFree: boolean;
}

export interface MasterProject {
  id: string;
  title: string;
  description: string;
  depthLevel: Exclude<DepthLevel, "awareness">;
  deliverable: string | null;
  estimatedHours: number | null;
}

export interface MasterNode {
  id: string;
  phase: number;
  row: number;
  title: string;
  blurb: string;
  hours: [number, number, number, number]; // [awareness, working, fluent, expert]
  diff: 1 | 2 | 3 | 4 | 5;
  relevance: {
    fintech: number;
    research: number;
    mlops: number;
    dev_tools: number;
    education_ai: number;
  };
  // programming levels at or below which this node is skipped
  skipForLevels: ProgrammingLevel[];
  depth?: {
    awareness: string;
    working: string | null;
    fluent: string | null;
    expert: string | null;
  };
  resources: MasterResource[];
  projects: MasterProject[];
}

export interface MasterEdge {
  from: string;
  to: string;
  type: EdgeType;
}

export interface RoadmapGraph {
  nodes: MasterNode[];
  edges: MasterEdge[];
}

export interface PersonalizedNode {
  nodeId: string;
  depthTarget: DepthLevel;
  scheduledWeek: number;
}

export type NodeState = "locked" | "available" | "in_progress" | "completed" | "skipped" | "deferred";

export interface PersonalizedNodeState extends PersonalizedNode {
  state: NodeState;
}

export interface SkippedNode {
  nodeId: string;
  title: string;
  reason: string;
}

export interface PersonalizedRoadmap {
  activeNodeId: string | null;
  nodeStates: PersonalizedNodeState[];
  skippedNodes: SkippedNode[];
}

export interface RoadmapRevealNode {
  nodeId: string;
  title: string;
  depthTarget: DepthLevel;
  scheduledWeek: number;
}

export interface RoadmapReveal {
  skippedNodes: SkippedNode[];
  startingNode: RoadmapRevealNode | null;
  nextNodes: RoadmapRevealNode[];
  estimatedTotalWeeks: number;
}

// Shape returned by the server fetch utility and consumed by the roadmap renderer
export interface Phase {
  n: number;
  label: string;
  hue: number;
  blurb?: string;
}

export interface MasterRoadmapData {
  phases: Phase[];
  nodes: MasterNode[];
  edges: MasterEdge[];
}
