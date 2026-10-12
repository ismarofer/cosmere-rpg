---
description: El personaje lleva su ámbito (Mistborn o Stormlight); lo que ofrece el asistente y la hoja sale de ese ámbito, no del filtro de la cabecera, y lo propio de cada mundo (artes metálicas, radiantes) va en pasos y módulos separados.
applies-to: docs/personaje/js/rules.js (AMBITOS, ASCENDENCIAS_AMB, POTENCIAS), docs/personaje/js/engine.js (ambCubre, derivar, radiante), docs/personaje/js/wizard.js (pasoDatos, pasoRadiante, secuencia), docs/personaje/js/sheet.js
---

# Personajes por ámbito (Mistborn / Stormlight)

## Decisión

- El personaje guarda `ambito` (`Mistborn` | `Stormlight`). Se elige en el primer paso del asistente; al crear uno nuevo arranca con el ámbito de la ambientación de la cabecera (Stormlight → Stormlight; el resto → Mistborn, con la era de la cabecera).
- **Qué ve cada ámbito** (`PJ.ambCubre`): Stormlight ve entradas `Stormlight` + `Cosmere`; Mistborn ve `Mistborn` (y la de su era) + `Cosmere`. Rige talentos, pericias, armas, armaduras, equipo y equipo inicial. Es independiente del filtro de la cabecera.
- **Cambiar de ámbito** borra lo que no se traslada (ascendencia, camino, talentos, pericias, equipo, poderes) y conserva nombre, nivel, atributos e historia (`PJ.cambiarAmbito`).
- **Las reglas comunes son una sola**: la tabla de progreso, atributos, defensas, salud, concentración, habilidades y pericias son las mismas en los dos manuales; solo cambian las ascendencias (humana/cantora frente a humana/kandra/sangre koloss), las culturas, la divisa (arquillas / marcos) y la tabla de recompensas iniciales.
- **Lo propio de Roshar** se calcula en el motor y no en la interfaz:
  - La **orden** sale del talento de Primer Ideal que tenga el personaje (`D.ordenes`: caminos radiantes que declaran sus `potencias`).
  - **Investidura** = 2 + el mayor de Discernimiento o Presencia, desde que tiene un talento de Primer Ideal.
  - Las **potencias** (habilidades de potencia, 1 grado gratuito cada una, atributo según `PJ.POTENCIAS`) aparecen al **pronunciar** el Primer Ideal. Los Ideales pronunciados se guardan en `radiante.ideales`; si es `null` y se empezó por encima del nivel 1, se dan por pronunciados todos los Ideales que se tengan como talento.
  - «pronunciar el N-ésimo Ideal» como prerrequisito se evalúa con esos Ideales; los talentos de un árbol de potencia solo los puede elegir quien tenga una orden que la maneja.
- Lo propio de Mistborn (era, nacidos del metal, poderes, hemalurgia, Alomancia y Feruquimia como habilidades) no aparece en Stormlight y sigue exactamente igual en Mistborn.

## Qué no está resuelto

- La **hoja** de Stormlight no reproduce aún la hoja en papel del Manual (líneas en blanco para las potencias, «Conexiones» con el spren): las potencias se pintan con las demás habilidades y el spren es un campo de texto.
- Prerrequisitos que dependen de patrocinadores, compañeros o hojas esquirladas se piden confirmar a mano, como en Mistborn.
- El equipo inicial «Prisionero» (dos hitos ya marcados del Primer Ideal) y los beneficios intangibles de otros conjuntos se leen en su texto, pero no se aplican solos.
- Las **formas** del cantor (qué forma adopta) se anotan como talentos; no hay selector de forma activa.
- Escuderos, vínculos con varios spren y los Forjadores de Vínculos (no jugables) quedan fuera.

## Por qué

Una sola herramienta con dos ámbitos evita duplicar la hoja, el motor y las tablas, que son idénticos salvo en lo que de verdad cambia entre mundos. Que el ámbito sea del personaje (y no del filtro de la cabecera) permite tener un personaje de cada mundo guardados a la vez y abrirlos sin tocar el filtro.
