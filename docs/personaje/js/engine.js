/* Motor puro (sin DOM): índices de datos, derivación de valores y prerrequisitos. */
(function (g) {
  'use strict';
  const PJ = g.PJ = g.PJ || {};
  const R = PJ;

  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.\s]+$/g, '').replace(/\s+/g, ' ').trim();
  PJ.norm = norm;
  const sinPrincipal = t => String(t).replace(/\s*\(principal de [^)]*\)\s*/i, '').trim();

  // ---------- Índices de datos ----------
  let _D = null;
  PJ.datos = function (force) {
    if (_D && !force) return _D;
    const base = g.DATA_BASE || [];
    const arboles = g.DATA_ARBOLES || [];
    const D = { base, arboles };
    D.byId = Object.fromEntries(base.map(e => [e.id, e]));
    D.arbol = Object.fromEntries(arboles.map(a => [a.slug, a]));
    D.talentos = base.filter(e => e.cat === 'talento');
    D.titulos = new Map();
    for (const t of D.talentos) {
      const k = norm(sinPrincipal(t.title));
      if (!D.titulos.has(k)) D.titulos.set(k, []);
      D.titulos.get(k).push(t.id);
    }
    D.arbolesDe = {};
    for (const a of arboles) for (const id of a.talentos || []) (D.arbolesDe[id] = D.arbolesDe[id] || []).push(a.slug);
    D.esPrincipal = id => !!(D.byId[id] && D.byId[id].x && D.byId[id].x.main);

    // Metales de las artes: según los árboles disponibles
    const disp = {};
    for (const e of base.filter(e => e.cat === 'metal')) disp[norm(e.title)] = e.f || {};
    const metalDe = (arte, prefijo) => arboles.filter(a => a.slug.startsWith(prefijo)).map(a => {
      const slug = a.slug.slice(prefijo.length);
      const nombre = a.nombre.replace(/^(Alomancia|Feruquimia) de /, '');
      return { slug, nombre, arte, arbol: a.slug, sinArbol: false };
    });
    D.metales = { alomancia: metalDe('alomancia', 'alomancia-de-'), feruquimia: metalDe('feruquimia', 'feruquimia-de-') };
    if (!D.metales.alomancia.some(m => m.slug === 'aluminio')) {
      D.metales.alomancia.push({ slug: 'aluminio', nombre: 'Aluminio', arte: 'alomancia', arbol: null, sinArbol: true });
    }
    D.metalEra = (m, era) => {
      const f = disp[norm(m.nombre)];
      if (!f) return true;
      const v = era === 2 ? f.era2_n : f.era1_n;
      return v !== null && v !== undefined;
    };
    D.metalesEra = (arte, era) => D.metales[arte].filter(m => D.metalEra(m, era));

    D.culturas = base.filter(e => e.id.startsWith('origen-pericia-') && !e.id.startsWith('origen-pericias-')).map(e => ({
      id: e.id, nombre: e.title.replace(/^Pericias?\s+/i, ''),
    }));
    D.culturasEra = era => D.culturas.filter(c => { const x = R.CULTURAS_ERA[c.nombre]; return !x || x === era; });
    // Stormlight: las culturas son las «Pericia cultural» de sus orígenes (ids origen-stormlight-pericia-…)
    D.culturasStormlight = base.filter(e => e.ambientacion === 'Stormlight' && e.cat === 'pericia' && e.f && e.f.tipo === 'Pericia cultural').map(e => ({
      id: e.id, nombre: e.title.replace(/^Pericias?\s+/i, ''),
    }));
    D.culturasDe = c => (R.ambito(c) === 'Stormlight' ? D.culturasStormlight : D.culturasEra(c.era));
    // Órdenes radiantes jugables: los caminos radiantes que declaran sus potencias
    D.ordenes = arboles.filter(a => a.tipo === 'Camino radiante' && a.potencias && a.potencias.length);
    _D = D;
    return D;
  };

  // ¿Entra la entrada `e` en el catálogo de este personaje? Stormlight ve Stormlight + Cosmere; Mistborn ve Mistborn
  // (de su era) + Cosmere. Las entradas sin ambientación valen para todos.
  PJ.ambCubre = (c, e) => {
    const a = (e && e.ambientacion) || '';
    if (R.ambito(c) === 'Stormlight') return a === 'Stormlight' || a === 'Cosmere' || a === '';
    if (a === 'Stormlight') return false;
    const m = /Era (\d)/.exec(a);
    return !m || +m[1] === +c.era;
  };

  // ---------- Personaje nuevo ----------
  PJ.nuevoId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  PJ.nuevoPersonaje = function (over) {
    const c = {
      version: 1, id: PJ.nuevoId(), creado: new Date().toISOString(), modificado: new Date().toISOString(),
      nombre: '', jugador: '', ambito: 'Mistborn', era: 1, nivelInicial: 1, nivel: 1,
      ascendencia: 'humana', bendiciones: [], camino: null,
      atributos: { creacion: { fuerza: 0, velocidad: 0, intelecto: 0, voluntad: 0, discernimiento: 0, presencia: 0 }, subidas: [] },
      elecciones21: [], habilidades: {}, pericias: [], talentos: [],
      poderes: [], hemalurgia: { clavos: [] }, recompensas: [],
      kit: null, equipoLibre: false, equipo: [], arquillas: 0, arquillasIni: null, armadura: null, armaduraGratis: false, armas: [], ignorarPrerreq: false,
      historia: { proposito: '', obstaculo: '', metas: [], conexiones: [], aspectoTexto: '', aspectoImg: '', trasfondo: '', notas: '' },
      estado: { salud: null, concentracion: null, investidura: null, cargas: {}, estados: '', lista: [] },
      manuales: [], efectosOff: {}, confirmados: {},
      // Roshar: ideales pronunciados (null = automático: todos los que tengas como talento si empiezas por encima del nivel 1)
      // y hitos de la meta de cada Ideal
      radiante: { ideales: null, hitos: {}, spren: '' },
    };
    return Object.assign(c, over || {});
  };

  // ---------- Prerrequisitos ----------
  const SK = Object.keys(R.HABILIDADES);
  const ATRN = R.ATRIBUTOS.map(a => a.n);
  const SKP = Object.values(R.POTENCIAS).map(p => p.n);
  const reNivel = new RegExp('(' + SK.concat(SKP, ATRN).join('|') + ') (\\d+) o (?:más|superior)', 'g');

  // El PDF parte palabras a final de línea («pro- nunciar»): se recomponen antes de interpretar nada.
  const sinGuiones = t => String(t || '').replace(/(\p{L})- (\p{L})/gu, '$1$2');
  PJ.clausulas = function (texto) {
    return sinGuiones(texto).split(/;|,\s+(?=pronunciar el)/).map(s => s.trim()).filter(s => s && !/^(—|ninguno\.?)$/i.test(s));
  };

  PJ.evaluarClausula = function (cl, ctx, selfId) {
    const D = PJ.datos();
    cl = sinGuiones(cl);
    const res = (estado) => ({ texto: cl, estado });
    let m;
    const grado = n => (ATRN.includes(n) ? ctx.atr[R.ATRIBUTOS.find(a => a.n === n).k] : (ctx.grados[n] || 0));
    // Habilidad / atributo N o más
    const hits = [...cl.matchAll(reNivel)];
    if (hits.length) {
      const oks = hits.map(h => grado(h[1]) >= +h[2]);
      const entre = cl.slice(0, hits[hits.length - 1].index + hits[hits.length - 1][0].length);
      return res((/ o (?=[A-ZÁÉÍÓÚ])/.test(entre) ? oks.some(Boolean) : oks.every(Boolean)) ? 'ok' : 'falta');
    }
    if ((m = cl.match(/^nivel (\d+) o más/i))) return res(ctx.nivel >= +m[1] ? 'ok' : 'falta');
    if ((m = cl.match(/^(?:poder\s+)?(Alomancia|Feruquimia) de ([\wáéíóúñ]+)/i))) {
      return res(ctx.poderes.has(norm(m[1]) + ':' + norm(m[2])) ? 'ok' : 'falta');
    }
    if (/^ascendencia /i.test(cl)) {
      const lo = norm(cl);
      const okH = /humana/.test(lo) && ctx.ascendencia === 'humana';
      const okK = /kandra/.test(lo) && ctx.ascendencia === 'kandra';
      const okS = /koloss/.test(lo) && ctx.ascendencia === 'koloss';
      const okC = /cantora?\b/.test(lo) && ctx.ascendencia === 'cantora';
      return res(okH || okK || okS || okC ? 'ok' : 'falta');
    }
    if ((m = cl.match(/^pronunciar el (Primer|Segundo|Tercer|Cuarto|Quinto) Ideal/i))) {
      const n = R.IDEALES.concat('Quinto').findIndex(x => x.toLowerCase() === m[1].toLowerCase()) + 1;
      return res((ctx.ideales || 0) >= n ? 'ok' : 'falta');
    }
    if (/^no tener ning[uú]n otro talento/i.test(cl)) {
      const otros = ctx.idsPoseidos.filter(id => id !== selfId && D.esPrincipal(id) && (D.arbolesDe[id] || []).some(s => R.CAMINOS_METAL.includes(s)));
      return res(otros.length === 0 ? 'ok' : 'falta');
    }
    if ((m = cl.match(/^talento\s+(?:principal\s+)?(.+)$/i))) {
      const alts = m[1].split(/\s+[ou]\s+(?:talento\s+(?:principal\s+)?)?/i).map(a => norm(a));
      const conocidos = alts.filter(a => D.titulos.has(a));
      if (conocidos.length) return res(conocidos.some(a => ctx.titulos.has(a)) ? 'ok' : 'falta');
    }
    return res('manual');
  };

  PJ.evaluarTalento = function (id, ctx, confirmados) {
    const D = PJ.datos();
    const e = D.byId[id];
    const cls = PJ.clausulas(e && e.f && e.f.prerrequisito).map(c => PJ.evaluarClausula(c, ctx, id));
    const manual = (confirmados || {})[id];
    let cumple = cls.every(c => c.estado === 'ok' || (c.estado === 'manual' && manual));
    const arbolesPoder = (D.arbolesDe[id] || []).map(s => s.match(/^(alomancia|feruquimia)-de-(.+)$/)).filter(Boolean);
    if (arbolesPoder.length && !arbolesPoder.some(m => ctx.poderes.has(m[1] + ':' + m[2]))) {
      cls.unshift({ texto: `Requiere tener desbloqueado el poder ${arbolesPoder.map(m => m[1] + ' de ' + m[2]).join(' o ')}`, estado: 'falta' });
      cumple = false;
    }
    // Un talento de potencia solo es de quien tiene una orden radiante que la maneja
    const potTrees = (D.arbolesDe[id] || []).filter(s => D.arbol[s] && D.arbol[s].tipo === 'Potencia');
    if (potTrees.length && !potTrees.some(s => ctx.potenciasOrden && ctx.potenciasOrden.has(s))) {
      cls.unshift({ texto: `Requiere una orden radiante que maneje ${potTrees.map(s => D.arbol[s].nombre).join(' o ')}`, estado: 'falta' });
      cumple = false;
    }
    if (ctx.sinNacidosDelMetal && (D.arbolesDe[id] || []).some(s => R.CAMINOS_METAL.includes(s) || /^(alomancia|feruquimia)-de-/.test(s) || s === 'metales-de-scadrial')) {
      cls.unshift({ texto: 'Los kandra no pueden elegir talentos de nacidos del metal', estado: 'falta' });
      cumple = false;
    }
    return { clausulas: cls, cumple, pendienteManual: cls.some(c => c.estado === 'manual') && !manual };
  };

  // ---------- Derivación ----------
  const OBJ_FIJOS = ['salud_max', 'concentracion_max', 'investidura_max', 'defensa_fisica', 'defensa_cognitiva', 'defensa_espiritual', 'desvio', 'movimiento'];
  const ATR_KEYS = R.ATRIBUTOS.map(a => a.k);

  function valorEfecto(ef, nivel, rango) {
    let v = ef.valor;
    if (v === 'rango') v = rango;
    else if (typeof v === 'string' && /^\d+×rango$/.test(v)) v = parseInt(v, 10) * rango;
    if (typeof v !== 'number') return null;
    if (ef.por === 'nivel') v *= nivel;
    return v;
  }

  PJ.derivar = function (c) {
    const D = PJ.datos();
    const asc = R.ascDe(c);
    const stormlight = R.ambito(c) === 'Stormlight';
    const nivel = Math.max(1, c.nivel | 0);
    const rango = R.rango(nivel);
    const avisos = [];
    const aviso = (tipo, texto) => avisos.push({ tipo, texto });

    // Talentos poseídos (automáticos + elegidos)
    const auto = [];
    if (c.camino && D.arbol[c.camino] && D.arbol[c.camino].talento_principal) auto.push(D.arbol[c.camino].talento_principal);
    for (const id of asc.auto) auto.push(id);
    const elegidos = (c.talentos || []).filter(id => !auto.includes(id));
    const idsPoseidos = auto.concat(elegidos);

    // Bonos: objetivo -> [{fuente, valor, texto}]
    const bonos = {};
    const noAplicados = [];
    const bono = (obj, valor, fuente, texto, key) => { (bonos[obj] = bonos[obj] || []).push({ fuente, valor, texto, key }); };
    const sumaBonos = obj => (bonos[obj] || []).reduce((s, b) => s + b.valor, 0);

    for (const id of idsPoseidos) {
      const e = D.byId[id];
      if (!e || !e.x || !e.x.efectos) continue;
      e.x.efectos.forEach((ef, i) => {
        const key = id + '#' + i;
        const info = { id, i, key, titulo: e.title, texto: ef.texto, off: !!(c.efectosOff || {})[key] };
        const v = valorEfecto(ef, nivel, rango);
        const objetivo = ef.objetivo;
        const aplicable = ef.permanente && ef.operacion === 'suma' && v !== null &&
          (OBJ_FIJOS.includes(objetivo) || ATR_KEYS.includes(objetivo) || objetivo === 'pericia') && ef.tipo !== 'atributo_max';
        if (aplicable && !info.off) bono(objetivo, v, e.title, ef.texto, key);
        else if (aplicable) noAplicados.push(Object.assign(info, { aplicable: true }));
        else if (ef.tipo === 'atributo_max' && ef.permanente && v !== null) { if (!info.off) bono('max:' + objetivo, v, e.title, ef.texto, key); else noAplicados.push(Object.assign(info, { aplicable: true })); }
        else noAplicados.push(Object.assign(info, { aplicable: false }));
      });
    }
    for (const m of c.manuales || []) if (m && m.objetivo && Number.isFinite(+m.valor)) bono(m.objetivo, +m.valor, 'Manual', m.nota || '');

    // Bendiciones kandra
    const benAtr = {}, benMax = {};
    for (const b of c.bendiciones || []) {
      const B = R.BENDICIONES[b]; if (!B) continue;
      for (const [k, v] of Object.entries(B.atr || {})) benAtr[k] = (benAtr[k] || 0) + v;
      for (const [k, v] of Object.entries(B.max || {})) benMax[k] = (benMax[k] || 0) + v;
      if (B.desvio) bono('desvio', B.desvio, B.n, '');
    }

    // Atributos
    const atributos = {};
    const subidas = (c.atributos && c.atributos.subidas) || [];
    const creacion = (c.atributos && c.atributos.creacion) || {};
    const puntosCreacion = asc.puntos || 12;
    let usadosCreacion = 0;
    for (const a of ATR_KEYS) {
      const cr = creacion[a] || 0;
      usadosCreacion += cr;
      const sub = subidas.filter(x => x === a).length;
      const maxCreacion = (asc.maxCreacion && asc.maxCreacion[a]) || 3;
      const max = 5 + ((asc.maxAtributo && asc.maxAtributo[a]) || 0) + (benMax[a] || 0) + sumaBonos('max:' + a);
      const base = cr + sub;
      const total = base + (benAtr[a] || 0) + sumaBonos(a);
      atributos[a] = { creacion: cr, subidas: sub, base, bendicion: benAtr[a] || 0, bonos: sumaBonos(a), total, max, maxCreacion };
      if (cr > maxCreacion) aviso('error', `${R.ATR[a].n}: máximo ${maxCreacion} puntos en la creación.`);
      if (base + (benAtr[a] || 0) > max) aviso('error', `${R.ATR[a].n} supera el máximo (${max}).`);
    }
    const sub = {
      creacion: { total: puntosCreacion, usados: usadosCreacion },
      subidas: { total: R.subidasAtributo(nivel), usadas: subidas.length },
    };
    if (usadosCreacion > puntosCreacion) aviso('error', `Has repartido ${usadosCreacion} puntos de atributo y solo tienes ${puntosCreacion}.`);
    else if (usadosCreacion < puntosCreacion) aviso('pendiente', `Te faltan ${puntosCreacion - usadosCreacion} puntos de atributo por repartir.`);
    if (subidas.length > sub.subidas.total) aviso('error', `Has aplicado ${subidas.length} mejoras de atributo y solo tienes ${sub.subidas.total}.`);
    else if (subidas.length < sub.subidas.total) aviso('pendiente', `Te faltan ${sub.subidas.total - subidas.length} mejoras de atributo (niveles 3, 6, 9…).`);
    const A = k => atributos[k].total;

    // Habilidades
    const gratis = {};
    if (c.camino) {
      const ini = R.HAB_INICIAL[c.camino];
      if (ini) gratis[ini] = 1;
      for (const s of R.HAB_PRINCIPAL[c.camino] || []) gratis[s] = 1;
    }
    for (const camino of R.CAMINOS_METAL) {
      const a = D.arbol[camino];
      if (a && a.talento_principal && idsPoseidos.includes(a.talento_principal)) for (const s of R.HAB_PRINCIPAL[camino] || []) gratis[s] = Math.max(gratis[s] || 0, 1);
    }
    // Roshar: la orden sale del Primer Ideal que tengas; las potencias llegan al pronunciarlo
    let radiante = null;
    if (stormlight) {
      const arb = D.ordenes.find(a => idsPoseidos.includes(a.talento_principal));
      if (arb) {
        const nIdeal = id => R.IDEALES.findIndex(n => new RegExp('^' + n + ' Ideal', 'i').test((D.byId[id] || {}).title || '')) + 1;
        const poseidos = arb.talentos.filter(id => idsPoseidos.includes(id)).map(nIdeal).filter(Boolean);
        const maxPoseido = poseidos.length ? Math.max(...poseidos) : 0;
        const explicito = c.radiante && Number.isInteger(c.radiante.ideales) ? c.radiante.ideales : null;
        const ideales = Math.max(0, Math.min(maxPoseido, explicito !== null ? explicito : (c.nivelInicial > 1 ? maxPoseido : 0)));
        radiante = { orden: arb.slug, nombre: arb.nombre, spren: arb.spren, filosofia: arb.filosofia, maxPoseido, ideales, potencias: arb.potencias.slice() };
        if (ideales >= 1) for (const p of arb.potencias) gratis[R.POTENCIAS[p].n] = 1;
      }
      if (D.ordenes.filter(a => idsPoseidos.includes(a.talento_principal)).length > 1) {
        aviso('aviso', 'Tienes el Primer Ideal de más de una orden: lo normal es un solo camino radiante (salvo permiso de la DJ).');
      }
    }

    const asignados = c.habilidades || {};
    const gradoMax = R.gradoMaximo(rango);
    const habilidades = {};
    let usadosGrados = 0;
    const lista = Object.entries(R.HABILIDADES).filter(([n]) => !stormlight || !R.HAB_ARTES.includes(n));
    if (radiante) for (const p of radiante.potencias) lista.push([R.POTENCIAS[p].n, R.POTENCIAS[p].a]);
    for (const [nombre, attr] of lista) {
      // una potencia no se puede usar ni mejorar hasta pronunciar el Primer Ideal
      const bloqueada = !!(radiante && R.POTENCIA_POR_NOMBRE[nombre] && radiante.ideales < 1);
      const as = bloqueada ? 0 : (asignados[nombre] || 0);
      const gr = gratis[nombre] || 0;
      const grados = as + gr;
      usadosGrados += as;
      const mod = A(attr) + grados + sumaBonos('hab:' + nombre);
      habilidades[nombre] = { atributo: attr, asignados: as, gratis: gr, grados, mod, max: gradoMax, potencia: !!R.POTENCIA_POR_NOMBRE[nombre], bloqueada };
      if (grados > gradoMax) aviso('error', `${nombre}: ${grados} grados superan el máximo del rango (${gradoMax}).`);
    }
    const totalGrados = R.gradosTotales(nivel, c.elecciones21);
    if (usadosGrados > totalGrados) aviso('error', `Has repartido ${usadosGrados} grados y solo tienes ${totalGrados}.`);
    else if (usadosGrados < totalGrados) aviso('pendiente', `Te faltan ${totalGrados - usadosGrados} grados de habilidad por repartir.`);

    // Elecciones de nivel 21+
    const n21 = Math.max(0, nivel - 20);
    if ((c.elecciones21 || []).length < n21) aviso('pendiente', `Elige grado o talento para ${n21 - c.elecciones21.length} nivel(es) por encima del 20.`);

    // Talentos: presupuesto
    const libres = R.talentosLibres(nivel, c.elecciones21);
    const extra = R.talentosAscendenciaExtra(nivel, asc);
    const talentosTotal = libres + extra;
    const huecosDef = R.huecosAscendencia(nivel, asc);
    const cubiertos = PJ.huecosCubiertos(huecosDef, elegidos);
    const huecos = huecosDef.map((h, i) => ({ texto: h.texto, cubierto: cubiertos[i] }));
    huecos.filter(h => !h.cubierto).forEach(h => aviso('pendiente', `Tu ascendencia exige ${h.texto}.`));
    if (elegidos.length > talentosTotal) aviso('error', `Tienes ${elegidos.length} talentos elegidos y solo ${talentosTotal} disponibles.`);
    else if (elegidos.length < talentosTotal) aviso('pendiente', `Te faltan ${talentosTotal - elegidos.length} talentos por elegir.`);
    if (!c.camino) aviso('pendiente', 'Elige tu camino inicial.');

    // Pericias
    const periciasTotal = 2 + Math.max(0, A('intelecto')) + sumaBonos('pericia');
    const periciasUsadas = (c.pericias || []).length;
    if (periciasUsadas > periciasTotal) aviso('error', `Tienes ${periciasUsadas} pericias y solo ${periciasTotal} disponibles.`);
    else if (periciasUsadas < periciasTotal) aviso('pendiente', `Te faltan ${periciasTotal - periciasUsadas} pericias (2 culturales + Intelecto).`);
    const culturales = (c.pericias || []).filter(p => p.cultural).length;
    if (culturales < 2 && periciasUsadas >= 2) aviso('aviso', 'Se recomiendan 2 pericias culturales.');

    // Contexto de prerrequisitos
    const poderes = new Set((c.poderes || []).filter(p => p.desbloqueado).map(p => p.arte + ':' + p.metal));
    const titulos = new Set(idsPoseidos.map(id => norm(sinPrincipal((D.byId[id] || {}).title))));
    const grados = Object.fromEntries(Object.entries(habilidades).map(([k, v]) => [k, v.grados]));
    const atrTot = Object.fromEntries(ATR_KEYS.map(k => [k, A(k)]));
    const ctxPre = {
      nivel, atr: atrTot, grados, poderes, titulos, idsPoseidos, ascendencia: c.ascendencia, sinNacidosDelMetal: !!asc.sinNacidosDelMetal,
      ideales: radiante ? radiante.ideales : 0, potenciasOrden: new Set(radiante ? radiante.potencias : []),
    };
    for (const id of elegidos) {
      if (c.ignorarPrerreq) break;
      const ev = PJ.evaluarTalento(id, ctxPre, c.confirmados);
      if (!ev.cumple) aviso('aviso', `«${(D.byId[id] || {}).title || id}» no cumple sus prerrequisitos.`);
    }
    const ini = R.PODERES_INICIALES[c.camino];
    if (ini) {
      for (const arte of ['alomancia', 'feruquimia']) {
        const n = ini[arte] === 'todos' ? D.metalesEra(arte, c.era).length : ini[arte];
        const tiene = (c.poderes || []).filter(p => p.arte === arte && p.origen === 'inicial').length;
        if (tiene < n) aviso('pendiente', `Elige ${n - tiene} poder(es) inicial(es) de ${arte === 'alomancia' ? 'Alomancia' : 'Feruquimia'}.`);
      }
    }
    if (c.ascendencia === 'kandra' && c.camino && R.CAMINOS_METAL.includes(c.camino)) aviso('error', 'Los kandra no pueden elegir caminos de nacido del metal.');
    if (c.ascendencia === 'kandra' && !(c.bendiciones || []).length) aviso('pendiente', 'Elige una Bendición kandra.');

    // Valores derivados
    const hemalurgia = ((c.hemalurgia && c.hemalurgia.clavos) || []).length;
    if (hemalurgia) bono('defensa_espiritual', -2, 'Hemalurgia', 'Clavos hemalúrgicos');
    const tieneAlomancia = !stormlight && habilidades.Alomancia.grados > 0;
    const tieneFeruquimia = !stormlight && habilidades.Feruquimia.grados > 0;
    const defensas = {};
    for (const d of R.DEFENSAS) defensas[d.k] = 10 + A(d.a[0]) + A(d.a[1]) + sumaBonos('defensa_' + d.k);
    const armaduraE = c.armadura && D.byId[c.armadura];
    const desvio = (armaduraE ? armaduraE.f.desvio || 0 : 0) + sumaBonos('desvio');
    const salud = R.saludBase(nivel, A('fuerza')) + sumaBonos('salud_max');
    const concentracion = 2 + A('voluntad') + sumaBonos('concentracion_max');
    const investidura = (tieneAlomancia || radiante || sumaBonos('investidura_max')) ? 2 + Math.max(A('discernimiento'), A('presencia')) + sumaBonos('investidura_max') : null;
    const movimiento = R.movimiento(A('velocidad')) + sumaBonos('movimiento');

    let peso = 0;
    for (const it of c.equipo || []) { const e = it.ref && D.byId[it.ref]; if (e && e.f && e.f.peso_g) peso += e.f.peso_g * (it.cant || 1); }
    if (armaduraE && armaduraE.f.peso_g) peso += armaduraE.f.peso_g;
    for (const w of c.armas || []) { const e = w.ref && D.byId[w.ref]; if (e && e.f && e.f.peso_g) peso += e.f.peso_g; }

    const artes = {
      alomancia: tieneAlomancia ? Object.assign({ grados: habilidades.Alomancia.grados }, R.arteMetalica(habilidades.Alomancia.grados)) : null,
      feruquimia: tieneFeruquimia ? Object.assign({ grados: habilidades.Feruquimia.grados, cargas: R.cargasFeruquimia(habilidades.Feruquimia.grados) }, R.arteMetalica(habilidades.Feruquimia.grados)) : null,
    };
    if (artes.feruquimia) artes.feruquimia.mentes = Math.max(1, A('intelecto'));

    return {
      radiante, nivel, rango, atributos, habilidades, defensas, desvio, salud, concentracion, investidura, movimiento,
      sentidos: R.sentidos(A('discernimiento')), recuperacion: R.dadoRecuperacion(A('voluntad')),
      levantamiento: R.levantamiento(A('fuerza')), carga: R.carga(A('fuerza')), peso: peso / 1000,
      conexiones: R.conexiones(A('presencia')),
      presupuesto: {
        atributosCreacion: sub.creacion, atributosSubidas: sub.subidas,
        grados: { total: totalGrados, usados: usadosGrados, max: gradoMax },
        talentos: { total: talentosTotal, usados: elegidos.length, libres, extra, huecosDef, huecos },
        pericias: { total: periciasTotal, usadas: periciasUsadas },
      },
      talentos: { auto, elegidos, todos: idsPoseidos }, ctxPre, bonos, noAplicados, artes,
      recompensasInicio: R.recompensasInicio(c.nivelInicial || 1, c.era, R.ambito(c)),
      avisos,
      pendientes: avisos.filter(a => a.tipo === 'pendiente').length,
      errores: avisos.filter(a => a.tipo === 'error').length,
    };
  };

  // Huecos de talento restringidos por la ascendencia: para cada hueco, si algún talento elegido lo cubre
  // (cada talento cubre como mucho un hueco).
  PJ.huecosCubiertos = function (huecos, ids) {
    const D = PJ.datos();
    const enArbol = id => Object.keys(D.arbol).filter(s => (D.arbol[s].talentos || []).includes(id));
    const usados = new Set();
    return huecos.map(h => {
      const id = ids.find(x => !usados.has(x) && (h.talentos ? h.talentos.includes(x) : enArbol(x).some(s => h.arboles.includes(s))));
      if (id) usados.add(id);
      return !!id;
    });
  };

  // Bloqueo duro: un talento solo se puede elegir si, tras añadirlo, quedan tantos huecos libres como huecos
  // restringidos de la ascendencia sin cubrir.
  PJ.puedeElegirTalento = function (c, d, id) {
    const t = d.presupuesto.talentos;
    const restantes = t.total - t.usados;
    if (restantes <= 0) return false;
    if (c.ignorarPrerreq) return true; // decisión de la DJ: se salta también las restricciones de ascendencia
    const sin = PJ.huecosCubiertos(t.huecosDef, [...d.talentos.elegidos, id]).filter(x => !x).length;
    return sin <= restantes - 1;
  };

  // Talentos disponibles para elegir (lista de entradas con estado de prerrequisitos)
  PJ.talentosElegibles = function (c, d, slugArbol) {
    const D = PJ.datos();
    const a = D.arbol[slugArbol];
    if (!a) return [];
    return (a.talentos || []).map(id => D.byId[id]).filter(e => e && PJ.ambCubre(c, e)).map(e => {
      const ev = PJ.evaluarTalento(e.id, d.ctxPre, c.confirmados);
      return { id: e.id, titulo: e.title, principal: !!(e.x && e.x.main), especialidad: (e.f && e.f.especialidad) || '', activacion: (e.f && e.f.activacion) || '', ev, poseido: d.talentos.todos.includes(e.id) };
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
