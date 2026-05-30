# CEO Review: Socratic Tutor Feature
Date: 2026-05-21 | Branch: claude/deeppath-ai-learning-system-dFrew | Mode: SCOPE_REDUCTION

---

## What We're Building

**Core loop:** Socratic session on your current week's AI/ML topic → gap extraction → specific project assignment.

The product is **proof**, not tutoring. The closed loop between "I think I understand" and "here is evidence I do."

Source design doc: `docs/gstack/deeppath-ai-learning-system-dFrew-design-20260520-100553.md`

---

## Critical Bug Found (Before Writing Any Code)

The `projects` table has `user_id UUID NOT NULL UNIQUE` — only one project per user is allowed. The original design planned to save tutor projects there, but every user already has a Vector Search project from onboarding. Any insert would 500.

**Decision:** No DB persistence in this phase. Validate the loop first. Revisit after.

---

## Scope Decisions

| # | Item | Decision | Reason |
|---|------|----------|--------|
| 1 | DB persistence (tutor_sessions table) | DEFERRED | Validate concept first; projects table has UNIQUE conflict |
| 2 | Curriculum week selector UI | CUT | Auto-detect from active plan instead |
| 3 | 50-turn conversation trim | DEFERRED | Personal use won't hit it |
| 4 | Plan/project UI wiring | DEFERRED | After personal validation |
| 5 | Stream error handling | ACCEPTED | Prevents hang on API timeout |
| 6 | Empty session guard (< 1 AI turn → 400) | ACCEPTED | Prevents garbage gap extraction |
| 7 | isEnding state (disable button mid-flight) | ACCEPTED | Prevents double-submit |
| 8 | Week topic display at top of chat | ACCEPTED | Makes session feel intentional |
| 9 | TypeScript types for Gap + ProjectAssignment | ACCEPTED | Avoids `any` at route/component boundary |
| 10 | Prompts in lib/anthropic/prompts.ts | ACCEPTED | Consistent with existing codebase |

---

## Files to Create (4 total)

### 1. `src/types/tutor.ts` (new)
TypeScript interfaces shared between the API routes and the UI component.

```typescript
export interface Gap {
  concept: string;
  severity: 'low' | 'med' | 'high';
  evidence: string;
}

export interface ProjectAssignment {
  title: string;
  description: string;
  acceptance_criteria: string[];
}

export interface TutorSessionResult {
  gaps: Gap[];
  projectAssignment: ProjectAssignment;
}
```

### 2. `src/app/(app)/tutor/page.tsx` (new)
Chat UI. Key elements:
- Fetch week topic from `/api/plan/current` on load (server component or useEffect)
- Display: "Week {plan.week_number} — {day.theme}" at top
- Message thread (useState)
- Input + Send button (disable if empty)
- "End Session" button with `isEnding` state
- Loading state: "Analyzing your session..." while close-session is in-flight
- Post-success: hide input/button, show project assignment card + proof line
- Error state: inline message with retry option

**Note:** Route group is `(app)` not `(dashboard)` — the design doc had a typo.

### 3. `src/app/api/tutor/chat/route.ts` (new)
Streaming Socratic session.

```
Auth: createClient() + getUser() → 401 if null
Validation: Zod schema for { weekTopic: string, conversationHistory: Message[] }
Stream: Next.js ReadableStream, text/event-stream, raw text chunks (NOT JSON)
Error handling: try/catch inside stream → emit { type: 'error', message: '...' } and close
Prompt: from lib/anthropic/prompts.ts (buildTutorSystemPrompt)
```

**System prompt (from design doc):**
```
You are a rigorous mentor tutoring an engineer on: {weekTopic}.
Context: They are on Week {weekNumber} of their AI/ML learning path.

Rules:
- Ask ONE question at a time. Never give explanations or answers unprompted.
- Start with a foundational question on {weekTopic}.
- When they answer correctly, probe deeper or adjacent.
- When they fumble, ask a clarifying question that exposes the gap — never fill it in.
- Keep responses short (1-3 sentences max).
- Never say "great answer" or give praise — just probe further.
- Continue until the user ends the session.
```

### 4. `src/app/api/tutor/close-session/route.ts` (new)
Gap extraction + project assignment. Standard JSON response (not streamed).

```
Auth: createClient() + getUser() → 401 if null
Guard: if conversationHistory has < 1 assistant message → 400 { error: "Session too short" }
Claude call: single bundled call (gap extraction + project generation)
JSON parse: try/catch → 500 { error: "Session summary failed" } on failure
Logging: console.log gaps + project title for inspection
Response: { gaps: Gap[], projectAssignment: ProjectAssignment }
```

**Close-session prompt:**
```
System: You are analyzing a Socratic tutoring transcript on {weekTopic}.
Output JSON only (no prose):
{
  "gaps": [{ "concept": string, "severity": "low|med|high", "evidence": string }],
  "projectAssignment": {
    "title": string,
    "description": string,
    "acceptance_criteria": string[]
  }
}
Rules:
- Maximum 2 gaps (highest severity only)
- Project MUST be derived from the gaps, not generic to the topic
- Acceptance criteria are checkable by running code or inspecting output
- If gaps are too scattered, pick the one gap with the most fumbled turns
```

---

## Implementation Notes

### Auth pattern (consistent across all routes)
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

### Week topic auto-detection
```typescript
// GET /api/plan/current returns: { plan: { week_number, status, ... }, days: [...] }
// Use theme of earliest in_progress day, or first pending day
const activePlan = await fetch('/api/plan/current');
const { plan, days } = await activePlan.json();
const activeDay = days.find(d => d.status === 'in_progress') ?? days.find(d => d.status === 'pending');
const weekTopic = activeDay?.theme ?? null;
// If null: show "No active plan" with link to /plan, disable chat
```

### Streaming client consumption
```typescript
// fetch + TextDecoder + ReadableStream.getReader() — NOT EventSource
const res = await fetch('/api/tutor/chat', { method: 'POST', body: ... });
const reader = res.body.getReader();
const decoder = new TextDecoder();
// read chunks, parse SSE lines, append to message
```

### Proof line display
```
"Your proof: {acceptance_criteria[0]}"
```
Must be concrete and runnable — e.g. "loss curve shows degradation when X is removed" not "understands X."

---

## Error Handling Map

| Route | Failure | Response | User sees |
|---|---|---|---|
| /tutor/chat | Auth missing | 401 | Redirect to login |
| /tutor/chat | Invalid input | 400 | "Invalid session" |
| /tutor/chat | Anthropic error | SSE error event | "Session interrupted — try again" |
| /tutor/close-session | Auth missing | 401 | Redirect |
| /tutor/close-session | < 1 AI turn | 400 | "Have at least one exchange first" |
| /tutor/close-session | Anthropic error | 500 | "Couldn't generate — try again" |
| /tutor/close-session | JSON parse fail | 500 | "Couldn't generate — try again" |
| Page load | No active plan | — | "No active plan" + /plan link |

---

## Manual Acceptance Test

Run these 5 checks before calling the feature done:

1. Open `/tutor` → week topic and number visible at top of chat
2. Send 3 messages → streaming AI responses arrive in real time
3. Click "End Session" → loading spinner → project assignment card appears with proof line
4. Click "End Session" before any exchange → inline error "Have at least one exchange first"
5. Double-click "End Session" → second click is disabled while in-flight

---

## What's Deferred (TODOS.md)

### P2 — tutor_sessions DB table
After validating the loop across 3+ sessions, add:
```sql
CREATE TABLE tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_topic TEXT NOT NULL,
  gaps JSONB NOT NULL,
  project_assignment JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
Update close-session to INSERT after successful Claude call.

### P2 — Wire project assignment to plan/project UI
After DB persistence is done, surface tutor projects in `/project`. Decision point at that stage: unified projects table (remove UNIQUE constraint) vs separate tutor project view.

---

## What Reuses Existing Code

| New code needs | Existing code | Location |
|---|---|---|
| SSE streaming pattern | onboarding/stream route | `src/app/api/onboarding/stream/route.ts` |
| Auth pattern | all existing routes | `createClient()` + `getUser()` |
| Week topic data | plan current route | `src/app/api/plan/current/route.ts` |
| JSON extraction from Claude | extractJsonFromResponse | `src/lib/anthropic/prompts.ts` |
| Claude client | existing client | `src/lib/anthropic/client.ts` |

---

## Next Step

Run `/plan-eng-review` — the required gate before writing code. It stress-tests the streaming architecture, Zod schemas, and TypeScript types.
