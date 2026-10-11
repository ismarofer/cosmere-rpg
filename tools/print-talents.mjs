// tools/print-talents.mjs
// Genera un HTML imprimible (una ficha nunca se parte entre páginas) con los
// talentos de un camino y lo emite a stdout / fichero.
// Uso: node tools/print-talents.mjs <pathId> [salida.html]
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(__dirname, '..', 'docs');

const pathId = process.argv[2] || 'danzante';
const outFile = process.argv[3] || resolve(__dirname, '..', `talentos_${pathId}.html`);

const talents = JSON.parse(readFileSync(resolve(DOCS, 'data/talents.json'), 'utf8'));
const paths = JSON.parse(readFileSync(resolve(DOCS, 'data/paths.json'), 'utf8'));
const PATH_NAMES = paths.names;

const SYM = { '1': '▶', '2': '▶▶', '3': '▶▶▶', '0': '▷', 'R': '↺', '*': '✦', '8': '∞' };

// Reutiliza literalmente el bloque CARD_STYLES de docs/js/pages/browser.js.
const browserJs = readFileSync(resolve(DOCS, 'js/pages/browser.js'), 'utf8');
const CARD_STYLES = browserJs.slice(
  browserJs.indexOf('const CARD_STYLES = `') + 'const CARD_STYLES = `'.length,
  browserJs.indexOf('`;', browserJs.indexOf('const CARD_STYLES = `'))
);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function cardHTML(c) {
  const sym = SYM[c.act] || c.act;
  const invB = c.inv ? `<span class="badge b-inv">◆ ${esc(c.inv)}</span>` : '';
  const conB = c.con ? `<span class="badge b-con">◈ ${esc(c.con)}</span>` : '';
  const badges = (invB || conB) ? `<div class="badges">${invB}${conB}</div>` : '';
  const req = (c.req && c.req !== 'ninguno') ? `<span class="creq">Req: ${esc(c.req)}</span>` : '';
  return `<div class="card ${esc(c.path)}">
    <div class="ctag">${esc(PATH_NAMES[c.path] ?? c.path)}</div>
    <div class="ch">
      <div class="cn"><span class="asym">${sym}</span><span>${esc(c.name)}</span></div>
      <div class="cmeta"><span class="cspec">${esc(c.spec)}</span>${req}</div>
      ${badges}
    </div>
    <div class="cb">
      ${c.flavor ? `<div class="cflavor">${esc(c.flavor)}</div>` : ''}
      <div class="cm">${esc(c.mec)}</div>
    </div>
  </div>`;
}

const cards = talents.filter((t) => t.path === pathId);
const title = `Talentos — ${PATH_NAMES[pathId] ?? pathId}`;

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<style>
@page { size: A4 portrait; margin: 8mm; }
* { box-sizing: border-box; }
html, body { margin: 0; background: #fff; font-family: 'Crimson Text', Georgia, serif; }
.sheet { display: flex; flex-wrap: wrap; gap: 4mm; align-content: flex-start; justify-content: flex-start; }
${CARD_STYLES}
/* Impresión: conserva el tamaño físico real de carta (62 × 88 mm, funda estándar)
   y evita que una ficha se parta entre páginas. */
.sheet .card { width: 62mm; height: 88mm; flex: 0 0 auto;
  break-inside: avoid; page-break-inside: avoid; }
</style>
</head>
<body>
<div class="sheet">
${cards.map(cardHTML).join('\n')}
</div>
</body>
</html>`;

writeFileSync(outFile, html, 'utf8');
console.log(`OK ${cards.length} fichas -> ${outFile}`);
