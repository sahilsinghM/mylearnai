import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/server";
import {
  fetchMasterRoadmapRows,
  type RawNode,
  type RawEdge,
  type RawResource,
  type RawProject,
} from "./masterRoadmapRepo";
import type {
  MasterEdge,
  MasterNode,
  MasterProject,
  MasterResource,
  MasterRoadmapData,
  Phase,
} from "./types";

const PHASES: Phase[] = [
  { n: 1, label: "Foundations",   hue: 220, blurb: "Math + Python you can build on." },
  { n: 2, label: "Classical ML",  hue: 155, blurb: "Tabular, trees, evaluation." },
  { n: 3, label: "Deep Learning", hue: 264, blurb: "Networks that learn from gradients." },
  { n: 4, label: "Transformers",  hue: 305, blurb: "Attention, blocks, embeddings." },
  { n: 5, label: "LLMs",          hue: 340, blurb: "Pretraining, fine-tuning, eval." },
  { n: 6, label: "Agents & RAG",  hue: 50,  blurb: "Retrieval, tools, loops." },
  { n: 7, label: "Production",    hue: 25,  blurb: "Serving, observability, safety." },
];

export function buildMasterRoadmapData(
  rawNodes: RawNode[],
  rawEdges: RawEdge[],
  rawResources: RawResource[],
  rawProjects: RawProject[]
): MasterRoadmapData {
  const resourcesByNode = new Map<string, MasterResource[]>();
  for (const resource of rawResources) {
    const resources = resourcesByNode.get(resource.node_id) ?? [];
    resources.push({
      id: resource.id,
      title: resource.title,
      url: resource.url,
      resourceType: resource.resource_type,
      depthLevel: resource.depth_level,
      estimatedMinutes: resource.estimated_minutes,
      isFree: resource.is_free,
    });
    resourcesByNode.set(resource.node_id, resources);
  }

  const projectsByNode = new Map<string, MasterProject[]>();
  for (const project of rawProjects) {
    const projects = projectsByNode.get(project.node_id) ?? [];
    projects.push({
      id: project.id,
      title: project.title,
      description: project.description,
      depthLevel: project.depth_level,
      deliverable: project.deliverable,
      estimatedHours: project.estimated_hours,
    });
    projectsByNode.set(project.node_id, projects);
  }

  const nodes: MasterNode[] = rawNodes.map((n) => ({
    id: n.id,
    phase: n.phase,
    row: n.row_index,
    track: n.track ?? "spine", // `track` no longer exists in the DB; default it
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
    resources: resourcesByNode.get(n.id) ?? [],
    projects: projectsByNode.get(n.id) ?? [],
  }));

  const edges: MasterEdge[] = rawEdges.map((e) => ({
    from: e.from_node_id,
    to: e.to_node_id,
    type: e.edge_type,
  }));

  return { phases: PHASES, nodes, edges };
}

async function fetchMasterRoadmap(): Promise<MasterRoadmapData> {
  const supabase = createPublicClient();
  const { rawNodes, rawEdges, rawResources, rawProjects } = await fetchMasterRoadmapRows(supabase);
  return buildMasterRoadmapData(rawNodes, rawEdges, rawResources, rawProjects);
}

// Cache for 1 hour — the master roadmap changes rarely
export const getMasterRoadmap = unstable_cache(
  fetchMasterRoadmap,
  ["master-roadmap"],
  { revalidate: 3600 }
);
