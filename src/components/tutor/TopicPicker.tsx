"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { TutorChat } from "./TutorChat";
import type { PlanDay } from "@/lib/tutor/context";
import { canStartSession, type Level } from "@/lib/tutor/presession";
import type { ActiveNodeResource } from "@/lib/tutor/getActiveNodeContext";

interface Props {
  defaultTopic: string;
  weekNumber: number;
  days: PlanDay[];
  sessionCount: number;
  activeNodeTitle?: string;
  activeNodeResources?: ActiveNodeResource[];
  // When set, the topic is locked to a specific roadmap node (node-seeded
  // session) — the day list / free-text picker is replaced by a fixed header.
  lockedNode?: { title: string; resources: ActiveNodeResource[] };
}

const STATUS_LABEL: Record<string, string> = {
  completed: "Done",
  in_progress: "In progress",
  pending: "",
  skipped: "Skipped",
  failed: "Failed",
};

const LEVELS: { value: Level; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "some",     label: "Some experience" },
  { value: "fluent",   label: "Comfortable" },
];

export function TopicPicker({ defaultTopic, weekNumber, days, sessionCount, activeNodeTitle, activeNodeResources, lockedNode }: Props) {
  const [selectedTopic, setSelectedTopic] = useState(defaultTopic);
  const [selectedLevel, setSelectedLevel] = useState<Level>("");
  const [started, setStarted] = useState(false);

  const selectedDay = days.find((d) => d.theme === selectedTopic);
  const resources = lockedNode ? lockedNode.resources : (selectedDay?.resources ?? []);

  if (started) {
    return (
      <TutorChat
        weekTopic={selectedTopic}
        weekNumber={weekNumber}
        activeNodeTitle={activeNodeTitle}
        resources={activeNodeResources}
      />
    );
  }

  const noPlan = days.length === 0;
  const ready = canStartSession({ topic: selectedTopic, level: selectedLevel });

  function start() {
    if (ready) setStarted(true);
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl space-y-6">

      {/* Primary: topic */}
      <div className="space-y-2">
        <p className="text-[15px] font-semibold text-foreground tracking-tight">
          What do you want to learn?
        </p>
        {lockedNode ? (
          <div className="w-full px-4 py-3 rounded-lg border border-primary bg-primary/5 text-foreground text-sm">
            <span className="text-xs text-muted-foreground mr-2">Roadmap node</span>
            {lockedNode.title}
          </div>
        ) : noPlan ? (
          <input
            type="text"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") start(); }}
            placeholder="e.g. Gradient descent, Transformers, Backpropagation…"
            className="w-full bg-background border border-input text-foreground rounded-lg px-4 py-2.5 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_18%,transparent)]"
            autoFocus
          />
        ) : (
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
        )}
      </div>

      {/* Prep resources */}
      {resources.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Before you start</p>
          <div className="space-y-1.5">
            {resources.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{r.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Secondary: level */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          What&apos;s your experience level?
        </p>
        <div className="flex flex-wrap gap-2">
          {LEVELS.map(({ value, label }) => {
            const active = selectedLevel === value;
            return (
              <button
                key={value}
                onClick={() => setSelectedLevel(active ? "" : value)}
                className={`min-h-[44px] px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-foreground border-input hover:border-primary/50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={start}
        disabled={!ready}
        className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-45"
      >
        Start session
      </button>
    </div>
  );
}
