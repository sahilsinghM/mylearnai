import { z } from "zod";

export const taskEventSchema = z.object({
  event: z.enum(["completed", "skipped", "failed"]),
  difficultyFelt: z.enum(["too_easy", "just_right", "too_hard"]).optional(),
  note: z.string().max(500).optional(),
});

export type TaskEventInput = z.infer<typeof taskEventSchema>;
