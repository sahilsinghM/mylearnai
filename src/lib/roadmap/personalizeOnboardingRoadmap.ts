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
  // Precondition the caller shouldn't have to know: never persist a Personalized
  // Roadmap built from an empty Master Roadmap. getMasterRoadmap() now throws on a
  // read failure, so an empty graph means the source itself is empty — fail loudly
  // here rather than initialise a user with zero nodes.
  if (graph.nodes.length === 0) {
    throw new Error("Cannot personalize onboarding: Master Roadmap has no nodes");
  }

  const roadmap = buildPersonalizedRoadmap(profile, graph);
  await persistPersonalizedRoadmap(supabase, userId, roadmap);

  return buildRoadmapReveal(roadmap, graph);
}
