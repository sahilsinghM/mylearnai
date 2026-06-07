"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Sparkle, ArrowRight, X } from "lucide-react";
import type { DepthLevel, MasterNode, MasterRoadmapData } from "@/lib/roadmap/types";
import "@/app/roadmap/roadmap.css";

const DEPTH_LEVELS: DepthLevel[] = ["awareness", "working", "fluent", "expert"];
const DEPTH_FALLBACKS: Record<DepthLevel, string> = {
  awareness: "Understand the concept well enough to explain it and recognize it in context.",
  working:   "Apply it in a real project under normal conditions without looking things up.",
  fluent:    "Debug, extend, and reason about edge cases without reference material.",
  expert:    "Teach it, benchmark it, and make architectural decisions that depend on it.",
};

function depthDescription(node: MasterNode, depth: DepthLevel): string {
  return node.depth?.[depth] ?? DEPTH_FALLBACKS[depth];
}

function NodeDetailsPanel({
  node,
  nodes,
  edges,
  onClose,
  onNavigate,
}: {
  node: MasterNode;
  nodes: MasterNode[];
  edges: MasterRoadmapData["edges"];
  onClose: () => void;
  onNavigate: (nodeId: string) => void;
}) {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const prerequisites = edges.filter(e => e.to === node.id).map(e => nodeMap.get(e.from)).filter(Boolean) as MasterNode[];
  const unlocks = edges.filter(e => e.from === node.id).map(e => nodeMap.get(e.to)).filter(Boolean) as MasterNode[];
  const project = node.projects.find(p => p.depthLevel === "working") ?? node.projects[0];

  return (
    <aside className="mr-panel">
      <div className="mr-panel-head">
        <div>
          <div className="mr-panel-eyebrow">Master Node</div>
          <h2>{node.title}</h2>
        </div>
        <button onClick={onClose} aria-label="Close node details"><X size={16} /></button>
      </div>
      <p className="mr-panel-blurb">{node.blurb}</p>

      <section>
        <h3>Depth levels</h3>
        <div className="mr-depth-list">
          {DEPTH_LEVELS.map((depth, index) => (
            <div key={depth} className="mr-depth-item">
              <div>
                <strong>{depth}</strong>
                <div className="mr-depth-bar">
                  {[0, 1, 2, 3].map(seg => (
                    <div key={seg} className={`mr-depth-seg${seg <= index ? " filled" : ""}`} />
                  ))}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">{node.hours[index]}h</span>
              </div>
              <p>{depthDescription(node, depth)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>Prerequisites</h3>
        <div className="mr-panel-links">
          {prerequisites.length === 0 && <span>None</span>}
          {prerequisites.map(n => (
            <button key={n.id} onClick={() => onNavigate(n.id)}>{n.title}</button>
          ))}
        </div>
      </section>

      <section>
        <h3>Unlocks</h3>
        <div className="mr-panel-links">
          {unlocks.length === 0 && <span>None</span>}
          {unlocks.map(n => (
            <button key={n.id} onClick={() => onNavigate(n.id)}>{n.title}</button>
          ))}
        </div>
      </section>

      {project && (
        <section>
          <h3>Working-depth project</h3>
          <div className="mr-panel-card">
            <strong>{project.title}</strong>
            <p>{project.description}</p>
            {project.deliverable && <small>{project.deliverable}</small>}
          </div>
        </section>
      )}

      <section>
        <h3>Resources</h3>
        <div className="mr-resource-list">
          {node.resources.map(r => (
            <a key={r.id} href={r.url} target="_blank" rel="noreferrer">
              <span>{r.title}</span>
              <small>{r.depthLevel}{r.estimatedMinutes ? ` · ${r.estimatedMinutes}m` : ""}</small>
            </a>
          ))}
        </div>
      </section>

      <Link href={`/sign-up?from=roadmap&node=${node.id}`} className="mr-panel-cta">
        <Sparkle size={14} /> Personalize this for me <ArrowRight size={14} />
      </Link>
    </aside>
  );
}

interface Props {
  data: MasterRoadmapData;
  svgString: string;
}

export function RoadmapViewer({ data, svgString }: Props) {
  const { nodes, edges } = data;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedNode = useMemo(
    () => nodes.find(n => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  const selectNode = useCallback((id: string | null) => {
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.hash = id ?? "";
    window.history.replaceState(null, "", url);
  }, []);

  // Sync from URL hash on mount. This must run post-mount, not in a useState
  // initializer: the server renders with no selection, so initializing from
  // window.location here (after hydration) is what keeps deep-links working
  // without a hydration mismatch.
  useEffect(() => {
    const hashId = window.location.hash.slice(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: sync selection from URL after hydration
    if (hashId && nodes.some(n => n.id === hashId)) setSelectedId(hashId);
  }, [nodes]);

  // Escape to deselect
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") selectNode(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectNode]);

  // Click delegation — single handler on the scroll container
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as Element;
    // Ignore clicks inside the panel
    if (target.closest(".mr-panel")) return;
    const nodeEl = target.closest("[data-node-id]");
    selectNode(nodeEl?.getAttribute("data-node-id") ?? null);
  }, [selectNode]);

  return (
    <div className="mr-root" style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      {/* Top nav */}
      <nav className="mr-topnav">
        <Link href="/roadmap" className="mr-nav-logo">
          <div className="mr-logo-dot" />
          DeepPath
        </Link>
        <div className="mr-nav-spacer" />
        <Link href="/sign-in" className="mr-signin-link">Sign in</Link>
        <Link href="/sign-up?from=roadmap" className="mr-cta-btn">
          <Sparkle size={13} />
          <span className="mr-cta-btn-label-short">Personalize</span>
          <span className="mr-cta-btn-label-full">Personalize for me</span>
          <ArrowRight size={13} />
        </Link>
      </nav>

      {/* Hero */}
      <div className="mr-hero">
        <h1 className="mr-hero-title">
          The AI engineering roadmap,{" "}
          <span className="highlight">before</span> it knows you.
        </h1>
      </div>

      {/* SVG canvas — scrollable, browser handles zoom/pan */}
      <div
        ref={containerRef}
        className="mr-stage-scroll"
        onClick={handleClick}
      >
        <div
          // Safe: svgString is generated at build time by scripts/generate-roadmap-svg.ts
          // from typed MasterRoadmapData. No user input ever enters this string.
          // If this data source changes to include user content, add DOMPurify here.
          dangerouslySetInnerHTML={{ __html: svgString }}
        />

        {/* Node details panel */}
        {selectedNode && (
          <NodeDetailsPanel
            node={selectedNode}
            nodes={nodes}
            edges={edges}
            onClose={() => selectNode(null)}
            onNavigate={selectNode}
          />
        )}
      </div>
    </div>
  );
}
