"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Project } from "@/types/plan";

interface Props {
  project: Project | null;
}

export function ProjectCard({ project }: Props) {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState(project?.milestones ?? []);
  const [loading, setLoading] = useState<string | null>(null);

  if (!project) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          No project assigned yet.
        </CardContent>
      </Card>
    );
  }

  const completed = milestones.filter((m) => m.status === "completed").length;
  const total = milestones.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const nextMilestone = milestones.find((m) => m.status === "pending");

  async function markMilestone(milestoneId: string) {
    setLoading(milestoneId);
    try {
      const res = await fetch(`/api/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error();

      setMilestones((prev) =>
        prev.map((m) => (m.id === milestoneId ? { ...m, status: "completed" as const } : m))
      );
      toast({ title: "Milestone complete!", description: "Keep shipping." });
    } catch {
      toast({ title: "Error", description: "Failed to update milestone", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-tight">{project.name}</CardTitle>
          <Link href="/project" className="text-xs text-primary hover:underline shrink-0">
            View all
          </Link>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{completed} of {total} milestones</span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {nextMilestone ? (
          <div className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border">
            <div className="space-y-0.5">
              <div className="text-xs text-muted-foreground">Next milestone</div>
              <div className="text-sm font-medium">{nextMilestone.title}</div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => markMilestone(nextMilestone.id)}
              disabled={loading === nextMilestone.id}
              className="shrink-0"
            >
              {loading === nextMilestone.id ? "…" : "Done"}
            </Button>
          </div>
        ) : (
          <div className="text-center text-sm text-emerald-400 py-2">
            All milestones complete!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
