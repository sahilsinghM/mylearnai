import Link from "next/link";
import { Button } from "@/components/ui/button";

const PHASES = [
  { number: 1, name: "Foundations", nodes: 5 },
  { number: 2, name: "Classical ML", nodes: 5 },
  { number: 3, name: "Deep Learning", nodes: 5 },
  { number: 4, name: "Transformers", nodes: 4 },
  { number: 5, name: "LLMs", nodes: 5 },
  { number: 6, name: "Agents & RAG", nodes: 5 },
  { number: 7, name: "Production", nodes: 4 },
] as const;

export function RoadmapPreviewSection() {
  return (
    <section
      aria-labelledby="roadmap-section-heading"
      className="px-4 pb-20 max-w-5xl mx-auto w-full flex flex-col items-center gap-6"
    >
      <div className="text-center">
        <h2
          id="roadmap-section-heading"
          className="text-xl font-semibold tracking-tight mb-2 text-balance"
        >
          Explore the curriculum
        </h2>
        <p className="text-sm" style={{ color: "oklch(0.68 0 0)" }}>
          33 nodes across 7 phases. Adaptive to your goal and background.
          Public, no login required.
        </p>
      </div>

      {/* Desktop: static SVG preview — loads instantly, no JS, no layout shift */}
      <Link
        href="/roadmap"
        className="relative w-full rounded-xl overflow-hidden border border-border hover:border-primary/30 transition-colors duration-200 group hidden md:block"
        style={{ aspectRatio: "16/9" }}
        aria-label="Explore the AI engineering roadmap"
      >
        <img
          src="/roadmap.svg"
          alt="AI engineering roadmap — 7 phases from Foundations to Production"
          className="w-full h-full object-cover object-top"
          loading="lazy"
          width={1600}
          height={900}
        />
        <div className="absolute inset-0 flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <span className="text-sm font-medium px-4 py-2 rounded-md bg-card border border-border">
            Open full roadmap
          </span>
        </div>
      </Link>

      {/* Mobile: phase list */}
      <div className="w-full md:hidden flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {PHASES.map((phase, i) => (
            <div
              key={phase.number}
              className={`flex items-center justify-between px-5 py-3.5 ${
                i < PHASES.length - 1 ? "border-b border-border/50" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-xs tabular-nums"
                  style={{ color: "oklch(0.55 0.2 264)" }}
                  aria-hidden="true"
                >
                  {String(phase.number).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium">{phase.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {phase.nodes} nodes
              </span>
            </div>
          ))}
        </div>
        <Button asChild variant="outline" size="sm" className="self-center">
          <Link href="/roadmap">Explore the full roadmap</Link>
        </Button>
      </div>
    </section>
  );
}
