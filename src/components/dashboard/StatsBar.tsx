import type { LearningPlan } from "@/types/plan";

interface Props {
  plan: LearningPlan | null;
}

export function StatsBar({ plan }: Props) {
  if (!plan) return null;

  const completedDays = plan.days.filter((d) => d.status === "completed").length;
  const totalTasks = plan.days.flatMap((d) => d.tasks).length;
  const completedTasks = plan.days.flatMap((d) => d.tasks).filter((t) => t.status === "completed").length;

  const stats = [
    { label: "Week", value: `#${plan.weekNumber}` },
    { label: "Difficulty", value: plan.difficulty },
    { label: "Days done", value: `${completedDays}/7` },
    { label: "Tasks done", value: `${completedTasks}/${totalTasks}` },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map(({ label, value }) => (
        <div key={label} className="border border-border rounded-lg p-3 text-center">
          <div className="text-lg font-mono font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}
