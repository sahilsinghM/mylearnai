import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: plan } = await supabase
      .from("learning_plans")
      .select("id, week_number, status, difficulty, starts_on, ends_on")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (!plan) return NextResponse.json({ plan: null, days: [] });

    const { data: days } = await supabase
      .from("plan_days")
      .select("id, day_number, date_on, theme, summary, status")
      .eq("plan_id", plan.id)
      .order("day_number");

    const daysWithTasks = await Promise.all(
      (days ?? []).map(async (day) => {
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id, position, type, title, description, resource_url, duration_min, difficulty, status, completed_at")
          .eq("plan_day_id", day.id)
          .order("position");
        return { ...day, tasks: tasks ?? [] };
      })
    );

    return NextResponse.json({ plan, days: daysWithTasks });
  } catch (err) {
    console.error("Plan current error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
