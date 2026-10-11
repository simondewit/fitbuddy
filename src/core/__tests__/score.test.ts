import { computeScore, dayProgress, recoveryLevel, scoreLabel, signalRatio } from '../score';
import { DayValues, SIGNALS, signalConfig } from '../signals';

const FULL: DayValues = {
  sleep: 8,
  steps: 10000,
  workout: 30,
  restingHr: 55,
  hrv: 60,
  water: 2.5,
  activeEnergy: 600,
  mindful: 10,
};

// De drie scenario's uit het design (data.js).
const GOED: DayValues = { sleep: 8.1, steps: 11240, workout: 52, restingHr: 54, hrv: 68, water: 2.4, activeEnergy: 710, mindful: 12 };
const GEMIDDELD: DayValues = { sleep: 6.6, steps: 7380, workout: 25, restingHr: 60, hrv: 51, water: 1.4, activeEnergy: 470, mindful: 3 };
const SLECHT: DayValues = { sleep: 4.9, steps: 2160, workout: 0, restingHr: 69, hrv: 31, water: 0.6, activeEnergy: 140, mindful: 0 };

describe('signalen', () => {
  it('gewichten tellen op tot 100', () => {
    expect(SIGNALS.reduce((s, c) => s + c.weight, 0)).toBe(100);
  });
});

describe('signalRatio', () => {
  it('schaalt lineair tot het doel en kapt af op 1', () => {
    const steps = signalConfig('steps');
    expect(signalRatio(steps, 0)).toBe(0);
    expect(signalRatio(steps, 5000)).toBe(0.5);
    expect(signalRatio(steps, 25000)).toBe(1);
  });

  it('rusthartslag: lager is beter, 55 of lager vol, 72 of hoger nul', () => {
    const rhr = signalConfig('restingHr');
    expect(signalRatio(rhr, 50)).toBe(1);
    expect(signalRatio(rhr, 55)).toBe(1);
    expect(signalRatio(rhr, 72)).toBe(0);
    expect(signalRatio(rhr, 90)).toBe(0);
    expect(signalRatio(rhr, 63.5)).toBeCloseTo(0.5);
  });

  it('negatieve of ongeldige waarden geven 0', () => {
    expect(signalRatio(signalConfig('water'), -1)).toBe(0);
    expect(signalRatio(signalConfig('water'), NaN)).toBe(0);
  });
});

describe('computeScore', () => {
  it('alle doelen gehaald = 100', () => {
    expect(computeScore(FULL).score).toBe(100);
  });

  it('alles nul = 0 (rusthartslag hoog)', () => {
    const r = computeScore({ sleep: 0, steps: 0, workout: 0, restingHr: 80, hrv: 0, water: 0, activeEnergy: 0, mindful: 0 });
    expect(r.score).toBe(0);
    expect(r.available).toBe(8);
  });

  it('komt overeen met de scenario’s uit het design', () => {
    expect(computeScore(GOED).score).toBeGreaterThanOrEqual(85);
    const mid = computeScore(GEMIDDELD).score;
    expect(mid).toBeGreaterThanOrEqual(45);
    expect(mid).toBeLessThan(85);
    expect(computeScore(SLECHT).score).toBe(27); // Op reserve
  });

  it('half van elk doel ≈ 50', () => {
    const r = computeScore({ sleep: 4, steps: 5000, workout: 15, restingHr: 63.5, hrv: 30, water: 1.25, activeEnergy: 300, mindful: 5 });
    expect(r.score).toBe(50);
  });

  it('signalen zonder data tellen niet mee, de rest schaalt op naar 100', () => {
    // Geen smartwatch: geen HRV, geen rusthartslag.
    const r = computeScore({ ...FULL, hrv: null, restingHr: undefined });
    expect(r.score).toBe(100);
    expect(r.available).toBe(6);
    const maxSum = r.signals.reduce((s, x) => s + x.maxPoints, 0);
    expect(maxSum).toBeCloseTo(100);
    expect(r.signals.find((s) => s.key === 'hrv')?.ratio).toBeNull();
  });

  it('een gemeten 0 telt wel mee', () => {
    const r = computeScore({ ...FULL, water: 0 });
    expect(r.score).toBe(90);
  });

  it('uitgezette signalen tellen niet mee', () => {
    const r = computeScore({ ...FULL, mindful: 0 }, { disabled: ['mindful'] });
    expect(r.score).toBe(100);
  });

  it('afwijkende doelen worden gebruikt', () => {
    const r = computeScore({ steps: 6000 }, { overrides: { steps: { goal: 6000 } } });
    expect(r.score).toBe(100);
  });

  it('zonder enige data is de score 0 en available 0', () => {
    const r = computeScore({});
    expect(r.score).toBe(0);
    expect(r.available).toBe(0);
  });
});

describe('scoreLabel', () => {
  it.each([
    [100, 'Topvorm'],
    [85, 'Topvorm'],
    [84, 'Goed in je vel'],
    [65, 'Goed in je vel'],
    [64, 'Gaat wel'],
    [45, 'Gaat wel'],
    [44, 'Op reserve'],
    [25, 'Op reserve'],
    [24, 'Uitgeput'],
    [0, 'Uitgeput'],
  ])('%i → %s', (score, label) => {
    expect(scoreLabel(score)).toBe(label);
  });
});

describe('recoveryLevel', () => {
  it('goed bij volle slaap, HRV en lage rusthartslag', () => {
    expect(recoveryLevel(computeScore(FULL))).toBe('Goed');
  });
  it('matig bij het slechte scenario', () => {
    expect(recoveryLevel(computeScore(SLECHT))).toBe('Matig');
  });
  it('laag bij een gebroken nacht en hoge rusthartslag', () => {
    expect(recoveryLevel(computeScore({ sleep: 3, hrv: 20, restingHr: 75 }))).toBe('Laag');
  });
  it('null zonder slaap, HRV en rusthartslag', () => {
    expect(recoveryLevel(computeScore({ steps: 5000 }))).toBeNull();
  });
});

describe('ochtend begint op 100', () => {
  const at = (h: number, m = 0) => new Date(2026, 9, 11, h, m);

  it('dayProgress: 0 vóór 7:00, 1 vanaf 22:00, lineair ertussen', () => {
    const today = at(0);
    expect(dayProgress(today, at(6))).toBe(0);
    expect(dayProgress(today, at(7))).toBe(0);
    expect(dayProgress(today, at(14, 30))).toBeCloseTo(0.5);
    expect(dayProgress(today, at(22))).toBe(1);
    expect(dayProgress(today, at(23, 59))).toBe(1);
  });

  it('dayProgress: eerdere dagen tellen volledig', () => {
    expect(dayProgress(new Date(2026, 9, 10), at(8))).toBe(1);
  });

  it('goed geslapen, nog niets gedaan, om 7:00 = 100', () => {
    const morning = { sleep: 8, steps: 0, workout: 0, restingHr: 54, hrv: 62, water: 0, activeEnergy: 0, mindful: 0 };
    expect(computeScore(morning, { dayProgress: 0 }).score).toBe(100);
  });

  it('slecht geslapen haalt de ochtendscore omlaag', () => {
    const morning = { sleep: 4, steps: 0, workout: 0, restingHr: 68, hrv: 30, water: 0, activeEnergy: 0, mindful: 0 };
    const r = computeScore(morning, { dayProgress: 0 });
    expect(r.score).toBeLessThan(80);
  });

  it('halverwege de dag geldt het halve doel', () => {
    const r = computeScore({ steps: 5000 }, { dayProgress: 0.5 });
    expect(r.score).toBe(100);
    expect(computeScore({ steps: 2500 }, { dayProgress: 0.5 }).score).toBe(50);
  });

  it('slaap, HRV en rusthartslag schalen niet mee', () => {
    expect(computeScore({ sleep: 4 }, { dayProgress: 0 }).score).toBe(50);
  });
});
