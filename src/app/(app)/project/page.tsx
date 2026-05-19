import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MilestoneList } from "@/components/project/MilestoneList";
import type { Milestone } from "@/types/plan";

export default async function ProjectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: projectRow } = await supabase
    .from("projects")
    .select("id, name, description, status, started_at, completed_at")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (!projectRow) {
    return (
      <div>
        <TopBar title="Project" />
        <div className="p-6 text-muted-foreground text-sm">No project assigned yet.</div>
      </div>
    );
  }

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

  const completed = milestones.filter((m) => m.status === "completed").length;
  const total = milestones.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <TopBar title="Project" subtitle={projectRow.name} />
      <div className="p-6 max-w-2xl space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold leading-tight">{projectRow.name}</h2>
            <Badge variant={projectRow.status === "completed" ? "success" : "secondary"} className="capitalize">
              {projectRow.status}
            </Badge>
          </div>
          {projectRow.description && (
            <p className="text-sm text-muted-foreground">{projectRow.description}</p>
          )}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completed} of {total} milestones complete</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Milestones</h3>
          <MilestoneList initialMilestones={milestones} />
        </div>
      </div>
    </div>
  );
}
