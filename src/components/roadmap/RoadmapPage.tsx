"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Sparkle, ArrowRight, Plus, Minus, Maximize2, X } from "lucide-react";
import type { MasterRoadmapData } from "@/lib/roadmap/types";
import { RoadmapCanvas, nodeX, nodeY, NODE_W, NODE_H, COL_W, ROW_H, TOP_PAD, LEFT_PAD } from "./RoadmapCanvas";
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

export function RoadmapPage({ data }: Props) {
  const { phases, nodes, edges } = data;

  // Compute canvas dimensions
  const maxPhase = Math.max(...nodes.map((n) => n.phase), 1);
  const maxRow = Math.max(...nodes.map((n) => n.row), 0);
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

  const stageRef = useRef<HTMLDivElement>(null);

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

  // Pan handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest(".mr-node") || target.closest(".mr-controls") || target.closest(".mr-legend") || target.closest(".mr-banner")) return;
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, vx: view.x, vy: view.y };
  }, [view.x, view.y]);

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

  const handleNodeClick = useCallback((_nodeId: string) => {
    // no-op for now — interactions in Task 2
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden" }}>
      {/* Top Nav */}
      <nav className="mr-topnav">
        <a href="/roadmap" className="mr-nav-logo">
          <div className="mr-logo-dot" />
          DeepPath
        </a>
        <a href="/roadmap" className="mr-nav-link">Roadmap</a>
        <a href="#how-it-works" className="mr-nav-link">How it works</a>
        <a href="#compare" className="mr-nav-link">Compare</a>
        <div className="mr-nav-spacer" />
        <a href="/sign-in" className="mr-signin-link">Sign in</a>
        <button className="mr-cta-btn">
          <Sparkle size={13} />
          Personalize for me
          <ArrowRight size={13} />
        </button>
      </nav>

      {/* Hero */}
      <div className="mr-hero">
        <div className="mr-hero-left">
          <span className="mr-eyebrow">The Master Roadmap</span>
          <h1 className="mr-hero-title">
            The AI engineering roadmap,{" "}
            <span className="highlight">before</span> it knows you.
          </h1>
        </div>
        <div className="mr-hero-stats">
          <div className="mr-stat">
            <span className="mr-stat-num">{nodes.length}</span>
            <span className="mr-stat-label">Nodes</span>
          </div>
          <div className="mr-stat">
            <span className="mr-stat-num">{phases.length}</span>
            <span className="mr-stat-label">Phases</span>
          </div>
          <div className="mr-stat">
            <span className="mr-stat-num">{edgeCount}</span>
            <span className="mr-stat-label">Deps</span>
          </div>
          <div className="mr-stat">
            <span className="mr-stat-num">{totalHoursWorking}</span>
            <span className="mr-stat-label">To Working</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mr-toolbar" />

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
          onNodeClick={handleNodeClick}
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
            <button className="mr-banner-primary-btn">
              <Sparkle size={13} />
              Personalize
            </button>
            <button
              className="mr-banner-close-btn"
              onClick={() => setBannerOpen(false)}
              aria-label="Close"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
