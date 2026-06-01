"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ProgrammingLevel } from "@/types/onboarding";

const options: { value: ProgrammingLevel; label: string; desc: string }[] = [
  { value: "beginner", label: "Beginner", desc: "< 2 years, still learning the fundamentals" },
  { value: "intermediate", label: "Intermediate", desc: "2–5 years, comfortable shipping features" },
  { value: "senior", label: "Senior", desc: "5+ years, owns systems end-to-end" },
  { value: "staff", label: "Staff+", desc: "Tech lead, architect, or principal level" },
];

interface Props {
  value: ProgrammingLevel | undefined;
  onChange: (v: ProgrammingLevel) => void;
}

export function Step1Background({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">What&apos;s your programming level?</h2>
        <p className="text-sm text-muted-foreground mt-1">Be honest — this determines your starting point.</p>
      </div>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as ProgrammingLevel)} className="space-y-2">
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
