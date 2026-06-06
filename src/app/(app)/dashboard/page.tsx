import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";

const PHASE_NAMES: Record<number, string> = {
  1: "Foundations",
  2: "Deep Learning",
  3: "Modern Architectures",
  4: "Training at Scale",
  5: "Alignment & Safety",
  6: "Applied Systems",
  7: "Frontier Research",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [
    { data: roadmap },
    { count: completedCount },
    { count: sessionCount },
    { data: recentSessions },
  ] = await Promise.all([
    supabase
      .from("user_roadmaps")
      .select("active_node_id")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_node_states")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("state", "completed"),
    supabase
      .from("tutor_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("tutor_sessions")
      .select("id, created_at, project_title, project_desc")
      .eq("user_id", user.id)
      .not("project_title", "is", null)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  let activeNode: { title: string; blurb: string; phase: number } | null = null;
  if (roadmap?.active_node_id) {
    const { data: node } = await supabase
      .from("master_roadmap_nodes")
      .select("title, blurb, phase")
      .eq("id", roadmap.active_node_id)
      .maybeSingle();
    activeNode = node;
  }

  const totalNodes = 33;
  const done = completedCount ?? 0;
  const sessions = sessionCount ?? 0;
  const phaseName = activeNode ? (PHASE_NAMES[activeNode.phase] ?? `Phase ${activeNode.phase}`) : null;

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-4 sm:p-6 max-w-2xl space-y-6">

        {/* Active node card */}
        {activeNode ? (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-card-2 flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-mono">
                {phaseName} · Node {done + 1} of {totalNodes}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {done} completed
              </span>
            </div>
            <div className="px-4 sm:px-5 py-4 sm:py-5 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">You&apos;re working on</p>
                <h2 className="text-xl font-semibold tracking-tight leading-snug">{activeNode.title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{activeNode.blurb}</p>
              <div className="pt-1">
                <Button asChild>
                  <Link href="/tutor">
                    Start a session
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card px-4 sm:px-5 py-4 sm:py-5 space-y-3">
            <h2 className="text-base font-semibold">Ready to start?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You don&apos;t have an active node yet. Head to the tutor and pick your first topic.
            </p>
            <Button asChild>
              <Link href="/tutor">
                Pick your first topic
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-card px-4 py-4">
            <p className="text-2xl font-bold tabular-nums">{sessions}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {sessions === 1 ? "session" : "sessions"} completed
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-4">
            <p className="text-2xl font-bold tabular-nums">{done}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {done === 1 ? "node" : "nodes"} mastered
            </p>
          </div>
        </div>

        {/* Recent sessions */}
        {recentSessions && recentSessions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recent sessions
            </p>
            <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
              {recentSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/proof/${s.id}`}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-accent/40 transition-colors group"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-foreground">{s.project_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground mt-0.5 shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {sessions === 0 && (
          <div className="rounded-lg border border-dashed border-border px-5 py-6 flex flex-col items-center gap-2 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">No sessions yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Your first session will show up here. Each one leaves a proof artifact — a GitHub spec and a LinkedIn post draft.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/tutor">Start your first session</Link>
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
