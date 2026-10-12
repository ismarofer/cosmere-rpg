---
description: Toda lista filtrable de la aplicación ofrece la ambientación como filtro, con su icono, igual que en la portada.
applies-to: docs/js/curated.js, docs/js/app.js, docs/combates/js/vista.js y cualquier lista, tabla o catálogo con filtros nuevo
---

# Filtro de ambientación en las listas filtrables

## Decisión

Siempre que una pantalla muestre una lista con filtros (catálogos, selectores de adversarios, listas de talentos, etc.), la **ambientación** debe estar disponible como filtro, con el **icono** de cada ambientación, como en el selector de la portada (`CURATED.ambientaciones`: Todo el Cosmere, Mistborn · Era 1, Mistborn · Era 2, Stormlight; no hay opción «Mistborn» a secas, ver [era-siempre-elegida-y-caminos-del-menu](era-siempre-elegida-y-caminos-del-menu.md)).

## Cómo aplicarlo

- **Catálogos** (`docs/js/curated.js`): añadir a `cols` la columna `{ k: 'ambientacion', l: 'Ambientación', f: 'chips', hide: true, ic: 'globe' }`. Los iconos de cada valor salen de `vicons['ambientacion']`. Los catálogos con `cols: txt()` ya la incluyen.
- **Listas propias** (herramientas como combates): usar los mismos iconos (`cosmere`, `mistborn`, `stormlight`) y etiquetas que `CURATED.ambientaciones`, no texto suelto.
- **Siempre es el primer filtro** de la lista, antes de cualquier otro (en catálogos se ordena automáticamente; en listas propias, colócalo el primero).
- Una era muestra lo general de la ambientación más lo de esa era (misma jerarquía que el buscador).
- Si una lista ya está acotada por una elección previa que implica la ambientación (p. ej. la era del personaje en el asistente), el filtro no hace falta; deja constancia de ello al crearla.

## Por qué

La ambientación cambia qué reglas, adversarios y objetos son válidos en la mesa (Era 1 frente a Era 2, y en el futuro otras ambientaciones del Cosmere). Tener el mismo filtro, con el mismo icono, en todas partes evita listas con contenido de otra era y mantiene una interfaz coherente.
