"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./StepIndicator";
import { GeneratingPlan } from "./GeneratingPlan";
import { Step1Background } from "./steps/Step1Background";
import { Step2AiMl } from "./steps/Step2AiMl";
import { Step3Math } from "./steps/Step3Math";
import { Step4Goals } from "./steps/Step4Goals";
import { Step5Time } from "./steps/Step5Time";
import { Step6Interests } from "./steps/Step6Interests";
import { Step7Courses } from "./steps/Step7Courses";
import type { OnboardingProfile } from "@/types/onboarding";

const TOTAL_STEPS = 7;

const STEP_LABELS = [
  "Programming background",
  "AI/ML familiarity",
  "Math confidence",
  "Goals",
  "Time available",
  "Interest areas",
  "Courses taken",
];

export function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<Partial<OnboardingProfile>>({
    languages: [],
    goals: [],
    interestAreas: [],
    coursesTaken: [],
  });

  function update<K extends keyof OnboardingProfile>(key: K, value: OnboardingProfile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function isStepValid(): boolean {
    switch (step) {
      case 1: return !!profile.programmingLevel;
      case 2: return !!profile.aimlFamiliarity;
      case 3: return !!profile.mathConfidence;
      case 4: return (profile.goals?.length ?? 0) > 0;
      case 5: return !!profile.hoursPerDay;
      case 6: return (profile.interestAreas?.length ?? 0) > 0;
      case 7: return true;
      default: return false;
    }
  }

  async function handleSubmit() {
    setError("");
    setGenerating(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate plan");
      setGenerating(false);
    }
  }

  if (generating) return <GeneratingPlan />;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground font-mono">DeepPath</div>
          <StepIndicator current={step} total={TOTAL_STEPS} />
          <p className="text-xs text-muted-foreground">{STEP_LABELS[step - 1]}</p>
        </div>

        <div className="min-h-[320px]">
          {step === 1 && <Step1Background value={profile.programmingLevel} onChange={(v) => update("programmingLevel", v)} />}
          {step === 2 && <Step2AiMl value={profile.aimlFamiliarity} onChange={(v) => update("aimlFamiliarity", v)} />}
          {step === 3 && <Step3Math value={profile.mathConfidence} onChange={(v) => update("mathConfidence", v)} />}
          {step === 4 && <Step4Goals value={profile.goals ?? []} onChange={(v) => update("goals", v)} />}
          {step === 5 && <Step5Time value={profile.hoursPerDay} onChange={(v) => update("hoursPerDay", v as OnboardingProfile["hoursPerDay"])} />}
          {step === 6 && <Step6Interests value={profile.interestAreas ?? []} onChange={(v) => update("interestAreas", v)} />}
          {step === 7 && <Step7Courses value={profile.coursesTaken ?? []} onChange={(v) => update("coursesTaken", v)} />}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 1}
          >
            Back
          </Button>

          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={!isStepValid()}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!isStepValid()}>
              Build my plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
