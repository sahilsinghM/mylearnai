import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="flex flex-col items-center text-center px-4 pt-12 pb-10 sm:pt-20 sm:pb-16 gap-5 sm:gap-6 w-full animate-dp-rev-up"
    >
      <p className="text-xs font-mono tracking-widest uppercase" style={{ color: "oklch(0.55 0.2 264)" }}>
        For self-taught engineers
      </p>
      <h1
        id="hero-heading"
        className="text-balance text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl leading-[1.1]"
      >
        You can&apos;t get hired by watching tutorials.
      </h1>
      <p
        className="text-base sm:text-lg max-w-xl leading-relaxed"
        style={{ color: "oklch(0.78 0 0)" }}
      >
        DeepPath puts you in a Socratic session on exactly what you&apos;re working on.
        You explain, defend, and get challenged. When it&apos;s over, you have a
        GitHub-ready spec proving you understood it — not a score, not a certificate.
        A project.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-1">
        <Button asChild size="lg" className="w-full sm:w-auto">
          <Link href="/sign-up">Start with one session</Link>
        </Button>
      </div>
      <p className="text-xs" style={{ color: "oklch(0.48 0 0)" }}>
        Free to start. No credit card.
      </p>
    </section>
  );
}
