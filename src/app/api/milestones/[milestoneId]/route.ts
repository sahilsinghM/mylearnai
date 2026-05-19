import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ milestoneId: string }> }
) {
  try {
    const { milestoneId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: milestone } = await supabase
      .from("milestones")
      .select("id, project_id, user_id")
      .eq("id", milestoneId)
      .eq("user_id", user.id)
      .single();

    if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });

    await supabase
      .from("milestones")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", milestoneId);

    // Check if all milestones in project are complete
    const { data: allMilestones } = await supabase
      .from("milestones")
      .select("status")
      .eq("project_id", milestone.project_id);

    const projectCompleted = (allMilestones ?? []).every((m) => m.status === "completed");

    if (projectCompleted) {
      await supabase
        .from("projects")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", milestone.project_id);
    }

    return NextResponse.json({ milestoneId, projectCompleted });
  } catch (err) {
    console.error("Milestone update error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
