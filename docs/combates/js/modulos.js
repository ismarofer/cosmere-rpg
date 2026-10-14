/* Módulos de adversario (Guía del Mundo de Mistborn, cap. 8): efectos reales sobre un combatiente. Motor puro, sin DOM.
   Los datos (acciones y rasgos de cada módulo) vienen de modulos-datos.js, generado desde el libro. Aquí van las reglas generales de cada
   familia («Cómo usar los módulos de…»): Investidura, habilidades, defensas, desvío y amenaza. */
(function (g) {
  'use strict';
  const CB = g.CB = g.CB || {};

  const FAMILIAS = { alomancia: 'Alomancia', feruquimia: 'Feruquimia', clavo: 'Clavos hemalúrgicos', ascendencia: 'Ascendencia' };
  // Escalado de artes metálicas (tabla del libro): rango 4 o más → 96 m, 1d12.
  const ESCALA = { 1: { alcance: '12 m', dado: '1d6' }, 2: { alcance: '24 m', dado: '1d8' }, 3: { alcance: '48 m', dado: '1d10' }, 4: { alcance: '96 m', dado: '1d12' } };
  const SIN_ACENTOS = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const lista = () => g.CB_MODULOS || [];
  const porId = () => { const m = {}; lista().forEach(x => { m[x.id] = x; }); return m; };
  CB.escalaArtes = (rango) => ESCALA[Math.max(1, Math.min(4, rango || 1))];

  // Los combates guardados antes de estos datos llevaban ids del buscador («modulo-alomancia-de-acero»…): se traducen por nombre.
  function canon(m) {
    if (m.id && m.id.includes(':')) return m.id;
    const n = SIN_ACENTOS(m.nombre || '');
    let r;
    if ((r = /^alomancia de (\w+)/.exec(n))) return 'alomancia:' + r[1];
    if ((r = /^feruquimia de (\w+)/.exec(n))) return 'feruquimia:' + r[1];
    if ((r = /^clavo de (\w+)/.exec(n))) return 'clavo:' + r[1];
    if (n === 'kandra') return 'ascendencia:kandra';
    if (/koloss/.test(n)) return 'ascendencia:koloss';
    if (/medallon/.test(n)) return 'feruquimia:medallon';
    return m.id;
  }

  // Catálogo para elegir: [{ id, nombre, familia, era, rangoMin, ficha }]. `ficha` = id de la entrada del libro para enlazarla (si existe).
  CB.catalogoModulos = (datosDJ) => {
    const ids = new Set((datosDJ || []).map(e => e.id));
    return lista().map(m => {
      const slug = m.metal;
      const cand = m.familia === 'alomancia' ? 'modulo-alomancia-de-' + slug : m.familia === 'feruquimia' ? 'modulo-feruquimia-de-' + slug
        : m.id === 'ascendencia:kandra' ? 'modulo-kandra' : m.id === 'feruquimia:medallon' ? 'modulo-medallones-feruquimicos' : null;
      return { id: m.id, nombre: m.nombre, familia: FAMILIAS[m.familia], clave: m.familia, era: m.era, rangoMin: m.rangoMin, ficha: cand && ids.has(cand) ? cand : null };
    });
  };
  CB.datosModulo = (m) => porId()[canon(m)] || null;

  const attr = (c, adv, k) => {
    const a = c.atributos || (adv && adv.atributos) || {};
    return a[k] || 0;
  };
  const conArte = (c, adv) => c.artesPrevios != null ? c.artesPrevios : !!(adv && adv.investidura > 0);

  // Efectos del conjunto de módulos aplicados. No modifica nada: devuelve lo que hay que mostrar y aplicar.
  CB.efectos = (c, adv) => {
    const P = porId();
    const mods = (c.modulos || []).map(m => P[canon(m)]).filter(Boolean);
    const rango = c.rango || 1;
    const fam = k => mods.filter(m => m.familia === k);
    const alo = fam('alomancia'), fer = fam('feruquimia'), cla = fam('clavo'), asc = fam('ascendencia');
    const e = { mods, habilidades: [], defensas: { fis: 0, cog: 0, esp: 0 }, desvioLaceracion: 0, investidura: null, acciones: [], notas: [], avisos: [], factorAmenaza: 1, escala: null };
    if (!mods.length) return e;

    if (alo.length) {
      e.investidura = 2 + Math.max(attr(c, adv, 'dis'), attr(c, adv, 'pre'));
      e.habilidades.push({ n: 'Alomancia', grados: 1 + rango, mod: 1 + rango + attr(c, adv, 'vol'), nota: 'Voluntad' });
      e.acciones.push({ glifo: '1', n: 'Beber vial', texto: 'Acción de todos los módulos de alomancia.', modulo: 'Alomancia' });
    }
    if (fer.some(m => m.metal !== 'medallon')) e.habilidades.push({ n: 'Feruquimia', grados: 1 + rango, mod: 1 + rango + attr(c, adv, 'int'), nota: 'Intelecto' });
    if (alo.length || fer.some(m => m.metal !== 'medallon') || cla.length) e.escala = CB.escalaArtes(rango);

    if (cla.length) {
      e.defensas.esp -= 2 * cla.length;
      e.notas.push(`Clavos hemalúrgicos (${cla.length}): −${2 * cla.length} a la Defensa espiritual (−2 por clavo).`);
      cla.forEach(m => {
        if (m.metal === 'cinc') { e.defensas.cog += 1; e.notas.push('Clavo de cinc: Voluntad +1, Defensa cognitiva +1, concentración +1 y +1 a Alomancia, Disciplina e Intimidación.'); }
        if (m.metal === 'cobre') { e.defensas.cog += 1; e.notas.push('Clavo de cobre: Intelecto +1, Defensa cognitiva +1 y +1 a Manufactura, Deducción, Saber, Medicina y Feruquimia.'); }
        if (m.metal === 'estano') { e.defensas.esp += 1; e.notas.push('Clavo de estaño: Discernimiento +1, Defensa espiritual +1 y +1 a Perspicacia y Supervivencia.'); }
        if (m.metal === 'hierro') { e.defensas.fis += 1; e.notas.push(`Clavo de hierro: Fuerza +1, Defensa física +1, salud +${rango}, +1 a Atletismo y +1 al ataque y al daño de Acometida.`); }
      });
    }
    if (asc.some(m => m.metal === 'kandra')) {
      e.desvioLaceracion = 5;
      e.habilidades.push({ n: 'Engaño', grados: null, mod: 1 + rango + attr(c, adv, 'pre'), nota: 'Presencia' });
      e.notas.push('Kandra: desvío 5 solo contra el daño por laceración.');
    }

    // Amenaza (cap. 8): +50 % con el primer módulo si el adversario no tenía ya un arte Investido; el de bronce no la aumenta.
    if (!conArte(c, adv) && mods.some(m => m.id !== 'alomancia:bronce')) e.factorAmenaza = 1.5;

    // Avisos de reglas
    if (asc.some(m => m.metal === 'kandra') && (alo.length || fer.length || cla.length)) e.avisos.push('El módulo kandra no puede combinarse con alomancia, feruquimia ni clavos hemalúrgicos.');
    if (asc.length > 1) e.avisos.push('Cada adversario solo puede tener un módulo de ascendencia.');
    if (cla.length > 3) e.avisos.push('Más de tres clavos hemalúrgicos: la mayoría de los personajes no pueden beneficiarse de más de tres.');
    mods.forEach(m => {
      if (m.rangoMin && m.familia === 'clavo' && rango < m.rangoMin) e.avisos.push(`${m.nombre} es de rango ≥${m.rangoMin}; el adversario es de rango ${rango}.`);
      if (m.reglas) e.notas.push(`${m.nombre}: ${m.reglas}`);
    });
    if (conArte(c, adv)) e.notas.push('El adversario ya tenía capacidades Investidas: sus módulos no aumentan la amenaza.');
    return e;
  };

  // Valores de recurso que fija el módulo al añadirlo (solo sube; los retoques manuales posteriores se respetan al quitarlo).
  CB.cambiosModulo = (c, mod, adv) => {
    const cam = {};
    const rango = c.rango || 1;
    if (mod.familia === 'alomancia') {
      const inv = 2 + Math.max(attr(c, adv, 'dis'), attr(c, adv, 'pre'));
      if (c.investidura.max < inv) cam.investidura = { de: c.investidura.max, a: inv };
    } else if (mod.familia === 'clavo') {
      if (mod.metal === 'cinc') cam.concentracion = 1;
      if (mod.metal === 'hierro') cam.salud = rango;
    }
    return cam;
  };

  // Sustituye los cálculos del libro por su valor para el rango del adversario («3 + su rango» → «3 + su rango (= 5)»).
  CB.textoModulo = (t, rango) => String(t || '')
    .replace(/\b3 \+ su rango/g, m => `${m} (= ${3 + rango})`)
    .replace(/Máx\. 1 \+ Rango/g, m => `${m} (= ${1 + rango})`)
    .replace(/\b1 \+ su rango/g, m => `${m} (= ${1 + rango})`);
})(typeof window !== 'undefined' ? window : globalThis);
