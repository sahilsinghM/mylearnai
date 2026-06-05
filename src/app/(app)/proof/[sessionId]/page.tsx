import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProofClient } from "./ProofClient";

interface ProofPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ProofPage({ params }: ProofPageProps) {
  const { sessionId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return notFound();

  const { data: session } = await supabase
    .from("tutor_sessions")
    .select("id, gaps, acceptance_criteria, project_title, project_description, github_url")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (!session) return notFound();

  // Pass initialData only when gaps are ready; null means still processing → client will poll
  const initialData = session.gaps !== null ? session : null;

  return <ProofClient sessionId={sessionId} initialData={initialData} />;
}
