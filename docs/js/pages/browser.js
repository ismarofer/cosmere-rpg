// docs/js/pages/browser.js
// Buscador unificado de todo el material: talentos, potencias, acciones,
// objetos, estados y pericias. Cada elemento es compartible por URL
// (?type=...&id=...) y se muestra como tarjeta completa en un modal.
import { loadData } from '../data-loader.js';

// ─────────────────────────────────────────────────────────────
// Datos
// ─────────────────────────────────────────────────────────────
const { talents, items, powers, actions, conditions, pericias, paths } =
  await loadData(['talents', 'items', 'powers', 'actions', 'conditions', 'pericias', 'paths']);

const SYM = { '1': '▶', '2': '▶▶', '3': '▶▶▶', '0': '▷', 'R': '↺', '*': '✦', '8': '∞' };
const COST_LABEL = {
  '1': '1 acción', '2': '2 acciones', '3': '3 acciones',
  '0': 'Acción gratuita', 'R': 'Reacción',
  '*': 'Especial / estado', '8': 'Siempre activo'
};

const PATH_NAMES = paths.names;
const PATH_ORDER = paths.order;
const PATH_COLORS = {};
for (const cat of Object.values(paths.categories)) {
  for (const p of cat) PATH_COLORS[p.id] = p.c;
}

const POWERS = powers.powers;
const PW_ACTIONS = powers.actions;
const POWER_NAMES = powers.names;
const POWER_COLORS = powers.colors.main;
const POWER_TINTS = powers.colors.tint;
const POWER_DARK = powers.colors.dark;

const ITEM_CATS = {
  al: 'Armamento ligero', ap: 'Armamento pesado', ae: 'Arma especial',
  ar: 'Armadura', fc: 'Fabrial común', fu: 'Fabrial único',
  co: 'Consumible', eq: 'Equipo'
};
const ITEM_LABELS = {
  al: 'Armas ligeras', ap: 'Armas pesadas', ae: 'Armas especiales',
  ar: 'Armaduras', fc: 'Fabriales comunes', fu: 'Fabriales únicos',
  co: 'Consumibles', eq: 'Equipo'
};
const ITEM_COLORS = {
  al: '#7A5299', ap: '#8B2222', ae: '#5A4A2A', ar: '#336699',
  fc: '#AA6622', fu: '#884422', co: '#3D6B35', eq: '#555'
};
const ITEM_ORDER = ['al', 'ap', 'ae', 'ar', 'fc', 'fu', 'co', 'eq'];

const PERICIA_CATS = [
  { key: 'peri', name: 'Pericias en arma', tag: 'todos',
    desc: 'Mantenimiento y manejo de un tipo de arma. Te permiten usar sus rasgos de experto, ya que sabes empuñarla mejor en combate (y limpiarla, cuidarla o fabricarla).',
    ej: 'Cualquier arma no especial del capítulo 7: Arco corto, Espada larga, Maza… También Armas improvisadas y Ataques sin armas.' },
  { key: 'peri', name: 'Pericias en armadura', tag: 'todos',
    desc: 'Mantenimiento y uso de un tipo de armadura no infusa. Te dan sus rasgos de experto; algunas eliminan un rasgo perjudicial en vez de añadir uno (p. ej. Malla pierde Voluminosa).',
    ej: 'Cualquier armadura no especial del capítulo 7: Armadura de cuero, Malla, Coraza…' },
  { key: 'peri', name: 'Pericias culturales', tag: 'todos · dan idioma',
    desc: 'Conocimiento regional, social y lingüístico de una nación, cultura o grupo: tradiciones, costumbres, historia y política. Te permiten comunicarte en su idioma.',
    ej: 'Alezi, Azishiana, Herdaziana, Thayleña, Veden, Shin, Iriali, Reshi, Natan, Kharbranthiana… o Alta sociedad, Bajos fondos.' },
  { key: 'peri', name: 'Pericias de utilidad', tag: 'todos',
    desc: 'Herramientas, oficios, conocimientos técnicos y áreas de estudio. Dominas técnicas, equipos y jerga de tu especialidad.',
    ej: 'Cuidado de animales, Estrategia militar, Fabricar armas / armaduras / equipo, Manufactura de fabriales, Historia, Ingeniería, Montar a caballo, Religión.' },
  { key: 'esp', name: 'Pericias especializadas', tag: 'solo talento / recompensa / entrenamiento',
    desc: 'Para armas y armaduras poco habituales. NO se eligen al crear o subir de nivel: solo se obtienen mediante talentos, recompensas o entrenamiento durante el reposo.',
    ej: 'Gran arco, Semiesquirla, Hoja esquirlada, Armadura esquirlada, Martillo de guerra.' }
];

// ─────────────────────────────────────────────────────────────
// Estilos para tarjetas (inyectados una sola vez)
// ─────────────────────────────────────────────────────────────
const CARD_STYLES = `
/* CARTA BASE — compartida entre tipos clase-based */
.card{width:62mm;max-width:100%;height:88mm;border-radius:8px;overflow:hidden;
  display:flex;flex-direction:column;background:#fff;border:1.5px solid #aaa;
  font-family:'Crimson Text',Georgia,serif}
.ctag{font-size:8px;font-family:Georgia,serif;font-weight:700;letter-spacing:0.1em;
  text-transform:uppercase;color:#fff;padding:3px 10px;text-align:center}
.ch{padding:8px 10px 7px;border-bottom:1px solid rgba(0,0,0,0.08)}
.cn{font-size:14px;font-weight:600;font-family:'Cinzel',serif;color:#111;line-height:1.2;
  display:flex;align-items:baseline;gap:6px;margin-bottom:5px}
.asym{font-size:14px;font-weight:700;flex-shrink:0;line-height:1}
.cmeta{display:flex;flex-direction:column;gap:1px;margin-bottom:5px}
.cspec{font-size:9px;font-family:Georgia,serif;font-weight:600;letter-spacing:0.04em;text-transform:uppercase}
.csub{font-size:9px;font-family:Georgia,serif;font-weight:600;letter-spacing:0.05em;text-transform:uppercase}
.creq,.ccost{font-size:9px;font-family:Georgia,serif;font-style:italic;color:#888}
.ccost{font-style:normal;font-weight:600;text-transform:uppercase;letter-spacing:0.04em}
.badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px}
.badge{display:flex;align-items:center;gap:2px;font-size:10px;font-family:Georgia,serif;font-weight:600;
  padding:2px 5px;border-radius:4px;border:1px solid;line-height:1.3}
.b-inv{background:#fff8e7;border-color:#d4900a;color:#6b3d00}
.b-con{background:#fef0f0;border-color:#d08080;color:#6b1515}
.cb{padding:8px 10px;flex:1;display:flex;flex-direction:column;gap:5px;overflow:hidden}
.cflavor{font-size:10px;line-height:1.4;color:#666;font-style:italic}
.cm{font-size:11px;line-height:1.48;color:#222;padding:5px 7px;border-left:2px solid}
.cej{font-size:10px;line-height:1.4;color:#555}
.cej b{font-family:Georgia,serif;font-style:italic;color:#999;font-weight:600}

/* Stats grid (objetos) */
.stats{display:grid;gap:2px;padding:6px 10px;border-bottom:1px solid rgba(0,0,0,0.06)}
.stat-row{display:flex;justify-content:space-between;align-items:baseline;font-size:11px;line-height:1.4}
.stat-label{color:#888;font-family:Georgia,serif;font-style:italic}
.stat-val{color:#111;font-weight:600;font-family:Georgia,serif;text-align:right;max-width:65%;word-break:break-word}
.mechblock{font-size:11px;line-height:1.42;color:#222;padding:4px 7px;border-left:2px solid}
.mejora-block,.inconveniente-block{font-size:10px;line-height:1.38;padding:3px 7px;border-radius:0 3px 3px 0;border-left:2px solid}

/* Colores por camino (talentos) */
.agente{border-color:#8B5A2B}.agente .asym{color:#6B3A15}.agente .cm{border-color:#8B5A2B;background:#fdf5ee}.agente .cspec{color:#6B3A15}.agente .ctag{background:#8B5A2B}
.cazador{border-color:#3D6B35}.cazador .asym{color:#2A5225}.cazador .cm{border-color:#3D6B35;background:#eef5ec}.cazador .cspec{color:#2A5225}.cazador .ctag{background:#3D6B35}
.enviado{border-color:#7A5299}.enviado .asym{color:#5A3579}.enviado .cm{border-color:#7A5299;background:#f5eefb}.enviado .cspec{color:#5A3579}.enviado .ctag{background:#7A5299}
.erudito{border-color:#336699}.erudito .asym{color:#1a4a77}.erudito .cm{border-color:#336699;background:#edf3fb}.erudito .cspec{color:#1a4a77}.erudito .ctag{background:#336699}
.guerrero{border-color:#8B2222}.guerrero .asym{color:#6B1111}.guerrero .cm{border-color:#8B2222;background:#fdeeed}.guerrero .cspec{color:#6B1111}.guerrero .ctag{background:#8B2222}
.lider{border-color:#996633}.lider .asym{color:#6B4515}.lider .cm{border-color:#996633;background:#fdf6eb}.lider .cspec{color:#6B4515}.lider .ctag{background:#996633}
.corredor{border-color:#185FA5}.corredor .asym{color:#0C447C}.corredor .cm{border-color:#185FA5;background:#eef4fc}.corredor .cspec{color:#0C447C}.corredor .ctag{background:#185FA5}
.custodio{border-color:#5A4A2A}.custodio .asym{color:#3A2A0A}.custodio .cm{border-color:#5A4A2A;background:#f7f3ea}.custodio .cspec{color:#3A2A0A}.custodio .ctag{background:#5A4A2A}
.danzante{border-color:#0F6E56}.danzante .asym{color:#085041}.danzante .cm{border-color:#0F6E56;background:#edf9f5}.danzante .cspec{color:#085041}.danzante .ctag{background:#0F6E56}
.escultor{border-color:#9933AA}.escultor .asym{color:#6B1A7A}.escultor .cm{border-color:#9933AA;background:#f8eefa}.escultor .cspec{color:#6B1A7A}.escultor .ctag{background:#9933AA}
.nominador{border-color:#336655}.nominador .asym{color:#1A4435}.nominador .cm{border-color:#336655;background:#eef5f0}.nominador .cspec{color:#1A4435}.nominador .ctag{background:#336655}
.portador{border-color:#884422}.portador .asym{color:#5A2A0A}.portador .cm{border-color:#884422;background:#faf0ea}.portador .cspec{color:#5A2A0A}.portador .ctag{background:#884422}
.rompedor{border-color:#225588}.rompedor .asym{color:#0A3360}.rompedor .cm{border-color:#225588;background:#eef1fa}.rompedor .cspec{color:#0A3360}.rompedor .ctag{background:#225588}
.tejedor{border-color:#AA6622}.tejedor .asym{color:#7A3A0A}.tejedor .cm{border-color:#AA6622;background:#fdf3e8}.tejedor .cspec{color:#7A3A0A}.tejedor .ctag{background:#AA6622}
.vigilante{border-color:#445588}.vigilante .asym{color:#223366}.vigilante .cm{border-color:#445588;background:#eef0fa}.vigilante .cspec{color:#223366}.vigilante .ctag{background:#445588}

/* Colores por categoría (objetos) */
.al{border-color:#7A5299}.al .ctag{background:#7A5299}.al .mechblock{border-color:#7A5299;background:#f5eefb}.al .csub{color:#5A3579}
.ap{border-color:#8B2222}.ap .ctag{background:#8B2222}.ap .mechblock{border-color:#8B2222;background:#fdeeed}.ap .csub{color:#6B1111}
.ae{border-color:#5A4A2A}.ae .ctag{background:#5A4A2A}.ae .mechblock{border-color:#5A4A2A;background:#f7f3ea}.ae .csub{color:#3A2A0A}
.ar{border-color:#336699}.ar .ctag{background:#336699}.ar .mechblock{border-color:#336699;background:#edf3fb}.ar .csub{color:#1a4a77}
.fc{border-color:#AA6622}.fc .ctag{background:#AA6622}.fc .mechblock{border-color:#AA6622;background:#fdf3e8}.fc .csub{color:#7A3A0A}
.fu{border-color:#884422;border-width:2px}.fu .ctag{background:#884422}.fu .mechblock{border-color:#884422;background:#faf0ea}.fu .csub{color:#5A2A0A}
.fu .mejora-block{border-color:#0F6E56;background:#edf9f5;color:#085041}
.fu .inconveniente-block{border-color:#8B2222;background:#fdeeed;color:#6B1111}
.co{border-color:#3D6B35}.co .ctag{background:#3D6B35}.co .mechblock{border-color:#3D6B35;background:#eef5ec}.co .csub{color:#2A5225}
.eq{border-color:#555}.eq .ctag{background:#555}.eq .mechblock{border-color:#555;background:#f4f4f4}.eq .csub{color:#333}

/* Acciones */
.combate{border-color:#8B2222}.combate .ctag{background:#8B2222}.combate .asym{color:#8B2222}.combate .ccost{color:#6B1111}.combate .cm{border-color:#8B2222;background:#fdeeed}
.luz{border-color:#185FA5}.luz .ctag{background:#185FA5}.luz .asym{color:#185FA5}.luz .ccost{color:#0C447C}.luz .cm{border-color:#185FA5;background:#eef4fc}

/* Estados */
.estado{border-color:#5A4A2A}.estado .ctag{background:#5A4A2A}.estado .cm{border-color:#5A4A2A;background:#f7f3ea}
.estado.buff{border-color:#0F6E56}.estado.buff .ctag{background:#0F6E56}.estado.buff .cm{border-color:#0F6E56;background:#edf9f5}

/* Pericias */
.peri{border-color:#336699}.peri .ctag{background:#336699}.peri .cm{border-color:#336699;background:#edf3fb}
.peri.esp{border-color:#7A3A0A}.peri.esp .ctag{background:#7A3A0A}.peri.esp .cm{border-color:#7A3A0A;background:#fdf3e8}
.peri.ben{border-color:#5A4A2A}.peri.ben .ctag{background:#5A4A2A}.peri.ben .cm{border-color:#5A4A2A;background:#f7f3ea}

/* Potencias (pcard/acard usan inline styles) */
.pcard{width:62mm;max-width:100%;height:88mm;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;
  background:#fff;font-family:'Crimson Text',Georgia,serif;border:2px solid}
.ptag{font-size:8.5px;font-family:Georgia,serif;font-weight:700;letter-spacing:0.1em;
  text-transform:uppercase;color:#fff;padding:3px 10px;text-align:center}
.ph{padding:8px 10px 7px;border-bottom:1px solid rgba(0,0,0,0.08)}
.pn{font-size:15px;font-weight:600;font-family:'Cinzel',serif;color:#111;display:flex;align-items:baseline;gap:6px;line-height:1.15}
.pn .asym{font-size:14px;font-weight:700;flex-shrink:0}
.pattr{font-size:9px;font-family:Georgia,serif;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-top:4px}
.porders{font-size:8.5px;font-family:Georgia,serif;font-weight:600;letter-spacing:0.03em;text-transform:uppercase;margin-top:1px;opacity:0.75}
.pb{padding:7px 10px;flex:1;display:flex;flex-direction:column;gap:5px;overflow:hidden}
.pdesc{font-size:11px;line-height:1.4;color:#444;font-style:italic}
.pmec{font-size:11px;line-height:1.42;color:#222;padding:5px 7px;border-left:2px solid}
.acard{width:62mm;max-width:100%;height:88mm;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;
  background:#fff;font-family:'Crimson Text',Georgia,serif;border:1.5px dashed}
.atag{font-size:8px;font-family:Georgia,serif;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;
  padding:3px 10px;text-align:center;font-style:italic}
.ah{padding:8px 10px 6px;border-bottom:1px solid rgba(0,0,0,0.07)}
.an{font-size:13px;font-weight:600;font-family:'Cinzel',serif;color:#111;display:flex;align-items:baseline;gap:5px;line-height:1.15}
.an .asym{font-size:13px;font-weight:700;flex-shrink:0}
.acond{font-size:9px;font-family:Georgia,serif;font-style:italic;color:#999;margin-top:4px}
.ab-body{padding:7px 10px;flex:1;overflow:hidden}
.amec{font-size:11px;line-height:1.42;color:#222}

/* En el modal: tarjeta más ancha y sin altura fija */
.modal-box .card,.modal-box .pcard,.modal-box .acard{width:min(420px,100%);height:auto;min-height:0;margin:0 auto}

/* Adversarios (para coherencia visual con la página de adversarios) */
.adv-mini{background:#f8f4ef;border:1px solid #c9b88f;border-radius:8px;padding:10px 12px}
.adv-mini .anm{font-family:'Cinzel',serif;font-weight:600;color:#5a3a1f;font-size:14px}
.adv-mini .arol{font-size:11px;font-style:italic;color:#9a7a4a}
`;

function injectCardStyles() {
  if (document.getElementById('cr-card-styles')) return;
  const s = document.createElement('style');
  s.id = 'cr-card-styles';
  s.textContent = CARD_STYLES;
  document.head.appendChild(s);
}
injectCardStyles();

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function stripTags(s) { return String(s ?? '').replace(/<[^>]+>/g, ' '); }
function norm(s) { return String(s ?? '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

// ─────────────────────────────────────────────────────────────
// Tipos definidos para el buscador
// ─────────────────────────────────────────────────────────────
const TYPES = [
  { id: 'all',      label: 'Todo',       color: '#444' },
  { id: 'talento',  label: 'Talentos',   color: '#7a1f1f' },
  { id: 'potencia', label: 'Potencias',  color: '#185FA5' },
  { id: 'accion',   label: 'Acciones',   color: '#8B2222' },
  { id: 'objeto',   label: 'Objetos',    color: '#5A4A2A' },
  { id: 'estado',   label: 'Estados',    color: '#5A4A2A' },
  { id: 'pericia',  label: 'Pericias',   color: '#336699' }
];

// ─────────────────────────────────────────────────────────────
// Renderizadores de tarjeta completa (para el modal)
// ─────────────────────────────────────────────────────────────
function renderTalent(t) {
  const sym = SYM[t.act] || t.act || '';
  const invB = t.inv ? `<span class="badge b-inv">◆ ${esc(t.inv)}</span>` : '';
  const conB = t.con ? `<span class="badge b-con">◈ ${esc(t.con)}</span>` : '';
  const badges = (invB || conB) ? `<div class="badges">${invB}${conB}</div>` : '';
  const req = (t.req && t.req !== 'ninguno') ? `<span class="creq">Req: ${esc(t.req)}</span>` : '';
  return `<div class="card ${esc(t.path)}">
    <div class="ctag">${esc(PATH_NAMES[t.path] ?? t.path)}</div>
    <div class="ch">
      <div class="cn"><span class="asym">${sym}</span><span>${esc(t.name)}</span></div>
      <div class="cmeta">
        <span class="cspec">${esc(t.spec)}</span>
        ${req}
      </div>
      ${badges}
    </div>
    <div class="cb">
      ${t.flavor ? `<div class="cflavor">${esc(t.flavor)}</div>` : ''}
      <div class="cm">${t.mec}</div>
    </div>
  </div>`;
}

function renderItem(it) {
  const c = it.cat;
  const visibleStats = (it.stats || []).filter(([l]) => !/peso|precio|coste/i.test(l));
  const statsHTML = visibleStats.map(([l, v]) => `
    <div class="stat-row">
      <span class="stat-label">${esc(l)}</span>
      <span class="stat-val">${v}</span>
    </div>`).join('');
  const mecHTML = it.mec ? `<div class="mechblock">${it.mec}</div>` : '';
  const mejHTML = it.mej ? `<div class="mejora-block">✦ Mejora: ${it.mej}</div>` : '';
  const incHTML = it.inc ? `<div class="inconveniente-block">✗ Inconveniente: ${it.inc}</div>` : '';
  return `<div class="card ${esc(c)}">
    <div class="ctag">${esc(ITEM_CATS[c] || c)}</div>
    <div class="ch">
      <div class="cn"><span>${esc(it.name)}</span></div>
      ${it.sub ? `<div class="csub">${esc(it.sub)}</div>` : ''}
    </div>
    ${visibleStats.length ? `<div class="stats">${statsHTML}</div>` : ''}
    ${(mecHTML || mejHTML || incHTML) ? `<div class="cb">${mecHTML}${mejHTML}${incHTML}</div>` : ''}
  </div>`;
}

function renderPower(p) {
  const c = POWER_COLORS[p.key], tint = POWER_TINTS[p.key], dark = POWER_DARK[p.key];
  const invB = p.inv ? `<div class="badges"><span class="badge b-inv">◆ ${esc(p.inv)}</span></div>` : '';
  return `<div class="pcard" style="border-color:${c}">
    <div class="ptag" style="background:${c}">${esc(POWER_NAMES[p.key])}</div>
    <div class="ph">
      <div class="pn"><span class="asym" style="color:${c}">${SYM[p.act] || p.act}</span><span>${esc(POWER_NAMES[p.key])}</span></div>
      <div class="pattr" style="color:${dark}">Atributo: ${esc(p.attr)}</div>
      <div class="porders" style="color:${dark}">${esc(p.orders)}</div>
      ${invB}
    </div>
    <div class="pb">
      <div class="pdesc">${esc(p.desc)}</div>
      <div class="pmec" style="border-color:${c};background:${tint}">${p.mec}</div>
    </div>
  </div>`;
}

function renderPowerAction(a) {
  const c = POWER_COLORS[a.power], dark = POWER_DARK[a.power];
  const light = c + '55';
  const invB = a.inv ? `<span class="badge b-inv">◆ ${esc(a.inv)}</span>` : '';
  const conB = a.con ? `<span class="badge b-con">◈ ${esc(a.con)}</span>` : '';
  const badges = (invB || conB) ? `<div class="badges">${invB}${conB}</div>` : '';
  return `<div class="acard" style="border-color:${light}">
    <div class="atag" style="background:${light};color:${dark}">↳ Acción de ${esc(POWER_NAMES[a.power])}</div>
    <div class="ah">
      <div class="an"><span class="asym" style="color:${c}">${SYM[a.act] || a.act}</span><span>${esc(a.name)}</span></div>
      <div class="acond">${esc(a.cond ?? '')}</div>
      ${badges}
    </div>
    <div class="ab-body"><div class="amec">${a.mec}</div></div>
  </div>`;
}

function renderAction(a, sub) {
  const cls = sub; // 'combate' | 'luz'
  const tag = sub === 'combate' ? 'Acción de combate' : 'Luz tormentosa';
  const costLabel = COST_LABEL[a.act] || '';
  return `<div class="card ${cls}">
    <div class="ctag">${tag}</div>
    <div class="ch">
      <div class="cn"><span class="asym">${SYM[a.act] || a.act}</span><span>${esc(a.name)}</span></div>
      <div class="cmeta"><span class="ccost">${esc(costLabel)}</span></div>
    </div>
    <div class="cb">
      ${a.flavor ? `<div class="cflavor">${esc(a.flavor)}</div>` : ''}
      <div class="cm">${a.mec}</div>
    </div>
  </div>`;
}

function renderEstado(e) {
  return `<div class="card estado ${e.buff ? 'buff' : ''}">
    <div class="ctag">${e.buff ? 'Estado beneficioso' : 'Estado'}</div>
    <div class="ch"><div class="cn">${esc(e.name)}</div></div>
    <div class="cb">
      ${e.flavor ? `<div class="cflavor">${esc(e.flavor)}</div>` : ''}
      <div class="cm">${e.mec}</div>
    </div>
  </div>`;
}

function renderPericiaCat(c) {
  const cls = c.key === 'esp' ? 'peri esp' : 'peri';
  return `<div class="card ${cls}">
    <div class="ctag">Categoría de pericia</div>
    <div class="ch"><div class="cn">${esc(c.name)}</div></div>
    <div class="cb">
      <div class="cm">${esc(c.desc)}</div>
      <div class="cej"><b>Ejemplos:</b> ${esc(c.ej)}</div>
    </div>
  </div>`;
}

function renderPericiaList(data, cls) {
  const grupos = data.grupos.map(g =>
    `<div style="margin-bottom:6px"><div style="font-size:10px;font-style:italic;color:#999;font-family:Georgia,serif;margin-bottom:2px">${esc(g.sub)}</div><div style="font-size:11px;line-height:1.5;color:#333">${g.items.map(esc).join(' · ')}</div></div>`
  ).join('');
  const nota = data.nota ? `<div class="cflavor" style="margin-top:4px">${esc(data.nota)}</div>` : '';
  return `<div class="card peri ${cls || ''}">
    <div class="ctag">Pericias concretas</div>
    <div class="ch"><div class="cn">${esc(data.nom)}</div></div>
    <div class="cb" style="gap:4px">${grupos}${nota}</div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// Construcción del catálogo unificado
// ─────────────────────────────────────────────────────────────
function buildEntries() {
  const out = [];

  // Talentos
  for (const t of talents) {
    out.push({
      type: 'talento',
      sub: t.path,                                  // id de camino
      subLabel: PATH_NAMES[t.path] || t.path,
      id: t.name,
      name: t.name,
      color: PATH_COLORS[t.path] || '#7a1f1f',
      meta: `${PATH_NAMES[t.path] || t.path} · ${t.spec || ''}`,
      desc: stripTags(t.flavor || t.mec || ''),
      searchText: `${t.name} ${t.spec || ''} ${PATH_NAMES[t.path] || t.path} ${stripTags(t.mec || '')} ${t.flavor || ''}`,
      render: () => renderTalent(t)
    });
  }

  // Potencias (10 entradas base)
  for (const p of POWERS) {
    out.push({
      type: 'potencia',
      sub: p.key,
      subLabel: POWER_NAMES[p.key],
      id: `power:${p.key}`,
      name: POWER_NAMES[p.key],
      color: POWER_COLORS[p.key],
      meta: `Potencia · ${p.attr}`,
      desc: stripTags(p.desc || ''),
      searchText: `${POWER_NAMES[p.key]} ${p.attr || ''} ${p.orders || ''} ${stripTags(p.desc || '')} ${stripTags(p.mec || '')}`,
      render: () => renderPower(p)
    });
  }
  // Acciones de potencias (cada acción tiene id = nombre)
  for (const a of PW_ACTIONS) {
    out.push({
      type: 'potencia',
      sub: a.power,
      subLabel: POWER_NAMES[a.power],
      id: `pwact:${a.name}`,
      name: a.name,
      color: POWER_COLORS[a.power],
      meta: `Acción de ${POWER_NAMES[a.power]}`,
      desc: stripTags(a.cond || a.mec || ''),
      searchText: `${a.name} ${POWER_NAMES[a.power]} ${a.cond || ''} ${stripTags(a.mec || '')}`,
      render: () => renderPowerAction(a)
    });
  }

  // Objetos
  for (const it of items) {
    out.push({
      type: 'objeto',
      sub: it.cat,
      subLabel: ITEM_LABELS[it.cat] || it.cat,
      id: it.name,
      name: it.name,
      color: ITEM_COLORS[it.cat] || '#5A4A2A',
      meta: it.sub || ITEM_CATS[it.cat] || '',
      desc: stripTags(it.mec || it.mej || ''),
      searchText: `${it.name} ${it.sub || ''} ${ITEM_CATS[it.cat] || ''} ${stripTags(it.mec || '')} ${stripTags(it.mej || '')} ${stripTags(it.inc || '')}`,
      render: () => renderItem(it)
    });
  }

  // Acciones (combate / luz)
  for (const a of (actions.combate || [])) {
    out.push({
      type: 'accion',
      sub: 'combate',
      subLabel: 'Combate',
      id: `comb:${a.name}`,
      name: a.name,
      color: '#8B2222',
      meta: `Combate · ${COST_LABEL[a.act] || ''}`,
      desc: stripTags(a.flavor || a.mec || ''),
      searchText: `${a.name} combate ${a.flavor || ''} ${stripTags(a.mec || '')}`,
      render: () => renderAction(a, 'combate')
    });
  }
  for (const a of (actions.luz || [])) {
    out.push({
      type: 'accion',
      sub: 'luz',
      subLabel: 'Luz tormentosa',
      id: `luz:${a.name}`,
      name: a.name,
      color: '#185FA5',
      meta: `Luz tormentosa · ${COST_LABEL[a.act] || ''}`,
      desc: stripTags(a.flavor || a.mec || ''),
      searchText: `${a.name} luz radiante ${a.flavor || ''} ${stripTags(a.mec || '')}`,
      render: () => renderAction(a, 'luz')
    });
  }

  // Estados
  for (const e of (conditions.estados || [])) {
    out.push({
      type: 'estado',
      sub: e.buff ? 'buff' : 'debuff',
      subLabel: e.buff ? 'Beneficioso' : 'Perjudicial',
      id: e.name,
      name: e.name,
      color: e.buff ? '#0F6E56' : '#5A4A2A',
      meta: e.buff ? 'Estado beneficioso' : 'Estado',
      desc: stripTags(e.flavor || e.mec || ''),
      searchText: `${e.name} ${e.tag || ''} ${e.flavor || ''} ${stripTags(e.mec || '')}`,
      render: () => renderEstado(e)
    });
  }

  // Pericias: categorías
  for (const c of PERICIA_CATS) {
    out.push({
      type: 'pericia',
      sub: c.key === 'esp' ? 'especial' : 'categoria',
      subLabel: c.key === 'esp' ? 'Especializadas' : 'Categoría',
      id: `cat:${c.name}`,
      name: c.name,
      color: c.key === 'esp' ? '#7A3A0A' : '#336699',
      meta: c.tag,
      desc: c.desc,
      searchText: `${c.name} ${c.tag} ${c.desc} ${c.ej}`,
      render: () => renderPericiaCat(c)
    });
  }
  // Pericias: listados concretos del manual
  for (const key of ['cultural', 'utilidad', 'arma', 'armadura', 'especial']) {
    const data = pericias[key];
    if (!data) continue;
    const items = data.grupos.flatMap(g => g.items).join(' ');
    out.push({
      type: 'pericia',
      sub: key === 'especial' ? 'especial' : 'listado',
      subLabel: data.nom,
      id: `list:${key}`,
      name: `Listado: ${data.nom}`,
      color: key === 'especial' ? '#7A3A0A' : '#336699',
      meta: 'Listado del manual',
      desc: items.slice(0, 140),
      searchText: `${data.nom} ${items} ${data.nota || ''}`,
      render: () => renderPericiaList(data, key === 'especial' ? 'esp' : '')
    });
  }

  return out;
}

const ENTRIES = buildEntries();

// Índices auxiliares para resolver URLs
const BY_KEY = new Map(); // `${type}|${id}` -> entry
for (const e of ENTRIES) BY_KEY.set(`${e.type}|${e.id}`, e);

// Conteos por tipo (para los enlaces rápidos)
const COUNTS_BY_TYPE = {};
for (const e of ENTRIES) COUNTS_BY_TYPE[e.type] = (COUNTS_BY_TYPE[e.type] || 0) + 1;

// ─────────────────────────────────────────────────────────────
// Subfiltros por tipo
// ─────────────────────────────────────────────────────────────
function subOptions(type) {
  if (type === 'talento') {
    const heroicos = ['agente', 'cazador', 'enviado', 'erudito', 'guerrero', 'lider'];
    const radiantes = paths.radiantIds || [];
    const list = [...heroicos, ...radiantes].filter(id => PATH_NAMES[id]);
    return list.map(id => ({ value: id, label: PATH_NAMES[id], color: PATH_COLORS[id] }));
  }
  if (type === 'potencia') {
    return Object.keys(POWER_NAMES).map(k => ({ value: k, label: POWER_NAMES[k], color: POWER_COLORS[k] }));
  }
  if (type === 'objeto') {
    return ITEM_ORDER.map(c => ({ value: c, label: ITEM_LABELS[c], color: ITEM_COLORS[c] }));
  }
  if (type === 'accion') {
    return [
      { value: 'combate', label: 'Combate',         color: '#8B2222' },
      { value: 'luz',     label: 'Luz tormentosa',  color: '#185FA5' }
    ];
  }
  if (type === 'estado') {
    return [
      { value: 'debuff', label: 'Perjudicial', color: '#5A4A2A' },
      { value: 'buff',   label: 'Beneficioso', color: '#0F6E56' }
    ];
  }
  if (type === 'pericia') {
    return [
      { value: 'categoria', label: 'Categorías',     color: '#336699' },
      { value: 'listado',   label: 'Listados',       color: '#5A4A2A' },
      { value: 'especial',  label: 'Especializadas', color: '#7A3A0A' }
    ];
  }
  return [];
}

// ─────────────────────────────────────────────────────────────
// Estado UI (persistente)
// ─────────────────────────────────────────────────────────────
const PREFS_KEY = 'crBrowserPrefs_v1';
const state = (() => {
  try {
    const j = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
    return { q: j.q || '', type: j.type || 'all', sub: j.sub || null };
  } catch { return { q: '', type: 'all', sub: null }; }
})();

function savePrefs() {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(state)); } catch {}
}

// ─────────────────────────────────────────────────────────────
// Enlaces rápidos del hero
// ─────────────────────────────────────────────────────────────
function renderQuick() {
  const cfg = [
    { type: 'talento',  icon: '✦', label: 'Talentos' },
    { type: 'potencia', icon: '⚡', label: 'Potencias' },
    { type: 'accion',   icon: '⚔', label: 'Acciones' },
    { type: 'objeto',   icon: '🛡', label: 'Objetos' },
    { type: 'estado',   icon: '☄', label: 'Estados' },
    { type: 'pericia',  icon: '📜', label: 'Pericias' }
  ];
  const colorMap = Object.fromEntries(TYPES.map(t => [t.id, t.color]));
  document.getElementById('quickLinks').innerHTML = cfg.map(c => {
    const n = COUNTS_BY_TYPE[c.type] || 0;
    return `<a href="#" data-type="${c.type}" style="--c:${colorMap[c.type]}">
      <span class="qi">${c.icon}</span>
      <span>${esc(c.label)}</span>
      <span class="qcount">${n}</span>
    </a>`;
  }).join('');
  document.getElementById('quickLinks').addEventListener('click', e => {
    const a = e.target.closest('a[data-type]');
    if (!a) return;
    e.preventDefault();
    state.type = a.dataset.type;
    state.sub = null;
    document.getElementById('search').focus();
    refreshUI();
  });
}

// ─────────────────────────────────────────────────────────────
// Barra de filtros
// ─────────────────────────────────────────────────────────────
function renderTypeFilters() {
  const slot = document.getElementById('typeFilters');
  slot.innerHTML = TYPES.map(t => {
    const on = state.type === t.id;
    const style = on ? `style="background:${t.color};border-color:${t.color};color:#fff"` : '';
    const n = t.id === 'all' ? '' : `<span class="fbn">${COUNTS_BY_TYPE[t.id] || 0}</span>`;
    return `<button class="fb ${on ? 'on' : ''}" data-type="${t.id}" ${style}>${esc(t.label)}${n}</button>`;
  }).join('');
  slot.querySelectorAll('button[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.type !== btn.dataset.type) {
        state.type = btn.dataset.type;
        state.sub = null;
      }
      refreshUI();
    });
  });
}

function renderSubFilters() {
  const row = document.getElementById('subFiltersRow');
  const slot = document.getElementById('subFilters');
  const label = document.getElementById('subFiltersLabel');
  const opts = state.type === 'all' ? [] : subOptions(state.type);
  if (!opts.length) {
    row.style.display = 'none';
    return;
  }
  row.style.display = '';
  const labels = {
    talento: 'Camino', potencia: 'Potencia', objeto: 'Categoría',
    accion: 'Tipo', estado: 'Tipo', pericia: 'Subgrupo'
  };
  label.textContent = labels[state.type] || 'Filtro';
  slot.innerHTML = opts.map(o => {
    const on = state.sub === o.value;
    const style = on ? `style="background:${o.color};border-color:${o.color};color:#fff"` : '';
    return `<button class="fb ${on ? 'on' : ''}" data-sub="${esc(o.value)}" ${style}>${esc(o.label)}</button>`;
  }).join('');
  slot.querySelectorAll('button[data-sub]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.sub = state.sub === btn.dataset.sub ? null : btn.dataset.sub;
      refreshUI();
    });
  });
}

window.clearSub = function clearSub() {
  state.sub = null;
  refreshUI();
};

// ─────────────────────────────────────────────────────────────
// Rejilla de resultados
// ─────────────────────────────────────────────────────────────
function filterEntries() {
  const qn = norm(state.q.trim());
  let out = ENTRIES;
  if (state.type !== 'all') out = out.filter(e => e.type === state.type);
  if (state.sub) out = out.filter(e => e.sub === state.sub);
  if (qn) out = out.filter(e => norm(e.searchText).includes(qn));
  return out;
}

function tileHTML(e) {
  const cardHtml = e.render();
  return `<div class="cw" data-type="${e.type}" data-id="${esc(e.id)}" title="Click para compartir">
    ${cardHtml}
  </div>`;
}

function renderGrid() {
  const list = filterEntries();
  const grid = document.getElementById('grid');
  document.getElementById('count').textContent = `${list.length} resultado${list.length === 1 ? '' : 's'}`;
  if (!list.length) {
    grid.innerHTML = `<div class="empty">No hay resultados para tu búsqueda.</div>`;
    return;
  }
  // Si NO hay filtro de tipo, agrupamos por tipo con separadores.
  if (state.type === 'all') {
    const groups = {};
    for (const e of list) (groups[e.type] ||= []).push(e);
    const order = ['talento', 'potencia', 'accion', 'objeto', 'estado', 'pericia'];
    const colorByType = Object.fromEntries(TYPES.map(t => [t.id, t.color]));
    let html = '';
    for (const tp of order) {
      const g = groups[tp];
      if (!g || !g.length) continue;
      const label = TYPES.find(t => t.id === tp)?.label || tp;
      html += `<div class="section-divider" style="--c:${colorByType[tp]};background:${colorByType[tp]}">
        <span>${esc(label)}</span><span class="scount">${g.length}</span></div>`;
      html += g.map(tileHTML).join('');
    }
    grid.innerHTML = html;
  } else {
    grid.innerHTML = list.map(tileHTML).join('');
  }
}

// Delegación de clic en tarjetas completas
document.getElementById('grid').addEventListener('click', e => {
  const t = e.target.closest('.cw[data-type][data-id]');
  if (!t) return;
  openByKey(t.dataset.type, t.dataset.id);
});

// ─────────────────────────────────────────────────────────────
// Modal y compartir
// ─────────────────────────────────────────────────────────────
let currentEntry = null;
function openByKey(type, id) {
  const entry = BY_KEY.get(`${type}|${id}`);
  if (!entry) {
    toast('No se ha encontrado esa tarjeta.');
    return;
  }
  currentEntry = entry;
  document.getElementById('modalBody').innerHTML = entry.render();
  document.getElementById('modalBd').classList.add('on');
  document.body.style.overflow = 'hidden';
}
window.closeModal = function closeModal() {
  document.getElementById('modalBd').classList.remove('on');
  document.body.style.overflow = '';
  currentEntry = null;
  // Limpiar URL si tenía type/id.
  const u = new URL(window.location.href);
  if (u.searchParams.has('type') || u.searchParams.has('id')) {
    u.searchParams.delete('type');
    u.searchParams.delete('id');
    history.replaceState(null, '', u.pathname + (u.search ? u.search : '') + u.hash);
  }
};
window.closeModalIfBackdrop = function closeModalIfBackdrop(ev) {
  if (ev.target.id === 'modalBd') closeModal();
};
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && document.getElementById('modalBd').classList.contains('on')) {
    closeModal();
  }
});

window.shareCurrent = async function shareCurrent() {
  if (!currentEntry) return;
  const u = new URL(window.location.href);
  // Limpiamos otros parámetros para no arrastrar estado.
  [...u.searchParams.keys()].forEach(k => u.searchParams.delete(k));
  u.searchParams.set('type', currentEntry.type);
  u.searchParams.set('id', currentEntry.id);
  const url = u.toString();
  try {
    await navigator.clipboard.writeText(url);
    toast('🔗 URL copiada al portapapeles');
  } catch {
    // Fallback
    prompt('Copia este enlace:', url);
  }
};

// ─────────────────────────────────────────────────────────────
// Búsqueda
// ─────────────────────────────────────────────────────────────
let searchT = 0;
window.onSearch = function onSearch() {
  state.q = document.getElementById('search').value;
  clearTimeout(searchT);
  searchT = setTimeout(() => {
    savePrefs();
    renderGrid();
  }, 120);
};

// ─────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────
let toastT = 0;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('on'), 1800);
}

// ─────────────────────────────────────────────────────────────
// Orquestación
// ─────────────────────────────────────────────────────────────
function refreshUI() {
  savePrefs();
  renderTypeFilters();
  renderSubFilters();
  renderGrid();
}

function tryOpenFromURL() {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type');
  const id = params.get('id');
  if (type && id) {
    openByKey(type, id);
  }
}

// Init
renderQuick();
document.getElementById('search').value = state.q;
refreshUI();
tryOpenFromURL();
