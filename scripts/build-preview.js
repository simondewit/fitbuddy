// Maakt van de webversie één zelfstandig HTML-bestand (preview/fitbuddy-preview.html)
// dat je overal kunt openen of delen, zonder server.
//
// Gebruik:
//   npx expo export --platform web
//   node scripts/build-preview.js
//
// Wat het doet: de JavaScript-bundel en alle assets (lettertypen, iconen)
// worden in de pagina zelf gezet, en de app wordt in een telefoonbreed kader
// getoond.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const scriptMatch = html.match(/<script src="([^"]+)" defer><\/script>/);
if (!scriptMatch) throw new Error('Geen bundel gevonden in dist/index.html. Draai eerst: npx expo export --platform web');

let bundle = fs.readFileSync(path.join(dist, scriptMatch[1]), 'utf8');

const MIME = { '.ttf': 'font/ttf', '.otf': 'font/otf', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
bundle = bundle.replace(/"(\/assets\/[^"]+)"/g, (whole, url) => {
  const file = path.join(dist, decodeURIComponent(url));
  if (!fs.existsSync(file)) return whole;
  const mime = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  return JSON.stringify(`data:${mime};base64,${fs.readFileSync(file).toString('base64')}`);
});
// Een letterlijke </script> in de bundel zou de pagina afbreken.
bundle = bundle.replace(/<\/script/gi, '<\\/script');

const page = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>FitBuddy testversie</title>
<style>
  :root { --stage: #e9e3d6; --app: #f7f3ea; --ink: #1c1b18; --muted: #8b8478; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --stage: #1f1d1a; --muted: #a59d90; color-scheme: dark; } }
  :root[data-theme="dark"] { --stage: #1f1d1a; --muted: #a59d90; color-scheme: dark; }
  html, body { height: 100%; margin: 0; }
  body { background: var(--stage); overflow: hidden; font-family: system-ui, sans-serif; }
  #root { display: flex; height: 100%; max-width: 430px; margin: 0 auto; background: var(--app); color: var(--ink); }
  @media (min-width: 520px) and (min-height: 700px) {
    body { display: flex; align-items: center; justify-content: center; padding-inline: 16px; }
    #root { height: min(880px, calc(100% - 48px)); width: 100%; border-radius: 36px; overflow: hidden;
            box-shadow: 0 0 0 10px #2a2622, 0 24px 60px rgba(0,0,0,0.25); }
  }
</style>
<script>
  // Expo Router leest het pad uit de adresbalk; start altijd op het hoofdscherm.
  try { if (location.pathname !== '/') history.replaceState(null, '', '/'); } catch (e) {}
</script>
</head>
<body>
<div id="root"></div>
<script>${bundle}</script>
</body>
</html>
`;

const outDir = path.join(root, 'preview');
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'fitbuddy-preview.html');
fs.writeFileSync(out, page);
console.log(`Klaar: ${path.relative(root, out)} (${(page.length / 1024 / 1024).toFixed(1)} MB)`);
