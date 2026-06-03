---
name: DeepPath
description: Adaptive AI/ML curriculum platform for self-taught engineers
colors:
  void-black: "oklch(0.09 0 0)"
  deep-surface: "oklch(0.12 0 0)"
  raised-surface: "oklch(0.145 0 0)"
  depth-indigo: "oklch(0.55 0.2 264)"
  dim-text: "oklch(0.58 0 0)"
  ghost-surface: "oklch(0.18 0 0)"
  hairline: "oklch(0.22 0 0)"
  foreground: "oklch(0.95 0 0)"
  secondary-text: "oklch(0.85 0 0)"
  signal-red: "oklch(0.62 0.21 25)"
  status-amber: "oklch(0.78 0.14 78)"
  status-emerald: "oklch(0.74 0.15 155)"
typography:
  display:
    fontFamily: "Geist Sans, Arial, Helvetica, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist Sans, Arial, Helvetica, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist Sans, Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist Sans, Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Geist Sans, Arial, Helvetica, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  mono:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "10px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.depth-indigo}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "oklch(0.62 0.2 264)"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card-base:
    backgroundColor: "{colors.deep-surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-raised:
    backgroundColor: "{colors.raised-surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input:
    backgroundColor: "{colors.ghost-surface}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  badge-default:
    backgroundColor: "{colors.depth-indigo}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-success:
    backgroundColor: "oklch(0.26 0.07 155)"
    textColor: "{colors.status-emerald}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
---

# Design System: DeepPath

## 1. Overview

**Creative North Star: "The Navigator's Chart"**

DeepPath's visual system is built on a single premise: clarity earns trust. The interface is dark and precise — not because darkness signals sophistication, but because the content (a knowledge graph, a 7-day plan, a Claude-generated weekly goal) is the signal, and the chrome exists only to frame it. Every surface, spacing decision, and typographic choice is made in service of the question every user carries: "Where am I, and what do I do next?"

The system rejects warmth-by-default and the decorative layers that come with it. No gradient text, no glassmorphism, no hero metrics laid out like a press release. The near-black body (`oklch(0.09 0 0)`) is not moody — it's neutral. The indigo primary is not a brand statement for its own sake; it activates on interactive elements and node states that require attention, nowhere else. The amber and emerald status colors are reserved for exactly one job each: in-progress and completed.

The system also rejects the gamified EdTech surface. Progress is structural: the roadmap visualization is the progress indicator. Completion states are shown through layout and color role, not badges or streaks. Copy is peer-to-peer — no tutorial voice, no softening language, no exclamation marks.

**Key Characteristics:**
- Near-black background with tonal surface layering (3 distinct surface levels)
- Single accent (depth indigo) used on ≤15% of any screen
- Status-only color roles for amber and emerald; not used decoratively
- Transform-only entrance animations that respect `prefers-reduced-motion`
- Geist Sans + Geist Mono — the same family as the codebase; no contrast axis, but the mono usage earns its separation
- Flat surfaces at rest; ambient lift only on hover/focus


## 2. Colors: The Navigator's Palette

Three surface levels, one structural accent, two status signals. That is the entire color vocabulary.

### Primary
- **Depth Indigo** (`oklch(0.55 0.2 264)`, approx `#4F5EDB`): The structural accent. Used on primary buttons, interactive node indicators, ring/focus states, and the `active` node state in the roadmap. Never used as a background fill on content areas. Its restraint is the point — when something is indigo, it means "act here."

### Tertiary
- **Status Emerald** (`oklch(0.74 0.15 155)`, approx `#3DBF7A`): Completion and positive states only. The emerald pulse animation marks the Active Node. Badge backgrounds for success states use a tinted-dark emerald (`oklch(0.26 0.07 155)`). Never used on decorative elements.
- **Status Amber** (`oklch(0.78 0.14 78)`, approx `#D4A62A`): In-progress and warning states. Badge backgrounds for warning use a tinted-dark amber. Never decorative.
- **Signal Red** (`oklch(0.62 0.21 25)`, approx `#D95040`): Destructive actions and error states only. No creative use.

### Neutral
- **Void Black** (`oklch(0.09 0 0)`, approx `#141414`): The body background. True near-black with zero chroma — not warm, not cool.
- **Deep Surface** (`oklch(0.12 0 0)`, approx `#1A1A1A`): Card-level background. The first tonal step above void.
- **Raised Surface** (`oklch(0.145 0 0)`, approx `#202020`): Nested card or secondary panel background. The second tonal step.
- **Ghost Surface** (`oklch(0.18 0 0)`, approx `#272727`): Muted interactive containers — input backgrounds, secondary buttons, hover states.
- **Hairline** (`oklch(0.22 0 0)`, approx `#303030`): Borders, dividers, separators. Consistent throughout.
- **Foreground** (`oklch(0.95 0 0)`, approx `#F0F0F0`): Primary text. Near-white, not pure white, to reduce harshness against void black.
- **Secondary Text** (`oklch(0.85 0 0)`, approx `#D6D6D6`): Secondary emphasis — secondary button labels, card subtitles.
- **Dim Text** (`oklch(0.58 0 0)`, approx `#888888`): Muted labels, metadata, timestamps, placeholder text. Verify 4.5:1 contrast on every surface this lands on; against void black this is marginal.

### Named Rules
**The One Signal Rule.** Depth Indigo appears on interactive affordances and node states only. It does not appear on decorative shapes, gradients, or ambient fills. If a screen is reading as "purple", there are too many indigo elements.

**The Status Purity Rule.** Emerald means completed. Amber means in-progress. Neither color appears in any context where it does not carry that meaning. A green button is wrong; an emerald icon on a done task is correct.


## 3. Typography

**Display / Body / Mono Font:** Geist Sans (all weights) + Geist Mono

**Character:** Single-family system using weight contrast for hierarchy. Geist's geometric but slightly humanist forms read as technical without reading cold. The mono variant signals code references and data labels without introducing a visual break. OpenType features `cv01` and `ss01` are active on the body element — keep them.

### Hierarchy
- **Display** (700, `clamp(1.75rem, 4vw, 2.5rem)`, leading 1.1, tracking -0.02em): Page-level headings. Used on landing hero only; not repeated inside the app shell. `text-wrap: balance` required.
- **Headline** (600, `1.125rem`, leading 1.3, tracking -0.01em): Section headings inside the app — TopBar titles, card group headers, onboarding step titles.
- **Title** (600, `0.875rem`, leading 1.4): Card titles, modal headings, task type labels. The workhorse heading inside data-dense components.
- **Body** (400, `0.875rem`, leading 1.6): Task descriptions, plan summaries, adaptation log entries. Max line length: 65–75ch.
- **Label** (400, `0.75rem`, leading 1.4): Timestamps, metadata, muted supporting text, TopBar subtitles.
- **Mono** (Geist Mono, 400, `0.75rem`, leading 1.5): Node slugs, code snippets, the brand logo lockup (the `mr-nav-logo` uses mono already — maintain this).

### Named Rules
**The Peer-Register Rule.** All copy is written as expert-to-expert. No sentence ends in "Let's get started!" No heading uses an exclamation mark. No label softens a destructive action ("Remove" not "Remove this item if you're sure").


## 4. Elevation

The system is flat by default. Depth is communicated through the three tonal surface levels (void → deep → raised) and the hairline border, not through shadows. A surface one tonal step above the background reads as "above" without any box-shadow.

The one exception is interactive lift: a single ambient shadow appears on hover for cards and buttons that the user can act on. This communicates interactivity without the surface appearing to float at rest. The emerald pulse animation on the Active Node uses a `box-shadow` glow — the only glow in the system, reserved for that single distinguished state.

### Shadow Vocabulary
- **Interactive lift** (`0 4px 16px oklch(0 0 0 / 0.35)`): Appears only on hover over interactive cards or elevated containers. Not present at rest.
- **Active pulse** (`0 0 0 0 color-mix(in oklab, var(--emerald) 55%, transparent)` → `0 0 0 7px transparent`): The `dp-pulse` animation marks the single Active Node. Used nowhere else.

### Named Rules
**The Flat-By-Default Rule.** Surfaces carry no shadows at rest. If a screen reads as "layered" without any user interaction, reduce the surface count or use tonal background steps instead of shadows. Shadows are responses to state, not structure.


## 5. Components

**Philosophy: Precise and patient.** Components give measured feedback, do not rush, and use emphasis only when it's earned. Hover states are subtle. Transitions are short (`0.14s–0.32s`) and ease out with `cubic-bezier(0.2, 0.7, 0.2, 1)`. No bounce, no elastic.

### Buttons
- **Shape:** Gently curved edges (6px radius, `rounded-md`)
- **Primary:** Depth indigo fill (`bg-primary`), near-white label, `h-9 px-4` (default) / `h-11 px-8` (large). Hover opacity 90% — does not shift color, does not lift.
- **Focus:** `ring-2 ring-ring` (matches primary indigo). No offset.
- **Outline:** Transparent fill, hairline border (`border-border`), foreground label. Hover: ghost surface fill.
- **Ghost:** Transparent, no border. Hover: ghost surface fill. Used for nav links and low-emphasis actions.
- **Link:** Primary text color, underline on hover, underline offset 4px. Used sparingly in prose contexts.
- **Disabled:** 50% opacity, pointer-events none.
- **Sizing:** `sm` (h-8, px-3, text-xs), `default` (h-9, px-4, text-sm), `lg` (h-11, px-8, text-sm), `icon` (h-9 w-9).

### Badges / Status Chips
- **Shape:** Slightly curved (4px radius, `rounded-md`)
- **Default (indigo):** Depth indigo fill, foreground text. For node states that are "active" or categorically primary.
- **Success (emerald):** Dark emerald tint background (`oklch(0.26 0.07 155)`), status-emerald text. Completed states.
- **Warning (amber):** Dark amber tint, amber text. In-progress / watch states.
- **Danger (red):** Dark red tint, signal-red text. Error or destructive.
- **Outline:** Hairline border, foreground text. Secondary labels where color carries no semantic meaning.
- **Typography:** 12px, medium weight (500), no uppercase, tight padding (2px 8px).

### Cards / Containers
- **Corner style:** Gently curved (8px radius, `rounded-lg`)
- **Base card:** Deep surface background (`oklch(0.12 0 0)`), hairline border, 20px internal padding.
- **Raised card:** Raised surface background (`oklch(0.145 0 0)`) for nested content (e.g. the hook strip inside TodayCard uses a `bg-primary/5` tinted panel — a pattern reserved for contextual callouts inside cards, not for card-on-card nesting).
- **Shadow:** None at rest. Interactive lift on hover where the card is actionable.
- **The hook strip pattern:** A tinted `bg-primary/5` top strip with `border-b border-primary/10` is used for Claude-generated context lines (today's motivational hook). This is the only approved use of a tinted-primary surface inside a card.

### Inputs / Fields
- **Style:** Ghost surface fill (`bg-input`), hairline border, 6px radius, `h-9 px-3`.
- **Focus:** `ring-2 ring-ring` (depth indigo). No border color shift — the ring does the work.
- **Placeholder:** Dim text color. Must maintain 4.5:1 contrast on ghost surface.
- **Disabled:** 50% opacity, cursor not-allowed.
- **Error:** Use destructive ring color; pair with an error label below the field (never color-only).

### Navigation
- **App TopBar:** Full-width, hairline bottom border, `px-6 py-3`. Semantic `h1` (14px, 600) for the page title; optional `p` (12px, muted) for subtitle. No icon in TopBar — the page title carries that weight alone.
- **Roadmap nav (`.mr-topnav`):** 50px height, hairline bottom border, Geist Mono logo lockup (8px indigo dot + "DeepPath" in 14px mono 700). Nav links at 13px muted, 6px radius hover fill. This nav has its own CSS file (`roadmap.css`) — keep it decoupled.
- **Mobile:** No dedicated mobile nav pattern is implemented. TopBar collapses gracefully; roadmap nav is scroll-suppressed on mobile via `pointer-events-none` iframe.

### The Roadmap Visualization (Signature Component)
The master roadmap is a canvas-based graph with 33 nodes across 7 phases. Each phase carries a distinct hue. Node states (`locked` / `available` / `in_progress` / `completed` / `skipped` / `deferred`) are communicated through color and opacity. The Active Node has the emerald pulse glow. This is the most visual-identity-dense surface in the product. Rules:
- Phase hues are the only place where colors outside the 12-token palette are approved.
- Node state colors must always be paired with a label or tooltip — never color-only.
- The canvas background matches void black exactly so the graph appears embedded, not framed.


## 6. Do's and Don'ts

### Do:
- **Do** use the three tonal surface levels (void / deep / raised) to communicate depth. That's what they're for.
- **Do** keep depth indigo to ≤15% of any given screen's visible pixels. Scarcity is how it signals importance.
- **Do** use transform-only entrance animations (`dp-rise`, `dp-pop`, `dp-rev-up`). Opacity starts at 1 so the content is never hidden if the animation pauses on a background tab.
- **Do** pair every status color use with a text label. Emerald and amber must be understandable without color perception.
- **Do** keep TopBar headings as semantic `h1` elements even though they're styled at 14px. Screen readers need the hierarchy.
- **Do** write button labels as verb + object. "Generate plan" not "Continue". "Remove node" not "OK".
- **Do** use `text-wrap: balance` on display and headline-size headings.

### Don't:
- **Don't** use gradient text (`background-clip: text`). It is prohibited. Use a single indigo for emphasis if color is needed.
- **Don't** use gamified EdTech patterns — streaks, achievement badges, confetti, cartoon reward language. The audience is self-taught engineers; these patterns read as condescension.
- **Don't** use glassmorphism. No `backdrop-filter: blur()` on card surfaces. The background is already dark and calm; glass effects add noise.
- **Don't** use border-left greater than 1px as a colored accent stripe on cards or callouts. Rewrite with a tinted background or a full border.
- **Don't** introduce a fourth font family. Geist Sans + Geist Mono is the complete typographic system.
- **Don't** use all-caps for body copy or section headings. The mono logo lockup is the only approved uppercase-adjacent treatment.
- **Don't** use the generic SaaS landing template: big hero metric numbers, gradient headlines, "supercharge / empower / transform" copy. DeepPath copy describes what the product literally does.
- **Don't** build a feature that looks like a ChatGPT wrapper (sidebar thread list, chat bubbles as the primary UI). The tutor is a panel within a structured learning context, not a freeform chat interface.
- **Don't** add shadows at rest to surfaces that are not interactive. The flat-by-default rule is not negotiable.
- **Don't** use emerald or amber in a decorative context. Both colors carry semantic load; using them as decoration trains the user to ignore the signal.
