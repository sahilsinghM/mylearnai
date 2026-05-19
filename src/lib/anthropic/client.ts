import Anthropic from "@anthropic-ai/sdk";
import { claudePlanSchema, type ClaudePlanOutput } from "./schemas";
import { extractJsonFromResponse, SYSTEM_PROMPT } from "./prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function generatePlan(userPrompt: string): Promise<ClaudePlanOutput> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonText = extractJsonFromResponse(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${rawText.slice(0, 200)}`);
  }

  const result = claudePlanSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`Plan schema validation failed: ${JSON.stringify(result.error.issues)}`);
  }

  return result.data;
}
