"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TaskItem } from "@/components/plan/TaskItem";
import type { PlanDay, Task } from "@/types/plan";
import { formatDate } from "@/lib/utils";

interface Props {
  day: PlanDay | undefined;
}

export function TodayCard({ day }: Props) {
  const [tasks, setTasks] = useState<Task[]>(day?.tasks ?? []);

  if (!day) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No tasks scheduled for today.
        </CardContent>
      </Card>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const doneTasks = tasks.filter((t) => t.status !== "pending");

  function handleStatusChange(taskId: string, newStatus: Task["status"]) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Today</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(day.dateOn)}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">{day.theme}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {doneTasks.length}/{tasks.length} done
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {pendingTasks.length === 0 && doneTasks.length > 0 && (
          <div className="py-4 text-center text-sm text-emerald-400">
            All tasks complete for today.
          </div>
        )}
        {pendingTasks.map((task, i) => (
          <div key={task.id} className={i === 0 ? "ring-1 ring-primary/30 rounded-lg" : ""}>
            <TaskItem task={task} compact onStatusChange={handleStatusChange} />
          </div>
        ))}
        {doneTasks.length > 0 && pendingTasks.length > 0 && (
          <div className="border-t border-border pt-2 mt-2 space-y-2">
            {doneTasks.map((task) => (
              <TaskItem key={task.id} task={task} compact onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
        {doneTasks.length > 0 && pendingTasks.length === 0 && (
          <div className="space-y-2">
            {doneTasks.map((task) => (
              <TaskItem key={task.id} task={task} compact onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
