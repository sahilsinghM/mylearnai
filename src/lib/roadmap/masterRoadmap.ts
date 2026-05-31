import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import type { MasterNode, MasterEdge, MasterRoadmapData, Phase, EdgeType } from "./types";

const PHASES: Phase[] = [
  { n: 1, label: "Foundations",   hue: 220, blurb: "Math + Python you can build on." },
  { n: 2, label: "Classical ML",  hue: 155, blurb: "Tabular, trees, evaluation." },
  { n: 3, label: "Deep Learning", hue: 264, blurb: "Networks that learn from gradients." },
  { n: 4, label: "Transformers",  hue: 305, blurb: "Attention, blocks, embeddings." },
  { n: 5, label: "LLMs",          hue: 340, blurb: "Pretraining, fine-tuning, eval." },
  { n: 6, label: "Agents & RAG",  hue: 50,  blurb: "Retrieval, tools, loops." },
  { n: 7, label: "Production",    hue: 25,  blurb: "Serving, observability, safety." },
];

async function fetchMasterRoadmap(): Promise<MasterRoadmapData> {
  const supabase = createPublicClient();

  const [{ data: rawNodes }, { data: rawEdges }] = await Promise.all([
    supabase
      .from("master_roadmap_nodes")
      .select("id, title, blurb, phase, row_index, difficulty, hours_awareness, hours_working, hours_fluent, hours_expert, relevance_fintech, relevance_research, relevance_mlops, relevance_dev_tools, relevance_education_ai, skip_for_levels, depth_awareness, depth_working, depth_fluent, depth_expert")
      .eq("is_published", true)
      .order("phase")
      .order("row_index"),
    supabase
      .from("master_roadmap_edges")
      .select("from_node_id, to_node_id, edge_type"),
  ]);

  const nodes: MasterNode[] = (rawNodes ?? []).map((n) => ({
    id: n.id,
    phase: n.phase,
    row: n.row_index,
    title: n.title,
    blurb: n.blurb,
    hours: [n.hours_awareness, n.hours_working, n.hours_fluent, n.hours_expert],
    diff: n.difficulty,
    relevance: {
      fintech: n.relevance_fintech,
      research: n.relevance_research,
      mlops: n.relevance_mlops,
      dev_tools: n.relevance_dev_tools,
      education_ai: n.relevance_education_ai,
    },
    skipForLevels: n.skip_for_levels ?? [],
    ...(n.depth_awareness && {
      depth: {
        awareness: n.depth_awareness,
        working: n.depth_working,
        fluent: n.depth_fluent,
        expert: n.depth_expert,
      },
    }),
  }));

  const edges: MasterEdge[] = (rawEdges ?? []).map((e) => ({
    from: e.from_node_id,
    to: e.to_node_id,
    type: e.edge_type as EdgeType,
  }));

  return { phases: PHASES, nodes, edges };
}

// Cache for 1 hour — the master roadmap changes rarely
export const getMasterRoadmap = unstable_cache(
  fetchMasterRoadmap,
  ["master-roadmap"],
  { revalidate: 3600 }
);
