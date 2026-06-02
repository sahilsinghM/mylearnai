import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export interface ProofArtifact {
  topic: string;
  proofLine: string;
  linkedInDraft: string;
  projectSpec: {
    title: string;
    acceptanceCriteria: string[];
  };
}

const MOCK_PROOF: ProofArtifact = {
  topic: "Transformer Self-Attention",
  proofLine:
    "Implemented scaled dot-product attention from scratch. Output matches torch.nn.functional.scaled_dot_product_attention within 1e-5 on randomized QKV tensors of shape (2, 8, 64, 64). Ablation confirms gradient norm collapse when √d_k scaling is removed.",
  linkedInDraft: `I ran a Socratic session on transformer self-attention this morning.

The gap that surfaced: I understood the QKV projection intuitively but couldn't explain why we scale by √d_k before the softmax. Without it, dot products in high dimensions push softmax into near-zero gradient regions, and now I can prove it with a 6-line ablation.

Here's the project that forced me to verify it:`,
  projectSpec: {
    title: "Scaled Dot-Product Attention from Scratch",
    acceptanceCriteria: [
      "Output matches torch.nn.functional.scaled_dot_product_attention within 1e-5 tolerance on randomized QKV tensors of shape (2, 8, 64, 64)",
      "Ablation: remove √d_k scaling factor, measure and document gradient norm collapse on a 256-dim input across 100 forward passes",
    ],
  },
};

interface Props {
  artifact?: ProofArtifact;
  blur?: boolean;
}

const MASK = {
  maskImage: "linear-gradient(to bottom, black 52%, transparent 100%)",
  WebkitMaskImage: "linear-gradient(to bottom, black 52%, transparent 100%)",
};

export function ProofArtifactPreview({ artifact = MOCK_PROOF, blur = true }: Props) {
  return (
    <section
      aria-labelledby="proof-section-heading"
      className="px-4 pb-16 max-w-5xl mx-auto w-full"
    >
      <div className="mb-8 text-center">
        <h2
          id="proof-section-heading"
          className="text-xl font-semibold tracking-tight mb-2"
        >
          What a session actually produces
        </h2>
        <p className="text-sm max-w-sm mx-auto" style={{ color: "oklch(0.68 0 0)" }}>
          A specimen from a real session close. Every session ends with these
          three artifacts.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden animate-dp-pop">
        {/* Session header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              session/
            </span>
            <span className="font-mono text-xs font-medium">{artifact.topic}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-md border border-emerald-800/40 bg-emerald-900/30 text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Session closed
          </span>
        </div>

        {/* Proof line — hook-strip pattern */}
        <div className="px-5 py-4 bg-primary/5 border-b border-primary/10">
          <p className="text-xs font-medium text-primary mb-1.5">Proof line</p>
          <p className="font-mono text-sm leading-relaxed break-words">{artifact.proofLine}</p>
        </div>

        {/* Two-panel: LinkedIn draft + Project spec */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* LinkedIn draft */}
          <div className="overflow-hidden">
            <div className="px-5 pt-4 pb-2.5 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground">
                LinkedIn post draft
              </p>
            </div>
            <div
              className="px-5 pt-4 pb-12 min-h-[200px]"
              style={blur ? MASK : undefined}
            >
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {artifact.linkedInDraft}
              </p>
            </div>
          </div>

          {/* Project spec */}
          <div className="overflow-hidden">
            <div className="px-5 pt-4 pb-2.5 border-b border-border/50">
              <p className="text-xs font-medium text-muted-foreground">
                GitHub project spec
              </p>
            </div>
            <div
              className="px-5 pt-4 pb-12 min-h-[200px]"
              style={blur ? MASK : undefined}
            >
              <p className="text-sm font-semibold mb-4 leading-snug">
                {artifact.projectSpec.title}
              </p>
              <p className="text-xs text-muted-foreground font-medium mb-3">
                Acceptance criteria
              </p>
              <ol className="space-y-3 list-none">
                {artifact.projectSpec.acceptanceCriteria.map((criterion, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      className="font-mono text-xs shrink-0 mt-0.5"
                      style={{ color: "oklch(0.55 0.2 264)" }}
                      aria-hidden="true"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{ color: "oklch(0.82 0 0)" }}>{criterion}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {blur && (
          <div className="px-5 py-3.5 border-t border-border bg-card-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Sign in to build your own proof trail
            </p>
            <Link
              href="/sign-up"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Start for free
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
