import fs from "fs";
import path from "path";
import { getMasterRoadmap } from "@/lib/roadmap/masterRoadmap";
import { RoadmapViewer } from "@/components/roadmap/RoadmapViewer";

export const metadata = {
  title: "AI Engineering Roadmap — DeepPath",
  description: "The AI engineering roadmap, before it knows you. 33 nodes across 7 phases.",
};

export default async function RoadmapPage() {
  const [data, svgString] = await Promise.all([
    getMasterRoadmap(),
    fs.promises.readFile(path.join(process.cwd(), "public", "roadmap.svg"), "utf8"),
  ]);

  return <RoadmapViewer data={data} svgString={svgString} />;
}
