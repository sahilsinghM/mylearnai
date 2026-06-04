import { describe, expect, it } from "vitest";
import { shouldEndSession } from "../sessionEnd";

describe("shouldEndSession", () => {
  // Absolute hard stop at Q15
  it("returns true when questionCount >= 15 regardless of answers", () => {
    expect(shouldEndSession([], 15)).toBe(true);
    expect(shouldEndSession([false, false, false], 15)).toBe(true);
    expect(shouldEndSession([], 20)).toBe(true);
  });

  // Unconditional cap at Q12
  it("returns true when questionCount >= 12", () => {
    expect(shouldEndSession([], 12)).toBe(true);
    expect(shouldEndSession([false, false, false], 12)).toBe(true);
    expect(shouldEndSession([true, true, true], 13)).toBe(true);
  });

  // Mastery exit: Q8+ AND last 3 all correct
  it("returns true when questionCount >= 8 and last 3 answers are all correct", () => {
    expect(shouldEndSession([false, true, true, true], 8)).toBe(true);
    expect(shouldEndSession([true, true, true], 8)).toBe(true);
    expect(shouldEndSession([false, false, true, true, true], 11)).toBe(true);
  });

  it("returns false when questionCount >= 8 but last 3 are not all correct", () => {
    expect(shouldEndSession([true, true, false], 8)).toBe(false);
    expect(shouldEndSession([false, true, true], 8)).toBe(false);
    expect(shouldEndSession([true, false, true], 9)).toBe(false);
  });

  it("returns false when last 3 are all correct but questionCount < 8", () => {
    expect(shouldEndSession([true, true, true], 7)).toBe(false);
    expect(shouldEndSession([true, true, true], 5)).toBe(false);
  });

  it("returns false when there are fewer than 3 recent answers even with questionCount >= 8", () => {
    expect(shouldEndSession([true, true], 8)).toBe(false);
    expect(shouldEndSession([true], 8)).toBe(false);
    expect(shouldEndSession([], 8)).toBe(false);
  });

  // Normal chatting - should continue
  it("returns false for normal early-session state", () => {
    expect(shouldEndSession([], 1)).toBe(false);
    expect(shouldEndSession([true], 3)).toBe(false);
    expect(shouldEndSession([false, true, false], 5)).toBe(false);
  });
});
