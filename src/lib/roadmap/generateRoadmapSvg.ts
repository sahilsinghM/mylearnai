import type { MasterRoadmapData, MasterNode, Phase } from "./types";

/*
 * Vertical trunk-and-fan roadmap, styled in DeepPath's design system.
 *
 * Format (kept from the roadmap.sh study): a center spine runs top→bottom, each
 * phase is a milestone node ON the spine, and the phase's nodes fan out to one
 * alternating side via dotted connectors. The roadmap ends in an explicit
 * "next step" CTA so the path has a destination, not an open end.
 *
 * Styling follows DESIGN.md:
 *   - dark/void canvas; flat surfaces, no shadows at rest (hover lift is in CSS)
 *   - milestones carry their phase hue (--phase-1..7, the one approved place for
 *     colors outside the core palette); subtopics are raised card surfaces with a
 *     phase-hue dot indicator
 *   - the spine and fans are neutral/structural; indigo (the "one signal") is
 *     reserved for the interactive ending CTA only
 *   - Geist Sans for all text (font-family applied via CSS, not here)
 */

// ── design-system tokens (mirrors src/app/globals.css) ──
const CARD = "oklch(0.19 0 0)";              // --card, subtopic surface
const CARD_2 = "oklch(0.235 0 0)";           // --card-2, milestone surface (anchor)
const BORDER = "oklch(0.34 0 0)";
const MILE_STROKE = "oklch(0.45 0 0)";       // brighter neutral border = spine anchor
const SPINE_COLOR = "oklch(0.36 0 0)";
const BRANCH_COLOR = "oklch(0.4 0 0)";       // neutral, structural
const TEXT = "oklch(0.95 0 0)";
const SUB_TEXT = "oklch(0.88 0 0)";
const PRIMARY = "oklch(0.55 0.2 264)";       // indigo — interactive only
const PRIMARY_FG = "oklch(0.98 0 0)";
const EYEBROW = "oklch(0.64 0.19 264)";

// Phase identity is carried ONLY by the small subtopic dot — color stays scarce
// (no tinted boxes, which read as warnings against the dark/indigo system).
const dotColor = (h: number) => `oklch(0.72 0.14 ${h})`;

const STROKE_W = 1.5;
const NODE_RX = 6;
const SPINE_W = 2;
const BRANCH_W = 1.5;
const BRANCH_DASH = "2 5";

// ── layout geometry ──
const CANVAS_W = 1000;
const CENTER_X = 500;
const SPINE_GAP = 120;     // center → inner edge of a subtopic
const SUB_H = 44;
const MILE_H = 48;
const ROW_GAP = 16;
const PHASE_GAP = 70;
const TOP_PAD = 44;
const BOTTOM_PAD = 56;
const ENDING_GAP = 54;     // spine length from last milestone to the CTA
const CTA_H = 52;
const CTA_W = 248;
const CHAR_W = 7.4;        // approx advance at the node font size for Geist Sans
const DOT_PAD = 26;        // left room for the phase dot + gap
const RIGHT_PAD = 16;
const MIN_NODE_W = 104;
const MAX_NODE_W = 288;
const SUB_FONT = 14;
const MILE_FONT = 15;

interface Placed {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

function subWidth(title: string): number {
  return Math.max(MIN_NODE_W, Math.min(MAX_NODE_W, Math.round(title.length * CHAR_W + DOT_PAD + RIGHT_PAD)));
}

function mileWidth(label: string): number {
  return Math.max(MIN_NODE_W, Math.min(MAX_NODE_W, Math.round(label.length * CHAR_W + DOT_PAD + RIGHT_PAD)));
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface Cluster {
  phase: Phase;
  milestone: Placed;
  side: "left" | "right";
  subs: { node: MasterNode; placed: Placed }[];
}

function layout(phases: Phase[], nodes: MasterNode[]): {
  clusters: Cluster[];
  ctaCy: number;
  height: number;
} {
  const clusters: Cluster[] = [];
  const sortedPhases = [...phases].sort((a, b) => a.n - b.n);

  let y = TOP_PAD;
  sortedPhases.forEach((phase, p) => {
    if (p > 0) y += PHASE_GAP;

    const side: "left" | "right" = p % 2 === 0 ? "right" : "left";
    const phaseNodes = nodes.filter(n => n.phase === phase.n).sort((a, b) => a.row - b.row);
    const count = Math.max(1, phaseNodes.length);
    const clusterH = count * SUB_H + (count - 1) * ROW_GAP;
    const clusterTop = y;

    const subs = phaseNodes.map((node, i) => {
      const w = subWidth(node.title);
      const ny = clusterTop + i * (SUB_H + ROW_GAP);
      const x = side === "right" ? CENTER_X + SPINE_GAP : CENTER_X - SPINE_GAP - w;
      const placed: Placed = { x, y: ny, w, h: SUB_H, cx: x + w / 2, cy: ny + SUB_H / 2 };
      return { node, placed };
    });

    const mw = mileWidth(phase.label);
    const milestoneY = clusterTop + clusterH / 2 - MILE_H / 2;
    const milestone: Placed = {
      x: CENTER_X - mw / 2, y: milestoneY, w: mw, h: MILE_H, cx: CENTER_X, cy: milestoneY + MILE_H / 2,
    };

    clusters.push({ phase, milestone, side, subs });
    y = clusterTop + clusterH;
  });

  const ctaCy = y + ENDING_GAP + CTA_H / 2;
  const height = ctaCy + CTA_H / 2 + BOTTOM_PAD;
  return { clusters, ctaCy, height };
}

function renderSpine(clusters: Cluster[], ctaCy: number): string {
  if (clusters.length === 0) return "";
  const firstCy = clusters[0].milestone.cy;
  return `<line class="mr-spine-cap" x1="${CENTER_X}" y1="${TOP_PAD - 8}" x2="${CENTER_X}" y2="${firstCy}"
    stroke="${SPINE_COLOR}" stroke-width="${SPINE_W}" stroke-dasharray="2 7" stroke-linecap="round" />
  <line class="mr-spine" x1="${CENTER_X}" y1="${firstCy}" x2="${CENTER_X}" y2="${ctaCy}"
    stroke="${SPINE_COLOR}" stroke-width="${SPINE_W}" />`;
}

function renderBranch(milestone: Placed, sub: Placed, side: "left" | "right"): string {
  const mx = side === "right" ? milestone.x + milestone.w : milestone.x;
  const my = milestone.cy;
  const sx = side === "right" ? sub.x : sub.x + sub.w;
  const sy = sub.cy;
  const dx = (sx - mx) * 0.5;
  const d = `M${mx},${my} C${mx + dx},${my} ${sx - dx},${sy} ${sx},${sy}`;
  return `<path class="mr-branch" d="${d}" fill="none" stroke="${BRANCH_COLOR}"
    stroke-width="${BRANCH_W}" stroke-dasharray="${BRANCH_DASH}" stroke-linecap="round" />`;
}

function renderMilestone(c: Cluster): string {
  const { x, y, w, h } = c.milestone;
  const hue = c.phase.hue;
  return `<g class="mr-milestone" data-phase="${c.phase.n}">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${NODE_RX}"
    fill="${CARD_2}" stroke="${MILE_STROKE}" stroke-width="${STROKE_W}" />
  <circle cx="${x + 14}" cy="${y + h / 2}" r="3.5" fill="${dotColor(hue)}" />
  <text x="${x + 26}" y="${y + h / 2 + 1}" text-anchor="start" dominant-baseline="central"
    font-size="${MILE_FONT}" font-weight="600" fill="${TEXT}">${escapeXml(c.phase.label)}</text>
</g>`;
}

function renderSubtopic(node: MasterNode, placed: Placed, hue: number): string {
  const { x, y, w, h } = placed;
  return `<g class="node" data-node-id="${node.id}" style="cursor:pointer">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${NODE_RX}"
    fill="${CARD}" stroke="${BORDER}" stroke-width="1" />
  <circle cx="${x + 14}" cy="${y + h / 2}" r="3.5" fill="${dotColor(hue)}" />
  <text x="${x + 26}" y="${y + h / 2 + 1}" text-anchor="start" dominant-baseline="central"
    font-size="${SUB_FONT}" font-weight="500" fill="${SUB_TEXT}">${escapeXml(node.title)}</text>
</g>`;
}

function renderEnding(ctaCy: number): string {
  const x = CENTER_X - CTA_W / 2;
  const y = ctaCy - CTA_H / 2;
  return `<g class="mr-ending">
  <text x="${CENTER_X}" y="${y - 30}" text-anchor="middle" font-size="11" font-weight="600"
    letter-spacing="1.4" fill="${EYEBROW}" class="mr-eyebrow-text">YOUR NEXT STEP</text>
  <text x="${CENTER_X}" y="${y - 12}" text-anchor="middle" font-size="13.5" fill="${SUB_TEXT}">
    This is the path before it knows you. Make it yours.</text>
  <a href="/sign-up?from=roadmap" class="mr-cta-node" aria-label="Personalize this roadmap for me">
    <rect x="${x}" y="${y}" width="${CTA_W}" height="${CTA_H}" rx="8"
      fill="${PRIMARY}" stroke="${PRIMARY}" stroke-width="1" />
    <text x="${CENTER_X}" y="${y + CTA_H / 2 + 1}" text-anchor="middle" dominant-baseline="central"
      font-size="15" font-weight="600" fill="${PRIMARY_FG}">Personalize this for me  →</text>
  </a>
</g>`;
}

export function generateRoadmapSvg(data: MasterRoadmapData): string {
  const { phases, nodes } = data;
  const { clusters, ctaCy, height } = layout(phases, nodes);

  const spine = renderSpine(clusters, ctaCy);
  const branches: string[] = [];
  const milestoneEls: string[] = [];
  const subtopicEls: string[] = [];

  for (const cluster of clusters) {
    const hue = cluster.phase.hue;
    for (const { placed } of cluster.subs) branches.push(renderBranch(cluster.milestone, placed, cluster.side));
    milestoneEls.push(renderMilestone(cluster));
    for (const { node, placed } of cluster.subs) subtopicEls.push(renderSubtopic(node, placed, hue));
  }

  return `<svg class="mr-roadmap-svg" xmlns="http://www.w3.org/2000/svg" width="${CANVAS_W}" height="${height}" viewBox="0 0 ${CANVAS_W} ${height}">
<g class="mr-spine-group">
${spine}
</g>
<g class="mr-branches">
${branches.join("\n")}
</g>
<g class="mr-milestones">
${milestoneEls.join("\n")}
</g>
<g class="nodes">
${subtopicEls.join("\n")}
</g>
${renderEnding(ctaCy)}
</svg>`;
}
