import { createClient } from "@/lib/supabase/server";
import { query, queryMaybe } from "@/lib/supabase/query";

// Cap resources per node to keep PREP phase scannable and prompt size manageable
const MAX_RESOURCES_PER_NODE = 10;

export interface ActiveNodeResource {
  id: string;
  title: string;
  url: string;
}

export interface ActiveNodeContext {
  nodeTitle: string;
  nodeBlurb: string;
  resources: ActiveNodeResource[];
}

export async function getActiveNodeContext(userId: string): Promise<ActiveNodeContext | null> {
  const supabase = await createClient();

  // Get the active node id from user_roadmaps
  const { data: roadmap } = await supabase
    .from("user_roadmaps")
    .select("active_node_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!roadmap?.active_node_id) return null;

  const activeNodeId = roadmap.active_node_id as string;

  // Fetch node title and resources in parallel
  const [node, resources] = await Promise.all([
    queryMaybe<{ title: string; blurb: string | null }>(
      supabase
        .from("master_roadmap_nodes")
        .select("title, blurb")
        .eq("id", activeNodeId)
        .maybeSingle(),
      "active node",
    ),
    query<ActiveNodeResource>(
      supabase
        .from("master_roadmap_resources")
        .select("id, title, url")
        .eq("node_id", activeNodeId)
        .order("depth_level")
        // Cap resources per node to keep PREP phase scannable and prompt size manageable
        .limit(MAX_RESOURCES_PER_NODE),
      "active node resources",
    ),
  ]);

  if (!node) return null;

  return {
    nodeTitle: node.title,
    nodeBlurb: node.blurb ?? "",
    resources,
  };
}
