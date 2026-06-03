import { createClient } from "@/lib/supabase/server";

export interface PlanDayResource {
  title: string;
  url: string;
}

export interface PlanDay {
  theme: string;
  status: string;
  dayNumber: number;
  resources: PlanDayResource[];
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
    .select("id, theme, status, day_number, tasks(title, resource_url)")
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
    days: days.map((d) => {
      const tasks = Array.isArray(d.tasks) ? d.tasks : [];
      const resources = tasks
        .filter((t: { title: string; resource_url: string | null }) => t.resource_url)
        .slice(0, 3)
        .map((t: { title: string; resource_url: string }) => ({ title: t.title, url: t.resource_url }));
      return {
        theme: d.theme,
        status: d.status,
        dayNumber: d.day_number,
        resources,
      };
    }),
  };
}
