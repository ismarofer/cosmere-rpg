// docs/js/pages/actions.js
// Renderizado de acciones de combate y de luz tormentosa desde data/actions.json.
import { loadData } from '../data-loader.js';

const SYM = { '1': '▶', '2': '▶▶', '3': '▶▶▶', '0': '▷', 'R': '↺', '8': '∞' };
const COST_LABEL = {
  '1': '1 acción', '2': '2 acciones', '3': '3 acciones',
  '0': 'Acción gratuita', 'R': 'Reacción',
  '*': 'Especial / estado', '8': 'Siempre activo'
};

const { actions } = await loadData(['actions']);
const { combate, luz } = actions;

function refRow(a, cls) {
  return `<div class="ref-row">
    <span class="ref-cost ${cls}">${SYM[a.act] || a.act}</span>
    <span class="ref-name">${a.name}</span>
    <span class="ref-desc">${a.mec}</span>
  </div>`;
}

function cardHTML(a, type) {
  const costLabel = COST_LABEL[a.act] || '';
  return `<div class="card ${type}">
    <div class="ctag">${type === 'combate' ? 'Acción de combate' : 'Luz tormentosa'}</div>
    <div class="ch">
      <div class="cn"><span class="asym">${SYM[a.act] || a.act}</span><span>${a.name}</span></div>
      <div class="cmeta"><span class="ccost">${costLabel}</span></div>
    </div>
    <div class="cb">
      <div class="cflavor">${a.flavor ?? ''}</div>
      <div class="cm">${a.mec}</div>
    </div>
  </div>`;
}

document.getElementById('ref-combate').innerHTML = combate.map(a => refRow(a, 'combate-cost')).join('');
document.getElementById('ref-luz').innerHTML = luz.map(a => refRow(a, '')).join('');

let html = '<div class="section-header" style="background:#8B2222">Acciones de combate</div>';
html += combate.map(a => cardHTML(a, 'combate')).join('');
html += '<div class="section-header" style="background:#185FA5">Acciones de luz tormentosa (Radiantes)</div>';
html += luz.map(a => cardHTML(a, 'luz')).join('');
document.getElementById('grid').innerHTML = html;

window.setMode = function setMode(m) {
  document.getElementById('sheet').style.display = m === 'ref' ? 'block' : 'none';
  document.getElementById('cards-wrap').style.display = m === 'cards' ? 'block' : 'none';
  document.getElementById('b-ref').classList.toggle('on', m === 'ref');
  document.getElementById('b-cards').classList.toggle('on', m === 'cards');
};
