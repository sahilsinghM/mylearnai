"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Gap } from "@/types/tutor";
import { track } from "@/lib/analytics";
import { CheckCircle2, ArrowRight, Link2 } from "lucide-react";

interface SessionData {
  id: string;
  gaps: Gap[] | null;
  acceptance_criteria: string[] | null;
  project_title: string | null;
  project_desc: string | null;
  github_url: string | null;
}

interface ProofClientProps {
  sessionId: string;
  initialData?: SessionData | null;
}

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL = 2000;

const SEVERITY_LABEL: Record<string, string> = {
  high: "High priority",
  med: "Worth revisiting",
  low: "Minor gap",
};

const SEVERITY_DOT: Record<string, string> = {
  high: "bg-destructive",
  med: "bg-amber-500",
  low: "bg-muted-foreground",
};

export function ProofClient({ sessionId, initialData }: ProofClientProps) {
  const [session, setSession] = useState<SessionData | null>(initialData ?? null);
  const [loading, setLoading] = useState(initialData === undefined || initialData === null);
  const [attempts, setAttempts] = useState(0);
  const [failed, setFailed] = useState(false);

  const [githubUrl, setGithubUrl] = useState(initialData?.github_url ?? "");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(!!initialData?.github_url);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const poll = useCallback(async (attempt: number) => {
    try {
      const res = await fetch(`/api/proof/session/${sessionId}`);
      if (res.ok) {
        const data: SessionData = await res.json();
        setSession(data);
        if (data.github_url) {
          setGithubUrl(data.github_url);
          setSaved(true);
        }
        setLoading(false);
        return;
      }
      if (res.status === 404) {
        if (attempt < MAX_ATTEMPTS) {
          setAttempts(attempt + 1);
          timeoutRef.current = setTimeout(() => poll(attempt + 1), POLL_INTERVAL);
          return;
        }
        setFailed(true);
        setLoading(false);
        return;
      }
      setFailed(true);
      setLoading(false);
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        setAttempts(attempt + 1);
        timeoutRef.current = setTimeout(() => poll(attempt + 1), POLL_INTERVAL);
      } else {
        setFailed(true);
        setLoading(false);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    if (initialData !== null && initialData !== undefined) return;
    poll(0);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [poll, initialData]);

  const handleRetry = () => {
    setFailed(false);
    setLoading(true);
    setAttempts(0);
    poll(0);
  };

  const handleSubmitGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    setUrlError(null);
    if (!githubUrl.startsWith("https://github.com/")) {
      setUrlError("Must start with https://github.com/");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/proof/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github_url: githubUrl }),
      });
      if (res.ok) {
        setSaved(true);
        track("proof_project_submitted", { sessionId });
      } else {
        setUrlError("Failed to save. Try again.");
      }
    } catch {
      setUrlError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Session complete" />
        <div className="p-4 sm:p-6 max-w-2xl space-y-4">
          <p className="text-sm text-muted-foreground animate-pulse">
            Writing your proof artifact…
          </p>
          <div className="h-1 w-32 bg-primary/30 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (failed || !session) {
    return (
      <div>
        <TopBar title="Session complete" />
        <div className="p-4 sm:p-6 max-w-2xl space-y-4">
          <p className="text-sm text-muted-foreground">
            Your proof artifact isn&apos;t ready yet. Give it a moment and try again.
          </p>
          <Button variant="secondary" onClick={handleRetry}>
            Try again
          </Button>
          <div className="pt-2">
            <Link href="/tutor" className="text-sm text-muted-foreground underline underline-offset-2">
              Start another session
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const gaps: Gap[] = session.gaps ?? [];

  return (
    <div>
      <TopBar title="Session complete" />
      <div className="p-4 sm:p-6 max-w-2xl space-y-8">

        {/* Completion header */}
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            {session.project_title ? (
              <>
                <h2 className="text-xl font-semibold leading-snug">{session.project_title}</h2>
                {session.project_desc && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{session.project_desc}</p>
                )}
              </>
            ) : (
              <h2 className="text-xl font-semibold">Session closed.</h2>
            )}
          </div>
        </div>

        {/* Project spec */}
        {session.acceptance_criteria && session.acceptance_criteria.length > 0 && (
          <section className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border bg-card-2">
              <p className="text-xs font-mono text-muted-foreground">Project spec · Acceptance criteria</p>
            </div>
            <ol className="divide-y divide-border">
              {session.acceptance_criteria.map((criterion, i) => (
                <li key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className="font-mono text-xs text-primary/60 shrink-0 mt-0.5 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-relaxed">{criterion}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Gap analysis */}
        {gaps.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              What to work on next
            </p>
            <ul className="space-y-2.5">
              {gaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${SEVERITY_DOT[gap.severity] ?? "bg-muted-foreground"}`} />
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium leading-snug">{gap.concept}</p>
                    {gap.evidence && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{gap.evidence}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60">{SEVERITY_LABEL[gap.severity] ?? gap.severity}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* GitHub URL */}
        <section className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Link your proof
          </p>
          {saved ? (
            <div className="flex items-center gap-3">
              <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground underline underline-offset-2 truncate"
              >
                {githubUrl}
              </a>
              <button
                onClick={() => setSaved(false)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                Edit
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitGithub} className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Build the project and push it to GitHub. Paste the repo URL here to attach it to this session.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="github-url" className="sr-only">GitHub repository URL</Label>
                <Input
                  id="github-url"
                  type="url"
                  placeholder="https://github.com/you/your-project"
                  value={githubUrl}
                  onChange={(e) => {
                    setGithubUrl(e.target.value);
                    setUrlError(null);
                  }}
                  className={urlError ? "border-destructive" : ""}
                />
                {urlError && (
                  <p className="text-xs text-destructive">{urlError}</p>
                )}
              </div>
              <Button type="submit" disabled={saving || !githubUrl} variant="outline">
                {saving ? "Saving…" : "Link repo"}
              </Button>
            </form>
          )}
        </section>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/tutor">
              Start another session
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
          <Link href="/dashboard" className="text-sm text-center sm:text-left text-muted-foreground hover:text-foreground transition-colors py-2 sm:py-0">
            Back to dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
