import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PlanDay } from "@/types/plan";

const STATUS_DOT: Record<PlanDay["status"], string> = {
  pending: "bg-muted-foreground/30",
  in_progress: "bg-yellow-500",
  completed: "bg-emerald-500",
  skipped: "bg-zinc-600",
};

interface Props {
  days: PlanDay[];
  currentDayNumber: number;
}

export function WeekOverview({ days, currentDayNumber }: Props) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const isToday = day.dayNumber === currentDayNumber;
        return (
          <Link
            key={day.id}
            href={`/plan`}
            className={cn(
              "flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-colors",
              isToday
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border/60 hover:bg-accent/50"
            )}
          >
            <span className="text-xs font-mono text-muted-foreground">D{day.dayNumber}</span>
            <div
              className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[day.status])}
              title={day.status}
            />
            <span className="text-[10px] text-muted-foreground text-center leading-tight line-clamp-2 hidden sm:block">
              {day.theme}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
