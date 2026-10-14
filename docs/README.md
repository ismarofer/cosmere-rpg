# Cosmere RPG · Consulta de reglas

Página estática para consultar las reglas del Cosmere RPG **sin LLM**. Contiene **Mistborn** (Manual y, en Modo DJ, Guía del Mundo y Legado) y **Stormlight** (Manual: orígenes, caminos heroicos y radiantes, potencias, objetos y microrreglas; y, en Modo DJ, la Guía del Mundo de Roshar con su bestiario); cada ambientación se etiqueta con su ámbito. Spec: [specs/buscador-reglas-mistborn.md](../specs/buscador-reglas-mistborn.md).

## Uso

Abre `docs/index.html` en el navegador (funciona con doble clic, sin servidor) o sírvela desde cualquier hosting estático.

**Sin conexión e instalación (PWA).** Servida por HTTP(S), la web registra un *service worker* (`sw.js`) y se puede instalar como aplicación desde el navegador. Con conexión siempre carga la última versión desplegada; sin ella (en la mesa, sin wifi) usa la última copia que cargó, incluidos los datos y los personajes guardados. Con doble clic (`file://`) no hay service worker: funciona igual que siempre.

- **Portada**: el buscador es lo principal; debajo, todas las categorías agrupadas (Personaje · Caminos · Equipo · Reglas · Dirección). El mismo menú está arriba en desplegables.
- **Buscar**: tolera tildes, plurales, erratas y sinónimos. Admite `"frase exacta"`, `-excluir` y `talento: medicina` (limita a una categoría).
- **Catálogos** (`#/c/<categoría>`): tabla con filtros por campo (con iconos), orden por columna, selector de columnas y estado en la URL (se puede guardar o compartir una vista).
- **Caminos** (`#/caminos`): árbol completo de cada camino (`#/arbol/<camino>`), dibujado de arriba abajo, con vista de árbol o de lista, y una página por talento (`#/talento/<id>`) con lo que requiere y lo que desbloquea. Secciones: heroicos, nacidos del metal, alomancia, feruquimia y ascendencias (una por ascendencia: kandra y sangre koloss; la humana solo tiene texto).
- **Panel lateral**: cualquier enlace a una entrada (talento, regla, arma…) se abre en un panel a la derecha sin salir de la página, y se pueden ir abriendo otros sin cerrarlo. Pinchando el título (o «Abrir página») se va a su página propia; se cierra con la X o `Esc`.
- **Creación de personaje**: guía general de los ocho pasos con enlaces, y **Valores y cálculos** (salud, concentración, Investidura, defensas, movimiento, sentidos, dado de recuperación, carga, progreso por nivel…) como mini-reglas.
- **Ambientación**: selector global en la cabecera, junto a «Cosmere RPG» (decisions/interfaz/filtro-ambientacion-en-listas.md). Cambia lo que se ve en todas las páginas, menús y herramientas; ninguna lista tiene filtro propio.
- **Ámbito (detalle)**: cada entrada está etiquetada: *Mistborn* (general), *Mistborn Era 1*, *Mistborn Era 2*, *Stormlight* o *Cosmere* (lo común a todas, fuente «Manual del Juego»; ver [decisions/reglas/contenido-comun-entre-ambientaciones.md](../decisions/reglas/contenido-comun-entre-ambientaciones.md)). Elegir una era muestra lo general más lo de esa era.
- **Modo DJ** (adversarios, módulos y Legado): sin interruptor en pantalla. Se activa abriendo la página con `?dj=1` (`index.html?dj=1`) y se desactiva con `?dj=0`. Se recuerda en el navegador y el parámetro desaparece de la barra de direcciones. Sin él, esos datos ni se cargan.
- **Ambientación por URL**: `?ambientacion=stormlight`, `mistborn/1` (o `mistborn-1`), `mistborn/2` o `cosmere` (equivale a elegirla en la cabecera). Se recuerda en el navegador y el parámetro desaparece de la barra. Se puede combinar con `?dj=1`.

## Estructura

```
docs/
  index.html
  css/styles.css
  js/app-base.js      ← núcleo: estado compartido (window.CosmereApp), visibilidad por ambientación, URL, utilidades
  js/app-ficha.js     ← texto del libro (enlaces, tablas) y fichas de entrada / panel lateral
  js/app-arboles.js   ← caminos y árboles de talentos (construcción, trazado, vistas de camino, árbol y talento)
  js/app-catalogo.js  ← catálogos: tabla filtrable, orden, columnas
  js/app.js           ← menú, portada, búsqueda, router y arranque (se carga el último)
  js/search.js     ← motor de búsqueda (índice invertido, prefijos, erratas, sinónimos)
  js/icons.js      ← iconos SVG y glifos de coste de acción
  js/curated.js    ← editable a mano: ámbitos, menú, catálogos/columnas/iconos, secciones de árboles, sinónimos, alias
  data/base.js     ← GENERADO (público)
  data/dj.js       ← GENERADO (solo Modo DJ)
  personaje/       ← gestor de hojas de personaje (ver abajo)
  manifest.webmanifest, sw.js, img/icon-*.png ← instalación y uso sin conexión (PWA)
  nombres/         ← generador de nombres por cultura (#/nombres, en Dirección): del libro o inventados (Márkov sobre los del Manual)
tools/build-buscador.py   ← genera data/*.js desde resources/**/*.md
tools/buscador_extras.py  ← mini-reglas, guía de creación, grafo de talentos y ámbitos
tools/buscador_stormlight.py ← Stormlight: orígenes del Manual (ascendencias, culturas, pericias culturales)
tools/buscador_stormlight_cantor.py ← Stormlight: árbol de talentos de la ascendencia cantora
tools/buscador_stormlight_objetos.py ← Stormlight: objetos del Manual (armas, armaduras, rasgos, equipo, fabriales) y sus pericias
tools/test-buscador.mjs   ← consultas de regresión (node tools/test-buscador.mjs)
```

## Gestor de hojas de personaje (`personaje/`)

Está integrado en el buscador: menú **Personaje → Gestión de Personajes** (`#/personajes`), bajo la misma cabecera. Funciona con doble clic y reutiliza `data/base.js` y los estilos del buscador (`personaje/index.html` solo redirige). Spec: [specs/gestor-hoja-personaje.md](../specs/gestor-hoja-personaje.md).

- **Asistente de creación** paso a paso (datos, camino, atributos, habilidades, talentos, pericias, poderes, equipo, recompensas si se empieza por encima del nivel 1, historia, resumen) y **asistente de subida de nivel**.
- **Ámbito del personaje** (`ambito`: Mistborn o Stormlight), elegido en el primer paso (por defecto, el de la ambientación de la cabecera). Mistborn trae la era, los caminos de nacido del metal y los poderes alománticos y feruquímicos; Stormlight trae las ascendencias humana y cantora, 13 culturas, el equipo inicial en marcos y el paso **Radiante**: orden (según el talento de Primer Ideal), Ideales con los hitos de su meta y potencias, que llegan con 1 grado al pronunciar el Primer Ideal. Cada ámbito solo ofrece lo suyo más lo común (`Cosmere`); ver [decisions/reglas/personajes-por-ambito.md](../decisions/reglas/personajes-por-ambito.md).
- **Hoja** con pestañas (Ficha, Acciones, Talentos, Poderes, Equipo, Historia, Ajustes). «Acciones» lista lo que el personaje puede hacer (generales, de talentos, de alomancia/feruquimia desbloqueadas, vial y hemalurgia). Las tarjetas de acciones y talentos muestran su descripción corta y, al pulsarlas, abren un panel lateral con la descripción completa (igual que las habilidades de la Ficha, salvo Alomancia y Feruquimia, que no tienen ficha propia en el libro). La Ficha reproduce la hoja en papel: tres columnas (física, cognitiva, espiritual) con atributos, escudo de defensa, recurso y habilidades, más derivados y pericias. Los módulos de brumoso, nacido de la bruma, feruquimista, ferrin, nacidoble y hemalurgia aparecen según el camino. Se imprime desde el navegador.
- El personaje guarda solo las decisiones; los valores derivados se calculan siempre. Se almacena en `localStorage` (`cosmere-personajes-v1`) y se exporta/importa como JSON.
- Los prerrequisitos de talentos se leen de los datos; los que no se pueden evaluar piden confirmación manual, y la DJ puede ignorarlos.
- **Talentos adicionales de ascendencia, con bloqueo duro:** el humano elige su talento adicional de un camino heroico (nivel 1 y rangos 6, 11, 16 y 21); el cantor, uno de formas iniciales en el nivel 1 y, en cada rango, del árbol de cantor o de un camino heroico; kandra y sangre koloss, de su árbol o de un camino heroico a partir del rango 2. El asistente no deja usar el último hueco libre en un talento que no encaje, y lo explica en la propia fila. «Ignorar prerrequisitos (decisión de la DJ)» también levanta este bloqueo.

```
personaje/
  css/personaje.css
  js/rules.js     ← reglas escritas a mano (tablas de progreso, ascendencias, kits…)
  js/engine.js    ← motor puro: PJ.derivar(personaje) → valores, presupuestos y avisos
  js/store.js     ← persistencia e importación/exportación
  js/ui-common.js, sheet.js, app.js   ← app.js expone PJ.montar(el, ruta) para el router del buscador
  js/wizard-*.js, wizard.js           ← asistente: utilidades comunes, pasos por grupos (datos, talentos, poderes, equipo) y
                                        carcasa/secuencias (wizard.js se carga el último; los pasos cuelgan de PJ.wiz)
tools/test-personaje.mjs  ← pruebas del motor (node tools/test-personaje.mjs)
tools/test-e2e.py         ← pruebas en navegador real (python tools/test-e2e.py)
```

## Regenerar los datos y probar

Los talentos de Mistborn salen de `tools/fuentes/talentos-mistborn.json`, que se genera del PDF (decisions/reglas/fuente-de-los-talentos-el-pdf.md); solo hay que volver a lanzar la extracción si cambia el PDF:

```
python tools/extraer_talentos_pdf.py        # opcional: necesita resources/SPA_Mistborn_Handbook.pdf
python tools/build-buscador.py
node tools/test-buscador.mjs
node tools/test-personaje.mjs      # motor de personajes: presupuestos, restricciones de ascendencia, subida de nivel
node tools/test-combates.mjs
python tools/test-e2e.py           # navegador real (Playwright): asistente, hoja, bloqueos, PWA sin conexión
```

## Cómo añadir otra ambientación (p. ej. Stormlight)

1. Generar sus entradas con `ambientacion` propia (p. ej. `Stormlight`) en `tools/` (ver `buscador_stormlight.py`: ids `origen-stormlight-…`, para que no las tome el asistente de personajes de Mistborn; el de Stormlight las filtra por `ambito`).
2. En `js/curated.js`: añadir el ámbito en `ambitos` y `ambitoPath` (`'stormlight'`), y, si procede, secciones nuevas en `treeSections` (caminos radiantes…) y catálogos.
3. El menú, la portada, los árboles y los filtros se generan a partir de esas definiciones.

## Qué contiene

| Categoría | Origen | Cómo se obtiene |
|---|---|---|
| Talentos (y sus árboles) | Manual | Extraídos de los `.md`; las dependencias salen de los prerrequisitos («talento X») |
| Acciones y reacciones, estados, habilidades | Manual | Extraídos de los `.md` |
| Valores y cálculos, Creación de personaje | Manual | Mini-reglas montadas con el texto del libro + guía con enlaces |
| Armas, armaduras | Manual c.7 | **Transcritos a mano** en `CURATED_*` del script (las tablas del PDF salen aplanadas) |
| Equipo, metales y viales, rasgos de objetos | Manual c.7 | Parseados de tabla / texto |
| Reglas (combate, descanso, conversaciones, empeños, dirección, orígenes, caminos, artes, recompensas…) | Manual | Una entrada por encabezado |
| Objetos de Stormlight (25 armas, 8 armaduras, 19 rasgos, 90 de equipo: objetos, esferas, monturas, vehículos, alojamiento y 13 fabriales comunes) | Manual del Archivo de las Tormentas c.7 | Tablas de armas y armaduras **transcritas a mano** (`ARMAS`, `ARMADURAS` en `buscador_stormlight_objetos.py`); equipo y descripciones, extraídos por rótulos |
| Caminos heroicos de Stormlight (150 talentos; 64 son los mismos que los de Mistborn y pasan a Cosmere, y el resto, variantes o especialidades nuevas) | Manual del Archivo de las Tormentas c.4 | Mismo extractor que Mistborn sobre un estado aparte (`process_stormlight_heroicos`); las tarjetas del árbol dan la especialidad (ocho talentos cada una) |
| Potencias de Stormlight (10 potencias × 8 talentos; texto de cada potencia, cómo usarla y su efecto sobre otros) | Manual del Archivo de las Tormentas c.6 | Mismo extractor; el PDF colocó el comienzo de la Gravitación en el fichero de la División y la Abrasión llegó casi vacía: se cortan y se transcriben (`ABRASION_CARTAS`) |
| Caminos radiantes de Stormlight (9 órdenes × 9 talentos de vínculo, más el árbol Iluminado de los Vigilantes de la verdad y los textos del capítulo) | Manual del Archivo de las Tormentas c.5 | Mismo extractor; se descartan las cartas resumen de las potencias (sus talentos son del capítulo 6) y «Forjadores de Vínculos» solo trae texto |
| Guía del Mundo de Roshar (lugares, personajes y organizaciones, cosmología y religión, historia, Shadesmar, glosario: 129 términos) | Guía del Mundo del Archivo de las Tormentas | Modo DJ; una entrada por apartado, en los mismos catálogos que la de Mistborn (Mundo). El glosario del PDF llega cortado en «Selay» |
| Bestiario de Roshar (55 perfiles) | Guía del Mundo c.8 | Modo DJ; el mismo extractor de bloques de estadísticas, con los glifos ▶ ▷ ↻ del PDF; los nombres repetidos con Mistborn llevan «(Roshar)» |
| Microrreglas de Stormlight (85) | Manual c.1, 2, 5, 6, 7 | `tools/buscador_reglas_stormlight.py`: solo las que Mistborn no tiene |
| Órdenes ↔ potencias | Manual c.5, tabla «Órdenes Radiantes» | `tools/buscador_stormlight_ordenes.py`: cada orden enlaza a sus dos potencias y viceversa |
| Árbol de cantor de Stormlight (8 talentos: Cambiar de forma, formas de cantor y Mente ambiciosa) | Manual del Archivo de las Tormentas c.2 | Extraídos con anclas por párrafo (`buscador_stormlight_cantor.py`); prerrequisitos y efectos, por el mismo camino que los talentos de Mistborn |
| Orígenes de Stormlight (2 ascendencias, 13 culturas y sus pericias) | Manual Stormlight c.2 | Extraídos con anclas por párrafo (`buscador_stormlight.py`); las dos «Elección de ascendencia» van transcritas a mano |
| Adversarios (38), módulos | Guía del Mundo c.8 | Modo DJ |
| Legado | Nacidos de la Bruma: Legado | Modo DJ |

## Efectos sobre el personaje (datos para un gestor de fichas)

Todo lo que modifica algo del personaje está en el JSON (`data/base.js`) y se ve en la página («Modifica al personaje» en cada talento, ascendencia, armadura y camino, y la tabla **Modificadores del personaje**).

- `entrada.x.efectos`: lista de efectos de esa entrada (talentos, armaduras, ascendencias —en su entrada «Elección de ascendencia …»— y culturas —«Pericia X»—).
- `window.DATA_ARBOLES`: un objeto por camino/arte/ascendencia con `talentos` (ids), `talento_principal`, `efectos` propios (habilidad inicial del camino; atributos, árbol y talentos de la ascendencia) y `modifica` (objetivos que toca).
- `window.DATA_OBJETIVOS`: nombre legible de cada `objetivo`.
- Las entradas `cat: "modificador"` son una fila por efecto (`x.fuente_id` apunta a la fuente), útiles como tabla plana.

Cada efecto: `{ tipo, objetivo, operacion, valor?, por?, detalle?, condicion?, permanente, texto, auto? }`

| Campo | Valores |
|---|---|
| `tipo` | `maximo`, `defensa`, `desvio`, `movimiento`, `atributo`, `atributo_max`, `puntos_atributo`, `pericia`, `grado_habilidad`, `reaccion`, `recurso`, `poder`, `meta`, `talento`, `talento_adicional`, `arbol`, `sentidos`, `companero`, `tamano`, `restriccion`, `recompensa` |
| `objetivo` | clave canónica: `salud_max`, `concentracion_max`, `investidura_max`, `defensa_fisica`, `defensa_cognitiva`, `defensa_espiritual`, `desvio`, `movimiento`, `fuerza`…`presencia`, `pericia`, `grados_habilidad`, `reaccion`, `poder`, … |
| `operacion` | `suma`, `multiplica`, `fija`, `otorga`, `desbloquea` |
| `valor` | número, `"rango"`, `"variable"`, `"5×rango"`, `"d4"`… |
| `por` | `"nivel"` (p. ej. Robusto: +1 por nivel) |
| `permanente` | `true` si se aplica al obtenerlo; `false` si es condicional o temporal (ver `condicion`/`texto`) |
| `texto` | frase original del libro: ante la duda manda ella |
| `auto` | `true` si se extrajo del texto con reglas; ausente si está transcrito a mano |

**Fiabilidad:** los efectos de talentos (71 de 366 tienen alguno) se extraen con reglas de redacción del libro (frases como «Cuando adquieres este talento, …»), con alta precisión pero sin garantía de exhaustividad; los talentos principales de nacidos del metal, Ilustración, Guardián del conocimiento y las ascendencias están transcritos a mano. Las ventajas situacionales («obtienes una ventaja en las pruebas de…») y las mejoras de otros talentos no se consideran modificadores del personaje.

## Limitaciones conocidas

- Los textos vienen de una conversión PDF→Markdown: pueden quedar restos de maquetación (tablas planas, columnas mezcladas). Cada ficha indica libro y páginas.
- Los árboles se construyen con los prerrequisitos escritos; los requisitos de otros árboles se muestran como texto en el nodo. Se agrupan por especialidad deduciéndola del orden de los grupos en el libro (caminos heroicos; el talento principal figura como «Principal»). Los talentos compartidos por varias especialidades (p. ej. «Compostura» en Oficial y Político) son un solo nodo con `especialidades` (lista); se colorea con la primera y cuenta en todas.
- Los talentos sin icono de activación legible muestran «—».
- Armas y armaduras están transcritas a mano: si el libro se corrige, hay que revisar `CURATED_WEAPONS` y `CURATED_ARMOR`.
- Mistborn: la Guía del Mundo y Legado están cargadas (Modo DJ). Las Notas de Campaña no.
- **Stormlight, lo que hay:** 324 talentos (238 propios de Stormlight y 86 comunes con Mistborn, en Cosmere), con sus árboles: seis caminos heroicos, nueve órdenes radiantes (más el árbol Iluminado), las diez potencias (ocho talentos cada una) y el árbol de cantor; los Orígenes (2 ascendencias, 13 culturas y sus pericias); los objetos del capítulo 7 (25 armas, 8 armaduras, 19 rasgos, 96 de equipo, seis de ellas conjuntos de equipo inicial) y 85 microrreglas propias. En Modo DJ, la Guía del Mundo de Roshar y su bestiario (55 perfiles).
- **Stormlight, lo que falta o está a medias:** las reglas de manufactura y los fabriales únicos; los efectos automáticos de la mayoría de los talentos (solo ~75 de 324 modifican el personaje; el resto es texto); el glosario de la Guía llega cortado en «Selay»; los talentos de la Abrasión salen de las cartas resumen del libro (texto breve; el capítulo del PDF quedó casi vacío). Detalle y método en [specs/auditoria-stormlight.md](../specs/auditoria-stormlight.md).
- Los precios de los objetos van en la divisa de cada mundo (arquillas / marcos), sin conversión: no los compares entre ambientaciones.
- Modo DJ es ocultación, no seguridad: quien conozca la ruta de `data/dj.js` puede leerlo si la web está publicada.
- `data/*.js` contiene el texto de los libros (con copyright): úsalo en local o en un entorno privado.

## Proyector de la mesa (`proyector/`)

Integrado en el buscador (Modo DJ): menú **Dirección → Proyector de la mesa** (`#/proyector`). La consola se monta una sola vez y se oculta al cambiar de sección, así la proyección y la música siguen. La ventana de salida (`proyector/salida.html`) es independiente. Spec: [specs/mapas-proyector.md](../specs/mapas-proyector.md).

### Guía rápida

Para qué sirve: proyectas mapas e imágenes a los jugadores en una segunda pantalla (o un proyector sobre la mesa) y tú controlas, desde el portátil, **qué se ve**. Lo que no revelas no sale de tu consola.

1. **Activa el Modo DJ** (`index.html?dj=1`) y entra en *Dirección → Proyector de la mesa*.
2. **Sube material.** Arrastra imágenes (mapas, ilustraciones) y audio sobre la consola, o pulsa el recuadro «Suelta aquí…». Cada imagen es una escena; en *Escena* eliges si es **Mapa** (con niebla) o **Imagen** (a pantalla completa).
3. **Abre la proyección.** «Abrir proyección» abre una ventana: arrástrala a la segunda pantalla y ponla a pantalla completa (doble clic en ella, o F11). Si el navegador bloquea la ventana, permite las emergentes.
4. **Calibra la mesa (solo si proyectas sobre la mesa).** «Calibrar mesa» dibuja una cuadrícula de 10 cm; ajusta *px de pantalla por cm* hasta que mida 10 cm de verdad. Después, «Escala real» hace que una casilla del mapa mida lo que indiques en *cm por casilla* (p. ej. 2,5 cm), con *px de mapa por casilla* según tu imagen.
5. **Prepara y proyecta.** Elegir una escena en la lista **no** cambia lo que ven los jugadores hasta que pulsas **Proyectar** (con corte o fundido por negro).
6. **Niebla.** En un mapa, con la herramienta *Revelar* pintas sobre la vista previa para abrir zonas; *Ocultar* las cierra; *Crecer* abre un círculo mientras mantienes pulsado; *Luz* coloca una fuente de luz (color, tamaño y parpadeo); *Mover vista* desplaza el encuadre. *Radio*, *Dureza* e *Intensidad* regulan el pincel. Rueda: zoom; clic derecho o central: mover. Deshacer y rehacer: `Ctrl+Z` / `Ctrl+Y`.
7. **Ambiente.** Oscuridad, bruma, lluvia, ceniza, relámpagos y viento se ajustan con deslizadores y se guardan por escena.
8. **Música.** Marca las pistas que suenan en cada escena; se reproducen al proyectarla, con fundido. Controles de anterior, pausa, siguiente y parar, y velocidad de la pista (doble clic restablece el 100 %). El audio suena en el equipo de la consola.
9. **Emergencias.** `B` pasa la proyección a **negro** (útil entre escenas o para una pausa), `P` congela los efectos y `F` congela la imagen. Pulsa de nuevo para volver.
10. **Copia de seguridad.** Todo (escenas, nieblas, audio) se guarda en el navegador de ese equipo. «Exportar .zip» te da una copia y «Importar .zip» la restaura en otro equipo.

Límites: no hay conexión remota (la proyección va por la ventana abierta desde la consola) y los atajos solo valen con la consola a la vista y el foco fuera de un campo de texto.

## Combates (`combates/`)

Solo Modo DJ: menú **Dirección → Combates** (`#/combates`). Es una **lista de combates preparados**: cada encuentro guarda el grupo (número de jugadores y nivel medio, de donde sale el rango) y sus adversarios, y muestra el **nivel de amenaza** según el Manual (fácil / promedio / difícil). Dentro de un encuentro, una tabla permite editar la salud, concentración, Investidura y desvío de cada adversario, anotar estados y lesiones, y consultar sus acciones y rasgos (con botón para pagar costes). No simula turnos. Se guarda en el navegador (`cosmere-combates-v2`) y se exporta/importa en JSON. Spec: [specs/gestor-combates.md](../specs/gestor-combates.md).

```
combates/
  css/combates.css
  js/amenaza.js, adversarios.js, combate.js   ← motor puro (sin DOM)
  js/vista.js                                  ← interfaz: CB.montar(el)
tools/test-combates.mjs  ← node tools/test-combates.mjs
```
