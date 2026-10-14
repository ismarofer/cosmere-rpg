/* Cosmere RPG · Consulta de reglas — menú, portada, búsqueda global, router y arranque (hash router, sin dependencias). */
(function () {
  'use strict';
  const A = window.CosmereApp;
  const { $, $$, C, S, U, ambientacionBadge, catIcon, catLabel, computeAllow, esc, hashFor, hrefOf, ic, initAmbientacion, initDJ, loadScript, nc, pageHref, parseHash, setParams, slugOf, store, summary, visible } = A;
  // ------------------------------------------------------------------ cabecera: menú
  function menuItems(g) {
    const items = [];
    for (const p of C.pages.filter((x) => x.group === g.id)) {
      const e = A.ALL.find((x) => x.cat === p.cat);
      if (e) items.push({ href: pageHref(e), label: p.label, ic: p.ic, sub: p.desc });
    }
    for (const c of A.CATS.filter((x) => x.group === g.id).sort((x, y) => (x.ord || 99) - (y.ord || 99))) {
      items.push({ href: '#/c/' + c.id, label: c.label, ic: c.ic, count: A.ALL.filter((e) => e.cat === c.id && visible(e)).length });
    }
    return (g.lead || []).map((t) => ({ href: t.href, label: t.label, ic: t.ic, sub: t.sub })).concat(items);
  }
  function toolLink(t, pill) {
    const body = pill ? `${ic(t.ic, 'sm')}${esc(t.label)}${t.soon ? '<b>próximamente</b>' : ''}`
      : `${ic(t.ic)}<span>${esc(t.label)}${t.sub ? `<small>${esc(t.sub)}</small>` : ''}</span>${t.soon ? '<b>próximamente</b>' : ''}`;
    if (t.soon) return `<span class="${pill ? 'pill' : 'soon'} off" aria-disabled="true">${body}</span>`;
    return `<a${pill ? ' class="pill"' : ''} href="${t.href}">${body}</a>`;
  }
  function buildMenu() {
    const groups = C.menu.filter((g) => !g.dj || A.DJ);
    $('#nav').innerHTML = groups.map((g) => {
      let panel;
      if (g.trees) {
        const item = (href, label, kids, icon) => `<div class="ci${kids ? ' has' : ''}"><a href="${href}">${icon || ''}<span>${esc(label)}</span>${kids ? ic('right', 'sm') : ''}</a>${kids ? `<div class="cfly${kids.leaf ? ' leaf' : ''}">${kids.html}</div>` : ''}</div>`;
        const treeItem = (t) => { const sp = A.specsOfTree(t); return item('#/arbol/' + t.slug, A.treeNice(t), sp.length ? { html: sp.map((x) => item('#/arbol/' + t.slug + '/' + slugOf(x), x)).join('') } : null); };
        const secHtml = (s) => A.shownTrees().filter((t) => t.section === s).map(treeItem).join('') + A.childSecs(s).filter((c) => A.shownTrees().some((t) => t.section === c)).map((c) => item('#/caminos/' + c.id, c.short, { html: A.shownTrees().filter((t) => t.section === c).map(treeItem).join('') }, ic(c.ic, 'sm'))).join('');
        panel = '<div class="cmenu">' + A.topSecs().map((s) => {
          const h = secHtml(s);
          return h ? item('#/caminos/' + s.id, s.short, { html: h, leaf: !A.childSecs(s).length && !A.shownTrees().some((t) => t.section === s && A.specsOfTree(t).length) }, ic(s.ic, 'sm')) : '';
        }).join('') + '<hr>' + item('#/caminos', 'Todos los árboles', null, ic('tree', 'sm')) +
          menuItems(g).map((i) => item(i.href, i.label, null, ic(i.ic, 'sm'))).join('') + '</div>';      } else {
        panel = '<div class="drop">' + menuItems(g).map((i) => `<a href="${i.href}">${ic(i.ic)}<span>${esc(i.label)}${i.sub ? `<small>${esc(i.sub)}</small>` : ''}</span>${i.count != null ? `<b>${i.count}</b>` : ''}</a>`).join('') +
          (g.tools ? '<hr>' + g.tools.map((t) => toolLink(t)).join('') : '') + '</div>';
      }
      return `<div class="mgroup"><button type="button" class="mbtn" data-menu="${g.id}" aria-expanded="false">${ic(g.ic)}<span>${esc(g.label)}</span>${ic('down', 'sm chev')}</button><div class="mpanel" hidden>${panel}</div></div>`;
    }).join('');
  }
  function closeMenus() { $$('.mpanel').forEach((p) => (p.hidden = true)); $$('.mbtn').forEach((b) => b.setAttribute('aria-expanded', 'false')); }

  // ------------------------------------------------------------------ portada
  function viewHome(el) {
    const groups = C.menu.filter((g) => !g.dj || A.DJ).map((g) => {
      let body;
      if (g.trees) {
        body = C.treeSections.map((s) => {
          const ts = A.shownTrees().filter((t) => t.section === s);
          if (!ts.length) return '';
          const small = s.id === 'heroicos' || s.id === 'nacidos-del-metal';
          return `<div class="sub"><a class="subh" href="#/caminos/${s.id}">${ic(s.ic, 'sm')}${esc(s.short)}</a>` +
            (small ? ts.map((t) => `<a class="pill" href="#/arbol/${t.slug}">${esc(t.name)}</a>`).join('') : `<span class="muted">${ts.length} ${ts.length === 1 ? 'árbol' : 'árboles'}</span>`) + '</div>';
        }).join('') + `<div class="sub"><a class="subh" href="#/c/talento">${ic('star', 'sm')}Todos los talentos</a></div>`;
      } else {
        body = menuItems(g).map((i) => `<a class="pill" href="${i.href}">${ic(i.ic, 'sm')}${esc(i.label)}${i.count != null ? `<b>${i.count}</b>` : ''}</a>`).join('');
        if (g.tools) body += '<hr class="pillsep">' + g.tools.map((t) => toolLink(t, true)).join('');
      }
      return `<section class="mcard"><h2>${ic(g.ic)}${esc(g.label)}</h2><p class="muted">${esc(g.desc)}</p><div class="pills">${body}</div></section>`;
    }).join('');
    el.innerHTML = `
      <section class="hero">
        <h1><span class="logo big" aria-hidden="true"></span>${esc(C.brand)}</h1>
        <div id="heroslot" class="heroslot"></div>
      </section>
      <section class="menugrid">${groups}</section>`;
  }

  // ------------------------------------------------------------------ búsqueda global
  function viewSearch(el, params) {
    const q = (params.get('q') || '').trim();
    const catParam = params.get('cat') || '';
    if (!q) { viewHome(el); return 'home'; }
    const res = A.engine.search(q, { cats: A.CATS, allow: A.allow });
    const plain = res.parsed.plain;
    const libParam = params.get('lib') || '';
    const libros = [...new Set(res.hits.map((h) => h.e.libro))].filter(Boolean);
    if (libParam) res.hits = res.hits.filter((h) => h.e.libro === libParam);
    const byCat = new Map();
    for (const h of res.hits) { if (!byCat.has(h.e.cat)) byCat.set(h.e.cat, []); byCat.get(h.e.cat).push(h); }
    const order = [...byCat.keys()].sort((a, b) => byCat.get(b)[0].score - byCat.get(a)[0].score);
    if (!res.hits.length) {
      el.innerHTML = `<p class="empty">Sin resultados para «${esc(q)}»${libParam ? ` en ${esc(libParam)}` : ''}. Prueba con menos palabras u otra forma de decirlo, o explora el menú.</p>` +
        (libParam ? `<p><a class="btn" href="${hashFor('/buscar', { q })}">Quitar el filtro de fuente</a></p>` : '');
      return;
    }
    let html = '';
    if (libros.length > 1 || libParam) {   // fuente: el libro o campaña de donde viene (decisions/interfaz)
      html += '<div class="facets"><b>Fuente:</b> ' + [`<a class="chip link${!libParam ? ' on' : ''}" href="${hashFor('/buscar', { q, cat: catParam })}">${ic('book', 'sm')}Todas</a>`]
        .concat(libros.sort().map((l) => `<a class="chip link${libParam === l ? ' on' : ''}" href="${hashFor('/buscar', { q, cat: catParam, lib: l })}">${ic('book', 'sm')}${esc(l)}</a>`)).join(' ') + '</div>';
    }
    html += '<div class="facets">' + [`<a class="chip link${!catParam ? ' on' : ''}" href="${hashFor('/buscar', { q, lib: libParam })}">Todo <b>${res.hits.length}</b></a>`]
      .concat(order.map((c) => `<a class="chip link${catParam === c ? ' on' : ''}" href="${hashFor('/buscar', { q, cat: c, lib: libParam })}">${ic(catIcon(c), 'sm')}${esc(catLabel(c))} <b>${byCat.get(c).length}</b></a>`)).join(' ') + '</div>';
    if (res.partial) html += '<p class="muted">No hay entradas con todas las palabras; se muestran coincidencias parciales.</p>';
    for (const c of (catParam ? [catParam] : order)) {
      const hits = byCat.get(c) || [];
      const lim = catParam ? 120 : 5;
      html += `<section class="results"><h2>${ic(catIcon(c))}${esc(catLabel(c))} <span class="count">${hits.length}</span>` +
        (A.catById[c] ? ` <a class="more" href="${hashFor('/c/' + c, { q })}">Abrir en el catálogo →</a>` : '') + '</h2>' +
        hits.slice(0, lim).map((h) => hitHtml(h.e, plain)).join('');
      if (hits.length > lim) html += `<a class="more" href="${hashFor('/buscar', { q, cat: c, lib: libParam })}">Ver los ${hits.length} resultados →</a>`;
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

  // ------------------------------------------------------------------ router
  function placeSearch(home) {
    const q = $('#q');
    const target = home ? $('#heroslot') : $('#hdrslot');
    document.body.classList.toggle('is-home', !!home);   // antes de mover: la cabecera oculta no admite foco
    if (target && q.parentElement !== target) {
      // mover el nodo le quita el foco: se conserva para poder seguir escribiendo tras pasar de la portada a resultados
      const foco = document.activeElement === q, a = q.selectionStart, b = q.selectionEnd;
      target.appendChild(q);
      if (foco) { q.focus(); try { q.setSelectionRange(a, b); } catch (e) {} }
    }
  }
  function renderBase(raw) {
    const i = raw.indexOf('?');
    const path = i < 0 ? raw : raw.slice(0, i);
    const params = new URLSearchParams(i < 0 ? '' : raw.slice(i + 1));
    const el = $('#view');
    // Herramientas integradas: el proyector es una sección persistente (se oculta, no se destruye) y Personajes usa estilos con body.pj
    const proy = path === '/proyector';
    el.hidden = proy; $('#pyr').hidden = !proy;
    document.body.classList.toggle('pj', path === '/personajes' || path.startsWith('/personajes/'));
    if (proy) { window.Proyector.montar($('#pyr')); A.baseRendered = true; document.title = 'Proyector de la mesa · ' + C.brand; return; }
    placeSearch(false);       // el buscador vuelve a la cabecera antes de reemplazar la vista
    let m, home = false;
    if (path === '/' || path === '') { viewHome(el); home = true; }
    else if (path === '/buscar') { if (viewSearch(el, params) === 'home') home = true; }
    else if ((m = path.match(/^\/c\/([\w-]+)$/))) A.viewCatalog(el, m[1], params);
    else if (path === '/caminos') A.viewPaths(el);
    else if ((m = path.match(/^\/caminos\/([\w-]+)$/))) A.viewPaths(el, m[1]);
    else if ((m = path.match(/^\/arbol\/([\w-]+)\/([\w-]+)$/))) A.viewTree(el, m[1], params, m[2]);
    else if ((m = path.match(/^\/arbol\/([\w-]+)$/))) A.viewTree(el, m[1], params);
    else if ((m = path.match(/^\/talento\/(.+)$/))) A.viewTalent(el, decodeURIComponent(m[1]));
    else if ((m = path.match(/^\/p\/(.+)$/))) A.viewPage(el, decodeURIComponent(m[1]));
    else if (path === '/combates') window.CB.montar(el);
    else if (path === '/nombres') window.NOM.montar(el);
    else if (path === '/personajes' || path.startsWith('/personajes/')) window.PJ.montar(el, path.slice('/personajes'.length));
    else el.innerHTML = '<p class="empty">Página no encontrada. <a href="#/">Ir al inicio</a></p>';
    if (home) placeSearch(true);
    A.baseRendered = true;
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
      const e = A.byId.get(id);
      if (!A.baseRendered) {
        const tr = e && e.cat === 'talento' ? A.treeOf(e) : null;
        if (tr) A.lastBase = '/arbol/' + tr.slug + '?hl=' + encodeURIComponent(id);
        renderBase(A.lastBase);
      }
      A.openDrawer(id); return;
    }
    const wasOpen = !$('#drawer').hidden;
    A.closeDrawer();
    if (wasOpen && raw === A.lastBase) return;
    A.lastBase = raw;
    renderBase(raw);
  }

  // ------------------------------------------------------------------ arranque
  function setup() {
    // encabezado de nivel 1 para lectores de pantalla: sigue al título de la pestaña
    const h1 = $('#pagetitle'), titulo = document.querySelector('title');
    if (h1 && titulo) new MutationObserver(() => { h1.textContent = document.title; }).observe(titulo, { childList: true, characterData: true, subtree: true });
    if (h1) new MutationObserver(() => { h1.hidden = !!$('#view h1, #pyr h1'); }).observe($('#view'), { childList: true, subtree: true });
    A.ALL = (window.DATA_BASE || []).concat(A.DJ ? (window.DATA_DJ || []) : []);
    A.CATS = C.catalogs.filter((c) => !c.dj || A.DJ);
    A.catById = {}; A.CATS.forEach((c) => (A.catById[c.id] = c));
    A.byId = new Map(A.ALL.map((e) => [e.id, e]));
    A.traitIndex = new Map();
    // un rasgo por ambientación (el texto de cada manual es el suyo); la clave lleva la familia: Mistborn, Stormlight o Cosmere
    A.ALL.forEach((e) => { if (e.cat === 'rasgo') A.traitIndex.set(e.f.aplica + '|' + nc(e.f.nombre || e.title) + '|' + e.ambientacion.split(' ')[0], e); });
    A.engine = new S.Engine(A.ALL, { synonyms: C.synonyms, aliases: C.aliases, boost: C.boost });
    computeAllow();
    A.buildTrees();
    buildMenu();

    if (!C.ambientaciones.some((a) => a.id === A.ambientacion)) A.ambientacion = '';
    // selector de ambientación, en la cabecera junto a la marca: cambia lo que se ve en la página y en los menús
    const slotAmb = $('#ambpick');
    if (slotAmb) {
      const icono = () => { const a = C.ambientaciones.find((x) => x.id === A.ambientacion); return a && a.ic ? ic(a.ic, 'sm') : ''; };
      slotAmb.innerHTML = `<span class="ambic" aria-hidden="true">${icono()}</span><select id="ambsel" aria-label="Ambientación">${C.ambientaciones.map((a) =>
        `<option value="${esc(a.id)}"${a.id === A.ambientacion ? ' selected' : ''}>${esc(a.label)}</option>`).join('')}</select>`;
      $('#ambsel').addEventListener('change', (ev) => {
        A.ambientacion = ev.target.value; store.set('cosmere_ambientacion', A.ambientacion); computeAllow(); buildMenu();
        $('.ambic', slotAmb).innerHTML = icono();
        const { raw } = parseHash();
        if (raw.startsWith('/e/')) { renderBase(A.lastBase); route(); } else route();
      });
    }

    let timer = null;
    const q = $('#q');
    q.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const v = q.value.trim(), cur = parseHash(), sp = new URLSearchParams();
        if (!v) { if (cur.path === '/buscar') setParams('/', sp, false); return; }
        sp.set('q', v);
        if (cur.path === '/buscar') {
          setParams('/buscar', sp, true); A.closeDrawer();
          const el = $('#view'); placeSearch(false); viewSearch(el, sp); window.scrollTo(0, 0);
        } else setParams('/buscar', sp, false);
      }, 130);
    });
    q.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { q.value = ''; q.dispatchEvent(new Event('input')); q.blur(); } });

    document.addEventListener('keydown', (ev) => {
      const tag = (ev.target.tagName || '').toLowerCase();
      if (ev.key === '/' && !['input', 'textarea', 'select'].includes(tag)) { ev.preventDefault(); q.focus(); q.select(); }
      if (ev.key === 'Escape') { closeMenus(); if (!$('#drawer').hidden && tag !== 'input') location.hash = '#' + A.lastBase; }
    });
    document.addEventListener('click', (ev) => {
      if (!$('#drawer').hidden && ev.target.isConnected && !ev.target.closest('.panel, a[href^="#"], .mbtn, .mpanel')) location.hash = '#' + A.lastBase;
      const b = ev.target.closest('.mbtn');
      if (b) {
        const panel = b.nextElementSibling, open = panel.hidden;
        closeMenus();
        if (open) { panel.hidden = false; b.setAttribute('aria-expanded', 'true'); }
        return;
      }
      if (!ev.target.closest('.mpanel')) closeMenus();
      // cabecera compacta: pulsar en la fila de un elemento con subnivel (salvo en su texto, que navega) lo despliega
      const fila = ev.target.closest('.ci.has > a');
      if (fila && !ev.target.closest('.ci.has > a > span') && window.matchMedia('(max-width: 1240px)').matches) { ev.preventDefault(); fila.parentElement.classList.toggle('open'); return; }
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
    $('#drawer').addEventListener('click', (ev) => { if (ev.target.id === 'drawer' || ev.target.closest('#dclose')) location.hash = '#' + A.lastBase; });
    let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { const w = $('.treewrap'); if (w) A.drawEdges(w); }, 120); });
    window.addEventListener('hashchange', route);
    route();
  }

  async function main() {
    A.DJ = initDJ();
    initAmbientacion();
    if (A.DJ) { try { await loadScript('data/dj.js'); } catch (e) { A.DJ = false; } }
    setup();
    const ld = $('#loading'); if (ld) ld.remove();
  }
  main();
})();
