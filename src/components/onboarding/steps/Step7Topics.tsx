"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { TopicDepth } from "@/types/onboarding";

const TOPICS = [
  { group: "Foundations", items: ["Linear algebra", "Calculus / gradients", "Probability & statistics", "Python for ML"] },
  { group: "Core ML", items: ["Supervised learning", "Unsupervised learning", "Gradient descent / backprop", "Overfitting & regularization"] },
  { group: "Deep Learning", items: ["Neural networks (MLPs)", "CNNs", "RNNs / LSTMs", "Transformers / attention"] },
  { group: "Modern AI", items: ["Embeddings & vector search", "Fine-tuning LLMs", "RAG (retrieval-augmented generation)", "Prompt engineering", "AI agents & tool use"] },
  { group: "Infrastructure", items: ["Model deployment / serving", "MLOps & pipelines", "Evaluation & monitoring"] },
];

const DEPTH_OPTIONS: { value: TopicDepth; label: string; desc: string }[] = [
  { value: "heard_of", label: "I've heard of them", desc: "I know the terms but haven't gone deep" },
  { value: "can_explain", label: "I can explain them", desc: "I understand the concepts well enough to discuss" },
  { value: "have_implemented", label: "I've implemented them", desc: "I've written code and built things with these" },
];

interface Props {
  familiarTopics: string[];
  topicDepth: TopicDepth | undefined;
  onTopicsChange: (v: string[]) => void;
  onDepthChange: (v: TopicDepth) => void;
}

export function Step7Topics({ familiarTopics, topicDepth, onTopicsChange, onDepthChange }: Props) {
  function toggle(topic: string) {
    if (familiarTopics.includes(topic)) {
      onTopicsChange(familiarTopics.filter((t) => t !== topic));
    } else {
      onTopicsChange([...familiarTopics, topic]);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">What topics do you already know?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select anything you&apos;re familiar with — we&apos;ll skip or compress these in your plan.
        </p>
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
        {TOPICS.map(({ group, items }) => (
          <div key={group}>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{group}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {items.map((topic) => (
                <label
                  key={topic}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-border cursor-pointer hover:border-primary/50 transition-colors text-sm"
                  style={{
                    borderColor: familiarTopics.includes(topic) ? "var(--primary)" : undefined,
                    background: familiarTopics.includes(topic) ? "color-mix(in oklch, var(--primary) 5%, transparent)" : undefined,
                  }}
                >
                  <Checkbox
                    checked={familiarTopics.includes(topic)}
                    onCheckedChange={() => toggle(topic)}
                  />
                  {topic}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {familiarTopics.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-border">
          <p className="text-sm font-medium">How well do you know the topics you selected?</p>
          <RadioGroup value={topicDepth} onValueChange={(v) => onDepthChange(v as TopicDepth)} className="space-y-1.5">
            {DEPTH_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex items-start gap-3 px-3 py-2.5 rounded-md border border-border cursor-pointer hover:border-primary/50 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
              >
                <RadioGroupItem value={opt.value} className="mt-0.5" />
                <div>
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>
      )}
    </div>
  );
}
