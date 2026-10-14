/* Asistente · utilidades compartidas: poderes iniciales, ámbito, paneles de ascendencia, camino y metal. */
(function (g) {
  'use strict';
  const PJ = g.PJ;
  const { h, contador, puntos, barra, avisosLista, fila, descCorta, descEquipo, limpioTitulo, hrefEntrada, chipCoste } = PJ.ui;
  const D = () => PJ.datos();
  const W = PJ.wiz = PJ.wiz || {};

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
  const CORTA_ASCENDENCIA_STORMLIGHT = {
    humana: '12 puntos de atributo; un talento adicional de un camino heroico, ahora y al llegar a cada rango.',
    cantora: '12 puntos de atributo; Cambiar de forma más un talento de formas iniciales; un árbol propio de talentos de forma.',
  };

  // Cambiar de ámbito deja a un lado lo que no se traslada (ascendencia, camino, talentos, pericias, equipo…) y conserva
  // nombre, nivel, atributos e historia.
  PJ.cambiarAmbito = function (c, amb) {
    if (!PJ.AMBITOS[amb] || PJ.ambito(c) === amb) return;
    c.ambito = amb; c.ascendencia = 'humana'; c.bendiciones = []; c.camino = null;
    c.talentos = []; c.pericias = []; c.poderes = []; c.recompensas = []; c.habilidades = {};
    c.kit = null; c.equipoLibre = false; c.equipo = []; c.armas = []; c.armadura = null; c.armaduraGratis = false;
    c.arquillas = 0; c.arquillasIni = null; c.manuales = []; c.efectosOff = {}; c.confirmados = {};
    c.hemalurgia = { clavos: [] }; c.estado.cargas = {}; c.radiante = { ideales: null, hitos: {}, spren: '' };
  };
  const divisa = c => PJ.AMBITOS[PJ.ambito(c)];

  const botonSel = (on, texto, onclick, disabled) =>
    h('button', { type: 'button', class: 'btn small' + (on ? ' peligro' : ''), disabled, onclick }, on ? 'Quitar' : (texto || 'Elegir'));

  const panelBendicion = (key, B) => {
    const origen = D().byId['origen-ascendencia-kandra'];
    const m = origen && origen.body.match(new RegExp(B.n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.(?:\\*\\*)?\\s*([^\\n]*?)(?=\\s*(?:\\*\\*)?Bendici[oó]n de|\\n|$)'));
    return {
      etiqueta: 'Bendición', title: B.n, path: ['Ascendencia kandra'],
      facts: [['Efecto', descBendicion(key)], ['Rango', 'Una en la creación; una segunda al llegar al rango 3']],
      body: m ? m[1].trim() : descBendicion(key),
      href: origen ? hrefEntrada(origen) : null,
    };
  };

  const panelCamino = (slug, stormlight) => {
    const D_ = D(), a = D_.arbol[slug];
    const base = 'camino-como-crear-un-' + slug;
    const tp = D_.byId[a.talento_principal], crear = (stormlight ? D_.byId[base + '-2'] : null) || D_.byId[base];
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

  Object.assign(W, { CORTA_ASCENDENCIA, CORTA_ASCENDENCIA_STORMLIGHT, ID_ASCENDENCIA, KIT_FUGITIVO, KIT_GUARDADOR, NOMBRE_ARTE, accionesMetal, botonSel, cortaCamino, cortaMetal, defDesbloqueado, descBendicion, divisa, metalPorSlug, panelBendicion, panelCamino, panelMetal, talentosMetal });
})(window);
