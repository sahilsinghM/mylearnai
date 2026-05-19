export function GeneratingPlan() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 text-center space-y-6">
        <div className="space-y-2">
          <div className="text-4xl font-mono tracking-tight text-primary">
            DeepPath
          </div>
          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground font-mono">
            <span>Analyzing your profile and building your 7-day plan</span>
            <span className="animate-pulse">▋</span>
          </div>
        </div>

        <div className="space-y-2 text-left">
          {[
            "Reading your background...",
            "Calibrating difficulty level...",
            "Sequencing learning tasks...",
            "Designing your first project...",
            "Finalizing your plan...",
          ].map((step, i) => (
            <div
              key={step}
              className="flex items-center gap-2 text-xs text-muted-foreground font-mono"
              style={{ animationDelay: `${i * 0.8}s` }}
            >
              <span className="text-primary">›</span>
              <span>{step}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          This takes about 15 seconds. Don&apos;t close this tab.
        </p>
      </div>
    </div>
  );
}
