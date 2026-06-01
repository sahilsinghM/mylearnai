"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, X } from "lucide-react";
import type { MasterEdge, MasterNode } from "@/lib/roadmap/types";
import type { RoadmapDashboardData, RoadmapDashboardNode } from "@/lib/roadmap/roadmapDashboard";

function NodeButton({
  node,
  onSelect,
}: {
  node: RoadmapDashboardNode;
  onSelect: (nodeId: string) => void;
}) {
  return (
    <button
      onClick={() => onSelect(node.nodeId)}
      className="w-full flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left hover:border-primary/50 hover:bg-primary/5 transition-colors"
    >
      <span>
        <span className="block text-sm font-medium">{node.title}</span>
        <span className="block text-xs text-muted-foreground capitalize">
          Week {node.scheduledWeek} · {node.depthTarget} depth
        </span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

function NodePanel({
  node,
  nodes,
  edges,
  onClose,
  onSelect,
}: {
  node: MasterNode;
  nodes: MasterNode[];
  edges: MasterEdge[];
  onClose: () => void;
  onSelect: (nodeId: string) => void;
}) {
  const nodeMap = new Map(nodes.map((item) => [item.id, item]));
  const prerequisites = edges.filter((edge) => edge.to === node.id).map((edge) => nodeMap.get(edge.from)).filter(Boolean) as MasterNode[];
  const unlocks = edges.filter((edge) => edge.from === node.id).map((edge) => nodeMap.get(edge.to)).filter(Boolean) as MasterNode[];
  const project = node.projects.find((item) => item.depthLevel === "working") ?? node.projects[0];

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-md overflow-y-auto border-l border-border bg-card p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-primary">Master Node</p>
          <h2 className="mt-1 text-xl font-semibold">{node.title}</h2>
        </div>
        <button onClick={onClose} aria-label="Close node details" className="rounded p-1 text-muted-foreground hover:bg-accent">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{node.blurb}</p>

      <h3 className="mt-6 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Depth levels</h3>
      <div className="mt-2 space-y-2">
        {(["awareness", "working", "fluent", "expert"] as const).map((depth, index) => (
          <div key={depth} className="rounded-lg border border-border p-3">
            <div className="flex justify-between text-xs capitalize"><strong>{depth}</strong><span>{node.hours[index]}h</span></div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{node.depth?.[depth] ?? node.blurb}</p>
          </div>
        ))}
      </div>

      {[
        ["Prerequisites", prerequisites],
        ["Unlocks", unlocks],
      ].map(([label, related]) => (
        <section key={label as string}>
          <h3 className="mt-6 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label as string}</h3>
          <div className="mt-2 space-y-1.5">
            {(related as MasterNode[]).length === 0 && <p className="text-xs text-muted-foreground">None</p>}
            {(related as MasterNode[]).map((item) => (
              <button key={item.id} onClick={() => onSelect(item.id)} className="w-full rounded border border-border px-2 py-1.5 text-left text-xs hover:border-primary/50">
                {item.title}
              </button>
            ))}
          </div>
        </section>
      ))}

      {project && (
        <section>
          <h3 className="mt-6 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Sample project</h3>
          <div className="mt-2 rounded-lg border border-border p-3">
            <strong className="text-sm">{project.title}</strong>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{project.description}</p>
          </div>
        </section>
      )}

      <section>
        <h3 className="mt-6 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Resources</h3>
        <div className="mt-2 space-y-1.5">
          {node.resources.map((resource) => (
            <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer" className="block rounded border border-border px-2 py-1.5 text-xs hover:border-primary/50">
              {resource.title}
            </a>
          ))}
        </div>
      </section>
    </aside>
  );
}

export function PersonalizedRoadmapDashboard({
  dashboard,
  nodes,
  edges,
}: {
  dashboard: RoadmapDashboardData;
  nodes: MasterNode[];
  edges: MasterEdge[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNode = nodes.find((node) => node.id === selectedId) ?? null;

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your roadmap</h2>

      {dashboard.pendingAdaptationCount > 0 && (
        <Link href="/dashboard#adaptation-log" className="block rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          Your roadmap has {dashboard.pendingAdaptationCount} suggested update(s). Review changes.
        </Link>
      )}

      {dashboard.activeNode && (
        <button onClick={() => setSelectedId(dashboard.activeNode!.nodeId)} className="w-full rounded-lg border border-primary/40 bg-primary/5 p-4 text-left">
          <p className="font-mono text-[10px] uppercase tracking-wider text-primary">Active Node</p>
          <p className="mt-1 text-lg font-semibold">{dashboard.activeNode.title}</p>
          <p className="mt-1 text-xs text-muted-foreground capitalize">
            {dashboard.activeNode.depthTarget} depth · Day {dashboard.activeNode.daysSinceStarted + 1} · About {dashboard.activeNode.estimatedDaysRemaining} days remaining
          </p>
        </button>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-xs text-muted-foreground">Path ahead</h3>
          {dashboard.pathAhead.map((node) => <NodeButton key={node.nodeId} node={node} onSelect={setSelectedId} />)}
        </div>
        <details className="rounded-lg border border-border p-3">
          <summary className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <ChevronDown className="h-3.5 w-3.5" /> Completed and skipped
          </summary>
          <div className="mt-3 space-y-2">
            {dashboard.history.length === 0 && <p className="text-xs text-muted-foreground">No history yet.</p>}
            {dashboard.history.map((node) => (
              <button key={node.nodeId} onClick={() => setSelectedId(node.nodeId)} className="block w-full rounded border border-border p-2 text-left">
                <span className="block text-sm">{node.title}</span>
                <span className="block text-xs text-muted-foreground capitalize">
                  {node.state === "skipped" ? `Skipped · ${node.skipReason ?? "Roadmap adaptation"}` : `Completed · ${node.depthAchieved ?? node.depthTarget} depth`}
                </span>
              </button>
            ))}
          </div>
        </details>
      </div>

      {selectedNode && <NodePanel node={selectedNode} nodes={nodes} edges={edges} onClose={() => setSelectedId(null)} onSelect={setSelectedId} />}
    </section>
  );
}
