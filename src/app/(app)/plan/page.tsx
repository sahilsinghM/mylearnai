import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { WeekCompleteBar } from "@/components/dashboard/WeekCompleteBar";
import { PlanView } from "@/components/plan/PlanView";
import { getToday } from "@/lib/utils";
import type { PlanDay, Task, ClaudePlanJSON, ClaudeDay } from "@/types/plan";

export default async function PlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: planRow } = await supabase
    .from("learning_plans")
    .select("id, week_number, difficulty, starts_on, ends_on, plan_json")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (!planRow) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="Plan" />
        <div className="p-6 text-muted-foreground text-sm">No active plan found.</div>
      </div>
    );
  }

  const planJson = planRow.plan_json as ClaudePlanJSON | null;

  const dayHooks = new Map<number, string>();
  const dayWhys = new Map<string, string>();

  if (planJson?.days) {
    for (const d of planJson.days as ClaudeDay[]) {
      if (d.hook) dayHooks.set(d.dayNumber, d.hook);
      for (const t of d.tasks) {
        if (t.why) dayWhys.set(`${d.dayNumber}-${t.position}`, t.why);
      }
    }
  }

  const { data: dayRows } = await supabase
    .from("plan_days")
    .select("id, day_number, date_on, theme, summary, status")
    .eq("plan_id", planRow.id)
    .order("day_number");

  const days: PlanDay[] = await Promise.all(
    (dayRows ?? []).map(async (day) => {
      const { data: taskRows } = await supabase
        .from("tasks")
        .select("id, position, type, title, description, resource_url, duration_min, difficulty, status, completed_at")
        .eq("plan_day_id", day.id)
        .order("position");

      const tasks: Task[] = (taskRows ?? []).map((t) => ({
        id: t.id,
        planDayId: day.id,
        userId: user.id,
        position: t.position,
        type: t.type,
        title: t.title,
        description: t.description,
        resourceUrl: t.resource_url,
        durationMin: t.duration_min,
        difficulty: t.difficulty,
        status: t.status,
        completedAt: t.completed_at,
      }));

      return {
        id: day.id,
        planId: planRow.id,
        userId: user.id,
        dayNumber: day.day_number,
        dateOn: day.date_on,
        theme: day.theme,
        summary: day.summary,
        status: day.status,
        tasks,
      };
    })
  );

  const today = getToday();
  const todayDayNumber = days.find((d) => d.dateOn === today)?.dayNumber ?? 1;

  const terminalStatuses = new Set(["completed", "skipped", "failed"]);
  const allDaysTerminal = days.length === 7 && days.every((d) => terminalStatuses.has(d.status));
  const weekExpired = planRow.ends_on < today;
  const weekDone = allDaysTerminal || weekExpired;

  const startsFormatted = new Date(planRow.starts_on + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endsFormatted = new Date(planRow.ends_on + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar
        title={`Week ${planRow.week_number} Plan`}
        subtitle={`${startsFormatted} → ${endsFormatted}`}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1060px] mx-auto px-6 pt-7 pb-16">
          {weekDone && (
            <div className="mb-6">
              <WeekCompleteBar weekNumber={planRow.week_number} />
            </div>
          )}
          <PlanView
            days={days}
            narrative={planJson?.narrative}
            difficulty={planRow.difficulty}
            weekNumber={planRow.week_number}
            todayDayNumber={todayDayNumber}
            dayHooks={Object.fromEntries(dayHooks)}
            dayWhys={Object.fromEntries(dayWhys)}
          />
        </div>
      </div>
    </div>
  );
}
