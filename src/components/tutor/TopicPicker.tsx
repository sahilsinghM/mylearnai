"use client";

import { useState } from "react";
import { TutorChat } from "./TutorChat";
import type { PlanDay } from "@/lib/tutor/context";

interface Props {
  defaultTopic: string;
  weekNumber: number;
  days: PlanDay[];
  sessionCount: number;
}

const STATUS_LABEL: Record<string, string> = {
  completed: "Done",
  in_progress: "In progress",
  pending: "",
  skipped: "Skipped",
  failed: "Failed",
};

export function TopicPicker({ defaultTopic, weekNumber, days, sessionCount }: Props) {
  const [selectedTopic, setSelectedTopic] = useState(defaultTopic);
  const [started, setStarted] = useState(false);

  if (started) {
    return <TutorChat weekTopic={selectedTopic} weekNumber={weekNumber} />;
  }

  return (
    <div className="p-6 max-w-xl space-y-5">
      <div>
        <p className="text-sm font-medium text-foreground mb-1">Choose a topic to study</p>
        <p className="text-xs text-muted-foreground">
          {sessionCount === 0
            ? "Pick any day from your plan — the tutor will grill you on it."
            : "Suggested: your active day. Pick any you want to revisit."}
        </p>
      </div>

      <div className="space-y-1.5">
        {days.map((day) => {
          const isSelected = selectedTopic === day.theme;
          const label = STATUS_LABEL[day.status] ?? "";
          return (
            <button
              key={day.dayNumber}
              onClick={() => setSelectedTopic(day.theme)}
              className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex-1 min-w-0 truncate">
                  <span className="text-xs text-muted-foreground mr-2">Day {day.dayNumber}</span>
                  {day.theme}
                </span>
                {label && (
                  <span className={`text-xs shrink-0 ${day.status === "completed" ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setStarted(true)}
        className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Start session
      </button>
    </div>
  );
}
