"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TaskItem } from "./TaskItem";
import { cn } from "@/lib/utils";
import { formatDateShort } from "@/lib/utils";
import type { PlanDay, Task } from "@/types/plan";

const STATUS_BADGE: Record<PlanDay["status"], React.ReactNode> = {
  pending: <Badge variant="outline" className="text-xs">Upcoming</Badge>,
  in_progress: <Badge variant="warning" className="text-xs">In progress</Badge>,
  completed: <Badge variant="success" className="text-xs">Done</Badge>,
  skipped: <Badge variant="secondary" className="text-xs">Skipped</Badge>,
};

interface Props {
  day: PlanDay;
  hook?: string;
  taskWhys?: Map<string, string>;
  defaultOpen?: boolean;
}

export function DayCard({ day, hook, taskWhys, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [tasks, setTasks] = useState<Task[]>(day.tasks);

  const completedCount = tasks.filter((t) => t.status !== "pending").length;
  const totalMin = tasks.reduce((sum, t) => sum + (t.durationMin ?? 0), 0);

  function handleStatusChange(taskId: string, newStatus: Task["status"]) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="shrink-0">
          {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">Day {day.dayNumber}</span>
            <span className="text-xs text-muted-foreground">{formatDateShort(day.dateOn)}</span>
            {STATUS_BADGE[day.status]}
          </div>
          <div className="text-sm font-medium mt-0.5">{day.theme}</div>
          {hook && !open && (
            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{hook}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">{completedCount}/{tasks.length} tasks</div>
          {totalMin > 0 && <div className="text-xs text-muted-foreground">{totalMin}m</div>}
        </div>
      </button>

      {open && (
        <div className="border-t border-border">
          {/* Hook callout */}
          {hook && (
            <div className="px-4 py-3 bg-primary/5 border-b border-primary/10 flex items-start gap-2">
              <Zap className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-primary leading-relaxed">{hook}</p>
            </div>
          )}

          <div className="p-4 space-y-2">
            {day.summary && (
              <p className="text-xs text-muted-foreground pb-1">{day.summary}</p>
            )}
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                why={taskWhys?.get(`${day.dayNumber}-${task.position}`)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
