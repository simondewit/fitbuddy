import { oklch, scoreColor } from '../color';
import { formatGoal, formatHours, formatSignal, formatSteps } from '../format';
import { bandLine, thoughts } from '../lines';
import { computeScore } from '../score';
import { dayKey, sleepWindow, unionDurationMs } from '../time';

describe('format', () => {
  it('uren als 7u12', () => {
    expect(formatHours(7.2)).toBe('7u12');
    expect(formatHours(8)).toBe('8u00');
    expect(formatHours(7.999)).toBe('8u00');
  });
  it('stappen met punt als duizendtal', () => {
    expect(formatSteps(8412)).toBe('8.412');
    expect(formatSteps(1234567)).toBe('1.234.567');
    expect(formatSteps(12)).toBe('12');
  });
  it('per signaal', () => {
    expect(formatSignal('water', 1.4)).toBe('1,4 L');
    expect(formatSignal('restingHr', 58.4)).toBe('58 bpm');
    expect(formatSignal('hrv', null)).toBe('–');
    expect(formatGoal('restingHr', 55)).toBe('≤ 55 bpm');
    expect(formatGoal('sleep', 8)).toBe('8 uur');
  });
});

describe('color', () => {
  it('oklch wit en zwart', () => {
    expect(oklch(1, 0, 0)).toBe('#ffffff');
    expect(oklch(0, 0, 0)).toBe('#000000');
  });
  it('lage score is rood, hoge score is groen', () => {
    const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const [r0, g0] = parse(scoreColor(0));
    const [r1, g1] = parse(scoreColor(100));
    expect(r0!).toBeGreaterThan(g0!);
    expect(g1!).toBeGreaterThan(r1!);
  });
});

describe('lines', () => {
  it('band-zinnen uit het design', () => {
    expect(bandLine(90)).toMatch(/onoverwinnelijk/);
    expect(bandLine(10)).toMatch(/Echt op/);
  });
  it('eerste gedachte gaat over het zwakste signaal', () => {
    const r = computeScore({ sleep: 8, steps: 10000, water: 0.4 });
    const t = thoughts(r);
    expect(t[0]).toBe('0,4 L water. Ik ben in feite een rozijn.');
    expect(new Set(t).size).toBe(t.length);
  });
  it('zonder data een uitnodiging om te koppelen', () => {
    expect(thoughts(computeScore({}))[0]).toMatch(/Koppel een bron/);
  });
});

describe('time', () => {
  it('dayKey is lokaal', () => {
    expect(dayKey(new Date(2026, 9, 11, 23, 59))).toBe('2026-10-11');
  });
  it('slaapvenster loopt van 18:00 de avond ervoor tot 14:00', () => {
    const w = sleepWindow(new Date(2026, 9, 11, 9));
    expect(new Date(w.start).getHours()).toBe(18);
    expect(new Date(w.start).getDate()).toBe(10);
    expect(new Date(w.end).getHours()).toBe(14);
  });
  it('overlappende intervallen tellen één keer', () => {
    const h = 3600_000;
    const total = unionDurationMs([
      { start: 0, end: 4 * h },
      { start: 2 * h, end: 6 * h }, // overlapt
      { start: 7 * h, end: 8 * h },
      { start: 7 * h, end: 7.5 * h }, // valt erbinnen
    ]);
    expect(total).toBe(7 * h);
  });
  it('knipt af op het venster', () => {
    expect(unionDurationMs([{ start: 0, end: 10 }], { start: 5, end: 8 })).toBe(3);
  });
});
