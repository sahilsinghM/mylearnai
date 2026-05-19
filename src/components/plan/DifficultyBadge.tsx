import { Badge } from "@/components/ui/badge";
import type { Difficulty } from "@/types/plan";

const variantMap: Record<Difficulty, "success" | "warning" | "danger"> = {
  easy: "success",
  medium: "warning",
  hard: "danger",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <Badge variant={variantMap[difficulty]}>{difficulty}</Badge>;
}
