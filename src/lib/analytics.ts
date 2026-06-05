/**
 * Fire-and-forget analytics event tracking
 * Sends events to /api/analytics/event without blocking the caller
 */

export function track(event: string, properties?: Record<string, unknown>): void {
  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties }),
  });
}
