import type { DayValues } from '../core/signals';

export type SourceId = 'apple-health' | 'health-connect' | 'demo';

export type Availability =
  /** Bron werkt op dit toestel. */
  | 'available'
  /** Bron bestaat, maar moet nog geïnstalleerd of bijgewerkt worden (Health Connect). */
  | 'needs-install'
  /** Bron bestaat niet op dit platform (bijv. Apple Health op Android of web). */
  | 'unsupported';

/**
 * Eén databron. Elke bron levert per dag dezelfde DayValues, zodat de
 * rest van de app niet hoeft te weten waar data vandaan komt.
 */
export interface HealthSource {
  id: SourceId;
  name: string;
  availability(): Promise<Availability>;
  /** Vraagt toestemming. Geeft true als de gebruiker (deels) toestemming gaf. */
  requestPermissions(): Promise<boolean>;
  /** Leest de waarden van één kalenderdag. Gooit nooit: bij fouten een lege dag. */
  readDay(date: Date): Promise<DayValues>;
  /** Opent de systeeminstellingen voor deze bron, als dat kan. */
  openSettings?(): void;
}
