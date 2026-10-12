/* Asistente paso a paso: creación (con nivel inicial superior) y subida de nivel. */
(function (g) {
  'use strict';
  const PJ = g.PJ;
  const { h, contador, puntos, barra, avisosLista, fila, descCorta, descEquipo, limpioTitulo, hrefEntrada, chipCoste } = PJ.ui;
  const D = () => PJ.datos();

  const KIT_FUGITIVO = 'objeto-equipo-inicial-de-fugitivo';
  const KIT_GUARDADOR = 'objeto-equipo-inicial-de-guardador';
  const defDesbloqueado = (c, arte) =>
    c.nivelInicial > 1 || (arte === 'alomancia' && c.kit === KIT_FUGITIVO) || (arte === 'feruquimia' && c.kit === KIT_GUARDADOR);

  const NOMBRE_ARTE = { alomancia: 'Alomancia', feruquimia: 'Feruquimia' };
  const metalPorSlug = (arte, slug) => D().metales[arte].find(m => m.slug === slug);

  // Deja los poderes iniciales coherentes con camino, era y kit.
  PJ.aplicarPoderesIniciales = function (c) {
    const ini = PJ.PODERES_INICIALES[c.camino];
    const otros = (c.poderes || []).filter(p => p.origen !== 'inicial');
    let propios = (c.poderes || []).filter(p => p.origen === 'inicial');
    const nuevos = [];
    for (const arte of ['alomancia', 'feruquimia']) {
      const n = ini ? ini[arte] : 0;
      const validos = D().metalesEra(arte, c.era).map(m => m.slug);
      let act = propios.filter(p => p.arte === arte && validos.includes(p.metal));
      if (n === 'todos') {
        act = validos.map(s => act.find(p => p.metal === s) || { arte, metal: s, desbloqueado: defDesbloqueado(c, arte), origen: 'inicial' });
      } else act = act.slice(0, n);
      nuevos.push(...act);
    }
    c.poderes = nuevos.concat(otros);
  };

  const descBendicion = key => {
    const B = PJ.BENDICIONES[key];
    const partes = [];
    for (const [k, v] of Object.entries(B.atr || {})) partes.push(`+${v} ${PJ.ATR[k].n}`);
    if (B.max) partes.push('máximo del atributo +' + Object.values(B.max)[0]);
    if (B.desvio) partes.push(`+${B.desvio} desvío`);
    return partes.join(', ');
  };

  const ID_ASCENDENCIA = { humana: 'humana', kandra: 'kandra', koloss: 'de-sangre-koloss' };
  const CORTA_ASCENDENCIA = {
    humana: '12 puntos de atributo; un talento adicional de un camino heroico.',
    kandra: '6 puntos de atributo; Forma natural y Disfraz kandra; Bendiciones; sin poderes de nacido del metal.',
    koloss: 'Fuerza hasta 4 en la creación y máximo 6; Resistencia koloss.',
  };

  const botonSel = (on, texto, onclick, disabled) =>
    h('button', { type: 'button', class: 'btn small' + (on ? ' peligro' : ''), disabled, onclick }, on ? 'Quitar' : (texto || 'Elegir'));

  const panelBendicion = (key, B) => {
    const origen = D().byId['origen-bendiciones-kandra'];
    const m = origen && origen.body.match(new RegExp(B.n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.(?:\\*\\*)?\\s*([^\\n]*?)(?=\\s*(?:\\*\\*)?Bendici[oó]n de|\\n|$)'));
    return {
      etiqueta: 'Bendición', title: B.n, path: ['Ascendencia kandra'],
      facts: [['Efecto', descBendicion(key)], ['Rango', 'Una en la creación; una segunda al llegar al rango 3']],
      body: m ? m[1].trim() : descBendicion(key),
      href: origen ? hrefEntrada(origen) : null,
    };
  };

  const panelCamino = slug => {
    const D_ = D(), a = D_.arbol[slug];
    const tp = D_.byId[a.talento_principal], crear = D_.byId['camino-como-crear-un-' + slug];
    const gratis = PJ.HAB_INICIAL[slug];
    const cuerpo = [];
    if (tp) cuerpo.push('## Talento principal', `[[talento|${tp.title}|${limpioTitulo(tp.title)}]]. ${descCorta(tp)}`);
    if (crear) cuerpo.push('## Cómo crear este camino', crear.body);
    return {
      etiqueta: 'Camino', title: a.nombre, path: [a.tipo],
      facts: [['Tipo', a.tipo], ['Habilidad gratuita', gratis || '—'], ['Talento principal', tp ? limpioTitulo(tp.title) : '—']],
      body: cuerpo.join('\n'), href: 'index.html#/caminos',
    };
  };
  const cortaCamino = slug => {
    const a = D().arbol[slug], tp = D().byId[a.talento_principal], gratis = PJ.HAB_INICIAL[slug];
    return [gratis ? `Habilidad gratuita: ${gratis}.` : '', tp ? `Talento principal: ${limpioTitulo(tp.title)}. ${descCorta(tp)}` : ''].filter(Boolean).join(' ');
  };

  const accionesMetal = (arte, m) => D().base.filter(e => e.cat === 'accion' && e.f && e.f.contexto === `${NOMBRE_ARTE[arte]} de ${m.nombre}`);
  const talentosMetal = m => { const a = m.arbol && D().arbol[m.arbol]; return a ? (a.talentos || []).map(id => D().byId[id]).filter(Boolean) : []; };
  const panelMetal = (arte, m) => {
    const acc = accionesMetal(arte, m), tal = talentosMetal(m);
    const cuerpo = [];
    if (acc.length) cuerpo.push('## Acciones', ...acc.map(e => `◆ ${e.title}. ${descCorta(e)}`));
    if (tal.length) cuerpo.push('## Talentos del árbol', ...tal.map(t => `◆ [[talento|${t.title}|${limpioTitulo(t.title)}]]. ${descCorta(t)}`));
    return {
      etiqueta: 'Arte', title: `${NOMBRE_ARTE[arte]} de ${m.nombre}`, path: [NOMBRE_ARTE[arte]],
      facts: [['Arte', NOMBRE_ARTE[arte]], ['Metal', m.nombre], ['Árbol de talentos', m.sinArbol ? 'Sin árbol de talentos' : (D().arbol[m.arbol] || {}).nombre || '—']],
      body: cuerpo.join('\n') || 'Este metal no tiene acciones ni talentos propios en el libro.',
    };
  };
  const cortaMetal = (arte, m) => {
    const acc = accionesMetal(arte, m), n = talentosMetal(m).length;
    return [acc.length ? 'Acciones: ' + acc.map(e => e.title).join(', ') : '', m.sinArbol || !n ? 'sin árbol de talentos' : `${n} talentos en su árbol`].filter(Boolean).join(' · ');
  };

  // ------------------------------------------------------------------ pasos
  function pasoDatos({ c, d, modo, cambiar, silencioso }) {
    const rango = PJ.rango(c.nivel);
    const maxBen = 1 + (rango >= 3 ? 1 : 0);
    return h('div', { class: 'paso' },
      h('p', { class: 'muted' }, 'Los datos básicos del personaje. Puedes empezar en un nivel superior al 1: el asistente te pedirá todo lo acumulado hasta ese nivel.'),
      h('div', { class: 'form' },
        h('label', null, 'Nombre', h('input', { type: 'text', value: c.nombre, oninput: e => silencioso(c => { c.nombre = e.target.value; }) })),
        h('label', null, 'Jugador/a', h('input', { type: 'text', value: c.jugador, oninput: e => silencioso(c => { c.jugador = e.target.value; }) })),
        h('label', null, 'Era',
          h('select', { onchange: e => cambiar(c => { c.era = +e.target.value; PJ.aplicarPoderesIniciales(c); }) },
            h('option', { value: 1, selected: c.era === 1 }, 'Era 1 (Imperio Final)'),
            h('option', { value: 2, selected: c.era === 2 }, 'Era 2 (Elendel)'))),
        modo === 'crear' ? h('label', null, 'Nivel inicial',
          h('input', {
            type: 'number', min: 1, max: 30, value: c.nivelInicial,
            onchange: e => cambiar(c => {
              const n = Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1));
              c.nivelInicial = n; c.nivel = n;
              c.atributos.subidas = c.atributos.subidas.slice(0, PJ.subidasAtributo(n));
              c.elecciones21 = (c.elecciones21 || []).slice(0, Math.max(0, n - 20));
              while (c.elecciones21.length < Math.max(0, n - 20)) c.elecciones21.push('grado');
              PJ.aplicarPoderesIniciales(c);
            }),
          })) : null),
      h('h3', null, 'Ascendencia'),
      h('ul', { class: 'lista talentos' }, Object.entries(PJ.ASCENDENCIAS).map(([k, a]) => {
        const on = c.ascendencia === k;
        return fila({
          ref: 'origen-ascendencia-' + ID_ASCENDENCIA[k], titulo: a.n, corta: CORTA_ASCENDENCIA[k], on,
          accion: on ? h('span', { class: 'chip small' }, 'elegida') : h('button', {
            type: 'button', class: 'btn small',
            onclick: () => cambiar(c => {
              c.ascendencia = k;
              if (k === 'kandra' && PJ.CAMINOS_METAL.includes(c.camino)) { c.camino = null; PJ.aplicarPoderesIniciales(c); }
              if (k !== 'kandra') c.bendiciones = [];
              if (k === 'kandra') c.atributos.creacion = Object.fromEntries(PJ.ATRIBUTOS.map(x => [x.k, 0]));
            }),
          }, 'Elegir'),
        });
      })),
      c.ascendencia === 'kandra' ? h('div', null,
        h('h3', null, 'Bendiciones kandra'),
        h('p', { class: 'muted' }, `Eliges una en la creación y una segunda al llegar al rango 3 (ahora puedes tener ${maxBen}).`),
        h('ul', { class: 'lista talentos' }, Object.entries(PJ.BENDICIONES).map(([k, B]) => {
          const on = c.bendiciones.includes(k);
          return fila({
            panel: panelBendicion(k, B), titulo: B.n, corta: descBendicion(k), on,
            accion: botonSel(on, 'Elegir', () => cambiar(c => { c.bendiciones = on ? c.bendiciones.filter(x => x !== k) : c.bendiciones.concat(k); }), !on && c.bendiciones.length >= maxBen),
          });
        }))) : null);
  }

  function pasoCamino({ c, d, cambiar }) {
    const arboles = PJ.datos().arbol;
    const kandra = c.ascendencia === 'kandra';
    const carta = slug => {
      const a = arboles[slug]; if (!a) return null;
      const bloqueado = kandra && PJ.CAMINOS_METAL.includes(slug);
      const on = c.camino === slug;
      return fila({
        panel: panelCamino(slug), titulo: a.nombre, corta: cortaCamino(slug), on, bloq: bloqueado,
        chips: bloqueado ? h('span', { class: 'chip small mal' }, 'No disponible para kandra') : null,
        accion: on ? h('span', { class: 'chip small' }, 'elegido')
          : h('button', { type: 'button', class: 'btn small', disabled: bloqueado, onclick: () => cambiar(c => { c.camino = slug; PJ.aplicarPoderesIniciales(c); }) }, 'Elegir'),
      });
    };
    return h('div', { class: 'paso' },
      h('p', { class: 'muted' }, 'Tu camino inicial te da su talento principal y un grado gratuito en una habilidad. Los caminos de nacido del metal son excluyentes entre sí.'),
      h('h3', null, 'Caminos heroicos'),
      h('ul', { class: 'lista talentos' }, PJ.CAMINOS_HEROICOS.map(carta)),
      h('h3', null, 'Caminos de nacido del metal'),
      h('ul', { class: 'lista talentos' }, PJ.CAMINOS_METAL.map(carta)),
      h('p', null, h('a', { href: 'index.html#/caminos', target: '_blank', rel: 'noopener' }, 'Consultar los caminos en el buscador')));
  }

  function pasoAtributos({ c, d, modo, cambiar }) {
    const crear = modo === 'crear';
    const pc = d.presupuesto.atributosCreacion, ps = d.presupuesto.atributosSubidas;
    const setSub = (c, k, v) => { c.atributos.subidas = c.atributos.subidas.filter(x => x !== k).concat(Array(v).fill(k)); };
    const filas = PJ.ATRIBUTOS.map(a => {
      const x = d.atributos[a.k];
      return h('tr', null,
        h('th', null, a.n, ' ', h('small', null, a.a)),
        h('td', null, crear
          ? contador(x.creacion, { min: 0, max: Math.min(x.maxCreacion, x.creacion + Math.max(0, pc.total - pc.usados)), etiqueta: a.n, alCambiar: v => cambiar(c => { c.atributos.creacion[a.k] = v; }) })
          : h('b', null, String(x.creacion))),
        ps.total > 0 ? h('td', null, contador(x.subidas, {
          min: 0, etiqueta: a.n + ' (mejora)',
          max: Math.min(x.subidas + Math.max(0, ps.total - ps.usadas), x.subidas + Math.max(0, x.max - x.base - x.bendicion)),
          alCambiar: v => cambiar(c => setSub(c, a.k, v)),
        })) : null,
        h('td', null, (x.bendicion + x.bonos) ? (x.bendicion + x.bonos > 0 ? '+' : '') + (x.bendicion + x.bonos) : '—'),
        h('td', { class: 'total' }, String(x.total)),
        h('td', { class: 'muted' }, String(x.max)));
    });
    return h('div', { class: 'paso' },
      crear ? barra(pc.usados, pc.total, `puntos de creación (máximo ${c.ascendencia === 'koloss' ? '4 en Fuerza y 3' : '3'} por atributo)`) : null,
      ps.total > 0 ? barra(ps.usadas, ps.total, 'mejoras de atributo (+1 en los niveles 3, 6, 9, 12, 15 y 18)') : h('p', { class: 'muted' }, 'Aún no hay mejoras de atributo: llegan al nivel 3.'),
      h('table', { class: 'tabla' },
        h('thead', null, h('tr', null, h('th', null, 'Atributo'), h('th', null, 'Creación'), ps.total > 0 ? h('th', null, 'Mejoras') : null, h('th', null, 'Otros'), h('th', null, 'Total'), h('th', null, 'Máx.'))),
        h('tbody', null, filas)),
      avisosLista(d.avisos.filter(a => /atributo|supera el máximo|Fuerza|Velocidad|Intelecto|Voluntad|Discernimiento|Presencia/.test(a.texto)), ['error']));
  }

  function pasoHabilidades({ c, d, cambiar }) {
    const p = d.presupuesto.grados;
    const grupos = PJ.ATRIBUTOS.map(a => h('div', { class: 'grupo' },
      h('h4', null, a.n, ' ', h('small', null, `(${d.atributos[a.k].total})`)),
      Object.entries(PJ.HABILIDADES).filter(([, k]) => k === a.k).map(([nombre]) => {
        const x = d.habilidades[nombre];
        return h('div', { class: 'fila' },
          h('span', { class: 'nom' }, nombre, PJ.HAB_ARTES.includes(nombre) ? h('small', { class: 'muted' }, ' (arte metálica)') : null),
          puntos(x.asignados, {
            etiqueta: nombre, gratis: x.gratis, n: p.max - x.gratis,
            max: Math.min(p.max - x.gratis, x.asignados + Math.max(0, p.total - p.usados)),
            alCambiar: v => cambiar(c => { if (v) c.habilidades[nombre] = v; else delete c.habilidades[nombre]; }),
          }),
          h('span', { class: 'mod' }, (x.mod >= 0 ? '+' : '') + x.mod));
      })));
    return h('div', { class: 'paso' },
      PJ.pasoElecciones21({ c, cambiar }),
      barra(p.usados, p.total, `grados de habilidad (máximo ${p.max} por habilidad en el rango ${d.rango})`),
      h('p', { class: 'muted' }, 'El modificador es el atributo más los grados. Los grados gratuitos de tu camino no consumen puntos.'),
      h('div', { class: 'grupos' }, grupos),
      avisosLista(d.avisos.filter(a => /grados/.test(a.texto)), ['error']));
  }

  let arbolSel = null, filtroTalento = '';
  function opcionesArboles(c) {
    const A = PJ.datos().arbol, asc = PJ.ASCENDENCIAS[c.ascendencia];
    const out = [];
    const add = (slug, grupo) => { if (A[slug] && !out.some(o => o.slug === slug)) out.push({ slug, grupo, nombre: A[slug].nombre }); };
    if (c.camino) add(c.camino, 'Tu camino inicial');
    if (asc.arbol) add(asc.arbol, 'Ascendencia');
    PJ.CAMINOS_HEROICOS.forEach(s => add(s, 'Caminos heroicos'));
    if (c.ascendencia !== 'kandra') {
      PJ.CAMINOS_METAL.forEach(s => add(s, 'Caminos de nacido del metal'));
      add('metales-de-scadrial', 'Artes metálicas');
      for (const p of c.poderes || []) add(`${p.arte}-de-${p.metal}`, 'Poderes que posees');
    }
    return out;
  }

  function pasoTalentos({ c, d, cambiar }) {
    const t = d.presupuesto.talentos;
    const opts = opcionesArboles(c);
    if (!opts.some(o => o.slug === arbolSel)) arbolSel = (opts[0] || {}).slug;
    const A = PJ.datos();
    const todos = arbolSel ? PJ.talentosElegibles(c, d, arbolSel).filter(x => !x.poseido) : [];
    const lleno = t.usados >= t.total;
    const filaTalento = x => {
      const pend = x.ev.clausulas.filter(k => k.estado === 'manual');
      const faltan = x.ev.clausulas.filter(k => k.estado === 'falta');
      const puede = (x.ev.cumple || c.ignorarPrerreq) && !lleno;
      const e = A.byId[x.id];
      return fila({
        ref: x.id, titulo: x.titulo, corta: e ? descCorta(e) : '', bloq: !x.ev.cumple,
        antes: x.activacion ? chipCoste(x.activacion, x.activacion) : null,
        chips: [
          x.principal ? h('span', { class: 'chip small' }, 'principal') : null,
          x.especialidad ? h('span', { class: 'chip small' }, x.especialidad) : null],
        accion: h('button', { type: 'button', class: 'btn small', disabled: !puede, onclick: () => cambiar(c => { c.talentos.push(x.id); }) }, 'Añadir'),
        extra: [
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
      c.ascendencia === 'humana' ? h('p', { class: 'muted' }, 'Como humano, tu talento adicional de nivel 1 debe ser de un camino heroico.') : null);
  }

  function pasoPericias({ c, d, cambiar }) {
    const p = d.presupuesto.pericias;
    let texto = '';
    const culturas = PJ.datos().culturasEra(c.era);
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
      h('p', null, h('a', { href: 'index.html#/c/pericia', target: '_blank', rel: 'noopener' }, 'Reglas de pericias en el buscador')));
  }

  function pasoPoderes({ c, d, cambiar }) {
    const ini = PJ.PODERES_INICIALES[c.camino];
    const metales = (arte) => PJ.datos().metalesEra(arte, c.era);
    const iniciales = arte => c.poderes.filter(p => p.arte === arte && p.origen === 'inicial');
    const bloqueIni = arte => {
      const n = ini[arte]; if (!n) return null;
      const lista = metales(arte);
      return h('div', null, h('h4', null, `${NOMBRE_ARTE[arte]} inicial`),
        n === 'todos' ? h('p', { class: 'muted' }, 'Tu camino te da todos los metales disponibles en tu era.') :
          h('p', { class: 'muted' }, `Elige ${n} metal (${iniciales(arte).length}/${n}). Dispones de los metales de tu era.`),
        h('ul', { class: 'lista talentos' }, lista.map(m => {
          const on = iniciales(arte).some(p => p.metal === m.slug);
          return fila({
            panel: panelMetal(arte, m), titulo: `${NOMBRE_ARTE[arte]} de ${m.nombre}`, corta: cortaMetal(arte, m), on,
            accion: botonSel(on, 'Elegir', () => cambiar(c => {
              if (on) c.poderes = c.poderes.filter(p => !(p.arte === arte && p.metal === m.slug && p.origen === 'inicial'));
              else c.poderes.push({ arte, metal: m.slug, desbloqueado: defDesbloqueado(c, arte), origen: 'inicial' });
            }), n === 'todos' || (!on && iniciales(arte).length >= n)),
          });
        })));
    };
    let arteNuevo = 'alomancia', metalNuevo = '';
    const selMetal = h('select');
    const rellenar = () => {
      selMetal.innerHTML = '';
      metales(arteNuevo).filter(m => !c.poderes.some(p => p.arte === arteNuevo && p.metal === m.slug)).forEach(m => selMetal.appendChild(h('option', { value: m.slug }, m.nombre)));
      metalNuevo = selMetal.value;
    };
    rellenar();
    selMetal.addEventListener('change', () => { metalNuevo = selMetal.value; });
    return h('div', { class: 'paso' },
      h('p', { class: 'muted' }, 'Un poder permanece latente hasta completar su meta y su recompensa; hasta entonces no puedes elegir talentos de su árbol. Marca «desbloqueado» cuando lo logres (algunos equipos iniciales lo dan de inmediato).'),
      ini ? [bloqueIni('alomancia'), bloqueIni('feruquimia')] : h('p', { class: 'muted' }, 'Tu camino inicial no concede poderes de nacido del metal.'),
      h('h3', null, 'Tus poderes'),
      c.poderes.length ? h('ul', { class: 'lista talentos' }, c.poderes.map((p, i) => {
        const m = metalPorSlug(p.arte, p.metal);
        return fila({
          panel: m ? panelMetal(p.arte, m) : null, titulo: `${NOMBRE_ARTE[p.arte]} de ${m ? m.nombre : p.metal}`, corta: m ? cortaMetal(p.arte, m) : '',
          chips: [
            p.origen === 'inicial' ? h('span', { class: 'chip small soft' }, 'inicial') : null,
            m && m.sinArbol ? h('span', { class: 'chip small soft' }, 'sin árbol de talentos') : null],
          accion: [
            h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: p.desbloqueado, onchange: e => cambiar(c => { c.poderes[i].desbloqueado = e.target.checked; }) }), ' Desbloqueado'),
            p.origen === 'inicial' ? null : h('button', { type: 'button', class: 'btn small', onclick: () => cambiar(c => { c.poderes.splice(i, 1); }) }, 'Quitar')],
        });
      })) : h('p', { class: 'muted' }, 'Todavía sin poderes.'),
      h('h3', null, 'Añadir otro poder (recompensa)'),
      h('div', { class: 'form fila' },
        h('label', null, 'Arte', h('select', { onchange: e => { arteNuevo = e.target.value; rellenar(); } }, h('option', { value: 'alomancia' }, 'Alomancia'), h('option', { value: 'feruquimia' }, 'Feruquimia'))),
        h('label', null, 'Metal', selMetal),
        h('button', { type: 'button', class: 'btn', onclick: () => { if (metalNuevo) cambiar(c => { c.poderes.push({ arte: arteNuevo, metal: metalNuevo, desbloqueado: c.nivelInicial > 1, origen: 'recompensa' }); }); } }, 'Añadir')),
      h('p', { class: 'muted' }, 'Hemalurgia: los clavos se anotan en la hoja, en la pestaña «Poderes».'));
  }

  // Arquillas: `arquillasIni` es lo que se tiene al empezar y `arquillas` lo que queda tras pagar armadura, armas y objetos
  // (salvo los marcados "del conjunto"). Los personajes sin `arquillasIni` lo deducen de lo que ya llevan.
  const redondea = n => Math.round(n * 100) / 100;
  const fmtAr = n => String(redondea(n)).replace('.', ',');
  const precioDe = id => { const e = PJ.datos().byId[id]; return (e && e.f && +e.f.precio_n) || 0; };
  const gastoEquipo = c => {
    let g = 0;
    if (c.armadura && !c.armaduraGratis) g += precioDe(c.armadura);
    c.armas.forEach(w => { if (w.ref && !w.gratis) g += precioDe(w.ref); });
    c.equipo.forEach(it => { if (it.ref && !it.gratis) g += precioDe(it.ref) * (it.cant || 1); });
    return redondea(g);
  };
  const iniDe = c => (c.arquillasIni != null ? c.arquillasIni : c.arquillas + gastoEquipo(c));
  const fijarArquillas = (c, ini) => { c.arquillasIni = Math.max(0, redondea(ini)); c.arquillas = Math.max(0, redondea(c.arquillasIni - gastoEquipo(c))); };
  const dadosKit = k => { const m = /(\d+)d(\d+)\s+arquillas/i.exec((k && k.body) || ''); return m ? [+m[1], +m[2]] : null; };

  // El estado de la interfaz (sección y filtros) vive aquí porque cambiar() reconstruye todo el asistente
  const eq = { sec: 'inicial', tipo: '', peso: '', cat: '', busca: '' };

  // El libro no clasifica el equipo: la categoría se deduce del nombre (único sitio donde se define)
  const CATS_EQUIPO = [
    ['Medicina y venenos', /anestesico|antiseptico|quirurgic|tonica|tratamiento|veneno/],
    ['Comida y bebida', /comida|alcohol/],
    ['Ropa', /\bropa\b/],
    ['Luz y fuego', /linterna|\bvela\b|pedernal|aceite|\bcera\b/],
    ['Contenedores', /arcon|barril|bolsa|botella|\bcubo\b|estuche|frasco|jarra|mochila|odre|\bsaco\b|\bvial\b/],
    ['Cuerdas y cierres', /cuerda|cadena|grilletes|cerradura|ganzua|garfio|polea/],
    ['Escritura y estudio', /calamo|tinta|libro|papel|pergamino|lupa|catalejo|balanza|diapason|trompetilla|espejo|instrumento/],
    ['Herramientas', /martillo|\bpala\b|palanca|\bpico\b|piedra de afilar|\bred\b|escalera/],
  ];
  const catEquipo = e => { const t = PJ.norm(e.title); const k = CATS_EQUIPO.find(([, re]) => re.test(t)); return k ? k[0] : 'Varios'; };

  const chipFiltro = (on, texto, onclick) => h('button', { type: 'button', class: 'chip' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick }, texto);

  // Lista completa con filtros: los filtros y la lista se repintan solos (sin reconstruir el asistente)
  function catalogoFiltrable({ items, barras, pasa, buscador, fila: pintaFila }) {
    const zonaBarras = h('div'), zonaLista = h('ul', { class: 'lista talentos resultados' }), cuenta = h('p', { class: 'nota' });
    const pintar = () => {
      const q = PJ.norm(eq.busca);
      const vis = items.filter(x => pasa(x) && (!q || PJ.norm(x.title).includes(q)));
      zonaBarras.innerHTML = ''; barras(pintar).forEach(b => zonaBarras.appendChild(b));
      zonaLista.innerHTML = ''; vis.forEach(x => zonaLista.appendChild(pintaFila(x)));
      cuenta.textContent = vis.length ? `${vis.length} de ${items.length}` : 'Nada coincide con los filtros.';
    };
    pintar();
    return h('div', null, zonaBarras,
      buscador ? h('input', { type: 'search', placeholder: 'Buscar por nombre…', value: eq.busca, oninput: e => { eq.busca = e.target.value; pintar(); } }) : null,
      cuenta, zonaLista);
  }

  function pasoEquipo({ c, d, cambiar, silencioso }) {
    const D = PJ.datos(), byId = D.byId;
    const refValida = r => (r && byId[r] ? r : null);
    const botonAnadir = alElegir => h('button', { type: 'button', class: 'btn small', onclick: alElegir }, 'Añadir');
    const grupo = (nombre, chips) => h('div', { class: 'chips', role: 'group', 'aria-label': nombre }, chips);
    // toda modificación del equipo pasa por aquí para que las arquillas restantes se recalculen
    const mut = fn => cambiar(cc => { const ini = iniDe(cc); const nuevo = fn(cc); fijarArquillas(cc, nuevo != null ? nuevo : ini); });
    const delConjunto = (marcado, alCambiar) => (c.kit
      ? h('label', { class: 'chk nota' }, h('input', { type: 'checkbox', checked: !!marcado, onchange: e => alCambiar(e.target.checked) }), 'Del conjunto (gratis)')
      : null);

    const secInicial = () => {
      const kits = D.base.filter(e => e.id.startsWith('objeto-equipo-inicial-de-'));
      const kit = c.kit && byId[c.kit];
      const dados = dadosKit(kit);
      const elegir = (id, libre) => cambiar(cc => {
        cc.kit = id; cc.equipoLibre = libre;
        cc.poderes.filter(p => p.origen === 'inicial').forEach(p => { p.desbloqueado = defDesbloqueado(cc, p.arte); });
        if (id) { cc.armaduraGratis = false; cc.armas.forEach(w => { delete w.gratis; }); cc.equipo.forEach(it => { delete it.gratis; }); fijarArquillas(cc, 0); } else fijarArquillas(cc, iniDe(cc));
      });
      const tirar = () => {
        let t = 0;
        for (let i = 0; i < dados[0]; i++) t += 1 + Math.floor(Math.random() * dados[1]);
        mut(cc => t * (cc.era === 2 ? 10 : 1));
      };
      return h('div', null,
        h('ul', { class: 'lista talentos' },
          fila({
            titulo: 'Elección libre', on: !!c.equipoLibre,
            corta: 'No usas un conjunto inicial: eliges todo tu equipo y tú decides con cuántas arquillas empiezas.',
            accion: botonSel(!!c.equipoLibre, 'Elegir', () => elegir(null, !c.equipoLibre)),
          }),
          kits.map(k => {
            const on = k.id === c.kit;
            return fila({
              ref: k.id, titulo: k.title.replace(/^Equipo inicial de /i, '').replace(/^./, s => s.toUpperCase()), corta: descCorta(k), on,
              accion: botonSel(on, 'Elegir', () => elegir(on ? null : k.id, false)),
            });
          })),
        c.kit || c.equipoLibre ? h('div', { class: 'form fila' },
          h('label', null, 'Arquillas iniciales', h('input', { type: 'number', min: 0, step: 'any', value: iniDe(c), onchange: e => mut(() => Math.max(0, +e.target.value || 0)) })),
          dados ? h('button', { type: 'button', class: 'btn', onclick: tirar }, `Tirar ${dados[0]}d${dados[1]}${c.era === 2 ? ' × 10' : ''}`) : null,
          kit && !dados ? h('span', { class: 'nota' }, 'Este conjunto no incluye dinero.') : null) : h('p', { class: 'muted' }, 'Elige un conjunto o marca "Elección libre" para fijar tus arquillas iniciales.'));
    };

    const resumen = () => {
      const kit = c.kit && byId[c.kit];
      const ini = iniDe(c), gasto = gastoEquipo(c), resto = redondea(ini - gasto);
      const cifra = (n, v, cls) => h('span', { class: 'cifra ' + (cls || '') }, h('span', { class: 'nota' }, n), h('b', null, fmtAr(v)));
      const lineas = kit ? String(kit.body || '').split('\n').map(l => l.replace(/^#+\s*/, '').trim())
        .filter(l => /^(armas|armadura|equipo|dinero|divisa|pericia|mente)/i.test(l)).map(l => PJ.ui.plano(l).replace(/\s*era\s*(\d)\s*/gi, ' (era $1) ').replace(/\s+/g, ' ').trim()) : [];
      return h('div', { class: 'banda-equipo' },
        h('div', { class: 'be-fila' },
          h('span', null, h('b', null, 'Equipo inicial: '),
            kit ? kit.title.replace(/^Equipo inicial de /i, '').replace(/^./, s => s.toUpperCase()) : c.equipoLibre ? 'Elección libre' : 'sin elegir'),
          kit ? h('button', { type: 'button', class: 'btn small', onclick: () => PJ.ui.abrirPanel(kit.id) }, 'Ver conjunto') : null,
          h('span', { class: 'cifras' }, cifra('Arquillas iniciales', ini), cifra('Gastadas', gasto), cifra('Restantes', resto, resto < 0 ? 'mal' : ''))),
        resto < 0 ? h('p', { class: 'mal nota' }, `Te pasas ${fmtAr(-resto)} arquillas.`) : null,
        lineas.length ? h('details', null, h('summary', null, 'Incluido en el conjunto'), h('ul', { class: 'lista' }, lineas.map(l => h('li', null, l)))) : null);
    };

    const secArmadura = () => h('div', null,
      c.kit && c.armadura ? h('p', null, delConjunto(c.armaduraGratis, v => mut(cc => { cc.armaduraGratis = v; }))) : null,
      h('ul', { class: 'lista talentos' }, D.base.filter(e => e.cat === 'armadura').map(a => {
        const on = a.id === c.armadura;
        return fila({
          ref: a.id, titulo: limpioTitulo(a.title), corta: descEquipo(a), on,
          accion: botonSel(on, 'Elegir', () => mut(cc => { cc.armadura = on ? null : a.id; cc.armaduraGratis = false; })),
        });
      })));

    const secArmas = () => {
      const lig = x => /ligero/.test(PJ.norm((x.f || {}).habilidad));
      const pes = x => /pesado/.test(PJ.norm((x.f || {}).habilidad));
      const pasaPeso = { lig, pes, otras: x => !lig(x) && !pes(x) };
      return h('div', null,
        h('h4', { class: 'titulo-grupo' }, 'Tus armas'),
        c.armas.length ? h('ul', { class: 'lista talentos' }, c.armas.map((w, i) => {
          const ref = refValida(w.ref);
          return fila({
            ref, titulo: w.nombre, corta: ref ? descEquipo(byId[ref]) : '', on: true,
            accion: [delConjunto(w.gratis, v => mut(cc => { cc.armas[i].gratis = v; })),
              h('button', { type: 'button', class: 'btn small', onclick: () => mut(cc => { cc.armas.splice(i, 1); }) }, 'Quitar')],
          });
        })) : h('p', { class: 'muted' }, 'Sin armas.'),
        h('h4', { class: 'titulo-grupo' }, 'Añadir un arma'),
        catalogoFiltrable({
          items: D.base.filter(e => e.cat === 'arma'), buscador: true,
          barras: pintar => [
            grupo('Tipo', [['', 'Todas'], ['Cuerpo a cuerpo', 'Cuerpo a cuerpo'], ['A distancia', 'A distancia']].map(([v, t]) => chipFiltro(eq.tipo === v, t, () => { eq.tipo = v; pintar(); }))),
            grupo('Peso', [['', 'Cualquiera'], ['lig', 'Ligeras'], ['pes', 'Pesadas'], ['otras', 'Otras']].map(([v, t]) => chipFiltro(eq.peso === v, t, () => { eq.peso = v; pintar(); }))),
          ],
          pasa: x => (!eq.tipo || (x.f || {}).tipo === eq.tipo) && (!eq.peso || pasaPeso[eq.peso](x)),
          fila: x => {
            const n = c.armas.filter(w => w.ref === x.id).length;
            return fila({
              ref: x.id, titulo: limpioTitulo(x.title), corta: descEquipo(x),
              chips: n ? [h('span', { class: 'chip small soft' }, '×' + n)] : [],
              accion: botonAnadir(() => mut(cc => { cc.armas.push({ ref: x.id, nombre: x.title }); })),
            });
          },
        }));
    };

    const secObjetos = () => {
      const items = D.base.filter(e => e.cat === 'equipo');
      const cats = [...new Set(items.map(catEquipo))].sort((a, b) => (a === 'Varios') - (b === 'Varios') || a.localeCompare(b, 'es'));
      let libre = '';
      return h('div', null,
        h('h4', { class: 'titulo-grupo' }, 'Tus objetos'),
        c.equipo.length ? h('ul', { class: 'lista talentos' }, c.equipo.map((it, i) => {
          const ref = refValida(it.ref);
          return fila({
            ref, titulo: it.nombre, corta: ref ? descEquipo(byId[ref]) : '', on: true,
            accion: [
              delConjunto(it.gratis, v => mut(cc => { cc.equipo[i].gratis = v; })),
              h('input', { type: 'number', min: 1, class: 'cant', 'aria-label': 'Cantidad de ' + it.nombre, value: it.cant || 1, onchange: e => mut(cc => { cc.equipo[i].cant = Math.max(1, +e.target.value || 1); }) }),
              h('button', { type: 'button', class: 'btn small', onclick: () => mut(cc => { cc.equipo.splice(i, 1); }) }, 'Quitar')],
          });
        })) : h('p', { class: 'muted' }, 'Sin objetos.'),
        h('h4', { class: 'titulo-grupo' }, 'Añadir un objeto'),
        catalogoFiltrable({
          items, buscador: true,
          barras: pintar => [grupo('Categoría', [['', 'Todos'], ...cats.map(k => [k, k])].map(([v, t]) => chipFiltro(eq.cat === v, t, () => { eq.cat = v; pintar(); })))],
          pasa: x => !eq.cat || catEquipo(x) === eq.cat,
          fila: x => {
            const n = c.equipo.filter(it => it.ref === x.id).reduce((s, it) => s + (it.cant || 1), 0);
            return fila({
              ref: x.id, titulo: limpioTitulo(x.title), corta: descEquipo(x),
              chips: n ? [h('span', { class: 'chip small soft' }, '×' + n)] : [],
              accion: botonAnadir(() => mut(cc => { cc.equipo.push({ ref: x.id, nombre: x.title, cant: 1 }); })),
            });
          },
        }),
        h('div', { class: 'form fila' }, h('label', null, 'Objeto libre', h('input', { type: 'text', oninput: e => { libre = e.target.value; } })),
          h('button', { type: 'button', class: 'btn', onclick: () => { if (libre.trim()) mut(cc => { cc.equipo.push({ nombre: libre.trim(), cant: 1 }); }); } }, 'Añadir')));
    };

    const SECCIONES = [
      ['inicial', 'Inicial', secInicial, c.kit || c.equipoLibre ? 1 : 0],
      ['armadura', 'Armadura', secArmadura, c.armadura ? 1 : 0],
      ['armas', 'Armas', secArmas, c.armas.length],
      ['objetos', 'Objetos', secObjetos, c.equipo.length],
    ];
    if (!SECCIONES.some(s => s[0] === eq.sec)) eq.sec = 'inicial';
    const activa = SECCIONES.find(s => s[0] === eq.sec);
    return h('div', { class: 'paso' },
      resumen(),
      h('nav', { class: 'pasos sub', 'aria-label': 'Secciones del equipo' }, SECCIONES.map(([k, nombre, , n]) =>
        h('button', { type: 'button', class: 'paso-tab' + (k === eq.sec ? ' on' : ''), 'aria-pressed': k === eq.sec ? 'true' : 'false', onclick: () => { eq.sec = k; cambiar(() => {}); } },
          nombre, n ? h('span', { class: 'cuenta' }, String(n)) : null))),
      activa[2]());
  }

  function pasoRecompensas({ c, d, cambiar, silencioso }) {
    const r = d.recompensasInicio;
    let texto = '', rango = 1;
    const contar = n => c.recompensas.filter(x => x.rango === n).length;
    return h('div', { class: 'paso' },
      h('p', { class: 'muted' }, 'Al empezar por encima del nivel 1 recibes recompensas ya ganadas. Anótalas aquí (el detalle de cada una está en el libro).'),
      r ? h('div', null,
        h('p', null, h('b', null, r.arquillas + ' arquillas'), ' de dinero inicial ',
          h('button', { type: 'button', class: 'btn small', onclick: () => cambiar(c => { fijarArquillas(c, r.arquillas); }) }, 'Aplicar')),
        h('ul', { class: 'lista' }, Object.entries(r.recompensas).map(([n, cant]) => h('li', { class: contar(+n) > cant ? 'mal' : '' }, `Recompensas de rango ${n}: ${contar(+n)} / ${cant}`)))) : h('p', null, 'Empiezas en nivel 1: sin recompensas adicionales.'),
      h('ul', { class: 'lista' }, c.recompensas.map((x, i) => h('li', null, h('span', { class: 'chip small' }, 'R' + x.rango), ' ', x.texto,
        h('button', { type: 'button', class: 'btn small', onclick: () => cambiar(c => { c.recompensas.splice(i, 1); }) }, 'Quitar')))),
      h('div', { class: 'form fila' },
        h('label', null, 'Rango', h('select', { onchange: e => { rango = +e.target.value; } }, [1, 2, 3, 4, 5].map(n => h('option', { value: n }, 'Rango ' + n)))),
        h('label', null, 'Recompensa', h('input', { type: 'text', placeholder: 'Ej.: Pericia en arma, patrocinador, clavo hemalúrgico…', oninput: e => { texto = e.target.value; } })),
        h('button', { type: 'button', class: 'btn', onclick: () => { if (texto.trim()) cambiar(c => { c.recompensas.push({ texto: texto.trim(), rango }); }); } }, 'Añadir')),
      h('p', null, h('a', { href: 'index.html#/c/recompensa', target: '_blank', rel: 'noopener' }, 'Catálogo de recompensas en el buscador')));
  }

  function pasoHistoria({ c, cambiar, silencioso }) {
    return h('div', { class: 'paso' }, PJ.ui.historia(c, { cambiar, silencioso }));
  }

  function pasoResumen({ c, d, modo, ir }) {
    const pendientes = d.avisos.filter(a => a.tipo === 'pendiente');
    return h('div', { class: 'paso' },
      h('h3', null, `${c.nombre || 'Sin nombre'} · nivel ${d.nivel} (rango ${d.rango})`),
      h('div', { class: 'res' },
        h('div', null, h('b', null, 'Salud'), ' ', d.salud), h('div', null, h('b', null, 'Concentración'), ' ', d.concentracion),
        d.investidura !== null ? h('div', null, h('b', null, 'Investidura'), ' ', d.investidura) : null,
        h('div', null, h('b', null, 'Defensas'), ` ${d.defensas.fisica} / ${d.defensas.cognitiva} / ${d.defensas.espiritual}`),
        h('div', null, h('b', null, 'Camino'), ' ', PJ.ui.nombreCamino(c.camino) || '—')),
      pendientes.length ? h('div', null, h('h4', null, 'Pendiente de completar'), avisosLista(d.avisos)) :
        d.avisos.length ? avisosLista(d.avisos) : h('p', { class: 'bien' }, 'Todo en orden: no hay nada pendiente.'));
  }

  // ------------------------------------------------------------------ secuencias
  PJ.PASOS = {
    datos: { n: 'Datos', fn: pasoDatos }, camino: { n: 'Camino', fn: pasoCamino }, atributos: { n: 'Atributos', fn: pasoAtributos },
    habilidades: { n: 'Habilidades', fn: pasoHabilidades }, talentos: { n: 'Talentos', fn: pasoTalentos }, pericias: { n: 'Pericias', fn: pasoPericias },
    poderes: { n: 'Poderes', fn: pasoPoderes }, equipo: { n: 'Equipo', fn: pasoEquipo }, recompensas: { n: 'Recompensas', fn: pasoRecompensas },
    historia: { n: 'Historia', fn: pasoHistoria }, resumen: { n: 'Resumen', fn: pasoResumen },
  };
  PJ.secuencia = (modo, c) => {
    if (modo === 'nivel') return ['atributos', 'habilidades', 'talentos', 'pericias', 'poderes', 'resumen'];
    const s = ['datos', 'camino', 'atributos', 'habilidades', 'talentos', 'pericias'];
    if (PJ.CAMINOS_METAL.includes(c.camino)) s.push('poderes');
    s.push('equipo');
    if (c.nivelInicial > 1) s.push('recompensas');
    s.push('historia', 'resumen');
    return s;
  };

  // Elección de nivel 21+ (grado o talento por cada nivel por encima del 20)
  PJ.pasoElecciones21 = function ({ c, cambiar }) {
    const n = Math.max(0, c.nivel - 20);
    if (!n) return null;
    while (c.elecciones21.length < n) c.elecciones21.push('grado');
    return h('div', { class: 'nota' }, h('b', null, 'Niveles por encima del 20: '), 'cada uno concede un grado de habilidad o un talento.',
      c.elecciones21.slice(0, n).map((v, i) => h('label', { class: 'chk' }, `Nivel ${21 + i}: `,
        h('select', { onchange: e => cambiar(c => { c.elecciones21[i] = e.target.value; }) },
          h('option', { value: 'grado', selected: v === 'grado' }, '+1 grado'), h('option', { value: 'talento', selected: v === 'talento' }, '+1 talento')))));
  };

  // ------------------------------------------------------------------ carcasa del asistente
  PJ.renderAsistente = function (raiz, c, modo, pasoPedido) {
    const seq = PJ.secuencia(modo, c);
    const paso = seq.includes(pasoPedido) ? pasoPedido : seq[0];
    const idx = seq.indexOf(paso);
    const base = `#/personajes/p/${c.id}/${modo === 'nivel' ? 'nivel' : 'crear'}/`;
    const guardar = () => { if (!PJ.store.guardar(c)) PJ.ui.aviso('No se pudo guardar en el navegador. Exporta el personaje a JSON.'); };
    const pintar = () => PJ.renderAsistente(raiz, c, modo, paso);
    const cambiar = fn => {
      const y = window.scrollY;
      fn(c); guardar(); pintar(); window.scrollTo(0, y);
    };
    const silencioso = fn => { fn(c); guardar(); lateral(); };
    const lateral = () => {
      const d = PJ.derivar(c);
      aside.innerHTML = '';
      aside.appendChild(h('h4', null, c.nombre || 'Sin nombre'));
      aside.appendChild(h('div', { class: 'datos' },
        h('span', null, 'Nivel ' + d.nivel), h('span', null, 'Salud ' + d.salud), h('span', null, 'Conc. ' + d.concentracion),
        d.investidura !== null ? h('span', null, 'Inv. ' + d.investidura) : null,
        h('span', null, `Def ${d.defensas.fisica}/${d.defensas.cognitiva}/${d.defensas.espiritual}`)));
      aside.appendChild(avisosLista(d.avisos) || h('p', { class: 'bien' }, 'Sin pendientes.'));
    };
    const aside = h('aside', { class: 'lateral' });
    const d = PJ.derivar(c);
    const titulo = modo === 'nivel' ? `Subir a nivel ${c.nivel}` : 'Crear personaje';
    const prev = idx > 0 ? h('a', { class: 'btn', href: base + seq[idx - 1], rel: 'prev' }, '← Anterior') : h('span', { class: 'btn-hueco' });
    const sig = idx < seq.length - 1 ? h('a', { class: 'btn primario', href: base + seq[idx + 1], rel: 'next' }, 'Siguiente →') :
      h('a', { class: 'btn primario', href: `#/personajes/p/${c.id}` }, 'Terminar y abrir la hoja');
    raiz.innerHTML = '';
    raiz.appendChild(h('div', { class: 'asistente' },
      h('div', { class: 'cab-asistente' },
        h('h2', null, titulo),
        h('a', { class: 'btn small', href: `#/personajes/p/${c.id}` }, modo === 'nivel' ? 'Volver a la hoja' : 'Guardar y salir')),
      h('div', { class: 'barra-pasos' },
        prev,
        h('nav', { class: 'pasos', 'aria-label': 'Pasos' }, seq.map((k, i) => h('a', { href: base + k, class: 'paso-tab' + (k === paso ? ' on' : '') + (i < idx ? ' hecho' : ''), 'aria-current': k === paso ? 'step' : null }, `${i + 1}. ${PJ.PASOS[k].n}`))),
        sig),
      h('div', { class: 'cuerpo-asistente' },
        h('section', { class: 'principal' }, h('h3', { class: 'titulo-paso' }, PJ.PASOS[paso].n),
          PJ.PASOS[paso].fn({ c, d, modo, cambiar, silencioso, ir: k => { location.hash = base + k; } })),
        aside)));
    lateral();
  };
})(window);
