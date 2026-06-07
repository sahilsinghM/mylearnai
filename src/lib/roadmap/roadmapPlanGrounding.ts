import type { SupabaseClient } from "@supabase/supabase-js";
import { query, queryMaybe } from "@/lib/supabase/query";
import type { RoadmapPlanGrounding } from "@/lib/anthropic/prompts";

interface ActiveNodeRow {
  title: string;
}

interface NodeStateRow {
  depth_target: string;
}

interface ResourceRow {
  title: string;
  url: string;
  resource_type: string | null;
  estimated_minutes: number | null;
}

interface ProjectRow {
  title: string;
  description: string;
  deliverable: string | null;
  estimated_hours: number | null;
}

export function buildRoadmapPlanGrounding(
  node: ActiveNodeRow,
  state: NodeStateRow,
  resources: ResourceRow[],
  projects: ProjectRow[]
): RoadmapPlanGrounding {
  const project = projects[0];

  return {
    activeNodeTitle: node.title,
    depthTarget: state.depth_target,
    resources: resources.map((resource) => ({
      title: resource.title,
      url: resource.url,
      resourceType: resource.resource_type,
      estimatedMinutes: resource.estimated_minutes,
    })),
    project: project
      ? {
          title: project.title,
          description: project.description,
          deliverable: project.deliverable,
          estimatedHours: project.estimated_hours,
        }
      : null,
  };
}

export async function getActiveRoadmapGrounding(
  supabase: SupabaseClient,
  userId: string
): Promise<RoadmapPlanGrounding | null> {
  const roadmap = await queryMaybe<{ active_node_id: string | null }>(
    supabase
      .from("user_roadmaps")
      .select("active_node_id")
      .eq("user_id", userId)
      .maybeSingle(),
    "user_roadmaps",
  );
  if (!roadmap?.active_node_id) return null;

  const [node, state] = await Promise.all([
    queryMaybe<ActiveNodeRow>(
      supabase
        .from("master_roadmap_nodes")
        .select("title")
        .eq("id", roadmap.active_node_id)
        .maybeSingle(),
      "grounding node",
    ),
    queryMaybe<NodeStateRow>(
      supabase
        .from("user_node_states")
        .select("depth_target")
        .eq("user_id", userId)
        .eq("node_id", roadmap.active_node_id)
        .maybeSingle(),
      "grounding state",
    ),
  ]);
  if (!node || !state) return null;

  const [resources, projects] = await Promise.all([
    query<ResourceRow>(
      supabase
        .from("master_roadmap_resources")
        .select("title, url, resource_type, estimated_minutes")
        .eq("node_id", roadmap.active_node_id)
        .eq("depth_level", state.depth_target),
      "grounding resources",
    ),
    query<ProjectRow>(
      supabase
        .from("master_roadmap_projects")
        .select("title, description, deliverable, estimated_hours")
        .eq("node_id", roadmap.active_node_id)
        .eq("depth_level", state.depth_target)
        .limit(1),
      "grounding projects",
    ),
  ]);

  return buildRoadmapPlanGrounding(node, state, resources, projects);
}
