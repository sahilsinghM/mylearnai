# DeepPath — What We're Building

**One-liner:** A proof trail for engineers who want jobs at frontier AI labs.

Every Socratic tutoring session ends with a LinkedIn post draft and a GitHub-ready project spec. After 20 sessions, you have 20 concrete, citable proofs of frontier AI knowledge.

---

## The Problem

Busy engineers trying to reach frontier labs (Anthropic, OpenAI, DeepMind) are stuck in a doom loop:
1. Passive consumption — newsletters, YouTube, papers. Never applied.
2. ChatGPT tutoring sessions — unstructured, no follow-through, nothing to show.
3. Started courses — abandoned when real work gets busy.

The core pain is not lack of content. It's that nothing converts learning into career-legible evidence.

## The Wedge

**Proof trail.** Every session ends with:
- A GitHub-ready micro-project spec with acceptance criteria
- A LinkedIn post draft: "I learned X, here's what I built to prove it"
- A one-sentence proof line: concrete, runnable, checkable

Zero direct competitors. Every existing tool optimizes for consumption metrics. None produce proof.

## Target User

A mid-level software engineer, employed full-time, who:
- Wants a job at a frontier AI lab specifically (not just "learn AI")
- Can only consume content during work hours in 5–10 min bursts
- Builds in the evenings
- Has finished at least one structured AI course but feels stuck between "knows the theory" and "can prove it"

**This user is the founder.**

---

## What's Shipped

### Socratic Tutor (2026-05-21)
- Streaming Socratic chat via SSE
- Gap extraction on session close (Claude identifies 2 concepts the user fumbled)
- Project assignment generation with acceptance criteria
- Week topic auto-detected from active plan

**Routes:** `/tutor`, `/api/tutor/chat`, `/api/tutor/close-session`

## What's Next

### Proof Trail (approved 2026-05-30, pending validation gate)

**Validation gate:** Complete 3 manual Socratic sessions. Hand-write the LinkedIn post from each proof line. Post to LinkedIn. Only build if 2 of 3 posts get engagement from AI practitioners.

**Build order (once gate is passed):**

| Step | What | Effort |
|------|------|--------|
| 0 | Migration: `supabase/migrations/003_tutor_sessions.sql` | 30min |
| 1 | Wire session save into close-session route | 30min |
| 2 | `POST /api/tutor/generate-post` — LinkedIn post generator | 2h |
| 3 | `GET /api/proof` + `PATCH /api/proof/[id]` + `/proof` page | 4h |
| 4 | Daily topic prompt on tutor home (SSR, 20-topic curriculum) | 1h |
| 5 | Streak counter, copy proof line button, sidebar nav link | 30min |

**Total:** ~8h human / ~45min CC+gstack

---

## Docs Structure

```
docs/
  README.md          ← this file
  journal/           ← session logs (what shipped, what was decided, bugs fixed)
  design/            ← approved design docs per feature
  decisions/         ← CEO review outputs (scope decisions, architecture findings)
```
