// docs/js/shared/nav.js
// Barra de navegación común a todas las páginas.
// Cada página declara un placeholder <div id="topnav"></div> y carga este módulo.
//
//   <div id="topnav"></div>
//   <script type="module" src="js/shared/nav.js"></script>

const ITEMS = [
  { href: 'index.html',                       label: 'Buscador',    icon: '🔍', match: ['index.html', ''] },
  { href: 'hoja_personaje_roshar.html',       label: 'Hoja',        icon: '📜', match: ['hoja_personaje_roshar.html'] },
  { href: 'encuentros_roshar.html',           label: 'Encuentros',  icon: '⚔',  match: ['encuentros_roshar.html'] }
];

const STYLES = `
.cr-nav{position:sticky;top:0;z-index:50;background:#1a1418;border-bottom:1px solid #3a2a30;
  padding:6px 12px;display:flex;align-items:center;gap:6px;flex-wrap:nowrap;
  font-family:'Cinzel','Crimson Text',Georgia,serif;
  box-shadow:0 1px 4px rgba(0,0,0,0.15);overflow:visible}
.cr-nav-brand{font-weight:600;font-size:13px;color:#d8b870;letter-spacing:0.08em;
  text-transform:uppercase;margin-right:8px;white-space:nowrap}
.cr-nav a{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:14px;
  text-decoration:none;color:#cfc8c0;font-size:12px;font-family:Georgia,serif;font-weight:600;
  letter-spacing:0.02em;border:1px solid transparent;transition:background .15s,color .15s,border-color .15s}
.cr-nav a:hover{background:#2a2026;color:#fff}
.cr-nav a.active{background:#5a1414;color:#fff;border-color:#7a1f1f}
.cr-nav a .ic{font-size:13px;line-height:1}
.cr-search{font-size:13px;padding:8px 14px;border-radius:20px;border:1px solid #4a3040;background:#2e1e2e;color:#e9ebf0;font-family:Georgia,serif;outline:none}
.cr-search::placeholder{color:#8a7a8a}
.cr-search:focus{border-color:#7a5a80;background:#3a2830}
.cr-nav-slot{display:flex;align-items:center;gap:8px;margin-left:auto;flex-shrink:0}
.cr-nav-slot .estado-guardado{font-size:11px;color:#8a7a8a;font-style:italic;white-space:nowrap}
.cr-nav-slot .nav-sel{font-family:'Cinzel',serif;font-size:11px;background:#2e1e2e;color:#e9ebf0;
  border:1px solid #4a3040;padding:5px 8px;border-radius:7px;cursor:pointer;
  appearance:auto;-webkit-appearance:auto;max-width:170px}
.cr-nav-slot .nav-sel option{background:#fff;color:#23262e}
.cr-nav-slot .hbg-btn{width:30px;height:30px;background:none;border:1px solid #4a3040;border-radius:7px;
  cursor:pointer;color:#c0a8c0;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.cr-nav-slot .hbg-btn:hover{background:#2e1e2e;border-color:#7a5a80;color:#fff}
@media (max-width:820px){
  .cr-nav-slot .estado-guardado{display:none}
  .cr-nav-slot .nav-sel{max-width:120px;font-size:10px;padding:4px 6px}
}
@media (max-width:560px){
  .cr-nav-brand{display:none}
  .cr-nav a{padding:5px 9px;font-size:11px}
  .cr-nav a .lbl{display:none}
  .cr-nav a .ic{font-size:15px}
  .cr-nav-slot .nav-sel{display:none}
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
  
  let navContent = `<nav class="cr-nav">`;
  navContent += `<span class="cr-nav-brand">${title}</span>`;
  
  // En todas las páginas: mostrar los links normales
  const links = ITEMS.map(it => {
    const active = it.match.some(m => m === here) ? ' active' : '';
    return `<a class="${active.trim()}" href="${it.href}">` +
      `<span class="ic">${it.icon}</span><span class="lbl">${it.label}</span></a>`;
  }).join('');
  navContent += links;
  
  navContent += `<span id="cr-nav-slot" class="cr-nav-slot"></span></nav>`;
  slot.outerHTML = navContent;
}

injectNav();
