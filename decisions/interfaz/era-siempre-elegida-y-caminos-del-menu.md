---
description: Mistborn se filtra siempre por era; una era muestra lo suyo más lo común a ambas, y el menú de caminos se acota con el mismo filtro.
applies-to: docs/js/curated.js (ambientaciones), docs/js/app.js (visible, treeShown, menú y portada), tools/buscador_extras.py (aplicar_eras)
---

# Mistborn siempre por era; menú de caminos filtrado

## Decisión

- El filtro de ambientación **no ofrece «Mistborn» a secas**: en Mistborn se elige Era 1 o Era 2 (además de «Todo el Cosmere» y las demás ambientaciones).
- Al elegir una era se ve **lo exclusivo de esa era más lo común a ambas** (entradas etiquetadas «Mistborn»). Lo exclusivo de la otra era queda oculto.
- El filtro afecta también al **menú Caminos** y a la portada: un árbol aparece solo si tiene algún talento visible con esa ambientación (o, sin talentos, alguna entrada de su arte), y las especialidades se acotan igual.

## Qué es exclusivo de cada era

El libro lo marca con el símbolo ERA en subtítulos y cabeceras de arte, no siempre en el título de la entrada, así que la asignación vive en una tabla explícita (`ERA_CAMINOS`, `ERA_ESPECIALIDADES`, `ERA_METALES` en `tools/buscador_extras.py`), no en la detección por título:

- **Era 1:** caminos Nacido de la bruma y Feruquimista; alomancia y feruquimia de atium.
- **Era 2:** caminos Ferrin y Nacidoble; especialidades Inventor y Pistolero; alomancia y feruquimia de bendaleo, cadmio, cromo y nicrosil; ascendencia de sangre koloss; módulo Medallones feruquímicos.
- **Ambas:** Brumoso, kandra, humano; aluminio, duraluminio, electro y oro (el libro los sitúa a finales de la Era 1 o en la Era 2); capa de bruma; las subsecciones de disponibilidad de «Metales de Scadrial».

## Por qué

Con «Mistborn» solo se mezclaban opciones de ambas eras (un camino de Era 1 junto a otro de Era 2), que en mesa no pueden coincidir. Elegir era reproduce la regla del libro («Uso de las Eras»).

## Al añadir contenido

Si una entrada nueva está limitada a una era, añade su camino, especialidad o metal a esas tablas y regenera los datos (`python tools/build-buscador.py`).
