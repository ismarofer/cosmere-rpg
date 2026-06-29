// docs/js/pages/cards-talents.js
// Renderiza la página de cartas de talentos desde data/talents.json + paths.json.
import { loadData } from '../data-loader.js';

const SYM = { '1': '▶', '2': '▶▶', '3': '▶▶▶', '0': '▷', 'R': '↺', '*': '✦', '8': '∞' };

const { talents, paths } = await loadData(['talents', 'paths']);
const PATH_NAMES = paths.names;
const PATH_ORDER = paths.order;

// Mapa id → color principal para el botón activo.
const PATH_COLORS = { all: '#444' };
for (const cat of Object.values(paths.categories)) {
  for (const p of cat) PATH_COLORS[p.id] = p.c;
}

let cur = 'all';

window.filter = function filter(path, btn) {
  cur = path;
  document.querySelectorAll('.fb').forEach(b => {
    b.classList.remove('on');
    b.style.background = '';
    b.style.borderColor = '';
    b.style.color = '';
  });
  btn.classList.add('on');
  const color = PATH_COLORS[path] || '#444';
  btn.style.background = color;
  btn.style.borderColor = color;
  btn.style.color = '#fff';
  render();
};

function cardHTML(c) {
  const sym = SYM[c.act] || c.act;
  const invB = c.inv ? `<span class="badge b-inv">◆ ${c.inv}</span>` : '';
  const conB = c.con ? `<span class="badge b-con">◈ ${c.con}</span>` : '';
  const badges = (invB || conB) ? `<div class="badges">${invB}${conB}</div>` : '';
  const req = (c.req && c.req !== 'ninguno') ? `<span class="creq">Req: ${c.req}</span>` : '';
  return `<div class="card ${c.path}">
    <div class="ctag">${PATH_NAMES[c.path] ?? c.path}</div>
    <div class="ch">
      <div class="cn"><span class="asym">${sym}</span><span>${c.name}</span></div>
      <div class="cmeta">
        <span class="cspec">${c.spec}</span>
        ${req}
      </div>
      ${badges}
    </div>
    <div class="cb">
      ${c.flavor ? `<div class="cflavor">${c.flavor}</div>` : ''}
      <div class="cm">${c.mec}</div>
    </div>
  </div>`;
}

function render() {
  const grid = document.getElementById('grid');
  const filtered = cur === 'all' ? talents : talents.filter(c => c.path === cur);

  if (cur === 'all') {
    let html = '';
    for (const p of PATH_ORDER) {
      const cards = filtered.filter(c => c.path === p);
      if (cards.length) {
        html += `<div class="section-header sh-${p}">${PATH_NAMES[p]} (${cards.length} talentos)</div>`;
        html += cards.map(cardHTML).join('');
      }
    }
    grid.innerHTML = html;
  } else {
    grid.innerHTML = filtered.map(cardHTML).join('');
  }
}

render();
