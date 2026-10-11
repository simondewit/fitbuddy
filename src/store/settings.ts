// Alles wat de app onthoudt, lokaal op het toestel. Er is geen server.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DayValues, SignalKey } from '../core/signals';
import { DEFAULT_AVATAR_ID } from '../avatar/registry';
import { isExpoGo, platformSource } from '../health/sources';

export interface CachedDay {
  values: DayValues;
  score: number;
  fetchedAt: number;
}

interface SettingsState {
  onboarded: boolean;
  avatarId: string;
  /** Demodata gebruiken in plaats van een echte bron. */
  useDemo: boolean;
  /** Toestemming voor Apple Gezondheid / Health Connect is gevraagd. */
  healthConnected: boolean;
  disabledSignals: SignalKey[];
  /** Handmatig gelogd water in liters, per dag ("2026-10-11"). */
  water: Record<string, number>;
  /** Laatst berekende dagen, zodat de app direct iets kan tonen. */
  cache: Record<string, CachedDay>;
  lastSync: number | null;

  completeOnboarding: () => void;
  setAvatar: (id: string) => void;
  setUseDemo: (value: boolean) => void;
  setHealthConnected: (value: boolean) => void;
  toggleSignal: (key: SignalKey) => void;
  addWater: (day: string, liters: number) => void;
  setWater: (day: string, liters: number) => void;
  cacheDay: (day: string, entry: CachedDay) => void;
  setLastSync: (time: number) => void;
  reset: () => void;
}

const CACHE_DAYS = 60;

const initial = {
  onboarded: false,
  avatarId: DEFAULT_AVATAR_ID,
  // Zonder echte bron (web, Expo Go) starten we met demodata.
  useDemo: isExpoGo || platformSource() === null,
  healthConnected: false,
  disabledSignals: [] as SignalKey[],
  water: {} as Record<string, number>,
  cache: {} as Record<string, CachedDay>,
  lastSync: null as number | null,
};

/** Houdt alleen de laatste N dagen, zodat opslag niet blijft groeien. */
function prune<T>(record: Record<string, T>, keep: number): Record<string, T> {
  const keys = Object.keys(record).sort().slice(-keep);
  return Object.fromEntries(keys.map((k) => [k, record[k]!]));
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...initial,
      completeOnboarding: () => set({ onboarded: true }),
      setAvatar: (avatarId) => set({ avatarId }),
      setUseDemo: (useDemo) => set({ useDemo, cache: {} }),
      setHealthConnected: (healthConnected) => set({ healthConnected, cache: {} }),
      toggleSignal: (key) =>
        set((s) => ({
          disabledSignals: s.disabledSignals.includes(key)
            ? s.disabledSignals.filter((k) => k !== key)
            : [...s.disabledSignals, key],
        })),
      addWater: (day, liters) =>
        set((s) => ({
          water: prune({ ...s.water, [day]: Math.max(0, Math.round(((s.water[day] ?? 0) + liters) * 100) / 100) }, CACHE_DAYS),
        })),
      setWater: (day, liters) => set((s) => ({ water: prune({ ...s.water, [day]: Math.max(0, liters) }, CACHE_DAYS) })),
      cacheDay: (day, entry) => set((s) => ({ cache: prune({ ...s.cache, [day]: entry }, CACHE_DAYS) })),
      setLastSync: (lastSync) => set({ lastSync }),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'fitbuddy-settings',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
