// Haalt dagwaarden op uit de actieve bron, voegt handmatig water toe en
// berekent de score. Toont eerst wat in de cache staat, ververst daarna.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { computeScore, dayProgress, recoveryLevel, RecoveryLevel, ScoreResult } from '../core/score';
import type { DayValues } from '../core/signals';
import { addDays, dayKey, startOfDay } from '../core/time';
import { activeSource } from '../health/sources';
import { useSettings } from '../store/settings';

export interface DayData {
  date: Date;
  key: string;
  values: DayValues;
  result: ScoreResult;
  recovery: RecoveryLevel | null;
  /** True als er (nog) helemaal niets bekend is voor deze dag. */
  empty: boolean;
}

export interface HealthDays {
  days: DayData[];
  loading: boolean;
  error: string | null;
  /** Er is geen bron: geen demo en geen Apple Gezondheid / Health Connect. */
  noSource: boolean;
  refresh: () => Promise<void>;
}

/** Combineert bronwaarden met handmatig gelogd water. */
export function mergeWater(values: DayValues, manualLiters: number): DayValues {
  return { ...values, water: (values.water ?? 0) + manualLiters };
}

/**
 * `count` dagen eindigend op `endDate` (inclusief), oudste eerst.
 */
export function useHealthDays(endDate: Date, count = 1): HealthDays {
  const useDemo = useSettings((s) => s.useDemo);
  const healthConnected = useSettings((s) => s.healthConnected);
  const disabled = useSettings((s) => s.disabledSignals);
  const water = useSettings((s) => s.water);
  const cache = useSettings((s) => s.cache);
  const cacheDay = useSettings((s) => s.cacheDay);
  const setLastSync = useSettings((s) => s.setLastSync);

  const source = useMemo(() => activeSource(useDemo), [useDemo]);
  const endKey = dayKey(endDate);
  const dates = useMemo(() => {
    const end = startOfDay(endDate);
    return Array.from({ length: count }, (_, i) => addDays(end, i - (count - 1)));
    // endKey is de echte afhankelijkheid; endDate is elke render een nieuw object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endKey, count]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);

  const refresh = useCallback(async () => {
    if (!source) return;
    const id = ++runId.current;
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        dates.map(async (d) => {
          try {
            return await source.readDay(d);
          } catch {
            return null;
          }
        }),
      );
      if (id !== runId.current) return; // een nieuwere refresh is al bezig
      const now = Date.now();
      results.forEach((values, i) => {
        if (!values) return;
        const d = dates[i]!;
        cacheDay(dayKey(d), { values, score: computeScore(values).score, fetchedAt: now });
      });
      if (results.every((r) => r === null)) setError('Kon geen gegevens ophalen.');
      setLastSync(now);
    } finally {
      if (id === runId.current) setLoading(false);
    }
  }, [source, dates, cacheDay, setLastSync]);

  // Ophalen bij openen, bij een andere datum of bron, en als de app weer voorgrond krijgt.
  useEffect(() => {
    // Data ophalen bij het openen is precies waar dit effect voor is.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh, healthConnected]);

  const days = useMemo<DayData[]>(
    () =>
      dates.map((date) => {
        const key = dayKey(date);
        const raw = cache[key]?.values ?? {};
        const values = mergeWater(raw, water[key] ?? 0);
        const result = computeScore(values, { disabled, dayProgress: dayProgress(date) });
        return {
          date,
          key,
          values,
          result,
          recovery: recoveryLevel(result),
          empty: !cache[key] && !(water[key] ?? 0),
        };
      }),
    [dates, cache, water, disabled],
  );

  return { days, loading, error, noSource: source === null, refresh };
}
