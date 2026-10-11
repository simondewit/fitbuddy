// Apple Health (HealthKit). Alleen op iPhone, en alleen in een eigen build
// (niet in Expo Go). Leest; schrijft nooit.

import {
  isHealthDataAvailable,
  queryCategorySamples,
  queryStatisticsForQuantity,
  queryWorkoutSamples,
  requestAuthorization,
} from '@kingstinct/react-native-healthkit';

import type { DayValues } from '../core/signals';
import { dayWindow, Interval, sleepWindow, unionDurationMs } from '../core/time';
import type { HealthSource } from './types';

const READ_TYPES = [
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKQuantityTypeIdentifierStepCount',
  'HKWorkoutTypeIdentifier',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierDietaryWater',
  'HKQuantityTypeIdentifierActiveEnergyBurned',
  'HKCategoryTypeIdentifierMindfulSession',
] as const;

// Slaapwaarden die als "slapend" tellen (in bed liggen en wakker zijn niet).
// 1 = asleep (oud) / asleepUnspecified, 3 = core, 4 = deep, 5 = REM.
const ASLEEP_VALUES = new Set<number>([1, 3, 4, 5]);

const HOUR = 3600_000;
const MINUTE = 60_000;

const range = (w: Interval) => ({ date: { startDate: new Date(w.start), endDate: new Date(w.end) } });

/** Voert een query uit; bij een fout (geen toestemming, geen data) null. */
async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    if (__DEV__) console.warn('[AppleHealth]', e);
    return null;
  }
}

async function readDay(date: Date): Promise<DayValues> {
  const day = dayWindow(date);
  const night = sleepWindow(date);

  const [steps, energy, water, rhr, hrv, sleep, mindful, workouts] = await Promise.all([
    safe(() => queryStatisticsForQuantity('HKQuantityTypeIdentifierStepCount', ['cumulativeSum'], { filter: range(day), unit: 'count' })),
    safe(() => queryStatisticsForQuantity('HKQuantityTypeIdentifierActiveEnergyBurned', ['cumulativeSum'], { filter: range(day), unit: 'kcal' })),
    safe(() => queryStatisticsForQuantity('HKQuantityTypeIdentifierDietaryWater', ['cumulativeSum'], { filter: range(day), unit: 'mL' })),
    safe(() => queryStatisticsForQuantity('HKQuantityTypeIdentifierRestingHeartRate', ['discreteAverage'], { filter: range(day), unit: 'count/min' })),
    safe(() => queryStatisticsForQuantity('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', ['discreteAverage'], { filter: range(day), unit: 'ms' })),
    safe(() => queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', { limit: 0, filter: range(night) })),
    safe(() => queryCategorySamples('HKCategoryTypeIdentifierMindfulSession', { limit: 0, filter: range(day) })),
    safe(async () => {
      const proxies = await queryWorkoutSamples({ limit: 0, filter: range(day) });
      // Proxies houden native geheugen vast; zet om naar gewone objecten en ruim op.
      return proxies.map((w) => {
        const json = w.toJSON();
        w.dispose();
        return json;
      });
    }),
  ]);

  const asleep = (sleep ?? [])
    .filter((s) => ASLEEP_VALUES.has(Number(s.value)))
    .map((s) => ({ start: new Date(s.startDate).getTime(), end: new Date(s.endDate).getTime() }));
  const sleepMs = unionDurationMs(asleep, night);

  const mindfulMs = unionDurationMs(
    (mindful ?? []).map((s) => ({ start: new Date(s.startDate).getTime(), end: new Date(s.endDate).getTime() })),
    day,
  );

  const workoutMs = unionDurationMs(
    (workouts ?? []).map((w) => ({ start: new Date(w.startDate).getTime(), end: new Date(w.endDate).getTime() })),
    day,
  );

  return {
    // Geen slaapdata = onbekend (geen horloge of niet gedragen), niet 0.
    sleep: asleep.length > 0 ? sleepMs / HOUR : null,
    steps: steps?.sumQuantity?.quantity ?? 0,
    workout: workoutMs / MINUTE,
    restingHr: rhr?.averageQuantity?.quantity ?? null,
    hrv: hrv?.averageQuantity?.quantity ?? null,
    water: (water?.sumQuantity?.quantity ?? 0) / 1000,
    activeEnergy: energy?.sumQuantity?.quantity ?? 0,
    mindful: mindfulMs / MINUTE,
  };
}

export const appleHealthSource: HealthSource = {
  id: 'apple-health',
  name: 'Apple Gezondheid',
  availability: async () => (isHealthDataAvailable() ? 'available' : 'unsupported'),
  requestPermissions: async () => {
    try {
      // Apple vertelt nooit of iemand "nee" zei bij lezen; we krijgen dan
      // gewoon lege resultaten. true betekent hier: de vraag is gesteld.
      return await requestAuthorization({ toRead: READ_TYPES });
    } catch (e) {
      if (__DEV__) console.warn('[AppleHealth] toestemming', e);
      return false;
    }
  },
  readDay,
};
