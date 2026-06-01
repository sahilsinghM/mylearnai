import { getMasterRoadmap } from "@/lib/roadmap/masterRoadmap";
import { RoadmapPage } from "@/components/roadmap/RoadmapPage";

export const metadata = {
  title: "AI Engineering Roadmap — DeepPath",
  description: "The master AI engineering roadmap, before it knows you.",
};

export default async function RoadmapPageRoute() {
  const data = await getMasterRoadmap();
  return <RoadmapPage data={data} />;
}
