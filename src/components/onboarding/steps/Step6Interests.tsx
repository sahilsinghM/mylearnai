"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { InterestArea } from "@/types/onboarding";

const options: { value: InterestArea; label: string; desc: string }[] = [
  { value: "nlp", label: "NLP / LLMs", desc: "Text, language models, transformers, RAG" },
  { value: "embeddings", label: "Embeddings / Search", desc: "Vector databases, semantic search, retrieval" },
  { value: "cv", label: "Computer Vision", desc: "Image classification, object detection, diffusion" },
  { value: "agents", label: "AI Agents", desc: "Agentic systems, tool use, multi-step reasoning" },
  { value: "mlops", label: "MLOps", desc: "Model serving, monitoring, pipelines, deployment" },
  { value: "rl", label: "Reinforcement Learning", desc: "Reward modeling, RLHF, game environments" },
];

interface Props {
  value: InterestArea[];
  onChange: (v: InterestArea[]) => void;
}

export function Step6Interests({ value, onChange }: Props) {
  function toggle(area: InterestArea) {
    if (value.includes(area)) {
      onChange(value.filter((a) => a !== area));
    } else {
      onChange([...value, area]);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">What areas interest you most?</h2>
        <p className="text-sm text-muted-foreground mt-1">Select at least one. Your plan will emphasize these.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-start gap-3 p-4 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors"
            style={{ borderColor: value.includes(opt.value) ? "var(--primary)" : undefined, background: value.includes(opt.value) ? "color-mix(in oklch, var(--primary) 5%, transparent)" : undefined }}
          >
            <Checkbox
              checked={value.includes(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
              className="mt-0.5"
            />
            <div>
              <div className="font-medium text-sm">{opt.label}</div>
              <div className="text-xs text-muted-foreground">{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
