import { SignalKey } from './signals';

// Bewust zonder Intl: niet elke Android-build heeft volledige locale-data.
const nl = (n: number, digits = 0) => n.toFixed(digits).replace('.', ',');

/** 7.2 uur → "7u12". */
export function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}u${String(m).padStart(2, '0')}`;
}

/** 8412 → "8.412". */
export function formatSteps(steps: number): string {
  return String(Math.round(steps)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatSignal(key: SignalKey, value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '–';
  switch (key) {
    case 'sleep':
      return formatHours(value);
    case 'steps':
      return formatSteps(value);
    case 'water':
      return `${nl(value, 1)} L`;
    case 'workout':
    case 'mindful':
      return `${Math.round(value)} min`;
    case 'restingHr':
      return `${Math.round(value)} bpm`;
    case 'hrv':
      return `${Math.round(value)} ms`;
    case 'activeEnergy':
      return `${formatSteps(value)} kcal`;
  }
}

export function formatGoal(key: SignalKey, goal: number): string {
  if (key === 'restingHr') return `≤ ${goal} bpm`;
  if (key === 'sleep') return `${nl(goal, Number.isInteger(goal) ? 0 : 1)} uur`;
  return formatSignal(key, goal);
}

const DAYS = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

export function shortDay(date: Date): string {
  return DAYS[date.getDay()] ?? '';
}

/** "za 11 okt". */
export function shortDate(date: Date): string {
  return `${shortDay(date)} ${date.getDate()} ${MONTHS[date.getMonth()] ?? ''}`;
}
