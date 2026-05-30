"use client";

import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";

interface TutorSession {
  id: string;
  session_date: string;
  week_topic: string;
  proof_line: string | null;
  github_url: string | null;
  linkedin_published: boolean;
}

function computeStreak(sessions: TutorSession[]): number {
  let streak = 0;
  for (const s of sessions) {
    if (s.linkedin_published) streak++;
    else break;
  }
  return streak;
}

function SessionRow({ session, onPatch }: {
  session: TutorSession;
  onPatch: (id: string, updates: Partial<TutorSession>) => Promise<void>;
}) {
  const [proofLine, setProofLine] = useState(session.proof_line ?? "");
  const [githubUrl, setGithubUrl] = useState(session.github_url ?? "");
  const [published, setPublished] = useState(session.linkedin_published);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function saveField(field: "proof_line" | "github_url" | "linkedin_published", value: string | boolean) {
    setSaveError(null);
    try {
      await onPatch(session.id, { [field]: value });
    } catch {
      setSaveError("Couldn't save — try again");
      if (field === "linkedin_published") setPublished(!value as boolean);
      if (field === "proof_line") setProofLine(session.proof_line ?? "");
      if (field === "github_url") setGithubUrl(session.github_url ?? "");
    }
  }

  const date = new Date(session.session_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={`flex flex-col gap-3 p-4 rounded-lg border transition-colors ${
        published ? "border-l-4 border-l-green-500 border-border bg-green-50/30" : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">{date}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-medium text-foreground truncate">{session.week_topic}</span>
          </div>

          {/* Proof line */}
          <input
            type="text"
            value={proofLine}
            onChange={(e) => setProofLine(e.target.value)}
            onBlur={() => saveField("proof_line", proofLine)}
            placeholder="Add your proof line..."
            className="w-full text-sm bg-transparent border-0 border-b border-dashed border-muted-foreground/40 focus:border-primary focus:outline-none placeholder:text-muted-foreground/60 py-0.5"
          />

          {/* GitHub URL */}
          <input
            type="text"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            onBlur={() => saveField("github_url", githubUrl)}
            placeholder="Add GitHub link..."
            className="w-full text-xs mt-1.5 bg-transparent border-0 border-b border-dashed border-muted-foreground/30 focus:border-primary focus:outline-none placeholder:text-muted-foreground/50 py-0.5 text-blue-600"
          />
        </div>

        <label className="flex items-center gap-1.5 shrink-0 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => {
              const next = e.target.checked;
              setPublished(next);
              saveField("linkedin_published", next);
            }}
            className="h-3.5 w-3.5 rounded accent-green-600"
          />
          <span className="text-xs text-muted-foreground">Posted</span>
        </label>
      </div>

      {saveError && <p className="text-xs text-destructive">{saveError}</p>}
    </div>
  );
}

export default function ProofPage() {
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/proof")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => setFetchError("Couldn't load sessions"))
      .finally(() => setLoading(false));
  }, []);

  const handlePatch = useCallback(async (id: string, updates: Partial<TutorSession>) => {
    const res = await fetch(`/api/proof/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("PATCH failed");
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const streak = computeStreak(sessions);

  return (
    <div>
      <TopBar
        title="Proof Trail"
        subtitle={streak > 0 ? `${streak}-session streak` : undefined}
      />
      <div className="p-6 max-w-2xl">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading sessions...</p>
        )}

        {fetchError && (
          <p className="text-sm text-destructive">{fetchError}</p>
        )}

        {!loading && !fetchError && sessions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No sessions yet. Complete a tutor session to start your proof trail.
          </p>
        )}

        {!loading && sessions.length > 0 && (
          <div className="space-y-3">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} onPatch={handlePatch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
