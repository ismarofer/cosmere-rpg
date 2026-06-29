// docs/js/pages/pericias.js
// Renderiza la página de pericias: categorías (pedagógicas, locales),
// pericias concretas (desde data/pericias.json) y vista de cartas.
import { loadData } from '../data-loader.js';

// Texto pedagógico específico de esta página (no es dato compartido).
const CATS = [
  { key: 'peri', name: 'Pericias en arma', tag: 'todos',
    desc: 'Mantenimiento y manejo de un tipo de arma. Te permiten usar sus rasgos de experto, ya que sabes empuñarla mejor en combate (y limpiarla, cuidarla o fabricarla).',
    ej: 'Cualquier arma no especial del capítulo 7: Arco corto, Espada larga, Maza… También Armas improvisadas y Ataques sin armas.' },
  { key: 'peri', name: 'Pericias en armadura', tag: 'todos',
    desc: 'Mantenimiento y uso de un tipo de armadura no infusa. Te dan sus rasgos de experto; algunas eliminan un rasgo perjudicial en vez de añadir uno (p. ej. Malla pierde Voluminosa).',
    ej: 'Cualquier armadura no especial del capítulo 7: Armadura de cuero, Malla, Coraza…' },
  { key: 'peri', name: 'Pericias culturales', tag: 'todos · dan idioma',
    desc: 'Conocimiento regional, social y lingüístico de una nación, cultura o grupo: tradiciones, costumbres, historia y política. Te permiten comunicarte en su idioma (hablado, de signos o escrito).',
    ej: 'Alezi, Azishiana, Herdaziana, Thayleña, Veden, Shin, Iriali, Reshi, Natan, Kharbranthiana… o Alta sociedad, Bajos fondos.' },
  { key: 'peri', name: 'Pericias de utilidad', tag: 'todos',
    desc: 'Herramientas, oficios, conocimientos técnicos y áreas de estudio. Dominas técnicas, equipos y jerga de tu especialidad.',
    ej: 'Cuidado de animales, Estrategia militar, Fabricar armas / armaduras / equipo, Manufactura de fabriales, Historia, Ingeniería, Montar a caballo, Religión.' },
  { key: 'esp', name: 'Pericias especializadas', tag: 'solo talento / recompensa / entrenamiento',
    desc: 'Para armas y armaduras poco habituales. NO se eligen al crear o subir de nivel: solo se obtienen mediante talentos, recompensas o entrenamiento durante el reposo.',
    ej: 'Gran arco, Semiesquirla, Hoja esquirlada, Armadura esquirlada, Martillo de guerra.' }
];

const BENEF = [
  { name: 'Conocimientos supuestos',
    desc: 'Sabes automáticamente lo básico de tu área. Donde otro tendría que tirar Saber, Deducción o Perspicacia para recordar información básica, tú no necesitas tirar.' },
  { name: 'Pensamiento avanzado',
    desc: 'Puedes hacer pruebas imposibles para otros. P. ej., solo con Manufactura de fabriales puedes tirar Deducción para entender el fabrial enemigo. Y un éxito te da más información que a un profano.' },
  { name: 'Usos creativos',
    desc: 'Las pericias son herramientas narrativas abiertas. Si crees que la tuya debería darte una prueba, un dato o un beneficio situacional, proponlo a la DJ.' },
  { name: 'Idiomas conocidos',
    desc: 'Una pericia cultural te permite comunicarte en su idioma (con la fluidez que decidas). Otras pericias pueden darte jerga o palabras clave del tema (p. ej. la jerga de los bajos fondos).' }
];

const { pericias } = await loadData(['pericias']);

// Map key -> categoría
const byKey = Object.fromEntries(pericias.map(p => [p.key, p]));

function listSection(data) {
  const grupos = data.grupos.map(g => `
    <div class="lst-grupo">
      <div class="lst-sub">${g.sub}</div>
      <div class="lst-items">${g.items.map(i => `<span class="chip">${i}</span>`).join('')}</div>
    </div>`).join('');
  return `<div class="lst-block">
    ${grupos}
    ${data.nota ? `<div class="lst-nota">${data.nota}</div>` : ''}
  </div>`;
}

const sections = [
  ['lst-cultural', 'cultural'],
  ['lst-utilidad', 'utilidad'],
  ['lst-arma', 'arma'],
  ['lst-armadura', 'armadura'],
  ['lst-especial', 'especial']
];
for (const [elId, key] of sections) {
  const data = byKey[key];
  if (data) document.getElementById(elId).innerHTML = listSection(data);
}

document.getElementById('cats').innerHTML = CATS.map(c => `
  <div class="cat ${c.key === 'esp' ? 'especial' : ''}">
    <div class="cat-name">${c.name} <span class="cat-tag">${c.tag}</span></div>
    <div class="cat-desc">${c.desc}</div>
    <div class="cat-ej"><b>Ejemplos:</b> ${c.ej}</div>
  </div>`).join('');

document.getElementById('benef').innerHTML = BENEF.map(b => `
  <div class="benef">
    <div class="benef-name">${b.name}</div>
    <div class="benef-desc">${b.desc}</div>
  </div>`).join('');

function catCard(c) {
  const cls = c.key === 'esp' ? 'peri esp' : 'peri';
  return `<div class="card ${cls}">
    <div class="ctag">Categoría de pericia</div>
    <div class="ch"><div class="cn">${c.name}</div></div>
    <div class="cb">
      <div class="cm">${c.desc}</div>
      <div class="cej"><b>Ejemplos:</b> ${c.ej}</div>
    </div>
  </div>`;
}
function benCard(b) {
  return `<div class="card peri ben">
    <div class="ctag">Beneficio de pericia</div>
    <div class="ch"><div class="cn">${b.name}</div></div>
    <div class="cb"><div class="cm">${b.desc}</div></div>
  </div>`;
}
function listCard(data, clsExtra) {
  const grupos = data.grupos.map(g =>
    `<div style="margin-bottom:5px"><div style="font-size:9px;font-style:italic;color:#999;font-family:Georgia,serif;margin-bottom:2px">${g.sub}</div><div style="font-size:10px;line-height:1.5;color:#333">${g.items.join(' · ')}</div></div>`
  ).join('');
  return `<div class="card peri ${clsExtra || ''}">
    <div class="ctag">Pericias concretas</div>
    <div class="ch"><div class="cn">${data.nom}</div></div>
    <div class="cb" style="gap:4px">${grupos}</div>
  </div>`;
}

let html = '<div class="section-header" style="background:#336699">Categorías de pericia</div>';
html += CATS.map(catCard).join('');
html += '<div class="section-header" style="background:#5A4A2A">Beneficios</div>';
html += BENEF.map(benCard).join('');
html += '<div class="section-header" style="background:#222">Pericias concretas del manual</div>';
if (byKey.cultural) html += listCard(byKey.cultural);
if (byKey.utilidad) html += listCard(byKey.utilidad);
if (byKey.arma) html += listCard(byKey.arma);
if (byKey.armadura) html += listCard(byKey.armadura);
if (byKey.especial) html += listCard(byKey.especial, 'esp');

document.getElementById('grid').innerHTML = html;

window.setMode = function setMode(m) {
  document.getElementById('sheet').style.display = m === 'ref' ? 'block' : 'none';
  document.getElementById('cards-wrap').style.display = m === 'cards' ? 'block' : 'none';
  document.getElementById('b-ref').classList.toggle('on', m === 'ref');
  document.getElementById('b-cards').classList.toggle('on', m === 'cards');
};
