import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildTutorSystemPrompt, TUTOR_MODEL, TUTOR_BOOTSTRAP_TURN } from "@/lib/anthropic/prompts";
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

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          controller.enqueue(encoder.encode("data: unauthorized\n\n"));
          controller.close();
          return;
        }

        const { allowed } = checkRateLimit(`chat:${user.id}`, 30);
        if (!allowed) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true, code: "rate_limited" })}\n\n`));
          controller.close();
          return;
        }

        const context = await getWeekContext(user.id);
        if (!context) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true, code: "no_active_plan" })}\n\n`));
          controller.close();
          return;
        }

        const body = await request.json();
        const parse = bodySchema.safeParse(body);
        if (!parse.success) {
          controller.enqueue(encoder.encode("data: invalid-input\n\n"));
          controller.close();
          return;
        }

        const { conversationHistory } = parse.data;
        const systemPrompt = buildTutorSystemPrompt(context.weekTopic, context.weekNumber);

        // Bootstrap: if no history, inject a hidden opener prompt so Claude asks first
        const messages = conversationHistory.length === 0
          ? [{ role: "user" as const, content: TUTOR_BOOTSTRAP_TURN }]
          : conversationHistory;

        const claudeStream = anthropic.messages.stream({
          model: TUTOR_MODEL,
          max_tokens: 512,
          system: systemPrompt,
          messages,
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(`data: ${event.delta.text.replace(/\n/g, "\\n")}\n\n`));
          }
        }

        controller.close();
      } catch (err) {
        console.error("Tutor chat error:", err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
