"use client";

import { useState } from "react";
import { Check, SkipForward, X, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "./DifficultyBadge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Task } from "@/types/plan";

interface Props {
  task: Task;
  why?: string;
  compact?: boolean;
  onStatusChange?: (taskId: string, newStatus: Task["status"]) => void;
}

const TYPE_COLORS: Record<Task["type"], string> = {
  study: "bg-blue-900/40 text-blue-400",
  build: "bg-violet-900/40 text-violet-400",
  review: "bg-zinc-800 text-zinc-400",
  exercise: "bg-amber-900/40 text-amber-400",
};

export function TaskItem({ task, why, compact = false, onStatusChange }: Props) {
  const { toast } = useToast();
  const [status, setStatus] = useState(task.status);
  const [loading, setLoading] = useState(false);
  // "idle" | "rating" — shown after clicking complete, before sending
  const [pendingComplete, setPendingComplete] = useState(false);

  async function submitAction(event: "completed" | "skipped" | "failed", difficultyFelt?: "too_easy" | "just_right" | "too_hard") {
    setLoading(true);
    setPendingComplete(false);

    try {
      const body: Record<string, unknown> = { event };
      if (difficultyFelt) body.difficultyFelt = difficultyFelt;

      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to update task");

      setStatus(event);
      onStatusChange?.(task.id, event);

      const { dayCompleted } = await res.json();
      if (dayCompleted) {
        toast({ title: "Day complete!", description: "All tasks done. Keep building." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function handleComplete() {
    if (loading || status !== "pending") return;
    setPendingComplete(true);
  }

  function handleAction(event: "skipped" | "failed") {
    if (loading || status !== "pending") return;
    submitAction(event);
  }

  const isDone = status !== "pending";

  return (
    <div
      className={cn(
        "group flex gap-3 p-4 rounded-lg border transition-colors",
        isDone ? "opacity-50 border-border" : "border-border hover:border-border/80",
        status === "failed" && "border-destructive/30"
      )}
    >
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-xs px-1.5 py-0.5 rounded font-mono", TYPE_COLORS[task.type])}>
            {task.type}
          </span>
          {!compact && <DifficultyBadge difficulty={task.difficulty} />}
          {task.durationMin && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {task.durationMin}m
            </span>
          )}
        </div>

        <p className={cn("text-sm font-medium", isDone && "line-through")}>{task.title}</p>

        {!compact && task.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{task.description}</p>
        )}

        {!compact && why && (
          <p className="text-xs text-zinc-500 italic border-l-2 border-zinc-700 pl-2">{why}</p>
        )}

        {!compact && task.resourceUrl && (
          <a
            href={task.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Resource <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {isDone && (
          <Badge variant={status === "completed" ? "success" : status === "skipped" ? "secondary" : "danger"} className="text-xs">
            {status}
          </Badge>
        )}
      </div>

      {!isDone && (
        <div className="flex flex-col gap-1 shrink-0">
          {pendingComplete ? (
            <div className="flex flex-col gap-1 items-end">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">How was it?</span>
              <div className="flex gap-1">
                {(["too_easy", "just_right", "too_hard"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => submitAction("completed", d)}
                    disabled={loading}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-border hover:bg-accent transition-colors"
                  >
                    {d === "too_easy" ? "easy" : d === "just_right" ? "ok" : "hard"}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleComplete}
                disabled={loading}
                title="Mark complete"
                className="p-1.5 rounded hover:bg-emerald-900/40 hover:text-emerald-400 text-muted-foreground transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleAction("skipped")}
                disabled={loading}
                title="Skip"
                className="p-1.5 rounded hover:bg-zinc-700 hover:text-zinc-300 text-muted-foreground transition-colors"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleAction("failed")}
                disabled={loading}
                title="Mark as failed"
                className="p-1.5 rounded hover:bg-red-900/40 hover:text-red-400 text-muted-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
