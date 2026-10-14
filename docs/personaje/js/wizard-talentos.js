/* Asistente · pasos Talentos y Pericias. */
(function (g) {
  'use strict';
  const PJ = g.PJ;
  const { h, contador, puntos, barra, avisosLista, fila, descCorta, descEquipo, limpioTitulo, hrefEntrada, chipCoste } = PJ.ui;
  const D = () => PJ.datos();
  const W = PJ.wiz = PJ.wiz || {};
  let arbolSel = null, filtroTalento = '';
  function opcionesArboles(c, d) {
    const Dt = PJ.datos(), A = Dt.arbol, asc = PJ.ascDe(c);
    const out = [];
    const add = (slug, grupo) => { if (A[slug] && !out.some(o => o.slug === slug)) out.push({ slug, grupo, nombre: A[slug].nombre }); };
    if (c.camino) add(c.camino, 'Tu camino inicial');
    if (asc.arbol) add(asc.arbol, 'Ascendencia');
    if (d.radiante) {
      add(d.radiante.orden, 'Tu camino radiante');
      d.radiante.potencias.forEach(p => add(p, 'Tus potencias'));
    }
    PJ.CAMINOS_HEROICOS.forEach(s => add(s, 'Caminos heroicos'));
    if (PJ.ambito(c) === 'Stormlight') {
      Dt.ordenes.forEach(a => add(a.slug, 'Caminos radiantes'));
      add('iluminado', 'Caminos radiantes');
    } else if (c.ascendencia !== 'kandra') {
      PJ.CAMINOS_METAL.forEach(s => add(s, 'Caminos de nacido del metal'));
      add('metales-de-scadrial', 'Artes metálicas');
      for (const p of c.poderes || []) add(`${p.arte}-de-${p.metal}`, 'Poderes que posees');
    }
    return out;
  }

  function pasoTalentos({ c, d, cambiar }) {
    const t = d.presupuesto.talentos;
    const opts = opcionesArboles(c, d);
    if (!opts.some(o => o.slug === arbolSel)) arbolSel = (opts[0] || {}).slug;
    const A = PJ.datos();
    const todos = arbolSel ? PJ.talentosElegibles(c, d, arbolSel).filter(x => !x.poseido) : [];
    const lleno = t.usados >= t.total;
    const filaTalento = x => {
      const pend = x.ev.clausulas.filter(k => k.estado === 'manual');
      const faltan = x.ev.clausulas.filter(k => k.estado === 'falta');
      const reservado = !lleno && !PJ.puedeElegirTalento(c, d, x.id);
      const puede = (x.ev.cumple || c.ignorarPrerreq) && !lleno && !reservado;
      const e = A.byId[x.id];
      return fila({
        ref: x.id, titulo: x.titulo, corta: e ? descCorta(e) : '', bloq: !x.ev.cumple,
        antes: x.activacion ? chipCoste(x.activacion, x.activacion) : null,
        chips: [
          x.principal ? h('span', { class: 'chip small' }, 'principal') : null,
          x.especialidad ? h('span', { class: 'chip small' }, x.especialidad) : null],
        accion: h('button', { type: 'button', class: 'btn small', disabled: !puede, onclick: () => cambiar(c => { c.talentos.push(x.id); }) }, 'Añadir'),
        extra: [
          reservado ? h('div', { class: 'req mal' }, 'Reservado: tu ascendencia exige ' + t.huecos.filter(k => !k.cubierto).map(k => k.texto).join(' y ') + '.') : null,
          faltan.length ? h('div', { class: 'req mal' }, 'Falta: ' + faltan.map(k => k.texto).join('; ')) : null,
          pend.length ? h('label', { class: 'req' }, h('input', { type: 'checkbox', checked: !!c.confirmados[x.id], onchange: e => cambiar(c => { c.confirmados[x.id] = e.target.checked; }) }),
            ' Confirmo que cumplo: ' + pend.map(k => k.texto).join('; ')) : null],
      });
    };
    const zona = h('div');
    const pintar = () => {
      const f = PJ.norm(filtroTalento);
      const visibles = c.ignorarPrerreq ? todos : todos.filter(x => !x.ev.clausulas.some(k => k.estado === 'falta'));
      const ocultos = todos.length - visibles.length;
      const lista = visibles.filter(x => PJ.norm(x.titulo).includes(f));
      zona.innerHTML = '';
      zona.appendChild(lista.length ? h('ul', { class: 'lista talentos' }, lista.map(filaTalento)) : h('p', { class: 'muted' }, 'No hay talentos elegibles en este árbol.'));
      if (ocultos) zona.appendChild(h('p', { class: 'nota' }, `${ocultos} talento${ocultos === 1 ? '' : 's'} más no cumple${ocultos === 1 ? '' : 'n'} los prerrequisitos y está${ocultos === 1 ? '' : 'n'} oculto${ocultos === 1 ? '' : 's'}. Marca «Ignorar prerrequisitos» para verlos.`));
    };
    pintar();
    const propios = d.talentos.todos.map(id => {
      const e = A.byId[id]; const auto = d.talentos.auto.includes(id);
      return fila({
        ref: e ? id : null, titulo: e ? limpioTitulo(e.title) : id, corta: e ? descCorta(e) : '',
        antes: e && e.f && e.f.activacion ? chipCoste(e.f.activacion, e.f.activacion) : null,
        accion: auto ? h('span', { class: 'chip small soft' }, 'automático') : h('button', { type: 'button', class: 'btn small', onclick: () => cambiar(c => { c.talentos = c.talentos.filter(x => x !== id); }) }, 'Quitar'),
      });
    });
    return h('div', { class: 'paso' },
      barra(t.usados, t.total, `talentos elegidos (${t.libres} libres${t.extra ? ` + ${t.extra} de ascendencia` : ''})`),
      h('h3', null, 'Tus talentos'), h('ul', { class: 'lista talentos' }, propios),
      h('h3', null, 'Elegir talentos'),
      h('div', { class: 'form fila' },
        h('label', null, 'Árbol',
          h('select', { onchange: e => { arbolSel = e.target.value; cambiar(() => {}); } },
            [...new Set(opts.map(o => o.grupo))].map(gr => h('optgroup', { label: gr }, opts.filter(o => o.grupo === gr).map(o => h('option', { value: o.slug, selected: o.slug === arbolSel }, o.nombre)))))),
        h('label', null, 'Filtrar', h('input', { type: 'search', value: filtroTalento, oninput: e => { filtroTalento = e.target.value; pintar(); } })),
        h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!c.ignorarPrerreq, onchange: e => cambiar(c => { c.ignorarPrerreq = e.target.checked; }) }), ' Ignorar prerrequisitos (decisión de la DJ)')),
      zona,
      t.huecos.length ? h('ul', { class: 'muted sin-vinetas' }, t.huecos.map(k => h('li', null, (k.cubierto ? '✓ ' : '○ ') + 'Por tu ascendencia: ' + k.texto + '.'))) : null,
      PJ.ambito(c) === 'Stormlight' ? h('p', { class: 'muted' }, 'Los caminos radiantes se abren en el nivel 2: el talento de Primer Ideal da Investidura y la meta de pronunciarlo; las potencias llegan al lograr esa meta (paso «Radiante»).') : null);
  }

  function pasoPericias({ c, d, cambiar }) {
    const p = d.presupuesto.pericias;
    let texto = '';
    const culturas = PJ.datos().culturasDe(c);
    const lleno = p.usadas >= p.total;
    const anadirOtra = () => { if (texto.trim() && !lleno) cambiar(c => { c.pericias.push({ texto: texto.trim(), cultural: false }); }); };
    const otra = h('li', { class: 'talento' },
      h('div', { class: 'cab' },
        h('strong', { class: 'tit' }, 'Otra pericia'),
        h('input', { type: 'text', class: 'otra', placeholder: 'Ej.: Armero, Historia de Luthadel…', 'aria-label': 'Nombre de la pericia', oninput: e => { texto = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') anadirOtra(); } }),
        h('button', { type: 'button', class: 'btn small', disabled: lleno, onclick: anadirOtra }, 'Añadir')));
    const filaCultura = x => {
      const texto = 'Cultura: ' + x.nombre;
      const tiene = c.pericias.some(q => q.texto === texto);
      const e = PJ.datos().byId[x.id];
      return fila({
        ref: e ? x.id : null, titulo: x.nombre, corta: e ? descCorta(e) : '', on: tiene,
        chips: h('span', { class: 'chip small soft' }, 'cultural'),
        accion: tiene ? h('span', { class: 'chip small' }, 'elegida')
          : h('button', { type: 'button', class: 'btn small', disabled: lleno, onclick: () => cambiar(c => { c.pericias.push({ texto, cultural: true }); }) }, 'Añadir'),
      });
    };
    // pericias del manual (Orígenes): en arma, en armadura y de utilidad; las especializadas no se eligen con puntos de Intelecto
    const filaManual = e => {
      const tiene = c.pericias.some(q => q.texto === e.f.pericia);
      const rasgo = (e.body.match(/Rasgo de experto: (.*)/) || [])[1];
      return fila({
        ref: e.id, titulo: e.f.pericia, corta: rasgo ? 'Rasgo de experto: ' + rasgo : '', on: tiene,
        accion: tiene ? h('span', { class: 'chip small' }, 'elegida')
          : h('button', { type: 'button', class: 'btn small', disabled: lleno, onclick: () => cambiar(c => { c.pericias.push({ texto: e.f.pericia, cultural: false }); }) }, 'Añadir'),
      });
    };
    const delManual = tipo => PJ.datos().base.filter(e => e.cat === 'pericia' && e.f.tipo === tipo && PJ.ambCubre(c, e));
    const grupoManual = tipo => {
      const es = delManual(tipo);
      return es.length ? h('details', { class: 'grupo-pericias' }, h('summary', null, tipo + ' (' + es.length + ')'),
        h('ul', { class: 'lista talentos' }, es.map(filaManual))) : null;
    };
    const propias = c.pericias.map((x, i) => {
      const cu = x.cultural && culturas.find(k => 'Cultura: ' + k.nombre === x.texto);
      const e = cu && PJ.datos().byId[cu.id];
      return fila({
        ref: e ? cu.id : null, titulo: x.texto.replace(/^Cultura: /, ''), corta: e ? descCorta(e) : '',
        chips: x.cultural ? h('span', { class: 'chip small soft' }, 'cultural') : null,
        accion: h('button', { type: 'button', class: 'btn small', onclick: () => cambiar(c => { c.pericias.splice(i, 1); }) }, 'Quitar'),
      });
    });
    return h('div', { class: 'paso' },
      barra(p.usadas, p.total, 'pericias (2 culturales + tu Intelecto, y 1 más por cada mejora de Intelecto)'),
      h('h3', null, 'Tus pericias'),
      propias.length ? h('ul', { class: 'lista talentos' }, propias) : h('p', { class: 'muted' }, 'Aún no has elegido ninguna.'),
      h('h3', null, 'Elegir pericias'),
      h('ul', { class: 'lista talentos' }, otra, culturas.map(filaCultura)),
      grupoManual('Pericia en arma'), grupoManual('Pericia en armadura'), grupoManual('Pericia de utilidad'),
      h('p', { class: 'muted' }, PJ.ambito(c) === 'Stormlight'
        ? 'Las pericias especializadas (hoja esquirlada, armadura esquirlada, fabricación de fabriales…) solo se obtienen con talentos, recompensas o permiso de la DJ: añádelas con «Otra pericia».'
        : 'Las pericias especializadas (hoja koloss, capa de bruma, Hemalurgo…) solo se obtienen con talentos, recompensas o permiso de la DJ: añádelas con «Otra pericia».'),
      h('p', null, h('a', { href: 'index.html#/c/pericia', target: '_blank', rel: 'noopener' }, 'Reglas de pericias en el buscador')));
  }

  Object.assign(W, { pasoPericias, pasoTalentos });
})(window);
