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
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">
            Adaptive AI learning for engineers
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Stop drifting.<br />
            <span className="text-primary">Know what to learn next.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            DeepPath builds a personalized 7-day AI learning plan, adapts based on your progress, and turns it into shipped projects.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/sign-up">Get started — it&apos;s free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm pt-4">
          {[
            { label: "Adaptive planning", desc: "7-day plan that updates based on what actually happened" },
            { label: "Project-first", desc: "Every week ends in a shipped artifact, not passive notes" },
            { label: "Foundations first", desc: "Vectors and embeddings before agents and hype" },
          ].map((item) => (
            <div key={item.label} className="space-y-1 p-4 rounded-lg border border-border">
              <div className="font-medium">{item.label}</div>
              <div className="text-muted-foreground text-xs">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
