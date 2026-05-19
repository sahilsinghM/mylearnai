interface Props {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-1 w-6 rounded-full transition-colors"
            style={{ background: i < current ? "var(--primary)" : "var(--muted)" }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {current} of {total}
      </span>
    </div>
  );
}
