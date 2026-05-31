"use client";

import React, { useMemo } from "react";
import type { MasterNode, MasterEdge, Phase } from "@/lib/roadmap/types";

const NODE_W = 210;
const NODE_H = 86;
const COL_W = 240;
const ROW_H = 118;
const TOP_PAD = 80;
const LEFT_PAD = 28;

const PHASE_HUES: Record<number, number> = {
  1: 220, 2: 155, 3: 264, 4: 305, 5: 340, 6: 50, 7: 25,
};

function phaseColor(hue: number) {
  return `oklch(0.72 0.14 ${hue})`;
}

function nodeX(phase: number) {
  return LEFT_PAD + (phase - 1) * COL_W;
}

function nodeY(row: number) {
  return TOP_PAD + row * ROW_H;
}

interface NodeWithPos extends MasterNode {
  x: number;
  y: number;
}

interface ViewState {
  x: number;
  y: number;
  scale: number;
}

interface RoadmapCanvasProps {
  phases: Phase[];
  nodes: MasterNode[];
  edges: MasterEdge[];
  viewState: ViewState;
  canvasWidth: number;
  canvasHeight: number;
  onNodeClick: (nodeId: string) => void;
}

export function RoadmapCanvas({
  phases,
  nodes,
  edges,
  viewState,
  canvasWidth,
  canvasHeight,
  onNodeClick,
}: RoadmapCanvasProps) {
  const nodesWithPos = useMemo(() =>
    nodes.map((n) => ({ ...n, x: nodeX(n.phase), y: nodeY(n.row) })),
    [nodes]
  );
  const nodeMap = useMemo(() =>
    new Map(nodesWithPos.map((n) => [n.id, n])),
    [nodesWithPos]
  );

  const transform = `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`;

  return (
    <div
      className="mr-canvas"
      style={{
        transform,
        width: canvasWidth,
        height: canvasHeight,
      }}
    >
      {/* Phase columns */}
      {phases.map((phase) => {
        const hue = PHASE_HUES[phase.n] ?? phase.hue;
        const color = phaseColor(hue);
        const left = LEFT_PAD + (phase.n - 1) * COL_W - 8;
        return (
          <div
            key={phase.n}
            className="mr-phase-col"
            style={{
              left,
              width: NODE_W + 16,
              height: canvasHeight,
              ["--phase" as string]: color,
            }}
          >
            <div
              className="col-tint"
              style={{
                background: `color-mix(in oklab, var(--phase) 5%, transparent)`,
                border: `1px dashed color-mix(in oklab, var(--phase) 22%, transparent)`,
              }}
            />
            <div className="mr-phase-head">
              <span className="phase-n">P{phase.n}</span>
              <span className="phase-name" style={{ color: `var(--phase)` }}>
                {phase.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* SVG edges — rendered before nodes */}
      <svg
        className="mr-edges"
        width={canvasWidth}
        height={canvasHeight}
      >
        <defs>
          <marker
            id="mr-arrow"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L6,3 z" fill="var(--border)" />
          </marker>
        </defs>
        {edges.map((edge, i) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;

          const x1 = from.x + NODE_W;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x;
          const y2 = to.y + NODE_H / 2;
          const dx = Math.max(40, (x2 - x1) * 0.5);
          const d = `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;

          const isRecommended = edge.type === "recommended";
          return (
            <path
              key={i}
              d={d}
              className={isRecommended ? "recommended" : "required"}
              stroke="var(--border)"
              strokeWidth={1.5}
              fill="none"
              strokeDasharray={isRecommended ? "4 4" : undefined}
            />
          );
        })}
      </svg>

      {/* Node cards */}
      {nodesWithPos.map((node) => {
        const hue = PHASE_HUES[node.phase] ?? 220;
        const color = phaseColor(hue);
        const phaseLabel = phases.find((p) => p.n === node.phase)?.label ?? `P${node.phase}`;
        const hoursWorking = node.hours[1];
        const depthOpacities = [1.0, 0.75, 0.5, 0.3];

        return (
          <div
            key={node.id}
            className="mr-node"
            style={{
              left: node.x,
              top: node.y,
              ["--phase" as string]: color,
            } as React.CSSProperties}
            onClick={() => onNodeClick(node.id)}
          >
            <div className="node-head">
              <div className="node-phase-dot" />
              <span className="node-phase-label">{phaseLabel}</span>
            </div>
            <p className="node-title">{node.title}</p>
            <div className="node-foot">
              <div className="depth-bar">
                {depthOpacities.map((opacity, i) => (
                  <div
                    key={i}
                    className="depth-bar-segment"
                    style={{ opacity }}
                  />
                ))}
              </div>
              <span className="node-hours">{hoursWorking}h · working</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { nodeX, nodeY, NODE_W, NODE_H, COL_W, ROW_H, TOP_PAD, LEFT_PAD };
