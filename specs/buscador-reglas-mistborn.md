---
description: Spec de una página estática para consultar reglas, acciones, talentos, adversarios, etc. del Cosmere RPG (Mistborn) sin LLM
status: borrador
---

# Buscador de reglas de Mistborn — spec

## 1. Objetivo

Página estática (HTML + JS, sin backend, sin LLM) para **encontrar en segundos** una regla durante la partida o la preparación. Ejemplos que debe resolver en ≤2 interacciones:

| Pregunta real | Qué debería pasar |
|---|---|
| "¿Cómo era el nivel de amenaza?" | Escribo `amenaza` → primer resultado: *Configuración de las escenas de combate*, con la tabla/regla ya visible. |
| "¿Cómo curo a otro con Medicina?" | Escribo `curar medicina` → *Medicina de campo* (combate, CD 15, 1 concentración), *Cuidados continuos* (descanso, CD 10), la habilidad Medicina y *Reposo*, agrupados. |
| "¿Qué puedo hacer con una Oportunidad?" | Escribo `oportunidad` → tabla de usos en combate, y usos fuera de combate (conversaciones, empeños). |
| "¿Qué implica Ayudar en combate?" | Escribo `ayudar` → reacción *Ayudar (r)* completa + enlaces a Ventaja y a Obtener ventaja. |

**No-objetivos:** no sustituye al libro (es un índice con el texto de las secciones, no una reinterpretación), no genera texto, no guarda hojas de personaje, no es un VTT. No se reescriben ni resumen reglas: se muestra el texto original del manual.

## 2. Valoración y enfoque recomendado

**Es viable y de bajo riesgo**, porque la fuente ya está en el repo (`resources/Mistborn Manual/`, un `.md` por sección con frontmatter `title/chapter/pages`). Lo difícil no es la web, es **partir bien el contenido en entradas consultables**: una sección entera de un capítulo (3-30k caracteres) es demasiado grande para ser una "respuesta".

Decisiones clave:

1. **Granularidad = encabezado, no archivo.** Cada `###`/`####` del `.md` se convierte en una *entrada* (p. ej. "Ayudar (r)", "Medicina de campo", "Recuperarse (2)"). Es la unidad que se busca y se muestra.
2. **Búsqueda en cliente con un índice precalculado** (MiniSearch o FlexSearch; ~10 KB). Sin servidor: funciona offline y en GitHub Pages. El corpus completo del manual cabe holgado (< 3 MB de JSON, < 1 MB gzip).
3. **Búsqueda tolerante al español**: sin acentos, sin mayúsculas, stemming simple, prefijos, tolerancia a erratas, **sinónimos propios** (ver §6). Este es el factor que más hace que "funcione sin LLM".
4. **Tipado de entradas** (regla, acción, reacción, talento, habilidad, estado, objeto, arte metálica, adversario…) para poder filtrar y para renderizar cada tipo con su ficha adecuada.
5. **Pipeline de datos separado de la web**: un script (`tools/`) genera `data/*.json` desde los `.md`; la web solo lee JSON. Así regenerar tras corregir un `.md` es un comando.
6. **Corrección manual por encima de la extracción automática**: la conversión PDF→MD es imperfecta (columnas desordenadas, tablas planas, pies de ilustración). Habrá un fichero de *overrides* curado a mano para lo importante (tablas de amenaza/oportunidades, estados, acciones) en vez de pelear con el parser.

## 3. Fuentes

| Fuente | Contenido | Dificultad |
|---|---|---|
| `Mistborn Manual` cap. 3 | Atributos, defensas, pericias, habilidades, salud/concentración/investidura | Media (habilidades con listas de usos) |
| cap. 4-5 | Caminos, especialidades, **talentos** (`#### Nombre` + `Prerrequisito:` + texto; ★ = talento clave; icono de acción) | Media: regular, parseable |
| cap. 6 | Alomancia, feruquimia, hemalurgia (talentos por metal) | Media |
| cap. 7 | Armas, armaduras, equipo, viajes, manufactura | Alta (tablas planas) |
| cap. 9 | Descanso, reposo, **estados**, daño, lesiones, muerte | Media |
| cap. 10 | **Combate**: acciones, reacciones, ataques, alcance, movimiento, oportunidades/complicaciones | Media-baja: `###` por acción con coste en el título, p. ej. `Moverse (1)` |
| cap. 11-12 | Conversaciones, empeños | Media |
| cap. 13 | Dirección de juego: **nivel de amenaza**, adversarios, uso de oportunidades, dado de trama | Media |
| Glosario e índice | Términos del libro con página | Alta (texto plano) → útil solo como lista de términos/sinónimos |
| *(Fase posterior)* `Mistborn Guia del Mundo` cap. 8 | **Adversarios** (stat blocks) y módulos | Media-alta (ver §8) |

> **Nota sobre adversarios y otros libros:** el Manual solo explica *cómo usarlos* (roles Secuaz/Rival/Jefe, rasgos, niveles de amenaza). Los stat blocks están en la **Guía del Mundo** (cap. 8), que **sí se incluye**. Ver §11 para el catálogo de categorías por libro; §4.8 queda subsumido por §11.

## 4. Funcionalidades

Prioridad: **P0** = MVP, **P1** = siguiente iteración, **P2** = deseable.

### 4.1 Búsqueda (P0)

- **Caja única de búsqueda**, enfocada al cargar, atajo `/` para volver a ella, `Esc` para limpiar.
- Resultados **mientras escribes** (sin botón), ordenados por relevancia con *boost* por: coincidencia en título > en alias/sinónimo > en cuerpo.
- Cada resultado muestra: **tipo** (chip), **título**, **ruta** (Combate › Acciones), **fragmento** con el término resaltado y **página del libro**.
- Click abre la entrada en un panel lateral (escritorio) o a pantalla completa (móvil), sin perder la lista.
- **Sin acentos / sin mayúsculas / prefijos / tolerancia a una errata** (`oportunidad`, `oportunidades`, `oprtunidad`, `medicna`).
- **Frase exacta** con comillas y **exclusión** con `-palabra`.
- Búsqueda por **valor numérico** de CD / coste (`CD 15`, `2 concentración`), útil para recordar "qué era la de CD 15".
- Mensaje útil cuando no hay resultados: sugerencias de términos próximos y enlace a "buscar en todo el texto".

### 4.2 Filtros y facetas (P0/P1)

- **Tipo** (P0): Reglas · Acciones · Reacciones · Talentos · Habilidades · Estados · Objetos · Artes metálicas · Adversarios (multi-selección, con contadores).
- **Capítulo** (P0).
- **Facetas por tipo** (P1): al filtrar Talentos → camino, especialidad, prerrequisito de habilidad, ¿★?, ¿consume acción/reacción/gratis?; al filtrar Acciones → coste (0/1/2/3/r); al filtrar Objetos → categoría.
- **Era 1 / Era 2** (P1): el manual marca contenido con `ERA 1`/`ERA 2`; permitir ocultar el que no se usa en la campaña (se recuerda la preferencia).
- Los filtros viajan en la URL.

### 4.3 Fichas de entrada (P0)

Texto original completo del apartado, con formato (negritas, listas, tablas) y:

- **Cabecera**: tipo, capítulo, página del libro y enlace "ver en el PDF" si procede.
- **Datos estructurados cuando existan** (P1): talento → prerrequisito, camino, acción; acción → coste y detonante; habilidad → atributo y defensa asociados.
- **Entradas relacionadas**: cualquier término que sea título/alias de otra entrada aparece como **enlace interno** dentro del texto (ej. en *Ayudar*, "ventaja" enlaza a *Ventaja y desventaja*, "reacción" a *Obtener reacciones*). Los enlaces los genera el script automáticamente; los falsos positivos se silencian con una lista de exclusión.
- **Botón copiar** (texto o enlace) y **enlace permanente** (`#/entrada/<slug>`) para pegar en notas de campaña.
- **Anterior / siguiente** dentro del mismo capítulo.

### 4.4 Consulta rápida ("chuleta de mesa") (P0)

Pantalla inicial con **tarjetas de acceso directo** a lo que más se consulta, sin escribir:

- **Combate**: orden de turno · turno rápido/lento · acciones (con su coste, en una sola tabla) · reacciones · acciones gratuitas · Sorpresa · Ataques · Alcance · Movimiento.
- **Oportunidades y Complicaciones**: tabla de usos en combate, en conversación, en empeño; coste de Oportunidad vs. Complicación; cómo gasta la DJ.
- **Estados** (A-Z) con su efecto de una línea.
- **Dado de trama** y resultados.
- **Daño, lesiones y muerte**; **Descanso y Reposo** (qué se recupera, qué se puede hacer, quién puede tratar a quién).
- **Nivel de amenaza** y construcción de encuentros.
- **Ventajas/desventajas**, **Concentración**, **Investidura**.

Esta lista es configurable: el usuario puede **fijar** (⭐) cualquier entrada a la pantalla inicial (guardado en `localStorage`).

### 4.5 Navegación por temas ("¿cómo se hace X?") (P1)

Búsqueda por **intención**, no por nombre. Un fichero curado `topics.json` agrupa entradas bajo preguntas habituales:

- *Curar / sanar* → Medicina (habilidad), Medicina de campo, Sanación ágil, Cuidados continuos, Recuperarse, Reposo, Descanso.
- *Ayudar a un aliado* → Ayudar, Obtener ventaja, Prepararse, talentos de apoyo del Líder.
- *Huir / escapar* → Destrabarse, Moverse, Empeños de persecución.
- *Escapar de un agarre / estados* → Agarrar, Empujar, Retenido…
- *Qué puede hacer la DJ con una Complicación* …

Se ve como índice navegable y también como **sugerencia al buscar** ("¿Querías decir: *curar*?"). Es lo que de verdad sustituye al LLM; se construye a mano y crece con el uso (P2: registro local de búsquedas sin resultado para saber qué falta).

### 4.6 Talentos (P1)

- Listado/buscador de talentos con filtros por **camino → especialidad**, **habilidad prerrequisito**, **★**, **tipo de acción**.
- Vista **árbol de especialidad** (talentos ordenados como en el libro, con sus prerrequisitos enlazados).
- Comparar dos talentos lado a lado (P2).
- Las artes metálicas se tratan igual: por metal, con vista alomancia / feruquimia.

### 4.7 Reglas de combate con ayudas de lectura (P1)

- **Tabla única de acciones** (nombre, coste, resumen de una línea, enlace) y otra de **reacciones**: la vista que más se echa en falta con el PDF.
- **Tabla de Oportunidades/Complicaciones** extraída de forma limpia (override manual) en lugar del texto con columnas rotas.
- **Glosario** (términos del libro con definición corta) accesible con `?` desde cualquier ficha; *hover/tap* sobre un término enlazado muestra una vista previa.

### 4.8 Adversarios (P2, requiere Guía del Mundo)

- Buscar adversario por **nombre, rol (Secuaz/Rival/Jefe), rango, rasgo o acción**.
- Ficha tipo stat block: defensas, salud, concentración, movimiento, habilidades, rasgos, acciones, tácticas; rasgos y acciones enlazados al glosario.
- Filtro por **rango de amenaza** y por **Era**.
- Módulos de adversario (alomancia, feruquimia, clavos) como entradas propias.
- El script de importación necesita lógica específica: la línea de atributos viene aplanada (`fue def vel int def vol dis def pre 2 14 2 …`) y se reconstruye por posición; si falla en un bloque, se corrige con override.

### 4.9 Utilidades de mesa (P2)

- **Calculadora de amenaza**: marcas los adversarios (rol × rango) y los PJ y se compara con la guía del manual. Solo aplica la regla escrita; no inventa reglas.
- **Historial** de las últimas entradas abiertas (para volver a "esa regla de hace cinco minutos").
- **Modo oscuro** y **tamaño de letra** ajustable; vista imprimible de una entrada.

### 4.10 No funcionales

- **Estática pura** (HTML/CSS/JS + JSON). Se sirve con GitHub Pages o abriendo el `index.html` local (el índice debe poder cargarse también sin servidor: JSON incrustado como `.js` para `file://`).
- **Rápida**: primera carga < 1 s en conexión normal; búsqueda < 50 ms por pulsación.
- **Offline** tras la primera visita (service worker, P1).
- **Móvil primero**: se usa en mesa con el teléfono. Objetivos táctiles grandes, buscador fijo arriba.
- **Accesible**: navegación por teclado, contraste, `aria-live` en resultados.
- **Español** como idioma de interfaz y de contenido.
- **Derechos**: el texto del manual es contenido con copyright. La web debe usarse en privado/entorno personal o no publicarse con el texto íntegro. Decisión abierta en §10.

## 5. Modelo de datos

```jsonc
// data/entries.json — una entrada por apartado consultable
{
  "id": "combate-ayudar",                 // slug estable (enlaces permanentes)
  "type": "reaccion",                     // regla|accion|reaccion|gratuita|talento|habilidad|estado|objeto|arte|adversario|termino
  "title": "Ayudar",
  "aliases": ["ayuda", "asistir", "prestar ayuda"],   // curados + generados
  "path": ["Capítulo 10: Combate", "Ataques"],
  "source": { "book": "Manual", "pages": "327-329", "file": "11 - .../03 - Ataques.md" },
  "era": null,                            // 1 | 2 | null
  "cost": "r",                            // acciones: 0|1|2|3|r|* ; null si no aplica
  "body": "<texto en markdown>",
  "meta": { },                            // campos por tipo (talento: prerrequisito, camino, especialidad, star)
  "related": ["ventaja", "prepararse"],
  "topics": ["ayudar-aliado"]
}
```

- `topics.json`: temas/intenciones → lista de ids (curado a mano).
- `synonyms.json`: grupos de sinónimos para ampliar la consulta (curado).
- `overrides/`: ficheros que sustituyen/añaden entradas cuando el parser no basta (tablas).
- `search-index.json`: índice serializado, generado por el script.

## 6. Búsqueda: reglas concretas

- Normalización: minúsculas, quitar tildes, ñ→n, quitar signos, singular/plural básico.
- **Sinónimos y jerga de mesa** (primer lote, hay que ampliarlo jugando): `curar≈sanar≈medicina≈recuperar`, `pegar≈atacar≈acometida`, `huir≈destrabarse≈escapar`, `tirada≈prueba`, `PNJ≈adversario`, `DJ≈máster≈director`, `HP≈salud`, `focus≈concentración`, `plot die≈dado de trama`, `opp≈oportunidad`, `comp≈complicación`, `buff≈ventaja`, `debuff≈desventaja≈estado`.
- **Ponderación**: título ×5, alias ×4, encabezado padre ×2, cuerpo ×1. Los tipos "regla/acción/estado" suben ligeramente frente a "talento" para consultas cortas (`ayudar` debe devolver la reacción antes que 9 talentos que la mencionan).
- **Búsqueda por tipo implícita**: prefijos opcionales `talento:`, `accion:`, `estado:`, `adv:`.
- **Casos de prueba** (ver §9) fijan que estas consultas devuelvan lo esperado en el top 3.

## 7. Estructura propuesta en el repo

```
specs/buscador-reglas-mistborn.md     ← este documento
tools/build-rules-index.py            ← .md → data/*.json (+ índice de búsqueda)
tools/rules-queries.test.json         ← consulta → entradas esperadas (regresión)
<carpeta-web>/                        ← index.html, js/, css/, data/
  data/curated/                       ← topics.json, synonyms.json, overrides/
```

Ubicación de la web: **carpeta nueva independiente** (p. ej. `buscador/`), sin reutilizar código ni datos de `docs/`.

## 8. Fases

| Fase | Contenido | Resultado |
|---|---|---|
| **0 · Extractor** | Script que parte los `.md` por encabezado, detecta tipo y metadatos, genera `entries.json`. Informe de calidad (entradas vacías, muy largas, con ruido de maquetación). | Datos auditables antes de escribir UI |
| **1 · MVP** | Buscador + resultados + ficha + filtros por tipo/capítulo + pantalla de consulta rápida + enlaces permanentes. Solo manual. Sinónimos iniciales. | Resuelve los 4 ejemplos del §1 |
| **2 · Calidad** | `topics.json` (intenciones), enlaces internos automáticos, tablas curadas (acciones/reacciones/oportunidades/estados), facetas de talentos, offline, Era 1/2. | Sustituye de verdad al LLM para dudas habituales |
| **3 · Adversarios** | Importar Guía del Mundo cap. 8 + módulos; ficha de stat block; filtros. | Buscador de enemigos |
| **4 · Mesa** | Favoritos, historial, calculadora de amenaza, impresión. | Comodidad |

## 9. Criterios de aceptación del MVP

Se verifican con `rules-queries.test.json` (la consulta debe devolver la entrada esperada en el **top 3**):

| Consulta | Debe aparecer |
|---|---|
| `nivel de amenaza` | Configuración de las escenas de combate |
| `curar` / `medicina de campo` | Medicina de campo, Cuidados continuos, Reposo |
| `oportunidad` | Oportunidades y complicaciones en combate |
| `ayudar` | Ayudar (r) |
| `destrabarse` / `huir` | Destrabarse |
| `sorprendido` | Sorpresa / estado Sorprendido |
| `agarrar` | Agarrar (2) |
| `turno rapido` | Orden del combate / Acciones y reacciones |
| `concentracion` | Salud, Concentración e Investidura |
| `dado de trama` | Uso del dado de trama |

Además: ≥ 95 % de talentos del manual con prerrequisito y camino extraídos; 0 entradas sin título; ninguna entrada > 6k caracteres sin subdividir; la web funciona en móvil de 360 px y sin conexión (fase 2).

## 10. Riesgos y preguntas abiertas

1. **Calidad de la conversión.** Tablas planas y columnas desordenadas afectan a las reglas más consultadas (amenaza, oportunidades). Mitigación: overrides manuales sobre esas ~10-15 entradas; ante la duda, enlace a la página del PDF.
2. **Falsos positivos en enlaces automáticos** (palabras comunes como "acción", "ventaja"). Mitigación: solo enlazar títulos de ≥ 2 palabras o de una lista blanca, y primera aparición por entrada.
3. **Copyright.** ¿La web es solo de uso personal/local, o se va a publicar (GitHub Pages)? Si se publica, valorar no incluir el texto íntegro (solo título, resumen propio y página) o proteger el acceso. **Necesito tu decisión.**
4. **¿Un solo libro con selector o un buscador transversal?** Propuesta: transversal con chip de libro (Manual / Guía del Mundo / Legado) cuando haya más de uno.
5. **¿Se integra en el futuro Stormlight?** Si es probable, mantener el esquema de entradas agnóstico del sistema (`book`, `system`).
6. **Sinónimos y temas** son trabajo manual continuo: conviene un fichero fácil de editar y un modo "qué he buscado sin éxito" local.
7. **Tecnología:** propuesta vanilla JS + MiniSearch, sin framework ni paso de build para la web (solo para generar datos), para que sea fácil de mantener y servir desde cualquier sitio.

## 11. Catálogo de categorías y navegación

Revisión posterior al §4: la web no es solo un buscador, es un **navegador de información**. Hay dos tipos de contenido y se tratan distinto:

- **Catálogos** (datos estructurados): cada elemento tiene *campos* y se ve como **tabla filtrable y ordenable** (armas, talentos, adversarios…).
- **Textos**: reglas y lore que se leen; se ven como lista/árbol de fichas (combate, descanso, historia, lugares…).

### 11.1 Modelo de navegación

1. **Inicio**: tarjetas por categoría (con contador) agrupadas en *Personaje · Equipo · Combate y reglas · Poderes · Adversarios · Mundo · Aventura*, más la caja de búsqueda y la consulta rápida (§4.4).
2. **Vista de catálogo** (una por categoría): tabla con columnas configurables, orden por cualquier columna, filtros por campo (chips para campos con pocos valores, rango para numéricos, texto para el resto), búsqueda dentro del catálogo, fila expandible con el texto completo y estado completo en la URL (`#/armas?distancia=si&rasgo=mortifera&orden=precio`).
3. **Búsqueda global**: resultados **agrupados por categoría con contador** ("ballesta" → Armas 1 · Reglas 3 · Equipo 0…). Click en el grupo abre ese catálogo ya filtrado por la búsqueda.
4. **Enlaces cruzados** entre categorías: rasgo de arma → entrada del rasgo; talento → habilidad prerrequisito; adversario → sus rasgos/acciones/módulos; arte metálica → metal; estado → reglas que lo causan.
5. **Selectores globales** persistentes: Era 1 / Era 2 / ambas, y libro (Manual / Guía del Mundo / Legado).

### 11.2 Catálogos (tablas filtrables)

| Categoría | Libro | Campos para filtrar/ordenar | Dificultad de extracción |
|---|---|---|---|
| **Armas** | Manual c.7 | nombre, familia (ligera/pesada/especial/bastón de duelo/improvisada), cuerpo a cuerpo/distancia, dado y tipo de daño, alcance, rasgos, rasgos de experto, peso, precio, pericia, era | Media: tabla aplanada pero con patrón fijo (`Ballesta 1d8 laceración A distancia [30/120] Cargada [1], A dos manos Mortífera 3,5 kg 100 ar`) |
| **Armaduras** | Manual c.7 | tipo, valor de desvío, rasgos, rasgos de experto, peso, precio | Media |
| **Equipo** | Manual c.7 | nombre, categoría, peso, precio (con rango), efecto mecánico | Media-alta: tabla + párrafos descriptivos por objeto que hay que casar |
| **Metales y viales** | Manual c.6-7 | metal, alomancia/feruquimia, precio Era 1/Era 2 | Media |
| **Talentos** | Manual c.4-6 | camino, especialidad, orden, prerrequisito (habilidad y grados), ★, tipo de acción/coste, era | Media: estructura regular |
| **Caminos y especialidades** | Manual c.4-5 | camino, tipo (heroico / nacido del metal), habilidad clave, talento principal, era | Baja |
| **Artes metálicas** | Manual c.6 | metal, arte (alomancia/feruquimia/hemalurgia), talento, coste, acción | Media |
| **Habilidades y pericias** | Manual c.3 | habilidad, atributo, defensa, ejemplos de uso | Media |
| **Ascendencias y culturas** | Manual c.2 | nombre, tipo, pericias, rasgos/talentos, era | Media |
| **Acciones / reacciones / gratuitas** | Manual c.10 | nombre, tipo, coste, detonante, requiere ataque | Baja |
| **Estados** | Manual c.9 | nombre, efecto, cómo se elimina, quién lo causa | Baja-media |
| **Rasgos** (armas, armaduras, adversarios) | Manual c.7 y c.13, Guía c.8 | nombre, aplica a, efecto | Media |
| **Recompensas** (clavos hemalúrgicos, compañeros, patrocinadores, refugios, creaciones raras) | Manual c.8 | tipo, rango, efecto | Media-alta |
| **Compañeros animales** | Manual apéndice | nombre, rango, estadísticas, rasgos | Media |
| **Adversarios** (conjuntos de características) | Guía c.8 | nombre, rol (Secuaz/Rival/Jefe), rango, tamaño/tipo, era, salud, concentración, defensas, movimiento, habilidades, rasgos, acciones | Media-alta: línea de atributos aplanada, ~45 bloques (varios por entrada: koloss neófito/veterano/anciano, kandra espía/defensor) |
| **Módulos de adversario** | Guía c.8 | tipo (alomancia/feruquimia/clavos), metal, efecto en rango/amenaza | Media |

### 11.3 Textos (navegables por árbol y buscables)

| Categoría | Libro | Contenido / filtros |
|---|---|---|
| **Reglas de juego** | Manual intro, c.3, c.9-13 | combate, oportunidades/complicaciones, descanso/reposo, daño y lesiones, conversaciones, empeños, dado de trama, nivel de amenaza, guía de seguridad. Filtro por capítulo y tema (§4.5) |
| **Dirección del juego** | Manual c.13 | pruebas, estructura de campaña, uso de Eras, canon |
| **Personajes y aliados** | Guía c.5 | Vin, Kelsier, Waxillium, Wayne… (era, afiliación, rol) |
| **Organizaciones** | Guía c.5 | Casa Venture, Ministerio de Acero, Policía de Elendel, Sangre Espectral… |
| **Lugares** | Guía c.6-7 | Luthadel, Elendel, Bilming, Nueva Seran… (era, región, tipo) |
| **Regiones y culturas** | Guía c.2 | Dominios (Era 1), Cuenca de Elendel, Áridos… |
| **Cosmología y religión** | Guía c.3 | Esquirlas, Lord Legislador, religiones, El Camino |
| **Historia y cronología** | Guía c.4 | Eras, línea temporal |
| **Mundo: artes metálicas y tecnología** | Guía c.1 | lore de las artes y la ciencia (complementa los talentos) |
| **Glosario y pronunciación** | Manual + Guía | términos, índice de términos con página |

### 11.4 Legado (aventura): tratamiento aparte

`Nacidos de la Bruma Legado` es una aventura: personajes principales/secundarios, legados de personajes, localizaciones por sala (C1, C2…), encuentros y desarrollo por capítulo. Contiene **spoilers** para jugadores.

- Categoría "Aventura" **oculta por defecto**, junto con los **Adversarios** y sus módulos: ambos pertenecen al **Modo DJ** (ver §11.8).
- Catálogos útiles dentro: *legados de personaje* (Era 1/2), *personajes de la aventura*, *localizaciones por capítulo*, *encuentros/adversarios usados* (enlazados a sus fichas de la Guía del Mundo).
- El resto (guion, escenas) se queda como texto navegable por capítulo.

### 11.5 Priorización

- **Ola 1 (más valor de filtrado):** Armas, Armaduras, Equipo, Talentos, Adversarios, Acciones/Reacciones, Estados, Habilidades + reglas de combate (§4.4).
- **Ola 2:** Artes metálicas, Caminos y especialidades, Orígenes, Rasgos, Módulos, Recompensas, Compañeros.
- **Ola 3 (lectura):** Mundo (personajes, organizaciones, lugares, historia, religión), Glosario, Legado.

**Revisión tras decisiones del usuario:**

- **Versión 1:** catálogos mecánicos del Manual (Ola 1 y 2) + reglas + **Modo DJ** con Adversarios y Legado (sus catálogos y textos de aventura).
- **Versión 2:** lore de la Guía del Mundo (personajes, organizaciones, lugares, regiones, religión, historia) y glosario.
- **Versión 3:** Notas de Campaña (categoría privada).

### 11.6 Impacto en datos y extracción

- `entries.json` pasa a tener `category` y un objeto `fields` **tipado por categoría** (esquema por catálogo: texto, número, enumeración, lista, rango). Columnas, filtros y facetas se generan a partir de ese esquema, no se programan una a una.
- Para los catálogos de tablas aplanadas (armas, armaduras, equipo, precios), la extracción desde el `.md` es frágil: propongo **extraer esas páginas directamente del PDF con detección de tablas** y validar contra el `.md`. El informe de calidad de la fase 0 debe listar filas con campos vacíos o inconsistentes.
- Los valores repetidos (rasgos, tipos de daño, pericias) se normalizan a vocabularios controlados (`vocab/*.json`) para que los filtros no tengan duplicados por erratas.

### 11.7 Decisiones tomadas

1. **Modo DJ** protege Legado y Adversarios (§11.8).
2. **Lore de la Guía del Mundo:** versión 2.
3. **Notas de Campaña:** versión 3.

### 11.8 Modo DJ (activación no visual)

El modo DJ no tiene interruptor ni indicador en la interfaz: se activa solo por URL, para que un jugador que mire la pantalla no vea que existe.

- **Activar:** abrir la web con `?dj=1` (p. ej. `.../index.html?dj=1`). **Desactivar:** `?dj=0`.
- **Persistencia:** al activarse se guarda en `localStorage` y se limpia el parámetro de la barra de direcciones (`history.replaceState`), de modo que la URL visible no lo delate y no se comparta por accidente al copiar el enlace.
- **Sin modo DJ** (por defecto): las categorías gated no aparecen en el inicio, los menús ni los filtros; **tampoco en la búsqueda global ni en los contadores**; los enlaces cruzados hacia ellas no se renderizan; y una URL directa a una entrada gated muestra el mismo "no encontrado" que una inexistente.
- **Qué protege:** Adversarios (fichas, rasgos de adversario, módulos) y todo Legado (personajes, legados, localizaciones, encuentros, guion).
- **Qué NO protege:** las reglas de uso de adversarios y el nivel de amenaza (Manual c.13) siguen visibles, porque son reglas, no spoilers.
- **Implementación:** las entradas llevan `gated: "dj"`. El índice de búsqueda se construye con las entradas gated en un segmento separado que solo se carga cuando el modo está activo, para que no viaje ni se indexe en el cliente sin el parámetro.
- **Límite honesto:** es ocultación, no seguridad. Si la web está publicada, los datos gated siguen siendo descargables por quien conozca la URL del segmento. Si se necesita protección real, hay que no publicar ese segmento (servirlo solo en local), lo que enlaza con la pregunta de copyright del §10.3.

## 12. Estado de la v1 (revisada)

Implementada en [buscador/](../buscador/README.md). Cambios respecto al planteamiento inicial, por decisión del usuario:

- **Sin "Temas" ni accesos rápidos**: la portada es el buscador y, debajo, todas las categorías como menú (Personaje · Caminos · Equipo · Reglas · Dirección), que además está arriba en desplegables.
- **Centrada en Cosmere RPG**, no en Mistborn. Cada entrada lleva un **ámbito** jerárquico: *Mistborn* (general), *Mistborn Era 1*, *Mistborn Era 2* (y en el futuro *Stormlight*…). El selector global muestra lo general más lo de la era elegida.
- **Creación de personaje** como regla general (guía de ocho pasos con enlaces) y **Valores y cálculos** como mini-reglas (salud, concentración, Investidura, defensas, movimiento, sentidos, dado de recuperación, carga, progreso por nivel…).
- **Caminos**: árbol completo por camino/arte (heroicos, nacidos del metal, alomancia, feruquimia, ascendencias), con vista de árbol y de lista, y **una página por talento** (requiere / desbloquea). Preparado para sumar otras secciones (p. ej. radiantes) en `treeSections`.
- **Iconos** en menú, categorías, filtros, columnas, valores (armas, tipos de daño, roles, atributos…), coste de acción/reacción y ámbito.
- Modo DJ por `?dj=1` (adversarios, módulos y Legado), como antes.

Pendiente: enlaces internos automáticos entre fichas, offline (service worker), agrupar talentos por especialidad (no fiable con el PDF actual), tablas curadas a mano de oportunidades/amenaza, catálogos de Legado, calculadora de amenaza, lore de la Guía del Mundo (v2) y Notas de Campaña (v3).
