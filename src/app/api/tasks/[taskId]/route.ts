import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { taskEventSchema } from "@/lib/validations/task";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parse = taskEventSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { event, difficultyFelt, note } = parse.data;

    // Verify ownership
    const { data: task } = await supabase
      .from("tasks")
      .select("id, plan_day_id, user_id")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .single();

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    // Record event
    await supabase.from("task_events").insert({
      user_id: user.id,
      task_id: taskId,
      event_type: event,
      difficulty_felt: difficultyFelt ?? null,
      note: note ?? null,
    });

    // Update task status
    const completedAt = event === "completed" ? new Date().toISOString() : null;
    await supabase
      .from("tasks")
      .update({ status: event, completed_at: completedAt })
      .eq("id", taskId);

    // Check if all tasks in the day are terminal
    const { data: dayTasks } = await supabase
      .from("tasks")
      .select("status")
      .eq("plan_day_id", task.plan_day_id);

    const allTerminal = (dayTasks ?? []).every((t) =>
      ["completed", "skipped", "failed"].includes(t.status)
    );

    if (allTerminal) {
      await supabase
        .from("plan_days")
        .update({ status: "completed" })
        .eq("id", task.plan_day_id);
    } else {
      // Mark day as in_progress if it was pending
      await supabase
        .from("plan_days")
        .update({ status: "in_progress" })
        .eq("id", task.plan_day_id)
        .eq("status", "pending");
    }

    return NextResponse.json({ taskId, status: event, dayCompleted: allTerminal });
  } catch (err) {
    console.error("Task update error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
