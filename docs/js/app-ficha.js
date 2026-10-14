/* Cosmere RPG · texto del libro (enlaces, tablas, markdown) y fichas de entrada (panel lateral y página). */
(function () {
  'use strict';
  const A = window.CosmereApp;
  const { $, C, U, ambientacionBadge, bookOf, catIcon, catLabel, efectosHtml, esc, findEntry, getVal, hashFor, hrefOf, ic, nc, pageHref, valueHtml, vicon } = A;
  // ------------------------------------------------------------------ texto del libro (con enlaces [[cat|Título]])
  function linkToken(tok) {
    const parts = tok.split('|');
    if (parts[0].startsWith('#')) return `<a href="${esc(parts[0])}">${esc(parts[1] || parts[0])}</a>`;
    const e = findEntry(parts[0], parts[1] || '');
    const label = parts[2] || parts[1] || '';
    return e ? `<a href="${esc(hrefOf(e))}">${esc(label)}</a>` : esc(label);
  }
  function inline(text) {
    return esc(text).replace(/\[\[([^\]]+)\]\]/g, (_, t) => linkToken(t.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')))
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
  // Tabla de texto del libro en formato «| a | b |» (la segunda fila, |---|---|, separa la cabecera)
  function tableHtml(rows) {
    const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => inline(c.trim()));
    const head = cells(rows[0]);
    const body = rows.slice(/^\s*\|?\s*:?-{2,}/.test(rows[1] || '') ? 2 : 1).map(cells);
    return '<div class="rtable"><table><thead><tr>' + head.map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>' +
      body.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>';
  }
  function md(text) {
    let html = '', list = false, tbl = [];
    const closeList = () => { if (list) { html += '</ul>'; list = false; } };
    const closeTbl = () => { if (tbl.length) { html += tableHtml(tbl); tbl = []; } };
    for (const raw of text.split('\n')) {
      const l = raw.trim();
      if (l[0] === '|') { closeList(); tbl.push(l); continue; }
      closeTbl();
      if (!l) { closeList(); continue; }
      const h = l.match(/^#{1,6}\s+(.*)$/);
      if (h) { closeList(); html += '<h4>' + esc(h[1]) + '</h4>'; continue; }
      if (l[0] === '◆' || l[0] === '•') { if (!list) { html += '<ul>'; list = true; } html += '<li>' + inline(l.slice(1).trim()) + '</li>'; continue; }
      closeList();
      html += '<p>' + inline(l) + '</p>';
    }
    closeList(); closeTbl();
    return html;
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
      const k = aplica + '|' + nc(base) + '|';
      const fam = e.ambientacion.split(' ')[0];
      const tgt = p.includes(':') ? null : (A.traitIndex.get(k + fam) || A.traitIndex.get(k + 'Cosmere') || A.traitIndex.get(k + 'Mistborn'));
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
    const cat = A.catById[e.cat];
    const facts = [];
    if (cat && e.cat !== 'adversario') {
      for (const c of cat.cols) {
        if (['title', 'ext', 'sec', 'cap', 'libro', 'ambientacion'].includes(c.k)) continue;
        const v = getVal(e, c.k);
        if (v == null || v === '' || v === '—' || (Array.isArray(v) && !v.length)) continue;
        let val;
        if ((e.cat === 'arma' || e.cat === 'armadura') && c.k === 'rasgos') val = traitChips(e, e.f.rasgos_txt);
        else if ((e.cat === 'arma' || e.cat === 'armadura') && c.k === 'experto') val = traitChips(e, e.f.experto);
        else val = valueHtml(cat, c, e);
        facts.push(`<dt>${esc(c.l)}</dt><dd>${val}</dd>`);
      }
    }
    const tb = e.cat === 'talento' ? A.talentBlock(e) : null;
    const body = e.cat === 'adversario' ? advBlock(e) : (e.gen ? '' : `<div class="body">${md(e.body)}</div>`);
    let more = '';
    if (tb && tb.t) more += `<a class="btn" href="${hashFor('/arbol/' + tb.t.slug, { hl: e.id })}">${ic('tree', 'sm')}Ver en el árbol</a> `;
    if (cat) more += `<a class="btn" href="#/c/${cat.id}">${ic(cat.ic, 'sm')}Ver en «${esc(cat.label)}»</a> `;
    more += `<a class="btn" href="${hashFor('/buscar', { q: e.title })}">${ic('search', 'sm')}Buscar «${esc(e.title)}»</a> `;
    more += `<button type="button" class="btn" id="copylink">${ic('link', 'sm')}Copiar enlace</button>`;
    const lead = e.cat === 'talento' ? U.act(e.f.activacion) : '';
    return `${page ? '' : `<div class="dhead"><span class="chip">${ic(catIcon(e.cat), 'sm')}${esc(catLabel(e.cat))}</span>${ambientacionBadge(e)}<a class="btn small openpage" href="${esc(pageHref(e))}" title="Abrir la página completa">${ic('expand', 'sm')}Abrir página</a><button type="button" class="close" id="dclose" aria-label="Cerrar">${ic('x', 'sm')}</button></div>`}
      <h2>${page ? ic(catIcon(e.cat), 'lg') : lead}${page ? esc(e.title) : `<a class="tlink" href="${esc(pageHref(e))}" title="Abrir la página completa">${esc(e.title)}</a>`}</h2>
      <p class="path">${esc(e.path.join(' › '))}<br><span class="src">${esc('Cosmere RPG · ' + e.ambientacion.replace(/ Era/, ' · Era'))} — ${esc(bookOf(e))}</span></p>
      ${tb ? tb.html : (facts.length ? `<dl class="facts">${facts.join('')}</dl>` : '') + ((e.x && e.x.efectos) ? efectosHtml(e.x.efectos) : '') + body}
      <div class="actions">${more}</div>`;
  }
  function viewPage(el, id) {
    const e = A.byId.get(id);
    if (!e) { el.innerHTML = '<p class="empty">Página no encontrada.</p>'; return; }
    el.innerHTML = `<article class="tpage">${entryHtml(e, true)}</article>`;
  }

  function openDrawer(id) {
    const d = $('#drawer'), inner = $('#dinner');
    const e = A.byId.get(id);
    if (!e) inner.innerHTML = `<div class="dhead"><button type="button" class="close" id="dclose" aria-label="Cerrar">${ic('x', 'sm')}</button></div><p class="empty">Entrada no encontrada.</p>`;
    else { inner.innerHTML = entryHtml(e, false); document.title = e.title + ' · ' + C.brand; }
    d.hidden = false; document.body.classList.add('drawer-open'); inner.scrollTop = 0;
  }
  function closeDrawer() {
    const d = $('#drawer');
    if (!d.hidden) { d.hidden = true; document.body.classList.remove('drawer-open'); document.title = C.brand + ' · Consulta de reglas'; }
  }

  Object.assign(A, { closeDrawer, md, openDrawer, viewPage });
})();
