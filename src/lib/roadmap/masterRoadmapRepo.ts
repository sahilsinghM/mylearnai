import type { SupabaseClient } from "@supabase/supabase-js";
import { query } from "@/lib/supabase/query";
import type { DepthLevel, EdgeType, MasterNode, MasterProject, ResourceType, Track } from "./types";

/*
 * The Master Roadmap repository: the one module that knows how the curated
 * knowledge graph is stored. It owns the table names, the column lists, and the
 * raw row shapes, and reads them through `query()` so a failed read throws
 * instead of silently returning [].
 *
 * Both runtime (masterRoadmap.ts, cached) and build-time (scripts/generate-
 * roadmap-svg.ts) go through here. Previously each hand-wrote its own select and
 * they drifted: the script dropped the `track` column, masterRoadmap.ts kept it,
 * the query errored, and the `?? []` fallback returned an empty roadmap. One
 * column definition now lives here, so that drift cannot recur.
 */

// `track` was dropped from the DB — it is intentionally NOT selected. Nodes
// default to "spine" when mapped (see masterRoadmap.ts).
const NODE_COLUMNS =
  "id, title, blurb, phase, row_index, difficulty, hours_awareness, hours_working, hours_fluent, hours_expert, relevance_fintech, relevance_research, relevance_mlops, relevance_dev_tools, relevance_education_ai, skip_for_levels, depth_awareness, depth_working, depth_fluent, depth_expert";
const EDGE_COLUMNS = "from_node_id, to_node_id, edge_type";
const RESOURCE_COLUMNS = "id, node_id, title, url, resource_type, depth_level, estimated_minutes, is_free";
const PROJECT_COLUMNS = "id, node_id, title, description, depth_level, deliverable, estimated_hours";

export interface RawNode {
  id: string;
  title: string;
  blurb: string;
  phase: number;
  row_index: number;
  track?: Track; // dropped from the DB; defaulted to "spine" when building nodes
  difficulty: MasterNode["diff"];
  hours_awareness: number;
  hours_working: number;
  hours_fluent: number;
  hours_expert: number;
  relevance_fintech: number;
  relevance_research: number;
  relevance_mlops: number;
  relevance_dev_tools: number;
  relevance_education_ai: number;
  skip_for_levels: MasterNode["skipForLevels"] | null;
  depth_awareness: string | null;
  depth_working: string | null;
  depth_fluent: string | null;
  depth_expert: string | null;
}

export interface RawEdge {
  from_node_id: string;
  to_node_id: string;
  edge_type: EdgeType;
}

export interface RawResource {
  id: string;
  node_id: string;
  title: string;
  url: string;
  resource_type: ResourceType | null;
  depth_level: DepthLevel;
  estimated_minutes: number | null;
  is_free: boolean;
}

export interface RawProject {
  id: string;
  node_id: string;
  title: string;
  description: string;
  depth_level: MasterProject["depthLevel"];
  deliverable: string | null;
  estimated_hours: number | null;
}

export interface MasterRoadmapRows {
  rawNodes: RawNode[];
  rawEdges: RawEdge[];
  rawResources: RawResource[];
  rawProjects: RawProject[];
}

/** Read every published Master Roadmap row. Throws if any read fails. */
export async function fetchMasterRoadmapRows(supabase: SupabaseClient): Promise<MasterRoadmapRows> {
  const [rawNodes, rawEdges, rawResources, rawProjects] = await Promise.all([
    query<RawNode>(
      supabase
        .from("master_roadmap_nodes")
        .select(NODE_COLUMNS)
        .eq("is_published", true)
        .order("phase")
        .order("row_index"),
      "master_roadmap_nodes",
    ),
    query<RawEdge>(supabase.from("master_roadmap_edges").select(EDGE_COLUMNS), "master_roadmap_edges"),
    query<RawResource>(
      supabase.from("master_roadmap_resources").select(RESOURCE_COLUMNS),
      "master_roadmap_resources",
    ),
    query<RawProject>(
      supabase.from("master_roadmap_projects").select(PROJECT_COLUMNS),
      "master_roadmap_projects",
    ),
  ]);
  return { rawNodes, rawEdges, rawResources, rawProjects };
}
