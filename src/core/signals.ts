// De acht signalen die samen de vitaliteitsscore vormen.
// Doelen en gewichten staan hier op één plek. De gewichten tellen op tot 100.

export type SignalKey =
  | 'sleep'
  | 'steps'
  | 'workout'
  | 'restingHr'
  | 'hrv'
  | 'water'
  | 'activeEnergy'
  | 'mindful';

export interface SignalConfig {
  key: SignalKey;
  label: string;
  /** Eenheid voor weergave, alleen informatief. */
  unit: string;
  /** Doelwaarde: op of boven dit doel krijgt het signaal alle punten. */
  goal: number;
  /** Maximaal aantal punten (gewicht). */
  weight: number;
  /**
   * Voor signalen waar lager beter is (rusthartslag): op of onder `goal` alle
   * punten, op of boven `zeroAt` nul punten, daartussen lineair.
   */
  lowerIsBetter?: { zeroAt: number };
  /**
   * Telt op over de dag (stappen, water). Vandaag groeit het doel mee met de
   * klok, zodat je 's ochtends niet al punten mist. Zie dayProgress in score.ts.
   */
  cumulative?: boolean;
}

export const SIGNALS: readonly SignalConfig[] = [
  { key: 'sleep', label: 'Slaap', unit: 'uur', goal: 8, weight: 20 },
  { key: 'steps', label: 'Stappen', unit: 'stappen', goal: 10000, weight: 15, cumulative: true },
  { key: 'workout', label: 'Workout', unit: 'min', goal: 30, weight: 15, cumulative: true },
  { key: 'restingHr', label: 'Rusthartslag', unit: 'bpm', goal: 55, weight: 10, lowerIsBetter: { zeroAt: 72 } },
  { key: 'hrv', label: 'HRV', unit: 'ms', goal: 60, weight: 10 },
  { key: 'water', label: 'Water', unit: 'L', goal: 2.5, weight: 10, cumulative: true },
  { key: 'activeEnergy', label: 'Actieve energie', unit: 'kcal', goal: 600, weight: 10, cumulative: true },
  { key: 'mindful', label: 'Mindful', unit: 'min', goal: 10, weight: 10, cumulative: true },
];

export const SIGNAL_KEYS: readonly SignalKey[] = SIGNALS.map((s) => s.key);

export function signalConfig(key: SignalKey): SignalConfig {
  const found = SIGNALS.find((s) => s.key === key);
  if (!found) throw new Error(`Onbekend signaal: ${key}`);
  return found;
}

/**
 * Meetwaarden van één dag. `null` of ontbrekend betekent: geen data voor dit
 * signaal (bijvoorbeeld geen smartwatch voor HRV). Zo'n signaal telt niet mee
 * en de overige gewichten worden opgeschaald naar 100.
 * Een gemeten 0 (bijvoorbeeld nog geen water gelogd) telt wel mee.
 */
export type DayValues = Partial<Record<SignalKey, number | null>>;
