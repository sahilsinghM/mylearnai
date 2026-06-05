const STEPS = [
  {
    number: "01",
    title: "Pick what you're working on",
    description:
      "Your roadmap tells you where you are. Pick the concept you're on — or type any AI/ML topic you want to tackle today.",
  },
  {
    number: "02",
    title: "Defend what you know",
    description:
      "A Socratic session: Claude asks, you explain. When you can't, that's the gap. The session ends when you're done.",
  },
  {
    number: "03",
    title: "Leave with something real",
    description:
      "A GitHub-ready project spec. A LinkedIn post draft citing the specific gap you closed. Both tied to what actually happened in your session.",
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
