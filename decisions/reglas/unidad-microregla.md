---
description: La unidad de consulta de las reglas es la microrregla (una regla suelta), no la sección o el capítulo del libro.
applies-to: tools/reglas/*.json, tools/buscador_reglas.py, docs/js/curated.js (catálogo «regla»)
---

# La unidad de las reglas es la microrregla

## Decisión

- Las reglas se consultan como **microrreglas**: una regla suelta, con título, texto y pocos metadatos (tema y asunto). El capítulo o la sección del libro no es un criterio de organización ni se muestra como tal.
- La estructura de microrreglas toma como guía el índice de reglas de Demiplane Nexus (qué reglas existen y cómo se agrupan), pero **el texto es siempre el del Manual en español**; no se copia contenido de Demiplane.
- Cada tema se define en `tools/reglas/<tema>.json`: lista ordenada de microrreglas agrupadas por asunto. Una microrregla indica de qué entradas extraídas se compone (`fuentes`), de modo que se pueden fusionar fragmentos o descartar encabezados contenedores. El id resultante es estable: `regla-<slug>`.

## Estado

Hecho: las reglas están replicadas **1:1 con las páginas de reglas de Demiplane Nexus** (301 microrreglas, incluido el tema «Orígenes»). Pendiente: referencias cruzadas entre microrreglas y el trasfondo de la Guía del mundo.

## Cómo añadir un tema

1. Crear `tools/reglas/<tema>.json` con `tema` y `reglas_por_grupo`.
2. `python tools/build-buscador.py` (falla si una fuente ya no existe en el libro).
3. Quitar del catálogo antiguo lo que ya está cubierto y actualizar los tests de búsqueda (`regla:` en vez de la categoría anterior).

## Cobertura respecto a Demiplane

Objetivo: tener **todas las reglas que existen en Demiplane Nexus (con nuestro texto)**. Lo que tenemos y ellos no se valora caso por caso antes de incluirlo como microrregla.

## Tema y asunto (propios, Demiplane no los tiene)

- **Tema**: área general de juego (hoy solo «Combate»). Es el filtro grueso.
- **Asunto**: agrupación dentro del tema (p. ej. Ataques, Daño lesiones y muerte, Amenaza y dificultad). Es el filtro fino y el orden de lectura.
- Se definen en `tools/reglas/<tema>.json` y se corresponden con lo que busca quien consulta, no con el capítulo del libro.

## Recorte de fuentes

Una microrregla puede tomar parte del texto de una entrada con `{"id": ..., "desde": "...", "hasta": "..."}` (por ejemplo, Impacto, Rasguño, Fallo e Impacto crítico salen de «Paso 3: Resuelve el daño»).

## Qué se deja fuera

- **Ejemplos de juego largos** (ejemplo de conversación, de empeño): no son reglas y Demiplane no los trae como tal; no se publican como microrregla (`descartar` en el JSON).
- **Consejos de interpretación** (primera y tercera persona, conocimiento del jugador): son consejo de juego, no regla. Siguen en el catálogo «Interpretación», a decidir.

## Entidades que no son microrregla

Ascendencias, culturas, pericias culturales y Bendiciones kandra (catálogo «Orígenes»), caminos, talentos, adversarios, armas y objetos son **entidades**, no reglas; el texto de Orígenes que no es algo elegible (introducciones, cuerpos y contratos kandra, koloss, pericias culturales por era) es el tema de microrreglas «Orígenes»; Demiplane las tiene como categorías aparte (Ancestries, Cultures, Paths, Talents, Adversaries, Items). Se mantienen como catálogos propios.

## Valores y cálculos

El catálogo «Valores y cálculos» (salud máxima = 10 + Fuerza, etc.) se conserva como atajo de fórmulas, aparte de las microrreglas de Personaje, que llevan el texto del libro.

## Qué no es microrregla (y se conserva como catálogo)

- **Entidades**: orígenes, talentos, acciones, estados, habilidades, rasgos, armas, armaduras, equipo, metales y adversarios.
- **Extras que no son regla**: arquetipos y personajes icónicos por camino, ejemplos de recompensas y compañeros animales, interpretación, introducción y ambientación, y ejemplos de habilidades.
- **Ejemplos que sí se publican**: los ejemplos de organización, de patrocinador y de compañero (empresa comercial, casa noble, músculo a sueldo…), porque las tablas de beneficios y otras reglas los citan; van dentro de su regla.
- **Descartado como duplicado**: las secciones que el PDF repetía en otro capítulo (objetos investidos y cargas en Hemalurgia, interpretación en Recompensas, versiones duplicadas de «Adversarios derrotados» o «Tipos de daño»).

## Árboles

Cada microrregla recuerda a qué árbol pertenecía su fuente (`f.arbol`), de modo que la página de un camino o de un arte sigue mostrando su texto.

## Consejos para la DJ sin contrapartida en Demiplane

Decisión: lo que Demiplane no tiene como regla y es consejo de dirección (cómo empezar una partida, cuándo pedir pruebas, estructurar una campaña, canon y continuidad, el resto de la guía de seguridad, niveles superiores…) **no se publica**, ni como microrregla ni en ningún catálogo. De «Dirección del juego» solo se conservan las páginas con equivalente en Demiplane: introducción, dado de trama, subir la apuesta, aventuras, recompensas y niveles, eras, otras ambientaciones, sesión cero y líneas y velos.

Los consejos de DJ de otros temas (p. ej. «Preparar la escena (DJ)» en Combate) siguen el mismo criterio y están pendientes de revisar.

## Replicación 1:1 con Demiplane (decisión vigente)

- **Una microrregla = una página de reglas de Demiplane** con nuestro texto. Lo que antes eran piezas sueltas del Manual (por ejemplo, las quince secciones de lesiones o las veintiséis de «stat block») se funden en su página, cada una con su subtítulo. El slug de Demiplane se usa como guía; el título es el nuestro.
- **Aplicable** = fuente Mistborn (Handbook, World Guide, Legacy) o regla general compartida. Las páginas solo de Stormlight (spren, surges, ideales, fabriales, Roshar) no se replican.
- **No se publican consejos de DJ** que no tengan página en Demiplane («Cómo dirigir…», variedad de escenas, escenas por ciudad, guía de seguridad salvo líneas y velos y sesión cero, canon y continuidad, etc.). Lo que no es regla y es **texto de entidad** (cómo crear cada camino, historia, personajes icónicos, tablas de determinación al azar) sale de las reglas y se queda en el catálogo «Textos de caminos».
- **Metadatos**: título, fuente (`primary_source_name`) y descripción breve de cada página salen del HTML público de Demiplane (`app.demiplane.com/nexus/cosmererpg/rules/<slug>`); no se copia su texto.
- **Pendiente de cargar**: la Guía del mundo (trasfondo: autonomía, armonía, el lord Legislador, las brumas, religiones…) y los personajes pregenerados.

## Stormlight

- Las microrreglas de Stormlight son **solo las que no tiene Mistborn**: luz tormentosa e Investidura, caminos radiantes, ideales, spren, escuderos, órdenes, potencias, fabriales (y sus efectos únicos), esferas, equipo inicial de Roshar, cantores y la bienvenida a Roshar (85). Combate, conversaciones, empeños, descanso, dirección y las reglas básicas ya existen y no se repiten.
- Tema «Stormlight» (con asuntos propios) y ambientación Stormlight, de modo que el filtro global de la cabecera las separa. Id `regla-roshar-<slug>`.
- Las fuentes no se declaran por id sino por (categoría, título) en `tools/buscador_reglas_stormlight.py`; si el libro cambia y una falta, el build falla. Las órdenes y los spren se componen por palabras clave del título (el PDF dejó textos de unas órdenes en los ficheros de otras).
- Lo que Mistborn y Stormlight comparten pero con cifras o divisa distintas se publica separado con coletilla: «Equipo inicial (Scadrial)» y «Equipo inicial (Roshar)», «Objetos Investidos (Roshar)».
- Siguen sin publicarse los consejos de DJ de Stormlight sin página de reglas propia (p. ej. «Cómo gestionar la luz tormentosa», «Los Rompedores del Cielo y el canon»); quedan en la página de su camino.

## Una sola sección «Reglas»

El menú Reglas tiene un único catálogo (las microrreglas). Quedan fuera, sin publicar: introducción y ambientación, interpretación, ejemplos de habilidades, ejemplos de recompensas y compañeros animales, y personajes pregenerados. El trasfondo (Guía del mundo y ambientaciones) se incorporará más adelante. El texto específico de cada camino se ve en la página de su camino (catálogo «Textos de caminos», fuera del menú).

## Tablas y limpieza del texto

- El PDF entrega las tablas como párrafos sueltos. Las tablas del libro se escriben como tablas «| a | b |» en `tools/reglas/tablas/tablas.json` (regla, texto con el que empieza la tabla, lo que sigue y el markdown); la interfaz las pinta como tabla. Una tabla nueva que no se encuentre en el texto hace fallar el build.
- Las tablas de objetos que ya existen como catálogo (armas de fuego, armaduras, equipo, metales) no se duplican en el texto: la regla enlaza al catálogo.
- `tools/buscador_limpieza.py` quita restos de maquetación (créditos de ilustradores, pies de foto en mayúsculas, pies de página), pasa los símbolos de era a «(Era N)» une los párrafos y los puntos de lista partidos por el salto de columna, y junta en una sola lista los puntos ◆ seguidos.
- **Formato coherente** (`tools/reglas/formato/<tema>.json`, se aplica tras la limpieza): por regla, `cambios` recoloca fragmentos que el PDF dejó en otro sitio, completa frases cortadas con el texto del libro, añade subtítulos y convierte en tablas o listas lo que llegó como párrafos sueltos; `definiciones` separa las listas de términos que el PDF junta en un párrafo («Rango. … Rol. … Tamaño. …»): cada término empieza párrafo (o punto de lista, con `"lista": true`) y va en **negrita**. La interfaz pinta `**texto**` como negrita. Un cambio que ya no encuentra su texto hace fallar el build. El catálogo Orígenes usa el mismo mecanismo en `tools/reglas/formato/catalogo/origen.json`.
- Convenciones: una idea por párrafo; subtítulos `####` para las secciones; listas ◆ para enumeraciones y pasos (`◆ 1. …`); tablas «| a | b |» para cualquier tabla del libro (incluidas las de Oportunidades y Complicaciones). Si el propio PDF corta una frase y el texto no está en ningún otro sitio, se marca con «… (el texto del libro está cortado aquí)» en vez de inventarlo.
- Una fuente con `"copia": true` se usa en la regla sin quitarla de su catálogo (los valores de «Valores y cálculos» también forman parte del texto de Atributos, Defensas, Salud… y Progreso de los personajes).
