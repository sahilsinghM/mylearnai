# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2026-06-05

### Added
- **Tutor: PREP phase** — before each session, learners see their active roadmap node title and curated resources with checkboxes. Resource completion state persists across refreshes. A soft confirmation appears when starting without marking any resources. Nodes with zero resources skip PREP and open directly into the session.
- **Tutor: Session ends automatically** — sessions now close when a learner demonstrates mastery (3 correct chip answers in a row after question 8), hits the 12-question unconditional cap, or reaches the 15-question hard stop. No more infinite sessions.
- **Tutor: Proof page** — after each session, learners are redirected to `/proof/[sessionId]` showing their capability statement, gap analysis, and a project assignment. Learners can submit a GitHub URL once the project is built.
- **Tutor: Live gap radar** — wrong chip answers accumulate as "focus areas" visible during the session and fed back into subsequent questions, making the tutor adapt to where the learner is struggling.
- **Dashboard** — a `/dashboard` route for authenticated users.
- **Resource completions API** — `POST /api/resources/completions` and `DELETE /api/resources/completions/[resourceId]` to mark/unmark resources as read. Backed by `user_resource_completions` Supabase table with RLS.
- **Analytics instrumentation** — `session_started` and `proof_project_submitted` events logged when a learner begins a session or submits a GitHub URL.

### Changed
- **Tutor: Session state machine** — the tutor now uses a `PREP → CHAT → ANALYZING → PROOF_REDIRECT` phase system. The overlay pattern that caused text-jumble bugs is replaced with inline rendering.
- **Tutor: Agent label** — changed from disclosing implementation details to `MENTOR`.
- **Tutor: Answer chip normalization** — chip choices are length-normalized so the correct answer is not predictable by picking the longest option.
- **Tutor: Gap radar relabeled** — "Gap radar" renamed to "Focus areas found".
- **Close-session API** — `sessionId` is now required; sessions always carry a stable UUID from the client.

### Fixed
- Proof page polling skipped when session data was still processing (permanent spinner).
- `ANALYZING` phase got stuck on close-session API errors, leaving users with no composer.
- Chip answer reveal window allowed concurrent text input, creating double-send race.
- `toggleResourceCompletion` didn't check `res.ok`; HTTP errors silently kept optimistic update.
- `project_description` column reference in proof routes (DB column is `project_desc`); every proof page returned 404.
- Analytics endpoint accepted unauthenticated requests and logged unsanitized user input.
- `track("session_started")` was missing from the zero-resource bootstrap path.
