# PRD: Landing Page Redesign
Date: 2026-06-01 | Branch: claude/deeppath-ai-learning-system-dFrew

---

## Problem Statement

Engineers who discover DeepPath through search or referral land on a page that describes the product as "a personalized 7-day AI learning plan" — generic language that fits any EdTech tool. The page's real differentiator, the proof trail (a GitHub-ready project spec + LinkedIn post draft + proof line generated from a Socratic tutoring session), is invisible. A self-taught engineer who has dropped three courses before arriving here has no way to understand why DeepPath is different. They see one sentence, a graph, and two buttons. They leave.

Additionally, the current page contains multiple banned design anti-patterns from the project's design system: a rounded-full category-descriptor pill above the hero, an uppercase tracked section label, em-dashes in copy and button labels, and marginal body text contrast (approx 4.2:1 against void black). These patterns signal "AI-generated template" to a sophisticated technical audience.

---

## Solution

A full redesign of the landing page that:

1. Reframes the value proposition around the proof trail — the actual differentiator — rather than generic adaptive learning plan language.
2. Shows a concrete mock proof artifact (proof line, LinkedIn post draft, GitHub project spec stub) so visitors can understand what they are working toward before signing up.
3. Explains the three-step mechanism (Socratic session → gap extraction → proof artifact) as a visible sequence.
4. Preserves and improves the Roadmap preview section, which is genuinely distinctive, while fixing its mobile rendering and anti-pattern labels.
5. Removes all banned anti-patterns and brings the page into full compliance with the design system.

---

## User Stories

1. As a mid-level engineer considering frontier AI lab applications, I want to immediately understand that DeepPath produces career-legible evidence (not just content consumption), so that I can decide within 10 seconds whether to sign up.
2. As a visitor who has tried and dropped other AI courses, I want to see a concrete example of what I will have after a session, so that I can trust this is different from Coursera or a ChatGPT wrapper.
3. As a first-time visitor, I want to read the hero headline and understand who this is for and what it does, so that I do not have to infer from vague copy.
4. As a first-time visitor, I want to see a real proof artifact (proof line, LinkedIn post, project spec), so that the output of using the product is tangible before I commit.
5. As a first-time visitor, I want to understand the three-step loop (session, gaps, proof), so that I know what the product actually does rather than what it claims.
6. As a visitor who is not ready to sign up, I want to explore the roadmap before committing, so that I can evaluate the curriculum depth independently.
7. As a mobile visitor, I want a landing page that communicates the core value on a small screen, so that the roadmap preview does not appear as an illegible blob.
8. As a visitor using a screen reader, I want the page heading hierarchy and landmark structure to be semantically correct, so that I can navigate the page efficiently.
9. As a visitor with low vision, I want body text to meet WCAG AA contrast (4.5:1 minimum), so that the description paragraph is readable.
10. As a visitor who tabs through the page, I want all interactive elements (header nav, CTAs, roadmap link) to be keyboard-reachable with visible focus indicators, so that I can navigate without a mouse.
11. As a signed-in user visiting the root URL, I want to be redirected to my dashboard (or onboarding if not yet completed), so that I do not see the marketing page after I have already signed up.
12. As a returning visitor, I want the primary CTA label to be a clear verb-plus-object phrase (not "Get started — it's free" with an em-dash), so that I know exactly what will happen when I click.
13. As a visitor scanning the roadmap preview section, I want the supporting label to be plain text rather than uppercase-tracked metadata, so that it reads as informative rather than decorative.
14. As a developer reviewing this page, I want no banned anti-patterns (eyebrow pills, uppercase tracking labels, em-dashes, gradient text), so that the page passes the design system's slop test.

---

## Implementation Decisions

### Module 1: HeroSection

- The hero communicates the proof trail value prop, not the adaptive plan. The h1 targets the specific user: an engineer building toward a frontier AI lab role who needs something to show, not just something to watch.
- No category-descriptor pill above the h1. The headline carries that weight alone.
- Body text uses a color token at or above `oklch(0.65 0 0)` — not `muted-foreground` (`oklch(0.58 0 0)`, which is ~4.2:1 against void black and fails WCAG AA for body copy).
- `text-wrap: balance` on the h1.
- Button labels use verb-plus-object form. No em-dashes. No exclamation marks.
- The secondary CTA links to `/roadmap` as today.
- The primary CTA links to `/sign-up`.

### Module 2: ProofArtifactPreview (deep module)

- A stateless presentational component that accepts a `ProofArtifact` prop shape and renders a mock proof artifact card.
- The `ProofArtifact` type mirrors the `TutorSessionResult` shape from `src/types/tutor.ts` but is extended with a `proofLine: string` and `linkedInDraft: string` field — these are the fields the proof trail feature (see `docs/decisions/2026-05-30-proof-trail.md`) will produce.
- The component renders three sub-regions: the proof line (a single bolded sentence), the LinkedIn post draft (first 2-3 sentences as a preview), and the project spec title + first acceptance criterion.
- It renders hardcoded illustrative data on the landing page. It does not connect to Supabase.
- It accepts an optional `blur` prop that applies a subtle mask on the lower portion of the LinkedIn draft and project spec to signal "there's more after you sign up." This is a marketing affordance, not a paywall.
- The component's interface must remain stable even as the proof trail feature schema evolves. It is not a live data component; it is a specimen.

### Module 3: HowItWorksSection

- A 3-step static sequence communicating the core loop: (1) Socratic session on your current AI/ML topic, (2) Claude identifies the gaps in your understanding, (3) a GitHub-ready project spec + LinkedIn post draft lands in your proof history.
- No numbered eyebrow markers on every step unless the steps are visually part of a sequential flow where the number carries information. A numbered sequence as a layout element (not as a section scaffolding reflex) is appropriate here.
- Steps are not cards. Use a horizontal rule, leading icon, or spatial rhythm to separate them without defaulting to the identical-card-grid pattern.
- Copy is written at peer-engineer register. No "supercharge," "seamless," or "transform" language. Each step describes what literally happens.

### Module 4: RoadmapPreviewSection (extracted + refactored)

- Extracted from `page.tsx` into a standalone component.
- The section label ("33 nodes · 7 phases · explore before you commit") is refactored. The uppercase tracking is removed. Either plain muted text or a different structural device.
- Mobile behavior: on viewports below 768px, the 16:9 iframe container either renders at a reduced height with a visible "View full roadmap" button below it, or is replaced with a static description panel (phase list, node count, a short sentence on what the graph shows). The iframe canvas is not designed to render legibly at mobile widths; this is a known issue.
- The hover gradient overlay (`bg-gradient-to-t from-black/60`) is removed or significantly reduced. The entire container is already a link with an aria-label; the overlay CTA is redundant. If a hover state is retained, it uses a border or ring treatment rather than a gradient.
- `shadow-2xl` on the container is removed or replaced with a more intentional border treatment. Against void black, the 25px drop shadow has near-zero visible effect.

### Module 5: LandingPage (`page.tsx`)

- Orchestrates HeroSection, ProofArtifactPreview, HowItWorksSection, and RoadmapPreviewSection.
- Auth redirect logic (Supabase `getUser()` → redirect to `/dashboard` or `/onboarding`) stays in this server component as today.
- The page is a server component; the section components are server-renderable (no `"use client"` required for static-content components).
- Page meta description in `layout.tsx` should reflect the new value prop framing. Current description ("Know what to learn next. Prove it by shipping AI projects.") is directionally correct but can be refined.

### Design system compliance

- All tokens used in the redesign come from the established OKLCH palette in `globals.css`. No new color values are introduced.
- Animation: entrance animations use the existing `dp-rise` / `dp-pop` classes. `@media (prefers-reduced-motion: reduce)` overrides are already handled by the transform-only animation architecture.
- No glassmorphism, no gradient text, no side-stripe borders, no numbered section eyebrows as scaffolding reflex.

---

## Testing Decisions

### What makes a good test here

Tests should assert external behavior — what a visitor sees or can do — not implementation details like class names or internal state. A good test fails when user-visible behavior breaks and passes when it does not, regardless of how the internals are structured.

### ProofArtifactPreview

- **Snapshot test**: Render the component with the canonical mock `ProofArtifact` data and assert the snapshot matches. Catches visual regressions on the most conversion-critical section of the page.
- **Prop contract test**: Render with a minimal `ProofArtifact` (only required fields) and assert the component renders without throwing. Catches schema drift between the component's interface and the proof trail feature's evolving data shape.
- **Blur variant test**: Render with `blur={true}` and assert the blur overlay element is present in the DOM. Render with `blur={false}` (default) and assert it is absent.
- Prior art: no existing snapshot tests in the codebase; use Vitest + `@testing-library/react`. The existing `vitest.config.ts` is already configured.

### HowItWorksSection

- **Heading hierarchy test**: Assert the section contains exactly one `h2` (the section heading) and that no `h1` appears within it. Catches heading-order regressions that would break screen reader navigation.
- **Landmark test**: Assert the section is wrapped in a `<section>` with an accessible name (either `aria-labelledby` pointing to the h2, or `aria-label`). Catches missing landmark structure.
- **Step count test**: Assert exactly 3 step items are rendered. Catches accidental additions or deletions.

### LandingPage auth redirect logic

- **Unauthenticated visitor**: Mock `getUser()` returning `{ data: { user: null } }`. Assert the component renders without redirecting (the marketing page is shown).
- **Authenticated user with completed onboarding**: Mock `getUser()` returning a user and `profiles` returning `{ onboarding_completed_at: "2026-01-01" }`. Assert `redirect("/dashboard")` is called.
- **Authenticated user without completed onboarding**: Mock `getUser()` returning a user and `profiles` returning `{ onboarding_completed_at: null }`. Assert `redirect("/onboarding")` is called.
- Prior art: the existing auth pattern in `src/app/(auth)/` uses the same `createClient()` + `getUser()` pattern. Test mocking approach should mirror any existing auth tests if present, or use `vi.mock("@/lib/supabase/server")`.

---

## Out of Scope

- The proof trail feature itself (`/proof` page, LinkedIn post generator, tutor session persistence) — that is governed by `docs/decisions/2026-05-30-proof-trail.md` and gated on the manual validation gate.
- The `ProofArtifactPreview` component does not wire to live Supabase data. It renders mock data only. Live wiring is out of scope until the proof trail feature ships.
- Pricing, testimonials, or social proof sections. The product is pre-traction; adding placeholder social proof is worse than omitting it.
- The header navigation. Current "Sign in / Get started" header stays as-is.
- Changes to the `/roadmap` page itself. Only the preview embed and its surrounding section are in scope.
- Any changes to authentication flows, onboarding, or the dashboard.
- Dark/light mode toggle. The design system is dark-only.

---

## Further Notes

The `docs/README.md` one-liner ("A proof trail for engineers who want jobs at frontier AI labs") is more precise than anything currently on the landing page. The redesign should treat this as the headline brief — not a back-of-envelope summary, but the product's actual positioning. The hero copy should be written against this brief, not against the current landing page copy.

The proof trail validation gate (3 manual sessions, 2 LinkedIn posts with AI practitioner engagement) from `docs/decisions/2026-05-30-proof-trail.md` is a product gate, not an engineering gate. The landing page redesign is independent of it — the `ProofArtifactPreview` renders static illustrative data regardless of whether the feature has shipped.

The `/impeccable critique` baseline score for this surface is 26/40. After this redesign, re-run `/impeccable critique` against the landing page to measure improvement. Target: 32+ (Good band). The P1 and P2 issues identified in the critique are the primary drivers of that score increase.
