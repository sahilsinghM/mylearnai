const KEY = "tutor-mastery-tooltip-seen";

interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function hasMasteryTooltipBeenSeen(storage: Storage = globalThis.localStorage): boolean {
  return storage?.getItem(KEY) === "true";
}

export function markMasteryTooltipSeen(storage: Storage = globalThis.localStorage): void {
  storage?.setItem(KEY, "true");
}
