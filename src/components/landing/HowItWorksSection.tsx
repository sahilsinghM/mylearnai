const STEPS = [
  {
    number: "01",
    title: "You get grilled on your current topic",
    description:
      "A Socratic session on this week's AI/ML subject. Claude asks questions; it does not give answers. The session ends when you say you're done.",
  },
  {
    number: "02",
    title: "Claude extracts the exact gaps",
    description:
      "When the session closes, the transcript is analyzed. The concepts you fumbled are identified precisely, not generically.",
  },
  {
    number: "03",
    title: "Proof lands in your history",
    description:
      "A GitHub-ready project spec with verifiable acceptance criteria. A LinkedIn post draft citing the gap you closed. Both tied to the specific concept.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      aria-labelledby="loop-heading"
      className="px-4 pb-20 max-w-5xl mx-auto w-full"
    >
      <div className="mb-12 text-center">
        <h2
          id="loop-heading"
          className="text-xl font-semibold tracking-tight"
        >
          The loop
        </h2>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 list-none p-0 m-0">
        {STEPS.map((step, i) => (
          <li
            key={step.number}
            className="flex flex-col gap-4 animate-dp-rise"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span
              className="font-mono text-[2rem] font-bold leading-none tabular-nums"
              style={{ color: "oklch(0.55 0.2 264)" }}
              aria-hidden="true"
            >
              {step.number}
            </span>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold leading-snug">{step.title}</h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "oklch(0.68 0 0)" }}
              >
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
