---
description: Cada entrada indica de qué libro o campaña viene (campo libro), nunca la página, y esa fuente es filtro en las listas y la búsqueda.
applies-to: tools/build-buscador.py, docs/js/curated.js, docs/js/app.js, docs/combates/js/vista.js, docs/personaje/js/ui-common.js y cualquier lista, ficha o catálogo nuevo
---

# Fuente del contenido (libro o campaña), sin números de página

## Decisión

- **No se publica el número de página.** El campo `pages` se descarta al generar `docs/data/*.js` y ninguna pantalla muestra «págs.».
- **Sí se publica la fuente** en el campo `libro` de cada entrada, calculado por `libro_de()` en `tools/build-buscador.py`:
  - `Manual <ambientación>`: hoy `Manual Mistborn` (el Manual del JdR); en el futuro `Manual Stormlight`,
  - `Guía <mundo>`: hoy `Guía Scadrial` (la Guía del Mundo de Mistborn); en el futuro `Guía Roshar`,
  - `Campaña <nombre>` si viene de un libro de campaña: hoy `Campaña Legado`; en el futuro, p. ej., `Campaña Caminapiedras`.
- La fuente se muestra en las fichas (junto a la ambientación) y es **filtro** en toda lista filtrable, justo después de la ambientación.

## Cómo aplicarlo

- **Catálogos:** `docs/js/curated.js` añade la columna `{ k: 'libro', l: 'Fuente', f: 'chips', hide: true, ic: 'book' }` detrás de la de ambientación en todo catálogo que la tenga.
- **Búsqueda global:** fila «Fuente» con parámetro `lib` (solo si los resultados vienen de más de una fuente).
- **Listas propias** (combates, etc.): botones «Fuente» con los valores presentes en la lista, tras el de ambientación.
- **Libros o campañas nuevos:** basta con que su ruta (`path[0]`) lo identifique en `libro_de()` siguiendo el patrón `Manual …` / `Guía …` / `Campaña …`; los filtros se alimentan de los valores existentes.

## Por qué

La página del PDF no sirve de nada en una consulta en pantalla y, en cambio, saber si una regla es del manual, de la guía del mundo o de una campaña concreta (con adversarios o reglas propias) cambia qué se puede usar en mesa.
