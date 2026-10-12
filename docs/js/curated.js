/* Contenido curado a mano: ambientaciones, menú, catálogos (columnas/filtros/iconos), secciones de árboles, sinónimos y alias.
   Los datos de los libros salen de tools/build-buscador.py; esto es lo que se edita a mano. */
(function () {
  // Columnas habituales de los catálogos de texto
  const TXT = [
    { k: 'title', l: 'Título', main: true },
    { k: 'sec', l: 'Sección', f: 'select', ic: 'book' },
    { k: 'ext', l: 'Extracto' },
    { k: 'cap', l: 'Capítulo', f: 'select', hide: true, ic: 'book' },
    { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
  ];
  const txt = (extra) => TXT.concat(extra || []);

  window.CURATED = {
    brand: 'Cosmere RPG',

    // Multiplicadores de relevancia por categoría (las mini-reglas y acciones son la respuesta habitual)
    boost: { calculo: 1.9, creacion: 1.6, accion: 1.2, estado: 1.2, habilidad: 1.1, modificador: 0.85, glosario: 0.4 },

    // Iconos de los objetivos de los efectos sobre el personaje (claves de DATA_OBJETIVOS)
    efIcons: { salud_max: 'heart', concentracion_max: 'bulb', investidura_max: 'flame', investidura: 'flame', defensa_fisica: 'shield', defensa_cognitiva: 'shield', defensa_espiritual: 'shield',
      desvio: 'shield', movimiento: 'activity', sentidos: 'sun', fuerza: 'activity', velocidad: 'activity', intelecto: 'bulb', voluntad: 'bulb', discernimiento: 'sun', presencia: 'sun',
      pericia: 'award', grados_habilidad: 'award', habilidad: 'award', reaccion: 'rotate', poder: 'flame', meta: 'compass', talento: 'star', arbol: 'tree', companero: 'users',
      cargas_mente_max: 'coins', dado_mando: 'crown', tamano: 'user', puntos_atributo: 'sliders', recompensa: 'gift', restriccion: 'alert' },

    // Ambientación (id interno: ambientacion) = a qué juego/ambientación pertenece cada entrada. Jerarquía por ruta: lo general (mistborn)
    // aplica a todo lo que cuelga de él. Stormlight ya tiene etiqueta pero aún no contenido: al añadirlo, mapear su ambientación en ambientacionPath.
    ambientaciones: [
      { id: '', label: 'Todo el Cosmere', ic: 'cosmere' },
      { id: 'mistborn/1', label: 'Mistborn · Era 1', ic: 'mistborn' },
      { id: 'mistborn/2', label: 'Mistborn · Era 2', ic: 'mistborn' },
      { id: 'stormlight', label: 'Stormlight', ic: 'stormlight' },
    ],
    ambientacionPath: { 'Mistborn': 'mistborn', 'Mistborn Era 1': 'mistborn/1', 'Mistborn Era 2': 'mistborn/2' },

    // Menú superior y portada (el menú "caminos" se completa con los árboles de talentos)
    menu: [
      { id: 'personaje', label: 'Personaje', ic: 'user', desc: 'Orígenes, habilidades, valores y cálculos, estados',
        // Enlaces que van los primeros, antes de los catálogos del grupo
        lead: [{ label: 'Gestión de Personajes', href: '#/personajes', ic: 'users', sub: 'Crear y gestionar hojas de personaje' }] },
      { id: 'caminos', label: 'Caminos', ic: 'tree', desc: 'Árboles de talentos: heroicos, nacidos del metal, alomancia, feruquimia…', trees: true },
      { id: 'equipo', label: 'Equipo', ic: 'bag', desc: 'Armas, armaduras, objetos y metales' },
      { id: 'reglas', label: 'Reglas', ic: 'book', desc: 'Todas las reglas del juego, una a una, las acciones y reacciones, y los modificadores del personaje' },
      { id: 'mundo', label: 'Mundo', ic: 'globe', desc: 'Guía del Mundo de Scadrial: lugares, personajes y organizaciones, cosmología, historia y glosario. Contiene spoilers.', dj: true },
      { id: 'dj', label: 'Dirección', ic: 'crown', desc: 'Adversarios, módulos, aventura y herramientas de mesa', dj: true,
        // Herramientas de mesa: van tras una línea separadora (como en Caminos). `soon`: aún sin página
        tools: [
          { label: 'Proyector de la mesa', href: '#/proyector', ic: 'mountain', sub: 'Mapas, niebla de guerra y efectos' },
          { label: 'Combates', href: '#/combates', ic: 'swords', sub: 'Amenaza, salud, concentración, Investidura y acciones' },
        ] },
    ],

    // Secciones de árboles de talentos (caminos). Para sumar radiantes: otra sección con su filtro.
    treeSections: [
      { id: 'heroicos', label: 'Caminos heroicos', short: 'Heroicos', ic: 'user', match: { tipo_origen: 'Camino heroico' } },
      { id: 'nacidos-del-metal', label: 'Caminos de nacidos del metal', short: 'Nacidos del metal', ic: 'zap', match: { tipo_origen: 'Camino de nacido del metal' } },
      { id: 'alomancia', label: 'Alomancia', short: 'Alomancia', parent: 'nacidos-del-metal', ic: 'flame', match: { tipo_origen: 'Arte metálica', arte: 'Alomancia' } },
      { id: 'feruquimia', label: 'Feruquimia', short: 'Feruquimia', parent: 'nacidos-del-metal', ic: 'sparkle', match: { tipo_origen: 'Arte metálica', arte: 'Feruquimia' } },
      { id: 'ascendencia', label: 'Ascendencias', short: 'Ascendencias', ic: 'globe', match: { tipo_origen: 'Ascendencia/Cultura' } },
    ],

    // Iconos para valores de columnas (clave 'categoria.columna' o 'columna')
    vicons: {
      'arma.tipo': { 'Cuerpo a cuerpo': 'sword', 'A distancia': 'target' },
      'arma.tipo_dano': { golpe: 'hammer', laceración: 'slash' },
      'arma.familia': { 'De fuego (ligera)': 'flame', 'De fuego (pesada)': 'flame', 'De fuego (especial)': 'flame' },
      'accion.tipo': { 'Acción': 'pip', 'Reacción': 'rotate', 'Acción gratuita': 'pipo' },
      'talento.tipo_origen': { 'Camino heroico': 'user', 'Camino de nacido del metal': 'zap', 'Arte metálica': 'flame', 'Ascendencia/Cultura': 'globe' },
      'origen.tipo': { Ascendencia: 'globe', Cultura: 'compass' },
      'lugar.tipo': { Pueblos: 'users', Región: 'compass', 'Lugar de interés': 'mountain' },
      'pnj.tipo': { Personaje: 'user', Organización: 'users' },
      'cosmologia.tipo': { Cosmología: 'sparkle', Religión: 'sun', 'Artes metálicas': 'flame' },
      'historia.tipo': { Historia: 'bookmark', 'El mundo en cada era': 'globe' },
      'pericia.tipo': { 'Pericia cultural': 'globe', 'Pericia en arma': 'sword', 'Pericia en armadura': 'shield', 'Pericia de utilidad': 'hammer', 'Pericia especializada': 'star' },
      'rasgo.aplica': { 'Armas': 'sword', 'Armaduras': 'shield' },
      'adversario.rol': { Secuaz: 'user', Rival: 'swords', Jefe: 'crown' },
      'habilidad.defensa': { 'Física': 'activity', 'Cognitiva': 'bulb', 'Espiritual': 'sun' },
      'habilidad.atributo': { Fuerza: 'activity', Velocidad: 'activity', Intelecto: 'bulb', Voluntad: 'bulb', Discernimiento: 'sun', Presencia: 'sun' },
      'calculo.depende': { Fuerza: 'activity', Velocidad: 'activity', Intelecto: 'bulb', Voluntad: 'bulb', Discernimiento: 'sun', Presencia: 'sun', Armadura: 'shield', Nivel: 'award' },
      'ambientacion': { 'Mistborn': 'mistborn', 'Mistborn Era 1': 'mistborn', 'Mistborn Era 2': 'mistborn', 'Stormlight': 'stormlight' },
    },
    // Columnas cuyo valor se pinta con el glifo de coste de acción
    actCols: ['activacion', 'coste'],

    catalogs: [
      // ------------------------------------------------------------------ Personaje
      {
        id: 'calculo', label: 'Valores y cálculos', group: 'personaje', ord: 6, ic: 'sliders',
        desc: 'Mini-reglas: cómo se calcula la salud, la concentración, la Investidura, el movimiento, las defensas…',
        cols: [
          { k: 'title', l: 'Valor', main: true },
          { k: 'formula', l: 'Cálculo', ic: 'sliders' },
          { k: 'depende', l: 'Depende de', f: 'chips', list: true, ic: 'activity' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ],
      },
      {
        id: 'habilidad', label: 'Habilidades', group: 'personaje', ord: 4, ic: 'award',
        desc: 'Las habilidades del juego con su atributo y defensa asociados.',
        cols: [
          { k: 'title', l: 'Habilidad', main: true },
          { k: 'atributo', l: 'Atributo', f: 'chips', ic: 'activity' },
          { k: 'defensa', l: 'Defensa', f: 'chips', ic: 'shield' },
          { k: 'tipo', l: 'Tipo', f: 'chips', ic: 'award' },
          { k: 'ext', l: 'Extracto' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ],
      },
      {
        id: 'modificador', label: 'Modificadores del personaje', group: 'reglas', ord: 3, ic: 'modif',
        desc: 'Todo lo que cambia algo del personaje (salud, defensas, pericias, poderes…): talentos, ascendencias, caminos y armaduras.',
        cols: [
          { k: 'title', l: 'Fuente → qué modifica', main: true },
          { k: 'objetivo', l: 'Modifica', f: 'chips', ic: 'modif' },
          { k: 'valor', l: 'Valor' },
          { k: 'cuando', l: 'Cuándo', f: 'chips', ic: 'pip' },
          { k: 'fuente_tipo', l: 'Fuente', f: 'chips', ic: 'tree' },
          { k: 'origen', l: 'Camino / arte', f: 'select', ic: 'tree' },
          { k: 'ext', l: 'Texto del libro' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ],
      },
      { id: 'origen', label: 'Orígenes', group: 'personaje', ord: 2, ic: 'globe', desc: 'Lo que se elige al crear el personaje: ascendencias (la kandra incluye sus Bendiciones) y culturas.', cols: [
        { k: 'title', l: 'Título', main: true },
        { k: 'tipo', l: 'Tipo', f: 'chips', ic: 'globe' },
        { k: 'ext', l: 'Extracto' },
        { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
      ] },
      {
        id: 'pericia', label: 'Pericias', group: 'personaje', ord: 5, ic: 'award',
        desc: 'Las pericias que nombra el manual: culturales, en arma, en armadura, de utilidad y especializadas. No hay lista cerrada: con permiso de la DJ puedes crear otras.',
        cols: [
          { k: 'title', l: 'Pericia', main: true },
          { k: 'tipo', l: 'Tipo', f: 'chips', ic: 'award' },
          { k: 'ext', l: 'Extracto' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ],
      },

      // ------------------------------------------------------------------ Caminos
      {
        id: 'talento', label: 'Talentos', group: 'caminos', ic: 'star',
        desc: 'Talentos de caminos, nacidos del metal, artes metálicas y ascendencias.',
        cols: [
          { k: 'title', l: 'Talento', main: true },
          { k: 'tipo_origen', l: 'Tipo', f: 'chips', ic: 'tree' },
          { k: 'origen', l: 'Camino / arte / origen', f: 'select', ic: 'tree' },
          { k: 'habilidad', l: 'Habilidad requerida', f: 'select', ic: 'award' },
          { k: 'grados', l: 'Grados', t: 'num', f: 'range', narrow: true },
          { k: 'activacion', l: 'Activación', f: 'chips', ic: 'pip' },
          { k: 'modifica', l: 'Modifica al personaje', f: 'chips', list: true, ic: 'modif' },
          { k: 'prerrequisito', l: 'Prerrequisito', f: 'text', hide: true },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ],
      },
      { id: 'camino', label: 'Textos de caminos', group: null /* fuera del menú: se ve en la página de cada camino */, ic: 'book', desc: 'Cómo crear cada camino, especialidades, talentos principales, historia, personajes icónicos y tablas de determinación al azar.', cols: txt() },

      // ------------------------------------------------------------------ Equipo
      {
        id: 'arma', label: 'Armas', group: 'equipo', ic: 'sword',
        desc: 'Armas cuerpo a cuerpo, a distancia, especiales y de fuego (Era 2).',
        cols: [
          { k: 'title', l: 'Arma', main: true },
          { k: 'familia', l: 'Familia', f: 'chips', ic: 'sword' },
          { k: 'tipo', l: 'Tipo', f: 'chips', ic: 'target' },
          { k: 'habilidad', l: 'Habilidad', f: 'chips', hide: true, ic: 'award' },
          { k: 'dano', l: 'Daño', f: 'text', ic: 'hammer' },
          { k: 'tipo_dano', l: 'Tipo de daño', f: 'chips', hide: true, ic: 'slash' },
          { k: 'alcance', l: 'Alcance' },
          { k: 'alcance_largo', l: 'Alcance largo (m)', t: 'num', f: 'range', hide: true, ic: 'target' },
          { k: 'rasgos', l: 'Rasgos', f: 'select', list: true, ic: 'tag' },
          { k: 'experto', l: 'Rasgos de experto', f: 'text', hide: true, ic: 'tag' },
          { k: 'peso', l: 'Peso', fl: 'Peso (en gramos)', sk: 'peso_g', t: 'num', f: 'range', fk: 'peso_g', ic: 'box' },
          { k: 'precio', l: 'Precio', fl: 'Precio (en arquillas)', sk: 'precio_n', t: 'num', f: 'range', fk: 'precio_n', ic: 'coins' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', ic: 'globe' },
        ],
      },
      {
        id: 'armadura', label: 'Armaduras', group: 'equipo', ic: 'shield', desc: 'Tipos de armadura.',
        cols: [
          { k: 'title', l: 'Armadura', main: true },
          { k: 'desvio', l: 'Desvío', t: 'num', f: 'range', narrow: true, ic: 'shield' },
          { k: 'rasgos', l: 'Rasgos', f: 'select', list: true, ic: 'tag' },
          { k: 'experto', l: 'Rasgos de experto', f: 'text', ic: 'tag' },
          { k: 'peso', l: 'Peso', fl: 'Peso (en gramos)', sk: 'peso_g', t: 'num', f: 'range', fk: 'peso_g', ic: 'box' },
          { k: 'precio', l: 'Precio', fl: 'Precio (en arquillas)', sk: 'precio_n', t: 'num', f: 'range', fk: 'precio_n', ic: 'coins' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', ic: 'globe' },
        ],
      },
      {
        id: 'equipo', label: 'Equipo', group: 'equipo', ic: 'bag', desc: 'Herramientas y recursos cotidianos (precios en arquillas: ar).',
        cols: [
          { k: 'title', l: 'Objeto', main: true },
          { k: 'peso', l: 'Peso', fl: 'Peso (en gramos)', sk: 'peso_g', t: 'num', f: 'range', fk: 'peso_g', ic: 'box' },
          { k: 'precio', l: 'Precio', fl: 'Precio (en arquillas)', sk: 'precio_n', t: 'num', f: 'range', fk: 'precio_n', ic: 'coins' },
          { k: 'ext', l: 'Descripción' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ],
      },
      {
        id: 'metal', label: 'Metales y viales', group: 'equipo', ic: 'coins', desc: 'Precio de los viales de metales raros.',
        cols: [
          { k: 'title', l: 'Metal', main: true },
          { k: 'era1', l: 'Precio Era 1', sk: 'era1_n', t: 'num', f: 'range', fk: 'era1_n', ic: 'cloud' },
          { k: 'era2', l: 'Precio Era 2', sk: 'era2_n', t: 'num', f: 'range', fk: 'era2_n', ic: 'building' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ],
      },
      {
        id: 'rasgo', label: 'Rasgos de objetos', group: 'equipo', ic: 'tag', desc: 'Rasgos de armas y armaduras.',
        cols: [
          { k: 'title', l: 'Rasgo', main: true },
          { k: 'aplica', l: 'Aplica a', f: 'chips', ic: 'tag' },
          { k: 'ext', l: 'Efecto' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ],
      },

      // ------------------------------------------------------------------ Reglas
      {
        id: 'accion', label: 'Acciones y reacciones', group: 'reglas', ord: 2, ic: 'pip',
        desc: 'Acciones (1-3), reacciones (r) y acciones gratuitas (0): las que tiene todo el mundo y las que dan las artes metálicas. Filtra por origen.',
        cols: [
          { k: 'title', l: 'Nombre', main: true },
          { k: 'origen', l: 'Origen', f: 'chips', ic: 'compass' },
          { k: 'tipo', l: 'Tipo', f: 'chips', ic: 'pip' },
          { k: 'coste', l: 'Coste', f: 'chips', narrow: true, ic: 'pip' },
          { k: 'contexto', l: 'Poder o sección', f: 'select', ic: 'book' },
          { k: 'ext', l: 'Resumen' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ],
      },
      {
        id: 'estado', label: 'Estados', group: 'personaje', ord: 8, ic: 'alert', desc: 'Estados que pueden afectar a un personaje.',
        cols: [{ k: 'title', l: 'Estado', main: true }, { k: 'ext', l: 'Efecto' }, { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' }],
      },
      {
        id: 'regla', label: 'Reglas', group: 'reglas', ord: 1, ic: 'book',
        desc: 'Cada regla del juego, una a una: busca o filtra por tema y asunto.',
        cols: [
          { k: 'title', l: 'Regla', main: true },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
          { k: 'tema', l: 'Tema', f: 'chips', ic: 'book' },
          { k: 'grupo', l: 'Asunto', f: 'chips', ic: 'tag' },
          { k: 'ext', l: 'Extracto' },
        ],
      },

      // ------------------------------------------------------------------ Modo DJ
      {
        id: 'adversario', label: 'Adversarios', group: 'dj', dj: true, ic: 'skull',
        desc: 'Conjuntos de características de la Guía del Mundo.',
        cols: [
          { k: 'title', l: 'Adversario', main: true },
          { k: 'rol', l: 'Rol', f: 'chips', ic: 'swords' },
          { k: 'rango', l: 'Rango', t: 'num', f: 'chips', narrow: true, ic: 'award' },
          { k: 'tamano', l: 'Tamaño', f: 'chips', ic: 'user' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', ic: 'globe' },
          { k: 'salud', l: 'Salud', t: 'num', f: 'range', narrow: true, ic: 'heart' },
          { k: 'concentracion', l: 'Conc.', t: 'num', f: 'range', narrow: true, ic: 'bulb' },
          { k: 'def_fis', l: 'Def. fís.', t: 'num', f: 'range', narrow: true, ic: 'activity' },
          { k: 'def_cog', l: 'Def. cog.', t: 'num', f: 'range', narrow: true, hide: true, ic: 'bulb' },
          { k: 'def_esp', l: 'Def. esp.', t: 'num', f: 'range', narrow: true, hide: true, ic: 'sun' },
          { k: 'desvio', l: 'Desvío', t: 'num', f: 'range', narrow: true, ic: 'shield' },
          { k: 'movimiento', l: 'Mov.', hide: true },
          { k: 'rasgos', l: 'Rasgos', f: 'select', list: true, ic: 'tag' },
          { k: 'acciones', l: 'Acciones', f: 'select', list: true, hide: true, ic: 'pip' },
        ],
      },
      { id: 'modulo', label: 'Módulos de adversario', group: 'dj', dj: true, ic: 'layers', desc: 'Alomancia, feruquimia y clavos hemalúrgicos para adversarios.', cols: txt([{ k: 'familia', l: 'Familia', f: 'chips' }]) },
      { id: 'legado', label: 'Legado (aventura)', group: 'dj', dj: true, ic: 'bookmark', desc: 'Nacidos de la Bruma: Legado. Contiene spoilers.', cols: txt([{ k: 'capitulo', l: 'Parte', f: 'select' }]) },

      // ------------------------------------------------------------------ Mundo (Guía del Mundo; solo Modo DJ: contiene spoilers)
      { id: 'lugar', label: 'Lugares', group: 'mundo', dj: true, ord: 1, ic: 'mountain', desc: 'Regiones y culturas de Scadrial y lugares de interés de cada era.',
        cols: [
          { k: 'title', l: 'Lugar', main: true },
          { k: 'tipo', l: 'Tipo', f: 'chips', ic: 'compass' },
          { k: 'ext', l: 'Extracto' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ] },
      { id: 'pnj', label: 'Personajes y organizaciones', group: 'mundo', dj: true, ord: 2, ic: 'users', desc: 'Aliados, rivales y organizaciones de Scadrial, con su papel en cada era.',
        cols: [
          { k: 'title', l: 'Nombre', main: true },
          { k: 'tipo', l: 'Tipo', f: 'chips', ic: 'user' },
          { k: 'ext', l: 'Extracto' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ] },
      { id: 'cosmologia', label: 'Cosmología y religión', group: 'mundo', dj: true, ord: 3, ic: 'sparkle', desc: 'Adonalsium, las Esquirlas, las artes metálicas como magia del mundo, el Lord Legislador y las religiones de Scadrial.',
        cols: [
          { k: 'title', l: 'Título', main: true },
          { k: 'tipo', l: 'Tipo', f: 'chips', ic: 'sun' },
          { k: 'ext', l: 'Extracto' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ] },
      { id: 'historia', label: 'Historia', group: 'mundo', dj: true, ord: 4, ic: 'bookmark', desc: 'Historia de Scadrial por eras y cómo es el mundo en cada una: sociedad, ciencia y tecnología.',
        cols: [
          { k: 'title', l: 'Título', main: true },
          { k: 'tipo', l: 'Tipo', f: 'chips', ic: 'bookmark' },
          { k: 'ext', l: 'Extracto' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ] },
      { id: 'glosario', label: 'Glosario', group: 'mundo', dj: true, ord: 5, ic: 'book', desc: 'Términos de Scadrial con su pronunciación y su traducción al español.',
        cols: [
          { k: 'title', l: 'Término', main: true },
          { k: 'pronunciacion', l: 'Pronunciación' },
          { k: 'traduccion', l: 'Traducción' },
          { k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' },
        ] },
    ],

    // Entradas especiales (una sola ficha) enlazadas desde el menú
    pages: [
      { id: 'creacion', label: 'Creación de personaje', group: null /* fuera del menú: lo sustituye Gestión de Personajes */, ic: 'clipboard', cat: 'creacion', title: 'Creación de personaje',
        desc: 'Guía de los ocho pasos, con enlaces a cada regla' },
    ],

    // Grupos de sinónimos (una palabra cada uno; se normalizan y reducen a raíz)
    synonyms: [
      ['curar', 'sanar', 'sanacion', 'curacion', 'cura', 'medicina', 'vendar', 'tratar', 'medico', 'sanador'],
      ['ayudar', 'ayuda', 'asistir', 'apoyar', 'asistencia', 'apoyo'],
      ['huir', 'escapar', 'fuga', 'retirada', 'destrabarse', 'retirarse'],
      ['atacar', 'pegar', 'acometida', 'golpear', 'ataque'],
      ['tirada', 'prueba', 'chequeo', 'check'],
      ['adversario', 'enemigo', 'pnj', 'rival', 'monstruo'],
      ['dj', 'master', 'director', 'directora', 'gm'],
      ['salud', 'hp', 'vida', 'puntos'],
      ['concentracion', 'focus', 'foco'],
      ['investidura', 'invest', 'inversion'],
      ['oportunidad', 'opp', 'exito'],
      ['complicacion', 'comp', 'fallo', 'problema'],
      ['ventaja', 'buff', 'advantage'],
      ['desventaja', 'debuff', 'disadvantage'],
      ['estado', 'condicion', 'efecto'],
      ['amenaza', 'dificultad', 'balance', 'equilibrar', 'cr'],
      ['armadura', 'proteccion', 'blindaje', 'defensa'],
      ['arma', 'armas', 'armamento'],
      ['muerte', 'morir', 'muerto', 'mortal'],
      ['lesion', 'herida', 'herido'],
      ['descanso', 'descansar', 'dormir', 'sueno'],
      ['precio', 'coste', 'costo', 'cuesta', 'valor', 'arquillas'],
      ['peso', 'carga', 'kilos', 'kg'],
      ['alomancia', 'alomante', 'quemar'],
      ['feruquimia', 'feruquimista', 'mente'],
      ['pistola', 'revolver', 'fusil', 'rifle', 'escopeta', 'carabina'],
      ['agarrar', 'sujetar', 'inmovilizar', 'apresar'],
      ['empujar', 'derribar', 'tirar'],
      ['esconderse', 'sigilo', 'ocultarse', 'sigiloso'],
      ['cobertura', 'parapeto', 'proteger', 'prevenirse'],
      ['crear', 'creacion', 'personaje', 'ficha'],
      ['movimiento', 'velocidad', 'mover', 'correr'],
    ],

    // Palabras extra por título (clave: título en minúsculas; se normaliza al cargar)
    aliases: {
      'ayudar': 'ayuda asistir apoyar asistencia reaccion aliado',
      'destrabarse': 'huir escapar retirada desengancharse',
      'recuperarse': 'curar descansar respirar',
      'medicina de campo': 'curar sanar vendar tratar herida combate',
      'cuidados continuos': 'curar sanar descanso tratar lesion',
      'resucitación': 'revivir reanimar curar',
      'prevenirse': 'cobertura defensa proteger',
      'obtener ventaja': 'ventaja maniobra finta',
      'elección de adversarios': 'nivel de amenaza dificultad encuentro balancear valor de amenaza',
      'cálculo de la amenaza total': 'nivel de amenaza dificultad encuentro',
      'cómo escalar la amenaza': 'nivel de amenaza rango',
      'escalado de amenazas de adversarios': 'nivel de amenaza tabla rango',
      'cómo decidir la dificultad de la escena': 'nivel de amenaza dificultad facil promedio dificil',
      'configuración de las escenas de combate': 'nivel de amenaza encuentro equilibrar dificultad',
      'oportunidades y complicaciones en combate': 'oportunidad complicacion gastar tabla usos',
      'orden del combate': 'turno rapido lento iniciativa',
      'rondas y turnos': 'turno rapido lento iniciativa',
      'sorpresa': 'emboscada sorprendido',
      'creación de personaje': 'crear personaje nuevo ficha pasos hoja',
      'salud máxima': 'hp vida puntos de golpe calcular',
      'concentración máxima': 'focus calcular',
      'investidura máxima': 'calcular alomancia reserva',
      'valor de movimiento': 'velocidad metros caminar calcular',
      'defensas (física, cognitiva y espiritual)': 'cd calcular clase de dificultad',
      'dado de recuperación': 'descanso recuperar calcular',
    },
  };

  // Fuente (libro o campaña de donde sale la entrada): filtro de todo catálogo que ya filtra por ambientación
  // (decisions/interfaz/fuente-del-contenido-en-listas.md).
  window.CURATED.catalogs.forEach((p) => {
    const i = p.cols ? p.cols.findIndex((c) => c.k === 'ambientacion') : -1;
    if (i >= 0 && !p.cols.some((c) => c.k === 'libro')) p.cols.splice(i + 1, 0, { k: 'libro', l: 'Fuente', f: 'chips', hide: true, ic: 'book' });
  });
})();
