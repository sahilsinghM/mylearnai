import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildTutorSystemPrompt, extractJsonFromResponse, sanitizeTopicForPrompt, TUTOR_MODEL, TUTOR_BOOTSTRAP_TURN } from "@/lib/anthropic/prompts";
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
});

const choiceSchema = z.object({ text: z.string() });

const responseSchema = z.object({
  question: z.string(),
  choices: z.array(choiceSchema).min(2).max(4),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { allowed } = checkRateLimit(`chat:${user.id}`, 30);
  if (!allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const body = await request.json();
  const parse = bodySchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const context = await getWeekContext(user.id);
  const { conversationHistory, weekTopic } = parse.data;
  const rawTopic = weekTopic ?? context?.weekTopic;
  if (!rawTopic) return NextResponse.json({ error: "Topic required" }, { status: 400 });
  const topic = sanitizeTopicForPrompt(rawTopic);
  const systemPrompt = buildTutorSystemPrompt(topic, context?.weekNumber ?? 1);

  const messages = conversationHistory.length === 0
    ? [{ role: "user" as const, content: TUTOR_BOOTSTRAP_TURN }]
    : conversationHistory;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const message = await anthropic.messages.create(
      {
        model: TUTOR_MODEL,
        max_tokens: 512,
        system: systemPrompt,
        messages,
      },
      { signal: controller.signal }
    );

    const raw = message.content[0]?.type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(extractJsonFromResponse(raw));
    const validated = responseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("Tutor response schema mismatch:", validated.error, "Raw:", raw);
      // Fallback: treat the raw text as the question with no choices
      return NextResponse.json({ question: raw, choices: [] });
    }

    return NextResponse.json(validated.data);
  } catch (err) {
    console.error("Tutor chat error:", err);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
