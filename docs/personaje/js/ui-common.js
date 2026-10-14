/* Utilidades de interfaz: constructor de DOM, enlaces al buscador y pequeños componentes. */
(function (g) {
  'use strict';
  const PJ = g.PJ;

  function h(tag, attrs, ...hijos) {
    const e = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v === null || v === undefined) continue;
      if (k === 'class') e.className = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k === 'value') e.value = v;
      else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'hidden') e[k] = !!v;
      else e.setAttribute(k, v === true ? '' : v);
    }
    const add = x => {
      if (x === null || x === undefined || x === false) return;
      if (Array.isArray(x)) x.forEach(add);
      else e.appendChild(x.nodeType ? x : document.createTextNode(String(x)));
    };
    hijos.forEach(add);
    return e;
  }

  const hrefEntrada = e => 'index.html#/' + (e.cat === 'talento' ? 'talento/' : 'p/') + e.id;
  const enlaceEntrada = (id, texto) => {
    const e = PJ.datos().byId[id];
    return e ? h('a', { href: hrefEntrada(e), target: '_blank', rel: 'noopener', class: 'enl' }, texto || e.title) : h('span', null, texto || id);
  };

  // Contador con botones - / +
  function contador(valor, { min = 0, max = 99, alCambiar, etiqueta, dis }) {
    return h('span', { class: 'cont' },
      h('button', { type: 'button', class: 'mini', disabled: dis || valor <= min, 'aria-label': 'Restar ' + (etiqueta || ''), onclick: () => alCambiar(valor - 1) }, '−'),
      h('b', { class: 'val' }, String(valor)),
      h('button', { type: 'button', class: 'mini', disabled: dis || valor >= max, 'aria-label': 'Sumar ' + (etiqueta || ''), onclick: () => alCambiar(valor + 1) }, '+'));
  }

  // Puntos para colorear: pulsar el n-º punto fija el valor en n; pulsar el último relleno lo baja uno.
  // `gratis` pinta puntos fijos delante; los puntos por encima de `max` (sin presupuesto) quedan bloqueados.
  function puntos(valor, { n, max = n, gratis = 0, alCambiar, etiqueta, dis }) {
    const dots = [];
    for (let i = 0; i < gratis; i++) dots.push(h('span', { class: 'pt gratis', title: 'Grado gratuito', 'aria-hidden': 'true' }));
    for (let i = 1; i <= Math.max(n, valor); i++) {
      const lleno = i <= valor, bloq = dis || (!lleno && i > max);
      dots.push(h('button', {
        type: 'button', class: 'pt' + (lleno ? ' on' : ''), disabled: bloq,
        'aria-label': `${etiqueta || ''}: ${i === valor ? 'quitar' : 'fijar en'} ${i === valor ? 'el último grado' : i}`,
        'aria-pressed': lleno ? 'true' : 'false',
        onclick: () => alCambiar(i === valor ? i - 1 : i),
      }));
    }
    return h('span', { class: 'puntos', role: 'group', 'aria-label': etiqueta || 'Grados' }, dots);
  }

  const barra = (usados, total, texto) => {
    const cls = usados > total ? 'mal' : usados === total ? 'bien' : '';
    return h('div', { class: 'presu ' + cls }, h('b', null, `${usados} / ${total}`), ' ', texto);
  };

  const avisosLista = (avisos, tipos) => {
    const l = avisos.filter(a => !tipos || tipos.includes(a.tipo));
    return l.length ? h('ul', { class: 'avisos' }, l.map(a => h('li', { class: a.tipo }, a.texto))) : null;
  };

  const descargar = (nombre, texto, tipo) => {
    const url = URL.createObjectURL(new Blob([texto], { type: tipo || 'application/json' }));
    const a = h('a', { href: url, download: nombre });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const slugNombre = s => PJ.norm(s || 'personaje').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'personaje';

  let tt;
  function aviso(texto) {
    let t = document.getElementById('toast');
    if (!t) { t = h('div', { id: 'toast', class: 'toast', role: 'status' }); document.body.appendChild(t); }
    t.textContent = texto; t.classList.add('on');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2800);
  }

  const nombreCamino = slug => (PJ.datos().arbol[slug] || {}).nombre || slug;

  // ---------------- Panel lateral con la descripción completa (mismo aspecto que el del buscador)
  const U = g.UI || { ic: () => '', act: () => '' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const limpioTitulo = t => String(t || '').replace(/\s*\(principal de [^)]*\)\s*/i, '').trim();
  const costeTxt = k => (k === 'r' ? 'Reacción' : k === '0' ? 'Acción gratuita' : k === '*' ? 'Especial' : k === '1*' ? '1 acción +' : k === '1' ? '1 acción' : k + ' acciones');
  const ETIQ_CAT = { talento: 'Talento', accion: 'Acción', arma: 'Arma', armadura: 'Armadura', equipo: 'Equipo', regla: 'Regla', estado: 'Estado', habilidad: 'Habilidad', origen: 'Origen', camino: 'Camino', objeto: 'Objeto', pericia: 'Pericia', arte: 'Arte' };
  // una acción que da un talento se explica en la ficha del talento
  const destino = e => (e.cat === 'accion' && e.f && e.f.talento && PJ.datos().byId[e.f.talento]) || e;

  let indice;
  const buscarEntrada = (cat, titulo) => {
    if (!indice) { indice = new Map(); for (const e of PJ.datos().base) { const k = e.cat + '|' + PJ.norm(e.title); if (!indice.has(k)) indice.set(k, e); } }
    return indice.get(cat + '|' + PJ.norm(titulo));
  };
  const enlacePanel = (e, cls, texto) => { const t = destino(e); return `<a class="${cls}" href="${esc(hrefEntrada(t))}" data-id="${esc(t.id)}">${texto}</a>`; };

  const inline = txt => esc(txt).replace(/\[\[([^\]]+)\]\]/g, (_, tok) => {
    const p = tok.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').split('|');
    const etiqueta = esc(p[2] || p[1] || '');
    const e = p[0].startsWith('#') ? null : buscarEntrada(p[0], p[1] || '');
    return e ? enlacePanel(e, 'pj-ent', etiqueta) : etiqueta;
  }).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const md = txt => {
    let html = '', lista = false;
    const cerrar = () => { if (lista) { html += '</ul>'; lista = false; } };
    for (const raw of String(txt || '').split('\n')) {
      const l = raw.trim();
      if (!l) { cerrar(); continue; }
      const t = l.match(/^#{1,6}\s+(.*)$/);
      if (t) { cerrar(); html += '<h4>' + esc(t[1]) + '</h4>'; continue; }
      if (l[0] === '◆' || l[0] === '•') { if (!lista) { html += '<ul>'; lista = true; } html += '<li>' + inline(l.slice(1).trim()) + '</li>'; continue; }
      cerrar();
      html += '<p>' + inline(l) + '</p>';
    }
    cerrar();
    return html;
  };

  const plano = t => String(t || '').replace(/\[\[(?:[^\]|]*\|)*([^\]|]*)\]\]/g, '$1').replace(/#+\s*/g, '').replace(/[◆•]/g, '· ').replace(/[*_]/g, '').replace(/\s+/g, ' ').trim();
  const recorta = (t, n) => (t.length > n ? t.slice(0, n - 1).replace(/\s\S*$/, '') + '…' : t);
  // descripción corta de una tarjeta: en talentos (y acciones que dan un talento) es la mecánica
  const descCorta = e => {
    const t = destino(e);
    if (t.cat === 'talento') return recorta(plano(t.resumen || t.mecanica || t.body), 260);
    const ps = String(e.body || '').split(/\n\s*\n/).filter(p => !/^\s*Activaci[oó]n:/i.test(p));
    return recorta(plano(ps.join(' ')), 260);
  };
  // descripción corta de armas, armaduras y objetos: datos clave y, si no hay, el inicio del texto
  const descEquipo = e => {
    const f = e.f || {};
    const unir = l => l.filter(Boolean).join(' · ');
    if (e.cat === 'arma') return unir([f.dano, f.habilidad, f.rasgos_txt, f.precio]);
    if (e.cat === 'armadura') return unir([`Desvío ${f.desvio || 0}`, f.rasgos_txt, f.peso, f.precio]);
    return (f.precio ? f.precio + '. ' : '') + descCorta(e);
  };

  let panel, cuerpoPanel;
  const cerrarPanel = () => {
    if (!panel || panel.hidden) return;
    panel.hidden = true; document.body.classList.remove('drawer-open');
  };
  function asegurarPanel() {
    if (panel) return;
    cuerpoPanel = h('aside', { class: 'panel', id: 'pjdinner', role: 'dialog', 'aria-modal': 'true' });
    panel = h('div', { id: 'pjdrawer', class: 'drawer noprint', hidden: true }, cuerpoPanel);
    document.body.appendChild(panel);
    cuerpoPanel.addEventListener('click', ev => {
      const a = ev.target.closest('a.pj-ent');
      if (a && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey) { ev.preventDefault(); abrirPanel(a.dataset.id); return; }
      if (ev.target.closest('.close')) cerrarPanel();
    });
    document.addEventListener('keydown', ev => { if (ev.key === 'Escape') cerrarPanel(); });
    document.addEventListener('click', ev => { if (!panel.hidden && ev.target.isConnected && !ev.target.closest('.panel, .clic')) cerrarPanel(); });
    window.addEventListener('hashchange', cerrarPanel);
  }
  // `id` es el id de una entrada o un objeto sintético { etiqueta, title, path, facts: [[clave, valor]], body, href }
  function abrirPanel(id) {
    const D = PJ.datos();
    const sintetica = id && typeof id === 'object';
    const e0 = sintetica ? id : D.byId[id];
    if (!e0) return;
    asegurarPanel();
    const e = sintetica ? e0 : destino(e0), f = e.f || {}, x = e.x || {};
    const hecho = (k, v) => (v ? `<dt>${esc(k)}</dt><dd>${v}</dd>` : '');
    let facts = '', resto = '';
    if (sintetica) {
      facts = (e.facts || []).map(([k, v]) => hecho(k, esc(v))).join('');
      resto = `<div class="body">${md(e.body)}</div>`;
    } else if (e.cat === 'talento') {
      facts = hecho('Camino / arte', esc(f.origen)) + hecho('Tipo', esc(f.tipo_origen)) +
        hecho('Habilidad requerida', f.habilidad ? esc(`${f.habilidad} ${f.grados || ''}`.trim()) + (f.grados ? ' o más' : '') : '') +
        hecho('Activación', f.activacion ? U.act(f.activacion) + esc(f.activacion) : '') + hecho('Prerrequisito', esc(f.prerrequisito));
      const chip = o => enlacePanel(o, 'chip link pj-ent', U.act(o.f.activacion) + esc(limpioTitulo(o.title)));
      const reqs = (x.req || []).map(i => D.byId[i]).filter(Boolean);
      const hijos = D.base.filter(o => o.cat === 'talento' && o.x && (o.x.req || []).includes(e.id));
      resto = (reqs.length ? `<section><h3>Requiere</h3><div class="chips">${reqs.map(chip).join(' ')}</div></section>` : '') +
        `<div class="body theme">${md(e.body)}</div>` +
        (e.mecanica ? `<section class="mecanica"><h3>Mecánica</h3><div class="body">${md(e.mecanica)}</div></section>` : '') +
        (hijos.length ? `<section><h3>Desbloquea</h3><div class="chips">${hijos.map(chip).join(' ')}</div></section>` : '');
    } else {
      if (e.cat === 'accion') facts = hecho('Coste', U.act(f.coste) + esc(costeTxt(f.coste))) + hecho('Tipo', esc(f.tipo)) + hecho('Origen', esc(f.contexto || f.origen));
      else if (e.cat === 'habilidad') facts = hecho('Atributo', esc(f.atributo)) + hecho('Defensa', esc(f.defensa));
      else if (e.cat === 'arma') facts = hecho('Habilidad', esc(f.habilidad)) + hecho('Tipo', esc(f.tipo)) + hecho('Daño', esc(f.dano)) +
        hecho('Alcance', esc(f.alcance_corto ? `${f.alcance_corto}/${f.alcance_largo}` : f.alcance)) + hecho('Rasgos', esc(f.rasgos_txt)) +
        hecho('Rasgos de experto', esc(f.experto)) + hecho('Peso', esc(f.peso)) + hecho('Precio', esc(f.precio));
      else if (e.cat === 'armadura') facts = hecho('Desvío', esc(f.desvio)) + hecho('Rasgos', esc(f.rasgos_txt)) +
        hecho('Rasgos de experto', esc(f.experto)) + hecho('Peso', esc(f.peso)) + hecho('Precio', esc(f.precio));
      else if (e.cat === 'equipo') facts = hecho('Peso', esc(f.peso)) + hecho('Precio', esc(f.precio));
      resto = `<div class="body">${md(e.body)}</div>`;
    }
    const lead = e.cat === 'talento' ? U.act(f.activacion) : (e.cat === 'accion' ? U.act(f.coste) : '');
    const href = sintetica ? e.href : hrefEntrada(e);
    cuerpoPanel.innerHTML = `<div class="dhead"><span class="chip">${esc(e.etiqueta || ETIQ_CAT[e.cat] || e.cat)}</span>
      ${href ? `<a class="btn small openpage" href="${esc(href)}" target="_blank" rel="noopener" title="Abrir la página completa en el buscador">${U.ic('expand', 'sm')}Abrir página</a>` : ''}
      <button type="button" class="close" aria-label="Cerrar">${U.ic('x', 'sm')}</button></div>
      <h2>${lead}${esc(limpioTitulo(e.title))}</h2>
      <p class="path">${esc((e.path || []).join(' › '))}${e.libro ? `<br><span class="src">${esc(e.libro)}</span>` : ''}</p>
      ${facts ? `<dl class="facts">${facts}</dl>` : ''}${resto}`;
    panel.hidden = false; document.body.classList.add('drawer-open'); cuerpoPanel.scrollTop = 0;
  }

  // Tarjeta clicable (talento o acción): título, chips y descripción corta; al pulsarla se abre el panel lateral
  // Atributos para que cualquier elemento abra el panel de una entrada (ratón y teclado)
  const abre = e => {
    const abrir = () => abrirPanel(e.id);
    return { role: 'button', tabindex: '0', 'aria-label': 'Ver descripción completa de ' + limpioTitulo(e.title), onclick: abrir,
      onkeydown: ev => { if (ev.target === ev.currentTarget && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); abrir(); } } };
  };
  // Los <li> no pueden tener role=button ni contener controles anidados: la fila entera abre el panel con el ratón y,
  // para teclado y lectores de pantalla, el título es un botón de verdad.
  const INTERACTIVOS = 'button, a, input, select, label, textarea';
  const clicFila = abrir => ev => { const t = ev.target.closest(INTERACTIVOS); if (t && ev.currentTarget.contains(t)) return; abrir(); };
  const tituloBoton = (abrir, titulo, etiqueta) =>
    h('button', { type: 'button', class: 'tit-btn', 'aria-label': 'Ver descripción completa de ' + etiqueta, onclick: ev => { ev.stopPropagation(); abrir(); } }, titulo);
  const tarjeta = (e, { clase = '', antes = null, despues = [] } = {}) => {
    const abrir = () => abrirPanel(e.id);
    const titulo = limpioTitulo(e.title);
    return h('li', { class: 'talento clic ' + clase, onclick: clicFila(abrir) },
      h('div', { class: 'cab' }, antes, h('strong', { class: 'tit' }, tituloBoton(abrir, titulo, titulo)), despues),
      h('p', { class: 'corta' }, descCorta(e)));
  };

  // Fila de lista unificada (todos los pasos del asistente): título, chips, descripción corta y acciones.
  // Pulsar la fila abre el panel lateral (`ref` = id de entrada, `panel` = objeto sintético); los controles internos no lo abren.
  const fila = ({ ref, panel, titulo, corta, antes = null, chips = [], accion = [], on = false, bloq = false, extra = [], clase = '' }) => {
    const destinoPanel = panel || ref;
    const attrs = { class: ['talento', destinoPanel ? 'clic' : '', on ? 'on' : '', bloq ? 'bloq' : '', clase].filter(Boolean).join(' ') };
    const abrir = () => abrirPanel(destinoPanel);
    if (destinoPanel) attrs.onclick = clicFila(abrir);
    return h('li', attrs,
      h('div', { class: 'cab' }, antes, h('strong', { class: 'tit' }, destinoPanel ? tituloBoton(abrir, titulo, titulo) : titulo), chips, h('span', { class: 'acc' }, accion)),
      corta ? h('p', { class: 'corta' }, corta) : null, extra);
  };

  const chipCoste = (raw, texto) => {
    const html = U.act(raw);
    if (!html) return h('span', { class: 'chip small coste' }, texto);
    const s = h('span', { class: 'coste-ico', role: 'img', title: texto, 'aria-label': texto });
    s.innerHTML = html;
    return s;
  };

  // ---------------- Historia del personaje (la usan el asistente y la hoja)
  // Propósito, obstáculo, metas con 3 hitos, conexiones, aspecto (texto o imagen), trasfondo y notas.
  // `silencioso(fn)` guarda sin repintar (texto); `cambiar(fn)` guarda y repinta (circulitos, altas y bajas).
  const HITOS = 3;
  const ANCHO_IMG = 420;
  function reducirImagen(fichero) {
    return new Promise((ok, mal) => {
      const lector = new FileReader();
      lector.onerror = () => mal(new Error('No se pudo leer el fichero.'));
      lector.onload = () => {
        const img = new Image();
        img.onerror = () => mal(new Error('El fichero no es una imagen válida.'));
        img.onload = () => {
          const k = Math.min(1, ANCHO_IMG / Math.max(img.width, img.height));
          const cv = document.createElement('canvas');
          cv.width = Math.max(1, Math.round(img.width * k)); cv.height = Math.max(1, Math.round(img.height * k));
          const cx = cv.getContext('2d');
          cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
          cx.drawImage(img, 0, 0, cv.width, cv.height);
          ok(cv.toDataURL('image/jpeg', 0.82));
        };
        img.src = lector.result;
      };
      lector.readAsDataURL(fichero);
    });
  }

  function historia(c, { silencioso, cambiar, pistas = true }) {
    const H = c.historia;
    const ETIQ = { proposito: 'Propósito', obstaculo: 'Obstáculo', aspectoTexto: 'Aspecto', trasfondo: 'Trasfondo', notas: 'Notas' };
    const texto = (clave, rows, ph) => h('textarea', { rows, placeholder: ph || '', 'aria-label': ETIQ[clave], oninput: e => silencioso(c => { c.historia[clave] = e.target.value; }) }, H[clave] || '');
    const bloque = (titulo, ayuda, ...cont) => h('section', { class: 'hist-bloque' },
      h('h4', null, titulo), pistas && ayuda ? h('p', { class: 'nota' }, ayuda) : null, ...cont);

    const metas = h('ul', { class: 'metas' }, H.metas.map((m, i) => h('li', { class: 'meta' + (m.hitos >= HITOS ? ' concluida' : '') },
      puntos(m.hitos, { n: HITOS, etiqueta: 'Hitos de la meta ' + (i + 1), alCambiar: v => cambiar(c => { c.historia.metas[i].hitos = v; }) }),
      h('input', { type: 'text', class: 'meta-texto', placeholder: 'La meta (qué quiere lograr el personaje)', 'aria-label': 'Meta ' + (i + 1), value: m.texto,
        oninput: e => silencioso(c => { c.historia.metas[i].texto = e.target.value; }) }),
      h('button', { type: 'button', class: 'mini noprint', title: 'Quitar la meta', 'aria-label': 'Quitar la meta ' + (i + 1), onclick: () => cambiar(c => { c.historia.metas.splice(i, 1); }) }, '×'),
      h('input', { type: 'text', class: 'meta-como', placeholder: 'Cómo avanzar (qué acciones o escenas dan un hito)', 'aria-label': 'Cómo avanzar en la meta ' + (i + 1), value: m.comoAvanzar,
        oninput: e => silencioso(c => { c.historia.metas[i].comoAvanzar = e.target.value; }) }),
      m.hitos >= HITOS ? h('span', { class: 'chip small bien-chip' }, 'Concluida: reclama su recompensa y anótala en Notas') : null)));

    const conexiones = h('ul', { class: 'conex' }, H.conexiones.map((x, i) => h('li', null,
      h('input', { type: 'text', class: 'conex-nombre', placeholder: 'Nombre (persona, grupo o lugar)', 'aria-label': 'Conexión ' + (i + 1), value: x.nombre,
        oninput: e => silencioso(c => { c.historia.conexiones[i].nombre = e.target.value; }) }),
      h('input', { type: 'text', class: 'conex-nota', placeholder: 'Qué los une', 'aria-label': 'Vínculo de la conexión ' + (i + 1), value: x.nota,
        oninput: e => silencioso(c => { c.historia.conexiones[i].nota = e.target.value; }) }),
      h('button', { type: 'button', class: 'mini noprint', title: 'Quitar la conexión', 'aria-label': 'Quitar la conexión ' + (i + 1), onclick: () => cambiar(c => { c.historia.conexiones.splice(i, 1); }) }, '×'))));

    const subirImagen = async ev => {
      const f = ev.target.files && ev.target.files[0];
      ev.target.value = '';
      if (!f) return;
      try {
        const url = await reducirImagen(f);
        const previa = H.aspectoImg;
        H.aspectoImg = url;
        if (!PJ.store.guardar(c)) { H.aspectoImg = previa; aviso('La imagen no cabe en el almacenamiento del navegador. Prueba con una más pequeña.'); return; }
        cambiar(() => {});
      } catch (e) { aviso(e.message); }
    };

    return h('div', { class: 'historia-pj' },
      h('div', { class: 'hist-par' },
        bloque('Propósito', 'Lo que da sentido al personaje a largo plazo. No cambia y no da recompensas por sí mismo.', texto('proposito', 3, 'Ej.: Proteger a quienes no pueden defenderse…')),
        bloque('Obstáculo', 'Lo que se interpone en ese propósito: un defecto, un miedo, una deuda. Tampoco cambia; el DJ lo usará para complicar escenas.', texto('obstaculo', 3, 'Ej.: Desconfía de la autoridad desde que…'))),
      bloque('Metas', `Objetivos concretos que se pueden alcanzar. Cada una tiene ${HITOS} hitos: el DJ concede uno cuando avanzas; con los ${HITOS}, ganas una recompensa. Pulsa los círculos para marcarlos.`,
        H.metas.length ? metas : h('p', { class: 'muted' }, 'Aún no hay metas. Empieza con una o dos.'),
        h('button', { type: 'button', class: 'btn small noprint', onclick: () => cambiar(c => { c.historia.metas.push({ texto: '', comoAvanzar: '', hitos: 0 }); }) }, '+ Añadir meta')),
      bloque('Conexiones', 'Personas, grupos o lugares con los que el personaje tiene un vínculo.',
        H.conexiones.length ? conexiones : h('p', { class: 'muted' }, 'Sin conexiones.'),
        h('button', { type: 'button', class: 'btn small noprint', onclick: () => cambiar(c => { c.historia.conexiones.push({ nombre: '', nota: '' }); }) }, '+ Añadir conexión')),
      bloque('Aspecto', 'Descríbelo con texto, con una imagen o con ambos.',
        h('div', { class: 'aspecto' },
          H.aspectoImg ? h('img', { class: 'aspecto-img', src: H.aspectoImg, alt: 'Aspecto de ' + (c.nombre || 'el personaje') }) : null,
          h('div', { class: 'aspecto-lado' },
            texto('aspectoTexto', 4, 'Rasgos, ropa, gestos, porte…'),
            h('div', { class: 'acciones noprint' },
              h('label', { class: 'btn small' }, H.aspectoImg ? 'Cambiar imagen' : 'Subir imagen',
                h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: subirImagen })),
              H.aspectoImg ? h('button', { type: 'button', class: 'btn small', onclick: () => cambiar(c => { c.historia.aspectoImg = ''; }) }, 'Quitar imagen') : null)))),
      bloque('Trasfondo', 'De dónde viene el personaje y qué le ha pasado.', texto('trasfondo', 6)),
      bloque('Notas', 'Apunta aquí lo que ocurre en la partida, p. ej. el suceso que te dio cada hito.', texto('notas', 6)));
  }

  PJ.ui = { h, hrefEntrada, enlaceEntrada, contador, puntos, barra, avisosLista, descargar, slugNombre, aviso, nombreCamino, abrirPanel, cerrarPanel, abre, tarjeta, fila, descCorta, descEquipo, plano, recorta, costeTxt, limpioTitulo, chipCoste, historia };
})(window);
