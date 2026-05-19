import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { DayCard } from "@/components/plan/DayCard";
import { Badge } from "@/components/ui/badge";
import { getToday } from "@/lib/utils";
import type { PlanDay, Task, ClaudePlanJSON, ClaudeDay } from "@/types/plan";

function JourneyArc({ days, todayNumber }: { days: PlanDay[]; todayNumber: number }) {
  return (
    <div className="relative flex items-start gap-0 overflow-x-auto pb-2">
      {days.map((day, i) => {
        const isToday = day.dayNumber === todayNumber;
        const isDone = day.status === "completed";
        const isPast = day.dayNumber < todayNumber && !isDone;

        return (
          <div key={day.id} className="flex items-start shrink-0">
            <div className="flex flex-col items-center gap-1.5 w-20">
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                  isDone
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isToday
                    ? "bg-primary border-primary text-primary-foreground"
                    : isPast
                    ? "bg-zinc-700 border-zinc-600 text-zinc-400"
                    : "bg-transparent border-zinc-700 text-zinc-500"
                }`}
              >
                {isDone ? "✓" : day.dayNumber}
              </div>
              <div className={`text-center text-[10px] leading-tight px-1 ${isToday ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {day.theme.split(" ").slice(0, 3).join(" ")}
              </div>
            </div>
            {i < days.length - 1 && (
              <div className={`h-0.5 w-4 mt-4 shrink-0 ${isDone ? "bg-emerald-500" : "bg-zinc-700"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

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
      <div>
        <TopBar title="Plan" />
        <div className="p-6 text-muted-foreground text-sm">No active plan found.</div>
      </div>
    );
  }

  const planJson = planRow.plan_json as ClaudePlanJSON | null;

  // Build lookup maps from plan_json for narrative fields
  const dayHooks = new Map<number, string>();
  const taskWhys = new Map<string, string>();

  if (planJson?.days) {
    for (const d of planJson.days as ClaudeDay[]) {
      if (d.hook) dayHooks.set(d.dayNumber, d.hook);
      for (const t of d.tasks) {
        if (t.why) taskWhys.set(`${d.dayNumber}-${t.position}`, t.why);
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
  const completedCount = days.filter((d) => d.status === "completed").length;

  return (
    <div>
      <TopBar
        title={`Week ${planRow.week_number} Plan`}
        subtitle={`${planRow.starts_on} → ${planRow.ends_on}`}
      />
      <div className="p-6 max-w-3xl space-y-6">

        {/* Narrative hero */}
        {planJson?.narrative && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4 space-y-2">
            <div className="text-xs font-mono text-primary uppercase tracking-wider">Your learning path</div>
            <p className="text-sm leading-relaxed text-foreground">{planJson.narrative}</p>
          </div>
        )}

        {/* Meta + journey arc */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="capitalize">{planRow.difficulty} pace</Badge>
            <span className="text-xs text-muted-foreground">{completedCount}/7 days complete</span>
          </div>
          <JourneyArc days={days} todayNumber={todayDayNumber} />
        </div>

        {/* Day cards */}
        <div className="space-y-2">
          {days.map((day) => (
            <DayCard
              key={day.id}
              day={day}
              hook={dayHooks.get(day.dayNumber)}
              taskWhys={taskWhys}
              defaultOpen={day.dayNumber === todayDayNumber}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
