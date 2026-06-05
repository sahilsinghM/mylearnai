"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Gap } from "@/types/tutor";
import { track } from "@/lib/analytics";

interface SessionData {
  id: string;
  gaps: Gap[] | null;
  acceptance_criteria: string[] | null;
  project_title: string | null;
  project_description: string | null;
  github_url: string | null;
}

interface ProofClientProps {
  sessionId: string;
  initialData?: SessionData | null;
}

const MAX_ATTEMPTS = 10;
const POLL_INTERVAL = 2000;

const SEVERITY_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  high: "destructive",
  med: "default",
  low: "secondary",
};

export function ProofClient({ sessionId, initialData }: ProofClientProps) {
  const [session, setSession] = useState<SessionData | null>(initialData ?? null);
  const [loading, setLoading] = useState(initialData === undefined || initialData === null);
  const [attempts, setAttempts] = useState(0);
  const [failed, setFailed] = useState(false);

  const [githubUrl, setGithubUrl] = useState(initialData?.github_url ?? "");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const poll = useCallback(async (attempt: number) => {
    try {
      const res = await fetch(`/api/proof/session/${sessionId}`);
      if (res.ok) {
        const data: SessionData = await res.json();
        setSession(data);
        if (data.github_url) {
          setGithubUrl(data.github_url);
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
        // 404 after max attempts
        setFailed(true);
        setLoading(false);
        return;
      }
      // 401, 500, etc — fail immediately
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
    // Skip polling only when session data is fully ready (non-null initialData).
    // null means "session exists but gaps not yet written" — poll until ready.
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
      setUrlError("URL must start with https://github.com/");
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
        setUrlError("Failed to save. Please try again.");
      }
    } catch {
      setUrlError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Session Proof" />
        <div className="p-6 max-w-2xl space-y-4">
          <p className="text-sm text-muted-foreground">
            Loading your session results… ({attempts}/{MAX_ATTEMPTS})
          </p>
          <div className="h-2 w-48 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (failed || !session) {
    return (
      <div>
        <TopBar title="Session Proof" />
        <div className="p-6 max-w-2xl space-y-4">
          <p className="text-sm text-muted-foreground">
            Session data isn&apos;t ready yet or could not be found.
          </p>
          <Button variant="secondary" onClick={handleRetry}>
            Try again
          </Button>
          <div className="pt-2">
            <Link href="/tutor" className="text-sm text-muted-foreground underline underline-offset-2">
              Run another session
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const capabilityStatement =
    session.acceptance_criteria?.[0] ?? session.project_title ?? "Session complete";

  const gaps: Gap[] = session.gaps ?? [];

  return (
    <div>
      <TopBar title="Session Proof" />
      <div className="p-6 max-w-2xl space-y-8">

        {/* Capability statement */}
        <section className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            You can now
          </p>
          <h2 className="text-xl font-semibold leading-snug">{capabilityStatement}</h2>
        </section>

        {/* Gap analysis */}
        {gaps.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Gap analysis
            </h3>
            <ul className="space-y-3">
              {gaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Badge variant={SEVERITY_VARIANT[gap.severity] ?? "secondary"} className="mt-0.5 capitalize shrink-0">
                    {gap.severity}
                  </Badge>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{gap.concept}</p>
                    {gap.evidence && (
                      <p className="text-xs text-muted-foreground">{gap.evidence}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Project assignment */}
        {session.project_title && (
          <section className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Project assignment
            </h3>
            <div className="rounded-lg border p-4 space-y-3">
              <p className="font-semibold">{session.project_title}</p>
              {session.project_description && (
                <p className="text-sm text-muted-foreground">{session.project_description}</p>
              )}
              {session.acceptance_criteria && session.acceptance_criteria.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acceptance criteria
                  </p>
                  <ul className="space-y-1">
                    {session.acceptance_criteria.map((criterion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground shrink-0" />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* GitHub URL */}
        <section className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Submit your work
          </h3>
          {saved ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-green-600 dark:text-green-400">
                GitHub URL saved:{" "}
                <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  {githubUrl}
                </a>
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSaved(false)}
              >
                Edit
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitGithub} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="github-url">GitHub repository URL</Label>
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
              <Button type="submit" disabled={saving || !githubUrl}>
                {saving ? "Saving…" : "Save GitHub URL"}
              </Button>
            </form>
          )}
        </section>

        {/* Run another session */}
        <div className="pt-2">
          <Link href="/tutor" className="text-sm text-muted-foreground underline underline-offset-2">
            Run another session
          </Link>
        </div>
      </div>
    </div>
  );
}
