"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Goal } from "@/types/onboarding";

const options: { value: Goal; label: string; desc: string }[] = [
  { value: "get_a_job", label: "Get a job in AI/ML", desc: "Land a role as an ML engineer or AI product engineer" },
  { value: "build_product", label: "Build an AI product", desc: "Ship something real that uses AI meaningfully" },
  { value: "research", label: "Do research", desc: "Contribute to open source or pursue graduate-level work" },
  { value: "curiosity", label: "Pure curiosity", desc: "I just want to understand how this stuff actually works" },
];

interface Props {
  value: Goal[];
  onChange: (v: Goal[]) => void;
}

export function Step4Goals({ value, onChange }: Props) {
  function toggle(goal: Goal) {
    if (value.includes(goal)) {
      onChange(value.filter((g) => g !== goal));
    } else {
      onChange([...value, goal]);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">What&apos;s driving you?</h2>
        <p className="text-sm text-muted-foreground mt-1">Select all that apply — priorities shape what gets emphasized.</p>
      </div>
      <div className="space-y-2">
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
