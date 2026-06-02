import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="flex flex-col items-center text-center px-4 pt-20 pb-16 gap-8 w-full animate-dp-rev-up"
    >
      <h1
        id="hero-heading"
        className="text-balance text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl leading-[1.1]"
      >
        Build proof that frontier AI labs can verify.
      </h1>
      <p
        className="text-lg max-w-xl leading-relaxed"
        style={{ color: "oklch(0.78 0 0)" }}
      >
        Every Socratic session closes with a GitHub-ready project spec and a
        LinkedIn post draft. After 20 sessions, you have 20 concrete, citable
        proofs of frontier AI knowledge.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg">
          <Link href="/sign-up">Start building your proof trail</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/roadmap">Explore the roadmap</Link>
        </Button>
      </div>
    </section>
  );
}
