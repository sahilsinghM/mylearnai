import { describe, expect, it, beforeEach } from "vitest";
import { hasMasteryTooltipBeenSeen, markMasteryTooltipSeen } from "../masteryTooltip";

function makeStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
  };
}

describe("mastery tooltip persistence", () => {
  it("returns false when the tooltip has not been seen", () => {
    expect(hasMasteryTooltipBeenSeen(makeStorage())).toBe(false);
  });

  it("returns true after markMasteryTooltipSeen is called", () => {
    const storage = makeStorage();
    markMasteryTooltipSeen(storage);
    expect(hasMasteryTooltipBeenSeen(storage)).toBe(true);
  });

  it("persists across repeated checks on the same storage", () => {
    const storage = makeStorage();
    markMasteryTooltipSeen(storage);
    expect(hasMasteryTooltipBeenSeen(storage)).toBe(true);
    expect(hasMasteryTooltipBeenSeen(storage)).toBe(true);
  });
});
