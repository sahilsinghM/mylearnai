import { createClient } from "@/lib/supabase/server";

export interface ActiveNodeResource {
  id: string;
  title: string;
  url: string;
}

export interface ActiveNodeContext {
  nodeTitle: string;
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
  const [{ data: node }, { data: resources }] = await Promise.all([
    supabase
      .from("master_roadmap_nodes")
      .select("title")
      .eq("id", activeNodeId)
      .maybeSingle(),
    supabase
      .from("master_roadmap_resources")
      .select("id, title, url")
      .eq("node_id", activeNodeId)
      .order("depth_level")
      .limit(10),
  ]);

  if (!node) return null;

  return {
    nodeTitle: node.title as string,
    resources: (resources ?? []) as ActiveNodeResource[],
  };
}
