import { z } from "zod";

const claudeTaskSchema = z.object({
  position: z.number().int().positive(),
  type: z.enum(["study", "build", "review", "exercise"]),
  title: z.string().min(1),
  description: z.string().min(1),
  resourceUrl: z.string().url().nullable(),
  durationMin: z.number().int().positive(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  why: z.string().optional(),
});

const claudeDaySchema = z.object({
  dayNumber: z.number().int().min(1).max(7),
  theme: z.string().min(1),
  summary: z.string().min(1),
  hook: z.string().optional(),
  tasks: z.array(claudeTaskSchema).min(1).max(6),
});

const claudeMilestoneSchema = z.object({
  position: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const claudePlanSchema = z.object({
  difficulty: z.enum(["gentle", "normal", "accelerated"]),
  narrative: z.string().optional(),
  days: z.array(claudeDaySchema).length(7),
  project: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    milestones: z.array(claudeMilestoneSchema).length(6),
  }),
});

export type ClaudePlanOutput = z.infer<typeof claudePlanSchema>;
