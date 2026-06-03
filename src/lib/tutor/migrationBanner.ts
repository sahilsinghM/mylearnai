const KEY = "plan-migration-banner-seen";

interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function hasMigrationBannerBeenSeen(storage: Storage = globalThis.localStorage): boolean {
  return storage?.getItem(KEY) === "true";
}

export function markMigrationBannerSeen(storage: Storage = globalThis.localStorage): void {
  storage?.setItem(KEY, "true");
}
