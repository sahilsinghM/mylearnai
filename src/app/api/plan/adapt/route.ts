import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generatePlan } from "@/lib/anthropic/client";
import { buildAdaptationPrompt } from "@/lib/anthropic/prompts";
import { getToday, addDays } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = await createAdminClient();

    // Get current active plan
    const { data: currentPlan } = await admin
      .from("learning_plans")
      .select("id, week_number, difficulty, plan_json")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (!currentPlan) return NextResponse.json({ error: "No active plan" }, { status: 404 });

    // Get completed themes from plan days
    const { data: completedDays } = await admin
      .from("plan_days")
      .select("theme")
      .eq("plan_id", currentPlan.id)
      .eq("status", "completed");

    const completedThemes = (completedDays ?? []).map((d) => d.theme);

    // Aggregate task events for adaptation signals
    const { data: events } = await admin
      .from("task_events")
      .select("event_type, difficulty_felt")
      .eq("user_id", user.id);

    const totalTasks = events?.length ?? 0;
    const completedCount = events?.filter((e) => e.event_type === "completed").length ?? 0;
    const skipCount = events?.filter((e) => e.event_type === "skipped").length ?? 0;
    const failCount = events?.filter((e) => e.event_type === "failed").length ?? 0;
    const tooEasyCount = events?.filter((e) => e.difficulty_felt === "too_easy").length ?? 0;
    const tooHardCount = events?.filter((e) => e.difficulty_felt === "too_hard").length ?? 0;

    const signals = {
      completionRate: totalTasks > 0 ? (completedCount / totalTasks) * 100 : 80,
      tooEasyCount,
      tooHardCount,
      skipCount,
      failCount,
      totalTasks,
    };

    // Get onboarding profile for context
    const { data: onboardingProfile } = await admin
      .from("onboarding_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!onboardingProfile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    const profile = {
      programmingLevel: onboardingProfile.programming_level,
      languages: onboardingProfile.languages,
      aimlFamiliarity: onboardingProfile.aiml_familiarity,
      mathConfidence: onboardingProfile.math_confidence,
      goals: onboardingProfile.goals,
      hoursPerDay: onboardingProfile.hours_per_day,
      interestAreas: onboardingProfile.interest_areas,
      coursesTaken: onboardingProfile.courses_taken ?? [],
    };

    const previousSummary = {
      difficulty: currentPlan.difficulty,
      weekNumber: currentPlan.week_number,
      lastDayNumber: 7,
      completedThemes,
    };

    const prompt = buildAdaptationPrompt(profile as never, previousSummary, signals);
    const planJSON = await generatePlan(prompt);

    const today = getToday();
    const endsOn = addDays(today, 6);

    // Supersede current plan
    await admin
      .from("learning_plans")
      .update({ status: "superseded" })
      .eq("id", currentPlan.id);

    // Insert new plan
    const { data: newPlan, error: planError } = await admin
      .from("learning_plans")
      .insert({
        user_id: user.id,
        week_number: currentPlan.week_number + 1,
        status: "active",
        difficulty: planJSON.difficulty,
        plan_json: planJSON,
        starts_on: today,
        ends_on: endsOn,
      })
      .select("id")
      .single();

    if (planError || !newPlan) throw new Error("Failed to insert new plan");

    for (const day of planJSON.days) {
      const dateOn = addDays(today, day.dayNumber - 1);
      const { data: planDay } = await admin
        .from("plan_days")
        .insert({
          plan_id: newPlan.id,
          user_id: user.id,
          day_number: day.dayNumber,
          date_on: dateOn,
          theme: day.theme,
          summary: day.summary,
          status: "pending",
        })
        .select("id")
        .single();

      if (!planDay) continue;

      await admin.from("tasks").insert(
        day.tasks.map((t) => ({
          plan_day_id: planDay.id,
          user_id: user.id,
          position: t.position,
          type: t.type,
          title: t.title,
          description: t.description,
          resource_url: t.resourceUrl,
          duration_min: t.durationMin,
          difficulty: t.difficulty,
          status: "pending" as const,
        }))
      );
    }

    return NextResponse.json({ newPlanId: newPlan.id }, { status: 201 });
  } catch (err) {
    console.error("Adapt plan error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
