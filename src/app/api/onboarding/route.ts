import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validations/onboarding";
import { generatePlan } from "@/lib/anthropic/client";
import { buildInitialPlanPrompt } from "@/lib/anthropic/prompts";
import { getToday, addDays } from "@/lib/utils";
import type { OnboardingProfile } from "@/types/onboarding";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parse = onboardingSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Invalid input", issues: parse.error.issues }, { status: 400 });
    }

    const profile = parse.data as OnboardingProfile;
    const admin = await createAdminClient();

    // Upsert onboarding profile
    await admin.from("onboarding_profiles").upsert({
      user_id: user.id,
      programming_level: profile.programmingLevel,
      languages: profile.languages,
      aiml_familiarity: profile.aimlFamiliarity,
      math_confidence: profile.mathConfidence,
      goals: profile.goals,
      hours_per_day: profile.hoursPerDay,
      interest_areas: profile.interestAreas,
      courses_taken: profile.coursesTaken,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    // Generate plan with Claude
    const prompt = buildInitialPlanPrompt(profile);
    const planJSON = await generatePlan(prompt);

    const today = getToday();
    const endsOn = addDays(today, 6);

    // Insert learning plan
    const { data: plan, error: planError } = await admin
      .from("learning_plans")
      .insert({
        user_id: user.id,
        week_number: 1,
        status: "active",
        difficulty: planJSON.difficulty,
        plan_json: planJSON,
        starts_on: today,
        ends_on: endsOn,
      })
      .select("id")
      .single();

    if (planError || !plan) throw new Error("Failed to insert plan");

    // Insert plan days and tasks
    for (const day of planJSON.days) {
      const dateOn = addDays(today, day.dayNumber - 1);
      const { data: planDay, error: dayError } = await admin
        .from("plan_days")
        .insert({
          plan_id: plan.id,
          user_id: user.id,
          day_number: day.dayNumber,
          date_on: dateOn,
          theme: day.theme,
          summary: day.summary,
          status: "pending",
        })
        .select("id")
        .single();

      if (dayError || !planDay) throw new Error(`Failed to insert day ${day.dayNumber}`);

      const taskRows = day.tasks.map((t) => ({
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
      }));

      await admin.from("tasks").insert(taskRows);
    }

    // Insert project and milestones
    const { data: project, error: projectError } = await admin
      .from("projects")
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        name: planJSON.project.name,
        description: planJSON.project.description,
        status: "active",
      })
      .select("id")
      .single();

    if (projectError || !project) throw new Error("Failed to insert project");

    const milestoneRows = planJSON.project.milestones.map((m) => ({
      project_id: project.id,
      user_id: user.id,
      position: m.position,
      title: m.title,
      description: m.description,
      status: "pending" as const,
    }));

    await admin.from("milestones").insert(milestoneRows);

    // Mark onboarding complete
    await admin
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({ planId: plan.id, projectId: project.id }, { status: 201 });
  } catch (err) {
    console.error("Onboarding error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
