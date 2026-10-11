// Het design werkt met oklch-kleuren. React Native kent die niet overal,
// dus rekenen we ze om naar gewone hex-kleuren.

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function linearToSrgb(x: number): number {
  const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(1, v));
}

/** oklch(L C H) → "#rrggbb". L 0..1, C ~0..0.4, H in graden. */
export function oklch(L: number, C: number, H: number): string {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);

  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const hex = (v: number) =>
    Math.round(linearToSrgb(v) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(bl)}`;
}

/** Interpoleert tussen twee oklch-kleuren. */
export function mixOklch(
  from: readonly [number, number, number],
  to: readonly [number, number, number],
  t: number,
): string {
  return oklch(lerp(from[0], to[0], t), lerp(from[1], to[1], t), lerp(from[2], to[2], t));
}

/** Kleur van de voortgangsbalk: rood (0) via geel naar groen (100). */
export function scoreColor(score: number): string {
  const t = Math.max(0, Math.min(1, score / 100));
  return oklch(0.7, 0.16, lerp(25, 150, t));
}
