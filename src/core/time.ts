// Datum- en intervalhulpjes. Puur, zodat ze los te testen zijn.

export interface Interval {
  start: number; // epoch ms
  end: number; // epoch ms
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** "2026-10-11" in lokale tijd. Gebruikt als sleutel voor opslag. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

/** Het venster van een kalenderdag: 00:00 tot 00:00 de volgende dag. */
export function dayWindow(date: Date): Interval {
  const start = startOfDay(date);
  return { start: start.getTime(), end: addDays(start, 1).getTime() };
}

/**
 * Het slaapvenster dat bij een dag hoort: de nacht ervoor.
 * Van 18:00 de vorige avond tot 14:00 op de dag zelf.
 */
export function sleepWindow(date: Date): Interval {
  const start = startOfDay(date);
  const from = new Date(start);
  from.setDate(from.getDate() - 1);
  from.setHours(18, 0, 0, 0);
  const to = new Date(start);
  to.setHours(14, 0, 0, 0);
  return { start: from.getTime(), end: to.getTime() };
}

/**
 * Totale duur van een set intervallen, waarbij overlap maar één keer telt.
 * Nodig omdat iPhone en horloge vaak allebei dezelfde slaap registreren.
 */
export function unionDurationMs(intervals: readonly Interval[], clip?: Interval): number {
  const parts = intervals
    .map((i) => (clip ? { start: Math.max(i.start, clip.start), end: Math.min(i.end, clip.end) } : i))
    .filter((i) => i.end > i.start)
    .sort((a, b) => a.start - b.start);

  let total = 0;
  let curStart = -Infinity;
  let curEnd = -Infinity;
  for (const p of parts) {
    if (p.start > curEnd) {
      if (curEnd > curStart) total += curEnd - curStart;
      curStart = p.start;
      curEnd = p.end;
    } else if (p.end > curEnd) {
      curEnd = p.end;
    }
  }
  if (curEnd > curStart) total += curEnd - curStart;
  return total;
}
