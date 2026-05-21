import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { TutorChat } from "@/components/tutor/TutorChat";
import { getWeekContext } from "@/lib/tutor/context";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TutorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const context = await getWeekContext(user.id);

  if (!context) {
    return (
      <div>
        <TopBar title="Tutor" />
        <div className="p-6">
          <p className="text-sm text-muted-foreground">
            No active plan found.{" "}
            <Link href="/plan" className="text-primary underline underline-offset-2">
              Generate your plan
            </Link>{" "}
            to start a session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="Tutor"
        subtitle={`Week ${context.weekNumber} — ${context.weekTopic}`}
      />
      <TutorChat weekTopic={context.weekTopic} weekNumber={context.weekNumber} />
    </div>
  );
}
