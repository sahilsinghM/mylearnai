import type { SupabaseClient } from "@supabase/supabase-js";
import type { OnboardingProfile } from "@/types/onboarding";
import { getMasterRoadmap } from "./masterRoadmap";
import { buildPersonalizedRoadmap, buildRoadmapReveal } from "./generatePersonalizedRoadmap";
import { persistPersonalizedRoadmap } from "./persistPersonalizedRoadmap";

export async function personalizeOnboardingRoadmap(
  supabase: SupabaseClient,
  userId: string,
  profile: OnboardingProfile
) {
  const graph = await getMasterRoadmap();
  const roadmap = buildPersonalizedRoadmap(profile, graph);
  await persistPersonalizedRoadmap(supabase, userId, roadmap);

  return buildRoadmapReveal(roadmap, graph);
}
