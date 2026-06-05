import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { TopicPicker } from "@/components/tutor/TopicPicker";
import { MigrationBanner } from "@/components/tutor/MigrationBanner";
import { getWeekContext } from "@/lib/tutor/context";
import { getActiveNodeContext } from "@/lib/tutor/getActiveNodeContext";
import { redirect } from "next/navigation";

export default async function TutorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const [context, activeNodeCtx] = await Promise.all([
    getWeekContext(user.id),
    getActiveNodeContext(user.id).catch(() => null),
  ]);

  if (!context) {
    return (
      <div>
        <TopBar title="Tutor" />
        <TopicPicker
          defaultTopic={activeNodeCtx?.nodeTitle ?? ""}
          weekNumber={1}
          days={[]}
          sessionCount={0}
          activeNodeTitle={activeNodeCtx?.nodeTitle}
          activeNodeBlurb={activeNodeCtx?.nodeBlurb}
          activeNodeResources={activeNodeCtx?.resources}
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
        activeNodeBlurb={activeNodeCtx?.nodeBlurb}
        activeNodeResources={activeNodeCtx?.resources}
      />
    </div>
  );
}
