"use client";

import { useState, useCallback } from "react";
import { Layers, Check, Zap, BookOpen, Hammer, RefreshCw, Pencil, Clock, ExternalLink, SkipForward } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PlanDay, Task, TaskStatus } from "@/types/plan";

interface Props {
  days: PlanDay[];
  narrative?: string;
  difficulty: string;
  weekNumber: number;
  todayDayNumber: number;
  dayHooks: Record<number, string>;
  dayWhys: Record<string, string>;
}

// ---------- Progress ring ----------
function ProgressRing({ daysDone, total, tasksDone, tasksTotal }: {
  daysDone: number; total: number; tasksDone: number; tasksTotal: number;
}) {
  const r = 40;
  const c = 2 * Math.PI * r;
  const frac = total ? daysDone / total : 0;
  return (
    <div className="flex flex-col items-center gap-2 shrink-0">
      <div className="relative w-[92px] h-[92px]">
        <svg width="92" height="92" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="46" cy="46" r={r} fill="none" strokeWidth="7" stroke="var(--border)" />
          <circle
            cx="46" cy="46" r={r} fill="none" strokeWidth="7"
            stroke="var(--primary)" strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - frac)}
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.2,0.7,0.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[22px] font-semibold leading-none">{daysDone}</span>
          <span className="text-[10px] text-[--muted-foreground] mt-0.5 whitespace-nowrap">of {total} days</span>
        </div>
      </div>
      <span className="text-[11px] text-[--muted-foreground] font-mono tracking-[0.04em] whitespace-nowrap">
        {tasksDone}/{tasksTotal} tasks
      </span>
    </div>
  );
}

// ---------- Task card ----------
const TYPE_META: Record<string, { icon: React.ReactNode; colorClass: string }> = {
  study: { icon: <BookOpen size={11} />, colorClass: "text-[oklch(0.72_0.12_250)] bg-[color-mix(in_oklab,oklch(0.72_0.12_250)_15%,transparent)]" },
  build: { icon: <Hammer size={11} />, colorClass: "text-[oklch(0.72_0.15_300)] bg-[color-mix(in_oklab,oklch(0.72_0.15_300)_15%,transparent)]" },
  exercise: { icon: <Pencil size={11} />, colorClass: "text-[--amber] bg-[color-mix(in_oklab,var(--amber)_15%,transparent)]" },
  review: { icon: <RefreshCw size={11} />, colorClass: "text-[--muted-foreground] bg-[--muted]" },
};

const DIFF_CLASS: Record<string, string> = {
  easy: "text-[--emerald] bg-[color-mix(in_oklab,var(--emerald)_13%,transparent)]",
  medium: "text-[--amber] bg-[color-mix(in_oklab,var(--amber)_14%,transparent)]",
  hard: "text-destructive bg-[color-mix(in_oklab,var(--destructive)_15%,transparent)]",
};

function TaskCard({ task, status, why, onSet }: {
  task: Task; status: TaskStatus; why?: string;
  onSet: (id: string, s: TaskStatus) => void;
}) {
  const done = status === "completed";
  const skipped = status === "skipped";
  const typeMeta = TYPE_META[task.type] ?? TYPE_META.study;

  return (
    <div className={`flex gap-3 p-[14px_15px] border rounded-[11px] bg-[--card-2] transition-[border-color,opacity] duration-150 group
      ${done || skipped ? "opacity-55 hover:opacity-80" : "hover:border-[color-mix(in_oklab,var(--primary)_35%,var(--border))]"}`}>

      {/* Checkbox — one-directional: pending → completed only (no undo via API) */}
      <button
        onClick={() => { if (!done && !skipped) onSet(task.id, "completed"); }}
        disabled={done || skipped}
        title={done ? "Completed" : skipped ? "Skipped" : "Mark complete"}
        className={`w-[22px] h-[22px] rounded-[7px] border-[1.5px] shrink-0 mt-0.5 flex items-center justify-center transition-all duration-150
          ${done ? "bg-[--emerald] border-[--emerald] text-[--background] cursor-default"
          : skipped ? "bg-[--muted] border-[--border] text-[--muted-foreground] cursor-default"
          : "cursor-pointer bg-[--background] border-[--border] text-transparent hover:border-[--emerald]"}`}
      >
        <Check size={13} strokeWidth={3} />
      </button>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-mono text-[10px] tracking-[0.04em] px-[7px] py-[2px] rounded-[5px] inline-flex items-center gap-[5px] font-medium ${typeMeta.colorClass}`}>
            {typeMeta.icon}{task.type}
          </span>
          <span className={`font-mono text-[10.5px] tracking-[0.03em] px-[7px] py-[2px] rounded-[5px] ${DIFF_CLASS[task.difficulty] ?? DIFF_CLASS.medium}`}>
            {task.difficulty}
          </span>
          {task.durationMin && (
            <span className="inline-flex items-center gap-1 text-[11.5px] text-[--muted-foreground]">
              <Clock size={12} />{task.durationMin}m
            </span>
          )}
          {done && <span className="font-mono text-[9.5px] tracking-[0.05em] uppercase text-[--emerald] ml-1">done</span>}
          {skipped && <span className="font-mono text-[9.5px] tracking-[0.05em] uppercase text-[--muted-foreground] ml-1">skipped</span>}
        </div>

        <p className={`text-[14px] font-medium mt-[9px] leading-[1.4] ${done ? "line-through decoration-[color-mix(in_oklab,var(--muted-foreground)_60%,transparent)]" : ""}`}>
          {task.title}
        </p>

        {task.description && (
          <p className="text-[12.5px] text-[--muted-foreground] leading-[1.55] mt-[6px]">{task.description}</p>
        )}

        {why && (
          <p className="text-[12px] text-[oklch(0.62_0_0)] italic leading-[1.5] mt-[9px] pl-[11px] border-l-2 border-[color-mix(in_oklab,var(--primary)_30%,var(--border))]">
            {why}
          </p>
        )}

        {task.resourceUrl && (
          <a
            href={task.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-[5px] text-[12px] text-primary mt-[10px] hover:underline"
          >
            <ExternalLink size={12} />Resource
          </a>
        )}
      </div>

      {/* Action button */}
      <div className={`flex flex-col gap-1 shrink-0 self-start transition-opacity duration-150 ${done || skipped ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
        {status === "pending" && (
          <button
            onClick={() => onSet(task.id, "skipped")}
            title="Skip"
            className="w-[28px] h-[28px] rounded-[7px] border border-[--border] bg-transparent text-[--muted-foreground] flex items-center justify-center transition-all duration-150 hover:text-foreground hover:border-[color-mix(in_oklab,var(--primary)_45%,var(--border))]"
          >
            <SkipForward size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Day detail ----------
function DayDetail({ day, statusMap, todayDayNumber, hook, dayWhys, onSet }: {
  day: PlanDay; statusMap: Record<string, TaskStatus>; todayDayNumber: number;
  hook?: string; dayWhys: Record<string, string>;
  onSet: (id: string, s: TaskStatus) => void;
}) {
  const resolved = day.tasks.filter((t) => (statusMap[t.id] ?? t.status) !== "pending").length;
  const totalMin = day.tasks.reduce((s, t) => s + (t.durationMin ?? 0), 0);
  const pct = day.tasks.length ? Math.round((resolved / day.tasks.length) * 100) : 0;

  const liveStatus = (() => {
    const states = day.tasks.map((t) => statusMap[t.id] ?? t.status);
    const resolvedCount = states.filter((s) => s !== "pending").length;
    if (resolvedCount === states.length && states.length > 0) return "completed";
    if (resolvedCount > 0 || day.dayNumber === todayDayNumber) return "in_progress";
    return "pending";
  })();

  const statusLabel = { completed: "Done", in_progress: "In progress", pending: "Upcoming" }[liveStatus];
  const statusClass = {
    completed: "text-[--emerald] bg-[color-mix(in_oklab,var(--emerald)_15%,transparent)]",
    in_progress: "text-[--amber] bg-[color-mix(in_oklab,var(--amber)_16%,transparent)]",
    pending: "text-[--muted-foreground] bg-[--muted]",
  }[liveStatus];

  const dateLabel = new Date(day.dateOn + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  return (
    <div className="border border-[--border] rounded-[14px] bg-[--card] overflow-hidden animate-dp-rise">
      {/* Header */}
      <div className="px-[22px] pt-5 pb-[18px] border-b border-[--border]" style={{ background: "linear-gradient(180deg, var(--card-2), var(--card))" }}>
        <div className="flex items-center gap-[10px]">
          <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-[--muted-foreground] whitespace-nowrap">
            Day {day.dayNumber} · {dateLabel}
          </span>
          <span className={`font-mono text-[9.5px] tracking-[0.06em] uppercase font-semibold px-[8px] py-[3px] rounded-[5px] whitespace-nowrap ${statusClass}`}>
            {statusLabel}
          </span>
          <div className="ml-auto text-right shrink-0 whitespace-nowrap">
            <div className="font-mono text-[13px]">{resolved}/{day.tasks.length} tasks</div>
            <div className="text-[11px] text-[--muted-foreground] mt-0.5">{totalMin} min total</div>
          </div>
        </div>
        <h2 className="text-[21px] font-semibold mt-[11px] leading-[1.25]" style={{ letterSpacing: "-0.015em" }}>
          {day.theme}
        </h2>
      </div>

      {/* Hook */}
      {hook && (
        <div className="flex gap-[9px] items-start px-[22px] py-[13px] text-primary border-b"
          style={{ background: "color-mix(in oklab, var(--primary) 6%, transparent)", borderColor: "color-mix(in oklab, var(--primary) 14%, transparent)" }}>
          <Zap size={14} className="shrink-0 mt-0.5" />
          <p className="text-[12.5px] leading-[1.5] m-0">{hook}</p>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1 bg-[--muted] rounded-full overflow-hidden mx-[22px] mt-[14px] mb-[6px]">
        <div className="h-full bg-primary rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
          style={{ width: `${pct}%` }} />
      </div>

      {/* Summary */}
      {day.summary && (
        <p className="text-[13px] text-[--muted-foreground] leading-[1.6] px-[22px] pt-[16px] pb-1" style={{ textWrap: "pretty" }}>
          {day.summary}
        </p>
      )}

      {/* Tasks */}
      <div className="px-[18px] pt-3 pb-5 flex flex-col gap-[10px]">
        {day.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            status={statusMap[task.id] ?? task.status}
            why={dayWhys[`${day.dayNumber}-${task.position}`]}
            onSet={onSet}
          />
        ))}
      </div>
    </div>
  );
}

// ---------- Vertical spine ----------
function Spine({ days, statusMap, todayDayNumber, selected, onSelect }: {
  days: PlanDay[]; statusMap: Record<string, TaskStatus>;
  todayDayNumber: number; selected: number; onSelect: (n: number) => void;
}) {
  return (
    <div className="flex flex-col">
      {days.map((day, i) => {
        const states = day.tasks.map((t) => statusMap[t.id] ?? t.status);
        const resolvedCount = states.filter((s) => s !== "pending").length;
        const liveStatus = (() => {
          if (resolvedCount === states.length && states.length > 0) return "completed";
          if (resolvedCount > 0 || day.dayNumber === todayDayNumber) return "in_progress";
          return "pending";
        })();
        const isToday = day.dayNumber === todayDayNumber && liveStatus !== "completed";
        const isSelected = day.dayNumber === selected;

        return (
          <button
            key={day.dayNumber}
            onClick={() => onSelect(day.dayNumber)}
            className="relative flex gap-[14px] p-[4px_4px_4px_0] text-left bg-transparent border-0 cursor-pointer group"
          >
            {/* Rail */}
            <div className="relative flex flex-col items-center shrink-0 w-8">
              <div className={`w-[30px] h-[30px] rounded-full border-2 flex items-center justify-center font-mono text-[12px] font-semibold z-10 transition-all duration-150
                ${liveStatus === "completed" ? "bg-[--emerald] border-[--emerald] text-[--background]"
                : isToday ? "bg-primary border-primary text-primary-foreground"
                : "bg-[--background] border-[--border] text-[--muted-foreground]"}
                ${isSelected ? "shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_16%,transparent)]" : ""}
                ${isToday && !isSelected ? "shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_18%,transparent)]" : ""}`}>
                {liveStatus === "completed" ? <Check size={15} strokeWidth={3} /> : day.dayNumber}
              </div>
              {i < days.length - 1 && (
                <div className={`w-0.5 flex-1 mt-0.5 min-h-[26px] ${liveStatus === "completed" ? "bg-[color-mix(in_oklab,var(--emerald)_55%,var(--border))]" : "bg-[--border]"}`} />
              )}
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0 pt-[3px] pb-[18px] pr-[10px] relative">
              {isSelected && (
                <div className="absolute left-[-8px] top-0 bottom-[14px] w-0.5 rounded-sm bg-primary" />
              )}
              <div className="font-mono text-[10px] tracking-[0.06em] uppercase text-[--muted-foreground] flex gap-[7px] items-center">
                <span>Day {day.dayNumber}</span>
                <span className="w-[3px] h-[3px] rounded-full bg-[--muted-foreground] inline-block" />
                <span>{new Date(day.dateOn + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
              <div className={`text-[13.5px] font-medium mt-[3px] leading-[1.35] transition-colors duration-150
                ${isSelected || isToday ? "text-primary" : liveStatus === "pending" ? "text-[--muted-foreground]" : "text-foreground"}
                group-hover:text-primary`}>
                {day.theme}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex gap-[2px] items-center">
                  {day.tasks.map((t, k) => (
                    <span key={k} className={`w-1 h-1 rounded-full inline-block ${(statusMap[t.id] ?? t.status) !== "pending" ? "bg-[--emerald]" : "bg-[--border]"}`} />
                  ))}
                </span>
                <span className="text-[11.5px] text-[--muted-foreground]">{resolvedCount}/{day.tasks.length} tasks</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Main PlanView ----------
export function PlanView({ days, narrative, difficulty, weekNumber, todayDayNumber, dayHooks, dayWhys }: Props) {
  const { toast } = useToast();

  // Build initial status map from DB state
  const [statusMap, setStatusMap] = useState<Record<string, TaskStatus>>(() => {
    const m: Record<string, TaskStatus> = {};
    for (const day of days) for (const task of day.tasks) m[task.id] = task.status;
    return m;
  });

  const [selectedDayN, setSelectedDayN] = useState(todayDayNumber);

  const allTasks = days.flatMap((d) => d.tasks);
  const daysDone = days.filter((d) => {
    const states = d.tasks.map((t) => statusMap[t.id] ?? t.status);
    return states.length > 0 && states.every((s) => s !== "pending");
  }).length;
  const tasksDone = allTasks.filter((t) => (statusMap[t.id] ?? t.status) === "completed").length;

  const handleSet = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    const prev = statusMap[taskId];
    setStatusMap((m) => ({ ...m, [taskId]: newStatus }));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: newStatus }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.dayCompleted) toast({ title: "Day complete!", description: "All tasks done. Keep building." });
    } catch {
      setStatusMap((m) => ({ ...m, [taskId]: prev }));
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  }, [statusMap, toast]);

  const selectedDay = days.find((d) => d.dayNumber === selectedDayN) ?? days[0];

  return (
    <>
      {/* Hero */}
      <div className="flex gap-7 items-center justify-between pb-6 border-b border-[--border] mb-6">
        <div className="min-w-0">
          <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary flex items-center gap-2 whitespace-nowrap">
            <Layers size={13} />YOUR LEARNING PATH
          </div>
          {narrative && (
            <p className="text-[16.5px] leading-[1.62] font-[450] mt-3 mb-4 max-w-[660px]" style={{ letterSpacing: "-0.005em", textWrap: "pretty" }}>
              {narrative}
            </p>
          )}
          <div className="flex items-center gap-[10px] flex-wrap">
            <span className="font-mono text-[11px] capitalize tracking-[0.02em] px-[10px] py-1 rounded-[6px] text-primary whitespace-nowrap border"
              style={{ background: "color-mix(in oklab, var(--primary) 13%, transparent)", borderColor: "color-mix(in oklab, var(--primary) 28%, transparent)" }}>
              {difficulty} pace
            </span>
            <span className="w-[3px] h-[3px] rounded-full bg-[--muted-foreground] inline-block" />
            <span className="text-[12.5px] text-[--muted-foreground]">{daysDone}/{days.length} days complete</span>
            <span className="w-[3px] h-[3px] rounded-full bg-[--muted-foreground] inline-block" />
            <span className="text-[12.5px] text-[--muted-foreground]">{tasksDone}/{allTasks.length} tasks done</span>
          </div>
        </div>
        <ProgressRing daysDone={daysDone} total={days.length} tasksDone={tasksDone} tasksTotal={allTasks.length} />
      </div>

      {/* Main grid */}
      <div className="grid gap-[26px] items-start" style={{ gridTemplateColumns: "296px 1fr" }}>
        {/* Spine */}
        <Spine
          days={days}
          statusMap={statusMap}
          todayDayNumber={todayDayNumber}
          selected={selectedDayN}
          onSelect={setSelectedDayN}
        />

        {/* Day detail */}
        {selectedDay && (
          <DayDetail
            key={selectedDay.id}
            day={selectedDay}
            statusMap={statusMap}
            todayDayNumber={todayDayNumber}
            hook={dayHooks[selectedDay.dayNumber]}
            dayWhys={dayWhys}
            onSet={handleSet}
          />
        )}
      </div>
    </>
  );
}
