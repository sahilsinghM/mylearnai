"use client";

import { ArrowRight, CheckCircle2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoadmapReveal as RoadmapRevealData } from "@/lib/roadmap/types";

export function RoadmapReveal({
  reveal,
  onStart,
}: {
  reveal: RoadmapRevealData;
  onStart: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl space-y-7">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-wider">
            <Compass className="h-4 w-4" /> Personalized Roadmap
          </div>
          <h1 className="text-3xl font-bold">Your path is ready.</h1>
          <p className="text-sm text-muted-foreground">
            {reveal.estimatedTotalWeeks} focused topics, sequenced from your background and goal.
          </p>
        </div>

        {reveal.skippedNodes.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Skipped for you</h2>
            {reveal.skippedNodes.map((node) => (
              <div key={node.nodeId} className="flex items-start gap-2 rounded-lg border border-border p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{node.title}</p>
                  <p className="text-xs text-muted-foreground">{node.reason}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        {reveal.startingNode && (
          <section className="space-y-2">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Starting point</h2>
            <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
              <p className="text-sm font-semibold">{reveal.startingNode.title}</p>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {reveal.startingNode.depthTarget} depth · Week {reveal.startingNode.scheduledWeek}
              </p>
            </div>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Next on your path</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {reveal.nextNodes.map((node) => (
              <div key={node.nodeId} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{node.title}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  {node.depthTarget} depth · Week {node.scheduledWeek}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Button onClick={onStart} size="lg">
          Start learning <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
