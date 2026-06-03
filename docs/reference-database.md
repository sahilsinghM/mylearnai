# Database Reference

DeepPath uses Supabase Postgres. All user-owned tables have Row Level Security (RLS) enabled. The six migration files in `supabase/migrations/` must be applied in order.

## Migrations

| File | Contents |
|------|----------|
| `001_initial_schema.sql` | Core tables: profiles, onboarding_profiles, learning_plans, plan_days, tasks, task_events, projects, milestones |
| `002_rls_policies.sql` | RLS policies for the tables above |
| `003_tutor_sessions.sql` | `tutor_sessions` table |
| `004_master_roadmap.sql` | `master_roadmap_nodes`, `master_roadmap_edges`, `master_roadmap_resources`, `master_roadmap_projects` |
| `005_master_roadmap_seed.sql` | Initial 33-node curriculum data |
| `006_user_roadmaps.sql` | `user_roadmaps`, `user_node_states`, `roadmap_adaptation_log` |

---

## Tables

### `profiles`

Extends `auth.users`. Auto-created by trigger on user signup.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | References `auth.users(id)` |
| `email` | TEXT | |
| `display_name` | TEXT | Nullable |
| `onboarding_completed_at` | TIMESTAMPTZ | Set at end of onboarding |
| `created_at` | TIMESTAMPTZ | |

---

### `onboarding_profiles`

Stores the answers from the onboarding wizard. One row per user.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID UNIQUE FK → profiles | |
| `programming_level` | TEXT | `beginner \| intermediate \| senior \| staff` |
| `languages` | TEXT[] | |
| `aiml_familiarity` | TEXT | `none \| heard_of \| used_tools \| built_models \| researcher` |
| `math_confidence` | TEXT | `low \| medium \| high \| phd` |
| `goals` | TEXT[] | |
| `hours_per_day` | SMALLINT | 1–12 |
| `interest_areas` | TEXT[] | |
| `courses_taken` | TEXT[] | Nullable; stored as `"topic [depth]"` strings |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |

---

### `learning_plans`

One row per generated plan. A user can have multiple plans; the active one has `status = 'active'`.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID FK → profiles | |
| `week_number` | SMALLINT | Starting at 1 |
| `status` | TEXT | `active \| completed \| superseded` |
| `difficulty` | TEXT | `gentle \| normal \| accelerated` |
| `plan_json` | JSONB | Full Claude-generated plan (days + tasks + project) |
| `generated_at` | TIMESTAMPTZ | |
| `starts_on` | DATE | |
| `ends_on` | DATE | `starts_on + 6 days` |
| `claude_model` | TEXT | Default `claude-sonnet-4-6` |

**Index:** `idx_learning_plans_user_status (user_id, status)`

---

### `plan_days`

Seven rows per plan (one per day).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID PK | |
| `plan_id` | UUID FK → learning_plans | |
| `user_id` | UUID FK → profiles | |
| `day_number` | SMALLINT | 1–7; UNIQUE per plan |
| `date_on` | DATE | |
| `theme` | TEXT | One-line topic for the day |
| `summary` | TEXT | Nullable |
| `status` | TEXT | `pending \| in_progress \| completed \| skipped` |

**Index:** `idx_plan_days_plan_id`

---

### `tasks`

Individual study/build/review tasks within a day. Multiple rows per `plan_day`.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID PK | |
| `plan_day_id` | UUID FK → plan_days | |
| `user_id` | UUID FK → profiles | |
| `position` | SMALLINT | Order within day; UNIQUE per day |
| `type` | TEXT | `study \| build \| review \| exercise` |
| `title` | TEXT | |
| `description` | TEXT | Nullable |
| `resource_url` | TEXT | Nullable |
| `duration_min` | SMALLINT | Nullable |
| `difficulty` | TEXT | `easy \| medium \| hard` |
| `status` | TEXT | `pending \| completed \| skipped \| failed` |
| `completed_at` | TIMESTAMPTZ | Nullable |

**Indexes:** `idx_tasks_plan_day_id` · `idx_tasks_user_status (user_id, status)`

---

### `task_events`

Append-only log of task status changes. Feeds adaptation signals.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID FK → profiles | |
| `task_id` | UUID FK → tasks | |
| `event_type` | TEXT | `completed \| skipped \| failed \| reopened` |
| `difficulty_felt` | TEXT | Nullable: `too_easy \| just_right \| too_hard` |
| `note` | TEXT | Nullable |
| `created_at` | TIMESTAMPTZ | |

**Index:** `idx_task_events_user (user_id, created_at DESC)`

---

### `projects`

One active project per user. Created alongside the first learning plan.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID PK | |
| `user_id` | UUID UNIQUE FK → profiles | One project per user |
| `plan_id` | UUID FK → learning_plans | |
| `name` | TEXT | Defaults to `"Build a Vector Search Engine from Scratch"` |
| `description` | TEXT | Nullable |
| `status` | TEXT | `active \| completed` |
| `started_at` | TIMESTAMPTZ | |
| `completed_at` | TIMESTAMPTZ | Nullable |

---

### `milestones`

Six milestones per project (required by plan generation constraints).

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | UUID PK | |
| `project_id` | UUID FK → projects | |
| `user_id` | UUID FK → profiles | |
| `position` | SMALLINT | 1–6; UNIQUE per project |
| `title` | TEXT | |
| `description` | TEXT | Nullable |
| `status` | TEXT | `pending \| completed` |
| `completed_at` | TIMESTAMPTZ | Nullable |

**Index:** `idx_milestones_project (project_id, position)`

---

### `tutor_sessions`

One row per completed Socratic tutoring session.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Client may supply on close-session for idempotent upsert |
| `user_id` | UUID FK → profiles | |
| `week_topic` | TEXT | Sanitized topic string |
| `gaps` | JSONB | `[{ concept, severity, evidence }]` — max 2 entries |
| `project_title` | TEXT | From Claude's `projectAssignment.title` |
| `project_desc` | TEXT | |
| `acceptance_criteria` | TEXT[] | Checkable criteria for the project |
| `created_at` | TIMESTAMPTZ | |

---

### `master_roadmap_nodes`

The human-curated AI/ML curriculum. 33 rows in the seed. AI agents read; humans write via migrations.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug, e.g. `transformer-self-attention` |
| `title` | TEXT | |
| `blurb` | TEXT | One-sentence description |
| `phase` | INT | 1–7 |
| `row_index` | INT | Order within phase |
| `difficulty` | INT | 1–5 |
| `hours_awareness` | INT | Estimated hours at awareness depth |
| `hours_working` | INT | |
| `hours_fluent` | INT | |
| `hours_expert` | INT | |
| `relevance_fintech` | FLOAT | 0.0–1.0 domain relevance score |
| `relevance_research` | FLOAT | |
| `relevance_mlops` | FLOAT | |
| `relevance_dev_tools` | FLOAT | |
| `relevance_education_ai` | FLOAT | |
| `skip_for_levels` | TEXT[] | Programming levels at which this node is auto-skipped |
| `depth_awareness` | TEXT | Nullable — what "awareness" means for this node |
| `depth_working` | TEXT | Nullable |
| `depth_fluent` | TEXT | Nullable |
| `depth_expert` | TEXT | Nullable |
| `is_published` | BOOLEAN | Only published nodes are returned by `getMasterRoadmap()` |

---

### `master_roadmap_edges`

Directed edges between Master Nodes.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `from_node_id` | TEXT FK → master_roadmap_nodes | |
| `to_node_id` | TEXT FK → master_roadmap_nodes | |
| `edge_type` | TEXT | `required \| recommended \| contextual` |

**Edge type semantics:**
- `required` — hard prerequisite. Target node is `locked` until source reaches `working` depth. Source is never skipped during personalization even if `skipForLevels` matches.
- `recommended` — source aids understanding. Included by default; user can defer.
- `contextual` — useful context but not required.

---

### `master_roadmap_resources`

Curated resources per node, per depth level.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `node_id` | TEXT FK → master_roadmap_nodes | |
| `title` | TEXT | |
| `url` | TEXT | |
| `resource_type` | TEXT | Nullable: `paper \| video \| blog \| docs \| book` |
| `depth_level` | TEXT | `awareness \| working \| fluent \| expert` |
| `estimated_minutes` | INT | Nullable |
| `is_free` | BOOLEAN | |

---

### `master_roadmap_projects`

Curated projects per node. Used as grounding for weekly plan generation.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `node_id` | TEXT FK → master_roadmap_nodes | |
| `title` | TEXT | |
| `description` | TEXT | |
| `depth_level` | TEXT | `working \| fluent \| expert` (not `awareness`) |
| `deliverable` | TEXT | Nullable — concrete expected output |
| `estimated_hours` | FLOAT | Nullable |

---

### `user_roadmaps`

One row per user. Tracks which Master Node is currently active.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | UUID PK FK → profiles | |
| `active_node_id` | TEXT FK → master_roadmap_nodes | Nullable |
| `status` | TEXT | `active \| paused \| completed` |
| `generated_at` | TIMESTAMPTZ | |
| `agent_version` | TEXT | Default `v1` — for future schema migrations |

**RLS:** Users can SELECT and UPDATE their own row only.

---

### `user_node_states`

Per-user state for every node in the Personalized Roadmap.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → profiles | |
| `node_id` | TEXT FK → master_roadmap_nodes | UNIQUE per user+node |
| `state` | TEXT | `locked \| available \| in_progress \| completed \| skipped \| deferred` |
| `depth_target` | TEXT | `awareness \| working \| fluent \| expert` |
| `depth_achieved` | TEXT | Nullable |
| `quiz_score_best` | FLOAT | Nullable; 0.0–1.0 |
| `quiz_attempts` | INT | Default 0 |
| `project_submitted` | BOOLEAN | Default false |
| `skip_reason` | TEXT | Nullable — human-readable reason |
| `skip_confidence` | FLOAT | Nullable; 0.0–1.0 |
| `scheduled_week` | INT | >0 |
| `started_at` | TIMESTAMPTZ | Nullable |
| `completed_at` | TIMESTAMPTZ | Nullable |

**Index:** `idx_user_node_states_user_state (user_id, state)`
**RLS:** Users can SELECT and UPDATE their own rows only.

---

### `roadmap_adaptation_log`

Append-only audit trail of Adaptation Agent decisions. Rows are inserted when a decision is evaluated; never deleted.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK → profiles | |
| `decision_type` | TEXT | `INSERT \| REMOVE` |
| `affected_node_id` | TEXT FK → master_roadmap_nodes | |
| `change_before` | JSONB | Snapshot of state before decision |
| `change_after` | JSONB | Snapshot of intended state after |
| `triggering_signals` | JSONB | Quiz score, attempts, project_submitted at time of decision |
| `reasoning` | TEXT | Claude-generated explanation of why this decision was made |
| `confidence` | FLOAT | Nullable; 0.0–1.0 |
| `status` | TEXT | `pending \| accepted \| overridden \| auto_applied` |
| `agent_run_id` | UUID | Groups log entries from a single agent invocation |
| `created_at` | TIMESTAMPTZ | |

**Index:** `idx_roadmap_adaptation_log_user_created (user_id, created_at DESC)`
**RLS:** Users can SELECT and UPDATE (status field only) their own rows.

**Status transitions:**
- `REMOVE` decisions → `auto_applied` immediately (no user confirmation needed)
- `INSERT` decisions → `pending` until user accepts (`accepted`) or declines (`overridden`)
- Once `auto_applied` or `overridden`, the row is immutable

---

## RLS summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | own row | trigger only | own row | cascade |
| `onboarding_profiles` | own row | service role | service role | cascade |
| `learning_plans` | own row | service role | service role | cascade |
| `plan_days` | own row | service role | service role | cascade |
| `tasks` | own row | service role | service role | cascade |
| `task_events` | own row | own row | — | — |
| `projects` | own row | service role | service role | cascade |
| `milestones` | own row | service role | service role | cascade |
| `tutor_sessions` | own row | own row | own row | — |
| `master_roadmap_*` | all (public) | — | — | — |
| `user_roadmaps` | own row | service role | own row | cascade |
| `user_node_states` | own row | service role | own row | cascade |
| `roadmap_adaptation_log` | own row | service role | own row | — |

"service role" = only reachable via `createAdminClient()` in Route Handlers, not from the browser.
