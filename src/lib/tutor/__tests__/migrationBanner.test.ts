import { describe, expect, it } from "vitest";
import { hasMigrationBannerBeenSeen, markMigrationBannerSeen } from "../migrationBanner";

function makeStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
  };
}

describe("migration banner persistence", () => {
  it("returns false when banner has not been seen", () => {
    expect(hasMigrationBannerBeenSeen(makeStorage())).toBe(false);
  });

  it("returns true after markMigrationBannerSeen is called", () => {
    const storage = makeStorage();
    markMigrationBannerSeen(storage);
    expect(hasMigrationBannerBeenSeen(storage)).toBe(true);
  });
});
