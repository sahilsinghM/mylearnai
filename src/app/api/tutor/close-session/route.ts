import { type NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildCloseSessionPrompt, extractJsonFromResponse, TUTOR_MODEL } from "@/lib/anthropic/prompts";
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

  const context = await getWeekContext(user.id);
  if (!context) return NextResponse.json({ error: "No active plan" }, { status: 400 });

  const body = await request.json();
  const parse = bodySchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { conversationHistory } = parse.data;

  const assistantTurns = conversationHistory.filter((m) => m.role === "assistant");
  if (assistantTurns.length < 1) {
    return NextResponse.json({ error: "Session too short" }, { status: 400 });
  }

  // XML-delimited transcript so Claude doesn't execute instructions embedded in message content
  const transcript = conversationHistory
    .map((m) => m.role === "user"
      ? `<student>${m.content}</student>`
      : `<mentor>${m.content}</mentor>`
    )
    .join("\n\n");

  let rawResponse = "";
  try {
    const message = await anthropic.messages.create({
      model: TUTOR_MODEL,
      max_tokens: 1024,
      system: buildCloseSessionPrompt(context.weekTopic),
      messages: [{ role: "user", content: `Transcript:\n\n${transcript}` }],
    });

    rawResponse = message.content[0]?.type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(extractJsonFromResponse(rawResponse));
    const validated = sessionResultSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("Session result schema mismatch:", validated.error, "Raw:", rawResponse);
      return NextResponse.json({ error: "Session summary failed" }, { status: 500 });
    }

    const { gaps, projectAssignment } = validated.data;

    const { error: dbErr } = await supabase.from("tutor_sessions").insert({
      user_id: user.id,
      week_topic: context.weekTopic,
      gaps,
      project_title: projectAssignment.title,
      project_desc: projectAssignment.description,
      acceptance_criteria: projectAssignment.acceptance_criteria,
    });
    if (dbErr) {
      console.error("Session save failed:", dbErr);
      return NextResponse.json({ error: "Session save failed — please try again" }, { status: 500 });
    }
    revalidatePath("/proof");

    return NextResponse.json(validated.data);
  } catch (err) {
    console.error("Close session error:", err, "Raw:", rawResponse);
    return NextResponse.json({ error: "Session summary failed" }, { status: 500 });
  }
}
