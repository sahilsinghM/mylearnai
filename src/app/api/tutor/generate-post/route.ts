import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/tutor/rate-limit";
import { TUTOR_MODEL } from "@/lib/anthropic/prompts";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const gapSchema = z.object({
  concept: z.string(),
  severity: z.enum(["low", "med", "high"]),
  evidence: z.string(),
});

const bodySchema = z.object({
  weekTopic: z.string(),
  gaps: z.array(gapSchema).min(1),
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

  const { allowed } = checkRateLimit(`generate-post:${user.id}`, 5);
  if (!allowed) return NextResponse.json({ error: "Rate limited" }, { status: 429 });

  const body = await request.json();
  const parse = bodySchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: "Invalid input — at least 1 gap required" }, { status: 400 });
  }

  const { weekTopic, gaps, projectAssignment } = parse.data;
  const proofLine = projectAssignment.acceptance_criteria[0] ?? projectAssignment.title;

  const gapList = gaps.map((g) => `- ${g.concept} (${g.severity} severity)`).join("\n");

  const prompt = `Write a LinkedIn post (150–200 words) for an AI engineer who just completed a Socratic tutoring session on "${weekTopic}".

They identified these knowledge gaps during the session:
${gapList}

They are building this project to prove their understanding:
Title: ${projectAssignment.title}
Description: ${projectAssignment.description}

Their proof line (first acceptance criterion): ${proofLine}

Requirements:
- Tone: practitioner-to-practitioner, not humble-brag
- Lead with the specific thing they learned, not "I explored" or "I dove into"
- Be concrete about what was hard or surprising
- End with the proof line verbatim and a note that the project is on GitHub
- Do not use hashtags or emojis
- Output only the post text, no preamble`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const message = await anthropic.messages.create(
      {
        model: TUTOR_MODEL,
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      },
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    const postDraft = message.content[0]?.type === "text" ? message.content[0].text.trim() : null;
    return NextResponse.json({ postDraft, proofLine });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ postDraft: null, proofLine });
  }
}
