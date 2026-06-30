// docs/js/shared/nav.js
// Barra de navegación común a todas las páginas.
// Cada página declara un placeholder <div id="topnav"></div> y carga este módulo.
//
//   <div id="topnav"></div>
//   <script type="module" src="js/shared/nav.js"></script>
//
// Tras inyectarse expone window.crNav con una API para que cada página añada
// sus propias acciones al menú (bocadillo) y, si procede, un combo de secciones.

const ITEMS = [
  { href: 'index.html',                       label: 'Buscador',    icon: '🔍', match: ['index.html', ''] },
  { href: 'hoja_personaje_roshar.html',       label: 'Hoja',        icon: '📜', match: ['hoja_personaje_roshar.html'] },
  { href: 'encuentros_roshar.html',           label: 'Encuentros',  icon: '⚔',  match: ['encuentros_roshar.html'] }
];

const STYLES = `
.cr-nav{position:sticky;top:0;z-index:50;background:#1a1418;border-bottom:1px solid #3a2a30;
  padding:6px 12px;display:flex;align-items:center;gap:8px;flex-wrap:nowrap;
  font-family:'Cinzel','Crimson Text',Georgia,serif;
  box-shadow:0 1px 4px rgba(0,0,0,0.15);overflow:visible}
.cr-nav-brand{font-weight:600;font-size:13px;color:#d8b870;letter-spacing:0.08em;
  text-transform:uppercase;white-space:nowrap}
.cr-nav-links{display:flex;align-items:center;gap:6px;flex-wrap:nowrap}
.cr-nav-links a{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:14px;
  text-decoration:none;color:#cfc8c0;font-size:12px;font-family:Georgia,serif;font-weight:600;
  letter-spacing:0.02em;border:1px solid transparent;transition:background .15s,color .15s,border-color .15s}
.cr-nav-links a:hover{background:#2a2026;color:#fff}
.cr-nav-links a.active{background:#5a1414;color:#fff;border-color:#7a1f1f}
.cr-nav-links a .ic{font-size:13px;line-height:1}

/* Bocadillo (menú desplegable) */
.cr-menu-wrap{position:relative;flex-shrink:0}
.cr-menu-btn{width:32px;height:32px;background:none;border:1px solid #4a3040;border-radius:7px;
  cursor:pointer;color:#c0a8c0;font-size:16px;display:flex;align-items:center;justify-content:center}
.cr-menu-btn:hover{background:#2e1e2e;border-color:#7a5a80;color:#fff}
.cr-menu{position:absolute;top:calc(100% + 6px);left:0;min-width:215px;background:#241820;
  border:1px solid #3a2a30;border-radius:10px;padding:5px 0;box-shadow:0 8px 28px rgba(0,0,0,.6);
  z-index:200;display:none}
.cr-menu.open{display:block}
.cr-menu a,.cr-menu-item{display:flex;align-items:center;gap:9px;width:100%;box-sizing:border-box;
  text-align:left;padding:9px 14px;background:none;border:0;color:#d8d2cc;font-family:Georgia,serif;
  font-size:13px;cursor:pointer;text-decoration:none}
.cr-menu a:hover,.cr-menu-item:hover{background:#33232b;color:#fff}
.cr-menu a.active{color:#d8b870}
.cr-menu a .cr-menu-ic,.cr-menu-item .cr-menu-ic{font-size:14px;width:18px;text-align:center}
.cr-menu-item.danger{color:#e08a8a}
.cr-menu-item.danger:hover{background:#4a1a1a;color:#fff}
.cr-menu-sep{height:1px;background:#3a2a30;margin:5px 0}
.cr-menu-label{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#8a7a8a;
  padding:6px 14px 3px;font-family:'Cinzel',serif}

/* Combo de secciones (compartido entre menú y barra) */
.cr-sec-combo{font-family:'Cinzel',serif;font-size:11px;background:#2e1e2e;color:#e9ebf0;
  border:1px solid #4a3040;padding:5px 8px;border-radius:7px;cursor:pointer;
  appearance:auto;-webkit-appearance:auto}
.cr-sec-combo option{background:#fff;color:#23262e}
.cr-sec-combo.cr-sec-menu{display:block;width:calc(100% - 24px);margin:4px 12px 6px}
.cr-sec-combo.cr-sec-bar{display:none;max-width:140px}

.cr-nav-slot{display:flex;align-items:center;gap:8px;margin-left:auto;flex-shrink:0}
.cr-nav-slot .estado-guardado{font-size:11px;color:#8a7a8a;font-style:italic;white-space:nowrap}

@media (max-width:820px){
  /* Modo móvil: la marca y los enlaces inline se repliegan en el bocadillo */
  .cr-nav-brand{display:none}
  .cr-nav-links{display:none}
  .cr-nav-slot .estado-guardado{display:none}
  /* El combo de secciones aparece suelto en la barra para acceso rápido */
  .cr-sec-combo.cr-sec-bar{display:block}
}

@media print{ .cr-nav{display:none !important} }
`;

function ensureStyles() {
  if (document.getElementById('cr-nav-styles')) return;
  const s = document.createElement('style');
  s.id = 'cr-nav-styles';
  s.textContent = STYLES;
  document.head.appendChild(s);
}

function currentFile() {
  const p = (window.location.pathname || '').split('/').pop() || '';
  // Para servidores que devuelven el index al pedir "/", consideramos "" = index.html.
  return p;
}

function injectNav() {
  const slot = document.getElementById('topnav');
  if (!slot) return;
  ensureStyles();
  const here = currentFile();
  const title = 'COSMERE RPG · STORMLIGHT';

  const linksHtml = ITEMS.map(it => {
    const active = it.match.some(m => m === here) ? ' active' : '';
    return `<a class="${active.trim()}" href="${it.href}">` +
      `<span class="ic">${it.icon}</span><span class="lbl">${it.label}</span></a>`;
  }).join('');

  const menuLinksHtml = ITEMS.map(it => {
    const active = it.match.some(m => m === here) ? ' active' : '';
    return `<a class="${active.trim()}" href="${it.href}">` +
      `<span class="cr-menu-ic">${it.icon}</span>${it.label}</a>`;
  }).join('');

  slot.outerHTML =
    `<nav class="cr-nav">` +
      `<div class="cr-menu-wrap">` +
        `<button class="cr-menu-btn" id="crMenuBtn" type="button" aria-label="Menú" aria-haspopup="true" aria-expanded="false">☰</button>` +
        `<div class="cr-menu" id="crMenu" role="menu">` +
          `<div class="cr-menu-label">Aplicaciones</div>` +
          menuLinksHtml +
          `<div class="cr-menu-extra" id="crMenuExtra"></div>` +
        `</div>` +
      `</div>` +
      `<span class="cr-nav-brand">${title}</span>` +
      `<span class="cr-nav-links">${linksHtml}</span>` +
      `<span id="cr-nav-slot" class="cr-nav-slot"></span>` +
    `</nav>`;

  wireMenu();
}

function wireMenu() {
  const btn = document.getElementById('crMenuBtn');
  const menu = document.getElementById('crMenu');
  if (!btn || !menu) return;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if (menu.classList.contains('open') && !menu.contains(e.target) && e.target !== btn) {
      crNav.closeMenu();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') crNav.closeMenu();
  });
}

// ===== API pública para las páginas =====
const crNav = {
  closeMenu() {
    const menu = document.getElementById('crMenu');
    const btn = document.getElementById('crMenuBtn');
    if (menu) menu.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  },
  menuExtra() { return document.getElementById('crMenuExtra'); },
  slot() { return document.getElementById('cr-nav-slot'); },
  // Etiqueta de grupo dentro del menú (p. ej. "Acciones")
  addMenuLabel(text) {
    const wrap = this.menuExtra(); if (!wrap) return;
    const d = document.createElement('div'); d.className = 'cr-menu-label'; d.textContent = text;
    wrap.appendChild(d);
  },
  addSeparator() {
    const wrap = this.menuExtra(); if (!wrap) return;
    const d = document.createElement('div'); d.className = 'cr-menu-sep';
    wrap.appendChild(d);
  },
  addMenuItem({ label, icon, onClick, danger }) {
    const wrap = this.menuExtra(); if (!wrap) return null;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cr-menu-item' + (danger ? ' danger' : '');
    b.innerHTML = '<span class="cr-menu-ic">' + (icon || '') + '</span>' + label;
    b.addEventListener('click', () => { this.closeMenu(); if (onClick) onClick(); });
    wrap.appendChild(b);
    return b;
  },
  // Añade un estado/etiqueta a la derecha de la barra (p. ej. "Guardado · hh:mm")
  addStatus(node) {
    const s = this.slot(); if (!s) return;
    s.appendChild(node);
  },
  // Combo de secciones: aparece dentro del menú (siempre) y suelto en la barra (solo móvil).
  // sections: array de [valor, etiqueta]; onSelect(valor) se llama al elegir.
  addSectionNav(sections, onSelect) {
    const build = (cls) => {
      const sel = document.createElement('select');
      sel.className = 'cr-sec-combo ' + cls;
      sel.setAttribute('aria-label', 'Ir a sección');
      const o0 = document.createElement('option'); o0.value = ''; o0.textContent = '— Ir a sección —';
      sel.appendChild(o0);
      sections.forEach(s => {
        const o = document.createElement('option'); o.value = s[0]; o.textContent = s[1];
        sel.appendChild(o);
      });
      sel.addEventListener('change', () => {
        const v = sel.value; sel.value = '';
        if (v) { this.closeMenu(); onSelect(v); }
      });
      return sel;
    };
    const menuEl = this.menuExtra();
    if (menuEl) {
      const lbl = document.createElement('div'); lbl.className = 'cr-menu-label'; lbl.textContent = 'Ir a sección';
      menuEl.appendChild(lbl);
      menuEl.appendChild(build('cr-sec-menu'));
    }
    const slotEl = this.slot();
    if (slotEl) slotEl.appendChild(build('cr-sec-bar'));
  }
};
window.crNav = crNav;

injectNav();
