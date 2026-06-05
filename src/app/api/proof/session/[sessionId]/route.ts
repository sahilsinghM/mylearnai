import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;

  const { data: session, error } = await supabase
    .from("tutor_sessions")
    .select("id, gaps, acceptance_criteria, project_title, project_description, github_url")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Return 404 if session data is still being processed (gaps not yet populated)
  if (!session.gaps) {
    return NextResponse.json({ error: "Not ready" }, { status: 404 });
  }

  return NextResponse.json(session);
}
