"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, BrainCircuit, Award, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/roadmap",
    icon: Map,
    label: "Roadmap",
    match: (p: string) => p === "/roadmap" || p.startsWith("/roadmap/"),
  },
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    match: (p: string) => p === "/dashboard",
  },
  {
    href: "/tutor",
    icon: BrainCircuit,
    label: "Tutor",
    match: (p: string) => p === "/tutor" || p.startsWith("/tutor/"),
  },
  {
    href: "/proof",
    icon: Award,
    label: "Proof",
    match: (p: string) => p === "/proof" || p.startsWith("/proof/"),
    disabled: true,
  },
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
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-52 min-h-screen border-r border-border bg-card px-3 py-4 shrink-0">
        <div className="mb-6 px-2">
          <span className="text-sm font-bold tracking-tight text-primary font-mono">DeepPath</span>
        </div>

        <nav className="flex-1 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = !item.disabled && item.match(pathname);

            if (item.disabled) {
              return (
                <span
                  key={item.label}
                  className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-muted-foreground/35 cursor-default select-none"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                  <span className="ml-auto text-[10px] font-mono tracking-wide opacity-50">soon</span>
                </span>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex border-t border-border bg-card safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = !item.disabled && item.match(pathname);

          if (item.disabled) {
            return (
              <span
                key={item.label}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-muted-foreground/35 cursor-default select-none"
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleSignOut}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium">Sign out</span>
        </button>
      </nav>
    </>
  );
}
