export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDays(key: string, n: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function dayOfWeek(key: string): number {
  return parseDateKey(key).getDay();
}

export function isSundayKey(key: string): boolean {
  return dayOfWeek(key) === 0;
}

export function formatDayLabel(key: string): string {
  const d = parseDateKey(key);
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function formatLongDate(key: string): string {
  const d = parseDateKey(key);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Monday of the week containing `key`, as a YYYY-MM-DD key. */
export function weekStartKey(key: string): string {
  const d = parseDateKey(key);
  const dow = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - dow);
  return toDateKey(d);
}

export function lastNDays(today: string, n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(today, -i));
  return out;
}

/** Parse "HH:MM" into hour/minute. Defaults to 08:00 on bad input. */
export function parseTime(t: string): { hour: number; minute: number } {
  const parts = t.split(':').map(Number);
  const hour = Number.isFinite(parts[0]) ? parts[0] : 8;
  const minute = Number.isFinite(parts[1]) ? parts[1] : 0;
  return { hour, minute };
}

export function formatTime12h(t: string): string {
  const { hour, minute } = parseTime(t);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${suffix}`;
}
