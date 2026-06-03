# Product

## Register

product

## Users

Self-taught engineers — developers who've never done ML formally and are trying to build a clear, opinionated path through AI/ML. They are already comfortable with code; the gap is curriculum, not execution. They use DeepPath during focused study sessions, not casually. Their context: motivated, time-constrained, skeptical of fluff, want to ship something real at the end of each week.

## Product Purpose

DeepPath builds and adapts a personalized AI/ML curriculum for engineers. A 33-node master roadmap covers seven phases from Foundations to Production. Each user gets a filtered, reordered projection based on their goal and background. A Claude-powered agent adapts the roadmap over time as the user learns — inserting review nodes when comprehension gaps appear, skipping nodes when mastery is already demonstrated. Each week resolves to a 7-day plan grounded in curated resources and shipped projects.

Success: the user completes their Active Node's weekly plan, submits a project, and arrives at the next node with clear momentum — not just content consumed, but capability gained.

## Brand Personality

Calm, trustworthy, progressive. Patient guidance for serious learners. Confidence without urgency. The product knows where you are and where you're going — that clarity is the core emotional promise.

## References

Brilliant (learning-native structure, clean dark UI, progress that feels earned rather than gamified) and Linear / Vercel dashboards (tight, expert-respecting tool aesthetic). The through-line: serious about outcomes, no decorative noise.

## Anti-references

- **Gamified EdTech** (Duolingo-style bright colors, streaks, cartoon rewards, patronizing tone): the palette and the voice are both wrong for this audience
- **Generic SaaS landing** (hero metrics, gradient text, "supercharge your workflow" copy): surface without substance
- **Bootcamp course platforms** (Udemy/Coursera heavy TOC nav, badge-first design): feels like a checklist, not a curriculum
- **LLM chat wrappers** (ChatGPT sidebar-thread aesthetic): DeepPath is a structured learning system, not a free-form assistant

## Design Principles

1. **Clarity earns trust.** The user's path — where they are, what's next, why — should always be readable at a glance. Ambiguity is the product's worst enemy.
2. **Progress is structural, not decorative.** Show advancement through layout and information hierarchy, not badges or animations. The roadmap *is* the progress indicator.
3. **Expert-register throughout.** Write and design as if talking to a peer engineer who will call out condescension. No softening language, no tutorial-voice copy.
4. **Tool-native over course-native.** DeepPath behaves like a developer tool that happens to teach, not a course platform that happens to have good UX.
5. **Calm momentum.** Motion and transitions should feel like forward progress, not performance. The product is the guide; it does not compete for attention.

## Accessibility & Inclusion

WCAG AA minimum. Dark-only theme — verify contrast at every text role (body at 4.5:1, large/bold at 3:1, muted at 4.5:1). Reduced-motion support is in place (`dp-*` animations are transform-only; add `@media (prefers-reduced-motion)` overrides where not already present). No color-only status indicators — use label + color for node states.
