import { describe, it, expect } from "vitest";
import { generateRoadmapSvg } from "../generateRoadmapSvg";
import type { MasterRoadmapData } from "../types";
import { makeGraph } from "./helpers";

function makeData(overrides: Partial<MasterRoadmapData> = {}): MasterRoadmapData {
  const graph = makeGraph(
    [
      { id: "python-basics", phase: 1, row: 0, title: "Python Basics", hours: [4, 24, 48, 96] },
      { id: "linear-algebra", phase: 1, row: 1, title: "Linear Algebra", hours: [4, 20, 40, 80] },
      { id: "classical-ml", phase: 2, row: 0, title: "Classical ML", hours: [8, 40, 80, 160] },
    ],
    [
      { from: "python-basics", to: "classical-ml", type: "required" },
      { from: "linear-algebra", to: "classical-ml", type: "recommended" },
    ],
  );
  return {
    phases: [
      { n: 1, label: "Foundations", hue: 220, blurb: "Math + Python" },
      { n: 2, label: "Classical ML", hue: 155, blurb: "Tabular, trees" },
    ],
    nodes: graph.nodes,
    edges: graph.edges,
    ...overrides,
  };
}

describe("generateRoadmapSvg", () => {
  it("returns an SVG element with a viewBox", () => {
    const svg = generateRoadmapSvg(makeData());
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('viewBox="');
    expect(svg).toContain("</svg>");
  });

  it("includes a data-node-id for every node", () => {
    const data = makeData();
    const svg = generateRoadmapSvg(data);
    for (const node of data.nodes) {
      expect(svg).toContain(`data-node-id="${node.id}"`);
    }
  });

  it("renders a milestone per phase", () => {
    const data = makeData();
    const svg = generateRoadmapSvg(data);
    for (const phase of data.phases) {
      expect(svg).toContain(`data-phase="${phase.n}"`);
    }
  });

  it("uses design-system colors (phase hues + card surface), not roadmap.sh yellow", () => {
    const svg = generateRoadmapSvg(makeData());
    expect(svg).toContain("oklch(");        // design tokens, not hex yellow
    expect(svg).not.toContain("#fdff00");
    expect(svg).not.toContain("#ffe599");
    expect(svg).toContain("oklch(0.19 0 0)"); // --card subtopic surface
  });

  it("draws a structural center spine", () => {
    const svg = generateRoadmapSvg(makeData());
    expect(svg).toContain('class="mr-spine"');
  });

  it("connects subtopics with dotted branch curves", () => {
    const svg = generateRoadmapSvg(makeData());
    expect(svg).toContain('class="mr-branch"');
    const branches = svg.match(/class="mr-branch"[^/]*/g) ?? [];
    expect(branches.length).toBeGreaterThan(0);
    for (const branch of branches) {
      expect(branch).toContain("stroke-dasharray");
    }
  });

  it("is flat at rest — no drop-shadow filter baked into the SVG", () => {
    const svg = generateRoadmapSvg(makeData());
    expect(svg).not.toContain("feDropShadow");
    expect(svg).not.toContain("filter=");
  });

  it("ends with a 'next step' CTA linking to sign-up", () => {
    const svg = generateRoadmapSvg(makeData());
    expect(svg).toContain('class="mr-ending"');
    expect(svg).toContain('href="/sign-up?from=roadmap"');
    expect(svg).toContain("NEXT STEP");
  });

  it("lays out vertically — height grows as nodes are added", () => {
    const small = makeData();
    const big = makeData({
      nodes: [
        ...makeData().nodes,
        ...makeData().nodes.map((n, i) => ({ ...n, id: `${n.id}-extra-${i}`, row: n.row + 10 })),
      ],
    });
    const heightOf = (svg: string) => parseInt(svg.match(/height="(\d+)"/)![1], 10);
    expect(heightOf(generateRoadmapSvg(big))).toBeGreaterThan(heightOf(generateRoadmapSvg(small)));
  });
});
