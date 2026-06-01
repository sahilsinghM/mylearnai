"use client";

import { useState } from "react";
import type { AdaptationLogAction, AdaptationLogEntry } from "@/lib/roadmap/adaptationLog";
import { formatTriggeringSignals } from "@/lib/roadmap/adaptationLog";

export function AdaptationLogTimeline({ initialEntries }: { initialEntries: AdaptationLogEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function applyAction(id: string, action: AdaptationLogAction) {
    setLoadingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/roadmap/adaptation-log/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error();
      setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, status: action } : entry));
    } catch {
      setError("Couldn't update your roadmap. Try again.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section id="adaptation-log" className="space-y-3">
      <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Adaptation Log</h2>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {entries.length === 0 && <p className="text-sm text-muted-foreground">No roadmap adaptations yet.</p>}
      <div className="space-y-3">
        {entries.map((entry) => {
          const actionable = entry.decisionType === "INSERT" && entry.status === "pending";
          return (
            <article key={entry.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-primary/10 px-2 py-0.5 font-mono text-primary">{entry.decisionType}</span>
                <strong>{entry.affectedNodeTitle}</strong>
                <span className="text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</span>
                <span className="ml-auto rounded bg-muted px-2 py-0.5 capitalize text-muted-foreground">{entry.status.replace("_", " ")}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{entry.reasoning}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatTriggeringSignals(entry.triggeringSignals)}</p>
              {actionable && (
                <div className="mt-3 flex gap-2">
                  <button disabled={loadingId === entry.id} onClick={() => applyAction(entry.id, "accepted")} className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">
                    Accept
                  </button>
                  <button disabled={loadingId === entry.id} onClick={() => applyAction(entry.id, "overridden")} className="rounded border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50">
                    Dismiss
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
