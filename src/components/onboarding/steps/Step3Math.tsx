"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { MathConfidence } from "@/types/onboarding";

const options: { value: MathConfidence; label: string; desc: string }[] = [
  { value: "low", label: "Avoiding it", desc: "Math makes me nervous, I prefer intuition over proofs" },
  { value: "medium", label: "Can follow along", desc: "I understand explanations but wouldn't derive it myself" },
  { value: "high", label: "Comfortable", desc: "Linear algebra and calculus are tools I actually use" },
  { value: "phd", label: "Strong foundation", desc: "I'm comfortable reading ML papers with heavy math" },
];

interface Props {
  value: MathConfidence | undefined;
  onChange: (v: MathConfidence) => void;
}

export function Step3Math({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">How&apos;s your math confidence?</h2>
        <p className="text-sm text-muted-foreground mt-1">No judgment — this affects how much theory we include.</p>
      </div>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as MathConfidence)} className="space-y-2">
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
