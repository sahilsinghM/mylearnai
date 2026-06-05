import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Only events fired by our own client code are valid. Reject anything else.
const ALLOWED_EVENTS = new Set(["session_started", "proof_project_submitted"]);

function stripControlChars(s: string): string {
  // Remove ASCII control characters (including \r, \n, \x00-\x1f) and ANSI escapes
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\x00-\x1f\x7f]|\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: true }); // silently drop unauthenticated events

    const body = await request.json();
    const event: unknown = body?.event;

    if (typeof event !== "string" || event.length > 100) {
      return NextResponse.json({ error: "invalid event" }, { status: 400 });
    }

    if (!ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: "unknown event" }, { status: 400 });
    }

    const safeEvent = stripControlChars(event);

    // Log as structured JSON to prevent log injection via newlines/control chars
    console.log(JSON.stringify({ type: "analytics", event: safeEvent, userId: user.id }));

    // TODO: Insert into analytics_events table when available
    // const { createClient } = await import("@/lib/supabase/server");
    // const supabase = createClient();
    // const { error } = await supabase
    //   .from("analytics_events")
    //   .insert({ event, properties });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ANALYTICS ERROR]", error);
    // Silently succeed even on error — analytics should never block user experience
    return NextResponse.json({ ok: true });
  }
}
