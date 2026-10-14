/* Cosmere RPG · caminos y árboles de talentos: construcción, trazado, vistas de camino, árbol y talento. */
(function () {
  'use strict';
  const A = window.CosmereApp;
  const { $, $$, C, S, U, ambientacionBadge, arbolBySlug, bookOf, efValor, efectoLi, efectosHtml, esc, hashFor, hrefOf, ic, nc, objLabel, slugOf, store, summary, visible } = A;
  // ------------------------------------------------------------------ árboles de talentos (datos)
  function buildTrees() {
    const byOrigin = new Map();
    for (const e of A.ALL) if (e.cat === 'talento') {
      if (!byOrigin.has(e.f.origen)) byOrigin.set(e.f.origen, []);
      byOrigin.get(e.f.origen).push(e);
    }
    A.TREES = [];
    A.treeBySlug = new Map();
    for (const [name, tals] of byOrigin) {
      const f0 = tals[0].f;
      const sec = C.treeSections.find((s) => Object.keys(s.match).every((k) => f0[k] === s.match[k]));
      if (!sec) continue;
      const t = { slug: slugOf(name), name, section: sec, talents: tals };
      A.TREES.push(t);
      A.treeBySlug.set(t.slug, t);
    }
    for (const e of A.ALL) {
      const m = (e.cat === 'arte' || e.cat === 'accion') && e.path[1] && e.path[1].match(/^(Alomancia|Feruquimia) de /);
      if (!m || A.treeBySlug.has(slugOf(e.path[1]))) continue;
      const sec = C.treeSections.find((s) => s.id === m[1].toLowerCase());
      if (!sec) continue;
      const t = { slug: slugOf(e.path[1]), name: e.path[1], section: sec, talents: [] };
      const at = A.TREES.findIndex((x) => x.section === sec && x.name.localeCompare(t.name, 'es') > 0);
      if (at < 0) A.TREES.push(t); else A.TREES.splice(at, 0, t);
      A.treeBySlug.set(t.slug, t);
    }
  }
  // Árboles que se muestran con la ambientación elegida: los que tienen algún talento (o, sin talentos, alguna entrada de su arte) visible.
  const treeShown = (t) => !A.ambientacion || (t.talents.length ? t.talents.some(visible) : A.ALL.some((e) => e.path[1] === t.name && visible(e)));
  const shownTrees = () => A.TREES.filter(treeShown);
  const treeOf = (e) => A.treeBySlug.get(slugOf(e.f.origen));
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
        const ts = shownTrees().filter((t) => t.section === s);
        if (!ts.length) return '';
        const humanas = A.ALL.filter((e) => e.cat === 'origen' && e.path[1] === 'Ascendencia' && /^Ascendencia humana/.test(e.title) && visible(e));
        const extra = s.id === 'ascendencia'
          ? `${humanas.length ? `<div class="grid">${humanas.map((h) => `<a class="card tcard" href="#/e/${h.id}">${ic('globe')}<strong>${esc(h.title)}</strong><span>Sin árbol propio: elige un talento de un camino heroico en los niveles 1, 6, 11, 16 y 21</span></a>`).join('')}</div>` : ''}<h3>${ic('book', 'sm')}Texto de las ascendencias</h3><div class="pills">${A.ALL.filter((e) => e.cat === 'origen' && e.path[1] === 'Ascendencia' && /^Ascendencia/.test(e.title) && visible(e) && ts.some((t) => t.talents.some((x) => x.ambientacion.split(' ')[0] === e.ambientacion.split(' ')[0]))).map((e) => `<a class="pill" href="${esc(hrefOf(e))}">${esc(e.title)}</a>`).join('')}</div>` : '';
        const spec = (t) => specsOfTree(t).length ? `<div class="pills specs">${specsOfTree(t).map((x) => `<a class="pill" href="#/arbol/${t.slug}/${slugOf(x)}">${esc(x)}</a>`).join('')}</div>` : '';
        const showHead = !(secId && s.id === secId);
        return `<section class="group"><h2>${showHead ? `<a href="#/caminos/${s.id}">` : ''}${ic(s.ic)}${esc(s.label)}${showHead ? '</a>' : ''}</h2><div class="grid">${ts.map((t) => treeCard(t)).join('')}</div>${s.id === 'heroicos' ? ts.map((t) => spec(t) ? `<h4 role="heading" aria-level="3"><a href="#/arbol/${t.slug}">${esc(t.name)}</a></h4>${spec(t)}` : '').join('') : ''}${extra}</section>`;
      }).join('');
  }

  // Talentos con variante de Mistborn y de Stormlight (mismo camino y nombre, distinto padre o condición): con el filtro «Cosmere»
  // se ven los dos, así que llevan una insignia con su ambientación.
  let variantes = null;
  function variantKey(e) { return e.f.origen + '|' + e.title.replace(/\s*\(.*?\)\s*$/, '').toLowerCase(); }
  function esVariante(e) {
    if (e.cat !== 'talento' || e.ambientacion === 'Cosmere') return false;
    if (!variantes) {
      const fam = new Map();
      A.ALL.forEach((x) => { if (x.cat === 'talento' && x.ambientacion !== 'Cosmere') { const k = variantKey(x), a = x.ambientacion.split(' ')[0]; (fam.get(k) || fam.set(k, new Set()).get(k)).add(a); } });
      variantes = new Set([...fam].filter(([, v]) => v.size > 1).map(([k]) => k));
    }
    return variantes.has(variantKey(e));
  }

  function nodeHtml(n, hl) {
    if (n.virtual) return `<div class="node root" data-id="__root"><span class="nt">${ic('flame', 'sm')}${esc(n.title)}</span></div>`;
    const e = n.e, f = e.f;
    const req = f.habilidad && f.grados ? `<span class="req">${esc(f.habilidad)} ${f.grados}</span>` : '';
    const xr = (e.x.xreq || []).map((id) => A.byId.get(id)).filter(Boolean).map((t) => t.title);
    const mech = (e.resumen || e.mecanica) ? (e.resumen || e.mecanica).replace(/\s+/g, ' ').replace(/#+\s*/g, '').replace(/\[\[(?:[^\]|]*\|)*([^\]|]*)\]\]/g, '$1').replace(/[*_]/g, '').trim() : '';
    return `<a class="node b${n.branch}${e.x.main ? ' main' : ''}${hl === e.id ? ' hl' : ''}" data-id="${esc(e.id)}" href="#/e/${esc(e.id)}"${f.especialidad ? ` title="${esc((f.especialidades && f.especialidades.length ? f.especialidades : [f.especialidad]).join(' · '))}"` : ''}>` +
      `<span class="nt">${U.act(f.activacion)}${esc(n.title)}${!A.ambientacion && esVariante(e) ? `<span class="vbadge">${esc(e.ambientacion.split(' ')[0])}</span>` : ''}</span>` +
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
    const tree = A.treeBySlug.get(slug);
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
    const texts = kw ? A.ALL.filter((e) => e.cat === 'origen' && e.path[1] === 'Ascendencia' && nc(e.title).includes(kw) && visible(e))
      : A.ALL.filter((e) => (((e.cat === 'camino' || e.cat === 'arte' || e.cat === 'origen') && e.path[1] === tree.name) || (e.cat === 'regla' && e.f.arbol === tree.name)) && visible(e));
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
    const actions = A.ALL.filter((a) => a.cat === 'accion' && /^Activaci[oó]n:/.test(a.body) && visible(a) &&
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
    // Orden Radiante ↔ sus dos potencias (datos: DATA_ARBOLES[].potencias / .ordenes, de la tabla «Órdenes Radiantes»)
    const enlaceArbol = (s) => { const t = A.treeBySlug.get(s); return t && treeShown(t) ? `<a class="pill" href="#/arbol/${esc(s)}">${esc(t.name)}</a>` : ''; };
    const ordenPotencias = (() => {
      const a = arbolBySlug.get(tree.slug);
      if (!a || !(a.potencias || a.ordenes)) return '';
      if (a.potencias) {
        return `<section class="group"><h2>${ic('flame')}Potencias de la orden</h2><div class="pills">${a.potencias.map(enlaceArbol).join('')}</div>` +
          `<p class="muted">Spren: ${esc(a.spren)}. «${esc(a.filosofia)}»</p></section>`;
      }
      const os = a.ordenes.map(enlaceArbol).join('');
      return os ? `<section class="group"><h2>${ic('sun')}Órdenes que la controlan</h2><div class="pills">${os}</div></section>` : '';
    })();
    const crumbSec = tree.section.parent ? C.treeSections.find((s) => s.id === tree.section.parent) : null;
    el.innerHTML = `
      <p class="crumbs"><a href="#/caminos">Caminos</a> › ${crumbSec ? `<a href="#/caminos/${crumbSec.id}">${esc(crumbSec.short)}</a> › ` : ''}<a href="#/caminos/${tree.section.id}">${esc(tree.section.short)}</a>${locked ? ` › <a href="#/arbol/${tree.slug}">${esc(tree.name)}</a>` : ''}</p>
      <header class="chead"><h1>${ic(tree.section.ic, 'lg')}${locked ? `${esc(tree.name)}: ${esc(locked)}` : esc(tree.name)}</h1>
        <p class="muted">${(() => { const n = lay.nodes.filter((x) => !x.virtual).length; return tree.talents.length ? `${n} ${n === 1 ? 'talento' : 'talentos'}` : 'Sin árbol de talentos'; })()} · ${esc(tree.section.label)}</p></header>
      ${locked ? '' : ordenPotencias}
      ${locked ? '' : efPanel}
      ${acts.length ? `<section class="actions"><h2>${ic('flame')}Acciones ${locked ? 'de la especialidad' : 'del poder'}</h2><div class="actgrid">${acts.map(actCard).join('')}</div></section>` : ''}
      ${tree.talents.length ? `<h2>${ic('tree')}Árbol de talentos</h2>
      <div class="toolbar">
        <div class="seg"><button type="button" data-v="tree" class="${mode === 'tree' ? 'on' : ''}">${ic('tree', 'sm')}Árbol</button><button type="button" data-v="list" class="${mode === 'list' ? 'on' : ''}">${ic('list', 'sm')}Lista</button></div>
        <span class="legend">${U.act('1 acción')} 1 · ${U.act('2 acciones')} 2 · ${U.act('3 acciones')} 3 · ${U.act('Acción gratuita')} gratuita · ${U.act('Reacción')} reacción · ${U.act('Siempre activo')} siempre activo · ${U.act('Especial')} especial</span>
      </div>
      <p class="speclegend" id="speclegend"${lay.specs.length ? '' : ' hidden'}>${legendHtml()}</p>` : ''}
      <div id="treebox"></div>
      ${texts.length && !locked ? `<section class="group"><h2>${ic('book')}${tree.section.id === 'ascendencia' ? 'Contenido de la ascendencia' : 'Contenido del camino'} <span class="count">${texts.length}</span></h2>${texts.map((e, i) => `<details class="doc"${i === 0 ? ' open' : ''}><summary>${esc(e.title)}</summary><div class="body">${A.md(e.body)}${(e.x && e.x.efectos) ? efectosHtml(e.x.efectos) : ''}</div></details>`).join('')}</section>` : ''}`;

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
    const reqs = x.req.map((i) => A.byId.get(i)).filter(Boolean);
    const xreqs = x.xreq.map((i) => A.byId.get(i)).filter(Boolean);
    const kids = A.ALL.filter((o) => o.cat === 'talento' && o.x && o.x.req.includes(e.id));
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
      <div class="body theme">${A.md(e.body)}</div>
      ${e.mecanica ? `<section class="mecanica"><h3>${ic('info', 'sm')}Mecánica</h3><div class="body">${A.md(e.mecanica)}</div></section>` : ''}
      ${kids.length ? `<section><h3>${ic('tree', 'sm')}Desbloquea</h3><div class="chips">${kids.map(talentChip).join(' ')}</div></section>` : ''}`;
    return { t, html };
  }
  function viewTalent(el, id) {
    const e = A.byId.get(id);
    if (!e || e.cat !== 'talento') { el.innerHTML = '<p class="empty">Talento no encontrado. <a href="#/caminos">Ver caminos</a></p>'; return; }
    const f = e.f, b = talentBlock(e), t = b.t;
    el.innerHTML = `
      <p class="crumbs"><a href="#/caminos">Caminos</a>${t ? ` › <a href="#/caminos/${t.section.id}">${esc(t.section.short)}</a> › <a href="#/arbol/${t.slug}">${esc(t.name)}</a>` : ''}</p>
      <article class="tpage">
        <header><h1>${U.act(f.activacion)}${esc(e.title)}</h1>
          <p class="path">${esc(e.path.join(' › '))} · ${esc(bookOf(e))} ${ambientacionBadge(e)}</p></header>
        ${b.html}
        <div class="actions">${t ? `<a class="btn" href="${hashFor('/arbol/' + t.slug, { hl: e.id })}">${ic('tree', 'sm')}Ver en el árbol</a>` : ''}<button type="button" class="btn" id="copylink">${ic('link', 'sm')}Copiar enlace</button></div>
      </article>`;
    // la página de talento abre con h1: los apartados cuelgan de él (sin saltar niveles)
    $$('.tpage h3', el).forEach((x) => x.setAttribute('aria-level', '2'));
    $$('.tpage h5', el).forEach((x) => x.setAttribute('aria-level', '3'));
  }

  Object.assign(A, { buildTrees, childSecs, drawEdges, shownTrees, specsOfTree, talentBlock, topSecs, treeNice, treeOf, viewPaths, viewTalent, viewTree });
})();
