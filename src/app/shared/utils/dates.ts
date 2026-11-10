export const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;

export function addHours(iso: string, hours: number): string {
  return new Date(Date.parse(iso) + hours * HOUR_MS).toISOString();
}

export function hoursBetween(fromIso: string, toIso: string): number {
  return (Date.parse(toIso) - Date.parse(fromIso)) / HOUR_MS;
}

/** «3h», «2d 4h» — компактная длительность */
export function formatDuration(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return '—';
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
  const days = Math.floor(hours / 24);
  const rest = Math.round(hours % 24);
  return rest ? `${days}d ${rest}h` : `${days}d`;
}
