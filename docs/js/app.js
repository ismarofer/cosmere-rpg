/* Cosmere RPG · Consulta de reglas — aplicación (hash router, sin dependencias). */
(function () {
  'use strict';
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
  function loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
  }

  // ------------------------------------------------------------------ estado
  let DJ = false;
  let ALL = [], CATS = [], catById = {}, byId = new Map(), engine = null, allow = null;
  let ambientacion = store.get('cosmere_ambientacion', '');
  let lastBase = '/', baseRendered = false;
  let traitIndex = new Map();
  let TREES = [], treeBySlug = new Map();
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
    if (!ambientacion) return true;
    const ep = C.ambientacionPath[e.ambientacion] || 'mistborn';
    return ep === ambientacion || ambientacion.startsWith(ep + '/') || ep.startsWith(ambientacion + '/');
  }
  function computeAllow() { allow = new Set(); ALL.forEach((e, i) => { if (visible(e)) allow.add(i); }); }

  const bookOf = (e) => (e.path[0] || '').startsWith('Guía') ? 'Guía del Mundo' : (e.path[0] === 'Legado' ? 'Nacidos de la Bruma: Legado' : 'Manual del JdR');
  // todo enlace a una entrada abre el panel lateral; el título del panel lleva a la página propia
  const hrefOf = (e) => (e.cat === 'modificador' ? (e.x.fuente_id ? '#/e/' + e.x.fuente_id : '#/arbol/' + e.x.arbol) : e.cat === 'accion' && e.f.talento ? '#/e/' + e.f.talento : '#/e/' + e.id);
  const pageHref = (e) => (e.cat === 'talento' ? '#/talento/' + e.id : e.cat === 'accion' && e.f.talento ? '#/talento/' + e.f.talento : '#/p/' + e.id);
  const catLabel = (id) => (catById[id] ? catById[id].label : (pageById[id] ? pageById[id].label : id));
  const catIcon = (id) => (catById[id] ? catById[id].ic : (pageById[id] ? pageById[id].ic : 'dot'));

  // ------------------------------------------------------------------ iconos y valores
  const AMB_ICON = { 'Mistborn': 'mistborn', 'Mistborn Era 1': 'mistborn', 'Mistborn Era 2': 'mistborn', 'Stormlight': 'stormlight' };
  function vicon(catId, colKey, value) {
    const m = C.vicons[catId + '.' + colKey] || C.vicons[colKey];
    const n = m && m[value];
    return n ? ic(n, 'sm') : '';
  }
  function ambientacionBadge(e, always) {
    if (!always && e.ambientacion === 'Mistborn') return '';
    return `<span class="chip small ambientacion">${ic(AMB_ICON[e.ambientacion] || 'globe', 'sm')}${esc(e.ambientacion)}</span>`;
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
    const t = e.body.replace(/\s+/g, ' ').replace(/#+\s*/g, '').replace(/\[\[(?:[^\]|]*\|)*([^\]|]*)\]\]/g, '$1').trim();
    e._ext = t.length > 150 ? t.slice(0, 147).replace(/\s\S*$/, '') + '…' : t;
    return e._ext;
  }
  function getVal(e, k) {
    switch (k) {
      case 'title': return e.title;
      case 'ambientacion': return e.ambientacion;
      case 'pages': return e.pages;
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
    if (replace) { try { history.replaceState(null, '', h); lastBase = path + (qs ? '?' + qs : ''); return; } catch (e) { /* ignorar */ } }
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
    return ALL.find((e) => e.cat === cat && nc(e.title) === t && visible(e)) || ALL.find((e) => e.cat === cat && nc(e.title) === t);
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

  // ------------------------------------------------------------------ texto del libro (con enlaces [[cat|Título]])
  function linkToken(tok) {
    const parts = tok.split('|');
    if (parts[0].startsWith('#')) return `<a href="${esc(parts[0])}">${esc(parts[1] || parts[0])}</a>`;
    const e = findEntry(parts[0], parts[1] || '');
    const label = parts[2] || parts[1] || '';
    return e ? `<a href="${esc(hrefOf(e))}">${esc(label)}</a>` : esc(label);
  }
  function inline(text) {
    return esc(text).replace(/\[\[([^\]]+)\]\]/g, (_, t) => linkToken(t.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')));
  }
  function md(text) {
    let html = '', list = false;
    const closeList = () => { if (list) { html += '</ul>'; list = false; } };
    for (const raw of text.split('\n')) {
      const l = raw.trim();
      if (!l) { closeList(); continue; }
      const h = l.match(/^#{1,6}\s+(.*)$/);
      if (h) { closeList(); html += '<h4>' + esc(h[1]) + '</h4>'; continue; }
      if (l[0] === '◆' || l[0] === '•') { if (!list) { html += '<ul>'; list = true; } html += '<li>' + inline(l.slice(1).trim()) + '</li>'; continue; }
      closeList();
      html += '<p>' + inline(l) + '</p>';
    }
    closeList();
    return html;
  }

  // ------------------------------------------------------------------ árboles de talentos (datos)
  function buildTrees() {
    const byOrigin = new Map();
    for (const e of ALL) if (e.cat === 'talento') {
      if (!byOrigin.has(e.f.origen)) byOrigin.set(e.f.origen, []);
      byOrigin.get(e.f.origen).push(e);
    }
    TREES = [];
    treeBySlug = new Map();
    for (const [name, tals] of byOrigin) {
      const f0 = tals[0].f;
      const sec = C.treeSections.find((s) => Object.keys(s.match).every((k) => f0[k] === s.match[k]));
      if (!sec) continue;
      const t = { slug: slugOf(name), name, section: sec, talents: tals };
      TREES.push(t);
      treeBySlug.set(t.slug, t);
    }
    for (const e of ALL) {
      const m = (e.cat === 'arte' || e.cat === 'accion') && e.path[1] && e.path[1].match(/^(Alomancia|Feruquimia) de /);
      if (!m || treeBySlug.has(slugOf(e.path[1]))) continue;
      const sec = C.treeSections.find((s) => s.id === m[1].toLowerCase());
      if (!sec) continue;
      const t = { slug: slugOf(e.path[1]), name: e.path[1], section: sec, talents: [] };
      const at = TREES.findIndex((x) => x.section === sec && x.name.localeCompare(t.name, 'es') > 0);
      if (at < 0) TREES.push(t); else TREES.splice(at, 0, t);
      treeBySlug.set(t.slug, t);
    }
  }
  const treeOf = (e) => treeBySlug.get(slugOf(e.f.origen));
  const specsOfTree = (t) => {
    const s = [...new Set(t.talents.filter(visible).flatMap((e) => (e.f.especialidades && e.f.especialidades.length ? e.f.especialidades : (e.f.especialidad ? [e.f.especialidad] : [])).filter((x) => x !== 'Principal')))];
    return s.length > 1 ? s : [];
  };
  const treeNice = (t) => t.name.replace(/^(Alomancia|Feruquimia) de /, '');
  const childSecs = (s) => C.treeSections.filter((x) => x.parent === s.id);
  const topSecs = () => C.treeSections.filter((x) => !x.parent);

  function layoutTree(tree, only) {
    const specOf = (e) => (e.f.especialidades && e.f.especialidades.length ? e.f.especialidades : (e.f.especialidad ? [e.f.especialidad] : [])).filter((s) => s !== 'Principal');
    const allSpecs = [...new Set(tree.talents.filter(visible).flatMap(specOf))];
    const useSpecs = allSpecs.length > 1;
    const nodes = tree.talents.filter(visible).filter((e) => !useSpecs || !only || !specOf(e).length || specOf(e).includes(only)).map((e) => ({ id: e.id, e, title: e.title.replace(/\s*\(.*?\)\s*/g, ' ').trim(), parents: [], kids: [], depth: 0, order: 0, virtual: false }));
    const idx = new Map(nodes.map((n) => [n.id, n]));
    let root = null, roots = [];
    if (nodes.some((n) => n.e.x && n.e.x.power)) {
      root = { id: '__root', e: null, title: 'Poder: ' + tree.name, parents: [], kids: [], depth: 0, order: 0, virtual: true };
      roots = [root];
      nodes.unshift(root);
    }
    for (const n of nodes) {
      if (n.virtual) continue;
      const x = n.e.x || { req: [] };
      for (const pid of x.req) if (idx.has(pid) && pid !== n.id) n.parents.push(idx.get(pid));
      if (!n.parents.length && root && x.power) n.parents.push(...roots);
    }
    const memo = new Map();
    const depth = (n, stack) => {
      if (memo.has(n)) return memo.get(n);
      if (stack.has(n)) return 0;
      stack.add(n);
      const d = n.parents.length ? 1 + Math.max(...n.parents.map((p) => depth(p, stack))) : 0;
      stack.delete(n); memo.set(n, d); return d;
    };
    nodes.forEach((n) => (n.depth = depth(n, new Set())));
    nodes.forEach((n) => n.parents.forEach((p) => p.kids.push(n)));
    const isRoot = (n) => n.virtual || (n.e && n.e.x && n.e.x.main);
    // orden: DFS desde las raíces
    let counter = 0; const seen = new Set();
    const visit = (n) => { if (seen.has(n)) return; seen.add(n); n.order = counter++; n.kids.slice().sort((a, b) => a.title.localeCompare(b.title, 'es')).forEach(visit); };
    nodes.filter((n) => !n.parents.length).sort((a, b) => (isRoot(b) ? 1 : 0) - (isRoot(a) ? 1 : 0) || a.title.localeCompare(b.title, 'es')).forEach(visit);
    nodes.forEach(visit);
    // ramas (componentes conexos sin contar el nodo raíz)
    const comp = new Map(); let ncomp = 0;
    for (const n of nodes) {
      if (isRoot(n) || comp.has(n)) continue;
      const st = [n]; comp.set(n, ncomp);
      while (st.length) { const c = st.pop(); [...c.parents, ...c.kids].forEach((m) => { if (!isRoot(m) && !comp.has(m)) { comp.set(m, ncomp); st.push(m); } }); }
      ncomp++;
    }
    nodes.forEach((n) => (n.branch = comp.has(n) ? comp.get(n) % 6 : -1));
    const specs = useSpecs ? allSpecs : [];
    const lanes = useSpecs ? (only ? [only] : allSpecs) : [];
    if (useSpecs) nodes.forEach((n) => {
      const s = n.e ? specOf(n.e) : [];
      n.lane = s.length ? Math.max(0, lanes.indexOf(only && s.includes(only) ? only : s[0])) : -1;
      if (s.length) n.branch = allSpecs.indexOf(lanes[n.lane]) % 6;
    });
    const cols = [];
    nodes.forEach((n) => { (cols[n.depth] = cols[n.depth] || []).push(n); });
    cols.forEach((c) => c && c.sort((a, b) => a.order - b.order));
    return { nodes, cols: cols.filter(Boolean), root, specs, lanes };
  }

  // ------------------------------------------------------------------ cabecera: menú
  function menuItems(g) {
    const items = [];
    for (const p of C.pages.filter((x) => x.group === g.id)) {
      const e = ALL.find((x) => x.cat === p.cat);
      if (e) items.push({ href: pageHref(e), label: p.label, ic: p.ic, sub: p.desc });
    }
    for (const c of CATS.filter((x) => x.group === g.id)) {
      items.push({ href: '#/c/' + c.id, label: c.label, ic: c.ic, count: ALL.filter((e) => e.cat === c.id && visible(e)).length });
    }
    return items;
  }
  function buildMenu() {
    const groups = C.menu.filter((g) => !g.dj || DJ);
    $('#nav').innerHTML = groups.map((g) => {
      let panel;
      if (g.trees) {
        const item = (href, label, kids, icon) => `<div class="ci${kids ? ' has' : ''}"><a href="${href}">${icon || ''}<span>${esc(label)}</span>${kids ? ic('right', 'sm') : ''}</a>${kids ? `<div class="cfly${kids.leaf ? ' leaf' : ''}">${kids.html}</div>` : ''}</div>`;
        const treeItem = (t) => { const sp = specsOfTree(t); return item('#/arbol/' + t.slug, treeNice(t), sp.length ? { html: sp.map((x) => item('#/arbol/' + t.slug + '/' + slugOf(x), x)).join('') } : null); };
        const secHtml = (s) => TREES.filter((t) => t.section === s).map(treeItem).join('') + childSecs(s).map((c) => item('#/caminos/' + c.id, c.short, { html: TREES.filter((t) => t.section === c).map(treeItem).join('') }, ic(c.ic, 'sm'))).join('');
        panel = '<div class="cmenu">' + topSecs().map((s) => {
          const h = secHtml(s);
          return h ? item('#/caminos/' + s.id, s.short, { html: h, leaf: !childSecs(s).length && !TREES.some((t) => t.section === s && specsOfTree(t).length) }, ic(s.ic, 'sm')) : '';
        }).join('') + '<hr>' + item('#/caminos', 'Todos los árboles', null, ic('tree', 'sm')) +
          menuItems(g).map((i) => item(i.href, i.label, null, ic(i.ic, 'sm'))).join('') + '</div>';      } else {
        panel = '<div class="drop">' + menuItems(g).map((i) => `<a href="${i.href}">${ic(i.ic)}<span>${esc(i.label)}${i.sub ? `<small>${esc(i.sub)}</small>` : ''}</span>${i.count != null ? `<b>${i.count}</b>` : ''}</a>`).join('') + '</div>';
      }
      return `<div class="mgroup"><button type="button" class="mbtn" data-menu="${g.id}" aria-expanded="false">${ic(g.ic)}<span>${esc(g.label)}</span>${ic('down', 'sm chev')}</button><div class="mpanel" hidden>${panel}</div></div>`;
    }).join('');
  }
  function closeMenus() { $$('.mpanel').forEach((p) => (p.hidden = true)); $$('.mbtn').forEach((b) => b.setAttribute('aria-expanded', 'false')); }

  // ------------------------------------------------------------------ portada
  function viewHome(el) {
    const groups = C.menu.filter((g) => !g.dj || DJ).map((g) => {
      let body;
      if (g.trees) {
        body = C.treeSections.map((s) => {
          const ts = TREES.filter((t) => t.section === s);
          if (!ts.length) return '';
          const small = s.id === 'heroicos' || s.id === 'nacidos-del-metal';
          return `<div class="sub"><a class="subh" href="#/caminos/${s.id}">${ic(s.ic, 'sm')}${esc(s.short)}</a>` +
            (small ? ts.map((t) => `<a class="pill" href="#/arbol/${t.slug}">${esc(t.name)}</a>`).join('') : `<span class="muted">${ts.length} ${ts.length === 1 ? 'árbol' : 'árboles'}</span>`) + '</div>';
        }).join('') + `<div class="sub"><a class="subh" href="#/c/talento">${ic('star', 'sm')}Todos los talentos</a></div>`;
      } else {
        body = menuItems(g).map((i) => `<a class="pill" href="${i.href}">${ic(i.ic, 'sm')}${esc(i.label)}${i.count != null ? `<b>${i.count}</b>` : ''}</a>`).join('');
      }
      return `<section class="mcard"><h2>${ic(g.ic)}${esc(g.label)}</h2><p class="muted">${esc(g.desc)}</p><div class="pills">${body}</div></section>`;
    }).join('');
    el.innerHTML = `
      <section class="hero">
        <h1><span class="logo big" aria-hidden="true"></span>${esc(C.brand)}</h1>
        <p class="muted">Consulta de reglas: busca o explora por categorías</p>
        <div class="escpick" role="group" aria-label="Ambientación"><b>Ambientación:</b>${C.ambientaciones.map((a) => `<button type="button" class="sp${a.id === ambientacion ? ' on' : ''}" data-esc="${esc(a.id)}">${a.ic ? ic(a.ic, 'sm') : ''}${esc(a.label)}</button>`).join('')}</div>
        <div id="heroslot" class="heroslot"></div>
        <p class="muted"><a class="btn" href="personaje/index.html">Crear o abrir una hoja de personaje</a></p>
        <p class="hint">Prueba: <a href="#/buscar?q=ballesta">ballesta</a> · <a href="#/buscar?q=curar">curar</a> · <a href="#/buscar?q=nivel de amenaza">nivel de amenaza</a> · <a href="#/buscar?q=ayudar">ayudar</a> · <code>talento: medicina</code> · <code>"frase exacta"</code> · <code>-excluir</code></p>
      </section>
      <section class="menugrid">${groups}</section>`;
  }

  // ------------------------------------------------------------------ búsqueda global
  function viewSearch(el, params) {
    const q = (params.get('q') || '').trim();
    const catParam = params.get('cat') || '';
    if (!q) { viewHome(el); return 'home'; }
    const res = engine.search(q, { cats: CATS, allow });
    const plain = res.parsed.plain;
    const byCat = new Map();
    for (const h of res.hits) { if (!byCat.has(h.e.cat)) byCat.set(h.e.cat, []); byCat.get(h.e.cat).push(h); }
    const order = [...byCat.keys()].sort((a, b) => byCat.get(b)[0].score - byCat.get(a)[0].score);
    if (!res.hits.length) {
      el.innerHTML = `<p class="empty">Sin resultados para «${esc(q)}». Prueba con menos palabras u otra forma de decirlo, o explora el menú.</p>`;
      return;
    }
    let html = '<div class="facets">' + [`<a class="chip link${!catParam ? ' on' : ''}" href="${hashFor('/buscar', { q })}">Todo <b>${res.hits.length}</b></a>`]
      .concat(order.map((c) => `<a class="chip link${catParam === c ? ' on' : ''}" href="${hashFor('/buscar', { q, cat: c })}">${ic(catIcon(c), 'sm')}${esc(catLabel(c))} <b>${byCat.get(c).length}</b></a>`)).join(' ') + '</div>';
    if (res.partial) html += '<p class="muted">No hay entradas con todas las palabras; se muestran coincidencias parciales.</p>';
    for (const c of (catParam ? [catParam] : order)) {
      const hits = byCat.get(c) || [];
      const lim = catParam ? 120 : 5;
      html += `<section class="results"><h2>${ic(catIcon(c))}${esc(catLabel(c))} <span class="count">${hits.length}</span>` +
        (catById[c] ? ` <a class="more" href="${hashFor('/c/' + c, { q })}">Abrir en el catálogo →</a>` : '') + '</h2>' +
        hits.slice(0, lim).map((h) => hitHtml(h.e, plain)).join('');
      if (hits.length > lim) html += `<a class="more" href="${hashFor('/buscar', { q, cat: c })}">Ver los ${hits.length} resultados →</a>`;
      html += '</section>';
    }
    el.innerHTML = html;
  }
  function hitHtml(e, plain) {
    const sm = summary(e);
    const sn = (e.gen || e.cat === 'calculo') ? '' : S.snippet(e, plain);
    const act = e.cat === 'talento' ? U.act(e.f.activacion) : '';
    return `<a class="hit" href="${esc(hrefOf(e))}"><div class="hhead">${act}<strong>${S.highlight(e.title, plain)}</strong>` +
      `<span class="path">${esc(e.path.slice(-2).join(' › '))}</span>${ambientacionBadge(e)}</div>` +
      (sm ? `<div class="sum">${esc(sm)}</div>` : '') + (sn ? `<p class="snip">${sn}</p>` : '') + '</a>';
  }

  // ------------------------------------------------------------------ catálogo (tabla filtrable)
  function colHidden(cat, col) {
    let ov = null; try { ov = JSON.parse(store.get('cols_' + cat.id, 'null')); } catch (e) { ov = null; }
    if (ov && col.k in ov) return !ov[col.k];
    return !!col.hide;
  }
  function setColVisible(cat, col, vis) {
    let ov = {}; try { ov = JSON.parse(store.get('cols_' + cat.id, 'null')) || {}; } catch (e) { ov = {}; }
    ov[col.k] = vis; store.set('cols_' + cat.id, JSON.stringify(ov));
  }
  function facetValues(col, rows) {
    const m = new Map();
    for (const e of rows) for (const v of valuesOf(col, e)) m.set(v, (m.get(v) || 0) + 1);
    const arr = [...m.entries()];
    if (col.t === 'num') arr.sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])); else arr.sort((a, b) => a[0].localeCompare(b[0], 'es'));
    return arr;
  }

  function viewCatalog(el, catId, params) {
    const cat = catById[catId];
    if (!cat) { el.innerHTML = '<p class="empty">Categoría no encontrada.</p>'; return; }
    const host = el; el = document.createElement('div'); host.innerHTML = ''; host.appendChild(el);
    const rowsAll = ALL.filter((e) => e.cat === cat.id && visible(e));
    const fcols = cat.cols.filter((c) => c.f);
    const facets = {};
    fcols.forEach((c) => {
      if (c.f === 'chips' || c.f === 'select') {
        facets[c.k] = facetValues(c, rowsAll);
        c._eff = (c.f === 'chips' && facets[c.k].length > 16) ? 'select' : c.f;
      }
    });
    const st = { q: params.get('q') || '', sort: params.get('sort') || '', dir: params.get('dir') || 'asc', limit: 300 };
    const F = {};
    cat.cols.forEach((c) => {
      const f = params.get('f_' + c.k); if (f) F['f_' + c.k] = new Set(f.split('~'));
      const r = params.get('r_' + c.k); if (r) { const [a, b] = r.split(','); F['r_' + c.k] = [a === '' ? null : parseFloat(a), b === '' || b == null ? null : parseFloat(b)]; }
      const t = params.get('t_' + c.k); if (t) F['t_' + c.k] = t;
    });

    const head = (c) => `<h4>${c.ic ? ic(c.ic, 'sm') : ''}${esc(c.fl || c.l)}</h4>`;
    const panel = fcols.map((c) => {
      const eff = c._eff || c.f;
      if (eff === 'chips') {
        return `<div class="fgroup">${head(c)}<div class="chips">` + facets[c.k].map(([v, n]) =>
          `<button type="button" class="chip tog" data-k="${c.k}" data-v="${esc(v)}">${vicon(cat.id, c.k, v)}${C.actCols.includes(c.k) ? U.act(v) : ''}${esc(v)} <b>${n}</b></button>`).join('') + '</div></div>';
      }
      if (eff === 'select') {
        return `<div class="fgroup">${head(c)}<select data-k="${c.k}"><option value="">Todos</option>` + facets[c.k].map(([v, n]) => `<option value="${esc(v)}">${esc(v)} (${n})</option>`).join('') + '</select></div>';
      }
      if (eff === 'range') {
        return `<div class="fgroup">${head(c)}<div class="range"><input type="number" step="any" placeholder="mín" data-k="${c.k}" data-b="0"><span>–</span><input type="number" step="any" placeholder="máx" data-k="${c.k}" data-b="1"></div></div>`;
      }
      return `<div class="fgroup">${head(c)}<input type="text" placeholder="contiene…" data-k="${c.k}" class="ftext"></div>`;
    }).join('');

    el.innerHTML = `
      <header class="chead"><h1>${ic(cat.ic, 'lg')}${esc(cat.label)}</h1><p class="muted">${esc(cat.desc)}</p></header>
      <div class="toolbar">
        <div class="tsearch">${ic('search', 'sm')}<input id="cq" type="search" placeholder="Buscar en ${esc(cat.label.toLowerCase())}…" value="${esc(st.q)}" autocomplete="off"></div>
        <span id="ccount" class="count"></span>
        <button type="button" id="ccols" class="btn">${ic('columns', 'sm')}Columnas</button>
        <button type="button" id="cclear" class="btn">${ic('x', 'sm')}Limpiar</button>
        <button type="button" id="cftog" class="btn onlymobile">${ic('filter', 'sm')}Filtros</button>
      </div>
      <div id="colmenu" class="colmenu" hidden>${cat.cols.filter((c) => !c.main).map((c) => `<label><input type="checkbox" data-k="${c.k}" ${colHidden(cat, c) ? '' : 'checked'}> ${esc(c.l)}</label>`).join('')}</div>
      <div class="clayout${fcols.length ? '' : ' nofilters'}">
        ${fcols.length ? `<aside class="filters" id="cfilters"><div class="fhead">${ic('filter', 'sm')}Filtros</div>${panel}</aside>` : ''}
        <div class="tablewrap"><table class="grid-table"><thead></thead><tbody></tbody></table><div id="cmore"></div></div>
      </div>`;

    fcols.forEach((c) => {
      const eff = c._eff || c.f;
      if (eff === 'chips' && F['f_' + c.k]) $$(`.tog[data-k="${c.k}"]`, el).forEach((b) => b.classList.toggle('on', F['f_' + c.k].has(b.dataset.v)));
      if (eff === 'select' && F['f_' + c.k]) $(`select[data-k="${c.k}"]`, el).value = [...F['f_' + c.k]][0];
      if (eff === 'range' && F['r_' + c.k]) { const [a, b] = F['r_' + c.k]; $(`input[data-k="${c.k}"][data-b="0"]`, el).value = a == null ? '' : a; $(`input[data-k="${c.k}"][data-b="1"]`, el).value = b == null ? '' : b; }
      if (eff === 'text' && F['t_' + c.k]) $(`input.ftext[data-k="${c.k}"]`, el).value = F['t_' + c.k];
    });
    if (window.matchMedia('(max-width: 800px)').matches) { const fl = $('#cfilters', el); if (fl && !Object.keys(F).length) fl.classList.add('collapsed'); }

    function match(e) {
      for (const c of cat.cols) {
        const fs = F['f_' + c.k];
        if (fs && !valuesOf(c, e).some((v) => fs.has(v))) return false;
        const rg = F['r_' + c.k];
        if (rg) {
          const v = getVal(e, c.fk || c.sk || c.k);
          const n = typeof v === 'number' ? v : null;
          if (n == null || (rg[0] != null && n < rg[0]) || (rg[1] != null && n > rg[1])) return false;
        }
        const tf = F['t_' + c.k];
        if (tf && !nc(valuesOf(c, e).join(' ')).includes(nc(tf))) return false;
      }
      return true;
    }
    function syncURL() {
      const sp = new URLSearchParams();
      if (st.q) sp.set('q', st.q);
      if (st.sort) { sp.set('sort', st.sort); sp.set('dir', st.dir); }
      for (const k in F) {
        const v = F[k];
        if (k.startsWith('f_')) sp.set(k, [...v].join('~'));
        else if (k.startsWith('r_')) sp.set(k, (v[0] == null ? '' : v[0]) + ',' + (v[1] == null ? '' : v[1]));
        else sp.set(k, v);
      }
      setParams('/c/' + cat.id, sp, true);
    }
    function render() {
      let rows, plain = [];
      if (st.q) {
        const r = engine.search(st.q, { cats: CATS, catIds: [cat.id], allow });
        rows = r.hits.map((h) => h.e); plain = r.parsed.plain;
      } else rows = rowsAll.slice();
      rows = rows.filter(match);
      const sc = cat.cols.find((c) => c.k === st.sort);
      if (sc) {
        const dir = st.dir === 'desc' ? -1 : 1;
        rows = rows.map((e, i) => ({ e, i, v: sortVal(sc, e) })).sort((a, b) => {
          if (a.v == null && b.v == null) return a.i - b.i;
          if (a.v == null) return 1;
          if (b.v == null) return -1;
          const c = typeof a.v === 'number' ? a.v - b.v : a.v.localeCompare(b.v, 'es');
          return c ? c * dir : a.i - b.i;
        }).map((x) => x.e);
      }
      const vis = cat.cols.filter((c) => c.main || !colHidden(cat, c));
      $('thead', el).innerHTML = '<tr>' + vis.map((c) => {
        const on = st.sort === c.k;
        return `<th class="${c.main ? 'main' : ''}${c.narrow ? ' narrow' : ''}"><button type="button" data-sort="${c.k}">${c.ic ? ic(c.ic, 'sm dim') : ''}${esc(c.l)}${on ? (st.dir === 'desc' ? ' ▼' : ' ▲') : ''}</button></th>`;
      }).join('') + '</tr>';
      const shown = rows.slice(0, st.limit);
      $('tbody', el).innerHTML = shown.map((e) => '<tr>' + vis.map((c) => {
        if (c.main) {
          const lead = e.cat === 'talento' ? U.act(e.f.activacion) : '';
          return `<td class="main">${lead}<a href="${esc(hrefOf(e))}">${plain.length ? S.highlight(e.title, plain) : esc(e.title)}</a></td>`;
        }
        const wrap = c.k === 'formula' ? ' wide' : '';
        return `<td class="${c.t === 'num' ? 'num' : ''}${c.k === 'ext' ? ' ext' : ''}${wrap}">${valueHtml(cat, c, e)}</td>`;
      }).join('') + '</tr>').join('');
      $('#ccount', el).textContent = rows.length === rowsAll.length ? `${rows.length} elementos` : `${rows.length} de ${rowsAll.length}`;
      $('#cmore', el).innerHTML = rows.length > st.limit ? `<button type="button" class="btn" id="cshow">Mostrar ${Math.min(300, rows.length - st.limit)} más (${rows.length - st.limit} restantes)</button>` : '';
      if (!rows.length) $('tbody', el).innerHTML = `<tr><td colspan="${vis.length}" class="empty">Nada coincide con los filtros.</td></tr>`;
    }

    el.addEventListener('click', (ev) => {
      const t = ev.target.closest('.tog');
      if (t) {
        const k = t.dataset.k, v = t.dataset.v;
        const cur = F['f_' + k] || new Set();
        cur.has(v) ? cur.delete(v) : cur.add(v);
        if (cur.size) F['f_' + k] = cur; else delete F['f_' + k];
        t.classList.toggle('on'); st.limit = 300; syncURL(); render(); return;
      }
      const sb = ev.target.closest('[data-sort]');
      if (sb) {
        const k = sb.dataset.sort;
        if (st.sort === k) { if (st.dir === 'asc') st.dir = 'desc'; else { st.sort = ''; st.dir = 'asc'; } } else { st.sort = k; st.dir = 'asc'; }
        syncURL(); render(); return;
      }
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.id === 'cshow') { st.limit += 300; render(); }
      else if (b.id === 'ccols') { const m = $('#colmenu', el); m.hidden = !m.hidden; }
      else if (b.id === 'cftog') { const fl = $('#cfilters', el); if (fl) fl.classList.toggle('collapsed'); }
      else if (b.id === 'cclear') {
        for (const k in F) delete F[k];
        st.q = ''; st.sort = ''; $('#cq', el).value = '';
        $$('.tog.on', el).forEach((x) => x.classList.remove('on'));
        $$('select[data-k]', el).forEach((s) => (s.value = ''));
        $$('.filters input', el).forEach((i) => (i.value = ''));
        st.limit = 300; syncURL(); render();
      }
    });
    el.addEventListener('change', (ev) => {
      const t = ev.target;
      if (t.matches('#colmenu input')) { setColVisible(cat, cat.cols.find((x) => x.k === t.dataset.k), t.checked); render(); return; }
      if (t.matches('select[data-k]')) {
        if (t.value) F['f_' + t.dataset.k] = new Set([t.value]); else delete F['f_' + t.dataset.k];
        st.limit = 300; syncURL(); render();
      }
    });
    el.addEventListener('input', (ev) => {
      const t = ev.target;
      if (t.id === 'cq') { st.q = t.value.trim(); st.limit = 300; syncURL(); render(); return; }
      if (t.matches('input[data-b]')) {
        const k = t.dataset.k;
        const a = $(`input[data-k="${k}"][data-b="0"]`, el).value, b = $(`input[data-k="${k}"][data-b="1"]`, el).value;
        if (a === '' && b === '') delete F['r_' + k]; else F['r_' + k] = [a === '' ? null : parseFloat(a), b === '' ? null : parseFloat(b)];
        st.limit = 300; syncURL(); render(); return;
      }
      if (t.matches('input.ftext')) {
        const k = t.dataset.k;
        if (t.value.trim()) F['t_' + k] = t.value.trim(); else delete F['t_' + k];
        st.limit = 300; syncURL(); render();
      }
    });
    render();
  }

  // ------------------------------------------------------------------ caminos: portada, secciones y árboles
  function treeCard(t) {
    const tals = t.talents.filter(visible);
    return `<a class="card tcard" href="#/arbol/${t.slug}">${ic(t.section.ic)}<strong>${esc(t.name)}</strong><span>${t.talents.length ? `${tals.length} ${tals.length === 1 ? 'talento' : 'talentos'}` : 'Sin talentos'}</span></a>`;
  }
  function viewPaths(el, secId) {
    const secs = secId ? C.treeSections.filter((s) => s.id === secId || (C.treeSections.find((p) => p.id === secId) || {}).id === s.parent) : topSecs();
    if (secId && !secs.length) { el.innerHTML = '<p class="empty">Sección no encontrada.</p>'; return; }
    const cur = secId ? C.treeSections.find((s) => s.id === secId) : null;
    const par = cur && cur.parent ? C.treeSections.find((s) => s.id === cur.parent) : null;
    el.innerHTML = (secId ? `<p class="crumbs"><a href="#/caminos">${ic('back', 'sm')}Caminos</a>${par ? ` › <a href="#/caminos/${par.id}">${esc(par.short)}</a>` : ''}</p>` : '') +
      `<h1>${ic('tree', 'lg')}${secId ? esc(cur.label) : 'Caminos y árboles de talentos'}</h1>` +
      (secId ? '' : '<p class="muted">Cada árbol muestra todos sus talentos y cómo se desbloquean unos a otros.</p>') +
      (cur ? secs : secs.flatMap((s) => [s, ...childSecs(s)])).map((s) => {
        const ts = TREES.filter((t) => t.section === s);
        if (!ts.length) return '';
        const humana = byId.get('origen-ascendencia-humana');
        const extra = s.id === 'ascendencia'
          ? `${humana ? `<div class="grid"><a class="card tcard" href="#/e/${humana.id}">${ic('globe')}<strong>Ascendencia humana</strong><span>Sin árbol propio: elige un talento de un camino heroico en los niveles 1, 6, 11, 16 y 21</span></a></div>` : ''}<h3>${ic('book', 'sm')}Texto de las ascendencias</h3><div class="pills">${ALL.filter((e) => e.cat === 'origen' && e.path[1] === 'Ascendencia' && /^Ascendencia/.test(e.title) && visible(e)).map((e) => `<a class="pill" href="${esc(hrefOf(e))}">${esc(e.title)}</a>`).join('')}</div>` : '';
        const spec = (t) => specsOfTree(t).length ? `<div class="pills specs">${specsOfTree(t).map((x) => `<a class="pill" href="#/arbol/${t.slug}/${slugOf(x)}">${esc(x)}</a>`).join('')}</div>` : '';
        const showHead = !(secId && s.id === secId);
        return `<section class="group"><h2>${showHead ? `<a href="#/caminos/${s.id}">` : ''}${ic(s.ic)}${esc(s.label)}${showHead ? '</a>' : ''}</h2><div class="grid">${ts.map((t) => treeCard(t)).join('')}</div>${s.id === 'heroicos' ? ts.map((t) => spec(t) ? `<h4><a href="#/arbol/${t.slug}">${esc(t.name)}</a></h4>${spec(t)}` : '').join('') : ''}${extra}</section>`;
      }).join('');
  }

  function nodeHtml(n, hl) {
    if (n.virtual) return `<div class="node root" data-id="__root"><span class="nt">${ic('flame', 'sm')}${esc(n.title)}</span></div>`;
    const e = n.e, f = e.f;
    const req = f.habilidad && f.grados ? `<span class="req">${esc(f.habilidad)} ${f.grados}</span>` : '';
    const xr = (e.x.xreq || []).map((id) => byId.get(id)).filter(Boolean).map((t) => t.title);
    const mech = (e.resumen || e.mecanica) ? (e.resumen || e.mecanica).replace(/\s+/g, ' ').replace(/#+\s*/g, '').replace(/\[\[(?:[^\]|]*\|)*([^\]|]*)\]\]/g, '$1').replace(/[*_]/g, '').trim() : '';
    return `<a class="node b${n.branch}${e.x.main ? ' main' : ''}${hl === e.id ? ' hl' : ''}" data-id="${esc(e.id)}" href="#/e/${esc(e.id)}"${f.especialidad ? ` title="${esc((f.especialidades && f.especialidades.length ? f.especialidades : [f.especialidad]).join(' · '))}"` : ''}>` +
      `<span class="nt">${U.act(f.activacion)}${esc(n.title)}</span>` +
      (req || xr.length ? `<span class="nr">${req}${xr.length ? `<span class="req x">${esc(xr.join(', '))}</span>` : ''}</span>` : '') +
      (mech ? `<span class="nm" title="${esc(mech)}">${esc(mech)}</span>` : '') + '</a>';
  }

  function drawEdges(wrap) {
    const tree = $('.tree', wrap); if (!tree) return;
    const svg = $('svg.edges', tree);
    const tr = tree.getBoundingClientRect();
    const pos = new Map();
    $$('.node', tree).forEach((n) => { const r = n.getBoundingClientRect(); pos.set(n.dataset.id, { x: r.left - tr.left + r.width / 2, t: r.top - tr.top, b: r.bottom - tr.top }); });
    svg.setAttribute('width', tree.scrollWidth); svg.setAttribute('height', tree.scrollHeight);
    let d = '';
    (wrap._edges || []).forEach(([a, b, br]) => {
      const p = pos.get(a), c = pos.get(b); if (!p || !c) return;
      const h = Math.max(20, (c.t - p.b) / 2);
      d += `<path class="e b${br}" d="M${p.x} ${p.b} C ${p.x} ${p.b + h}, ${c.x} ${c.t - h}, ${c.x} ${c.t}" data-a="${a}" data-b="${b}"/>`;
    });
    svg.innerHTML = d;
  }

  function viewTree(el, slug, params, specSlug) {
    const tree = treeBySlug.get(slug);
    if (!tree) { el.innerHTML = '<p class="empty">Árbol no encontrado.</p>'; return; }
    const hl = params.get('hl') || '';
    let only = params.get('esp') || '';
    const locked = specSlug ? specsOfTree(tree).find((s) => slugOf(s) === specSlug) : null;
    if (specSlug && !locked) { el.innerHTML = '<p class="empty">Especialidad no encontrada.</p>'; return; }
    if (locked) only = locked;
    let lay = layoutTree(tree, only);
    if (only && !lay.specs.includes(only)) { only = ''; lay = layoutTree(tree, ''); }
    const mode = params.get('v') || store.get('cosmere_treeview', 'tree');
    let edges = [], flat = [];
    const calc = () => {
      edges = [];
      lay.nodes.forEach((n) => n.parents.forEach((p) => edges.push([p.id, n.id, n.branch < 0 ? 0 : n.branch])));
      flat = lay.nodes.filter((n) => !n.virtual).sort((a, b) => a.depth - b.depth || a.order - b.order);
    };
    calc();
    const legendHtml = () => locked
      ? `<b>Especialidades de ${esc(tree.name)}:</b> ${lay.specs.map((s, i) => `<a class="sp b${i % 6}${s === locked ? ' on' : ''}" href="#/arbol/${tree.slug}/${slugOf(s)}"><i class="sw"></i>${esc(s)}</a>`).join('')}<a class="sp clear" href="#/arbol/${tree.slug}">Camino completo</a>`
      : lay.specs.length ? `<b>Especialidades:</b> <span class="sp main"><i class="sw"></i>Talento principal</span>${lay.specs.map((s, i) => `<span class="spw"><button type="button" class="sp b${i % 6}${only === s ? ' on' : ''}" data-spec="${esc(s)}" title="${only === s ? 'Quitar filtro' : 'Ver solo ' + esc(s)}"><i class="sw"></i>${esc(s)} <small>${tree.talents.filter((t) => (t.f.especialidades || [t.f.especialidad]).includes(s) && visible(t)).length}</small></button><a class="spgo" href="#/arbol/${tree.slug}/${slugOf(s)}" title="Abrir página de ${esc(s)}">↗</a></span>`).join('')}${only ? '<button type="button" class="sp clear" data-spec="">Ver todas</button>' : ''}` : '';
    const kw = tree.section.id === 'ascendencia' ? nc(tree.name).replace(/^ascendencia( de)? /, '') : null;
    const texts = kw ? ALL.filter((e) => e.cat === 'origen' && e.path[1] === 'Ascendencia' && nc(e.title).includes(kw) && visible(e))
      : ALL.filter((e) => (e.cat === 'camino' || e.cat === 'arte' || e.cat === 'origen') && e.path[1] === tree.name && visible(e));
    const arb = arbolBySlug.get(slug);
    const agg = new Map();
    tree.talents.filter(visible).forEach((t) => (t.x.efectos || []).forEach((x) => {
      const k = x.objetivo;
      if (!agg.has(k)) agg.set(k, []);
      agg.get(k).push({ t, x });
    }));
    const aggRows = [...agg.entries()].sort((a, b) => objLabel(a[0]).localeCompare(objLabel(b[0]), 'es')).map(([k, arr]) =>
      `<tr><td class="aggk">${ic(C.efIcons[k] || 'modif', 'sm')}${esc(objLabel(k))}</td><td>${arr.map(({ t, x }) => {
        const v = efValor(x) || (x.detalle ? x.detalle.slice(0, 42) : '');
        return `<a class="chip link${x.permanente ? '' : ' soft'}" href="#/e/${esc(t.id)}" title="${x.permanente ? 'Permanente' : 'Condicional o temporal'}">${esc(t.title.replace(/\s*\(.*?\)\s*/g, ' ').trim())}${v ? ` <small>${esc(v)}</small>` : ''}</a>`;
      }).join(' ')}</td></tr>`).join('');
    const efPanel = (tree.section.id === 'ascendencia' && ((arb && arb.efectos.length) || aggRows))
      ? `<section class="efectos treefx"><h3>${ic('modif', 'sm')}Qué modifica en el personaje</h3>` +
        (arb && arb.efectos.length ? `<h5>${tree.section.id === 'ascendencia' ? 'De la ascendencia' : 'Del camino'}</h5><ul class="eflist">${arb.efectos.map(efectoLi).join('')}</ul>` : '') +
        (aggRows ? `<h5>Talentos que modifican algo (las etiquetas claras son condicionales o temporales)</h5><table class="aggt"><tbody>${aggRows}</tbody></table>` : '') + '</section>'
      : '';
    const metalSlug = slugOf((tree.talents.length ? tree.talents[0].f.metal : tree.name.replace(/^\S+ de /, '')) + '');
    const actions = ALL.filter((a) => a.cat === 'accion' && /^Activaci[oó]n:/.test(a.body) && visible(a) &&
      (tree.section.id === 'alomancia'
        ? (metalSlug && /^(Quemar|Tragar) /.test(a.title) && slugOf(a.title).replace(/^(quemar|tragar)-/, '') === metalSlug) ||
          (a.path[1] && slugOf(a.path[1]) === slugOf(tree.name) && !/^(Quemar|Tragar) /.test(a.title))
        : a.path[1] && slugOf(a.path[1]) === slugOf(tree.name)));
    const nodeIds = new Set(lay.nodes.map((n) => n.id));
    const acts = locked ? actions.filter((a) => !a.f.talento || nodeIds.has(a.f.talento)) : actions;
    const actCard = (a) => {
      const ps = a.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
      const act = ps.shift().replace(/\s*\n\s*/g, ' ');
      const m = (ps[0] || '').replace(/\s+/g, ' ').replace(/\[\[(?:[^\]|]*\|)*([^\]|]*)\]\]/g, '$1').replace(/[*_#]/g, '').trim();
      return `<a class="actcard" href="#/e/${esc(a.id)}"><b>${ic('flame', 'sm')}${esc(a.title)}</b><span class="req">${esc(act)}</span><span class="nm">${esc(m)}</span></a>`;
    };
    const crumbSec = tree.section.parent ? C.treeSections.find((s) => s.id === tree.section.parent) : null;
    el.innerHTML = `
      <p class="crumbs"><a href="#/caminos">Caminos</a> › ${crumbSec ? `<a href="#/caminos/${crumbSec.id}">${esc(crumbSec.short)}</a> › ` : ''}<a href="#/caminos/${tree.section.id}">${esc(tree.section.short)}</a>${locked ? ` › <a href="#/arbol/${tree.slug}">${esc(tree.name)}</a>` : ''}</p>
      <header class="chead"><h1>${ic(tree.section.ic, 'lg')}${locked ? `${esc(tree.name)}: ${esc(locked)}` : esc(tree.name)}</h1>
        <p class="muted">${(() => { const n = lay.nodes.filter((x) => !x.virtual).length; return tree.talents.length ? `${n} ${n === 1 ? 'talento' : 'talentos'}` : 'Sin árbol de talentos'; })()} · ${esc(tree.section.label)}</p></header>
      ${locked ? '' : efPanel}
      ${acts.length ? `<section class="actions"><h2>${ic('flame')}Acciones ${locked ? 'de la especialidad' : 'del poder'}</h2><div class="actgrid">${acts.map(actCard).join('')}</div></section>` : ''}
      ${tree.talents.length ? `<h2>${ic('tree')}Árbol de talentos</h2>
      <div class="toolbar">
        <div class="seg"><button type="button" data-v="tree" class="${mode === 'tree' ? 'on' : ''}">${ic('tree', 'sm')}Árbol</button><button type="button" data-v="list" class="${mode === 'list' ? 'on' : ''}">${ic('list', 'sm')}Lista</button></div>
        <span class="legend">${U.act('1 acción')} 1 · ${U.act('2 acciones')} 2 · ${U.act('3 acciones')} 3 · ${U.act('Acción gratuita')} gratuita · ${U.act('Reacción')} reacción · ${U.act('Siempre activo')} siempre activo · ${U.act('Especial')} especial</span>
      </div>
      <p class="speclegend" id="speclegend"${lay.specs.length ? '' : ' hidden'}>${legendHtml()}</p>` : ''}
      <div id="treebox"></div>
      ${texts.length && !locked ? `<section class="group"><h2>${ic('book')}${tree.section.id === 'ascendencia' ? 'Contenido de la ascendencia' : 'Contenido del camino'} <span class="count">${texts.length}</span></h2>${texts.map((e, i) => `<details class="doc"${i === 0 ? ' open' : ''}><summary>${esc(e.title)}</summary><div class="body">${md(e.body)}${(e.x && e.x.efectos) ? efectosHtml(e.x.efectos) : ''}</div></details>`).join('')}</section>` : ''}`;

    const box = $('#treebox', el);
    function paint(m) {
      if (m === 'list') {
        box.innerHTML = `<div class="tablewrap"><table class="grid-table"><thead><tr><th class="main">Talento</th>${lay.specs.length ? '<th>Especialidad</th>' : ''}<th>Activación</th><th>Requisito</th><th>Mecánica</th><th>Desbloquea</th></tr></thead><tbody>` +
          flat.map((n) => {
            const e = n.e;
            const mech = (e.resumen || e.mecanica) ? (e.resumen || e.mecanica).replace(/\s+/g, ' ').replace(/#+\s*/g, '').replace(/\[\[(?:[^\]|]*\|)*([^\]|]*)\]\]/g, '$1').replace(/[*_]/g, '').trim() : '';
            return `<tr><td class="main">${U.act(e.f.activacion)}<a href="#/e/${esc(e.id)}">${esc(n.title)}</a></td>${lay.specs.length ? `<td>${esc((e.f.especialidades && e.f.especialidades.length ? e.f.especialidades.join(' · ') : e.f.especialidad) || '—')}</td>` : ''}<td>${esc(e.f.activacion)}</td><td class="wide">${esc(e.f.prerrequisito)}</td><td class="mech">${esc(mech) || '—'}</td><td>${n.kids.map((k) => `<a href="#/e/${esc(k.id)}">${esc(k.title)}</a>`).join(', ') || '—'}</td></tr>`;
          }).join('') + '</tbody></table></div>';
      } else {
        let inner;
        if (lay.lanes.length) {
          const L = lay.lanes.length, maxD = Math.max(...lay.nodes.map((n) => n.depth)), R = maxD + 2;
          const cells = new Map();
          lay.nodes.forEach((n) => { const k = n.depth + '|' + n.lane; (cells.get(k) || cells.set(k, []).get(k)).push(n); });
          inner = `<div class="cols lanes" style="grid-template-columns:repeat(${L},minmax(max-content,1fr))">` +
            lay.lanes.map((s, i) => `<div class="lanebg b${lay.specs.indexOf(s) % 6}" style="grid-column:${i + 1};grid-row:1 / span ${R}"></div><div class="lanehead b${lay.specs.indexOf(s) % 6}" style="grid-column:${i + 1};grid-row:1">${esc(s)}</div>`).join('') +
            [...cells.entries()].map(([k, ns]) => {
              const [d, l] = k.split('|').map(Number);
              return `<div class="trow" style="grid-row:${d + 2};grid-column:${l < 0 ? `1 / span ${L}` : l + 1}">${ns.sort((a, b) => a.order - b.order).map((n) => nodeHtml(n, hl)).join('')}</div>`;
            }).join('') + '</div>';
        } else {
          inner = `<div class="cols">` + lay.cols.map((col) => `<div class="tlevel"><div class="trow">${col.map((n) => nodeHtml(n, hl)).join('')}</div></div>`).join('') + '</div>';
        }
        box.innerHTML = `<div class="treewrap"><div class="tree"><svg class="edges"></svg>${inner}</div></div>`;
        const wrap = $('.treewrap', box); wrap._edges = edges;
        requestAnimationFrame(() => {
          drawEdges(wrap);
          const h = $('.node.hl', wrap);
          if (h) { // centra el nodo resaltado dentro del árbol sin mover toda la página
            const hr = h.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
            wrap.scrollTop += hr.top - wr.top - wr.height / 2 + hr.height / 2;
            wrap.scrollLeft += hr.left - wr.left - wr.width / 2 + hr.width / 2;
          }
        });
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => drawEdges(wrap)));
        wrap.addEventListener('mouseover', (ev) => {
          const n = ev.target.closest('.node'); if (!n) return;
          const id = n.dataset.id;
          $$('.e', wrap).forEach((p) => p.classList.toggle('on', p.dataset.a === id || p.dataset.b === id));
        });
        wrap.addEventListener('mouseleave', () => $$('.e.on', wrap).forEach((p) => p.classList.remove('on')));
      }
    }
    let curMode = mode;
    el.addEventListener('click', (ev) => {
      const sp = ev.target.closest('[data-spec]');
      if (sp) {
        only = only === sp.dataset.spec ? '' : sp.dataset.spec;
        lay = layoutTree(tree, only); calc();
        $('#speclegend', el).innerHTML = legendHtml();
        paint(curMode);
        return;
      }
      const b = ev.target.closest('.seg button'); if (!b) return;
      curMode = b.dataset.v;
      store.set('cosmere_treeview', b.dataset.v);
      $$('.seg button', el).forEach((x) => x.classList.toggle('on', x === b));
      paint(b.dataset.v);
    });
    if (tree.talents.length) paint(mode);
  }

  // ------------------------------------------------------------------ talento (página propia)
  function talentChip(e) { return `<a class="chip link" href="#/e/${esc(e.id)}">${U.act(e.f.activacion)}${esc(e.title.replace(/\s*\(.*?\)\s*/g, ' ').trim())}</a>`; }
  function talentBlock(e) {
    const f = e.f, t = treeOf(e), x = e.x || { req: [], xreq: [] };
    const reqs = x.req.map((i) => byId.get(i)).filter(Boolean);
    const xreqs = x.xreq.map((i) => byId.get(i)).filter(Boolean);
    const kids = ALL.filter((o) => o.cat === 'talento' && o.x && o.x.req.includes(e.id));
    const facts = [
      ['Camino / arte', t ? `<a href="#/arbol/${t.slug}">${ic(t.section.ic, 'sm')}${esc(f.origen)}</a>` : esc(f.origen)],
      ['Tipo', esc(f.tipo_origen)],
      f.habilidad ? ['Habilidad requerida', `${ic('award', 'sm')}${esc(f.habilidad)} ${f.grados || ''}`.trim() + (f.grados ? ' o más' : '')] : null,
      ['Activación', `${U.act(f.activacion)}${esc(f.activacion)}`],
      ['Prerrequisito', esc(f.prerrequisito)],
    ].filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
    const html = `<dl class="facts">${facts}</dl>
      ${efectosHtml(x.efectos)}
      ${(reqs.length || xreqs.length) ? `<section><h3>${ic('right', 'sm')}Requiere</h3><div class="chips">${reqs.map(talentChip).join(' ')}${xreqs.map((o) => `<a class="chip link" href="#/e/${esc(o.id)}">${esc(o.title)} <small>(${esc(o.f.origen)})</small></a>`).join(' ')}</div></section>` : ''}
      <div class="body theme">${md(e.body)}</div>
      ${e.mecanica ? `<section class="mecanica"><h3>${ic('info', 'sm')}Mecánica</h3><div class="body">${md(e.mecanica)}</div></section>` : ''}
      ${kids.length ? `<section><h3>${ic('tree', 'sm')}Desbloquea</h3><div class="chips">${kids.map(talentChip).join(' ')}</div></section>` : ''}`;
    return { t, html };
  }
  function viewTalent(el, id) {
    const e = byId.get(id);
    if (!e || e.cat !== 'talento') { el.innerHTML = '<p class="empty">Talento no encontrado. <a href="#/caminos">Ver caminos</a></p>'; return; }
    const f = e.f, b = talentBlock(e), t = b.t;
    el.innerHTML = `
      <p class="crumbs"><a href="#/caminos">Caminos</a>${t ? ` › <a href="#/caminos/${t.section.id}">${esc(t.section.short)}</a> › <a href="#/arbol/${t.slug}">${esc(t.name)}</a>` : ''}</p>
      <article class="tpage">
        <header><h1>${U.act(f.activacion)}${esc(e.title)}</h1>
          <p class="path">${esc(e.path.join(' › '))} · ${esc(bookOf(e))} · págs. ${esc(e.pages)} ${ambientacionBadge(e)}</p></header>
        ${b.html}
        <div class="actions">${t ? `<a class="btn" href="${hashFor('/arbol/' + t.slug, { hl: e.id })}">${ic('tree', 'sm')}Ver en el árbol</a>` : ''}<button type="button" class="btn" id="copylink">${ic('link', 'sm')}Copiar enlace</button></div>
      </article>`;
  }

  // ------------------------------------------------------------------ ficha de entrada (panel y página)
  function traitChips(e, txt) {
    if (!txt || txt === '—') return '—';
    const aplica = e.cat === 'armadura' ? 'Armaduras' : 'Armas';
    const parts = []; let depth = 0, cur = '';
    for (const ch of txt) { if (ch === '[') depth++; else if (ch === ']') depth--; if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) parts.push(cur.trim());
    return '<span class="chips">' + parts.map((p) => {
      const base = p.split(/[\[:]/)[0].trim();
      const tgt = p.includes(':') ? null : traitIndex.get(aplica + '|' + nc(base));
      return tgt ? `<a class="chip link" href="${esc(hrefOf(tgt))}">${ic('tag', 'sm')}${esc(p)}</a>` : `<span class="chip">${esc(p)}</span>`;
    }).join(' ') + '</span>';
  }
  function advBlock(e) {
    const f = e.f, x = e.x || { rasgos: [], acciones: [], tacticas: '' };
    const attr = (l, v) => `<div class="att"><span>${l}</span><b>${v == null ? '—' : v}</b></div>`;
    let h = `<div class="stat"><div class="statline"><span class="chip">${vicon('adversario', 'rol', f.rol)}${esc(f.rol)}</span><span class="chip">${ic('award', 'sm')}Rango ${f.rango}</span><span class="chip">${esc(f.tamano)}</span>${ambientacionBadge(e, true)}</div>`;
    h += `<div class="atts"><div class="attgroup"><h5>${ic('activity', 'sm')}Físico</h5>${attr('Fuerza', f.fue)}${attr('Velocidad', f.vel)}<div class="def">Defensa <b>${f.def_fis}</b></div></div>` +
      `<div class="attgroup"><h5>${ic('bulb', 'sm')}Cognitivo</h5>${attr('Intelecto', f.int)}${attr('Voluntad', f.vol)}<div class="def">Defensa <b>${f.def_cog}</b></div></div>` +
      `<div class="attgroup"><h5>${ic('sun', 'sm')}Espiritual</h5>${attr('Discernimiento', f.dis)}${attr('Presencia', f.pre)}<div class="def">Defensa <b>${f.def_esp}</b></div></div></div>`;
    h += `<p class="vitals"><b>${ic('heart', 'sm')}Salud</b> ${f.salud} (${f.salud_min} a ${f.salud_max}) · <b>Concentración</b> ${f.concentracion} · <b>Investidura</b> ${f.investidura} · <b>${ic('shield', 'sm')}Desvío</b> ${f.desvio}<br><b>Movimiento</b> ${esc(f.movimiento || '—')} · <b>Sentidos</b> ${esc(f.sentidos || '—')}</p>`;
    const sk = [['Físicas', f.hab_fis], ['Cognitivas', f.hab_cog], ['Espirituales', f.hab_esp]].filter((s) => s[1]);
    if (sk.length) h += '<p class="skills">' + sk.map((s) => `<b>${s[0]}:</b> ${esc(s[1])}`).join('<br>') + '</p>';
    if (x.raw) h += `<p class="muted">Línea de estadísticas sin interpretar: ${esc(x.raw)}</p>`;
    if (x.rasgos.length) h += `<h4>${ic('tag', 'sm')}Rasgos</h4>` + x.rasgos.map((r) => `<p><b>${esc(r.n)}.</b> ${esc(r.t)}</p>`).join('');
    if (x.acciones.length) h += `<h4>${ic('pip', 'sm')}Acciones</h4>` + x.acciones.map((a) => `<p>${U.act(a.c) || `<span class="act">${esc(a.c)}</span>`} ${esc(a.t)}</p>`).join('');
    if (x.tacticas) h += `<h4>Tácticas</h4>` + md(x.tacticas);
    return h + '</div>';
  }
  function entryHtml(e, page) {
    const cat = catById[e.cat];
    const facts = [];
    if (cat && e.cat !== 'adversario') {
      for (const c of cat.cols) {
        if (['title', 'ext', 'sec', 'cap', 'pages', 'ambientacion'].includes(c.k)) continue;
        const v = getVal(e, c.k);
        if (v == null || v === '' || v === '—' || (Array.isArray(v) && !v.length)) continue;
        let val;
        if ((e.cat === 'arma' || e.cat === 'armadura') && c.k === 'rasgos') val = traitChips(e, e.f.rasgos_txt);
        else if ((e.cat === 'arma' || e.cat === 'armadura') && c.k === 'experto') val = traitChips(e, e.f.experto);
        else val = valueHtml(cat, c, e);
        facts.push(`<dt>${esc(c.l)}</dt><dd>${val}</dd>`);
      }
    }
    const tb = e.cat === 'talento' ? talentBlock(e) : null;
    const body = e.cat === 'adversario' ? advBlock(e) : (e.gen ? '' : `<div class="body">${md(e.body)}</div>`);
    let more = '';
    if (tb && tb.t) more += `<a class="btn" href="${hashFor('/arbol/' + tb.t.slug, { hl: e.id })}">${ic('tree', 'sm')}Ver en el árbol</a> `;
    if (cat) more += `<a class="btn" href="#/c/${cat.id}">${ic(cat.ic, 'sm')}Ver en «${esc(cat.label)}»</a> `;
    more += `<a class="btn" href="${hashFor('/buscar', { q: e.title })}">${ic('search', 'sm')}Buscar «${esc(e.title)}»</a> `;
    more += `<button type="button" class="btn" id="copylink">${ic('link', 'sm')}Copiar enlace</button>`;
    const lead = e.cat === 'talento' ? U.act(e.f.activacion) : '';
    return `${page ? '' : `<div class="dhead"><span class="chip">${ic(catIcon(e.cat), 'sm')}${esc(catLabel(e.cat))}</span>${ambientacionBadge(e)}<a class="btn small openpage" href="${esc(pageHref(e))}" title="Abrir la página completa">${ic('expand', 'sm')}Abrir página</a><button type="button" class="close" id="dclose" aria-label="Cerrar">${ic('x', 'sm')}</button></div>`}
      <h2>${page ? ic(catIcon(e.cat), 'lg') : lead}${page ? esc(e.title) : `<a class="tlink" href="${esc(pageHref(e))}" title="Abrir la página completa">${esc(e.title)}</a>`}</h2>
      <p class="path">${esc(e.path.join(' › '))}<br><span class="src">${esc('Cosmere RPG · ' + e.ambientacion.replace(/ Era/, ' · Era'))} — ${esc(bookOf(e))}${e.pages ? ` · págs. ${esc(e.pages)}` : ''}</span></p>
      ${tb ? tb.html : (facts.length ? `<dl class="facts">${facts.join('')}</dl>` : '') + ((e.x && e.x.efectos) ? efectosHtml(e.x.efectos) : '') + body}
      <div class="actions">${more}</div>`;
  }
  function viewPage(el, id) {
    const e = byId.get(id);
    if (!e) { el.innerHTML = '<p class="empty">Página no encontrada.</p>'; return; }
    el.innerHTML = `<article class="tpage">${entryHtml(e, true)}</article>`;
  }

  function openDrawer(id) {
    const d = $('#drawer'), inner = $('#dinner');
    const e = byId.get(id);
    if (!e) inner.innerHTML = `<div class="dhead"><button type="button" class="close" id="dclose" aria-label="Cerrar">${ic('x', 'sm')}</button></div><p class="empty">Entrada no encontrada.</p>`;
    else { inner.innerHTML = entryHtml(e, false); document.title = e.title + ' · ' + C.brand; }
    d.hidden = false; document.body.classList.add('drawer-open'); inner.scrollTop = 0;
  }
  function closeDrawer() {
    const d = $('#drawer');
    if (!d.hidden) { d.hidden = true; document.body.classList.remove('drawer-open'); document.title = C.brand + ' · Consulta de reglas'; }
  }

  // ------------------------------------------------------------------ router
  function placeSearch(home) {
    const q = $('#q');
    const target = home ? $('#heroslot') : $('#hdrslot');
    if (target && q.parentElement !== target) target.appendChild(q);
    document.body.classList.toggle('is-home', !!home);
  }
  function renderBase(raw) {
    const i = raw.indexOf('?');
    const path = i < 0 ? raw : raw.slice(0, i);
    const params = new URLSearchParams(i < 0 ? '' : raw.slice(i + 1));
    const el = $('#view');
    placeSearch(false);       // el buscador vuelve a la cabecera antes de reemplazar la vista
    let m, home = false;
    if (path === '/' || path === '') { viewHome(el); home = true; }
    else if (path === '/buscar') { if (viewSearch(el, params) === 'home') home = true; }
    else if ((m = path.match(/^\/c\/([\w-]+)$/))) viewCatalog(el, m[1], params);
    else if (path === '/caminos') viewPaths(el);
    else if ((m = path.match(/^\/caminos\/([\w-]+)$/))) viewPaths(el, m[1]);
    else if ((m = path.match(/^\/arbol\/([\w-]+)\/([\w-]+)$/))) viewTree(el, m[1], params, m[2]);
    else if ((m = path.match(/^\/arbol\/([\w-]+)$/))) viewTree(el, m[1], params);
    else if ((m = path.match(/^\/talento\/(.+)$/))) viewTalent(el, decodeURIComponent(m[1]));
    else if ((m = path.match(/^\/p\/(.+)$/))) viewPage(el, decodeURIComponent(m[1]));
    else el.innerHTML = '<p class="empty">Página no encontrada. <a href="#/">Ir al inicio</a></p>';
    if (home) placeSearch(true);
    baseRendered = true;
    window.scrollTo(0, 0);
    const inp = $('#q'), q = params.get('q');
    if (path === '/buscar') { if (inp.value !== (q || '')) inp.value = q || ''; } else if (path === '/') inp.value = '';
    document.title = C.brand + ' · Consulta de reglas';
  }
  function route() {
    closeMenus();
    const { path, raw } = parseHash();
    let m;
    if ((m = path.match(/^\/e\/(.+)$/))) {
      const id = decodeURIComponent(m[1]);
      const e = byId.get(id);
      if (!baseRendered) {
        const tr = e && e.cat === 'talento' ? treeOf(e) : null;
        if (tr) lastBase = '/arbol/' + tr.slug + '?hl=' + encodeURIComponent(id);
        renderBase(lastBase);
      }
      openDrawer(id); return;
    }
    const wasOpen = !$('#drawer').hidden;
    closeDrawer();
    if (wasOpen && raw === lastBase) return;
    lastBase = raw;
    renderBase(raw);
  }

  // ------------------------------------------------------------------ arranque
  function setup() {
    ALL = (window.DATA_BASE || []).concat(DJ ? (window.DATA_DJ || []) : []);
    CATS = C.catalogs.filter((c) => !c.dj || DJ);
    catById = {}; CATS.forEach((c) => (catById[c.id] = c));
    byId = new Map(ALL.map((e) => [e.id, e]));
    traitIndex = new Map();
    ALL.forEach((e) => { if (e.cat === 'rasgo') traitIndex.set(e.f.aplica + '|' + nc(e.f.nombre || e.title), e); });
    engine = new S.Engine(ALL, { synonyms: C.synonyms, aliases: C.aliases, boost: C.boost });
    computeAllow();
    buildTrees();
    buildMenu();

    if (!C.ambientaciones.some((a) => a.id === ambientacion)) ambientacion = '';
    document.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-esc]');
      if (!b) return;
      ambientacion = b.dataset.esc; store.set('cosmere_ambientacion', ambientacion); computeAllow(); buildMenu();
      const { raw } = parseHash();
      if (raw.startsWith('/e/')) { renderBase(lastBase); route(); } else route();
    });

    let timer = null;
    const q = $('#q');
    q.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const v = q.value.trim(), cur = parseHash(), sp = new URLSearchParams();
        if (!v) { if (cur.path === '/buscar') setParams('/', sp, false); return; }
        sp.set('q', v);
        if (cur.path === '/buscar') {
          setParams('/buscar', sp, true); closeDrawer();
          const el = $('#view'); placeSearch(false); viewSearch(el, sp); window.scrollTo(0, 0);
        } else setParams('/buscar', sp, false);
      }, 130);
    });
    q.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { q.value = ''; q.dispatchEvent(new Event('input')); q.blur(); } });

    document.addEventListener('keydown', (ev) => {
      const tag = (ev.target.tagName || '').toLowerCase();
      if (ev.key === '/' && !['input', 'textarea', 'select'].includes(tag)) { ev.preventDefault(); q.focus(); q.select(); }
      if (ev.key === 'Escape') { closeMenus(); if (!$('#drawer').hidden && tag !== 'input') location.hash = '#' + lastBase; }
    });
    document.addEventListener('click', (ev) => {
      if (!$('#drawer').hidden && ev.target.isConnected && !ev.target.closest('.panel, a[href^="#"], .mbtn, .mpanel')) location.hash = '#' + lastBase;
      const b = ev.target.closest('.mbtn');
      if (b) {
        const panel = b.nextElementSibling, open = panel.hidden;
        closeMenus();
        if (open) { panel.hidden = false; b.setAttribute('aria-expanded', 'true'); }
        return;
      }
      if (!ev.target.closest('.mpanel')) closeMenus();
      if (ev.target.closest('#navtoggle')) document.body.classList.toggle('nav-open');
      else if (ev.target.closest('.mpanel a, .brand')) document.body.classList.remove('nav-open');
      const cb = ev.target.closest('#copylink');
      if (cb) {
        const url = location.href;
        const done = () => { cb.innerHTML = ic('link', 'sm') + 'Enlace copiado ✓'; setTimeout(() => (cb.innerHTML = ic('link', 'sm') + 'Copiar enlace'), 1500); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => window.prompt('Copia el enlace:', url));
        else window.prompt('Copia el enlace:', url);
      }
    });
    $('#drawer').addEventListener('click', (ev) => { if (ev.target.id === 'drawer' || ev.target.closest('#dclose')) location.hash = '#' + lastBase; });
    let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { const w = $('.treewrap'); if (w) drawEdges(w); }, 120); });
    window.addEventListener('hashchange', route);
    route();
  }

  async function main() {
    DJ = initDJ();
    if (DJ) { try { await loadScript('data/dj.js'); } catch (e) { DJ = false; } }
    setup();
    const ld = $('#loading'); if (ld) ld.remove();
  }
  main();
})();

