# TODOS

## Completed

### Add tutor_sessions DB table + persistence
**What:** New migration adding `tutor_sessions` (id, user_id, week_topic, gaps JSONB, project_assignment JSONB, created_at). Update close-session route to INSERT after successful Claude call.
**Completed:** v0.2.0 (2026-06-05)

### Wire project assignment to plan/project UI
**What:** After a tutor session, the generated project should surface as a proof page. Implemented as `/proof/[sessionId]` — shows capability statement, gap analysis, project spec with acceptance criteria, and GitHub URL submission.
**Completed:** v0.2.0 (2026-06-05)
