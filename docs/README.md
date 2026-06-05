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

### Tutor v0.2.0 (2026-06-05)

- **PREP phase** — learners see their active roadmap node and curated resources before each session. Resource completion persists.
- **Session auto-end** — sessions close on mastery (3 correct chips after Q8), 12-question cap, or 15-question hard stop.
- **Proof page** — `/proof/[sessionId]` shows capability statement, gap analysis, and project assignment. Learners submit a GitHub URL once built.
- **Live gap radar** — wrong chip answers accumulate as "focus areas", fed back into subsequent questions.
- **Dashboard** — `/dashboard` route for authenticated users.
- **Resource completions API** — `POST /api/resources/completions` and `DELETE /api/resources/completions/[resourceId]` backed by `user_resource_completions` table.
- **Analytics** — `session_started` and `proof_project_submitted` events via `/api/analytics/event`.

**Routes:** `/proof/[sessionId]`, `/api/proof/session/[sessionId]`, `/api/resources/completions`, `/api/analytics/event`

---

## Docs Structure

```
docs/
  README.md          ← this file
  journal/           ← session logs (what shipped, what was decided, bugs fixed)
  design/            ← approved design docs per feature
  decisions/         ← CEO review outputs (scope decisions, architecture findings)
```
