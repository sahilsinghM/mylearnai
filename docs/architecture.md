# DeepPath — Architecture

DeepPath is a Next.js 16 application backed by Supabase (Postgres + Auth) and the Anthropic API. This document maps the five major systems, explains how they connect, and surfaces the non-obvious design decisions.

## Systems overview

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│  /roadmap (public)   /onboarding   /tutor   /dashboard  │
└────────────┬──────────────┬──────────┬──────────────────┘
             │              │          │
             ▼              ▼          ▼
┌──────────────────────────────────────────────────────────┐
│               Next.js App Router (src/app/)              │
│  middleware.ts — auth gate via Supabase SSR cookies      │
│                                                          │
│  Route handlers (src/app/api/)                           │
│    /api/onboarding          POST — complete onboarding   │
│    /api/onboarding/stream   POST — SSE plan generation   │
│    /api/tutor/chat          POST — Socratic question     │
│    /api/tutor/close-session POST — gap + project extract │
│    /api/tutor/generate-post POST — LinkedIn post draft   │
│    /api/plan/current        GET  — active plan           │
│    /api/plan/adapt          POST — regenerate plan       │
│    /api/roadmap/quiz        POST — submit quiz score     │
│    /api/roadmap/adaptation-log/[id] PATCH — accept/deny  │
│    /api/proof               GET/POST — proof trail       │
│    /api/proof/[id]          PATCH — edit proof entry     │
│    /api/proof/session/[id]  GET  — poll session data     │
│    /api/resources/completions POST/DELETE — mark read    │
│    /api/analytics/event     POST — log analytics event   │
│    /api/milestones/[id]     PATCH — milestone status     │
│    /api/tasks/[id]          PATCH — task status          │
└──────────┬─────────────────────────┬─────────────────────┘
           │                         │
           ▼                         ▼
┌─────────────────────┐   ┌──────────────────────────┐
│   Supabase Postgres │   │   Anthropic API           │
│   13 tables, RLS    │   │   claude-sonnet-4-6       │
│   7 migrations      │   │   JSON-only responses     │
└─────────────────────┘   └──────────────────────────┘
```

## Five systems

### 1. Master Roadmap

**What it is:** A human-curated knowledge graph of 33 AI/ML topics across 7 phases (Foundations → Production). Lives in Supabase. Publicly visible at `/roadmap`.

**Key files:**
- `src/lib/roadmap/masterRoadmap.ts` — fetches and caches the graph (1h `unstable_cache`)
- `src/lib/roadmap/types.ts` — `MasterNode`, `MasterEdge`, `RoadmapGraph` types
- `supabase/migrations/004_master_roadmap.sql` — schema
- `supabase/migrations/005_master_roadmap_seed.sql` — initial data

**Design rule:** AI agents read the Master Roadmap but never write to it without human review. All mutations go through a migration reviewed by a human engineer. This keeps the curriculum quality stable and auditable.

**Cache strategy:** `getMasterRoadmap()` uses Next.js `unstable_cache` with a 1-hour revalidation. The Master Roadmap changes rarely; serving it from cache avoids a round-trip to Supabase on every roadmap page load.

### 2. Personalized Roadmap

**What it is:** A per-user filtered projection of the Master Roadmap. Created at onboarding completion. Contains the same Master Nodes with per-user depth targets and ordering. Updated by the Adaptation Agent.

**Key files:**
- `src/lib/roadmap/generatePersonalizedRoadmap.ts` — `buildPersonalizedRoadmap()`, `buildRoadmapReveal()`
- `src/lib/roadmap/personalizeOnboardingRoadmap.ts` — writes `user_roadmaps` + `user_node_states` rows
- `src/lib/roadmap/adaptationAgent.ts` — `evaluateAdaptationDecision()` — pure TypeScript, no LLM
- `src/lib/roadmap/runAdaptationAgent.ts` — DB read/write wrapper
- `src/lib/roadmap/adaptationLog.ts` — append to `roadmap_adaptation_log`
- `supabase/migrations/006_user_roadmaps.sql` — `user_roadmaps`, `user_node_states`, `roadmap_adaptation_log`

**Personalization algorithm:**
1. Filter Master Nodes: skip nodes whose `skipForLevels` array contains the user's programming level, unless the node is a required prerequisite of another included node.
2. Sort remaining nodes by `phase` then `row_index`.
3. Assign `scheduledWeek` sequentially.
4. Assign `depthTarget` based on goal: `research` → `fluent`, all others → `working`.

**Adaptation Agent design:** The agent is deterministic — no LLM. Two decision types:
- `REMOVE`: triggered when `quizScoreBest > 0.90` AND `projectSubmitted`. Auto-applied.
- `INSERT`: triggered when `quizScoreBest < 0.65` on ≥2 attempts AND there are unsatisfied required prerequisites. Inserts the weakest prerequisite. Requires user acceptance.

The reasoning text stored in `roadmap_adaptation_log.reasoning` is Claude-generated (a separate call), but the decision itself is deterministic. This makes the Adaptation Log entries accurate — the stored reasoning explains a rule-based decision rather than re-creating an LLM judgment.

### 3. Onboarding

**What it is:** A 7-step wizard collecting the user's programming level, AI/ML familiarity, math confidence, goals, time availability, interest areas, and familiar topics. Outputs a Personalized Roadmap and a first Weekly Plan.

**Key files:**
- `src/components/onboarding/OnboardingWizard.tsx` — wizard shell
- `src/components/onboarding/steps/` — one file per step
- `src/app/api/onboarding/route.ts` — `POST /api/onboarding` — the submission handler
- `src/lib/validations/onboarding.ts` — Zod schema for the profile
- `src/types/onboarding.ts` — `OnboardingProfile` type

**What happens on submit (`POST /api/onboarding`):**
1. Validate and save `onboarding_profiles` row.
2. Call `personalizeOnboardingRoadmap()` → writes `user_roadmaps` + `user_node_states`.
3. Call `getActiveRoadmapGrounding()` → fetches the starting node's curated resources + project.
4. Call Claude (`buildInitialPlanPrompt()` → `generatePlan()`) → 7-day plan JSON.
5. Insert `learning_plans`, `plan_days`, `tasks`, `projects`, `milestones` rows.
6. Mark `profiles.onboarding_completed_at`.
7. Return `{ planId, projectId, roadmapReveal }`.

### 4. Socratic Tutor

**What it is:** A Socratic chat interface that drills the user on their active week's topic. Every session ends with a gap analysis and a project assignment.

**Key files:**
- `src/app/api/tutor/chat/route.ts` — `POST /api/tutor/chat`
- `src/app/api/tutor/close-session/route.ts` — `POST /api/tutor/close-session`
- `src/lib/anthropic/prompts.ts` — `buildTutorSystemPrompt()`, `buildCloseSessionPrompt()`
- `src/lib/tutor/context.ts` — `getWeekContext()` — fetches active plan week topic
- `src/lib/tutor/rate-limit.ts` — in-memory rate limiter (30 req/user for chat, 10 for close)
- `src/components/tutor/TutorChat.tsx` — UI

**Chat flow:**
1. Client sends `{ conversationHistory, weekTopic? }`.
2. Server resolves topic: explicit `weekTopic` → active plan's `weekTopic` from `getWeekContext()`.
3. Topic is sanitized (strips `\n\r<>`, capped at 200 chars) before interpolation into the system prompt — prevents prompt injection.
4. Claude returns `{ question: string, choices: [{ text }] }` (always JSON, 3 choices).
5. Server validates against Zod schema before returning. Schema mismatch falls back to raw text with empty choices.

**Close session flow:**
1. Client sends full `conversationHistory`.
2. Server formats transcript with `<student>` / `<mentor>` XML tags.
3. Claude returns `{ gaps: [...], projectAssignment: {...} }`.
4. Validated result upserted into `tutor_sessions`.
5. `revalidatePath("/proof")` fires to refresh the proof trail page.

**Rate limiting:** In-memory sliding window using `Map<string, number[]>`. Timestamps older than 60s are pruned on each check. Not distributed — resets on server restart. Sufficient for a single-instance deployment; replace with Redis for multi-instance.

### 5. Proof Trail

**What it is:** A per-user collection of completed Socratic sessions. Each session becomes a proof entry with a one-sentence proof line, a GitHub project spec, and a LinkedIn post draft. Still partially built as of 2026-06-03 — see `docs/README.md` for the build plan.

**Shipped:** `tutor_sessions` DB table, session save in `close-session` route, `POST /api/tutor/generate-post`.

**What's pending:** `/proof` page, `GET /api/proof`, streak counter, daily topic prompt, copy-proof-line button.

## Authentication

Supabase Auth with SSR cookies. `middleware.ts` runs on every non-static route:
- Unauthenticated user on protected path → redirect to `/sign-in`.
- Authenticated user on `/sign-in` or `/sign-up` → redirect to `/dashboard`.

Public paths are defined in `src/lib/auth/publicPaths.ts`. Currently: `/`, `/sign-in`, `/sign-up`, `/roadmap`, `/roadmap/*`, `/api/auth/*`.

Two Supabase client factories in `src/lib/supabase/`:
- `createClient()` — cookie-scoped, respects RLS, for user-owned operations
- `createAdminClient()` — service role, bypasses RLS, for onboarding writes that create multiple related rows atomically

## AI layer

All Claude calls go through `src/lib/anthropic/client.ts`. The client uses `@anthropic-ai/sdk` directly (not the AI SDK). Every call has a 15-second `AbortController` timeout.

Prompt safety:
- `sanitizeTopicForPrompt()` strips `\n\r<>` from user-supplied topics before interpolation.
- `escapeTranscriptContent()` strips `<>` from chat messages before wrapping in XML tags.
- All AI responses are validated against Zod schemas before being stored or returned.

Model: `claude-sonnet-4-6` for all calls (tutor chat, close session, plan generation, adaptation reasoning). Stored in `TUTOR_MODEL` constant.

## Data flow: first plan generation

```
Browser (onboarding wizard)
  → POST /api/onboarding { profile }
    → Validate (Zod onboardingSchema)
    → Save onboarding_profiles
    → personalizeOnboardingRoadmap()
        → generatePersonalizedRoadmap(profile, graph)
        → write user_roadmaps + user_node_states
    → getActiveRoadmapGrounding()
        → fetch active node's resources + project from master_roadmap_*
    → buildInitialPlanPrompt(profile, grounding)
    → generatePlan(prompt) → Claude → planJSON
    → insert learning_plans, plan_days, tasks, projects, milestones
    → update profiles.onboarding_completed_at
  ← { planId, projectId, roadmapReveal }
Browser
  → redirect to /dashboard
```

## Key non-obvious decisions

**Why the Adaptation Agent uses no LLM for decisions.** Roadmap mutations (INSERT, REMOVE) affect what the user studies for the next several weeks. An LLM-made structural decision would be hard to explain, hard to audit, and could silently degrade based on context window state. Rule-based decisions are deterministic, testable, and the stored reasoning (Claude-generated) describes what actually happened rather than rationalizing an opaque inference.

**Why `unstable_cache` for the Master Roadmap.** The name sounds alarming but `unstable_cache` is the Next.js App Router's stable data cache primitive. It caches the result of the async function across requests for the specified revalidation window. The Master Roadmap changes at most a few times per month; caching for 1 hour avoids unnecessary Supabase round-trips on every `/roadmap` visit.

**Why the tutor uses a 15-second hard timeout.** Streaming Socratic questions with partial results is worse UX than a clean error — a half-formed multiple choice question confuses the user. The timeout guarantees a clean success or clean failure, with the client showing a retry option on 500.

**Why the rate limiter is in-memory.** DeepPath is a single-instance Vercel deployment. An in-memory rate limiter is zero-dependency, zero-latency, and sufficient for current scale. The `Map` is module-level state that survives between requests but resets on cold start. If the deployment scales to multiple instances, swap to a Redis-backed implementation.
