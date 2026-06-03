"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, BarChart2, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <aside className="flex flex-col w-52 min-h-screen border-r border-border bg-card px-3 py-4 shrink-0">
      <div className="mb-6 px-2">
        <span className="text-sm font-bold tracking-tight text-primary font-mono">DeepPath</span>
      </div>

      <nav className="flex-1 space-y-1">
        <Link
          href="/tutor"
          className={cn(
            "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
            pathname === "/tutor" || pathname.startsWith("/tutor/")
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <BrainCircuit className="h-4 w-4 shrink-0" />
          Start Session
        </Link>

        <span className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-muted-foreground/40 cursor-default select-none">
          <BarChart2 className="h-4 w-4 shrink-0" />
          Progress
          <span className="ml-auto text-[10px] font-mono tracking-wide opacity-60">soon</span>
        </span>

        <Link
          href="/project"
          className={cn(
            "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
            pathname === "/project" || pathname.startsWith("/project/")
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
      </nav>

      <button
        onClick={handleSignOut}
        className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Sign out
      </button>
    </aside>
  );
}
