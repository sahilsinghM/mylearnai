# API Reference

All endpoints require authentication via Supabase session cookie unless marked **public**.

Base path: `https://your-domain.com/api`

---

## Onboarding

### `POST /api/onboarding`

Completes onboarding: saves the user profile, generates a personalized roadmap, generates a 7-day plan via Claude, and persists all rows.

**Request body:**

```typescript
{
  programmingLevel: "beginner" | "intermediate" | "senior" | "staff"
  languages: string[]
  aimlFamiliarity: "none" | "heard_of" | "used_tools" | "built_models" | "researcher"
  mathConfidence: "low" | "medium" | "high" | "phd"
  goals: string[]            // e.g. ["build_products", "transition_role"]
  hoursPerDay: number        // 1–12
  interestAreas: string[]
  familiarTopics: string[]
  topicDepth: string         // e.g. "can_explain" | "have_implemented"
}
```

**Response `201`:**

```typescript
{
  planId: string        // UUID of the created learning_plans row
  projectId: string     // UUID of the created projects row
  roadmapReveal: {
    skippedNodes: { nodeId: string; title: string; reason: string }[]
    startingNode: { nodeId: string; title: string; depthTarget: string; scheduledWeek: number } | null
    nextNodes: { nodeId: string; title: string; depthTarget: string; scheduledWeek: number }[]
    estimatedTotalWeeks: number
  }
}
```

**Errors:** `400 Invalid input` · `401 Unauthorized` · `500 Internal error`

---

### `POST /api/onboarding/stream`

Streams plan generation as Server-Sent Events (SSE). Used by the `GeneratingPlan` component to show progress while the Claude call runs.

**Request body:** Same shape as `POST /api/onboarding`.

**Response:** SSE stream. Events:
- `{ type: "progress", step: string }` — status updates during generation
- `{ type: "done", planId: string, projectId: string }` — final completion

---

## Plan

### `GET /api/plan/current`

Returns the user's active learning plan with all days and tasks.

**Response `200`:**

```typescript
{
  plan: {
    id: string
    weekNumber: number
    difficulty: "gentle" | "normal" | "accelerated"
    startsOn: string   // ISO date
    endsOn: string     // ISO date
    days: {
      id: string
      dayNumber: number
      dateOn: string
      theme: string
      summary: string | null
      status: "pending" | "in_progress" | "completed" | "skipped"
      tasks: {
        id: string
        position: number
        type: "study" | "build" | "review" | "exercise"
        title: string
        description: string | null
        resourceUrl: string | null
        durationMin: number | null
        difficulty: "easy" | "medium" | "hard"
        status: "pending" | "completed" | "skipped" | "failed"
      }[]
    }[]
  } | null
}
```

---

### `POST /api/plan/adapt`

Generates a new 7-day plan as a continuation of the current week. Supersedes the active plan.

**Request body:**

```typescript
{
  signals: {
    completionRate: number       // 0–100
    tooEasyCount: number
    tooHardCount: number
    skipCount: number
    failCount: number
    totalTasks: number
  }
}
```

**Response `200`:**

```typescript
{ planId: string }
```

---

## Tasks

### `PATCH /api/tasks/[taskId]`

Updates a task's status and optionally records a difficulty signal.

**Request body:**

```typescript
{
  status: "completed" | "skipped" | "failed"
  difficultyFelt?: "too_easy" | "just_right" | "too_hard"
  note?: string
}
```

**Response `200`:** `{ ok: true }`

---

## Milestones

### `PATCH /api/milestones/[milestoneId]`

Marks a project milestone as completed or reverts it to pending.

**Request body:**

```typescript
{ status: "completed" | "pending" }
```

**Response `200`:** `{ ok: true }`

---

## Tutor

### `POST /api/tutor/chat`

Returns a Socratic question with multiple-choice answers. Rate-limited to 30 requests per user per minute.

**Request body:**

```typescript
{
  conversationHistory: { role: "user" | "assistant"; content: string }[]  // max 50 messages
  weekTopic?: string   // optional override; defaults to active plan's week topic
}
```

**Response `200`:**

```typescript
{
  question: string
  choices: { text: string }[]   // 3 choices: solid → shaky → wrong
}
```

**Errors:** `400 Topic required` · `429 Rate limited` · `500 Chat failed`

**Notes:**
- `weekTopic` is sanitized (strips `\n\r<>`, max 200 chars) before use in the system prompt.
- On the first turn, pass an empty `conversationHistory`. The server injects a bootstrap user turn.
- Schema validation failure falls back to `{ question: rawText, choices: [] }` rather than 500.

---

### `POST /api/tutor/close-session`

Analyzes the full session transcript and returns gap analysis + project assignment. Rate-limited to 10 requests per user per minute.

**Request body:**

```typescript
{
  conversationHistory: { role: "user" | "assistant"; content: string }[]
  weekTopic?: string
  sessionId?: string   // UUID — if provided, upserts to this session ID (idempotent retry)
}
```

**Response `200`:**

```typescript
{
  gaps: {
    concept: string
    severity: "low" | "med" | "high"
    evidence: string
  }[]                       // max 2 gaps (highest severity only)
  projectAssignment: {
    title: string
    description: string
    acceptance_criteria: string[]
  }
}
```

**Errors:** `400 Session too short` (need ≥1 assistant turn) · `400 Topic required` · `429 Rate limited` · `500 Session summary failed`

**Side effects:** Upserts a row into `tutor_sessions`. Calls `revalidatePath("/proof")`.

---

### `POST /api/tutor/generate-post`

Generates a LinkedIn post draft from a completed session's proof line.

**Request body:**

```typescript
{ sessionId: string }
```

**Response `200`:**

```typescript
{ post: string }   // LinkedIn post draft, ~150–250 words
```

---

## Roadmap

### `POST /api/roadmap/quiz`

Submits a quiz score for the active node. Triggers the Adaptation Agent if thresholds are met.

**Request body:**

```typescript
{
  nodeId: string
  score: number          // 0.0–1.0
  projectSubmitted?: boolean
}
```

**Response `200`:**

```typescript
{
  decision: {
    type: "INSERT" | "REMOVE"
    affectedNodeId: string
    logId: string
  } | null               // null if no adaptation decision triggered
}
```

---

### `PATCH /api/roadmap/adaptation-log/[id]`

Accepts or overrides a pending Adaptation Agent decision.

**Request body:**

```typescript
{ action: "accept" | "override" }
```

**Response `200`:** `{ ok: true }`

**Notes:** Only `pending` log entries can be mutated. `auto_applied` and `overridden` entries are immutable.

---

## Proof Trail

### `GET /api/proof`

Returns all proof entries for the current user, newest first.

**Response `200`:**

```typescript
{
  proofs: {
    id: string
    sessionId: string
    weekTopic: string
    proofLine: string
    linkedinPost: string | null
    projectSpec: {
      title: string
      description: string
      acceptanceCriteria: string[]
    }
    createdAt: string   // ISO timestamp
  }[]
}
```

---

### `POST /api/proof`

Generates and saves a proof entry from a completed `tutor_sessions` row.

**Request body:**

```typescript
{ sessionId: string }
```

**Response `201`:** `{ id: string }`

---

### `PATCH /api/proof/[id]`

Updates a proof entry's LinkedIn post or proof line.

**Request body:**

```typescript
{
  linkedinPost?: string
  proofLine?: string
}
```

**Response `200`:** `{ ok: true }`

---

## Auth

### `GET /api/auth/callback`

OAuth callback route. Handles the Supabase PKCE code exchange after email magic link or OAuth provider redirect. **Public.**

Redirects to `/dashboard` on success, `/sign-in?error=...` on failure.
