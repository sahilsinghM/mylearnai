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

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="flex flex-col items-center text-center px-4 pt-16 pb-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">
            Adaptive AI learning for engineers
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl max-w-2xl">
            Stop drifting.<br />
            <span className="text-primary">Know what to learn next.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            DeepPath builds a personalized 7-day AI learning plan, adapts based on your progress, and turns it into shipped projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/sign-up">Get started — it&apos;s free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/roadmap">Explore the roadmap</Link>
            </Button>
          </div>
        </section>

        {/* Roadmap preview */}
        <section className="flex-1 flex flex-col items-center px-4 pb-12 gap-4">
          <p className="text-xs text-muted-foreground tracking-wide uppercase">
            33 nodes · 7 phases · explore before you commit
          </p>
          <Link
            href="/roadmap"
            className="relative w-full max-w-5xl rounded-xl overflow-hidden border border-border shadow-2xl group"
            style={{ aspectRatio: "16/9" }}
            aria-label="Explore the AI engineering roadmap"
          >
            <iframe
              src="/roadmap"
              className="w-full h-full pointer-events-none"
              tabIndex={-1}
              aria-hidden="true"
            />
            {/* Clickable overlay with hover CTA */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end justify-center pb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-sm font-medium text-white px-4 py-2 rounded-full bg-primary/90">
                Explore the full roadmap →
              </span>
            </div>
          </Link>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>— Adaptive planning</span>
            <span>— Project-first</span>
            <span>— Foundations first</span>
          </div>
        </section>
      </main>
    </div>
  );
}
