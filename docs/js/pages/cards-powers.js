// docs/js/pages/cards-powers.js
// Renderiza cartas de potencias radiantes desde data/powers.json.
import { loadData } from '../data-loader.js';

const SYM = { '1': '▶', '2': '▶▶', '3': '▶▶▶', '0': '▷', 'R': '↺', '*': '✦', '8': '∞' };

const { powers: data } = await loadData(['powers']);
const POWERS = data.powers;
const ACTIONS = data.actions;
const NAMES = data.names;
const COLORS = data.colors.main;
const TINTS = data.colors.tint;
const DARK = data.colors.dark;

let cur = 'all';

window.filter = function filter(p, btn) {
  cur = p;
  document.querySelectorAll('.fb').forEach(b => {
    b.classList.remove('on'); b.style.background = ''; b.style.borderColor = ''; b.style.color = '';
  });
  btn.classList.add('on');
  btn.style.background = COLORS[p] || '#444';
  btn.style.borderColor = COLORS[p] || '#444';
  btn.style.color = '#fff';
  render();
};

function powerCard(p) {
  const c = COLORS[p.key], tint = TINTS[p.key], dark = DARK[p.key];
  const invB = p.inv ? `<div class="badges"><span class="badge b-inv">◆ ${p.inv}</span></div>` : '';
  return `<div class="pcard" style="border-color:${c}">
    <div class="ptag" style="background:${c}">${NAMES[p.key]}</div>
    <div class="ph">
      <div class="pn"><span class="asym" style="color:${c}">${SYM[p.act]}</span><span>${NAMES[p.key]}</span></div>
      <div class="pattr" style="color:${dark}">Atributo: ${p.attr}</div>
      <div class="porders" style="color:${dark}">${p.orders}</div>
      ${invB}
    </div>
    <div class="pb">
      <div class="pdesc">${p.desc}</div>
      <div class="pmec" style="border-color:${c};background:${tint}">${p.mec}</div>
    </div>
  </div>`;
}

function actionCard(a) {
  const c = COLORS[a.power], dark = DARK[a.power];
  const light = c + '55';
  const invB = a.inv ? `<span class="badge b-inv">◆ ${a.inv}</span>` : '';
  const conB = a.con ? `<span class="badge b-con">◈ ${a.con}</span>` : '';
  const badges = (invB || conB) ? `<div class="badges">${invB}${conB}</div>` : '';
  return `<div class="acard" style="border-color:${light}">
    <div class="atag" style="background:${light};color:${dark}">↳ Acción de ${NAMES[a.power]}</div>
    <div class="ah">
      <div class="an"><span class="asym" style="color:${c}">${SYM[a.act]}</span><span>${a.name}</span></div>
      <div class="acond">${a.cond ?? ''}</div>
      ${badges}
    </div>
    <div class="ab-body"><div class="amec">${a.mec}</div></div>
  </div>`;
}

function render() {
  const grid = document.getElementById('grid');
  let html = '';
  const keys = cur === 'all' ? Object.keys(NAMES) : [cur];
  keys.forEach(k => {
    const power = POWERS.find(p => p.key === k);
    const acts = ACTIONS.filter(a => a.power === k);
    if (cur === 'all') {
      html += `<div class="section-header" style="background:${COLORS[k]}">${NAMES[k]}</div>`;
    }
    if (power) html += powerCard(power);
    html += acts.map(actionCard).join('');
  });
  grid.innerHTML = html;
}
render();
