---
description: Spec de una herramienta estática para gestionar la hoja de personaje del Cosmere RPG (Mistborn) —hoja básica + módulos por camino de nacido del metal— y crearlo paso a paso, también desde niveles superiores
status: implementado (v1)
---

# Gestor de hoja de personaje de Mistborn — spec

## 1. Objetivo

Herramienta estática (HTML + JS, sin backend, funciona con doble clic desde `file://`, como `docs/` y `docs/proyector/`) con dos partes que comparten el mismo modelo de datos:

1. **Hoja de personaje viva**: rellenar, calcular y actualizar durante la campaña la hoja básica (*Mistborn Character Sheet*) más el **módulo de nacido del metal** que corresponda al camino (brumoso, nacido de la bruma, feruquimista, ferrin, nacidoble) y, si se obtiene un clavo, el de hemalurgista.
2. **Asistente de creación paso a paso**, siguiendo los 8 pasos del Manual y permitiendo **empezar en un nivel superior** (reglas del cap. 13, «Cómo empezar en niveles superiores»).

Ejemplos que debe resolver:

| Pregunta real | Qué debería pasar |
|---|---|
| «Quiero crear un jugador nuevo para la campaña» | Asistente → Era, nivel inicial 1 → 8 pasos con opciones y validación; al final, hoja lista para jugar o imprimir. |
| «Entra un jugador nuevo con el grupo a nivel 6» | Selecciono nivel 6: el asistente hace el nivel 1 y luego cada nivel 2…6 en secuencia, y al final reparte arquillas y recompensas de rango 1 y 2. |
| «Sube a nivel 4» | Botón *Subir de nivel*: pide atributo (si toca), grado(s) de habilidad, pericia por INT, talento, y recalcula salud y todo lo derivado. |
| «¿Cuántos grados de Alomancia tengo y qué límite me da?» | El bloque de alomancia lo muestra ya calculado (modificador, grados-límite, alcance, dado). |
| «Quemé una carga de peltre, bebo un vial» | Un clic en *Beber vial*: Investidura al máximo y estado Desprovisto actualizado. |
| «Imprimir mi hoja» | Vista de impresión con la misma disposición que la hoja oficial. |

**No-objetivos:** no es un VTT, no tira dados, no sustituye al libro (los textos de talentos se enlazan o se copian del buscador, no se reescriben), no valida el contenido narrativo (trasfondo, metas) y no gestiona a la DJ (adversarios, campaña, PNJs). No reimplementa el buscador: **reutiliza sus datos** (`DATA_ARBOLES`, talentos, armas, armaduras, equipo, metales).

## 2. Valoración y enfoque recomendado

**Es viable.** El buscador ya extrajo los datos pesados (366 talentos con prerrequisitos y grafo de árboles, armas, armaduras, equipo, viales) y su README los describe explícitamente como «datos para un gestor de fichas». Lo que falta es (a) un **modelo de personaje** y su motor de cálculo, (b) las **tablas de reglas** de creación y progreso, que hoy solo existen como texto, y (c) la interfaz.

El punto delicado es que **solo 71 de 366 talentos tienen efectos extraídos** automáticamente. Hay que asumirlo en el diseño: el motor aplica los efectos conocidos, pero la hoja siempre admite **bonificadores manuales** y el usuario debe poder corregir cualquier valor derivado. Los efectos condicionales o temporales (`permanente: false`) no se suman a los valores base (el libro lo exige: los bonificadores temporales no cuentan para prerrequisitos ni topes).

Decisiones clave:

1. **Carpeta nueva e independiente: `personaje/`**, igual que `docs/` y `docs/proyector/`. El buscador seguiría sin guardar hojas (su spec lo excluye); la herramienta nueva solo lee sus datos.
2. **Datos reutilizados, no duplicados.** *(Implementado así: la herramienta vive en `docs/personaje/`, lee `docs/data/base.js` y las tablas de reglas están escritas a mano en `js/rules.js`; no hay script de generación.)* La carga de datos es por `<script>` (no `fetch`) para que funcione desde `file://`.
3. **Motor de cálculo puro y testeable** (`js/engine.js`): función `derivar(personaje, reglas) → valores`. Sin DOM. Se prueba con Node (`tools/test-personaje.mjs`), como el buscador.
4. **El personaje guarda decisiones, no resultados.** Se almacenan atributos, grados, talentos elegidos, historial de niveles, etc.; las defensas, la salud máxima, el movimiento y demás se **calculan siempre**. Así subir de nivel o cambiar un atributo no deja valores obsoletos y el asistente puede reconstruir el personaje nivel a nivel.
5. **Hoja modular.** La hoja básica es siempre la misma; el módulo de camino se activa según el talento principal elegido (ver §5.3). Cada módulo es una sección independiente con su propio esquema, y el módulo se carga según el camino, igual que el jugador usa una hoja suplementaria u otra.
6. **Persistencia local y portable**: `localStorage` + exportar/importar JSON de un personaje (y de todos). Sin cuentas ni servidor. El JSON lleva `version` para poder migrar.
7. **Impresión fiel**: una vista `@media print` que reproduce la disposición de la hoja oficial (para quien prefiera papel en la mesa).

## 3. Fuentes

| Fuente | Contenido | Uso |
|---|---|---|
| `Mistborn Manual` cap. 1 «Progreso de los personajes» | Tabla de progreso por nivel (salud, rango máximo de habilidad, grados, talentos, puntos de atributo) | Tablas de progreso (§6.1) |
| cap. 2 «Orígenes» | Ascendencias, culturas (pericias culturales) | Paso 1 del asistente |
| cap. 3 «Características» | Atributos, defensas, pericias, habilidades, salud/concentración/Investidura, tablas de FUE/VEL/VOL/DIS/PRE | Motor de cálculo (§6.2) |
| cap. 4 «Caminos heroicos» | Caminos, especialidades, talentos | `DATA_ARBOLES` del buscador |
| cap. 5 «Caminos de nacidos del metal» | Brumoso, nacido de la bruma, feruquimista, ferrin, nacidoble; metas y recompensas de nacido del metal; poderes nacientes | Módulos de camino (§5.3) |
| cap. 6 «Artes metálicas» | Poderes por metal, límites de artes metálicas, Almacenar/Decantar, Beber vial, atium | Módulos de camino |
| cap. 7 «Equipo» | Armas, armaduras, equipo inicial, viales | Datos del buscador |
| cap. 8 «Recompensas» | Metas y recompensas, metales raros (suministro recurrente), **clavos hemalúrgicos** | Hemalurgista y recompensas |
| cap. 13 «Cómo empezar en niveles superiores» | Procedimiento y tabla de recompensas iniciales | Asistente (§4.2) |
| Hojas oficiales (7 PDF) | Campos y disposición de cada hoja | Modelo de datos (§5) y vista de impresión |
| `Manual del Archivo de las Tormentas`, cap. 1 | Estructura de los 8 pasos de creación (las páginas 23–33 del Manual de Mistborn **no están** en la conversión) | Textos guía del asistente |

> **Nota:** las páginas de los pasos de creación del Manual de Mistborn faltan en la conversión a Markdown. Los datos propios de Mistborn salen de los capítulos 2, 3, 5 y 7; la estructura del asistente se toma del Archivo de las Tormentas (mismo sistema), como ya hace el skill `hoja-trasfondo-legado`.

### Hojas de personaje de referencia

La hoja **básica** es común; las demás son suplementarias y dependen del camino de nacido del metal (los nombres de la columna izquierda son descriptivos, no los títulos exactos de los PDF; los 14 campos de metal de cada hoja deben **confirmarse contra el PDF** al implementar):

| Hoja | Cuándo se usa | Contenido propio |
|---|---|---|
| *Mistborn Character Sheet* | Siempre | Ver §5.2 |
| *Misting Metalborn* (brumoso) | Camino de brumoso | 1 metal alomántico: MOD, GRADOS-LÍMITE, ALCANCE, DADO; meta «Entrenar tu poder» con hitos 1.º/2.º/3.º y poderes desbloqueados; acciones Beber vial; viales |
| *Mistborn Metalborn* (nacido de la bruma) | Camino de nacido de la bruma | Los 14 metales alománticos (hierro, acero, estaño, peltre, cinc, latón, cobre, bronce, aluminio, duraluminio, oro, electro, atium y su aleación, según el modelo de la hoja), cada uno con su meta de entrenamiento, hitos, viales y casilla de «suministro recurrente»; acciones Beber vial y Tragar atium (atium con cuentas) |
| *Feruchemist Metalborn* (feruquimista) | Camino de feruquimista | CARGAS MÁX.; 13 metales con cargas actuales y efectos de Almacenar/Decantar; meta «Fabricar tu mente de metal» |
| *Ferring Metalborn* (ferrin) | Camino de ferrin | Un metal feruquímico con las mismas reglas de descanso |
| *Twinborn Metalborn* (nacidoble) | Camino de nacidoble | Un bloque alomántico + un bloque feruquímico, cada uno con su meta (Entrenar tu poder / Fabricar tu mente de metal), metal, viales, suministro recurrente, efecto y talentos |
| *Hemalurgist Metalborn* | Si se obtiene un clavo hemalúrgico (recompensa, no camino) | 3 ranuras de clavo (rango, efecto, implantado), −2 a Defensa espiritual, Pericia Hemalurgia, acciones Implantar/Extraer clavo, bloques alomántico y feruquímico concedidos |

## 4. Funcionalidades

Prioridad: **P0** = MVP, **P1** = siguiente iteración, **P2** = deseable.

### 4.1 Gestor de personajes (P0)

- **Lista de personajes** guardados en el navegador: crear, duplicar, renombrar, borrar (con confirmación), exportar/importar JSON.
- Abrir un personaje lleva a su hoja. La URL (`#/p/<id>`) es estable en local.
- **Autoguardado** en cada cambio. Indicador discreto de «guardado».
- **Importar** valida la versión del esquema y avisa antes de sobrescribir.
- (P1) Exportar todos los personajes en un solo JSON; (P1) copia de seguridad recordatoria.

### 4.2 Asistente de creación paso a paso (P0)

Recorre los **8 pasos del Manual** con barra de progreso, navegación libre hacia atrás y avisos (no bloqueos) cuando algo no cumple las reglas:

| Paso | Qué decide el jugador | Qué valida/calcula la herramienta |
|---|---|---|
| 0. Preliminares | **Era** (1 o 2), **nivel inicial** (1 por defecto), **permiso de la DJ** si el nivel > 1 (casilla informativa) | Filtra contenido por era (ascendencias, metales, caminos, equipo) |
| 1. Orígenes | Ascendencia (humana, kandra, sangre koloss…), cultura / pericias culturales, legado (si aplica) | Pericias culturales (2), talento de ascendencia y efectos de la ascendencia |
| 2. Camino inicial | Camino heroico + especialidad, **o** camino de nacido del metal | Habilidad inicial gratuita del camino; talento principal; si es nacido del metal, metales o poderes nacientes, Investidura, habilidades Alomancia/Feruquimia, metas |
| 3. Atributos | Reparto de **12 puntos** en FUE, VEL, INT, VOL, DIS, PRE | Máximo 5 por atributo, mínimo 0; contador de puntos restantes; muestra defensas y valores derivados en vivo |
| 4. Habilidades y pericias | Grados de habilidad (4 + 1 del camino inicial), pericias (2 culturales + INT) | Máximo grado 2 en nivel 1; pericias no especializadas; modificador = atributo + grados |
| 5. Talentos | Talento principal del camino inicial + talento(s) de ascendencia | Prerrequisitos (habilidad, atributo, talento previo) con el grafo del buscador; bloqueo de árboles de poderes aún nacientes |
| 6. Equipo | Equipo inicial (kit) o compra con arquillas, armas, armaduras | Peso/capacidad de carga, desvío de armadura, pericias en arma/armadura que aplican rasgos de experto |
| 7. Historia y metas | Propósito, obstáculo, metas (con 3 casillas de progreso), conexiones, notas | Conexiones máximas según PRE |
| 8. Características finales | Revisión: salud, concentración, Investidura, defensas, movimiento, sentidos, dado de recuperación, capacidad de carga | Todo calculado; resumen con avisos pendientes |

#### Empezar en niveles superiores (P0)

Sigue el procedimiento del Manual (cap. 13): **«crea el personaje como de nivel 1 y luego toma las decisiones de cada nivel de forma secuencial»**.

1. Tras el paso 8, si el nivel inicial es *N* > 1, el asistente encadena una **pantalla de subida de nivel por cada nivel de 2 a *N*** (ver §4.3), con las mismas validaciones y recálculo que en juego.
2. Después, **recompensas iniciales** según el rango de partida (tabla de §6.4): arquillas para equipo y número de recompensas del cap. 8 por rango. El jugador elige las recompensas (equipo, compañeros, patrocinadores, metales raros, clavos…) y se anotan en el personaje.
3. **Prerrequisitos de recompensa:** para los talentos que exigen una recompensa, se supone que cada recompensa se obtuvo **en el primer nivel de su rango**, de modo que el asistente aplica ese orden al validar.
4. **Nacidos del metal:** hasta que cada poder (o pareja de poderes) se desbloquee con su **meta + recompensa**, solo hay versión naciente y **no se pueden elegir talentos del camino de nacido del metal ni del árbol de ese poder**. Las recompensas de rango 1 pueden gastarse en completar esas metas (ejemplo del libro: nacidoble de rango 3 con acero + estaño debe usar sus **dos** recompensas de rango 1 para las dos metas antes de poder elegir talentos de esos árboles). El asistente ordena y bloquea en consecuencia.
5. **Heroicos sin nacido del metal:** se sugiere consolidar el poder con equipo, compañeros y patrocinadores como recompensa.
6. El asistente avisa de que **requiere permiso de la DJ** y deja una nota editable «Acuerdo con la DJ» para poder registrar excepciones (por ejemplo, el equipo de Guardador o Fugitivo, que completan de inmediato la meta inicial de nacido del metal).

### 4.3 Subida de nivel (P0)

Un asistente corto, reutilizado tanto en el modo «empezar en nivel alto» como en juego:

- Qué toca en ese nivel (según la tabla de §6.1): puntos de atributo (niveles 3, 6, 9, 12, 15, 18), grados de habilidad, talento, talento adicional de ascendencia (niveles 6, 11, 16, 21), pericia por cada punto de INT ganado, aumento de salud.
- Desde el nivel 21: +1 de salud y **a elegir** entre +1 grado de habilidad o +1 talento.
- Máximo de grados por habilidad según el rango (§6.1); atributo máximo 5 (no cuentan bonificadores temporales).
- Los grados de Alomancia/Feruquimia se tratan como el resto de grados.
- **Historial de decisiones por nivel** guardado en el personaje (permite reconstruir, deshacer el último nivel y revisar qué se eligió cuándo).
- (P1) **Reasignación** durante el Reposo (regla de 10 días del cap. 13: reconstruir el personaje con las mismas reglas al nivel actual).

### 4.4 Hoja básica (P0)

Todos los campos de la hoja oficial, con los valores derivados calculados y editables solo mediante «bonificador manual» (para no perder el cálculo base). Detalle en §5.2.

- **Contadores interactivos** con botones ± y teclado: salud, concentración, Investidura (cuando la haya).
- **Estados** (selector con los estados del Manual y su efecto de una línea) y **lesiones**.
- **Ficha** (pestaña principal): reproduce la hoja en papel con tres columnas (física, cognitiva, espiritual); cada una con sus dos atributos, escudo de defensa, recurso (salud + desvío / concentración / Investidura) y las habilidades de ese reino agrupadas por atributo, con modificador y grados (5 puntos máximos visibles). No hay pestaña de habilidades aparte.
- **Acciones** (pestaña): todo lo que el personaje puede hacer en su turno, agrupado en Talentos (los adquiridos con acción propia), Alomancia / Feruquimia (solo metales con poder desbloqueado y grados del arte), Otras (beber vial, hemalurgia) y, al final, Generales. Ordenadas por coste (1, 2, 3 acciones, especial, gratuita, reacción), como tarjetas con la descripción corta ya visible; al pulsar una (igual que en Talentos, donde se muestra el resumen de la mecánica) se abre un panel lateral con la descripción completa y enlaces internos (`ui-common.js`, `tarjeta`/`abrirPanel`, mismo aspecto que el panel del buscador); las acciones que dan un talento abren la ficha del talento. En impresión el panel se oculta y sale la lista compacta. Las filas de habilidad de la Ficha abren el mismo panel con la ficha de la habilidad (atributo, defensa y texto del libro); Alomancia y Feruquimia no son clicables porque no tienen entrada de habilidad en los datos. Los textos de las acciones de talento son solo ambientación en los datos convertidos.
- **Pericias**: lista agrupada por categoría (arma, armadura, cultural, utilidad, especializada).
- **Talentos**: lista con enlace al buscador (panel lateral o nueva pestaña), activación y estado (usado/disponible si aplica). Los efectos conocidos se aplican automáticamente; los demás se pueden anotar como bonificador manual.
- **Equipo**: armas (daño, alcance, rasgos, pericia), armaduras (desvío, rasgos), objetos, arquillas.
- **Metas y recompensas**: metas con 3 casillas de progreso y recompensa asociada.
- **Notas y conexiones**.
- Botón **Descanso corto** / **Descanso largo** que aplica las recuperaciones del Manual (salud, concentración, Investidura al máximo, feruquimia según §6.3) y avisa de lo que se pierde.

### 4.5 Módulos de nacido del metal (P0 alomancia y feruquimia; P1 hemalurgia)

Cada módulo extiende la hoja con su bloque propio:

- **Alomancia** (brumoso, nacido de la bruma, nacidoble): por metal, modificador de Alomancia, límite de artes metálicas, alcance, dado, meta «Entrenar tu poder» con hitos y poderes desbloqueados, viales, suministro recurrente (metales raros) y cuentas de atium; botones *Beber vial* y *Tragar atium*; estado **Desprovisto** por metal; control de Investidura.
- **Feruquimia** (feruquimista, ferrin, nacidoble): por metal, **cargas máximas** = 2 + grados de Feruquimia (+ bonificadores de talentos como *Mentes de metal ampliadas* = rango), cargas actuales, efectos de Almacenar/Decantar, meta «Fabricar tu mente de metal»; botones *Almacenar* y *Decantar* que respetan «no se puede almacenar y decantar a la vez» y el máximo de cargas.
- **Nacidoble**: un bloque de cada tipo + aviso de combinación (mismo metal ⇒ *Componedor* posible; metales distintos ⇒ *Resonancia aleada*).
- **Hemalurgia (P1)**: 3 ranuras de clavo con rango, efecto e «implantado»; penalización de −2 a Defensa espiritual aplicada automáticamente; poderes concedidos (alomantico/feruquímico) como bloques añadidos; las acciones Implantar y Extraer clavo como recordatorios. El libro lo trata como recompensa, no como camino: el módulo se activa añadiéndolo al personaje, no eligiéndolo al crearlo.
- **Poder naciente frente a desbloqueado**: cada poder tiene estado `naciente | desbloqueado` (según la meta y su recompensa). Mientras sea naciente, el módulo muestra la versión rudimentaria, **no ofrece los talentos de su árbol** y lo indica claramente.

### 4.6 Impresión y exportación (P1)

- Vista de impresión con la disposición de la hoja oficial (básica + módulo).
- Exportar a PDF vía el diálogo de impresión del navegador (sin dependencias).
- (P2) Exportar una **ficha resumen** en Markdown (para pegar en las notas de campaña) con el mismo estilo que las fichas de `Notas de Campaña/`.

### 4.7 Enlaces con el buscador (P1)

- Cada talento, arma, armadura, estado y regla enlaza a su entrada del buscador (`../index.html#/talento/<id>`).
- En el asistente, el texto de ayuda de cada paso enlaza a la guía de creación del buscador («Valores y cálculos»).
- (P2) Selector de talentos reutilizando el componente de árbol del buscador.

### 4.8 Ámbito y era (P0)

- La **era** se elige en la creación y se guarda en el personaje; filtra ascendencias, metales y equipo (los entradas del buscador están etiquetadas `Mistborn`, `Mistborn Era 1`, `Mistborn Era 2`).
- El campo `ambito` (`Mistborn` | `Stormlight`) decide qué contenido ofrece el gestor; ver §4.9.

### 4.9 Stormlight (P0, implementado)

El mismo asistente y la misma hoja sirven a un personaje de Roshar (`ambito: 'Stormlight'`). Criterio: [decisions/reglas/personajes-por-ambito.md](../decisions/reglas/personajes-por-ambito.md).

| Paso | Diferencia con Mistborn |
|---|---|
| Datos | Ámbito en lugar de era. Ascendencias: humana (un talento adicional de camino heroico) y cantora (Cambiar de forma automático + un talento de formas iniciales). Sin bendiciones. |
| Camino | Solo caminos heroicos. Los radiantes se eligen como talento de Primer Ideal (nivel ≥ 2) en el paso de talentos. |
| Habilidades | 18 (sin Alomancia ni Feruquimia) más las 2 potencias de la orden, con 1 grado gratuito al pronunciar el Primer Ideal. |
| Talentos | Heroicos (Stormlight + Cosmere), cantor y radiantes; los de potencia solo para quien tenga una orden que la maneja. «pronunciar el N-ésimo Ideal» se evalúa con los Ideales marcados. |
| Pericias | Culturas de Roshar (13), armas, armaduras y utilidad de Stormlight y Cosmere. |
| Radiante (nuevo) | Orden y spren, Ideales con los 3 hitos de su meta y «Pronunciado», potencias con grados, dado y tamaño (Escalado de potencias). Investidura = 2 + mayor de DIS/PRE desde el Primer Ideal. |
| Equipo | Equipo inicial de Roshar, objetos de Stormlight, dinero en marcos (sin ×10). |
| Recompensas | 200 / 1.000 / 2.000 / 5.000 marcos y las mismas recompensas por rango. |

Pruebas: `tools/test-personaje.mjs` (sección «Stormlight»).

## 5. Modelo de datos

### 5.1 Personaje (JSON versionado)

Solo se guardan **decisiones y estado**; lo derivado se calcula (§6).

```jsonc
{
  "version": 1,
  "id": "uuid",
  "ambito": "Mistborn",
  "era": 1,                         // 1 | 2
  "nombre": "…",
  "jugador": "…",
  "nivel": 6,
  "nivel_inicial": 6,               // para saber si se creó en nivel alto
  "acuerdo_dj": "texto libre",      // permiso y excepciones

  "origen": {
    "ascendencia": "humana",        // id en DATA_ARBOLES
    "culturas": ["Áridos", "Bajos fondos"],
    "legado": "Pilluelo"
  },
  "camino_inicial": { "tipo": "heroico|nacido_del_metal", "id": "…", "especialidad": "…" },

  "atributos_base": { "fue": 3, "vel": 2, "int": 1, "vol": 3, "dis": 2, "pre": 1 },
  "grados": { "atletismo": 2, "alomancia": 3, "…": 0 },          // por habilidad
  "pericias": [ { "nombre": "Vida militar", "categoria": "cultural" } ],

  "talentos": [ { "id": "t_…", "nivel": 1, "fuente": "principal|camino|ascendencia|nivel" } ],
  "historial_niveles": [
    { "nivel": 2, "grados": { "agilidad": 1, "sigilo": 1 }, "talento": "t_…", "atributo": null, "pericia": null }
  ],

  "recursos": { "salud": 17, "concentracion": 4, "investidura": 5, "arquillas": 80 },
  "bonificadores_manuales": [ { "objetivo": "defensa_fisica", "valor": 1, "nota": "…" } ],
  "estados": ["Desprovisto:peltre"],
  "lesiones": [ { "texto": "…", "duracion": "…" } ],

  "equipo": {
    "armas": [ { "id": "arma_…", "pericia": true } ],
    "armaduras": [ { "id": "armadura_…", "equipada": true } ],
    "objetos": [ { "nombre": "…", "cantidad": 1 } ]
  },

  "metas": [ { "texto": "…", "progreso": 2, "recompensa": "…" } ],
  "propositos": { "proposito": "…", "obstaculo": "…" },
  "conexiones": [ { "nombre": "…", "nota": "…" } ],
  "recompensas": [ { "id": "…", "rango": 1, "nombre": "…" } ],
  "notas": "…",

  "modulo": { /* ver §5.3: una sola clave según el camino */ }
}
```

### 5.2 Hoja básica: inventario de campos

| Bloque | Campos |
|---|---|
| Cabecera | Nombre, jugador, nivel, ascendencia, cultura, camino(s)/especialidad |
| Atributos | FUE, VEL, INT, VOL, DIS, PRE (0–5) |
| Defensas | Física (10 + FUE + VEL), Cognitiva (10 + INT + VOL), Espiritual (10 + DIS + PRE) |
| Recursos | Salud (máx + actual), Concentración (2 + VOL), Investidura (máx + actual, cuando exista) |
| Derivados | Desvío, Capacidad de carga/levantamiento, Movimiento, Dado de recuperación, Alcance de sentidos, Conexiones |
| Habilidades | FUE: Atletismo, Armamento pesado · VEL: Agilidad, Armamento ligero, Hurto, Sigilo · INT: Deducción, Feruquimia, Manufactura, Medicina, Saber · VOL: Alomancia, Disciplina, Intimidación · DIS: Percepción, Perspicacia, Supervivencia · PRE: Engaño, Liderazgo, Persuasión. Cada una con atributo, grados (0–5) y modificador. Alomancia y Feruquimia solo aparecen cuando el camino las concede (línea en blanco de la columna cognitiva) |
| Pericias | Lista por categoría |
| Talentos | Lista con origen y nivel |
| Estados y lesiones | Lista |
| Armas | Nombre, daño, alcance, rasgos, pericia |
| Armadura y equipo | Desvío, peso, rasgos, objetos, arquillas |
| Metas | Texto, progreso (3 casillas), recompensa |
| Propósito / obstáculo | Texto |
| Conexiones y notas | Texto |

### 5.3 Módulos de camino

El esquema de `modulo` se elige según el camino de nacido del metal; si el personaje no es nacido del metal, no hay módulo (pero puede añadirse el de hemalurgia por recompensa).

```jsonc
// Alomancia (brumoso / nacido de la bruma / parte del nacidoble)
"alomancia": {
  "metales": {
    "peltre": {
      "estado": "naciente|desbloqueado",
      "meta": { "texto": "Entrenar tu poder", "hitos": [true, false, false], "poderes_desbloqueados": ["…"] },
      "viales": 3,
      "suministro_recurrente": false,
      "cuentas": 0                      // solo atium
    }
  },
  "desprovisto": ["peltre"]
}

// Feruquimia (feruquimista / ferrin / parte del nacidoble)
"feruquimia": {
  "metales": {
    "oro": {
      "estado": "naciente|desbloqueado",
      "meta": { "texto": "Fabricar tu mente de metal", "completada": false, "ayuda_externa": false },
      "cargas": 2,
      "mente": { "reserva": false, "integrada": false }
    }
  }
}

// Nacidoble: ambos bloques anteriores, uno de cada
// Hemalurgia (recompensa)
"hemalurgia": {
  "clavos": [ { "rango": 1, "efecto": "…", "implantado": true } ]   // hasta 3 ranuras
}
```

Reglas de aplicación:

- **Brumoso**: un metal alomántico; **grado gratuito en Alomancia** además del de la ruptura (según el skill de legado y el Manual).
- **Nacido de la bruma**: todos los metales alománticos disponibles en su era.
- **Feruquimista**: todos los metales feruquímicos de su era (nacientes); la primera meta cubre una *pareja* de metales (puro + aleación, o el atium).
- **Ferrin**: un solo metal feruquímico.
- **Nacidoble** (era 2): un poder alomántico y otro feruquímico; **Disciplina** gratis al elegir el camino; Investidura máxima = 2 + el mayor de DIS o PRE.
- Los caminos de nacido del metal son **excluyentes**: al elegir el talento principal de uno se bloquea el resto.
- Metales por era: la lista de metales disponibles sale de «Metales de Scadrial» (algunos solo en Era 2 o al final de la Era 1).
- La hemalurgia concede −2 a Defensa espiritual mientras haya clavo implantado; los poderes robados **no generan resonancias** (solo los nacidobles las tienen).

## 6. Reglas de cálculo

> Todas estas tablas y fórmulas se codifican en `docs/personaje/js/rules.js` y se prueban con casos de borde en `tools/test-personaje.mjs`.

### 6.1 Progreso por nivel (cap. 1)

| Nivel | Salud ganada | Rango máximo de habilidad | Grados de habilidad | Talentos |
|---|---|---|---|---|
| 1 | 10 + FUE | 2 | 4 (+1 del camino inicial) | 1 del camino inicial + talento(s) de ascendencia |
| 2–5 | +5 | 2 | +2 | +1 |
| 6 | +4 + FUE (luego +4 en 7–10) | 3 | +2 | +1 |
| 11 | +3 + FUE (luego +3) | 4 | +2 | +1 |
| 16 | +2 + FUE (luego +2) | 5 | +2 | +1 |
| 21+ | +1 | 5 | a elegir +1 grado **o** +1 talento | (ver izquierda) |

- **+1 punto de atributo** en los niveles 3, 6, 9, 12, 15 y 18. Tope de atributo: 5 (no cuentan los bonificadores temporales).
- **Talento adicional de ascendencia** en los niveles 1, 6, 11, 16 y 21.
- **Pericias:** 2 culturales + INT al empezar; **+1 pericia** cada vez que INT sube en 1 (no se pueden elegir pericias especializadas con puntos de INT).
- **Prerrequisitos de talento:** cuentan bonificadores permanentes, no los temporales; todos los talentos de un árbol (salvo el principal) exigen el predecesor en el árbol.

> Pendiente de verificar contra el libro (§10): valores exactos de la fila 21+, y cuándo se aplican los niveles 6/11/16 para salud (se anotan arriba tal como figuran en el análisis previo).

### 6.2 Valores derivados (cap. 3)

| Valor | Fórmula |
|---|---|
| Defensa física | 10 + FUE + VEL |
| Defensa cognitiva | 10 + INT + VOL |
| Defensa espiritual | 10 + DIS + PRE (−2 con clavo hemalúrgico) |
| Salud máxima | Según §6.1 + bonificadores |
| Concentración | 2 + VOL + bonificadores |
| Investidura máxima | Según camino: p. ej. nacidoble 2 + el mayor de DIS o PRE (+ rango con el talento *Investido*) |
| Modificador de habilidad | Atributo asociado + grados |
| Pericias | 2 culturales + INT (+ ganadas por talentos/recompensas) |
| Desvío | De armadura y efectos |

| Valor | 0 | 1–2 | 3–4 | 5–6 | 7–8 | 9+ |
|---|---|---|---|---|---|---|
| **Capacidad de levantamiento** (FUE) | 50 kg | 100 kg | 250 kg | 500 kg | 2.500 kg | 5.000 kg |
| **Movimiento** (VEL) | 6 m | 7,5 m | 9 m | 12 m | 18 m | 24 m |
| **Dado de recuperación** (VOL) | d4 | d6 | d8 | d10 | d12 | d20 |
| **Alcance de sentidos** (DIS) | 1,5 m | 3 m | 6 m | 15 m | 30 m | sin límite |

- Capacidad de carga = la mitad de la de levantamiento.
- **Conexiones** según tabla de PRE (a transcribir del libro).
- **Límite de artes metálicas** (grados máximos que se pueden gastar por uso): según la tabla de «Límite de artes metálicas» del cap. 6, con los grados de Alomancia o Feruquimia.
- **Cargas máximas por mente de metal:** 2 + grados de Feruquimia (+ bonificadores de talentos).

### 6.3 Descanso y recuperación

- Descanso corto y largo según cap. 9 (qué se recupera de salud, concentración, Investidura y estados).
- **Feruquimia:** en un descanso corto se pueden almacenar en cualquier mente de metal las cargas de **1 escena**; en un descanso largo, las de **2 escenas**, y el personaje queda **Agotado [−1]**. Almacenar en descanso renuncia a los demás beneficios de ese descanso.
- **Alomancia:** si se empieza la escena Sorprendido, solo 1 de Investidura; si no, al máximo. *Beber vial* recupera hasta el máximo y deja Desprovisto de los poderes cuyos metales no estaban en el vial (nota: Desprovisto por metal raro con Investidura residual, regla opcional de la DJ).

### 6.4 Recompensas iniciales de nivel superior (cap. 13)

| Rango inicial | Arquillas (Era 1 / Era 2) | Rango 1 | Rango 2 | Rango 3 | Rango 4 o más |
|---|---|---|---|---|---|
| 1 (niveles 2–5) | 100 / 200 | 1 | — | — | — |
| 2 (niveles 6–10) | 500 / 1.000 | 2 | 1 | — | — |
| 3 (niveles 11–15) | 1.000 / 2.000 | 2 | 1 | 1 | — |
| 4–5 (nivel 16+) | 2.500 / 5.000 | 2 | 1 | 1 | 1 |

### 6.5 Efectos sobre el personaje

El motor aplica `entrada.x.efectos` y `DATA_ARBOLES[*].efectos` del buscador (esquema en `docs/README.md`):

- `permanente: true` → se suma al valor base derivado.
- `permanente: false` → se **muestra** como efecto condicional pero **no** entra en el valor base ni en los prerrequisitos.
- `operacion`: `suma`, `multiplica`, `fija`, `otorga`, `desbloquea` (ver README del buscador).
- `valor: "rango"` o `por: "nivel"` se resuelven con el rango/nivel actual.
- El campo `texto` (la frase original del libro) es el que manda: se muestra siempre junto al efecto aplicado, y el usuario puede **anular** cualquier efecto automático.
- Talentos sin efectos extraídos: el usuario puede añadir un bonificador manual; esos bonificadores quedan en `bonificadores_manuales` y en el export.

## 7. Estructura en el repo

> **Implementado** dentro del buscador, no como carpeta independiente (decisión del usuario): `docs/personaje/`. Reutiliza `docs/data/base.js` y `docs/css/styles.css` directamente; no hay `data/reglas.js` generado ni build propio. Las tablas de reglas están escritas a mano en `js/rules.js` y los kits de equipo, metales y árboles se leen de los datos del buscador (los metales por era, de forma dirigida por datos; el aluminio es un caso especial sin árbol).

```
docs/personaje/
  index.html
  css/personaje.css       ← todo acotado a body.pj; incluye @media print
  js/rules.js             ← reglas escritas a mano: progreso por nivel, ascendencias, caminos, kits, recompensas
  js/engine.js            ← motor puro (sin DOM): PJ.derivar, prerrequisitos, talentos elegibles
  js/store.js             ← localStorage (cosmere-personajes-v1) + importar/exportar JSON
  js/ui-common.js         ← helpers de DOM
  js/wizard*.js           ← asistente de creación y de subida de nivel (partido en wizard-comun/datos/talentos/poderes/equipo + wizard.js)
  js/sheet.js             ← hoja con pestañas y módulos de nacido del metal
  js/app.js               ← router (hash)
tools/test-personaje.mjs  ← pruebas del motor (node tools/test-personaje.mjs)
```

- Enlaces con el buscador: botón «Personajes» en su cabecera y en la portada; la hoja enlaza a `../index.html#/talento/<id>`, `#/caminos` y `#/arbol/<slug>`.
- Los datos de los libros (con copyright) se usan en local o en un entorno privado, igual que el buscador.

## 8. Fases

1. **Fase 1 — Motor y hoja básica.** `reglas.js`, `engine.js` y pruebas; hoja básica interactiva con atributos, defensas, habilidades, recursos y descansos; gestor de personajes con importar/exportar.
2. **Fase 2 — Asistente de nivel 1.** Los 8 pasos con validación; pericias, talentos con prerrequisitos y equipo inicial.
3. **Fase 3 — Subida de nivel y nivel inicial alto.** Pantalla de nivel, historial, tabla de recompensas y arquillas, bloqueo de talentos por metas pendientes.
4. **Fase 4 — Módulos de nacido del metal.** Alomancia, feruquimia y nacidoble; metas/hitos; viales y cargas; Beber vial/Almacenar/Decantar.
5. **Fase 5 — Hemalurgia, impresión y enlaces.** Módulo de clavos, vista de impresión fiel, enlaces al buscador.
6. **Fase 6 — Pulido.** Reasignación en Reposo, ficha en Markdown, atajos de teclado, revisión de textos.

## 9. Criterios de aceptación

Estado de la v1 (`[x]` verificado en navegador o con pruebas; `[ ]` pendiente o sin verificar):

- [x] Abre con doble clic desde `file://` y funciona sin servidor.
- [ ] Crear un personaje de nivel 1 produce los mismos valores que a mano con los ejemplos «Creación de un…» del Manual (las pruebas del motor cubren la tabla de progreso, pero no se han contrastado esos personajes concretos).
- [x] Crear un personaje de nivel alto (probado en 1, 5 y 10, siete caminos × todas las ascendencias, sin excepciones) produce valores coherentes con la tabla de §6.1. Los niveles 11 y 16 no se han recorrido de forma explícita.
- [ ] Un nacidoble de rango 3 no puede elegir talentos de los árboles de sus poderes sin haber gastado sus recompensas de rango 1 en las metas (sin verificar como caso concreto).
- [x] Un nacido del metal no puede escoger un segundo camino de nacido del metal.
- [x] Los talentos con prerrequisitos se marcan como bloqueados si no se cumplen (los talentos principales de otros caminos se ofrecen y desbloquean su árbol); los que no se pueden evaluar piden confirmación manual y la DJ puede ignorarlos.
- [ ] Almacenar/Decantar respetan el máximo de cargas y la exclusión mutua (el contador de cargas de feruquimia respeta el máximo; sin verificar Almacenar/Decantar).
- [ ] *Beber vial* restaura Investidura y actualiza Desprovisto (sin verificar).
- [x] Exportar e importar un personaje es una operación sin pérdida (ida y vuelta idéntica).
- [x] Las pruebas de `tools/test-personaje.mjs` pasan (97 comprobaciones).
- [ ] La impresión mantiene la disposición de la hoja oficial en A4 (hay `@media print` escrito, pero no se ha revisado la vista previa de impresión).

## 10. Riesgos y preguntas abiertas

1. **Efectos de talentos incompletos (71/366).** Mitigación: bonificadores manuales + posibilidad de anular efectos; priorizar completar a mano los talentos de uso más frecuente por fases.
2. **Páginas 23–33 del Manual de Mistborn ausentes** en la conversión: los textos y reglas de los pasos se infieren del Archivo de las Tormentas y de los capítulos 2, 3, 5 y 7. **Hay que verificar** contra el PDF las reglas exactas (en especial la fila 21+ de progreso, las tablas de conexiones y los kits de equipo inicial).
3. **Era 1 / Era 2:** ¿la herramienta solo cubre las dos eras de Mistborn, o prepara ya el ámbito Stormlight (hay un precedente en `docs/hoja_personaje_roshar.html`)? Propuesta: modelo preparado (`ambito`), contenido solo Mistborn.
4. **Investidura:** su valor máximo depende del camino (DIS o PRE, rango, talentos); hay que confirmar el cálculo exacto para cada camino de nacido del metal en cap. 3 y 5.
5. **Recompensas (cap. 8):** ¿se modelan como lista libre con `rango` y nombre o con datos estructurados (compañeros, patrocinadores, metales raros, clavos)? Propuesta: lista libre en la v1.
6. **Hemalurgia:** el libro la trata como recompensa. ¿La modelamos desde el principio o la dejamos como nota? Propuesta: P1, con las 3 ranuras de la hoja oficial.
7. **Compañeros y patrocinadores:** ¿se gestionan en la hoja del jugador o solo se mencionan? Propuesta: solo mencionarlos como recompensa en la v1.
8. **Casos límite de progreso:** reasignación al subir de nivel, deshacer niveles, ascendencias con reglas especiales (kandra, sangre koloss) y su talento de ascendencia (no funciona como el humano).
9. **Copyright:** la herramienta usa `docs/data/base.js`, que contiene texto de los libros. Igual que el buscador, solo para uso local o privado; no publicar.
10. **Sincronización entre dispositivos:** fuera de alcance (solo exportar/importar JSON). Si se necesitara compartir hojas con la DJ, se evaluaría después.
11. **Mantenimiento de las tablas de reglas:** si el libro tiene fe de erratas, hay que actualizar `docs/personaje/js/rules.js` y ejecutar `node tools/test-personaje.mjs`.

