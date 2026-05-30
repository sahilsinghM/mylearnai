import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { TutorChat } from "@/components/tutor/TutorChat";
import { getWeekContext } from "@/lib/tutor/context";
import Link from "next/link";
import { redirect } from "next/navigation";

const TOPICS = [
  "Transformers: attention mechanism and positional encoding",
  "Training dynamics: loss curves, learning rate schedules, gradient clipping",
  "Tokenization: BPE, SentencePiece, vocabulary tradeoffs",
  "Fine-tuning: LoRA, QLoRA, full fine-tune tradeoffs",
  "RAG: chunking, retrieval, reranking",
  "Evaluation: BLEU, ROUGE, LLM-as-judge, human eval design",
  "RLHF: reward modeling, PPO, DPO",
  "Inference optimization: KV cache, quantization, speculative decoding",
  "Agents: ReAct, tool use, multi-step planning",
  "Memory architectures: context window, external memory, retrieval",
  "Multimodal: vision encoders, cross-attention, CLIP",
  "Distributed training: data parallelism, model parallelism, ZeRO",
  "Prompt engineering: chain-of-thought, few-shot, system prompt design",
  "Safety and alignment: RLHF limits, Constitutional AI, red-teaming",
  "Interpretability: attention visualization, probing, circuits",
  "Embeddings: similarity search, FAISS, dense vs sparse retrieval",
  "LLM architecture variants: Mamba, mixture-of-experts, sparse attention",
  "Research reading: how to read a paper in 30 minutes",
  "Contribution: how to write a research note or blog post from a project",
  "Portfolio: how frontier lab recruiters evaluate GitHub and LinkedIn",
];

export default async function TutorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const context = await getWeekContext(user.id);

  if (!context) {
    return (
      <div>
        <TopBar title="Tutor" />
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            No active plan found.{" "}
            <Link href="/plan" className="text-primary underline underline-offset-2">
              Generate your plan
            </Link>{" "}
            to start a session.
          </p>
        </div>
      </div>
    );
  }

  let sessionCount = 0;
  try {
    const { count } = await supabase
      .from("tutor_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    sessionCount = count ?? 0;
  } catch {
    sessionCount = 0;
  }

  const dailyTopic = TOPICS[sessionCount % TOPICS.length];

  return (
    <div>
      <TopBar
        title="Tutor"
        subtitle={`Week ${context.weekNumber} — ${context.weekTopic}`}
      />
      <div className="px-6 pt-4 pb-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Today: </span>
          {dailyTopic}.{" "}
          {sessionCount === 0
            ? "Start your first session."
            : "Suggested based on your progress."}
        </p>
      </div>
      <TutorChat weekTopic={context.weekTopic} weekNumber={context.weekNumber} />
    </div>
  );
}
