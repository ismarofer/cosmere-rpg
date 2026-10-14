/* Hoja de personaje: ficha base + módulos de nacido del metal. En pantalla con pestañas; al imprimir se muestra todo. */
(function (g) {
  'use strict';
  const PJ = g.PJ;
  const { h, contador, barra, avisosLista, enlaceEntrada, descargar, slugNombre, aviso, tarjeta, costeTxt, abre, chipCoste } = PJ.ui;

  const TABS = [['resumen', 'Ficha'], ['acciones', 'Acciones'], ['talentos', 'Talentos'], ['poderes', 'Poderes'], ['equipo', 'Equipo'], ['historia', 'Historia'], ['ajustes', 'Ajustes']];
  let tabActual = 'resumen';
  const signo = n => (n >= 0 ? '+' : '') + n;
  const NOM_ARTE = { alomancia: 'Alomancia', feruquimia: 'Feruquimia' };
  const limpio = t => String(t || '').replace(/\s*\(principal de [^)]*\)\s*/i, '').trim();

  const OBJETIVOS_MANUALES = [
    ['salud_max', 'Salud máxima'], ['concentracion_max', 'Concentración máxima'], ['investidura_max', 'Investidura máxima'],
    ['defensa_fisica', 'Defensa física'], ['defensa_cognitiva', 'Defensa cognitiva'], ['defensa_espiritual', 'Defensa espiritual'],
    ['desvio', 'Desvío'], ['movimiento', 'Movimiento (m)'], ['pericia', 'Número de pericias'],
  ].concat(PJ.ATRIBUTOS.map(a => [a.k, a.n])).concat(Object.keys(PJ.HABILIDADES).concat(Object.values(PJ.POTENCIAS).map(p => p.n)).map(n => ['hab:' + n, 'Habilidad: ' + n]));

  PJ.renderHoja = function (raiz, c) {
    const d = PJ.derivar(c);
    const D = PJ.datos();
    const stormlight = PJ.ambito(c) === 'Stormlight';
    const guardar = () => { if (!PJ.store.guardar(c)) aviso('No se pudo guardar en el navegador. Exporta el personaje a JSON.'); };
    const cambiar = fn => { const y = window.scrollY; fn(c); guardar(); PJ.renderHoja(raiz, c); window.scrollTo(0, y); };
    const silencioso = fn => { fn(c); guardar(); };
    const actual = (v, max) => (v === null || v === undefined ? max : Math.min(v, max));
    const nombreMetal = (arte, slug) => { const m = D.metales[arte].find(x => x.slug === slug); return m ? m.nombre : slug; };

    // ---------------- Resumen
    const caja = (titulo, ...cont) => h('div', { class: 'caja' }, h('div', { class: 'caja-t' }, titulo), ...cont);
    const rec = (nombre, clave, max, extra) => h('div', { class: 'recurso ' + clave },
      h('span', { class: 'rec-n' }, nombre),
      contador(actual(c.estado[clave], max), { min: 0, max, etiqueta: nombre, alCambiar: v => cambiar(c => { c.estado[clave] = v; }) }),
      h('span', { class: 'de' }, '/ ' + max),
      h('button', { type: 'button', class: 'mini noprint', title: 'Restablecer al máximo', onclick: () => cambiar(c => { c.estado[clave] = null; }) }, '↺'),
      extra || null,
      h('span', { class: 'rec-bar', role: 'presentation' }, h('i', { style: `width:${max ? Math.max(0, Math.min(100, actual(c.estado[clave], max) / max * 100)) : 0}%` })));

    const atributo = k => {
      const a = d.atributos[k], n = PJ.ATR[k].n;
      return h('div', { class: 'atr' },
        h('div', { class: 'atr-n' }, n), h('div', { class: 'atr-v' }, String(a.total)),
        a.bendicion + a.bonos ? h('div', { class: 'atr-s muted' }, `base ${a.base}`) : null);
    };

    const recursoDe = k => {
      if (k === 'fisica') return rec('Salud', 'salud', d.salud, h('span', { class: 'desvio', title: 'Desvío' }, h('span', { class: 'rec-n' }, 'Desvío'), h('b', null, String(d.desvio))));
      if (k === 'cognitiva') return rec('Concentración', 'concentracion', d.concentracion);
      return d.investidura !== null ? rec('Investidura', 'investidura', d.investidura) : null;
    };

    const escudo = (valor, titulo) => {
      const e = h('div', { class: 'escudo', title: titulo }, h('span', { class: 'escudo-v' }, String(valor)));
      e.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 48 56" aria-hidden="true" preserveAspectRatio="none"><path d="M4 4H44V28C44 40 35 49 24 53C13 49 4 40 4 28Z"/></svg>');
      return e;
    };

    const habilidadesDe = ak => Object.entries(d.habilidades).filter(([, x]) => x.atributo === ak).map(([n, x]) => {
      const e = x.potencia ? D.byId['habilidad-stormlight-' + PJ.POTENCIA_POR_NOMBRE[n]] : D.base.find(o => o.cat === 'habilidad' && o.title === n);
      return h('div', { class: 'fila' + (x.grados ? ' entrenada' : '') + (x.bloqueada ? ' latente' : '') + (e ? ' clic' : ''), ...(e ? abre(e) : {}) }, h('span', { class: 'nom' }, n),
        h('span', { class: 'grados' }, Array.from({ length: Math.max(x.grados, x.max) }, (_, i) => h('span', { class: 'dot' + (i < x.grados ? ' on' : '') }))),
        h('span', { class: 'mod' }, signo(x.mod)));
    });

    // ---------------- Estados y condiciones
    const estados = () => {
      const catalogo = D.base.filter(e => e.cat === 'estado');
      const lista = c.estado.lista;
      const PARAMS = { 'estado-agotado': ['n'], 'estado-mermado': ['atr', 'n'], 'estado-mejorado': ['atr', 'n'], 'estado-afligido': ['nota'], 'estado-desprovisto': ['nota'] };
      const atrNombre = k => (PJ.ATR[k] || {}).n || k;
      const efecto = s => {
        const n = Math.abs(+s.n || 0);
        if (s.id === 'estado-agotado') return `−${n} a todas las pruebas de habilidad`;
        if (s.id === 'estado-mermado') return `−${n} a ${atrNombre(s.atr)} (no altera las defensas)`;
        if (s.id === 'estado-mejorado') return `+${n} a ${atrNombre(s.atr)}`;
        return '';
      };
      const fila = (s, i) => {
        const e = s.id && D.byId[s.id];
        const params = e ? PARAMS[s.id] || [] : [];
        return h('li', { class: 'estado' },
          e ? h('b', Object.assign({ class: 'est-n clic' }, abre(e)), e.title) : h('b', { class: 'est-n' }, s.nombre || 'Estado'),
          params.includes('atr') ? h('select', { 'aria-label': 'Atributo', onchange: ev => cambiar(c => { c.estado.lista[i].atr = ev.target.value; }) },
            PJ.ATRIBUTOS.map(a => h('option', { value: a.k, selected: s.atr === a.k }, a.n))) : null,
          params.includes('n') ? h('input', { type: 'number', min: 1, class: 'cant', 'aria-label': 'Cantidad', value: s.n || 1, onchange: ev => cambiar(c => { c.estado.lista[i].n = Math.max(1, +ev.target.value || 1); }) }) : null,
          params.includes('nota') ? h('input', { type: 'text', class: 'est-nota', 'aria-label': 'Detalle', placeholder: s.id === 'estado-afligido' ? 'Ej.: 2 de energía' : 'Poder', value: s.nota || '', onchange: ev => silencioso(c => { c.estado.lista[i].nota = ev.target.value; }) }) : null,
          efecto(s) ? h('span', { class: 'muted est-efecto' }, efecto(s)) : null,
          h('button', { type: 'button', class: 'mini noprint', title: 'Quitar', 'aria-label': 'Quitar ' + (e ? e.title : s.nombre), onclick: () => cambiar(c => { c.estado.lista.splice(i, 1); }) }, '×'));
      };
      let elegido = catalogo.length ? catalogo[0].id : '', libre = '';
      const disponibles = catalogo.filter(e => !lista.some(s => s.id === e.id));
      if (disponibles.length) elegido = disponibles[0].id; else elegido = '';
      const anadir = () => {
        if (elegido) {
          const s = { id: elegido };
          const p = PARAMS[elegido] || [];
          if (p.includes('n')) s.n = 1;
          if (p.includes('atr')) s.atr = PJ.ATRIBUTOS[0].k;
          cambiar(c => { c.estado.lista.push(s); });
        } else if (libre.trim()) cambiar(c => { c.estado.lista.push({ id: '', nombre: libre.trim() }); });
      };
      return h('div', null,
        lista.length ? h('ul', { class: 'lista estados' }, lista.map(fila)) : h('p', { class: 'muted' }, 'Sin estados activos.'),
        h('div', { class: 'form fila noprint est-nuevo' },
          h('label', null, 'Añadir estado', h('select', { onchange: ev => { elegido = ev.target.value; } },
            disponibles.map(e => h('option', { value: e.id }, e.title)), h('option', { value: '' }, 'Otro (texto libre)…'))),
          h('label', null, 'Si es libre', h('input', { type: 'text', placeholder: 'Nombre del estado', oninput: ev => { libre = ev.target.value; } })),
          h('button', { type: 'button', class: 'btn', onclick: anadir }, 'Añadir')));
    };

    const resumen = h('section', { class: 'pnl', 'data-tab': 'resumen' },
      h('div', { class: 'tres-reinos' }, PJ.DEFENSAS.map(x => h('div', { class: 'reino reino-' + x.k },
        h('div', { class: 'reino-t' }, x.n.replace(/^Defensa /, '')),
        h('div', { class: 'reino-c' },
          atributo(x.a[0]),
          escudo(d.defensas[x.k], x.n),
          atributo(x.a[1])),
        recursoDe(x.k),
        h('div', { class: 'reino-hab' }, x.a.map(ak => h('div', { class: 'sub-hab' }, h('div', { class: 'sub-t' }, PJ.ATR[ak].n), habilidadesDe(ak))))))),
      h('div', { class: 'rejilla derivados' },
        caja('Movimiento', `${d.movimiento} m`), caja('Sentidos', d.sentidos), caja('Recuperación', d.recuperacion),
        caja('Levantamiento', `${d.levantamiento} kg`), caja('Carga', `${d.carga} kg`), caja('Conexiones', d.conexiones)),
      h('div', { class: 'caja' }, h('div', { class: 'caja-t' }, 'Pericias'),
        d.presupuesto.pericias.usadas ? h('ul', { class: 'lista' }, c.pericias.map(p => h('li', null, p.texto))) : h('p', { class: 'muted' }, 'Sin pericias.')),
      c.bendiciones.length ? caja('Bendiciones kandra', h('ul', { class: 'lista' }, c.bendiciones.map(b => h('li', null, PJ.BENDICIONES[b].n)))) : null,
      h('div', { class: 'caja' }, h('div', { class: 'caja-t' }, 'Estados y condiciones'), estados()),
      d.avisos.length ? h('div', { class: 'caja noprint' }, h('div', { class: 'caja-t' }, 'Avisos'), avisosLista(d.avisos)) : null);

    const FL = PJ.filtrosHoja = PJ.filtrosHoja || { tal: '', accO: '', accT: '' };
    const chips = (opciones, actual, set) => h('div', { class: 'chips filtros-hoja noprint', role: 'group' },
      opciones.map(([v, t]) => h('button', { type: 'button', class: 'chip' + (actual === v ? ' on' : ''), 'aria-pressed': String(actual === v), onclick: () => { set(v); cambiar(() => {}); } }, t)));

    // ---------------- Talentos
    const origenTal = id => { const e = D.byId[id]; return (e && e.f && e.f.origen) || 'Otros'; };
    const origenes = [...new Set(d.talentos.todos.map(origenTal))].sort((a, b) => a.localeCompare(b, 'es'));
    if (FL.tal && !origenes.includes(FL.tal)) FL.tal = '';
    const talVisibles = d.talentos.todos.filter(id => !FL.tal || origenTal(id) === FL.tal);
    const talentos = h('section', { class: 'pnl', 'data-tab': 'talentos' },
      h('h3', null, 'Talentos'),
      origenes.length > 1 ? chips([['', `Todos (${d.talentos.todos.length})`], ...origenes.map(o => [o, `${o} (${d.talentos.todos.filter(id => origenTal(id) === o).length})`])], FL.tal, v => { FL.tal = v; }) : null,
      h('ul', { class: 'lista talentos' }, talVisibles.map(id => {
        const e = D.byId[id];
        if (!e) return h('li', { class: 'talento' }, h('div', { class: 'cab' }, h('strong', { class: 'tit' }, id)));
        return tarjeta(e, {
          antes: e.f && e.f.activacion ? chipCoste(e.f.activacion, e.f.activacion) : null,
          despues: d.talentos.auto.includes(id) ? h('span', { class: 'chip small soft' }, 'automático') : null });
      })));

    // ---------------- Acciones
    const acciones = (() => {
      const poseidos = new Set(d.talentos.todos);
      const activos = new Set();
      for (const arte of stormlight ? [] : ['alomancia', 'feruquimia']) {
        if (!d.artes[arte]) continue;
        for (const p of c.poderes) if (p.arte === arte && p.desbloqueado) activos.add(`${NOM_ARTE[arte]} de ${nombreMetal(arte, p.metal)}`);
      }
      const hayArte = activos.size > 0;
      const secciones = [
        ['Talentos', e => e.f.talento && poseidos.has(e.f.talento)],
        ['Alomancia', e => e.f.origen === 'Alomancia' && activos.has(e.f.contexto)],
        ['Feruquimia', e => e.f.origen === 'Feruquimia' && activos.has(e.f.contexto)],
        ['Radiante', e => e.f.origen === 'Radiante' && !!d.radiante],
        ['Otras', e => e.id === 'accion-beber-vial' ? hayArte : e.f.origen === 'Hemalurgia' && c.hemalurgia.clavos.length > 0],
        ['Generales', e => e.f.origen === 'General'],
      ];
      const etiqueta = e => {
        const t = e.f.talento && D.byId[e.f.talento];
        if (t && t.f && t.f.activacion) return { raw: t.f.activacion, txt: t.f.activacion };
        return { raw: e.f.coste, txt: costeTxt(e.f.coste) };
      };
      const rango = txt => /reacci/i.test(txt) ? 5 : /gratuita/i.test(txt) ? 4 : /^\d/.test(txt) ? parseInt(txt, 10) : 3.5;
      const todas = D.base.filter(e => e.cat === 'accion');
      const TIPOS = [['', 'Cualquier tipo'], ['1', '1 acción'], ['2', '2 acciones'], ['3', '3 acciones'], ['g', 'Gratuita'], ['r', 'Reacción'], ['x', 'Especial']];
      const tipo = txt => /reacci/i.test(txt) ? 'r' : /gratuita/i.test(txt) ? 'g' : /^[123]/.test(txt) ? txt[0] : 'x';
      const usadas = new Set();
      const grupos = [];
      for (const [nombre, test] of secciones) {
        const lista = todas.filter(e => !usadas.has(e.id) && test(e)).map(e => { usadas.add(e.id); return { e, et: etiqueta(e) }; })
          .sort((a, b) => rango(a.et.txt) - rango(b.et.txt));
        if (lista.length) grupos.push({ nombre, lista });
      }
      if (FL.accO && !grupos.some(g => g.nombre === FL.accO)) FL.accO = '';
      const total = grupos.reduce((s, g) => s + g.lista.length, 0);
      const sec = h('section', { class: 'pnl', 'data-tab': 'acciones' }, h('h3', null, 'Acciones'),
        chips([['', `Todas (${total})`], ...grupos.map(g => [g.nombre, `${g.nombre} (${g.lista.length})`])], FL.accO, v => { FL.accO = v; }),
        chips(TIPOS, FL.accT, v => { FL.accT = v; }));
      let visibles = 0;
      for (const { nombre, lista: todasG } of grupos) {
        if (FL.accO && FL.accO !== nombre) continue;
        const lista = todasG.filter(({ et }) => !FL.accT || tipo(et.txt) === FL.accT);
        if (!lista.length) continue;
        visibles += lista.length;
        sec.appendChild(h('h4', null, `${nombre} (${lista.length})`));
        sec.appendChild(h('ul', { class: 'lista talentos' }, lista.map(({ e, et }) => tarjeta(e, {
          clase: 'accion',
          antes: chipCoste(et.raw, et.txt),
          despues: nombre === 'Talentos' || nombre === 'Alomancia' || nombre === 'Feruquimia' ? h('span', { class: 'chip small soft' }, e.f.contexto) : null }))));
      }
      if (!visibles) sec.appendChild(h('p', { class: 'muted' }, 'Ninguna acción coincide con el filtro.'));
      return sec;
    })();

    // ---------------- Poderes
    const radiante = () => {
      const sec = h('section', { class: 'pnl', 'data-tab': 'poderes' });
      const r = d.radiante;
      if (!r) {
        sec.appendChild(h('h3', null, 'Radiante'));
        sec.appendChild(h('p', { class: 'muted' }, 'Este personaje aún no es Radiante. Desde el nivel 2 puede elegir el talento de Primer Ideal de una orden (Talentos del asistente de nivel) y empezar a atraer a un spren.'));
        return sec;
      }
      const sinPotencias = r.ideales < 1;
      sec.appendChild(h('div', { class: 'bloque-arte' }, h('h3', null, r.nombre),
        h('div', { class: 'datos-arte' },
          h('span', null, h('b', null, 'Spren '), (c.radiante && c.radiante.spren) || r.spren || '—'),
          h('span', null, h('b', null, 'Ideales '), `${r.ideales} / ${r.maxPoseido}`),
          h('span', null, h('b', null, 'Investidura '), d.investidura === null ? '—' : String(d.investidura))),
        r.filosofia ? h('p', { class: 'nota' }, r.filosofia) : null,
        h('a', { class: 'enl noprint', href: `index.html#/arbol/${r.orden}`, target: '_blank', rel: 'noopener' }, 'Árbol de la orden')));
      sec.appendChild(h('div', { class: 'bloque-arte' }, h('h3', null, 'Ideales'),
        h('ul', { class: 'lista poderes' }, Array.from({ length: Math.max(1, r.maxPoseido) }, (_, i) => i + 1).map(k => {
          const tiene = k <= r.maxPoseido, dicho = r.ideales >= k, prev = k === 1 || r.ideales >= k - 1;
          return h('li', { class: dicho ? '' : 'latente' }, h('b', null, `${PJ.IDEALES[k - 1]} Ideal`),
            tiene ? PJ.ui.puntos((c.radiante.hitos || {})[k] || 0, { n: 3, etiqueta: `Hitos del ${PJ.IDEALES[k - 1]} Ideal`, dis: dicho, alCambiar: v => cambiar(c => { c.radiante.hitos[k] = v; }) }) : null,
            tiene ? h('label', { class: 'chk noprint' }, h('input', { type: 'checkbox', checked: dicho, disabled: !dicho && !prev,
              onchange: e => cambiar(c => { c.radiante.ideales = e.target.checked ? k : k - 1; if (e.target.checked) c.radiante.hitos[k] = 3; }) }), ' Pronunciado') : null,
            dicho ? null : h('span', { class: 'chip small soft' }, tiene ? 'meta en curso' : 'sin talento'));
        }))));
      sec.appendChild(h('div', { class: 'bloque-arte' }, h('h3', null, 'Potencias'),
        sinPotencias ? h('p', { class: 'muted' }, 'Se obtienen al pronunciar el Primer Ideal.') : null,
        h('ul', { class: 'lista poderes' }, r.potencias.map(p => {
          const P = PJ.POTENCIAS[p], x = d.habilidades[P.n], esc = x ? PJ.escaladoPotencia(x.grados) : null;
          return h('li', { class: x ? '' : 'latente' }, h('b', null, P.n), ` (${PJ.ATR[P.a].n})`,
            x ? h('span', { class: 'datos-arte' },
              h('span', null, h('b', null, 'Grados '), x.grados), h('span', null, h('b', null, 'Mod. '), signo(x.mod)),
              h('span', null, h('b', null, 'Dado '), esc.dado), h('span', null, h('b', null, 'Tamaño '), esc.tamano)) : h('span', { class: 'chip small soft' }, 'latente'),
            h('a', { class: 'enl noprint', href: `index.html#/arbol/${p}`, target: '_blank', rel: 'noopener' }, 'árbol'));
        }))));
      return sec;
    };
    const poderes = stormlight ? radiante() : (() => {
      const sec = h('section', { class: 'pnl', 'data-tab': 'poderes' });
      const arte = (nombre, clave) => {
        const lista = c.poderes.filter(p => p.arte === clave);
        const a = d.artes[clave];
        const bloque = h('div', { class: 'bloque-arte' }, h('h3', null, nombre),
          a ? h('div', { class: 'datos-arte' },
            h('span', null, h('b', null, 'Grados '), a.grados), h('span', null, h('b', null, 'Límite '), a.limite),
            h('span', null, h('b', null, 'Dado '), a.dado), h('span', null, h('b', null, 'Alcance '), a.alcance + ' m'),
            clave === 'feruquimia' ? h('span', null, h('b', null, 'Mentes '), a.mentes) : null) :
            h('p', { class: 'muted' }, `Sin grados en ${nombre}: ${lista.length ? 'tus poderes siguen latentes' : 'no tienes poderes'}.`));
        if (!lista.length) { if (!a) return null; bloque.appendChild(h('p', { class: 'muted' }, 'Todavía sin poderes.')); return bloque; }
        bloque.appendChild(h('ul', { class: 'lista poderes' }, lista.map(p => {
          const m = D.metales[clave].find(x => x.slug === p.metal);
          const idx = c.poderes.indexOf(p);
          return h('li', { class: p.desbloqueado ? '' : 'latente' },
            h('b', null, nombreMetal(clave, p.metal)),
            h('label', { class: 'chk noprint' }, h('input', { type: 'checkbox', checked: p.desbloqueado, onchange: e => cambiar(c => { c.poderes[idx].desbloqueado = e.target.checked; }) }), ' Desbloqueado'),
            p.desbloqueado ? null : h('span', { class: 'chip small soft' }, 'latente'),
            m && m.arbol ? h('a', { class: 'enl noprint', href: `index.html#/arbol/${m.arbol}`, target: '_blank', rel: 'noopener' }, 'árbol') : null,
            clave === 'feruquimia' && p.desbloqueado ? h('span', { class: 'cargas' }, h('b', null, 'Cargas '),
              contador(c.estado.cargas[p.metal] || 0, { min: 0, max: a ? a.cargas : 2, etiqueta: 'Cargas de ' + p.metal, alCambiar: v => cambiar(c => { c.estado.cargas[p.metal] = v; }) }),
              ` / ${a ? a.cargas : 2}`) : null);
        })));
        return bloque;
      };
      const al = arte('Alomancia', 'alomancia'), fe = arte('Feruquimia', 'feruquimia');
      if (al) sec.appendChild(al);
      if (fe) sec.appendChild(fe);
      const clavos = c.hemalurgia.clavos;
      let txt = '';
      sec.appendChild(h('div', { class: 'bloque-arte' }, h('h3', null, 'Hemalurgia'),
        clavos.length ? h('p', { class: 'aviso-hemalurgia' }, '−2 a la Defensa espiritual por llevar clavos hemalúrgicos.') : null,
        clavos.length > 3 ? h('p', { class: 'mal' }, 'Llevas más de 3 clavos: revisa las reglas del libro.') : null,
        h('ul', { class: 'lista' }, clavos.map((k, i) => h('li', null, k.texto, h('button', { type: 'button', class: 'btn small noprint', onclick: () => cambiar(c => { c.hemalurgia.clavos.splice(i, 1); }) }, 'Quitar')))),
        h('div', { class: 'form fila noprint' }, h('label', null, 'Clavo (poder y ubicación)', h('input', { type: 'text', oninput: e => { txt = e.target.value; } })),
          h('button', { type: 'button', class: 'btn', onclick: () => { if (txt.trim()) cambiar(c => { c.hemalurgia.clavos.push({ texto: txt.trim() }); }); } }, 'Añadir'))));
      if (!c.poderes.length && !clavos.length) sec.insertBefore(h('p', { class: 'muted' }, 'Este personaje no tiene poderes de nacido del metal.'), sec.firstChild);
      return sec;
    })();

    // ---------------- Equipo
    const arm = c.armadura && D.byId[c.armadura];
    const kit = c.kit && D.byId[c.kit];
    const equipo = h('section', { class: 'pnl', 'data-tab': 'equipo' },
      h('h3', null, 'Equipo'),
      h('div', { class: 'datos-arte' },
        h('span', null, h('b', null, PJ.AMBITOS[PJ.ambito(c)].Divisa + ' '), h('input', { type: 'number', min: 0, class: 'cant', value: c.arquillas, onchange: e => silencioso(c => { c.arquillas = Math.max(0, +e.target.value || 0); c.arquillasIni = null; }) })),
        h('span', null, h('b', null, 'Peso '), `${d.peso.toFixed(1).replace('.', ',')} / ${d.carga} kg`),
        kit ? h('span', null, h('b', null, 'Conjunto '), enlaceEntrada(kit.id, kit.title.replace(/^Equipo inicial de /i, ''))) : null),
      d.peso > d.carga ? h('p', { class: 'mal' }, 'Llevas más peso que tu capacidad de carga.') : null,
      h('h4', null, 'Armadura'),
      arm ? h('p', null, enlaceEntrada(arm.id), ` · desvío ${arm.f.desvio || 0}`) : h('p', { class: 'muted' }, 'Sin armadura.'),
      h('h4', null, 'Armas'),
      c.armas.length ? h('table', { class: 'tabla' }, h('thead', null, h('tr', null, ['Arma', 'Ataque', 'Daño', 'Rasgos'].map(t => h('th', null, t)))),
        h('tbody', null, c.armas.map(w => {
          const e = w.ref && D.byId[w.ref], f = (e && e.f) || {};
          const hab = d.habilidades[f.habilidad];
          return h('tr', null, h('td', null, e ? enlaceEntrada(e.id) : w.nombre), h('td', null, hab ? signo(hab.mod) : '—'), h('td', null, f.dano || '—'), h('td', null, f.rasgos_txt || ''));
        }))) : h('p', { class: 'muted' }, 'Sin armas.'),
      h('h4', null, 'Objetos'),
      c.equipo.length ? h('table', { class: 'tabla' }, h('thead', null, h('tr', null, ['Cant.', 'Objeto'].map(t => h('th', null, t)))),
        h('tbody', null, c.equipo.map(it => h('tr', null, h('td', null, String(it.cant || 1)), h('td', null, it.ref ? enlaceEntrada(it.ref, it.nombre) : it.nombre))))) : h('p', { class: 'muted' }, 'Sin objetos.'));

    // ---------------- Historia
    const historia = h('section', { class: 'pnl', 'data-tab': 'historia' }, h('h3', null, 'Historia'),
      PJ.ui.historia(c, { silencioso, cambiar, pistas: false }),
      c.recompensas.length ? h('div', null, h('h4', null, 'Recompensas'), h('ul', { class: 'lista' }, c.recompensas.map(r => h('li', null, h('span', { class: 'chip small' }, 'R' + r.rango), ' ', r.texto)))) : null);

    // ---------------- Ajustes
    const efectos = [];
    for (const lista of Object.values(d.bonos)) for (const b of lista) if (b.key) efectos.push({ key: b.key, fuente: b.fuente, texto: b.texto, on: true, valor: b.valor });
    const vistos = new Set();
    for (const n of d.noAplicados) {
      if (!n.aplicable) { const k = n.titulo + '|' + n.texto; if (vistos.has(k)) continue; vistos.add(k); }
      efectos.push({ key: n.key, fuente: n.titulo, texto: n.texto, on: false, info: !n.aplicable });
    }
    let man = { objetivo: 'salud_max', valor: 1, nota: '' };
    const ajustes = h('section', { class: 'pnl noprint', 'data-tab': 'ajustes' }, h('h3', null, 'Ajustes'),
      h('div', { class: 'form' },
        h('label', null, 'Nombre', h('input', { type: 'text', value: c.nombre, onchange: e => cambiar(c => { c.nombre = e.target.value; }) })),
        h('label', null, 'Jugador/a', h('input', { type: 'text', value: c.jugador, onchange: e => silencioso(c => { c.jugador = e.target.value; }) })),
        h('label', null, 'Nivel actual', h('input', { type: 'number', min: 1, max: 30, value: c.nivel, onchange: e => cambiar(c => { c.nivel = Math.max(1, Math.min(30, +e.target.value || 1)); }) })),
        h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: !!c.ignorarPrerreq, onchange: e => cambiar(c => { c.ignorarPrerreq = e.target.checked; }) }), ' Ignorar prerrequisitos de talentos (decisión de la DJ)')),
      h('h4', null, 'Efectos de los talentos'),
      h('p', { class: 'muted' }, 'Los efectos permanentes numéricos se suman solos. Desmarca los que no quieras aplicar. Los demás (condicionales o temporales) son solo informativos.'),
      efectos.length ? h('ul', { class: 'lista efectos' }, efectos.map(x => h('li', { class: x.info ? 'info' : '' },
        x.info ? h('span', { class: 'chip small soft' }, 'info') : h('input', { type: 'checkbox', checked: x.on, onchange: e => cambiar(c => { if (e.target.checked) delete c.efectosOff[x.key]; else c.efectosOff[x.key] = true; }) }),
        ' ', h('b', null, limpio(x.fuente)), ': ', x.texto))) : h('p', { class: 'muted' }, 'Ningún talento aporta efectos.'),
      h('h4', null, 'Bonificaciones manuales'),
      c.manuales.length ? h('ul', { class: 'lista' }, c.manuales.map((m, i) => h('li', null, `${(OBJETIVOS_MANUALES.find(o => o[0] === m.objetivo) || [0, m.objetivo])[1]}: ${signo(+m.valor)}`, m.nota ? ` (${m.nota})` : '',
        h('button', { type: 'button', class: 'btn small', onclick: () => cambiar(c => { c.manuales.splice(i, 1); }) }, 'Quitar')))) : null,
      h('div', { class: 'form fila' },
        h('label', null, 'Valor a modificar', h('select', { onchange: e => { man.objetivo = e.target.value; } }, OBJETIVOS_MANUALES.map(([k, n]) => h('option', { value: k }, n)))),
        h('label', null, 'Cantidad', h('input', { type: 'number', value: 1, class: 'cant', oninput: e => { man.valor = +e.target.value; } })),
        h('label', null, 'Nota', h('input', { type: 'text', oninput: e => { man.nota = e.target.value; } })),
        h('button', { type: 'button', class: 'btn', onclick: () => { if (Number.isFinite(man.valor) && man.valor) cambiar(c => { c.manuales.push(Object.assign({}, man)); }); } }, 'Añadir')),
      h('h4', null, 'Datos'),
      h('div', { class: 'acciones' },
        h('button', { type: 'button', class: 'btn', onclick: () => descargar(`${slugNombre(c.nombre)}.json`, PJ.store.exportar(c)) }, 'Exportar JSON'),
        h('button', { type: 'button', class: 'btn', onclick: () => { const copia = PJ.store.duplicar(c); PJ.store.guardar(copia); location.hash = '#/personajes/p/' + copia.id; } }, 'Duplicar'),
        h('button', { type: 'button', class: 'btn peligro', onclick: () => { if (confirm(`¿Borrar a «${c.nombre || 'Sin nombre'}»? No se puede deshacer.`)) { PJ.store.borrar(c.id); location.hash = '#/personajes'; } } }, 'Borrar personaje')));

    // ---------------- Cabecera y ensamblado
    const sub = [PJ.ascDe(c).n, PJ.ui.nombreCamino(c.camino) || 'sin camino', d.radiante ? d.radiante.nombre : null, stormlight ? 'Stormlight' : `Era ${c.era}`].filter(Boolean).join(' · ');
    const paneles = { resumen, acciones, talentos, poderes, equipo, historia, ajustes };
    const mostrar = k => {
      tabActual = k;
      raiz.querySelectorAll('.pnl').forEach(p => p.classList.toggle('on', p.dataset.tab === k));
      raiz.querySelectorAll('.tab').forEach(t => {
        const on = t.dataset.tab === k;
        t.classList.toggle('on', on);
        if (on && t.parentElement && t.parentElement.scrollWidth > t.parentElement.clientWidth) { const n = t.parentElement; n.scrollLeft = t.offsetLeft - (n.clientWidth - t.offsetWidth) / 2; }   // en pantallas estrechas la fila se desplaza: deja la activa a la vista
      });
    };
    raiz.innerHTML = '';
    raiz.appendChild(h('div', { class: 'hoja', 'data-amb': PJ.ambito(c).toLowerCase() },
      h('header', { class: 'cab-hoja' },
        h('div', null, h('h2', null, c.nombre || 'Personaje sin nombre'), h('div', { class: 'muted' }, `${sub} · nivel ${d.nivel} (rango ${d.rango})` + (c.jugador ? ` · ${c.jugador}` : ''))),
        h('div', { class: 'acciones noprint' },
          h('a', { class: 'btn', href: '#/personajes' }, '← Mis personajes'),
          h('a', { class: 'btn primario', href: `#/personajes/p/${c.id}/crear/datos`, title: 'Edita el personaje; el nivel se cambia en el primer paso' }, 'Editar'))),
      d.pendientes || d.errores ? h('div', { class: 'banda noprint' }, d.errores ? `${d.errores} error(es)` : '', d.errores && d.pendientes ? ' · ' : '', d.pendientes ? `${d.pendientes} pendiente(s) de completar. ` : '',
        h('a', { class: 'subrayado', href: `#/personajes/p/${c.id}/crear/resumen` }, 'Ver en el asistente')) : null,
      h('nav', { class: 'tabs noprint' }, TABS.map(([k, n]) => h('button', { type: 'button', class: 'tab', 'data-tab': k, onclick: () => mostrar(k) }, k === 'poderes' && stormlight ? 'Radiante' : n))),
      TABS.map(([k]) => paneles[k])));
    mostrar(tabActual);
  };
})(window);
