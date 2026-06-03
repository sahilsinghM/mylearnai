"use client";

import { useState } from "react";
import type { AdaptationLogAction, AdaptationLogEntry } from "@/lib/roadmap/adaptationLog";
import { formatTriggeringSignals } from "@/lib/roadmap/adaptationLog";

const OP_STYLES: Record<string, string> = {
  INSERT: "bg-[color-mix(in_oklab,var(--emerald)_14%,transparent)] text-emerald",
  REMOVE: "bg-[color-mix(in_oklab,var(--destructive)_14%,transparent)] text-destructive",
  MOVE:   "bg-[color-mix(in_oklab,var(--amber)_14%,transparent)] text-amber",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

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
      setEntries((current) =>
        current.map((entry) => (entry.id === id ? { ...entry, status: action } : entry))
      );
    } catch {
      setError("Couldn't update your roadmap. Try again.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <section id="adaptation-log" className="space-y-3">
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {/* Header */}
        <div className="bg-card-2 px-4 py-2.5 border-b border-border flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-muted-foreground">
            adaptation log
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            append-only · {entries.length} event{entries.length !== 1 ? "s" : ""}
          </span>
        </div>

        {entries.length === 0 ? (
          <p className="px-4 py-5 text-sm text-muted-foreground">
            Nothing here yet. The agent adapts your roadmap when signals appear.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {entries.map((entry) => {
              const actionable = entry.decisionType === "INSERT" && entry.status === "pending";
              const opStyle = OP_STYLES[entry.decisionType] ?? OP_STYLES.INSERT;

              return (
                <article key={entry.id} className="flex items-start gap-3 px-4 py-3 animate-dp-rise">
                  {/* Op badge */}
                  <span className={`shrink-0 mt-0.5 font-mono text-[10px] tracking-[0.06em] uppercase font-semibold px-2 py-0.5 rounded ${opStyle}`}>
                    {entry.decisionType}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm font-medium leading-snug">
                      <code className="font-mono text-[12px] text-fg-2">{entry.affectedNodeTitle}</code>
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{entry.reasoning}</p>
                    <p className="text-[11px] text-muted-foreground/70">
                      {formatTriggeringSignals(entry.triggeringSignals)}
                    </p>
                    {actionable && (
                      <div className="flex gap-2 pt-1">
                        <button
                          disabled={loadingId === entry.id}
                          onClick={() => applyAction(entry.id, "accepted")}
                          className="h-7 px-3 rounded bg-primary text-xs font-medium text-primary-foreground disabled:opacity-50 transition-opacity"
                        >
                          Accept
                        </button>
                        <button
                          disabled={loadingId === entry.id}
                          onClick={() => applyAction(entry.id, "overridden")}
                          className="h-7 px-3 rounded border border-border text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground mt-0.5">
                    {formatTime(entry.createdAt)}
                  </span>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
