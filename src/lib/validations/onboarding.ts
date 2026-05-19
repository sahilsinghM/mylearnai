import { z } from "zod";

export const onboardingSchema = z.object({
  programmingLevel: z.enum(["beginner", "intermediate", "senior", "staff"]),
  languages: z.array(z.string()).default([]),
  aimlFamiliarity: z.enum(["none", "heard_of", "used_tools", "built_models", "researcher"]),
  mathConfidence: z.enum(["low", "medium", "high", "phd"]),
  goals: z.array(z.enum(["get_a_job", "build_product", "research", "curiosity"])).min(1),
  hoursPerDay: z.number().int().min(1).max(8),
  interestAreas: z.array(z.enum(["nlp", "cv", "rl", "mlops", "embeddings", "agents"])).min(1),
  familiarTopics: z.array(z.string()).default([]),
  topicDepth: z.enum(["heard_of", "can_explain", "have_implemented"]).default("heard_of"),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
