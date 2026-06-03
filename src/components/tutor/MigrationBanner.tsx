"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { hasMigrationBannerBeenSeen, markMigrationBannerSeen } from "@/lib/tutor/migrationBanner";

export function MigrationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!hasMigrationBannerBeenSeen()) setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    markMigrationBannerSeen();
    setVisible(false);
  }

  return (
    <div className="mx-6 mt-4 flex items-start gap-3 rounded-lg border border-[--border] bg-[--card] px-4 py-3 text-sm text-foreground">
      <span className="flex-1 leading-relaxed">
        Your learning plan is now here. Progress and proof trail are coming to this sidebar soon.
      </span>
      <button onClick={dismiss} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5">
        <X size={14} />
      </button>
    </div>
  );
}
