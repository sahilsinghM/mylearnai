import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildCloseSessionPrompt, extractJsonFromResponse, escapeTranscriptContent, sanitizeTopicForPrompt, TUTOR_MODEL } from "@/lib/anthropic/prompts";
import { getWeekContext } from "@/lib/tutor/context";
import { checkRateLimit } from "@/lib/tutor/rate-limit";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
});

const bodySchema = z.object({
  conversationHistory: z.array(messageSchema).max(50),
  weekTopic: z.string().max(200).optional(),
  sessionId: z.string().uuid().optional(),
});

const gapSchema = z.object({
  concept: z.string(),
  severity: z.enum(["low", "med", "high"]),
  evidence: z.string(),
});

const sessionResultSchema = z.object({
  gaps: z.array(gapSchema).max(2),
  projectAssignment: z.object({
    title: z.string(),
    description: z.string(),
    acceptance_criteria: z.array(z.string()),
  }),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = checkRateLimit(`close-session:${user.id}`, 10);
  if (!allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const body = await request.json();
  const parse = bodySchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const context = await getWeekContext(user.id);
  const { conversationHistory, weekTopic: bodyTopic, sessionId } = parse.data;
  const rawTopic = bodyTopic ?? context?.weekTopic;
  if (!rawTopic) return NextResponse.json({ error: "Topic required" }, { status: 400 });
  const weekTopic = sanitizeTopicForPrompt(rawTopic);

  const assistantTurns = conversationHistory.filter((m) => m.role === "assistant");
  if (assistantTurns.length < 1) {
    return NextResponse.json({ error: "Session too short" }, { status: 400 });
  }

  const transcript = conversationHistory
    .map((m) => m.role === "user"
      ? `<student>${escapeTranscriptContent(m.content)}</student>`
      : `<mentor>${escapeTranscriptContent(m.content)}</mentor>`
    )
    .join("\n\n");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let rawResponse = "";
  try {
    const message = await anthropic.messages.create(
      {
        model: TUTOR_MODEL,
        max_tokens: 1024,
        system: buildCloseSessionPrompt(weekTopic),
        messages: [{ role: "user", content: `Transcript:\n\n${transcript}` }],
      },
      { signal: controller.signal }
    );

    rawResponse = message.content[0]?.type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(extractJsonFromResponse(rawResponse));
    const validated = sessionResultSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("Session result schema mismatch:", validated.error, "Raw:", rawResponse);
      return NextResponse.json({ error: "Session summary failed" }, { status: 500 });
    }

    const { gaps, projectAssignment } = validated.data;

    const row = {
      ...(sessionId ? { id: sessionId } : {}),
      user_id: user.id,
      week_topic: weekTopic,
      gaps,
      project_title: projectAssignment.title,
      project_desc: projectAssignment.description,
      acceptance_criteria: projectAssignment.acceptance_criteria,
    };
    const { error: dbErr } = await supabase
      .from("tutor_sessions")
      .upsert(row, { onConflict: "id", ignoreDuplicates: true });
    if (dbErr) {
      console.error("Session save failed:", dbErr);
      return NextResponse.json({ error: "Session save failed — please try again" }, { status: 500 });
    }
    revalidatePath("/proof");

    return NextResponse.json(validated.data);
  } catch (err) {
    console.error("Close session error:", err, "Raw:", rawResponse);
    return NextResponse.json({ error: "Session summary failed" }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
