export type ProgrammingLevel = "beginner" | "intermediate" | "senior" | "staff";
export type AimlFamiliarity = "none" | "heard_of" | "used_tools" | "built_models" | "researcher";
export type MathConfidence = "low" | "medium" | "high" | "phd";
export type Goal = "get_a_job" | "build_product" | "research" | "curiosity";
export type InterestArea = "nlp" | "cv" | "rl" | "mlops" | "embeddings" | "agents";
export type HoursPerDay = 1 | 2 | 3 | 4 | 5;

export interface OnboardingProfile {
  programmingLevel: ProgrammingLevel;
  languages: string[];
  aimlFamiliarity: AimlFamiliarity;
  mathConfidence: MathConfidence;
  goals: Goal[];
  hoursPerDay: HoursPerDay;
  interestAreas: InterestArea[];
  coursesTaken: string[];
}
