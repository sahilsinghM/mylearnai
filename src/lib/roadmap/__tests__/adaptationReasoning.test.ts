import { describe, it, expect } from "vitest";
import { fallbackReasoning } from "../adaptationReasoning";

describe("fallbackReasoning", () => {
  it("frames an INSERT as a review recommendation with the score and attempts", () => {
    const text = fallbackReasoning({ type: "INSERT", nodeId: "self-attention", score: 0.52, attempts: 2 });
    expect(text).toContain("52%");
    expect(text).toContain("2 attempts");
    expect(text).toContain("self-attention");
    expect(text.toLowerCase()).toContain("review");
  });

  it("frames a REMOVE as demonstrated mastery", () => {
    const text = fallbackReasoning({ type: "REMOVE", nodeId: "linear-algebra", score: 0.94, attempts: 1 });
    expect(text).toContain("94%");
    expect(text).toContain("linear-algebra");
    expect(text.toLowerCase()).toContain("mastery");
  });
});
