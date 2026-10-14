/* Cosmere RPG · Consulta de reglas — núcleo: datos, estado compartido (CosmereApp), visibilidad por ambientación, URL y utilidades. */
(function () {
  'use strict';
  const A = window.CosmereApp = {};
  const S = window.Search, C = window.CURATED, U = window.UI;
  const esc = S.esc, nc = S.normChars, ic = U.ic;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  // ------------------------------------------------------------------ almacenamiento seguro
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* sin almacenamiento */ } },
  };

  // ------------------------------------------------------------------ Modo DJ (solo por URL, sin UI)
  function initDJ() {
    const sp = new URLSearchParams(location.search);
    if (sp.has('dj')) {
      if (sp.get('dj') === '1') store.set('cosmere_dj', '1'); else store.del('cosmere_dj');
      sp.delete('dj');
      const qs = sp.toString();
      try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) { /* file:// restrictivo */ }
    }
    return store.get('cosmere_dj', '') === '1';
  }
  // Ambientación por URL: ?ambientacion=stormlight | mistborn/1 | mistborn-2 | cosmere (o vacío). Se guarda como la elegida en la cabecera.
  function initAmbientacion() {
    const sp = new URLSearchParams(location.search);
    if (!sp.has('ambientacion')) return;
    const v = sp.get('ambientacion').trim().toLowerCase().replace(/-/g, '/');
    const id = v === 'cosmere' ? '' : v;
    if (C.ambientaciones.some((a) => a.id === id)) { A.ambientacion = id; store.set('cosmere_ambientacion', id); }
    sp.delete('ambientacion');
    const qs = sp.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (e) { /* file:// restrictivo */ }
  }
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }

  // ------------------------------------------------------------------ estado
  A.DJ = false;
  A.ALL = []; A.CATS = []; A.catById = {}; A.byId = new Map(); A.engine = null; A.allow = null;
  A.ambientacion = store.get('cosmere_ambientacion', '');
  A.lastBase = '/'; A.baseRendered = false;
  A.traitIndex = new Map();
  A.TREES = []; A.treeBySlug = new Map();
  const pageById = {}; C.pages.forEach((p) => (pageById[p.cat] = p));

  const OBJ = window.DATA_OBJETIVOS || {};
  const ARBOLES = window.DATA_ARBOLES || [];
  const arbolBySlug = new Map(ARBOLES.map((a) => [a.slug, a]));
  const objLabel = (k) => OBJ[k] || k;

  // ---- efectos sobre el personaje (datos: entrada.x.efectos; ver README)
  function efValor(x) {
    const v = x.valor;
    let s = '';
    if (x.operacion === 'suma') s = v == null ? '' : (typeof v === 'number' ? '+' + v : (v === 'rango' ? '+ tu rango' : (v === 'variable' ? '+ (variable)' : '+ ' + v)));
    else if (x.operacion === 'multiplica') s = '×' + v;
    else if (x.operacion === 'fija') s = '= ' + v;
    else if (x.operacion === 'otorga' && typeof v === 'number' && v > 1) s = '×' + v;
    if (x.por) s += ' por ' + x.por;
    return s;
  }
  function efectoLi(x) {
    const val = efValor(x);
    return `<li><span class="efh">${ic(C.efIcons[x.objetivo] || 'modif', 'sm')}<b>${esc(objLabel(x.objetivo))}</b>${val ? ' ' + esc(val) : ''}${x.detalle ? ' · ' + esc(x.detalle) : ''}</span><small>${esc(x.texto)}</small></li>`;
  }
  function efectosHtml(list, titulo) {
    if (!list || !list.length) return '';
    const perm = list.filter((x) => x.permanente), cond = list.filter((x) => !x.permanente);
    return `<section class="efectos"><h3>${ic('modif', 'sm')}${esc(titulo || 'Modifica al personaje')}</h3>` +
      (perm.length ? `<h5>Al obtenerlo (permanente)</h5><ul class="eflist">${perm.map(efectoLi).join('')}</ul>` : '') +
      (cond.length ? `<h5>Condicional o temporal</h5><ul class="eflist">${cond.map(efectoLi).join('')}</ul>` : '') + '</section>';
  }

  const slugOf = (s) => nc(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  // ambientacion: lo general aplica a lo particular y viceversa (jerarquía por ruta)
  function visible(e) {
    if (!A.ambientacion) return true;
    const ep = e.ambientacion in C.ambientacionPath ? C.ambientacionPath[e.ambientacion] : 'mistborn';
    if (ep === '') return true; // Cosmere: común a todas las ambientaciones
    return ep === A.ambientacion || A.ambientacion.startsWith(ep + '/') || ep.startsWith(A.ambientacion + '/');
  }
  function computeAllow() { document.documentElement.dataset.amb = (A.ambientacion || 'cosmere').split('/')[0]; A.allow = new Set(); A.ALL.forEach((e, i) => { if (visible(e)) A.allow.add(i); }); }
  // La ambientación elegida en la cabecera decide lo que se ve en todas partes (menús, listas, árboles, búsqueda, herramientas):
  // las herramientas que filtran por ambientación (combates…) preguntan aquí, no tienen filtro propio.
  window.CosmereAmb = { cubre: (nombre) => visible({ ambientacion: nombre }), id: () => A.ambientacion };

  const bookOf = (e) => e.libro || 'Manual Mistborn';
  // todo enlace a una entrada abre el panel lateral; el título del panel lleva a la página propia
  const hrefOf = (e) => (e.cat === 'modificador' ? (e.x.fuente_id ? '#/e/' + e.x.fuente_id : '#/arbol/' + e.x.arbol) : e.cat === 'accion' && e.f.talento ? '#/e/' + e.f.talento : '#/e/' + e.id);
  const pageHref = (e) => (e.cat === 'talento' ? '#/talento/' + e.id : e.cat === 'accion' && e.f.talento ? '#/talento/' + e.f.talento : '#/p/' + e.id);
  const catLabel = (id) => (A.catById[id] ? A.catById[id].label : (pageById[id] ? pageById[id].label : id));
  const catIcon = (id) => (A.catById[id] ? A.catById[id].ic : (pageById[id] ? pageById[id].ic : 'dot'));

  // ------------------------------------------------------------------ iconos y valores
  const AMB_ICON = { 'Mistborn': 'mistborn', 'Mistborn Era 1': 'mistborn', 'Mistborn Era 2': 'mistborn', 'Stormlight': 'stormlight', 'Cosmere': 'cosmere' };
  function vicon(catId, colKey, value) {
    const m = C.vicons[catId + '.' + colKey] || C.vicons[colKey];
    const n = m && m[value];
    return n ? ic(n, 'sm') : '';
  }
  function ambientacionBadge(e, always) {
    if (!always && e.ambientacion === 'Mistborn') return '';
    return `<span class="chip small ambientacion" data-amb="${esc(e.ambientacion.split(' ')[0].toLowerCase())}">${ic(AMB_ICON[e.ambientacion] || 'globe', 'sm')}${esc(e.ambientacion)}</span>`;
  }
  function valueHtml(cat, col, e) {
    const v = getVal(e, col.k);
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '—';
    if (C.actCols.includes(col.k)) return U.act(v) + esc(String(v));
    if (Array.isArray(v)) return esc(v.join(', '));
    return vicon(cat.id, col.k, v) + esc(String(v));
  }

  // ------------------------------------------------------------------ valores de columnas
  function ext(e) {
    if (e._ext) return e._ext;
    const t = e.body.replace(/\s+/g, ' ').replace(/#+\s*/g, '').replace(/\*\*/g, '').replace(/\[\[(?:[^\]|]*\|)*([^\]|]*)\]\]/g, '$1').trim();
    e._ext = t.length > 150 ? t.slice(0, 147).replace(/\s\S*$/, '') + '…' : t;
    return e._ext;
  }
  function getVal(e, k) {
    switch (k) {
      case 'title': return e.title;
      case 'ambientacion': return e.ambientacion;
      case 'libro': return e.libro;
      case 'sec': return e.path[e.path.length - 1];
      case 'cap': return e.path[0];
      case 'ext': return ext(e);
      default: return e.f ? e.f[k] : undefined;
    }
  }
  function sortVal(col, e) {
    const v = getVal(e, col.sk || col.k);
    if (col.t === 'num') return typeof v === 'number' ? v : (v != null && !isNaN(parseFloat(v)) ? parseFloat(v) : null);
    if (v == null) return null;
    return nc(Array.isArray(v) ? v.join(' ') : String(v));
  }
  function valuesOf(col, e) {
    const v = getVal(e, col.k);
    if (v == null || v === '') return [];
    return (Array.isArray(v) ? v : [v]).map(String);
  }

  // ------------------------------------------------------------------ URL (hash)
  function parseHash() {
    const h = (location.hash || '#/').slice(1) || '/';
    const i = h.indexOf('?');
    return { path: i < 0 ? h : h.slice(0, i), params: new URLSearchParams(i < 0 ? '' : h.slice(i + 1)), raw: h };
  }
  function setParams(path, params, replace) {
    const qs = params.toString();
    const h = '#' + path + (qs ? '?' + qs : '');
    if (replace) { try { history.replaceState(null, '', h); A.lastBase = path + (qs ? '?' + qs : ''); return; } catch (e) { /* ignorar */ } }
    location.hash = h;
  }
  function hashFor(path, obj) {
    const sp = new URLSearchParams();
    for (const k in obj) if (obj[k] !== '' && obj[k] != null) sp.set(k, obj[k]);
    const s = sp.toString();
    return '#' + path + (s ? '?' + s : '');
  }

  // ------------------------------------------------------------------ búsqueda de entradas
  function findEntry(cat, title) {
    const t = nc(title);
    return A.ALL.find((e) => e.cat === cat && nc(e.title) === t && visible(e)) || A.ALL.find((e) => e.cat === cat && nc(e.title) === t);
  }

  // ------------------------------------------------------------------ resúmenes
  function summary(e) {
    const f = e.f || {};
    switch (e.cat) {
      case 'arma': return [f.dano, f.alcance, f.precio].filter(Boolean).join(' · ');
      case 'armadura': return ['Desvío ' + f.desvio, f.precio].join(' · ');
      case 'equipo': return [f.peso, f.precio].join(' · ');
      case 'metal': return 'Era 1: ' + f.era1 + ' · Era 2: ' + f.era2;
      case 'talento': return [f.origen, f.activacion && f.activacion !== '—' ? f.activacion : ''].filter(Boolean).join(' · ');
      case 'accion': return f.tipo + ' (' + f.coste + ')';
      case 'habilidad': return f.atributo + ' · defensa ' + f.defensa.toLowerCase();
      case 'rasgo': return f.aplica;
      case 'calculo': return f.formula;
      case 'modificador': return [f.valor, f.cuando].filter(Boolean).join(' · ');
      case 'adversario': return [f.rol + ' rango ' + f.rango, f.tamano, 'Salud ' + f.salud].join(' · ');
      default: return '';
    }
  }

  Object.assign(A, { $, $$, AMB_ICON, ARBOLES, C, OBJ, S, U, ambientacionBadge, arbolBySlug, bookOf, catIcon, catLabel, computeAllow, efValor, efectoLi, efectosHtml, esc, ext, findEntry, getVal, hashFor, hrefOf, ic, initAmbientacion, initDJ, loadScript, nc, objLabel, pageById, pageHref, parseHash, setParams, slugOf, sortVal, store, summary, valueHtml, valuesOf, vicon, visible });
})();
