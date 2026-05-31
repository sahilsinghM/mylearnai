export type DepthLevel = "awareness" | "working" | "fluent" | "expert";
export type EdgeType = "required" | "recommended" | "contextual";
export type ProgrammingLevel = "beginner" | "intermediate" | "senior" | "staff";

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
    working: string;
    fluent: string;
    expert: string;
  };
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
