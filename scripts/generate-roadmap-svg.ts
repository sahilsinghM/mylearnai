/**
 * Generates public/roadmap.svg from the live Supabase master roadmap data.
 * Run: npm run gen:roadmap
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in env.
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { fetchMasterRoadmapRows } from "../src/lib/roadmap/masterRoadmapRepo";
import { buildMasterRoadmapData } from "../src/lib/roadmap/masterRoadmap";
import { generateRoadmapSvg } from "../src/lib/roadmap/generateRoadmapSvg";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  // Reuse the Master Roadmap repository so build-time and runtime read the same
  // columns. `query()` inside throws on any read failure, so a schema drift fails
  // the build loudly instead of writing an empty roadmap.
  const { rawNodes, rawEdges, rawResources, rawProjects } = await fetchMasterRoadmapRows(supabase);
  const data = buildMasterRoadmapData(rawNodes, rawEdges, rawResources, rawProjects);
  const svg = generateRoadmapSvg(data);
  const out = path.join(process.cwd(), "public", "roadmap.svg");
  fs.writeFileSync(out, svg, "utf8");
  console.log(`✓ ${data.nodes.length} nodes, ${data.edges.length} edges → ${out} (${(svg.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
