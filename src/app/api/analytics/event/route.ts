import { NextRequest, NextResponse } from "next/server";

interface EventRequest {
  event: string;
  properties?: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const body: EventRequest = await request.json();
    const { event, properties } = body;

    if (!event) {
      return NextResponse.json(
        { error: "event name is required" },
        { status: 400 }
      );
    }

    // Log to console for v1
    console.log(`[ANALYTICS] Event: ${event}`, properties || {});

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
