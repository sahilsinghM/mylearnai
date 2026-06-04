import { createClient } from "@/lib/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Welcome to DeepPath</h2>
        <p className="text-muted-foreground">
          Your learning journey starts here.
        </p>
      </div>
    </div>
  );
}
