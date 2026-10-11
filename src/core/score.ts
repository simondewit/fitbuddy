import { DayValues, SIGNALS, SignalConfig, SignalKey } from './signals';

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** Hoe dicht een waarde bij het doel zit, van 0 tot 1. */
export function signalRatio(config: SignalConfig, value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (config.lowerIsBetter) {
    const { zeroAt } = config.lowerIsBetter;
    return clamp01((zeroAt - value) / (zeroAt - config.goal));
  }
  if (config.goal <= 0) return 1;
  return clamp01(value / config.goal);
}

export interface SignalResult {
  key: SignalKey;
  label: string;
  value: number | null;
  /** 0..1, of null als er geen data is. */
  ratio: number | null;
  /** Behaalde punten na herweging. */
  points: number;
  /** Maximaal haalbare punten na herweging. */
  maxPoints: number;
}

export interface ScoreResult {
  /** Vitaliteitsscore 0..100, afgerond. */
  score: number;
  signals: SignalResult[];
  /** Aantal signalen met data. Nul betekent: nog niets bekend. */
  available: number;
}

export interface ScoreOptions {
  /** Signalen die de gebruiker heeft uitgezet. */
  disabled?: readonly SignalKey[];
  /** Signalen met afwijkende doelen of gewichten. */
  overrides?: Partial<Record<SignalKey, Partial<Pick<SignalConfig, 'goal' | 'weight'>>>>;
}

/**
 * Berekent de vitaliteitsscore.
 * Per signaal: ratio = clamp(waarde / doel), punten = ratio × gewicht.
 * Signalen zonder data of uitgezet tellen niet mee; de rest schaalt op naar 100.
 */
export function computeScore(values: DayValues, options: ScoreOptions = {}): ScoreResult {
  const disabled = new Set(options.disabled ?? []);
  const configs = SIGNALS.map((s) => ({ ...s, ...options.overrides?.[s.key] }));

  const active = configs.filter((c) => {
    const v = values[c.key];
    return !disabled.has(c.key) && v !== null && v !== undefined && Number.isFinite(v);
  });
  const totalWeight = active.reduce((sum, c) => sum + c.weight, 0);
  const scale = totalWeight > 0 ? 100 / totalWeight : 0;

  const signals: SignalResult[] = configs.map((c) => {
    const raw = values[c.key];
    const isActive = active.includes(c);
    if (!isActive || raw === null || raw === undefined) {
      return { key: c.key, label: c.label, value: raw ?? null, ratio: null, points: 0, maxPoints: 0 };
    }
    const ratio = signalRatio(c, raw);
    const maxPoints = c.weight * scale;
    return { key: c.key, label: c.label, value: raw, ratio, points: ratio * maxPoints, maxPoints };
  });

  const total = signals.reduce((sum, s) => sum + s.points, 0);
  return { score: Math.round(Math.max(0, Math.min(100, total))), signals, available: active.length };
}

export type ScoreLabel = 'Topvorm' | 'Goed in je vel' | 'Gaat wel' | 'Op reserve' | 'Uitgeput';

export function scoreLabel(score: number): ScoreLabel {
  if (score >= 85) return 'Topvorm';
  if (score >= 65) return 'Goed in je vel';
  if (score >= 45) return 'Gaat wel';
  if (score >= 25) return 'Op reserve';
  return 'Uitgeput';
}

export type RecoveryLevel = 'Goed' | 'Prima' | 'Matig' | 'Laag';

/**
 * Herstel is afgeleid van HRV, rusthartslag en slaap: het gemiddelde van hun
 * ratio's. Geeft null als geen van de drie bekend is.
 */
export function recoveryLevel(result: ScoreResult): RecoveryLevel | null {
  const parts = result.signals
    .filter((s) => s.key === 'hrv' || s.key === 'restingHr' || s.key === 'sleep')
    .map((s) => s.ratio)
    .filter((r): r is number => r !== null);
  if (parts.length === 0) return null;
  const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
  if (avg >= 0.8) return 'Goed';
  if (avg >= 0.6) return 'Prima';
  if (avg >= 0.4) return 'Matig';
  return 'Laag';
}
