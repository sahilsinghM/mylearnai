import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProofArtifactPreview } from "@/components/landing/ProofArtifactPreview";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        <Link
          href="/"
          className="flex items-center gap-2 font-mono font-bold text-sm"
        >
          <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
          DeepPath
        </Link>
        <nav className="flex items-center gap-2" aria-label="Site navigation">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center">
        <HeroSection />

        <div
          className="w-full max-w-5xl mx-auto px-4"
          aria-hidden="true"
        >
          <div className="border-t border-border/30" />
        </div>

        <ProofArtifactPreview />

        <div
          className="w-full max-w-5xl mx-auto px-4"
          aria-hidden="true"
        >
          <div className="border-t border-border/30" />
        </div>

        <HowItWorksSection />

      </main>
    </div>
  );
}
