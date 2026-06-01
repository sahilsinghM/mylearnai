import { type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validations/onboarding";
import { buildInitialPlanPrompt, extractJsonFromResponse, SYSTEM_PROMPT } from "@/lib/anthropic/prompts";
import { claudePlanSchema } from "@/lib/anthropic/schemas";
import { getToday, addDays } from "@/lib/utils";
import type { OnboardingProfile } from "@/types/onboarding";
import Anthropic from "@anthropic-ai/sdk";
import { personalizeOnboardingRoadmap } from "@/lib/roadmap/personalizeOnboardingRoadmap";
import { getActiveRoadmapGrounding } from "@/lib/roadmap/roadmapPlanGrounding";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function sse(event: object): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: object) {
        controller.enqueue(encoder.encode(sse(event)));
      }

      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          send({ type: "error", message: "Unauthorized" });
          controller.close();
          return;
        }

        const body = await request.json();
        const parse = onboardingSchema.safeParse(body);
        if (!parse.success) {
          send({ type: "error", message: "Invalid input" });
          controller.close();
          return;
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
          courses_taken: profile.familiarTopics.map(t => `${t} [${profile.topicDepth}]`),
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        send({ type: "status", message: "Profile saved. Building your personalized roadmap..." });
        const roadmapReveal = await personalizeOnboardingRoadmap(admin, user.id, profile);

        send({ type: "status", message: "Roadmap ready. Generating your first weekly plan..." });

        // Stream Claude response
        const grounding = await getActiveRoadmapGrounding(admin, user.id);
        const prompt = buildInitialPlanPrompt(profile, grounding);
        let fullText = "";

        const claudeStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const event of claudeStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = event.delta.text;
            fullText += chunk;
            send({ type: "chunk", text: chunk });
          }
        }

        send({ type: "status", message: "Plan generated. Saving to database..." });

        // Parse and validate
        const jsonText = extractJsonFromResponse(fullText);
        let parsed: unknown;
        try {
          parsed = JSON.parse(jsonText);
        } catch {
          send({ type: "error", message: "Failed to parse plan JSON" });
          controller.close();
          return;
        }

        const result = claudePlanSchema.safeParse(parsed);
        if (!result.success) {
          send({ type: "error", message: "Plan validation failed" });
          controller.close();
          return;
        }

        const planJSON = result.data;
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

        if (planError || !plan) {
          send({ type: "error", message: "Failed to insert plan" });
          controller.close();
          return;
        }

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

          if (dayError || !planDay) {
            send({ type: "error", message: `Failed to insert day ${day.dayNumber}` });
            controller.close();
            return;
          }

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

        // Upsert project (user_id is UNIQUE — re-running onboarding replaces the existing project)
        const { data: project, error: projectError } = await admin
          .from("projects")
          .upsert({
            user_id: user.id,
            plan_id: plan.id,
            name: planJSON.project.name,
            description: planJSON.project.description,
            status: "active",
          }, { onConflict: "user_id" })
          .select("id")
          .single();

        if (projectError || !project) {
          send({ type: "error", message: "Failed to insert project" });
          controller.close();
          return;
        }

        // Delete old milestones before inserting new ones
        await admin.from("milestones").delete().eq("project_id", project.id);

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

        send({ type: "done", planId: plan.id, projectId: project.id, roadmapReveal });
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Internal error";
        controller.enqueue(encoder.encode(sse({ type: "error", message })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
