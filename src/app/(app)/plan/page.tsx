import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { DayCard } from "@/components/plan/DayCard";
import { Badge } from "@/components/ui/badge";
import { getToday } from "@/lib/utils";
import type { PlanDay, Task } from "@/types/plan";

export default async function PlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: planRow } = await supabase
    .from("learning_plans")
    .select("id, week_number, difficulty, starts_on, ends_on")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (!planRow) {
    return (
      <div>
        <TopBar title="Plan" />
        <div className="p-6 text-muted-foreground text-sm">No active plan found.</div>
      </div>
    );
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

  return (
    <div>
      <TopBar
        title={`Week ${planRow.week_number} Plan`}
        subtitle={`${planRow.starts_on} → ${planRow.ends_on}`}
      />
      <div className="p-6 max-w-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">{planRow.difficulty} pace</Badge>
          <span className="text-xs text-muted-foreground">
            {days.filter((d) => d.status === "completed").length}/7 days complete
          </span>
        </div>

        <div className="space-y-2">
          {days.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              defaultOpen={day.dayNumber === todayDayNumber}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
