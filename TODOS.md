# TODOS

## P2 — Tutor Feature Follow-ups

### Add tutor_sessions DB table + persistence
**What:** New migration adding `tutor_sessions` (id, user_id, week_topic, gaps JSONB, project_assignment JSONB, created_at). Update close-session route to INSERT after successful Claude call.
**Why:** Sessions are currently ephemeral — refresh loses everything. History enables gap trending, session replay, and the structured GapModel (Approach B) upgrade path.
**Context:** The existing `projects` table has `UNIQUE(user_id)` — can't save tutor projects there. `tutor_sessions` is a separate table that avoids the conflict. Start here before any UI wiring.
**Effort:** human ~2h / CC ~10min
**Blocked by:** Validate the core loop first (run 3+ sessions and confirm projects match actual gaps)

### Wire project assignment to plan/project UI
**What:** After a tutor session, the generated project should surface in /project. Requires either removing `UNIQUE(user_id)` from `projects` table or a separate UI path reading from `tutor_sessions`.
**Why:** Currently the project card appears once in the tutor page and is gone. To complete the proof loop, the user needs to see and track what they were assigned.
**Context:** Decision point: unified projects table (schema migration) vs separate tutor projects view (simpler, no migration). Recommend unified after tutor_sessions is added.
**Effort:** human ~3h / CC ~20min
**Depends on:** tutor_sessions DB persistence (above)
