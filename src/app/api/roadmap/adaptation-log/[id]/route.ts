import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { buildAdaptationLogAction } from "@/lib/roadmap/adaptationLog";

const bodySchema = z.object({
  action: z.enum(["accepted", "overridden"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parse = bodySchema.safeParse(await request.json());
  if (!parse.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { id } = await params;
  const admin = await createAdminClient();
  const { data: entry } = await admin
    .from("roadmap_adaptation_log")
    .select("decision_type, affected_node_id, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!entry) return NextResponse.json({ error: "Adaptation Log entry not found" }, { status: 404 });
  if (entry.status !== "pending" || entry.decision_type !== "INSERT") {
    return NextResponse.json({ error: "Entry is not actionable" }, { status: 400 });
  }

  const action = buildAdaptationLogAction(parse.data.action, {
    decisionType: entry.decision_type,
    affectedNodeId: entry.affected_node_id,
  });

  const { error: logError } = await admin
    .from("roadmap_adaptation_log")
    .update({ status: action.logStatus })
    .eq("id", id)
    .eq("user_id", user.id);
  if (logError) return NextResponse.json({ error: "Failed to update Adaptation Log" }, { status: 500 });

  if (action.nodeStateUpdate) {
    const { data: activeRoadmap } = await admin
      .from("user_roadmaps")
      .select("active_node_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const { data: activeState } = activeRoadmap?.active_node_id
      ? await admin
          .from("user_node_states")
          .select("scheduled_week")
          .eq("user_id", user.id)
          .eq("node_id", activeRoadmap.active_node_id)
          .maybeSingle()
      : { data: null };

    const { error: stateError } = await admin
      .from("user_node_states")
      .update({
        state: action.nodeStateUpdate.state,
        scheduled_week: activeState?.scheduled_week ?? 1,
      })
      .eq("user_id", user.id)
      .eq("node_id", action.nodeStateUpdate.nodeId);
    if (stateError) return NextResponse.json({ error: "Failed to apply roadmap update" }, { status: 500 });
  }

  return NextResponse.json({ status: action.logStatus });
}
