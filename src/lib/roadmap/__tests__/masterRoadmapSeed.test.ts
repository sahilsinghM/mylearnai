import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const seedSql = readFileSync(
  new URL("../../../../supabase/migrations/005_master_roadmap_seed.sql", import.meta.url),
  "utf8"
);

function rowCountFor(table: string): number {
  const section = seedSql.match(
    new RegExp(`INSERT INTO ${table}[\\s\\S]*?VALUES([\\s\\S]*?)(?:ON CONFLICT|$)`)
  );
  return section?.[1].match(/^  \('/gm)?.length ?? 0;
}

describe("master roadmap seed migration", () => {
  it("seeds the complete published graph", () => {
    expect(rowCountFor("master_roadmap_nodes")).toBe(33);
    expect(rowCountFor("master_roadmap_edges")).toBe(50);
  });

  it("seeds curated resources and working-depth projects for all 33 Master Nodes", () => {
    expect(rowCountFor("master_roadmap_resources")).toBe(33);
    expect(rowCountFor("master_roadmap_projects")).toBe(33);
  });
});
