// docs/js/pages/conditions.js
// Renderizado de estados y tablas de lesiones desde data/conditions.json.
import { loadData } from '../data-loader.js';

const { conditions } = await loadData(['conditions']);
const { estados, lesiones, lesionesEsquirla, efectosLesion } = conditions;

document.getElementById('est-grid').innerHTML = estados.map(e => `
  <div class="est-row">
    <span class="est-name ${e.buff ? 'buff' : ''}">${e.name}${e.tag && e.tag.includes('[') ? ' <span class="est-tag">' + e.tag + '</span>' : ''}</span>
    <span class="est-desc">${e.mec}</span>
  </div>`).join('');

const renderTable = rows => rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
document.getElementById('tbl-dur').innerHTML = renderTable(lesiones);
document.getElementById('tbl-shard').innerHTML = renderTable(lesionesEsquirla);
document.getElementById('tbl-efec').innerHTML = renderTable(efectosLesion);

function cardHTML(e) {
  return `<div class="card estado ${e.buff ? 'buff' : ''}">
    <div class="ctag">${e.buff ? 'Estado beneficioso' : 'Estado'}</div>
    <div class="ch"><div class="cn">${e.name}</div></div>
    <div class="cb">
      <div class="cflavor">${e.flavor ?? ''}</div>
      <div class="cm">${e.mec}</div>
    </div>
  </div>`;
}
document.getElementById('grid').innerHTML =
  '<div class="section-header" style="background:#5A4A2A">Estados</div>' +
  estados.map(cardHTML).join('');

// setMode se invoca desde onclick="setMode('ref')" en el HTML.
window.setMode = function setMode(m) {
  document.getElementById('sheet').style.display = m === 'ref' ? 'block' : 'none';
  document.getElementById('cards-wrap').style.display = m === 'cards' ? 'block' : 'none';
  document.getElementById('b-ref').classList.toggle('on', m === 'ref');
  document.getElementById('b-cards').classList.toggle('on', m === 'cards');
};
