// Parameterlaag van het poppetje. Zet gezondheid h (0..1) om naar
// uitdrukking en houding. Bewust los van de tekening: een nieuw poppetje
// (een vrouw, een dier) gebruikt dezelfde parameters met een eigen tekening.
// Overgenomen uit docs/design/avatar.js (functie render).

import { mixOklch } from '../core/color';
import { clamp01 } from '../core/score';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface AvatarParams {
  h: number;
  /** -0.85 (frons) .. 1 (lach). Boven 0.55 een open lach met tong. */
  smile: number;
  /** 0..0.58, hoe ver de oogleden over de ogen zakken. */
  tired: number;
  /** 0..1, wallen onder de ogen. */
  bags: number;
  /** 0..1, bezorgde wenkbrauwen. */
  worry: number;
  /** 0..1, rimpels op voorhoofd en kraaienpootjes. */
  wrinkles: number;
  /** 0..1, blosjes. */
  blush: number;
  /** 0..1, glans in de ogen. */
  sparkle: number;
  /** 0..1, zweetdruppel. */
  sweat: number;
  /** 0..1, wilde haren. */
  stray: number;
  /** Mondbreedte. */
  mouthWidth: number;
  /** Hoeveel het hoofd zakt (px in viewBox). */
  slumpY: number;
  /** Kanteling van het hoofd in graden. */
  tilt: number;
  /** Hoe ver de armpjes hangen, in graden. */
  armAngle: number;
  /** Duur van één ademhaling in seconden (sneller bij hoge score). */
  breatheSeconds: number;
  /** Tijd tussen twee knipperingen in seconden. */
  blinkSeconds: number;
  skin: string;
  skinShade: string;
  shirt: string;
}

export function avatarParams(hIn: number): AvatarParams {
  const h = clamp01(hIn);
  const pale = 1 - clamp01(h * 1.4);
  return {
    h,
    smile: lerp(-0.85, 1, h),
    tired: clamp01((0.62 - h) / 0.62) * 0.58,
    bags: clamp01((0.68 - h) / 0.5),
    worry: clamp01((0.55 - h) / 0.5),
    wrinkles: clamp01((0.48 - h) / 0.38),
    blush: clamp01((h - 0.55) / 0.35),
    sparkle: clamp01((h - 0.35) / 0.4),
    sweat: clamp01((0.3 - h) / 0.15),
    stray: clamp01((0.45 - h) / 0.2),
    mouthWidth: lerp(14, 19, h),
    slumpY: (1 - h) * 7,
    tilt: (1 - h) * -3,
    armAngle: 12 + (1 - h) * 10,
    breatheSeconds: lerp(5.5, 3.2, h),
    blinkSeconds: h > 0.4 ? 4.2 : 6,
    skin: mixOklch([0.84, 0.075, 55], [0.82, 0.03, 100], pale),
    skinShade: mixOklch([0.76, 0.085, 50], [0.74, 0.035, 95], pale),
    shirt: mixOklch([0.76, 0.09, 160], [0.72, 0.03, 160], 1 - h),
  };
}
