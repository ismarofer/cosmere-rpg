---
description: La ambientación es un filtro global, en la cabecera junto a la marca; recorta menús, portada, listas, árboles, búsqueda y herramientas. Ninguna lista tiene filtro de ambientación propio.
applies-to: docs/index.html (#ambpick), docs/js/app.js (visible, window.CosmereAmb), docs/js/curated.js (ambientaciones), docs/combates/js/vista.js y cualquier lista, tabla, catálogo o herramienta nueva
---

# Filtro global de ambientación (cabecera)

## Decisión

- La ambientación se elige **una sola vez, en la cabecera**, junto a «Cosmere RPG», con su icono, y es la misma en todas las páginas. Opciones (`CURATED.ambientaciones`): **Cosmere** (todo), Mistborn · Era 1, Mistborn · Era 2 y Stormlight; no hay «Mistborn» a secas, ver [era-siempre-elegida-y-caminos-del-menu](era-siempre-elegida-y-caminos-del-menu.md).
- Lo elegido **se aplica en todas partes**: menús (los árboles de Caminos, los contadores), portada, catálogos, árboles de talentos y sus especialidades, búsqueda y herramientas que listan contenido (selector de adversarios de Combates…). Se recuerda en el navegador.
- **«Cosmere» muestra todo.** Una ambientación concreta muestra lo suyo más lo común a todas (entradas con ambientación `Cosmere`, ver [contenido-comun-entre-ambientaciones](../reglas/contenido-comun-entre-ambientaciones.md)); una era de Mistborn, además, lo común a las dos eras.
- **Las listas no tienen filtro de ambientación propio**: la columna «Ambientación» puede mostrarse como dato, pero no es un filtro (`c.k === 'ambientacion'` se ignora al armar los filtros).

## Cómo aplicarlo

- **Catálogos** (`docs/js/curated.js`): basta con que las entradas lleven `ambientacion`; la lista parte ya recortada por el filtro global (`visible()` en `app.js`).
- **Herramientas con listas propias** (combates, etc.): no pintan botones de ambientación; preguntan a `window.CosmereAmb.cubre(nombreDeAmbientacion)` y se repintan al cambiar (la navegación vuelve a montar la vista).
- **Excepción:** lo que ya viene acotado por una elección del propio usuario que implica la ambientación (la era del personaje en el asistente) sigue su propia lógica: el asistente usa el ámbito del personaje (Mistborn o Stormlight, ver [personajes-por-ambito](../reglas/personajes-por-ambito.md)), no el filtro de la cabecera, que solo decide con qué ámbito arranca un personaje nuevo.

## Por qué

La ambientación cambia qué reglas, adversarios y objetos son válidos en la mesa. Con un único selector en la cabecera, siempre visible, no hay que repetirlo ni se pueden dejar desalineadas la portada, el menú y las listas, y cada página se acota igual.
