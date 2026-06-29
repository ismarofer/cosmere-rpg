// docs/js/pages/cards-items.js
// Renderiza cartas de objetos desde data/items.json.
import { loadData } from '../data-loader.js';

const CATS = {
  al: 'Armamento ligero', ap: 'Armamento pesado', ae: 'Arma especial',
  ar: 'Armadura', fc: 'Fabrial común', fu: 'Fabrial único',
  co: 'Consumible', eq: 'Equipo'
};
const CAT_LABELS = {
  al: 'Armas ligeras', ap: 'Armas pesadas', ae: 'Armas especiales',
  ar: 'Armaduras', fc: 'Fabriales comunes', fu: 'Fabriales únicos',
  co: 'Consumibles', eq: 'Equipo con reglas'
};
const CAT_COLORS = {
  al: '#7A5299', ap: '#8B2222', ae: '#5A4A2A', ar: '#336699',
  fc: '#AA6622', fu: '#884422', co: '#3D6B35', eq: '#555'
};
const ORDER = ['al', 'ap', 'ae', 'ar', 'fc', 'fu', 'co', 'eq'];

const { items } = await loadData(['items']);
let cur = 'all';

window.filter = function filter(p, btn) {
  cur = p;
  document.querySelectorAll('.fb').forEach(b => {
    b.classList.remove('on'); b.style.background = ''; b.style.borderColor = ''; b.style.color = '';
  });
  btn.classList.add('on');
  const c = CAT_COLORS[p] || '#444';
  btn.style.background = c; btn.style.borderColor = c; btn.style.color = '#fff';
  render();
};

function cardHTML(item) {
  const c = item.cat;
  const visibleStats = item.stats.filter(([l]) => !/peso|precio|coste/i.test(l));
  const statsHTML = visibleStats.map(([l, v]) => `
    <div class="stat-row">
      <span class="stat-label">${l}</span>
      <span class="stat-val">${v}</span>
    </div>`).join('');

  const mecHTML = item.mec ? `<div class="mechblock">${item.mec}</div>` : '';
  const mejHTML = item.mej ? `<div class="mejora-block">✦ Mejora: ${item.mej}</div>` : '';
  const incHTML = item.inc ? `<div class="inconveniente-block">✗ Inconveniente: ${item.inc}</div>` : '';

  return `<div class="card ${c}">
    <div class="ctag">${CATS[c]}</div>
    <div class="ch">
      <div class="cn">${item.name}</div>
      ${item.sub ? `<div class="csub">${item.sub}</div>` : ''}
    </div>
    ${visibleStats.length ? `<div class="stats">${statsHTML}</div>` : ''}
    ${(mecHTML || mejHTML || incHTML) ? `<div class="cb">${mecHTML}${mejHTML}${incHTML}</div>` : ''}
  </div>`;
}

function render() {
  const grid = document.getElementById('grid');
  let html = '';
  const cats = cur === 'all' ? ORDER : [cur];
  cats.forEach(cat => {
    const list = items.filter(i => i.cat === cat);
    if (!list.length) return;
    if (cur === 'all') html += `<div class="section-header" style="background:${CAT_COLORS[cat]}">${CAT_LABELS[cat]} (${list.length})</div>`;
    html += list.map(cardHTML).join('');
  });
  grid.innerHTML = html;
}
render();
