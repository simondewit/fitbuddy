// Parametric vector character. render(h) with h = health 0..1 → expressive face.
(function () {
  const cl = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ok = (a, b, t) => 'oklch(' + lerp(a[0], b[0], t).toFixed(3) + ' ' + lerp(a[1], b[1], t).toFixed(3) + ' ' + lerp(a[2], b[2], t).toFixed(1) + ')';
  const INK = '#3b2a22';

  function render(hIn, opts = {}) {
    const R = window.React, e = R.createElement;
    const h = cl(hIn), size = opts.size || 260, uid = 'f' + (opts.id || Math.round(h * 1000));
    const p = {
      smile: lerp(-0.85, 1, h),
      tired: cl((0.62 - h) / 0.62) * 0.58,
      bags: cl((0.68 - h) / 0.5),
      worry: cl((0.55 - h) / 0.5),
      wrinkles: cl((0.48 - h) / 0.38),
      blush: cl((h - 0.55) / 0.35),
      sparkle: cl((h - 0.35) / 0.4),
      sweat: cl((0.3 - h) / 0.15),
      stray: cl((0.45 - h) / 0.2),
    };
    const skin = ok([0.84, 0.075, 55], [0.82, 0.03, 100], 1 - cl(h * 1.4));
    const skinShade = ok([0.76, 0.085, 50], [0.74, 0.035, 95], 1 - cl(h * 1.4));
    const shirt = ok([0.76, 0.09, 160], [0.72, 0.03, 160], 1 - h);
    const sw = 4;
    const EY = 128, EX = [86, 154];

    const eyes = EX.map((ex, i) => {
      const lidY = EY - 16 + 31 * p.tired;
      const hlY = Math.max(EY - 6, lidY + 5);
      return e('g', { key: 'eye' + i },
        e('defs', null, e('clipPath', { id: uid + 'c' + i }, e('ellipse', { cx: ex, cy: EY, rx: 12, ry: 15 }))),
        e('ellipse', { cx: ex, cy: EY, rx: 12, ry: 15, fill: INK }),
        e('g', { clipPath: 'url(#' + uid + 'c' + i + ')' },
          e('circle', { cx: ex + 4, cy: hlY, r: 4.2, fill: '#fff', opacity: lerp(0.35, 1, p.sparkle) }),
          e('circle', { cx: ex - 4, cy: hlY + 9, r: 2, fill: '#fff', opacity: p.sparkle * 0.8 }),
          p.tired > 0.02 && e('rect', { x: ex - 14, y: EY - 18, width: 28, height: lidY - (EY - 18), fill: skin }),
          p.tired > 0.02 && e('line', { x1: ex - 14, y1: lidY, x2: ex + 14, y2: lidY, stroke: INK, strokeWidth: 3 }),
        ));
    });

    const brows = EX.map((ex, i) => {
      const s = i === 0 ? 1 : -1;
      const outerX = ex - s * 15, innerX = ex + s * 13;
      const innerY = 104 - p.worry * 9 - p.blush * 3, outerY = 103 + p.worry * 4 - p.blush * 4;
      return e('path', { key: 'b' + i, d: 'M' + outerX + ' ' + outerY + ' Q' + ex + ' ' + (Math.min(innerY, outerY) - 5) + ' ' + innerX + ' ' + innerY, stroke: INK, strokeWidth: 4.5, strokeLinecap: 'round', fill: 'none' });
    });

    const bags = EX.map((ex, i) => e('g', { key: 'bg' + i, opacity: p.bags },
      e('ellipse', { cx: ex, cy: 149, rx: 15, ry: 6, fill: 'oklch(0.58 0.07 320)', opacity: 0.3 }),
      e('path', { d: 'M' + (ex - 13) + ' 146 Q' + ex + ' 154 ' + (ex + 13) + ' 146', stroke: 'oklch(0.48 0.07 330)', strokeWidth: 2.6, strokeLinecap: 'round', fill: 'none' }),
      e('path', { d: 'M' + (ex - 9) + ' 152 Q' + ex + ' 158 ' + (ex + 9) + ' 152', stroke: 'oklch(0.48 0.07 330)', strokeWidth: 2, strokeLinecap: 'round', fill: 'none', opacity: cl((p.bags - 0.4) / 0.4) })));

    const crow = [[68, -1], [172, 1]].map(([x, d], i) => e('g', { key: 'cr' + i, stroke: INK, strokeWidth: 2.2, strokeLinecap: 'round', opacity: p.wrinkles * 0.55 },
      e('line', { x1: x, y1: 121, x2: x + d * 7, y2: 117 }),
      e('line', { x1: x + d * 1, y1: 128, x2: x + d * 8, y2: 128 }),
      e('line', { x1: x, y1: 135, x2: x + d * 7, y2: 139 })));

    const forehead = [86, 93].map((y, i) => e('path', { key: 'fw' + i, d: 'M' + (100 + i * 4) + ' ' + y + ' Q' + 110 + ' ' + (y - 3) + ' 120 ' + y + ' Q130 ' + (y + 3) + ' ' + (140 - i * 4) + ' ' + y, stroke: INK, strokeWidth: 2.2, strokeLinecap: 'round', fill: 'none', opacity: p.wrinkles * 0.45 }));

    const c = p.smile, MY = 168, mw = lerp(14, 19, h);
    const mouth = c > 0.55
      ? e('g', null,
          e('path', { d: 'M' + (120 - mw) + ' ' + (MY - 3) + ' Q120 ' + (MY - 3 + 30 * c) + ' ' + (120 + mw) + ' ' + (MY - 3) + ' Z', fill: INK, stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' }),
          e('ellipse', { cx: 120, cy: MY + 8 * c, rx: 7, ry: 3.6, fill: 'oklch(0.68 0.14 20)' }))
      : e('path', { d: 'M' + (120 - mw) + ' ' + MY + ' Q120 ' + (MY + c * 18) + ' ' + (120 + mw) + ' ' + MY, stroke: INK, strokeWidth: 4, strokeLinecap: 'round', fill: 'none' });

    const slumpY = (1 - h) * 7, tilt = (1 - h) * -3;
    const breathe = lerp(5.5, 3.2, h).toFixed(1) + 's';

    return e('svg', { viewBox: '0 0 240 262', width: size, height: size * 262 / 240, style: { display: 'block', overflow: 'visible' } },
      e('ellipse', { cx: 120, cy: 251, rx: 66, ry: 8, fill: 'rgba(59,42,34,0.13)' }),
      e('g', { style: { animation: 'face-breathe ' + breathe + ' ease-in-out infinite' } },
        e('rect', { x: 97, y: 220, width: 18, height: 28, rx: 9, fill: skinShade, stroke: INK, strokeWidth: sw }),
        e('rect', { x: 125, y: 220, width: 18, height: 28, rx: 9, fill: skinShade, stroke: INK, strokeWidth: sw }),
        e('ellipse', { cx: 78, cy: 206, rx: 9, ry: 15, fill: skin, stroke: INK, strokeWidth: sw, transform: 'rotate(' + (12 + (1 - h) * 10) + ' 78 206)' }),
        e('ellipse', { cx: 162, cy: 206, rx: 9, ry: 15, fill: skin, stroke: INK, strokeWidth: sw, transform: 'rotate(' + (-12 - (1 - h) * 10) + ' 162 206)' }),
        e('rect', { x: 80, y: 180, width: 80, height: 50, rx: 24, fill: shirt, stroke: INK, strokeWidth: sw }),
        e('g', { transform: 'translate(0 ' + slumpY + ') rotate(' + tilt + ' 120 200)' },
          e('circle', { cx: 33, cy: 130, r: 13, fill: skin, stroke: INK, strokeWidth: sw }),
          e('circle', { cx: 207, cy: 130, r: 13, fill: skin, stroke: INK, strokeWidth: sw }),
          e('ellipse', { cx: 120, cy: 114, rx: 88, ry: 82, fill: skin, stroke: INK, strokeWidth: sw }),
          e('path', { d: 'M120 28 C116 12 128 6 134 14', stroke: '#4a3328', strokeWidth: 5, strokeLinecap: 'round', fill: 'none', opacity: p.stray }),
          e('path', { d: 'M150 34 C158 22 170 24 168 34', stroke: '#4a3328', strokeWidth: 4, strokeLinecap: 'round', fill: 'none', opacity: p.stray }),
          e('path', { d: 'M34 112 C30 56 72 26 120 26 C168 26 210 56 206 112 C196 92 178 80 158 82 C146 70 126 70 114 80 C96 72 60 82 34 112 Z', fill: '#4a3328', stroke: INK, strokeWidth: sw, strokeLinejoin: 'round' }),
          e('path', { d: 'M70 52 C86 40 104 36 118 36', stroke: '#fff', strokeOpacity: 0.18, strokeWidth: 5, strokeLinecap: 'round', fill: 'none' }),
          ...forehead, ...brows, ...bags,
          e('g', { style: { transformBox: 'fill-box', transformOrigin: 'center', animation: 'face-blink ' + (h > 0.4 ? 4.2 : 6) + 's infinite' } }, ...eyes),
          ...crow,
          e('path', { d: 'M116 146 Q120 151 124 146', stroke: INK, strokeWidth: 2.5, strokeLinecap: 'round', fill: 'none', opacity: 0.55 }),
          e('ellipse', { cx: 70, cy: 158, rx: 13, ry: 7, fill: 'oklch(0.74 0.13 20)', opacity: p.blush * 0.6 }),
          e('ellipse', { cx: 170, cy: 158, rx: 13, ry: 7, fill: 'oklch(0.74 0.13 20)', opacity: p.blush * 0.6 }),
          mouth,
          e('path', { d: 'M190 78 C183 90 183 99 190 99 C197 99 197 90 190 78 Z', fill: 'oklch(0.86 0.06 230)', stroke: INK, strokeWidth: 2.5, opacity: p.sweat }),
        )));
  }

  const LINES = [
    [85, 'Ik voel me onoverwinnelijk. Wie gaat er mee hardlopen?'],
    [65, 'Lekker bezig. Nog één glas water en ik ben helemaal blij.'],
    [45, 'Gaat wel. Een wandeling zou me goed doen, hint hint.'],
    [25, 'Die wallen heb ik van jou, hoor. Vroeg naar bed vanavond?'],
    [0, 'Ik ben op. Echt op. Slapen, water, en dan praten we verder.'],
  ];
  const LABELS = [[85, 'Topvorm'], [65, 'Goed in je vel'], [45, 'Gaat wel'], [25, 'Op reserve'], [0, 'Uitgeput']];
  const pick = (arr, s) => arr.find(([m]) => s >= m)[1];

  window.HealthFace = {
    render,
    line: (s) => pick(LINES, s),
    label: (s) => pick(LABELS, s),
    color: (s) => 'oklch(0.7 0.16 ' + lerp(25, 150, cl(s / 100)).toFixed(0) + ')',
  };
})();
