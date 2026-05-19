"use client";

import { useState, useEffect } from "react";
import type { LearningPlan, PlanDay } from "@/types/plan";

interface PlanResponse {
  plan: LearningPlan | null;
  days: PlanDay[];
}

export function useCurrentPlan() {
  const [data, setData] = useState<PlanResponse>({ plan: null, days: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plan/current")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load plan");
        setLoading(false);
      });
  }, []);

  return { ...data, loading, error };
}
