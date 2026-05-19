"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { AimlFamiliarity } from "@/types/onboarding";

const options: { value: AimlFamiliarity; label: string; desc: string }[] = [
  { value: "none", label: "Never touched it", desc: "AI/ML is new territory for me" },
  { value: "heard_of", label: "Used AI tools", desc: "I use ChatGPT, Copilot — but never built anything" },
  { value: "used_tools", label: "Basic implementations", desc: "I've run tutorials, trained simple models" },
  { value: "built_models", label: "Built real models", desc: "I've shipped ML features or fine-tuned models" },
  { value: "researcher", label: "Active researcher", desc: "I read papers and contribute to open source" },
];

interface Props {
  value: AimlFamiliarity | undefined;
  onChange: (v: AimlFamiliarity) => void;
}

export function Step2AiMl({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">How familiar are you with AI/ML?</h2>
        <p className="text-sm text-muted-foreground mt-1">This calibrates where your plan starts.</p>
      </div>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as AimlFamiliarity)} className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-start gap-3 p-4 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
          >
            <RadioGroupItem value={opt.value} className="mt-0.5" />
            <div>
              <div className="font-medium text-sm">{opt.label}</div>
              <div className="text-xs text-muted-foreground">{opt.desc}</div>
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
