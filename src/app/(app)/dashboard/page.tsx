import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { TodayCard } from "@/components/dashboard/TodayCard";
import { WeekOverview } from "@/components/dashboard/WeekOverview";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { getToday } from "@/lib/utils";
import type { LearningPlan, PlanDay, Task, Milestone, Project } from "@/types/plan";

async function getPlanData(userId: string) {
  const supabase = await createClient();

  const { data: planRow } = await supabase
    .from("learning_plans")
    .select("id, week_number, status, difficulty, starts_on, ends_on")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (!planRow) return { plan: null, days: [] };

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
        userId,
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
        userId,
        dayNumber: day.day_number,
        dateOn: day.date_on,
        theme: day.theme,
        summary: day.summary,
        status: day.status,
        tasks,
      };
    })
  );

  const plan: LearningPlan = {
    id: planRow.id,
    userId,
    weekNumber: planRow.week_number,
    status: planRow.status,
    difficulty: planRow.difficulty,
    startsOn: planRow.starts_on,
    endsOn: planRow.ends_on,
    days,
  };

  return { plan, days };
}

async function getProjectData(userId: string): Promise<Project | null> {
  const supabase = await createClient();

  const { data: projectRow } = await supabase
    .from("projects")
    .select("id, user_id, plan_id, name, description, status, started_at, completed_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (!projectRow) return null;

  const { data: milestoneRows } = await supabase
    .from("milestones")
    .select("id, project_id, user_id, position, title, description, status, completed_at")
    .eq("project_id", projectRow.id)
    .order("position");

  const milestones: Milestone[] = (milestoneRows ?? []).map((m) => ({
    id: m.id,
    projectId: m.project_id,
    userId: m.user_id,
    position: m.position,
    title: m.title,
    description: m.description,
    status: m.status,
    completedAt: m.completed_at,
  }));

  return {
    id: projectRow.id,
    userId: projectRow.user_id,
    planId: projectRow.plan_id,
    name: projectRow.name,
    description: projectRow.description,
    status: projectRow.status,
    startedAt: projectRow.started_at,
    completedAt: projectRow.completed_at,
    milestones,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ plan, days }, project] = await Promise.all([
    getPlanData(user.id),
    getProjectData(user.id),
  ]);

  const today = getToday();
  const todayDay = days.find((d) => d.dateOn === today) ?? days[0];
  const todayDayNumber = todayDay?.dayNumber ?? 1;

  return (
    <div>
      <TopBar
        title="Dashboard"
        subtitle={plan ? `Week ${plan.weekNumber} · ${plan.difficulty} pace` : "Welcome"}
      />
      <div className="p-6 space-y-6 max-w-4xl">
        {plan && <StatsBar plan={plan} />}

        {days.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">This week</h2>
            <WeekOverview days={days} currentDayNumber={todayDayNumber} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today&apos;s tasks</h2>
            <TodayCard day={todayDay} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</h2>
            <ProjectCard project={project} />
          </div>
        </div>
      </div>
    </div>
  );
}
