// Shared logic for the health pet: data, HP scoring, moods, speech lines, pixel sprites.
(function () {
  const STATS = [
    { key: 'slaap', label: 'Slaap', goal: 8, unit: 'u', w: 20, src: 'Apple Watch' },
    { key: 'stappen', label: 'Stappen', goal: 10000, unit: '', w: 15, src: 'iPhone' },
    { key: 'workout', label: 'Workout', goal: 30, unit: 'min', w: 15, src: 'Strava' },
    { key: 'rhr', label: 'Rusthartslag', goal: 55, unit: 'bpm', w: 10, src: 'Apple Watch', lowerBetter: true },
    { key: 'hrv', label: 'HRV', goal: 60, unit: 'ms', w: 10, src: 'Apple Watch' },
    { key: 'water', label: 'Water', goal: 2.5, unit: 'L', w: 10, src: 'Handmatig' },
    { key: 'energie', label: 'Actieve energie', goal: 600, unit: 'kcal', w: 10, src: 'Apple Health' },
    { key: 'mindful', label: 'Mindful', goal: 10, unit: 'min', w: 10, src: 'Apple Health' },
  ];

  const SCENARIOS = {
    goed: { slaap: 8.1, stappen: 11240, workout: 52, rhr: 54, hrv: 68, water: 2.4, energie: 710, mindful: 12 },
    gemiddeld: { slaap: 6.6, stappen: 7380, workout: 25, rhr: 60, hrv: 51, water: 1.4, energie: 470, mindful: 3 },
    slecht: { slaap: 4.9, stappen: 2160, workout: 0, rhr: 69, hrv: 31, water: 0.6, energie: 140, mindful: 0 },
  };
  const WEEK = {
    goed: [71, 78, 66, 84, 80, 88],
    gemiddeld: [64, 58, 71, 49, 62, 55],
    slecht: [52, 44, 38, 47, 30, 26],
  };
  const DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];

  const clamp = (v) => Math.max(0, Math.min(1, v));
  function ratio(s, v) {
    if (s.key === 'rhr') return clamp((72 - v) / (72 - s.goal));
    return clamp(v / s.goal);
  }
  function fmt(key, v) {
    if (key === 'slaap') { const h = Math.floor(v), m = Math.round((v - h) * 60); return h + 'u' + String(m).padStart(2, '0'); }
    if (key === 'stappen') return v.toLocaleString('nl-NL');
    if (key === 'water') return v.toFixed(1).replace('.', ',') + ' L';
    if (key === 'workout' || key === 'mindful') return v + ' min';
    if (key === 'rhr') return v + ' bpm';
    if (key === 'hrv') return v + ' ms';
    if (key === 'energie') return v + ' kcal';
    return String(v);
  }
  function fmtGoal(s) {
    if (s.key === 'rhr') return '≤ ' + s.goal + ' bpm';
    if (s.key === 'slaap') return s.goal + 'u';
    return fmt(s.key, s.goal);
  }

  const LINES = {
    slaap: ['{v} slaap? Ik zie letterlijk dubbel.', '{v} geslapen. Ik ben herboren, noem me Phoenix.'],
    stappen: ['{v} stappen. De bank en ik zijn nu officieel een stel.', '{v} stappen! Mijn kuiten hebben een fanclub.'],
    workout: ['Strava vraagt of je nog leeft. Ik eerlijk gezegd ook.', '{v} gesport. De kudos stromen binnen, ik ben beroemd.'],
    rhr: ['Rusthartslag {v}. Rustig is anders, hè.', 'Hartje op {v}. Zen als een kat in de zon.'],
    hrv: ['HRV {v}. Mijn zenuwen zijn spaghetti.', 'HRV {v}. Stress? Nooit van gehoord.'],
    water: ['{v} water. Ik ben in feite een rozijn.', '{v} water. Ik klots, maar wel gezond.'],
    energie: ['{v} verbrand. Mijn calorieën hebben vrij vandaag.', '{v} verbrand. Ik ben een kacheltje.'],
    mindful: ['{v} ademruimte. Eén minuutje dan? Voor mij?', '{v} mindful. Ik zweef een beetje.'],
  };

  const MOODS = [
    { id: 'top', min: 80, label: 'Onverslaanbaar', hue: 150 },
    { id: 'goed', min: 60, label: 'Lekker bezig', hue: 125 },
    { id: 'meh', min: 40, label: 'Gaat wel', hue: 85 },
    { id: 'moe', min: 20, label: 'Op reserve', hue: 55 },
    { id: 'kapot', min: 0, label: 'Bijna game over', hue: 25 },
  ];
  const moodFor = (hp) => MOODS.find((m) => hp >= m.min);
  const hpColor = (hp, l = 0.72, c = 0.17) => 'oklch(' + l + ' ' + c + ' ' + moodFor(hp).hue + ')';

  function compute(scenario) {
    const vals = SCENARIOS[scenario] || SCENARIOS.gemiddeld;
    const stats = STATS.map((s) => {
      const v = vals[s.key], r = ratio(s, v);
      const pts = Math.round(r * s.w);
      const good = r >= 0.95;
      return {
        ...s, value: v, text: fmt(s.key, v), goalText: fmtGoal(s), r, pct: Math.round(r * 100) + '%',
        pts, ptsText: '+' + pts, maxText: '/' + s.w, good,
        barColor: r >= 0.8 ? 'oklch(0.72 0.17 150)' : r >= 0.5 ? 'oklch(0.78 0.15 85)' : 'oklch(0.68 0.17 30)',
        line: LINES[s.key][good ? 1 : 0].replace('{v}', fmt(s.key, v)),
        week: weekFor(s, v),
      };
    });
    const hp = stats.reduce((a, s) => a + s.pts, 0);
    const mood = moodFor(hp);
    const sorted = [...stats].sort((a, b) => a.r - b.r);
    const worst = sorted[0], best = sorted[sorted.length - 1];
    const lines = hp >= 60 ? [best.line, worst.r < 0.8 ? worst.line : sorted[sorted.length - 2].line] : [worst.line, sorted[1].line];
    const week = [...(WEEK[scenario] || WEEK.gemiddeld), hp].map((v, i) => ({
      day: DAYS[i], hp: v, h: v + '%', color: hpColor(v), today: i === 6,
    }));
    return { stats, hp, mood, lines, week, segs: segments(hp, 20) };
  }

  function weekFor(s, v) {
    const f = [0.92, 1.1, 0.8, 1.05, 0.95, 1.15, 1];
    return f.map((k, i) => {
      const val = i === 6 ? v : (s.key === 'stappen' || s.key === 'energie') ? Math.round(v * k) : Math.round(v * k * 10) / 10;
      const r = ratio(s, val);
      return { day: DAYS[i], h: Math.max(4, Math.round(r * 100)) + '%', color: r >= 0.8 ? 'oklch(0.72 0.17 150)' : r >= 0.5 ? 'oklch(0.78 0.15 85)' : 'oklch(0.68 0.17 30)', today: i === 6 };
    });
  }

  function segments(hp, n) {
    const on = Math.round((hp / 100) * n), col = hpColor(hp);
    return Array.from({ length: n }, (_, i) => ({ bg: i < on ? col : 'rgba(28,27,24,0.08)', bgDark: i < on ? col : 'rgba(255,255,255,0.08)', bgLcd: i < on ? '#2f3a1f' : 'rgba(47,58,31,0.15)' }));
  }

  // ---------- Pixel sprites (16x16) ----------
  const BASES = {
    pip: [
      '................', '....HHHHHHHH....', '...HHHHHHHHHH...', '..HHHHHHHHHHHH..',
      '..HHSSSSSSSHHH..', '..HSSSSSSSSSSH..', '..HSSSSSSSSSSH..', '...SSSSSSSSSS...',
      '...SSSSSSSSSS...', '...SSSSSSSSSS...', '....SSSSSSSS....', '.....TTTTTT.....',
      '...TTTTTTTTTT...', '...STTTTTTTTS...', '.....PP..PP.....', '.....FF..FF.....',
    ],
    mochi: [
      '................', '..K..........K..', '..KK........KK..', '..KKKKKKKKKKKK..',
      '.KKKKKKKKKKKKKK.', '.KKKKKKKKKKKKKK.', '.KKKKKKKKKKKKKK.', '.KKKKKKKKKKKKKK.',
      '.KKKKKKKKKKKKKK.', '.KKKKBBBBBBKKKK.', '.KKKBBBBBBBBKKK.', '..KKBBBBBBBBKK..',
      '..KKKBBBBBBKKK..', '..KKKKKKKKKKKK..', '...KK......KK...', '................',
    ],
    bolt: [
      '.......A........', '.......M........', '...MMMMMMMMMM...', '...MMMMMMMMMM...',
      '...MVVVVVVVVM...', '...MVVVVVVVVM...', '...MVVVVVVVVM...', '...MVVVVVVVVM...',
      '...MVVVVVVVVM...', '...MVVVVVVVVM...', '...MVVVVVVVVM...', '...MMMMMMMMMM...',
      '....BBBBBBBB....', '...MBBBBBBBBM...', '....LL....LL....', '....LL....LL....',
    ],
  };
  const PALETTES = {
    pip: { H: '#5a3a2a', S: '#f4c9a0', T: 'oklch(0.7 0.15 30)', P: '#3b4a6b', F: '#222', eye: '#1c1b18', cheek: '#f0927e', mouth: '#7a3b2e' },
    mochi: { K: '#f2efe6', B: '#e3dccb', eye: '#1c1b18', cheek: '#f3a2a2', mouth: '#1c1b18' },
    bolt: { A: 'oklch(0.7 0.17 30)', M: '#b9c1c9', V: '#27313d', B: '#8e99a5', L: '#5f6a76', eye: '#8ff5e2', cheek: '#4cc7b0', mouth: '#8ff5e2' },
  };
  const LCD = { dark: '#2f3a1f', mid: '#5c6b3a', light: '#9fae6e', bg: '#c4cfa1' };
  const AVATARS = [
    { id: 'pip', name: 'Pip', desc: 'Een mensje. Lijkt verdacht veel op jou.' },
    { id: 'mochi', name: 'Mochi', desc: 'Zacht, rond en snel beledigd.' },
    { id: 'bolt', name: 'Bolt', desc: 'Robot. Draait op stappen en water.' },
  ];

  function moodPixels(mood) {
    const L = 5, R = 10, px = [];
    const eye = (x, y) => px.push([x, y, 'eye']);
    const m = (x, y) => px.push([x, y, 'mouth']);
    if (mood === 'top') {
      [[L - 1, 7], [L, 6], [L + 1, 7], [R - 1, 7], [R, 6], [R + 1, 7]].forEach(([x, y]) => eye(x, y));
      [[5, 9], [10, 9], [6, 10], [7, 10], [8, 10], [9, 10]].forEach(([x, y]) => m(x, y));
      px.push([3, 9, 'cheek'], [12, 9, 'cheek']);
    } else if (mood === 'goed') {
      [L, R].forEach((x) => { eye(x, 6); eye(x, 7); });
      [[6, 9], [9, 9], [7, 10], [8, 10]].forEach(([x, y]) => m(x, y));
      px.push([3, 9, 'cheek'], [12, 9, 'cheek']);
    } else if (mood === 'meh') {
      [L, R].forEach((x) => { eye(x, 6); eye(x, 7); });
      [[6, 10], [7, 10], [8, 10], [9, 10]].forEach(([x, y]) => m(x, y));
    } else if (mood === 'moe') {
      [L, R].forEach((x) => { eye(x - 1, 7); eye(x, 7); eye(x + 1, 7); });
      [[7, 9], [8, 9], [7, 10], [8, 10]].forEach(([x, y]) => m(x, y));
    } else {
      [L, R].forEach((x) => { eye(x - 1, 6); eye(x + 1, 6); eye(x, 7); eye(x - 1, 8); eye(x + 1, 8); });
      [[7, 9], [8, 9], [6, 10], [9, 10]].forEach(([x, y]) => m(x, y));
    }
    return px;
  }

  function grid(type, mood, lcd) {
    const base = BASES[type] || BASES.pip, pal = PALETTES[type] || PALETTES.pip;
    const W = 18, g = Array.from({ length: W }, () => Array(W).fill(null));
    base.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') g[y + 1][x + 1] = lcd ? (ch === 'V' || ch === 'H' || ch === 'P' || ch === 'L' ? LCD.mid : LCD.light) : pal[ch]; }));
    moodPixels(mood).forEach(([x, y, k]) => { if (g[y + 1][x + 1]) g[y + 1][x + 1] = lcd ? (k === 'cheek' ? LCD.mid : LCD.dark) : pal[k]; });
    const out = lcd ? LCD.dark : '#1c1b18';
    const o = g.map((r) => r.slice());
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      if (g[y][x]) continue;
      if ((g[y - 1] && g[y - 1][x]) || (g[y + 1] && g[y + 1][x]) || g[y][x - 1] || g[y][x + 1]) o[y][x] = out;
    }
    return o;
  }

  const BOB = { top: '0.9s', goed: '1.4s', meh: '2s', moe: '3s', kapot: '3.6s' };

  function sprite(type, mood, opts = {}) {
    const h = window.React.createElement;
    const px = opts.px || 10, lcd = !!opts.lcd, g = grid(type, mood, lcd), W = g.length;
    const rects = [];
    g.forEach((row, y) => row.forEach((c, x) => { if (c) rects.push(h('rect', { key: x + '-' + y, x, y, width: 1.02, height: 1.02, fill: c })); }));
    const fx = [];
    const ink = lcd ? LCD.dark : (opts.dark ? '#f2f0ea' : '#1c1b18');
    if (mood === 'top') {
      [[-6, 18, '0s'], [W * px - 2, 34, '.5s'], [W * px - 18, -6, '1s']].forEach(([l, t, d], i) =>
        fx.push(h('div', { key: 's' + i, style: { position: 'absolute', left: l, top: t, width: px * 0.8, height: px * 0.8, background: lcd ? LCD.dark : 'oklch(0.82 0.15 85)', animation: 'pet-blink 1.2s steps(2) infinite', animationDelay: d } })));
    }
    if (mood === 'moe' || mood === 'kapot') {
      fx.push(h('div', { key: 'z', style: { position: 'absolute', right: -px * 1.5, top: -px * 0.5, font: '400 ' + Math.round(px * 1.6) + 'px Silkscreen, monospace', color: ink, opacity: 0.6, animation: 'pet-float 2.6s ease-in-out infinite' } }, 'z Z'));
    }
    if (mood === 'kapot') {
      fx.push(h('div', { key: 'd', style: { position: 'absolute', left: px * 2.5, top: px * 3, width: px * 0.8, height: px * 1.4, background: lcd ? LCD.mid : 'oklch(0.75 0.1 230)', animation: 'pet-drip 2s ease-in infinite' } }));
    }
    const svg = h('svg', { viewBox: '0 0 ' + W + ' ' + W, width: W * px, height: W * px, shapeRendering: 'crispEdges', style: { display: 'block', filter: mood === 'kapot' && !lcd ? 'saturate(0.55)' : 'none' } }, rects);
    return h('div', { style: { position: 'relative', width: W * px, height: W * px } },
      h('div', { style: { animation: 'pet-bob ' + BOB[mood] + ' steps(2) infinite' } }, svg),
      h('div', { style: { position: 'absolute', left: '18%', right: '18%', bottom: -px * 0.6, height: px, background: lcd ? LCD.mid : (opts.dark ? 'rgba(255,255,255,0.08)' : 'rgba(28,27,24,0.08)'), borderRadius: '50%' } }),
      ...fx);
  }

  window.PixelPet = { STATS, AVATARS, compute, sprite, moodFor, hpColor, LCD };
})();
