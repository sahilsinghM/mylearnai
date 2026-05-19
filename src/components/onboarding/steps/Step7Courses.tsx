"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const SUGGESTIONS = [
  "fast.ai Part 1", "fast.ai Part 2", "CS229 (Stanford)", "CS231n",
  "Deep Learning Specialization (Coursera)", "Hugging Face NLP Course",
  "Full Stack Deep Learning", "MLOps Zoomcamp",
];

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
}

export function Step7Courses({ value, onChange }: Props) {
  const [input, setInput] = useState("");

  function add(course: string) {
    const trimmed = course.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  }

  function remove(course: string) {
    onChange(value.filter((c) => c !== course));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      add(input);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Courses you&apos;ve already completed</h2>
        <p className="text-sm text-muted-foreground mt-1">We&apos;ll skip what you already know. Leave blank if none.</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="e.g. fast.ai Part 1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button type="button" variant="secondary" onClick={() => add(input)} disabled={!input.trim()}>
          Add
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((course) => (
            <span key={course} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">
              {course}
              <button type="button" onClick={() => remove(course)} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.filter((s) => !value.includes(s)).slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="px-2 py-1 rounded-md border border-border text-xs hover:border-primary/50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
