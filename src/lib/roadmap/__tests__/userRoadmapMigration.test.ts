import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationUrl = new URL(
  "../../../../supabase/migrations/006_user_roadmaps.sql",
  import.meta.url
);

describe("user roadmap migration", () => {
  it("persists user paths and keeps the Adaptation Log append-only for users", () => {
    expect(existsSync(migrationUrl)).toBe(true);

    const sql = readFileSync(migrationUrl, "utf8");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS user_roadmaps");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS user_node_states");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS roadmap_adaptation_log");
    expect(sql).toContain("UNIQUE (user_id, node_id)");
    expect(sql).not.toMatch(/CREATE POLICY[\s\S]*roadmap_adaptation_log[\s\S]*FOR DELETE/);
  });
});
