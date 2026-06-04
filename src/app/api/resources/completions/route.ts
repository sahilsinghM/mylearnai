import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const bodySchema = z.object({
  resourceId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parse = bodySchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { error } = await supabase
    .from("user_resource_completions")
    .upsert(
      { user_id: user.id, resource_id: parse.data.resourceId },
      { onConflict: "user_id,resource_id", ignoreDuplicates: true }
    );

  if (error) return NextResponse.json({ error: "Failed to mark completion" }, { status: 500 });

  return NextResponse.json({ ok: true });
}
