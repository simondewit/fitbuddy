// Demobron met nepdata. Gebruikt in de browser, in Expo Go, tijdens
// ontwikkelen en voor schermafbeeldingen in de stores.

import type { DayValues } from '../core/signals';
import { dayKey } from '../core/time';
import type { HealthSource } from './types';

/** De drie scenario's uit het design (docs/design/data.js). */
export const SCENARIOS = {
  goed: { sleep: 8.1, steps: 11240, workout: 52, restingHr: 54, hrv: 68, water: 2.4, activeEnergy: 710, mindful: 12 },
  gemiddeld: { sleep: 6.6, steps: 7380, workout: 25, restingHr: 60, hrv: 51, water: 1.4, activeEnergy: 470, mindful: 3 },
  slecht: { sleep: 4.9, steps: 2160, workout: 0, restingHr: 69, hrv: 31, water: 0.6, activeEnergy: 140, mindful: 0 },
} satisfies Record<string, DayValues>;

/** Voorspelbaar pseudo-willekeurig getal 0..1 op basis van een tekst. */
function seeded(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Een dag tussen 'slecht' en 'goed', elke dag anders maar steeds hetzelfde. */
export function demoDay(date: Date): DayValues {
  const key = dayKey(date);
  const t = 0.25 + 0.7 * seeded(key);
  const { slecht: lo, goed: hi } = SCENARIOS;
  const mix = (k: keyof typeof lo, digits = 0) => {
    const jitter = 0.9 + 0.2 * seeded(key + k);
    const v = (lo[k] + (hi[k] - lo[k]) * t) * jitter;
    const f = Math.pow(10, digits);
    return Math.round(v * f) / f;
  };
  return {
    sleep: mix('sleep', 2),
    steps: mix('steps'),
    workout: mix('workout'),
    restingHr: mix('restingHr'),
    hrv: mix('hrv'),
    water: mix('water', 1),
    activeEnergy: mix('activeEnergy'),
    mindful: mix('mindful'),
  };
}

export const demoSource: HealthSource = {
  id: 'demo',
  name: 'Demodata',
  availability: async () => 'available',
  requestPermissions: async () => true,
  readDay: async (date) => demoDay(date),
};
