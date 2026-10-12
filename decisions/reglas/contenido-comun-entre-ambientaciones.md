---
description: Lo que es igual en todas las ambientaciones cargadas pasa a ambientación «Cosmere» y fuente «Manual del Juego»; lo que cambia, aunque se parezca, se queda en su ambientación.
applies-to: tools/build-buscador.py (libro_de), tools/buscador_personaje.py (UTILIDAD_COMUN), tools/buscador_stormlight.py, docs/js/curated.js (ambientacionPath), docs/js/app.js (visible, ambCubre)
---

# Contenido común entre ambientaciones: ambientación Cosmere y fuente Manual del Juego

## Decisión

- Cada vez que se carga un libro de otra ambientación (hoy el Manual del Archivo de las Tormentas junto al de Mistborn), se compara con lo que ya hay. Si algo **está en todas las ambientaciones cargadas, con el mismo texto o reglas**, deja de pertenecer a una y pasa a:
  - **Ambientación:** `Cosmere`. Es general: se ve con cualquier filtro de ambientación (también con Stormlight o una era de Mistborn) y es lo que se ve con cualquier opción del filtro global de la cabecera. La opción «Cosmere» de ese filtro (con el icono `cosmere`) muestra todo, no solo lo común.
  - **Fuente (`libro`):** `Manual del Juego`. Una sola fuente, no la lista de manuales de donde sale.
- «Común» exige coincidencia en **todas** las ambientaciones cargadas. Que esté en dos de tres no basta: sigue en su ambientación (o en las que lo tengan, si se separa).
- Lo que **solo se parece** (mismo concepto con texto o reglas distintos, como la ascendencia humana de Scadrial y la de Roshar) **no se funde**: cada una conserva su ambientación y fuente, y el título lleva una coletilla que las distingue: «Ascendencia humana (Scadrial)», «Ascendencia humana (Roshar)».
- Una entrada que ya era Cosmere y deja de ser común al cargar otra ambientación (el texto difiere) se vuelve a separar por ambientación.

## Cómo aplicarlo

- Al añadir una ambientación, revisar las listas con contenido de ejemplo o genérico (pericias de utilidad, de arma y de armadura, rasgos, estados, habilidades, objetos básicos…) buscando coincidencias con lo ya cargado.
- Una entrada común se genera **una vez**, con `ambientacion: "Cosmere"` y `libro: "Manual del Juego"`; no se duplica por ambientación. Su id no lleva prefijo de ambientación.
- El contenido propio de una ambientación sigue con su prefijo de id (`origen-stormlight-…`) para no mezclarse con el de otra en el asistente de personajes y en las búsquedas por título.
- **Objetos (armas, armaduras, rasgos, equipo)**: cada ambientación tiene sus entradas. El precio va en la divisa de cada mundo (arquillas en Mistborn, marcos en Stormlight) y los dos manuales redactan los rasgos con palabras distintas, así que aunque el arma se llame igual («Espada larga») y tenga las mismas características, no se funden: dos entradas, cada una con su ambientación y su fuente. El enlace del rasgo en una ficha busca primero el de su ambientación.
- **Caminos heroicos**: los seis caminos (Agente, Cazador, Enviado, Erudito, Guerrero, Líder) existen en las dos ambientaciones y son **un solo árbol** por camino (mismo `f.origen`), con los talentos de cada manual etiquetados. Un talento de Stormlight pasa a Cosmere / «Manual del Juego» (se funde con el de Mistborn, que es el que se conserva) si el camino y el nombre coinciden, los prerrequisitos y la activación son los mismos y el texto es equivalente (similitud de palabras ≥ 0,9; se tolera la redacción distinta de la traducción pero no una cláusula añadida). Si no, queda como **variante** de Stormlight con el mismo nombre (p. ej. Ojo avizor, que en Stormlight añade una regla para conversaciones). Las especialidades que solo existen en un manual (Rebelde, Espía, Arquero…) conservan su ambientación. Los prerrequisitos de un talento solo enlazan con talentos de su ambientación o Cosmere.
- **Pericias en arma y en armadura**: se derivan de los objetos y **sí** se funden cuando el nombre y el rasgo de experto coinciden en las dos ambientaciones (Espada larga, Cuchillo, Armadura de cuero…): una sola pericia Cosmere, con enlace al arma de cada manual. Las que cambian (Arma improvisada, que difiere en el rasgo de experto) o solo existen en una (Hoja esquirlada, Gran arco, Daga de cristal…) se quedan en su ambientación.

## Estado

- Cosmere hoy: siete ejemplos de pericia de utilidad que dan igual los dos manuales (Cuidado de animales, Estrategia militar, Fabricar armaduras, Fabricar equipo, Ingeniería, Montar a caballo, Religión) y las pericias en arma y en armadura con el mismo nombre y rasgo de experto (15 de arma y 4 de armadura).
- Solo Mistborn: el resto de ejemplos del Manual de Mistborn (p. ej. Mecánica de automóviles). Solo Stormlight: Historia y Fabricar armas (el de Mistborn es «Fabricar armamento»; ¿mismo concepto? revisar con el texto inglés).
- Caminos heroicos (64 talentos comunes de 150 en Stormlight): Agente comparte Investigador y Ladrón (nuevo en Stormlight: Espía; solo Mistborn: Rebelde); Enviado, Fiel y Mentor (Diplomático / Estafador); Erudito, Cirujano y Estratega (Artifabriano / Inventor); Líder, Oficial y Político (Campeón / Planificador). Cazador y Guerrero comparten solo Rastreador y Soldado: Arquero y Asesino frente a Francotirador y Mataneblinos, y Duelista y Portador de esquirlada frente a Alborotador y Pistolero.
- Corrección en Mistborn: las especialidades de Líder «Planificador» y «Político» estaban con el rótulo cambiado (se ve en el encabezado «Especialidad de …» del propio libro); `corrige_especialidades` en `tools/build-buscador.py` las deja bien.
- El asistente de personajes ofrece, según el ámbito del personaje, lo `Cosmere` más lo de Mistborn (de su era) o lo de Stormlight, nunca lo de la otra ambientación (ver [personajes-por-ambito](personajes-por-ambito.md)).

## Por qué

Con una sola entrada común, la consulta no repite lo mismo por cada libro y el filtro por ambientación no oculta reglas que valen en cualquier mesa. Exigir coincidencia en todas evita presentar como general algo que cambia de un mundo a otro.
