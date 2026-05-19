"use client";

import { useState } from "react";
import { MilestoneItem } from "./MilestoneItem";
import type { Milestone } from "@/types/plan";

interface Props {
  initialMilestones: Milestone[];
}

export function MilestoneList({ initialMilestones }: Props) {
  const [milestones, setMilestones] = useState(initialMilestones);

  function handleComplete(milestoneId: string) {
    setMilestones((prev) =>
      prev.map((m) =>
        m.id === milestoneId
          ? { ...m, status: "completed" as const, completedAt: new Date().toISOString() }
          : m
      )
    );
  }

  return (
    <div>
      {milestones.map((milestone, index) => {
        const previousDone = index === 0 || milestones[index - 1].status === "completed";
        const isActionable = previousDone && milestone.status === "pending";

        return (
          <MilestoneItem
            key={milestone.id}
            milestone={milestone}
            isActionable={isActionable}
            onComplete={handleComplete}
          />
        );
      })}
    </div>
  );
}
