import { describe, expect, it } from "vitest";
import { canStartSession } from "../presession";

describe("canStartSession", () => {
  it("returns false when topic is empty", () => {
    expect(canStartSession({ topic: "", level: "beginner" })).toBe(false);
  });

  it("returns false when level is not selected", () => {
    expect(canStartSession({ topic: "Transformers", level: "" })).toBe(false);
  });

  it("returns false when topic is only whitespace", () => {
    expect(canStartSession({ topic: "   ", level: "fluent" })).toBe(false);
  });

  it("returns true when both topic and level are present", () => {
    expect(canStartSession({ topic: "Gradient descent", level: "some" })).toBe(true);
  });
});
