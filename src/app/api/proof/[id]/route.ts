import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const patchSchema = z.object({
  proof_line: z.string().max(2000).optional(),
  github_url: z.string().url().optional().or(z.literal("")),
  linkedin_published: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parse = patchSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (parse.data.proof_line !== undefined) updates.proof_line = parse.data.proof_line;
  if (parse.data.github_url !== undefined) updates.github_url = parse.data.github_url || null;
  if (parse.data.linkedin_published !== undefined) updates.linkedin_published = parse.data.linkedin_published;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("tutor_sessions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
