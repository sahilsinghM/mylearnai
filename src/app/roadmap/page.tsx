import { getMasterRoadmap } from "@/lib/roadmap/masterRoadmap";
import { RoadmapPage } from "@/components/roadmap/RoadmapPage";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Engineering Roadmap — DeepPath",
  description: "The master AI engineering roadmap, before it knows you.",
};

export default async function RoadmapPageRoute() {
  const supabase = await createClient();
  const [data, { data: { user } }] = await Promise.all([
    getMasterRoadmap(),
    supabase.auth.getUser(),
  ]);
  return <RoadmapPage data={data} isAuthed={!!user} />;
}
