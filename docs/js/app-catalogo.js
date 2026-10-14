/* Cosmere RPG · catálogos: tabla filtrable, orden, columnas y estado en la URL. */
(function () {
  'use strict';
  const A = window.CosmereApp;
  const { $, $$, C, S, U, esc, getVal, hrefOf, ic, nc, setParams, sortVal, store, valueHtml, valuesOf, vicon, visible } = A;
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
    const cat = A.catById[catId];
    if (!cat) { el.innerHTML = '<p class="empty">Categoría no encontrada.</p>'; return; }
    const host = el; el = document.createElement('div'); host.innerHTML = ''; host.appendChild(el);
    const rowsAll = A.ALL.filter((e) => e.cat === cat.id && visible(e));
    // la ambientación no es un filtro de la lista: es la de la cabecera, que ya ha recortado `rowsAll` (decisions/interfaz)
    const fcols = cat.cols.filter((c) => c.f && c.k !== 'ambientacion');
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

    const head = (c) => `<h4 role="heading" aria-level="2">${c.ic ? ic(c.ic, 'sm') : ''}${esc(c.fl || c.l)}</h4>`;
    const panel = fcols.map((c) => {
      const eff = c._eff || c.f;
      if ((eff === 'chips' || eff === 'select') && !facets[c.k].length) return '';
      if (eff === 'chips') {
        return `<div class="fgroup">${head(c)}<div class="chips">` + facets[c.k].map(([v, n]) =>
          `<button type="button" class="chip tog" data-k="${c.k}" data-v="${esc(v)}">${vicon(cat.id, c.k, v)}${C.actCols.includes(c.k) ? U.act(v) : ''}${esc(v)} <b>${n}</b></button>`).join('') + '</div></div>';
      }
      if (eff === 'select') {
        return `<div class="fgroup">${head(c)}<select data-k="${c.k}" aria-label="${esc(c.fl || c.l)}"><option value="">Todos</option>` + facets[c.k].map(([v, n]) => `<option value="${esc(v)}">${esc(v)} (${n})</option>`).join('') + '</select></div>';
      }
      if (eff === 'range') {
        return `<div class="fgroup">${head(c)}<div class="range"><input type="number" step="any" placeholder="mín" aria-label="${esc(c.fl || c.l)}, mínimo" data-k="${c.k}" data-b="0"><span>–</span><input type="number" step="any" placeholder="máx" aria-label="${esc(c.fl || c.l)}, máximo" data-k="${c.k}" data-b="1"></div></div>`;
      }
      return `<div class="fgroup">${head(c)}<input type="text" placeholder="contiene…" aria-label="${esc(c.fl || c.l)} contiene" data-k="${c.k}" class="ftext"></div>`;
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
        const r = A.engine.search(st.q, { cats: A.CATS, catIds: [cat.id], allow: A.allow });
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

  Object.assign(A, { viewCatalog });
})();
