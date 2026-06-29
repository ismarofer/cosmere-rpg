// docs/js/pages/adversaries.js
// Renderiza la página de adversarios desde data/adversaries.json.
import { loadData } from '../data-loader.js';

const SYM = { '1': '▶', '2': '▶▶', '3': '▶▶▶', '0': '▷', 'R': '↺' };

const { adversaries: ADV } = await loadData(['adversaries']);
const filters = { rol: 'all', rango: 'all', tipo: 'all' };

window.setFilter = function setFilter(btn) {
  const f = btn.dataset.f;
  document.querySelectorAll('.fb[data-f="' + f + '"]').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  filters[f] = btn.dataset.v;
  render();
};
window.render = render;

function attrCol(cat, pairs) {
  return '<div class="attr-col"><div class="attr-cat">' + cat + '</div><div class="attr-vals">' +
    pairs.map(p => '<div><span class="k">' + p[0] + '</span><span class="v">' + p[1] + '</span></div>').join('') +
    '</div></div>';
}

function cardHTML(a) {
  const vitals = a.vitals.map(v => '<span class="vit"><b>' + v[0] + ':</b> ' + v[1] + '</span>').join('');
  const lines = a.lines.map(l => '<div class="ln"><span class="lbl">' + l[0] + ':</span> ' + l[1] + '</div>').join('');
  const rasgos = a.rasgos.map(r => '<div class="entry"><span class="nm">' + r[0] + '.</span> ' + r[1] + '</div>').join('');
  const acciones = a.acciones.map(ac => {
    const cost = ac[2] ? ' <span class="cost">(' + ac[2] + ')</span>' : '';
    return '<div class="entry"><span class="sym">' + (SYM[ac[0]] || ac[0]) + '</span><span class="nm">' + ac[1] + '.</span>' + cost + ' ' + ac[3] + '</div>';
  }).join('');
  const rasgosSec = a.rasgos.length ? '<div class="sec"><div class="sec-h">Rasgos</div>' + rasgos + '</div>' : '';
  let oyc = '';
  if (a.oyc) {
    oyc = '<div class="oyc">' + a.oyc.map(o => '<div><span class="' + (o[0] === 'Oportunidad' ? 'o' : 'c') + '">' + o[0] + ':</span> ' + o[1] + '</div>').join('') + '</div>';
  }
  return '<div class="card rol-' + a.rol + '">' +
    '<div class="ctag"><span>' + a.rol + '</span><span class="rng">Rango ' + a.rango + ' · ' + a.tipo + '</span></div>' +
    '<div class="ch"><div class="cn">' + a.name + '</div><div class="crole">' + a.role + '</div></div>' +
    '<div class="attrs">' + attrCol('Físico', a.attrs.fis) + attrCol('Cognitivo', a.attrs.cog) + attrCol('Espiritual', a.attrs.esp) + '</div>' +
    '<div class="vitals">' + vitals + '</div>' +
    '<div class="lines">' + lines + '</div>' +
    rasgosSec +
    '<div class="sec"><div class="sec-h">Acciones</div>' + acciones + '</div>' +
    oyc +
    (a.tactics ? '<div class="tactics"><span class="lbl">Tácticas</span>' + a.tactics + '</div>' : '') +
    '</div>';
}

function matchSearch(a, q) {
  if (!q) return true;
  q = q.toLowerCase();
  const hay = [a.name, a.role,
    ...a.rasgos.map(r => r[0] + ' ' + r[1]),
    ...a.acciones.map(ac => ac[1] + ' ' + ac[3]),
    a.tactics || ''].join(' ').toLowerCase();
  return hay.includes(q);
}

function render() {
  const q = document.getElementById('search').value.trim();
  const list = ADV.filter(a =>
    (filters.rol === 'all' || a.rol === filters.rol) &&
    (filters.rango === 'all' || a.rango === filters.rango) &&
    (filters.tipo === 'all' || a.tipo === filters.tipo) &&
    matchSearch(a, q)
  );
  const grid = document.getElementById('grid');
  grid.innerHTML = list.length
    ? list.map(cardHTML).join('')
    : '<div class="empty">No hay adversarios que coincidan con la búsqueda.</div>';
  document.getElementById('count').textContent = list.length + ' / ' + ADV.length;
}

render();
