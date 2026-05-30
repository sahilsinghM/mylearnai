# CEO Review: Proof Trail Feature
Date: 2026-05-30 | Branch: claude/deeppath-ai-learning-system-dFrew | Mode: SELECTIVE EXPANSION

Source design doc: `docs/gstack/deeppath-ai-learning-system-dFrew-design-20260530.md`

---

## What We're Building

Three features that complete the proof trail loop on top of the already-shipped Socratic tutor:

1. **LinkedIn post generator** — Claude call after close-session. Editable textarea + copy buttons. 8s timeout with fallback to proof line.
2. **Proof history page** (`/proof`) — Durable session history from Supabase. Inline editing. Streak counter. linkedin_published checkbox with green border.
3. **Daily topic prompt** — 20-topic frontier lab curriculum, SSR. No network call.

---

## Architecture Findings (resolved)

### Session save not wired
`close-session/route.ts` returns data but never persists to DB. The `tutor_sessions` table doesn't exist yet. The original design said `ALTER TABLE` but the table needs to be `CREATE TABLE` (it's new).

**Resolution:** Server-side insert in close-session after Claude responds. Atomic: if the insert fails, return 500. Never trust the browser to persist critical state. Calls `revalidatePath('/proof')` after successful insert.

### Route structure
`/api/proof/[id]` PATCH handler must be in its own file (`src/app/api/proof/[id]/route.ts`). Next.js App Router does not support dynamic segments in the same route file as static handlers.

### Updated_at trigger
Schema needs an `updated_at` column + Postgres trigger so PATCH operations keep audit timestamps current.

---

## Scope Decisions

| # | Item | Decision | Reasoning |
|---|------|----------|-----------|
| 1 | DB persistence (tutor_sessions table) | ACCEPTED | Required for all 3 features |
| 2 | Session save wiring in close-session | ACCEPTED | Server-side, atomic |
| 3 | LinkedIn post generator | ACCEPTED | Core wedge |
| 4 | Proof history page (/proof) | ACCEPTED | Core wedge |
| 5 | Daily topic prompt (SSR) | ACCEPTED | 1h build |
| 6 | Proof streak counter | ACCEPTED (cherry-pick) | 5 lines JS, meaningful habit mechanic |
| 7 | Copy proof line button | ACCEPTED (cherry-pick) | 2 lines JSX, UX win |
| 8 | Sidebar nav link to /proof | ACCEPTED (cherry-pick) | 1 line, page must be discoverable |
| 9 | Post model: TUTOR_MODEL + AbortController 8s | ACCEPTED | Consistent, fallback always fires |

---

## Error & Rescue Map

| Flow | Failure mode | Response |
|------|-------------|----------|
| Session save | Supabase insert fails | try/catch; log; return 500 with human error message |
| generate-post | Claude timeout (>8s) | AbortController fires; return `{ postDraft: null, proofLine: acceptance_criteria[0] }` |
| generate-post | Empty gaps array | Return 400: `{ error: "No gaps identified" }` |
| /proof PATCH | DB update fails | Error toast + rollback optimistic update |
| linkedin_published toggle | PATCH fails | Revert checkbox state; show "Couldn't save — try again" |
| session_count query | DB unavailable | SSR catches; defaults to topic 1 |

---

## Effort Estimate

| Step | Human | CC+gstack |
|------|-------|-----------|
| Migration + session save wiring | 30min | 5min |
| LinkedIn post generator | 2h | 10min |
| Proof history page | 4h | 20min |
| Daily topic prompt | 1h | 5min |
| Cherry-picks (streak, copy button, nav) | 30min | 5min |
| **Total** | **~8h** | **~45min** |

---

## Validation Gate (gates the entire build)

Do 3 Socratic sessions manually. After each one, hand-write the LinkedIn post. Post to LinkedIn. Only proceed to build if:
- 3 posts published within 2 weeks
- At least 2 get engagement from AI practitioners

**Contingency:** If the gate isn't met, revise the post format (not the product). Read 10 examples from researchers who got hired at frontier labs. Don't abandon.

---

## Adversarial Review Result

Score: **9/10** (2 rounds, 7 issues caught and fixed)

Issues fixed:
1. CREATE TABLE not ALTER TABLE (table doesn't exist)
2. `/api/proof/[id]/route.ts` split from `/api/proof/route.ts`
3. `updated_at` column + trigger added to schema
4. `revalidatePath('/proof')` call site clarified (server-side in route handler)
5. generate-post client trigger clarified (sequential call in TutorChat after close-session 200)
6. Validation Gate labeled "Product Gate — not an engineering task"
7. Contingency clause added to Product Gate
