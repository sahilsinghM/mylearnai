"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Sparkle, ArrowRight, Plus, Minus, Maximize2, X } from "lucide-react";
import { type DomainFilter } from "@/lib/roadmap/graphInteractions";
import type { DepthLevel, MasterNode, MasterRoadmapData } from "@/lib/roadmap/types";
import { RoadmapCanvas, COL_W, ROW_H, TOP_PAD, LEFT_PAD } from "./RoadmapCanvas";
import "@/app/roadmap/roadmap.css";

interface Props {
  data: MasterRoadmapData;
}

interface ViewState {
  x: number;
  y: number;
  scale: number;
}

function clamp(min: number, val: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

const DOMAIN_FILTERS: { value: DomainFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fintech", label: "Fintech" },
  { value: "research", label: "Research" },
  { value: "mlops", label: "MLOps" },
  { value: "dev_tools", label: "Dev tools" },
  { value: "education_ai", label: "Education" },
];

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
  const nodeMap = new Map(nodes.map((item) => [item.id, item]));
  const prerequisites = edges.filter((edge) => edge.to === node.id).map((edge) => nodeMap.get(edge.from)).filter(Boolean) as MasterNode[];
  const unlocks = edges.filter((edge) => edge.from === node.id).map((edge) => nodeMap.get(edge.to)).filter(Boolean) as MasterNode[];
  const project = node.projects.find((item) => item.depthLevel === "working") ?? node.projects[0];

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
                <span>{node.hours[index]}h</span>
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
          {prerequisites.map((item) => (
            <button key={item.id} onClick={() => onNavigate(item.id)}>{item.title}</button>
          ))}
        </div>
      </section>

      <section>
        <h3>Unlocks</h3>
        <div className="mr-panel-links">
          {unlocks.length === 0 && <span>None</span>}
          {unlocks.map((item) => (
            <button key={item.id} onClick={() => onNavigate(item.id)}>{item.title}</button>
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
          {node.resources.map((resource) => (
            <a key={resource.id} href={resource.url} target="_blank" rel="noreferrer">
              <span>{resource.title}</span>
              <small>{resource.depthLevel}{resource.estimatedMinutes ? ` · ${resource.estimatedMinutes}m` : ""}</small>
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

export function RoadmapPage({ data }: Props) {
  const { phases, nodes, edges } = data;

  // Compute canvas dimensions
  const maxPhase = nodes.reduce((m, n) => Math.max(m, n.phase), 1);
  const maxRow = nodes.reduce((m, n) => Math.max(m, n.row), 0);
  const canvasWidth = LEFT_PAD + maxPhase * COL_W + 40;
  const canvasHeight = TOP_PAD + (maxRow + 1) * ROW_H + 40;

  // Stats
  const totalHoursWorking = nodes.reduce((sum, n) => sum + n.hours[1], 0);
  const edgeCount = edges.length;

  // View state
  const [view, setView] = useState<ViewState>({ x: 40, y: 40, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ mx: number; my: number; vx: number; vy: number } | null>(null);

  const [bannerOpen, setBannerOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedId) ?? null,
    [nodes, selectedId]
  );

  const stageRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; }, [view]);

  useEffect(() => {
    const syncFromUrl = () => {
      const hashId = window.location.hash.slice(1);
      if (nodes.some((node) => node.id === hashId)) setSelectedId(hashId);

      const filter = new URLSearchParams(window.location.search).get("for");
      if (DOMAIN_FILTERS.some((item) => item.value === filter)) {
        setDomainFilter(filter as DomainFilter);
      }
    };
    syncFromUrl();
    window.addEventListener("hashchange", syncFromUrl);
    return () => window.removeEventListener("hashchange", syncFromUrl);
  }, [nodes]);

  const fit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const padding = 56;
    const scaleX = (sw - padding * 2) / canvasWidth;
    const scaleY = (sh - padding * 2) / canvasHeight;
    const newScale = clamp(0.4, Math.min(scaleX, scaleY, 0.95), 2.0);
    const newX = (sw - canvasWidth * newScale) / 2;
    const newY = (sh - canvasHeight * newScale) / 2;
    setView({ x: newX, y: newY, scale: newScale });
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [fit]);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedId(nodeId);
    const url = new URL(window.location.href);
    url.hash = nodeId ?? "";
    window.history.replaceState(null, "", url);
  }, []);

  // Escape key to deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedId) selectNode(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, selectNode]);

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest(".mr-controls") || target.closest(".mr-legend") || target.closest(".mr-banner") || target.closest(".mr-panel")) return;
    if (target.closest(".mr-node")) {
      setDragging(true);
      dragStart.current = { mx: e.clientX, my: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y };
      return;
    }
    // Background click: deselect node, then start pan
    selectNode(null);
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, vx: viewRef.current.x, vy: viewRef.current.y };
  }, [selectNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setView((v) => ({ ...v, x: dragStart.current!.vx + dx, y: dragStart.current!.vy + dy }));
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
    dragStart.current = null;
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if ((e.target as HTMLElement).closest(".mr-panel")) return;
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    setView((old) => {
      const factor = 1 + -e.deltaY * 0.0015;
      const newScale = clamp(0.4, old.scale * factor, 2.0);
      const ratio = newScale / old.scale;
      const newX = cx - (cx - old.x) * ratio;
      const newY = cy - (cy - old.y) * ratio;
      return { x: newX, y: newY, scale: newScale };
    });
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => stage.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const zoomBy = (factor: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const cx = stage.clientWidth / 2;
    const cy = stage.clientHeight / 2;
    setView((old) => {
      const newScale = clamp(0.4, old.scale * factor, 2.0);
      const ratio = newScale / old.scale;
      const newX = cx - (cx - old.x) * ratio;
      const newY = cy - (cy - old.y) * ratio;
      return { x: newX, y: newY, scale: newScale };
    });
  };

  const changeDomainFilter = useCallback((filter: DomainFilter) => {
    setDomainFilter(filter);
    const url = new URL(window.location.href);
    if (filter === "all") url.searchParams.delete("for");
    else url.searchParams.set("for", filter);
    window.history.replaceState(null, "", url);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
      {/* Top Nav */}
      <nav className="mr-topnav">
        <Link href="/roadmap" className="mr-nav-logo">
          <div className="mr-logo-dot" />
          DeepPath
        </Link>
        <div className="mr-nav-spacer" />
        <Link href="/sign-in" className="mr-signin-link">Sign in</Link>
        <Link href="/sign-up?from=roadmap" className="mr-cta-btn">
          <Sparkle size={13} />
          Personalize for me
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

      {/* Stage */}
      <div
        ref={stageRef}
        className="mr-stage"
        data-dragging={dragging ? "true" : undefined}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid backdrop */}
        <div className="mr-grid" />

        {/* Canvas */}
        <RoadmapCanvas
          phases={phases}
          nodes={nodes}
          edges={edges}
          viewState={view}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          selectedId={selectedId}
          hoveredId={hoveredId}
          domainFilter={domainFilter}
          onNodeClick={selectNode}
          onNodeHover={setHoveredId}
        />

        {/* Zoom controls */}
        <div className="mr-controls">
          <span className="mr-zoom-pct">{Math.round(view.scale * 100)}%</span>
          <div className="mr-btn-group">
            <button className="mr-zoom-btn" onClick={() => zoomBy(1.2)} title="Zoom in">
              <Plus size={14} />
            </button>
            <button className="mr-zoom-btn" onClick={() => zoomBy(0.833)} title="Zoom out">
              <Minus size={14} />
            </button>
            <button className="mr-zoom-btn" onClick={fit} title="Fit">
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mr-legend">
          <div className="mr-legend-item">
            <div className="legend-line" />
            Required
          </div>
          <div className="mr-legend-item">
            <div className="legend-line-dashed" />
            Recommended
          </div>
          <div className="mr-legend-item">
            <div className="legend-dot" style={{ background: "var(--emerald)" }} />
            Prereqs
          </div>
          <div className="mr-legend-item">
            <div className="legend-dot" style={{ background: "var(--primary)" }} />
            Unlocks
          </div>
        </div>

        {/* Banner */}
        {bannerOpen && (
          <div className="mr-banner">
            <div className="mr-banner-content">
              <div className="mr-banner-eyebrow">Try it</div>
              <span>
                Click any node to see its four depth levels — or{" "}
                <strong>let the agent pick</strong> for your goal.
              </span>
            </div>
            <Link href="/sign-up?from=roadmap" className="mr-banner-primary-btn">
              <Sparkle size={13} />
              Personalize
            </Link>
            <button
              className="mr-banner-close-btn"
              onClick={() => setBannerOpen(false)}
              aria-label="Close"
            >
              <X size={12} />
            </button>
          </div>
        )}

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
