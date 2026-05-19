"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Milestone } from "@/types/plan";

interface Props {
  milestone: Milestone;
  isActionable: boolean;
  onComplete: (milestoneId: string) => void;
}

export function MilestoneItem({ milestone, isActionable, onComplete }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isDone = milestone.status === "completed";

  async function handleComplete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/milestones/${milestone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error();

      onComplete(milestone.id);
      if (data.projectCompleted) {
        toast({ title: "Project complete!", description: "You shipped it. Well done." });
      } else {
        toast({ title: "Milestone complete", description: "Next one unlocked." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update milestone", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0",
            isDone
              ? "border-emerald-500 bg-emerald-500"
              : isActionable
              ? "border-primary bg-primary/10"
              : "border-border bg-background"
          )}
        >
          {isDone && <Check className="h-3.5 w-3.5 text-white" />}
          {!isDone && isActionable && <div className="h-2 w-2 rounded-full bg-primary" />}
        </div>
        <div className="w-px flex-1 mt-1" style={{ background: isDone ? "var(--emerald-500, oklch(0.6 0.17 155))" : "var(--border)" }} />
      </div>

      <div className="flex-1 pb-6 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className={cn("text-sm font-medium", !isDone && !isActionable && "text-muted-foreground")}>
              {milestone.title}
            </div>
            {milestone.description && (
              <div className="text-xs text-muted-foreground mt-0.5">{milestone.description}</div>
            )}
            {isDone && milestone.completedAt && (
              <div className="text-xs text-emerald-500 mt-1">
                Completed {new Date(milestone.completedAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {isActionable && !isDone && (
            <Button size="sm" onClick={handleComplete} disabled={loading} className="shrink-0">
              {loading ? "…" : "Mark complete"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
