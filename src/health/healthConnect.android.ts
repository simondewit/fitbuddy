// Health Connect: de centrale gezondheidsopslag van Android. Samsung Health,
// Google Fit, Garmin, Fitbit, Strava en andere apps schrijven hierheen.
// Alleen in een eigen build (niet in Expo Go). Leest; schrijft nooit.

import {
  aggregateRecord,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
  SleepStageType,
} from 'react-native-health-connect';
import type { Permission } from 'react-native-health-connect';

import type { DayValues } from '../core/signals';
import { dayWindow, Interval, sleepWindow, unionDurationMs } from '../core/time';
import type { Availability, HealthSource } from './types';

const CORE_PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
  { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
  { accessType: 'read', recordType: 'Hydration' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
];
// Mindfulness is nieuwer en niet op elk toestel beschikbaar; apart vragen.
const MINDFUL_PERMISSION: Permission = { accessType: 'read', recordType: 'MindfulnessSession' };

const HOUR = 3600_000;
const MINUTE = 60_000;

let initialized = false;
async function ensureInitialized(): Promise<boolean> {
  if (initialized) return true;
  try {
    initialized = await initialize();
  } catch (e) {
    if (__DEV__) console.warn('[HealthConnect] init', e);
    initialized = false;
  }
  return initialized;
}

const filter = (w: Interval) => ({
  operator: 'between' as const,
  startTime: new Date(w.start).toISOString(),
  endTime: new Date(w.end).toISOString(),
});

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (e) {
    if (__DEV__) console.warn('[HealthConnect]', e);
    return null;
  }
}

const toInterval = (r: { startTime: string; endTime: string }) => ({
  start: new Date(r.startTime).getTime(),
  end: new Date(r.endTime).getTime(),
});

async function readDay(date: Date): Promise<DayValues> {
  if (!(await ensureInitialized())) return {};
  const day = dayWindow(date);
  const night = sleepWindow(date);

  // Aggregaties ontdubbelen automatisch tussen apps (bijv. telefoon + horloge).
  const [steps, energy, water, rhr, hrv, sleep, exercise, mindful] = await Promise.all([
    safe(() => aggregateRecord({ recordType: 'Steps', timeRangeFilter: filter(day) })),
    safe(() => aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter: filter(day) })),
    safe(() => aggregateRecord({ recordType: 'Hydration', timeRangeFilter: filter(day) })),
    safe(() => aggregateRecord({ recordType: 'RestingHeartRate', timeRangeFilter: filter(day) })),
    safe(() => readRecords('HeartRateVariabilityRmssd', { timeRangeFilter: filter(day) })),
    safe(() => readRecords('SleepSession', { timeRangeFilter: filter(night) })),
    safe(() => readRecords('ExerciseSession', { timeRangeFilter: filter(day) })),
    safe(() => readRecords('MindfulnessSession', { timeRangeFilter: filter(day) })),
  ]);

  const sleepRecords = sleep?.records ?? [];
  // Wakker, uit bed en wakker-in-bed (7, nieuwere Android-versies) tellen niet als slaap.
  const AWAKE_STAGES = new Set<number>([SleepStageType.AWAKE, SleepStageType.OUT_OF_BED, 7]);
  const asleepIntervals = sleepRecords.flatMap((r) => {
    const stages = r.stages ?? [];
    if (stages.length === 0) return [toInterval(r)];
    return stages.filter((s) => !AWAKE_STAGES.has(s.stage)).map(toInterval);
  });

  const hrvValues = (hrv?.records ?? []).map((r) => r.heartRateVariabilityMillis).filter(Number.isFinite);
  const rhrAvg = rhr && rhr.dataOrigins.length > 0 ? rhr.BPM_AVG : null;

  return {
    sleep: sleepRecords.length > 0 ? unionDurationMs(asleepIntervals, night) / HOUR : null,
    steps: steps?.COUNT_TOTAL ?? 0,
    workout: unionDurationMs((exercise?.records ?? []).map(toInterval), day) / MINUTE,
    restingHr: rhrAvg,
    hrv: hrvValues.length > 0 ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length : null,
    water: water?.VOLUME_TOTAL?.inLiters ?? 0,
    activeEnergy: energy?.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? 0,
    mindful: unionDurationMs((mindful?.records ?? []).map(toInterval), day) / MINUTE,
  };
}

async function availability(): Promise<Availability> {
  try {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_AVAILABLE) return 'available';
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'needs-install';
    return 'unsupported';
  } catch {
    return 'unsupported';
  }
}

export const healthConnectSource: HealthSource = {
  id: 'health-connect',
  name: 'Health Connect',
  availability,
  requestPermissions: async () => {
    if (!(await ensureInitialized())) return false;
    const granted = await safe(() => requestPermission(CORE_PERMISSIONS));
    await safe(() => requestPermission([MINDFUL_PERMISSION]));
    return (granted?.length ?? 0) > 0;
  },
  readDay,
  openSettings: () => {
    try {
      openHealthConnectSettings();
    } catch (e) {
      if (__DEV__) console.warn('[HealthConnect] instellingen', e);
    }
  },
};
