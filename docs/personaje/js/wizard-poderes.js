/* Asistente · pasos Poderes (artes metálicas) y Radiante (Stormlight). */
(function (g) {
  'use strict';
  const PJ = g.PJ;
  const { h, contador, puntos, barra, avisosLista, fila, descCorta, descEquipo, limpioTitulo, hrefEntrada, chipCoste } = PJ.ui;
  const D = () => PJ.datos();
  const W = PJ.wiz = PJ.wiz || {};
  const { NOMBRE_ARTE, botonSel, cortaMetal, defDesbloqueado, metalPorSlug, panelMetal } = W;
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
  function pasoRadiante({ c, d, cambiar, silencioso }) {
    const r = d.radiante, Dt = PJ.datos();
    if (!r) {
      return h('div', { class: 'paso' },
        h('p', { class: 'muted' }, 'Todavía no eres Radiante. Desde el nivel 2 puedes elegir el talento de Primer Ideal de una de las órdenes (paso «Talentos»); con él obtienes Investidura y la meta de pronunciar el Primer Ideal.'),
        h('p', { class: 'muted' }, 'Hasta entonces puedes ir atrayendo a un spren con la DJ y anotarlo en Conexiones (paso «Historia»).'),
        h('ul', { class: 'lista talentos' }, Dt.ordenes.map(a => fila({
          panel: { etiqueta: 'Camino radiante', title: a.nombre, path: ['Camino radiante'],
            facts: [['Spren', a.spren], ['Potencias', a.potencias.map(p => PJ.POTENCIAS[p].n).join(' y ')], ['Filosofía', a.filosofia]],
            body: (Dt.byId[a.talento_principal] ? descCorta(Dt.byId[a.talento_principal]) : ''), href: `index.html#/arbol/${a.slug}` },
          titulo: a.nombre, corta: `${a.spren} · ${a.potencias.map(p => PJ.POTENCIAS[p].n).join(' y ')}. ${a.filosofia}`,
        }))));
    }
    const orden = Dt.arbol[r.orden];
    const ideales = [];
    for (let k = 1; k <= Math.max(1, r.maxPoseido); k++) {
      const tiene = k <= r.maxPoseido;
      const hitos = (c.radiante.hitos || {})[k] || 0;
      const dicho = r.ideales >= k;
      const prev = k === 1 || r.ideales >= k - 1;
      ideales.push(fila({
        titulo: `${PJ.IDEALES[k - 1]} Ideal`,
        corta: tiene ? 'Meta de Ideal: tres hitos; al completarla pronuncias las Palabras y se desbloquean los beneficios restantes del talento.' : `Aún no tienes el talento del ${PJ.IDEALES[k - 1]} Ideal.`,
        on: dicho, bloq: !tiene,
        accion: tiene ? [
          PJ.ui.puntos(hitos, { n: 3, etiqueta: `Hitos del ${PJ.IDEALES[k - 1]} Ideal`, dis: dicho, alCambiar: v => cambiar(c => { c.radiante.hitos[k] = v; }) }),
          h('label', { class: 'chk' }, h('input', {
            type: 'checkbox', checked: dicho, disabled: !dicho && !prev,
            onchange: e => cambiar(c => { c.radiante.ideales = e.target.checked ? k : k - 1; if (e.target.checked) c.radiante.hitos[k] = 3; }),
          }), ' Pronunciado')] : [],
      }));
    }
    const sinHitos = r.ideales < 1;
    return h('div', { class: 'paso' },
      h('div', { class: 'datos-arte' },
        h('span', null, h('b', null, 'Orden '), orden.nombre),
        h('span', null, h('b', null, 'Spren '), r.spren || '—'),
        h('span', null, h('b', null, 'Investidura '), d.investidura === null ? '—' : String(d.investidura))),
      r.filosofia ? h('p', { class: 'nota' }, 'Filosofía: ' + r.filosofia) : null,
      h('div', { class: 'form' },
        h('label', null, 'Tu spren (nombre o tipo, opcional)', h('input', { type: 'text', value: c.radiante.spren || '', oninput: e => silencioso(c => { c.radiante.spren = e.target.value; }) }))),
      h('h3', null, 'Ideales'),
      h('ul', { class: 'lista talentos' }, ideales),
      h('h3', null, 'Potencias'),
      sinHitos ? h('p', { class: 'muted' }, 'Las potencias de tu orden llegan al pronunciar el Primer Ideal, con 1 grado gratuito en cada una (suben en el paso «Habilidades» como cualquier otra).') : null,
      h('ul', { class: 'lista talentos' }, r.potencias.map(p => {
        const P = PJ.POTENCIAS[p], x = d.habilidades[P.n], arte = Dt.byId['habilidad-stormlight-' + p];
        const esc = x ? PJ.escaladoPotencia(x.grados) : null;
        return fila({
          ref: arte ? arte.id : null, titulo: P.n,
          corta: `${PJ.ATR[P.a].n}` + (x ? ` · ${x.grados} grado${x.grados === 1 ? '' : 's'} · modificador ${x.mod >= 0 ? '+' : ''}${x.mod} · dado ${esc.dado} · tamaño ${esc.tamano}` : ' · bloqueada hasta pronunciar el Primer Ideal'),
          on: !!x, bloq: !x,
          accion: h('a', { class: 'btn small', href: `index.html#/arbol/${p}`, target: '_blank', rel: 'noopener' }, 'Árbol'),
        });
      })),
      h('p', { class: 'muted' }, 'Con un talento de Primer Ideal obtienes también las acciones Absorber luz tormentosa, Aumentar y Revitalizar (están en la pestaña «Acciones» de la hoja).'));
  }

  Object.assign(W, { pasoPoderes, pasoRadiante });
})(window);
