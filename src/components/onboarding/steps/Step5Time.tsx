"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const options = [
  { value: 1, label: "~1 hour/day", desc: "Tight schedule — we'll keep tasks focused and short" },
  { value: 2, label: "~2 hours/day", desc: "Good pace for steady, consistent progress" },
  { value: 3, label: "~3 hours/day", desc: "Solid commitment — you can go deeper each day" },
  { value: 4, label: "4–5 hours/day", desc: "Intensive mode — expect meaningful daily output" },
  { value: 5, label: "5+ hours/day", desc: "Full-time focus — maximum acceleration" },
];

interface Props {
  value: number | undefined;
  onChange: (v: number) => void;
}

export function Step5Time({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">How much time can you commit daily?</h2>
        <p className="text-sm text-muted-foreground mt-1">Be realistic — we size tasks to your actual availability.</p>
      </div>
      <RadioGroup
        value={value?.toString()}
        onValueChange={(v) => onChange(Number(v))}
        className="space-y-2"
      >
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex items-start gap-3 p-4 rounded-lg border border-border cursor-pointer hover:border-primary/50 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
          >
            <RadioGroupItem value={opt.value.toString()} className="mt-0.5" />
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
