/* Asistente paso a paso: crear y editar un personaje (subir de nivel = cambiar el nivel en el primer paso). Secuencias y carcasa. */
(function (g) {
  'use strict';
  const PJ = g.PJ;
  const { h, contador, puntos, barra, avisosLista, fila, descCorta, descEquipo, limpioTitulo, hrefEntrada, chipCoste } = PJ.ui;
  const D = () => PJ.datos();
  const W = PJ.wiz = PJ.wiz || {};
  // ------------------------------------------------------------------ secuencias
  PJ.PASOS = {
    datos: { n: 'Datos', fn: W.pasoDatos }, camino: { n: 'Camino', fn: W.pasoCamino }, atributos: { n: 'Atributos', fn: W.pasoAtributos },
    habilidades: { n: 'Habilidades', fn: W.pasoHabilidades }, talentos: { n: 'Talentos', fn: W.pasoTalentos }, pericias: { n: 'Pericias', fn: W.pasoPericias },
    poderes: { n: 'Poderes', fn: W.pasoPoderes }, radiante: { n: 'Radiante', fn: W.pasoRadiante }, equipo: { n: 'Equipo', fn: W.pasoEquipo }, recompensas: { n: 'Recompensas', fn: W.pasoRecompensas },
    historia: { n: 'Historia', fn: W.pasoHistoria }, resumen: { n: 'Resumen', fn: W.pasoResumen },
  };
  PJ.secuencia = (modo, c) => {
    const stormlight = PJ.ambito(c) === 'Stormlight';
    const s = ['datos', 'camino', 'atributos', 'habilidades', 'talentos', 'pericias'];
    if (stormlight) { if (PJ.derivar(c).radiante) s.push('radiante'); }
    else if (PJ.CAMINOS_METAL.includes(c.camino)) s.push('poderes');
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
    const base = `#/personajes/p/${c.id}/crear/`;
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
    const titulo = 'Editar personaje';
    const prev = idx > 0 ? h('a', { class: 'btn', href: base + seq[idx - 1], rel: 'prev' }, '← Anterior') : h('span', { class: 'btn-hueco' });
    const sig = idx < seq.length - 1 ? h('a', { class: 'btn primario', href: base + seq[idx + 1], rel: 'next' }, 'Siguiente →') :
      h('a', { class: 'btn primario', href: `#/personajes/p/${c.id}` }, 'Terminar y abrir la hoja');
    raiz.innerHTML = '';
    raiz.appendChild(h('div', { class: 'asistente', 'data-amb': PJ.ambito(c).toLowerCase() },
      h('div', { class: 'cab-asistente' },
        h('h2', null, titulo),
        h('div', { class: 'acciones' },
          h('a', { class: 'btn small', href: '#/personajes' }, '← Mis personajes'),
          h('a', { class: 'btn small', href: `#/personajes/p/${c.id}` }, 'Guardar y salir'))),
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
