// Wat het poppetje zegt. Kort, grappig, een beetje brutaal.
// {v} wordt vervangen door de geformatteerde waarde.

import { formatSignal } from './format';
import { ScoreResult } from './score';
import { SignalKey } from './signals';

const BAND_LINES: readonly [number, string][] = [
  [85, 'Ik voel me onoverwinnelijk. Wie gaat er mee hardlopen?'],
  [65, 'Lekker bezig. Nog één glas water en ik ben helemaal blij.'],
  [45, 'Gaat wel. Een wandeling zou me goed doen, hint hint.'],
  [25, 'Die wallen heb ik van jou, hoor. Vroeg naar bed vanavond?'],
  [0, 'Ik ben op. Echt op. Slapen, water, en dan praten we verder.'],
];

/** [als het slecht gaat, als het goed gaat] */
const SIGNAL_LINES: Record<SignalKey, readonly [string, string]> = {
  sleep: ['{v} slaap? Ik zie letterlijk dubbel.', '{v} geslapen. Ik ben herboren, noem me Phoenix.'],
  steps: ['{v} stappen. De bank en ik zijn nu officieel een stel.', '{v} stappen! Mijn kuiten hebben een fanclub.'],
  workout: ['{v} gesport. Mijn spieren vragen of ik nog leef.', '{v} gesport. De kudos stromen binnen, ik ben beroemd.'],
  restingHr: ['Rusthartslag {v}. Rustig is anders, hè.', 'Hartje op {v}. Zen als een kat in de zon.'],
  hrv: ['HRV {v}. Mijn zenuwen zijn spaghetti.', 'HRV {v}. Stress? Nooit van gehoord.'],
  water: ['{v} water. Ik ben in feite een rozijn.', '{v} water. Ik klots, maar wel gezond.'],
  activeEnergy: ['{v} verbrand. Mijn calorieën hebben vrij vandaag.', '{v} verbrand. Ik ben een kacheltje.'],
  mindful: ['{v} ademruimte. Eén minuutje dan? Voor mij?', '{v} mindful. Ik zweef een beetje.'],
};

const NO_DATA_LINE = 'Ik weet nog niks van je vandaag. Koppel een bron, dan gaan we praten.';

export function bandLine(score: number): string {
  return (BAND_LINES.find(([min]) => score >= min) ?? BAND_LINES[BAND_LINES.length - 1]!)[1];
}

export function signalLine(key: SignalKey, value: number, good: boolean): string {
  return SIGNAL_LINES[key][good ? 1 : 0].replace('{v}', formatSignal(key, value));
}

/**
 * Alle gedachten voor vandaag, in volgorde. De eerste verwijst naar het
 * zwakste signaal (als dat duidelijk achterblijft), daarna de algemene zin
 * voor de scoreband, daarna de overige signalen. Tik op het wolkje = volgende.
 */
export function thoughts(result: ScoreResult): string[] {
  if (result.available === 0) return [NO_DATA_LINE];

  const measured = result.signals
    .filter((s) => s.ratio !== null && s.value !== null)
    .sort((a, b) => (a.ratio ?? 0) - (b.ratio ?? 0));

  const out: string[] = [];
  const weakest = measured[0];
  if (weakest && (weakest.ratio ?? 1) < 0.6) {
    out.push(signalLine(weakest.key, weakest.value!, false));
  }
  out.push(bandLine(result.score));
  for (const s of [...measured].reverse()) {
    const line = signalLine(s.key, s.value!, (s.ratio ?? 0) >= 0.95);
    if (!out.includes(line)) out.push(line);
  }
  return out;
}
