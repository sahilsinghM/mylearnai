"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  weekNumber: number;
}

export function WeekCompleteBar({ weekNumber }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateNextWeek() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/plan/adapt", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate next week");
      }
      router.push("/plan");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 px-5 py-4 flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">Week {weekNumber} complete</p>
        <p className="text-xs text-muted-foreground">
          Claude will adapt the next 7 days based on your task signals.
        </p>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <button
        onClick={generateNextWeek}
        disabled={loading}
        className="shrink-0 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
      >
        {loading ? "Generating…" : `Start Week ${weekNumber + 1}`}
      </button>
    </div>
  );
}
