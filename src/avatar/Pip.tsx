// Pip: het standaard poppetje. Groot hoofd, klein lijfje, korte beentjes.
// Tekent puur op basis van AvatarParams; geen eigen state of animatie.
// Geometrie overgenomen uit docs/design/avatar.js.

import { memo } from 'react';
import { ClipPath, Circle, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { oklch } from '../core/color';
import type { AvatarParams } from './params';

export const PIP_VIEWBOX = { width: 240, height: 262 };

const INK = '#3b2a22';
const HAIR = '#4a3328';
const SW = 4;
const EY = 128;
const EX = [86, 154] as const;
const MY = 168;

const BAG_FILL = oklch(0.58, 0.07, 320);
const BAG_LINE = oklch(0.48, 0.07, 330);
const TONGUE = oklch(0.68, 0.14, 20);
const BLUSH = oklch(0.74, 0.13, 20);
const SWEAT = oklch(0.86, 0.06, 230);

const cl = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface Props {
  p: AvatarParams;
  /** Ogen dicht (knipperen). */
  blink?: boolean;
  /** Uniek per instantie, voor clipPath-ids. */
  uid: string;
}

/** Schaduw onder het poppetje. Staat stil tijdens het ademen. */
export function PipShadow() {
  return <Ellipse cx={120} cy={251} rx={66} ry={8} fill="rgba(59,42,34,0.13)" />;
}

/** Het lijf en hoofd. Dit deel ademt. */
export const PipBody = memo(function PipBody({ p, blink = false, uid }: Props) {
  const lidY = EY - 16 + 31 * p.tired;
  const hlY = Math.max(EY - 6, lidY + 5);
  const c = p.smile;
  const mw = p.mouthWidth;

  return (
    <G>
      {/* Beentjes */}
      <Rect x={97} y={220} width={18} height={28} rx={9} fill={p.skinShade} stroke={INK} strokeWidth={SW} />
      <Rect x={125} y={220} width={18} height={28} rx={9} fill={p.skinShade} stroke={INK} strokeWidth={SW} />
      {/* Armpjes: hangen meer bij lage score */}
      <Ellipse cx={78} cy={206} rx={9} ry={15} fill={p.skin} stroke={INK} strokeWidth={SW} transform={`rotate(${p.armAngle} 78 206)`} />
      <Ellipse cx={162} cy={206} rx={9} ry={15} fill={p.skin} stroke={INK} strokeWidth={SW} transform={`rotate(${-p.armAngle} 162 206)`} />
      {/* Shirt */}
      <Rect x={80} y={180} width={80} height={50} rx={24} fill={p.shirt} stroke={INK} strokeWidth={SW} />

      {/* Hoofd: zakt en kantelt bij lage score */}
      <G transform={`translate(0 ${p.slumpY}) rotate(${p.tilt} 120 200)`}>
        <Circle cx={33} cy={130} r={13} fill={p.skin} stroke={INK} strokeWidth={SW} />
        <Circle cx={207} cy={130} r={13} fill={p.skin} stroke={INK} strokeWidth={SW} />
        <Ellipse cx={120} cy={114} rx={88} ry={82} fill={p.skin} stroke={INK} strokeWidth={SW} />

        {/* Wilde haren */}
        <Path d="M120 28 C116 12 128 6 134 14" stroke={HAIR} strokeWidth={5} strokeLinecap="round" fill="none" opacity={p.stray} />
        <Path d="M150 34 C158 22 170 24 168 34" stroke={HAIR} strokeWidth={4} strokeLinecap="round" fill="none" opacity={p.stray} />
        {/* Haar */}
        <Path
          d="M34 112 C30 56 72 26 120 26 C168 26 210 56 206 112 C196 92 178 80 158 82 C146 70 126 70 114 80 C96 72 60 82 34 112 Z"
          fill={HAIR}
          stroke={INK}
          strokeWidth={SW}
          strokeLinejoin="round"
        />
        <Path d="M70 52 C86 40 104 36 118 36" stroke="#fff" strokeOpacity={0.18} strokeWidth={5} strokeLinecap="round" fill="none" />

        {/* Voorhoofdsrimpels */}
        {[86, 93].map((y, i) => (
          <Path
            key={`fw${i}`}
            d={`M${100 + i * 4} ${y} Q110 ${y - 3} 120 ${y} Q130 ${y + 3} ${140 - i * 4} ${y}`}
            stroke={INK}
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
            opacity={p.wrinkles * 0.45}
          />
        ))}

        {/* Wenkbrauwen */}
        {EX.map((ex, i) => {
          const s = i === 0 ? 1 : -1;
          const outerX = ex - s * 15;
          const innerX = ex + s * 13;
          const innerY = 104 - p.worry * 9 - p.blush * 3;
          const outerY = 103 + p.worry * 4 - p.blush * 4;
          return (
            <Path
              key={`b${i}`}
              d={`M${outerX} ${outerY} Q${ex} ${Math.min(innerY, outerY) - 5} ${innerX} ${innerY}`}
              stroke={INK}
              strokeWidth={4.5}
              strokeLinecap="round"
              fill="none"
            />
          );
        })}

        {/* Wallen */}
        {EX.map((ex, i) => (
          <G key={`bg${i}`} opacity={p.bags}>
            <Ellipse cx={ex} cy={149} rx={15} ry={6} fill={BAG_FILL} opacity={0.3} />
            <Path d={`M${ex - 13} 146 Q${ex} 154 ${ex + 13} 146`} stroke={BAG_LINE} strokeWidth={2.6} strokeLinecap="round" fill="none" />
            <Path
              d={`M${ex - 9} 152 Q${ex} 158 ${ex + 9} 152`}
              stroke={BAG_LINE}
              strokeWidth={2}
              strokeLinecap="round"
              fill="none"
              opacity={cl((p.bags - 0.4) / 0.4)}
            />
          </G>
        ))}

        {/* Ogen, met oogleden die zakken als je moe bent */}
        <G transform={blink ? `translate(0 ${EY}) scale(1 0.08) translate(0 ${-EY})` : undefined}>
          <Defs>
            {EX.map((ex, i) => (
              <ClipPath key={`c${i}`} id={`${uid}c${i}`}>
                <Ellipse cx={ex} cy={EY} rx={12} ry={15} />
              </ClipPath>
            ))}
          </Defs>
          {EX.map((ex, i) => (
            <G key={`eye${i}`}>
              <Ellipse cx={ex} cy={EY} rx={12} ry={15} fill={INK} />
              <G clipPath={`url(#${uid}c${i})`}>
                <Circle cx={ex + 4} cy={hlY} r={4.2} fill="#fff" opacity={lerp(0.35, 1, p.sparkle)} />
                <Circle cx={ex - 4} cy={hlY + 9} r={2} fill="#fff" opacity={p.sparkle * 0.8} />
                {p.tired > 0.02 && <Rect x={ex - 14} y={EY - 18} width={28} height={lidY - (EY - 18)} fill={p.skin} />}
                {p.tired > 0.02 && <Line x1={ex - 14} y1={lidY} x2={ex + 14} y2={lidY} stroke={INK} strokeWidth={3} />}
              </G>
            </G>
          ))}
        </G>

        {/* Kraaienpootjes */}
        {(
          [
            [68, -1],
            [172, 1],
          ] as const
        ).map(([x, d], i) => (
          <G key={`cr${i}`} stroke={INK} strokeWidth={2.2} strokeLinecap="round" opacity={p.wrinkles * 0.55}>
            <Line x1={x} y1={121} x2={x + d * 7} y2={117} />
            <Line x1={x + d} y1={128} x2={x + d * 8} y2={128} />
            <Line x1={x} y1={135} x2={x + d * 7} y2={139} />
          </G>
        ))}

        {/* Neus */}
        <Path d="M116 146 Q120 151 124 146" stroke={INK} strokeWidth={2.5} strokeLinecap="round" fill="none" opacity={0.55} />

        {/* Blosjes */}
        <Ellipse cx={70} cy={158} rx={13} ry={7} fill={BLUSH} opacity={p.blush * 0.6} />
        <Ellipse cx={170} cy={158} rx={13} ry={7} fill={BLUSH} opacity={p.blush * 0.6} />

        {/* Mond: open lach met tongetje, of een lijn van lach tot frons */}
        {c > 0.55 ? (
          <G>
            <Path
              d={`M${120 - mw} ${MY - 3} Q120 ${MY - 3 + 30 * c} ${120 + mw} ${MY - 3} Z`}
              fill={INK}
              stroke={INK}
              strokeWidth={3}
              strokeLinejoin="round"
            />
            <Ellipse cx={120} cy={MY + 8 * c} rx={7} ry={3.6} fill={TONGUE} />
          </G>
        ) : (
          <Path
            d={`M${120 - mw} ${MY} Q120 ${MY + c * 18} ${120 + mw} ${MY}`}
            stroke={INK}
            strokeWidth={4}
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Zweetdruppel */}
        <Path d="M190 78 C183 90 183 99 190 99 C197 99 197 90 190 78 Z" fill={SWEAT} stroke={INK} strokeWidth={2.5} opacity={p.sweat} />
      </G>
    </G>
  );
});
