"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, FolderKanban, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/plan", label: "Plan", icon: Calendar },
  { href: "/project", label: "Project", icon: FolderKanban },
];

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
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
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
