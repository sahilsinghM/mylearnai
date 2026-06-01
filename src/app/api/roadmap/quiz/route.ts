import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { runAdaptationAgent } from "@/lib/roadmap/runAdaptationAgent";

const bodySchema = z.object({
  nodeId: z.string().min(1),
  quizScore: z.number().min(0).max(1),
  projectSubmitted: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parse = bodySchema.safeParse(await request.json());
  if (!parse.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const admin = await createAdminClient();
  const { nodeId, quizScore, projectSubmitted } = parse.data;
  const { data: currentState } = await admin
    .from("user_node_states")
    .select("quiz_score_best, quiz_attempts, project_submitted")
    .eq("user_id", user.id)
    .eq("node_id", nodeId)
    .maybeSingle();
  if (!currentState) return NextResponse.json({ error: "Node not found" }, { status: 404 });

  const { error } = await admin
    .from("user_node_states")
    .update({
      quiz_score_best: Math.max(currentState.quiz_score_best ?? 0, quizScore),
      quiz_attempts: currentState.quiz_attempts + 1,
      project_submitted: currentState.project_submitted || projectSubmitted,
    })
    .eq("user_id", user.id)
    .eq("node_id", nodeId);
  if (error) return NextResponse.json({ error: "Quiz update failed" }, { status: 500 });

  after(async () => {
    const agent = await createAdminClient();
    await runAdaptationAgent(agent, user.id, nodeId);
  });

  return NextResponse.json({ ok: true });
}
