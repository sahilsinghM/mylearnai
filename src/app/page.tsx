import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_completed_at) {
      redirect("/dashboard");
    } else {
      redirect("/onboarding");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <Link href="/" className="flex items-center gap-2 font-bold text-sm tracking-tight">
          <span className="w-2 h-2 rounded-full bg-primary" />
          DeepPath
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">
              Adaptive AI learning for engineers
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Stop drifting.<br />
              <span className="text-primary">Know what to learn next.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              DeepPath builds a personalized 7-day AI learning plan, adapts based on your progress, and turns it into shipped projects.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">Get started — it&apos;s free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/roadmap">See the roadmap</Link>
            </Button>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: "Adaptive planning", desc: "7-day plan that updates based on what actually happened" },
              { label: "Project-first", desc: "Every week ends in a shipped artifact, not passive notes" },
              { label: "Foundations first", desc: "Vectors and embeddings before agents and hype" },
            ].map((item) => (
              <div key={item.label} className="flex items-baseline gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-sm text-muted-foreground"> — {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
