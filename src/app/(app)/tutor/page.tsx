import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { TopicPicker } from "@/components/tutor/TopicPicker";
import { MigrationBanner } from "@/components/tutor/MigrationBanner";
import { getWeekContext } from "@/lib/tutor/context";
import { getActiveNodeContext } from "@/lib/tutor/getActiveNodeContext";
import { getMasterRoadmap } from "@/lib/roadmap/masterRoadmap";
import { redirect } from "next/navigation";

// Cap resources shown in PREP so the list stays scannable
const MAX_NODE_RESOURCES = 10;

export default async function TutorPage({
  searchParams,
}: {
  searchParams: Promise<{ node?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Node-seeded session: a learner opened a specific roadmap node. Tutor on it
  // directly, bypassing the weekly plan entirely.
  const { node: nodeId } = await searchParams;
  if (nodeId) {
    const roadmap = await getMasterRoadmap();
    const node = roadmap.nodes.find((n) => n.id === nodeId);
    if (node) {
      const resources = node.resources
        .slice(0, MAX_NODE_RESOURCES)
        .map((r) => ({ id: r.id, title: r.title, url: r.url }));
      return (
        <div>
          <TopBar title="Tutor" subtitle={node.title} />
          <TopicPicker
            defaultTopic={node.title}
            weekNumber={1}
            days={[]}
            sessionCount={0}
            activeNodeTitle={node.title}
            activeNodeResources={resources}
            lockedNode={{ title: node.title, resources }}
          />
        </div>
      );
    }
  }

  const [context, activeNodeCtx] = await Promise.all([
    getWeekContext(user.id),
    getActiveNodeContext(user.id).catch(() => null),
  ]);

  if (!context) {
    return (
      <div>
        <TopBar title="Tutor" />
        <TopicPicker
          defaultTopic=""
          weekNumber={1}
          days={[]}
          sessionCount={0}
        />
      </div>
    );
  }

  let sessionCount = 0;
  try {
    const { count } = await supabase
      .from("tutor_sessions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    sessionCount = count ?? 0;
  } catch {
    sessionCount = 0;
  }

  return (
    <div>
      <TopBar
        title="Tutor"
        subtitle={`Week ${context.weekNumber}`}
      />
      <MigrationBanner />
      <TopicPicker
        defaultTopic={context.weekTopic}
        weekNumber={context.weekNumber}
        days={context.days}
        sessionCount={sessionCount}
        activeNodeTitle={activeNodeCtx?.nodeTitle}
        activeNodeResources={activeNodeCtx?.resources}
      />
    </div>
  );
}
