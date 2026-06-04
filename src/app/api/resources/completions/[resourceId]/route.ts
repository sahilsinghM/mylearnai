import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resourceId } = await params;
  if (!resourceId) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { error } = await supabase
    .from("user_resource_completions")
    .delete()
    .eq("user_id", user.id)
    .eq("resource_id", resourceId);

  if (error) return NextResponse.json({ error: "Failed to unmark completion" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
