/* Reglas del Manual de Mistborn necesarias para la hoja de personaje (escritas a mano; los textos del libro mandan).
   Funciona en navegador (window.PJ) y en Node (vm con ctx.window = ctx). */
(function (g) {
  'use strict';
  const PJ = g.PJ = g.PJ || {};

  PJ.ATRIBUTOS = [
    { k: 'fuerza', n: 'Fuerza', a: 'FUE' },
    { k: 'velocidad', n: 'Velocidad', a: 'VEL' },
    { k: 'intelecto', n: 'Intelecto', a: 'INT' },
    { k: 'voluntad', n: 'Voluntad', a: 'VOL' },
    { k: 'discernimiento', n: 'Discernimiento', a: 'DIS' },
    { k: 'presencia', n: 'Presencia', a: 'PRE' },
  ];
  PJ.ATR = Object.fromEntries(PJ.ATRIBUTOS.map(a => [a.k, a]));

  PJ.HABILIDADES = {
    Atletismo: 'fuerza', 'Armamento pesado': 'fuerza',
    Agilidad: 'velocidad', 'Armamento ligero': 'velocidad', Hurto: 'velocidad', Sigilo: 'velocidad',
    Deducción: 'intelecto', Feruquimia: 'intelecto', Manufactura: 'intelecto', Medicina: 'intelecto', Saber: 'intelecto',
    Alomancia: 'voluntad', Disciplina: 'voluntad', Intimidación: 'voluntad',
    Percepción: 'discernimiento', Perspicacia: 'discernimiento', Supervivencia: 'discernimiento',
    Engaño: 'presencia', Liderazgo: 'presencia', Persuasión: 'presencia',
  };
  PJ.HAB_ARTES = ['Alomancia', 'Feruquimia'];

  PJ.DEFENSAS = [
    { k: 'fisica', n: 'Defensa física', a: ['fuerza', 'velocidad'] },
    { k: 'cognitiva', n: 'Defensa cognitiva', a: ['intelecto', 'voluntad'] },
    { k: 'espiritual', n: 'Defensa espiritual', a: ['discernimiento', 'presencia'] },
  ];

  PJ.ASCENDENCIAS = {
    humana: { n: 'Humana', arbol: null, auto: [], extraNivel1: true },
    kandra: { n: 'Kandra', arbol: 'ascendencia-kandra', auto: ['talento-forma-natural-principal-de-kandra', 'talento-disfraz-kandra'], puntos: 6, sinNacidosDelMetal: true },
    koloss: { n: 'Sangre koloss', arbol: 'ascendencia-de-sangre-koloss', auto: ['talento-resistencia-koloss-principal-de-sangre-koloss'], maxCreacion: { fuerza: 4 }, maxAtributo: { fuerza: 1 } },
  };

  // Ascendencias por ámbito. `extraNivel1`: talento adicional ya en el nivel 1 (humana: de un camino heroico;
  // cantora: uno de los talentos de formas iniciales, junto a Cambiar de forma, que es automático).
  PJ.ASCENDENCIAS_STORMLIGHT = {
    humana: { n: 'Humana', arbol: null, auto: [], extraNivel1: true, origen: 'origen-stormlight-ascendencia-humana' },
    cantora: { n: 'Cantora', arbol: 'ascendencia-cantora', auto: ['talento-cambiar-de-forma-principal-de-cantor'], extraNivel1: true, restrN1: 'formas',origen: 'origen-stormlight-ascendencia-cantora' },
  };
  PJ.ASCENDENCIAS_AMB = { Mistborn: PJ.ASCENDENCIAS, Stormlight: PJ.ASCENDENCIAS_STORMLIGHT };
  PJ.AMBITOS = {
    Mistborn: { n: 'Mistborn', divisa: 'arquillas', Divisa: 'Arquillas' },
    Stormlight: { n: 'Stormlight', divisa: 'marcos', Divisa: 'Marcos' },
  };
  PJ.ambito = c => (PJ.AMBITOS[c && c.ambito] ? c.ambito : 'Mistborn');
  PJ.ascDe = c => { const T = PJ.ASCENDENCIAS_AMB[PJ.ambito(c)]; return T[c && c.ascendencia] || T.humana; };

  // Potencias de Roshar (habilidades que da el Primer Ideal de una orden radiante) y su atributo.
  PJ.POTENCIAS = {
    abrasion: { n: 'Abrasión', a: 'velocidad' }, adhesion: { n: 'Adhesión', a: 'presencia' }, cohesion: { n: 'Cohesión', a: 'voluntad' },
    division: { n: 'División', a: 'intelecto' }, gravitacion: { n: 'Gravitación', a: 'discernimiento' }, iluminacion: { n: 'Iluminación', a: 'presencia' },
    progresion: { n: 'Progresión', a: 'discernimiento' }, tension: { n: 'Tensión', a: 'fuerza' }, transformacion: { n: 'Transformación', a: 'voluntad' },
    transportacion: { n: 'Transportación', a: 'intelecto' },
  };
  PJ.POTENCIA_POR_NOMBRE = Object.fromEntries(Object.entries(PJ.POTENCIAS).map(([k, v]) => [v.n, k]));
  // Escalado de potencias (capítulo 6): grados -> dado y tamaño máximo.
  PJ.escaladoPotencia = grados => {
    const t = [['—', '—'], ['d4', 'Pequeño (0,75 m)'], ['d6', 'Mediano (1,5 m)'], ['d8', 'Grande (3 m)'], ['d10', 'Enorme (4,5 m)'], ['d12', 'Gargantuesco (6 m)']];
    const [dado, tamano] = t[Math.max(0, Math.min(5, grados))];
    return { dado, tamano };
  };
  PJ.IDEALES = ['Primer', 'Segundo', 'Tercer', 'Cuarto'];

  PJ.BENDICIONES = {
    consciencia: { n: 'Bendición de la Consciencia', atr: { discernimiento: 2 }, max: { discernimiento: 2 } },
    potencia: { n: 'Bendición de la Potencia', atr: { fuerza: 1, velocidad: 1 }, max: { fuerza: 1, velocidad: 1 } },
    presencia: { n: 'Bendición de la Presencia', atr: { intelecto: 1, presencia: 1 }, max: { intelecto: 1, presencia: 1 } },
    estabilidad: { n: 'Bendición de la Estabilidad', atr: { voluntad: 2 }, max: { voluntad: 2 } },
    fortaleza: { n: 'Bendición de la Fortaleza', desvio: 1 },
  };

  // Habilidad gratuita por camino inicial (la de los caminos con efecto en los datos se completa en el motor).
  PJ.HAB_INICIAL = {
    agente: 'Perspicacia', cazador: 'Percepción', enviado: 'Disciplina', erudito: 'Saber', guerrero: 'Atletismo', lider: 'Liderazgo',
    brumoso: 'Alomancia', 'nacido-de-la-bruma': 'Alomancia', feruquimista: 'Feruquimia', ferrin: 'Feruquimia', nacidoble: 'Disciplina',
  };
  // Habilidades de arte que añade el talento principal de cada camino de nacido del metal (1 grado gratuito).
  PJ.HAB_PRINCIPAL = {
    brumoso: ['Alomancia'], 'nacido-de-la-bruma': ['Alomancia'], feruquimista: ['Feruquimia'], ferrin: ['Feruquimia'], nacidoble: ['Alomancia', 'Feruquimia'],
  };
  PJ.CAMINOS_HEROICOS = ['agente', 'cazador', 'enviado', 'erudito', 'guerrero', 'lider'];
  PJ.CAMINOS_METAL = ['brumoso', 'nacido-de-la-bruma', 'feruquimista', 'ferrin', 'nacidoble'];
  // Cuántos poderes elige el jugador al empezar con cada camino de nacido del metal.
  PJ.PODERES_INICIALES = {
    brumoso: { alomancia: 1, feruquimia: 0 },
    'nacido-de-la-bruma': { alomancia: 'todos', feruquimia: 0 },
    feruquimista: { alomancia: 0, feruquimia: 'todos' },
    ferrin: { alomancia: 0, feruquimia: 1 },
    nacidoble: { alomancia: 1, feruquimia: 1 },
  };
  PJ.PAREJAS_METALES = [['acero', 'hierro'], ['peltre', 'estano'], ['laton', 'cinc'], ['bronce', 'cobre'], ['cadmio', 'bendaleo'], ['oro', 'electro'], ['cromo', 'nicrosil'], ['duraluminio', 'aluminio']];

  // Culturas (pericias culturales) por era: 0 = ambas.
  PJ.CULTURAS_ERA = {
    Skaa: 1, Luthadel: 1, 'Dominios Interiores': 1, 'Dominio de Terris': 1,
    Elendel: 2, 'Dominios Exteriores': 2, 'Sangre koloss': 2, Malwish: 2, 'Ciudades exteriores': 2, Áridos: 2, 'Enclaves terrisanos': 2,
  };

  // --- Progreso ---
  PJ.rango = n => (n <= 5 ? 1 : n <= 10 ? 2 : n <= 15 ? 3 : n <= 20 ? 4 : 5);
  PJ.gradoMaximo = rango => [0, 2, 3, 4, 5, 5][rango];
  PJ.subidasAtributo = nivel => Math.floor(Math.min(nivel, 18) / 3);
  PJ.gradosTotales = (nivel, elecciones21) => 4 + 2 * (Math.min(nivel, 20) - 1) + (elecciones21 || []).filter(x => x === 'grado').length;
  PJ.saludBase = (nivel, fue) => {
    const cl = (x, a, b) => Math.max(a, Math.min(b, x));
    const gana = 10 + 5 * (Math.min(nivel, 5) - 1) + 4 * cl(nivel - 5, 0, 5) + 3 * cl(nivel - 10, 0, 5) + 2 * cl(nivel - 15, 0, 5) + Math.max(nivel - 20, 0);
    const veces = (nivel >= 1) + (nivel >= 6) + (nivel >= 11) + (nivel >= 16);
    return gana + fue * veces;
  };
  PJ.talentosAscendenciaExtra = (nivel, asc) => {
    const base = (asc && typeof asc === 'object' ? asc.extraNivel1 : asc === 'humana') ? 1 : 0;
    return base + [6, 11, 16, 21].filter(n => nivel >= n).length;
  };
  // Formas de cantor entre las que se elige el talento adicional de nivel 1 de la ascendencia cantora.
  PJ.FORMAS_INICIALES_CANTOR = ['talento-formas-de-delicadeza', 'talento-formas-de-determinacion', 'talento-formas-de-sabiduria'];
  // Huecos de talento de la ascendencia, uno por talento extra (mismo número que talentosAscendenciaExtra).
  // Cada hueco es { texto, arboles | talentos } (manual, «Talentos adicionales de ascendencia»).
  PJ.huecosAscendencia = (nivel, asc) => {
    const out = [];
    if (asc && asc.extraNivel1) {
      out.push(asc.restrN1 === 'formas'
        ? { texto: 'un talento de formas iniciales (delicadeza, determinación o sabiduría)', talentos: PJ.FORMAS_INICIALES_CANTOR }
        : { texto: 'un talento de un camino heroico', arboles: PJ.CAMINOS_HEROICOS });
    }
    for (const n of [6, 11, 16, 21]) {
      if (nivel < n) continue;
      // en todos los rangos: del árbol propio de la ascendencia (si lo tiene) o de un camino heroico
      out.push(asc && asc.arbol
        ? { texto: `un talento del árbol de ${asc.n.toLowerCase()} o de un camino heroico`, arboles: [asc.arbol, ...PJ.CAMINOS_HEROICOS] }
        : { texto: 'un talento de un camino heroico', arboles: PJ.CAMINOS_HEROICOS });
    }
    return out;
  };
  PJ.talentosLibres = (nivel, elecciones21) => (Math.min(nivel, 20) - 1) + (elecciones21 || []).filter(x => x === 'talento').length;

  const tabla = (filas, v) => { for (const [min, val] of filas) if (v >= min) var r = val; return r; };
  PJ.movimiento = vel => tabla([[0, 6], [1, 7.5], [3, 9], [5, 12], [7, 18], [9, 24]], vel);
  PJ.sentidos = dis => tabla([[0, '1,5 m'], [1, '3 m'], [3, '6 m'], [5, '15 m'], [7, '30 m'], [9, 'Sin límite']], dis);
  PJ.dadoRecuperacion = vol => tabla([[0, 'd4'], [1, 'd6'], [3, 'd8'], [5, 'd10'], [7, 'd12'], [9, 'd20']], vol);
  PJ.levantamiento = fue => tabla([[0, 50], [1, 100], [3, 250], [5, 500], [7, 2500], [9, 5000]], fue);
  PJ.carga = fue => PJ.levantamiento(fue) / 2;
  PJ.conexiones = pre => tabla([[0, '1 año'], [1, '50 días'], [3, '5 días'], [5, '1 día'], [7, '1 hora'], [9, 'Tu reputación te precede']], pre);

  // Artes metálicas: grados en la habilidad -> límite / dado / alcance.
  PJ.arteMetalica = grados => {
    const t = [['1 sin tirada', 3], ['d4', 6], ['d6', 12], ['d8', 24], ['d10', 48], ['d12', 96]];
    const g = Math.max(0, grados);
    const [dado, alcance] = g >= 6 ? ['d20', 192] : t[g];
    const limite = g >= 6 ? g : Math.max(1, g);
    return { limite, dado, alcance };
  };
  PJ.cargasFeruquimia = grados => 2 + Math.max(0, grados);

  // Recompensas al empezar en niveles superiores (capítulo 13): { arquillas por era, rangos de recompensa }.
  PJ.recompensasInicio = (nivelInicial, era, ambito) => {
    if (nivelInicial <= 1) return null;
    const r = PJ.rango(nivelInicial);
    const tabla = {
      1: { ar: [100, 200], rec: { 1: 1 } },
      2: { ar: [500, 1000], rec: { 1: 2, 2: 1 } },
      3: { ar: [1000, 2000], rec: { 1: 2, 2: 1, 3: 1 } },
      4: { ar: [2500, 5000], rec: { 1: 2, 2: 1, 3: 1, 4: 1 } },
      5: { ar: [2500, 5000], rec: { 1: 2, 2: 1, 3: 1, 4: 1 } },
    }[r];
    // Stormlight usa la misma escala que la Era 2 de Mistborn (200 / 1.000 / 2.000 / 5.000 marcos)
    return { arquillas: tabla.ar[era === 2 || ambito === 'Stormlight' ? 1 : 0], recompensas: tabla.rec };
  };
})(typeof window !== 'undefined' ? window : globalThis);
