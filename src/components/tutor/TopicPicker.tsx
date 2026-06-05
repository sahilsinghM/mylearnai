"use client";

import { useState } from "react";
import { ExternalLink, ArrowRight } from "lucide-react";
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
  activeNodeBlurb?: string;
  activeNodeResources?: ActiveNodeResource[];
}

const STATUS_LABEL: Record<string, string> = {
  completed: "Done",
  in_progress: "In progress",
  pending: "",
  skipped: "Skipped",
  failed: "Failed",
};

const LEVELS: { value: Level; label: string; description: string }[] = [
  { value: "beginner",  label: "Just heard of it",   description: "I couldn't explain it to someone else" },
  { value: "some",      label: "Rough idea",          description: "I understand the concept but not the details" },
  { value: "fluent",    label: "Could explain it",    description: "I understand it well enough to teach the basics" },
];

export function TopicPicker({ defaultTopic, weekNumber, days, sessionCount, activeNodeTitle, activeNodeBlurb, activeNodeResources }: Props) {
  const [selectedTopic, setSelectedTopic] = useState(defaultTopic);
  const [selectedLevel, setSelectedLevel] = useState<Level>("");
  const [started, setStarted] = useState(false);

  const selectedDay = days.find((d) => d.theme === selectedTopic);
  const resources = selectedDay?.resources ?? activeNodeResources ?? [];

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
    <div className="p-4 sm:p-6 max-w-xl space-y-7">

      {/* Context header — active node blurb when available */}
      {activeNodeTitle && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border bg-card-2">
            <span className="text-xs text-muted-foreground">
              Your active topic
              {sessionCount > 0 && (
                <span className="ml-2 text-muted-foreground/60">· {sessionCount} session{sessionCount !== 1 ? "s" : ""} completed</span>
              )}
            </span>
          </div>
          <div className="px-4 py-4 space-y-2">
            <p className="text-base font-semibold leading-snug">{activeNodeTitle}</p>
            {activeNodeBlurb && (
              <p className="text-sm text-muted-foreground leading-relaxed">{activeNodeBlurb}</p>
            )}
          </div>
        </div>
      )}

      {/* Topic selection */}
      <div className="space-y-2.5">
        <p className="text-sm font-medium text-foreground">
          {noPlan ? "What do you want to work on today?" : "Which topic are you tackling?"}
        </p>
        {noPlan ? (
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
                      <span className={`text-xs shrink-0 ${day.status === "completed" ? "text-emerald-500" : "text-muted-foreground"}`}>
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
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Resources for this topic
          </p>
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

      {/* Level selector */}
      <div className="space-y-2.5">
        <p className="text-sm font-medium text-foreground">
          How well do you know this right now?
        </p>
        <div className="space-y-2">
          {LEVELS.map(({ value, label, description }) => {
            const active = selectedLevel === value;
            return (
              <button
                key={value}
                onClick={() => setSelectedLevel(active ? "" : value)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  active
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted/40"
                }`}
              >
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground ml-2 text-xs">{description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={start}
        disabled={!ready}
        className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-45"
      >
        Begin session
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
