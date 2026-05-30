import { createClient } from "@/lib/supabase/server";

export interface PlanDay {
  theme: string;
  status: string;
  dayNumber: number;
}

export interface WeekContext {
  weekTopic: string;
  weekNumber: number;
  days: PlanDay[];
}

export async function getWeekContext(userId: string): Promise<WeekContext | null> {
  const supabase = await createClient();

  const { data: plan } = await supabase
    .from("learning_plans")
    .select("id, week_number")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (!plan) return null;

  const { data: days } = await supabase
    .from("plan_days")
    .select("theme, status, day_number")
    .eq("plan_id", plan.id)
    .order("day_number");

  if (!days || days.length === 0) return null;

  const activeDay =
    days.find((d) => d.status === "in_progress") ??
    days.find((d) => d.status === "pending");

  if (!activeDay?.theme) return null;

  return {
    weekTopic: activeDay.theme,
    weekNumber: plan.week_number,
    days: days.map((d) => ({
      theme: d.theme,
      status: d.status,
      dayNumber: d.day_number,
    })),
  };
}
