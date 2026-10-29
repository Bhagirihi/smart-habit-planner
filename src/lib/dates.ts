export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function addDays(key: string, n: number): string {
  const d = new Date(`${key}T12:00:00`); d.setDate(d.getDate() + n); return todayKey(d);
}
export function dayOfWeek(key: string): number { return new Date(`${key}T12:00:00`).getDay(); }
export function weekStartKey(key: string): string { // Monday-start
  const dow = dayOfWeek(key); const offset = (dow + 6) % 7; return addDays(key, -offset);
}
export function formatLongDate(key: string): string {
  return new Date(`${key}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}
export function uid(): string { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; }
export function isValidDateKey(k: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(k) && !Number.isNaN(new Date(`${k}T12:00:00`).getTime()); }
