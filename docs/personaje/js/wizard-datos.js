/* Asistente · pasos Datos, Camino, Atributos y Habilidades. */
(function (g) {
  'use strict';
  const PJ = g.PJ;
  const { h, contador, puntos, barra, avisosLista, fila, descCorta, descEquipo, limpioTitulo, hrefEntrada, chipCoste } = PJ.ui;
  const D = () => PJ.datos();
  const W = PJ.wiz = PJ.wiz || {};
  const { CORTA_ASCENDENCIA, CORTA_ASCENDENCIA_STORMLIGHT, ID_ASCENDENCIA, botonSel, cortaCamino, descBendicion, panelBendicion, panelCamino } = W;
  // ------------------------------------------------------------------ pasos
  function pasoDatos({ c, d, modo, cambiar, silencioso }) {
    const rango = PJ.rango(c.nivel);
    const maxBen = 1 + (rango >= 3 ? 1 : 0);
    const stormlight = PJ.ambito(c) === 'Stormlight';
    return h('div', { class: 'paso' },
      h('p', { class: 'muted' }, 'Los datos básicos del personaje. Puedes empezar en un nivel superior al 1: el asistente te pedirá todo lo acumulado hasta ese nivel.'),
      h('div', { class: 'form' },
        h('label', null, 'Nombre', h('input', { type: 'text', value: c.nombre, oninput: e => silencioso(c => { c.nombre = e.target.value; }) })),
        h('label', null, 'Jugador/a', h('input', { type: 'text', value: c.jugador, oninput: e => silencioso(c => { c.jugador = e.target.value; }) })),
        modo === 'crear' ? h('label', null, 'Ambientación',
          h('select', {
            onchange: e => {
              const v = e.target.value;
              const hayElecciones = c.camino || c.talentos.length || c.pericias.length || c.equipo.length || c.armas.length || c.kit;
              if (hayElecciones && !confirm('Cambiar de ambientación borra el camino, los talentos, las pericias y el equipo elegidos. ¿Continuar?')) { e.target.value = PJ.ambito(c); return; }
              cambiar(c => { PJ.cambiarAmbito(c, v); });
            },
          }, Object.entries(PJ.AMBITOS).map(([k, a]) => h('option', { value: k, selected: PJ.ambito(c) === k }, a.n)))) : null,
        stormlight ? null : h('label', null, 'Era',
          h('select', { onchange: e => cambiar(c => { c.era = +e.target.value; PJ.aplicarPoderesIniciales(c); }) },
            h('option', { value: 1, selected: c.era === 1 }, 'Era 1 (Imperio Final)'),
            h('option', { value: 2, selected: c.era === 2 }, 'Era 2 (Elendel)'))),
        h('label', null, 'Nivel',
          h('input', {
            type: 'number', min: 1, max: 30, value: c.nivel,
            onchange: e => cambiar(c => {
              const n = Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 1));
              // sin nada elegido aún es el nivel con el que se crea (pide lo acumulado hasta él); después, es subir o bajar de nivel
              const nuevo = !(c.camino || c.talentos.length || c.pericias.length || c.equipo.length || c.armas.length || c.kit);
              c.nivel = n;
              if (nuevo || n < c.nivelInicial) c.nivelInicial = n;
              c.atributos.subidas = c.atributos.subidas.slice(0, PJ.subidasAtributo(n));
              c.elecciones21 = (c.elecciones21 || []).slice(0, Math.max(0, n - 20));
              while (c.elecciones21.length < Math.max(0, n - 20)) c.elecciones21.push('grado');
              PJ.aplicarPoderesIniciales(c);
            }),
          }))),
      h('h3', null, 'Ascendencia'),
      h('ul', { class: 'lista talentos' }, Object.entries(PJ.ASCENDENCIAS_AMB[PJ.ambito(c)]).map(([k, a]) => {
        const on = c.ascendencia === k;
        return fila({
          ref: stormlight ? a.origen : 'origen-ascendencia-' + ID_ASCENDENCIA[k], titulo: a.n,
          corta: (stormlight ? CORTA_ASCENDENCIA_STORMLIGHT : CORTA_ASCENDENCIA)[k], on,
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
    const stormlight = PJ.ambito(c) === 'Stormlight';
    const kandra = c.ascendencia === 'kandra';
    const carta = slug => {
      const a = arboles[slug]; if (!a) return null;
      const bloqueado = kandra && PJ.CAMINOS_METAL.includes(slug);
      const on = c.camino === slug;
      return fila({
        panel: panelCamino(slug, stormlight), titulo: a.nombre, corta: cortaCamino(slug), on, bloq: bloqueado,
        chips: bloqueado ? h('span', { class: 'chip small mal' }, 'No disponible para kandra') : null,
        accion: on ? h('span', { class: 'chip small' }, 'elegido')
          : h('button', { type: 'button', class: 'btn small', disabled: bloqueado, onclick: () => cambiar(c => { c.camino = slug; PJ.aplicarPoderesIniciales(c); }) }, 'Elegir'),
      });
    };
    if (stormlight) {
      return h('div', { class: 'paso' },
        h('p', { class: 'muted' }, 'Tu camino inicial te da su talento principal y un grado gratuito en una habilidad. Empiezas siempre con un camino heroico.'),
        h('h3', null, 'Caminos heroicos'),
        h('ul', { class: 'lista talentos' }, PJ.CAMINOS_HEROICOS.map(carta)),
        h('p', { class: 'nota' }, 'Los caminos radiantes no se eligen aquí: desde el nivel 2 eliges el talento de Primer Ideal de una orden en el paso de talentos (con permiso de la DJ puedes empezar ya como Radiante).'),
        h('p', null, h('a', { href: 'index.html#/caminos', target: '_blank', rel: 'noopener' }, 'Consultar los caminos en el buscador')));
    }
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
      Object.entries(d.habilidades).filter(([, x]) => x.atributo === a.k).map(([nombre, x]) => {
        return h('div', { class: 'fila' },
          h('span', { class: 'nom' }, nombre, PJ.HAB_ARTES.includes(nombre) ? h('small', { class: 'muted' }, ' (arte metálica)') : null,
            x.potencia ? h('small', { class: 'muted' }, x.bloqueada ? ' (potencia: se desbloquea al pronunciar el Primer Ideal)' : ' (potencia)') : null),
          puntos(x.asignados, {
            etiqueta: nombre, gratis: x.gratis, n: p.max - x.gratis,
            max: x.bloqueada ? 0 : Math.min(p.max - x.gratis, x.asignados + Math.max(0, p.total - p.usados)),
            alCambiar: v => cambiar(c => { if (v) c.habilidades[nombre] = v; else delete c.habilidades[nombre]; }),
          }),
          h('span', { class: 'mod' }, (x.mod >= 0 ? '+' : '') + x.mod));
      })));
    return h('div', { class: 'paso' },
      PJ.pasoElecciones21({ c, cambiar }),
      barra(p.usados, p.total, `grados de habilidad (máximo ${p.max} por habilidad en el rango ${d.rango})`),
      h('p', { class: 'muted' }, 'El modificador es el atributo más los grados. Los grados gratuitos de tu camino no consumen puntos.' +
        (d.radiante ? (d.radiante.ideales >= 1 ? ' Las potencias de tu orden llegan con 1 grado gratuito y suben como cualquier habilidad.' : ' Las potencias de tu orden están bloqueadas hasta pronunciar el Primer Ideal (paso «Radiante»).') : '')),
      h('div', { class: 'grupos' }, grupos),
      avisosLista(d.avisos.filter(a => /grados/.test(a.texto)), ['error']));
  }

  Object.assign(W, { pasoAtributos, pasoCamino, pasoDatos, pasoHabilidades });
})(window);
