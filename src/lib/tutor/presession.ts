export type Level = "beginner" | "some" | "fluent" | "";

export interface PresessionInputs {
  topic: string;
  level: Level;
}

export function canStartSession({ topic, level }: PresessionInputs): boolean {
  return topic.trim().length > 0 && level.length > 0;
}
