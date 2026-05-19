"use client";

import { useEffect, useRef } from "react";

interface Props {
  streamText: string;
  status: string;
}

export function GeneratingPlan({ streamText, status }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamText]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="max-w-2xl w-full mx-4 space-y-4">
        <div className="space-y-1">
          <div className="text-lg font-mono tracking-tight text-primary">DeepPath</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
            <span className="text-green-400">›</span>
            <span>{status}</span>
            <span className="animate-pulse text-primary">▋</span>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 h-80 overflow-y-auto font-mono text-xs leading-relaxed"
          style={{ scrollBehavior: "smooth" }}
        >
          {streamText ? (
            <pre className="whitespace-pre-wrap text-zinc-300 break-all">{streamText}</pre>
          ) : (
            <div className="text-zinc-600 italic">Waiting for Claude...</div>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          This takes about 15 seconds. Don&apos;t close this tab.
        </p>
      </div>
    </div>
  );
}
