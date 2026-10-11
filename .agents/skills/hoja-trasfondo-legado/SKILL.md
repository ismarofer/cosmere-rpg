---
name: hoja-trasfondo-legado
description: Genera la hoja de trasfondo para un jugador nuevo de la campaña de Nacidos de la Bruma Legado (MB003, Era 1) a partir de su legado (Pilluelo, Funcionario, Noble, Cronista, Convicto, Veterano) y su poder o ascendencia (brumoso de X, nacido de la bruma, feruquimista, kandra…). Úsalo cuando pidan "hoja de trasfondo", "trasfondo para un jugador" o "preparar a un PJ nuevo" para esta campaña.
---

# Hoja de trasfondo de legado (Era 1)

Genera una hoja **solo para el jugador**, en castellano y sin destripes, que pueda entregarse tal cual. No incluyas notas para el máster salvo que te las pidan expresamente.

## Entradas

- **Legado** de la Era 1.
- **Poder o ascendencia**: p. ej. "brumoso de oro", "kandra", "feruquimista".
- **Opcional:** un enfoque concreto, como el cantón o la casa.

Si falta el legado o el poder, pregúntalo antes de empezar.

## Lecturas obligatorias

Lee primero `resources/AGENTS.md`. Busca con grep y lee solo las secciones necesarias, nunca capítulos enteros.

1. **Legado.** Lee `resources/Nacidos de la Bruma Legado/01 - Introducción/` → `11 - Legados de los Personajes.md` y `12 - Legados de la Era 1.md`. De ahí salen el texto, las preguntas y la pericia adicional. Si el PJ es kandra, mira también "Legados de kandra sugeridos" en `03 - Cómo Dirigir la Aventura.md`.
2. **Momentos de legado.** Ejecuta `grep -rn -i "Momento de legado del <Legado>" "resources/Nacidos de la Bruma Legado"`, con la variante en minúscula. Lee cada recuadro de los capítulos 1–4 y anota los PNJs y lo que el momento da por supuesto: secretos que el PJ sabe, obras suyas, contactos o conocimientos.
3. **Conexión con la Era 2.** Consulta `13 - Legados de la Era 2.md` y la tabla "Conexiones de legado". Úsala solo para orientar la herencia y no destripes la recompensa.
4. **Ficha de cada PNJ.** Busca "Cómo interpretar a <PNJ>" y `07 - Personajes Secundarios.md` para sacar su aspecto y su papel público.
5. **Poder.** Lee la sección del metal o del arte en `resources/Mistborn Manual/07 - Capítulo 6 Artes Metálicas/`, y el contexto de la Era 1 en la *Guía del Mundo*.
6. **Institución u origen del legado**, para la sección de carrera:
   - Funcionario: `Mistborn Guia del Mundo/06 - .../08 - Ministerio de Acero Era 1.md`.
   - Noble: las casas de la Era 1.
   - Cronista: guardadores y Terris.
   - Veterano: el ejército.
   - Convicto: los Pozos y las prisiones.
   - Pilluelo: bandas y bajos fondos.
7. **Caminos heroicos.** Lee `resources/Mistborn Manual/05 - Capítulo 4 Caminos Heroicos/` (especialidades, habilidad inicial y talentos) y el camino de nacido del metal correspondiente del cap. 5.
8. **Fichas previas** en `Notas de Campaña/Legado/`. Sirven de ejemplo de tono y te ayudan a no duplicar ganchos de otros PJs.

## Procedimiento

La hoja tiene dos partes, en este orden. No mezcles reglas en la parte narrativa.

**Parte 1 — Tu historia** (solo narrativa):

1. El legado: el texto y sus preguntas. Aquí no va la pericia, que pasa al paso 1, ni la herencia de la Era 2.
2. Carrera u origen, con opciones cerradas: institución o rama, rango o estatus y sus marcas visibles, cargo, creencias, ruptura o herencia del poder y cómo dejó esa vida. Si el legado es Noble, añade aquí la lista de casas nobles.
3. Ser <poder>: qué hace, contexto social y preguntas, todo sin reglas.
4. Relación actual con su antiguo entorno y con sus antiguos compañeros.
5. Personas concretas: todos los PNJs de los momentos de legado de la Era 1, con descripción pública y entre 2 y 3 preguntas, más entradas "por definir" para lo que esos momentos dan por supuesto. No incluyas PNJs de la Era 2.
6. La banda: la barcaza, Enge y sus **6 preguntas de vínculo**. **No** incluyas las preguntas de vínculo con la banda.

**Parte 2 — Crea tu personaje paso a paso.** Sigue los 8 pasos del Manual.

- Los pasos son: 1 Orígenes, 2 Camino inicial, 3 Atributos, 4 Habilidades y pericias, 5 Talentos, 6 Equipo, 7 Historia y metas, 8 Características finales.
- El Manual de Mistborn convertido no incluye las páginas 23–33, que son las de los pasos. Toma la estructura de `resources/Manual del Archivo de las Tormentas/02 - Capítulo 1 Creación de personajes/`, que usa el mismo sistema.
- Saca los datos propios de Mistborn de sus capítulos 2 (culturas y nombres), 3, 5 (caminos de nacido del metal) y 7 (equipo inicial).
- En cada paso, ofrece opciones ligadas a la historia de la Parte 1:
  - las pericias culturales y la del legado;
  - el camino inicial: un nacido del metal empieza por su camino de nacido del metal y usa el talento humano para entrar en un camino heroico;
  - un ejemplo de reparto de atributos;
  - una tabla de 6 a 9 caminos heroicos con su especialidad, y 2 o 3 combinaciones recomendadas;
  - el equipo inicial;
  - propósito, obstáculo y metas.
- Cita solo talentos cuya especialidad hayas verificado, porque la conversión a Markdown mezcla columnas. Los ejemplos de personaje icónico de cada camino ("Creación de un…") son la fuente más fiable. Avisa al usuario de los que no estén claros.

### Reglas según el tipo de nacido del metal (paso 2 y relacionados)

- **Alomante: brumoso, nacido de la bruma o nacidoble.**
  - Toma el camino de nacido del metal como camino inicial. El brumoso da un grado gratuito en Alomancia además del que da la Ruptura.
  - Explica qué obtiene: el poder naciente, la Alomancia (basada en Voluntad), la Investidura, la acción Beber vial y la meta "Entrenar tu poder".
  - El equipo de **Fugitivo** completa esa meta de inmediato.
  - Fuente: `Mistborn Manual/06 - Capítulo 5 .../02 - Brumoso.md` y `01 - Cómo Usar los Caminos de Nacidos del Metal.md`.
- **Feruquimista o ferrin.** Es obligatorio explicar las **mentes de metal**:
  - El feruquimista obtiene todos los poderes de su era en versión naciente. Elige **una pareja de metales** (puro y aleación, o bien el atium) para su primera meta, "Fabricar tus mentes de metal".
  - Necesita una mente de metal propia para cada metal. Puede llevar puestas tantas como su Intelecto, y cada una admite como máximo 2 + sus grados en Feruquimia cargas.
  - El equipo de **Guardador** completa la primera meta de inmediato: empieza con esas mentes de metal, pero sin dinero ni armas.
  - El camino de feruquimista no da grado gratuito, y la feruquimia no da Investidura.
  - Incluye una **tabla de metales feruquímicos** con estas columnas: pareja, metal, qué almacena (y su efecto mientras almacena), qué da al decantar, nombre coloquial y disponibilidad en la Era 1. Marca el electro, el aluminio y el duraluminio como ocultos por el Ministerio, y el atium como rarísimo.
  - Después de la tabla, añade recomendaciones de qué pareja encaja con el personaje. El ferrin solo tiene un metal: indica cuál encaja.
  - Fuentes:
    - `04 - Feruquimista.md` y `05 - Ferrin.md` del cap. 5;
    - `Mistborn Manual/07 - Capítulo 6 Artes Metálicas/19–35 - Feruquimia de *.md`, para efectos y nombres;
    - `02 - Metales de Scadrial.md`, para las parejas y las eras.
- **Kandra:** sigue "Legados de kandra sugeridos" (introducción del módulo) y la ascendencia kandra del cap. 2 del Manual. Ojo: su talento de ascendencia no funciona como el humano.

Rellena `assets/plantilla.md` siguiendo los comentarios `<!-- -->` y bórralos después. No pongas línea de fuente. Guarda la hoja en `Notas de Campaña/Legado/Trasfondo - <Legado> <poder>.md`.

## Terminología

Usa estos términos:

- "pericia" (no "expertise"), "arquillas".
- Legados de la Era 1: Pilluelo, Funcionario, Convicto, Cronista, Noble, Veterano.
- Legados de la Era 2: Agente de la ley (el libro dice "Vigilante de la ley"), Heredero, Explorador, Emprendedor, Narrador, Novato.

## Lo que no debe aparecer nunca

- Élite Dorada, Vadilek, Clavo de la Eternidad, ceremonia de Ascensión.
- Hemalurgia ligada a la trama.
- NeBaal y la verdadera identidad de Enge.
- Mapa Dorado, Medalla de la Unidad, Guardianes, la Cripta.
- El papel real de los antagonistas de cada capítulo (p. ej. lo que hace Duvall en su hospital).
- Las recompensas concretas de la Era 2.
- Sucesos que van a pasar durante la campaña, como el asedio de Luthadel o la llegada de Cett.

Si un PNJ de un momento de legado está ligado a un destripe, inclúyelo igualmente, pero descríbelo solo por lo que se ve a simple vista.

## Autovalidación

- [ ] La Parte 1 es solo narrativa: legado (texto y preguntas), carrera u origen, poder, relación actual, personas y banda.
- [ ] La Parte 2 sigue los 8 pasos, con la pericia del legado en el paso 1.
- [ ] Aparecen todos los PNJs de los momentos de legado de la Era 1, con preguntas.
- [ ] Hay ganchos para cada cosa que los momentos de legado dan por supuesta.
- [ ] Están las 6 preguntas de Enge y ninguna de vínculo con la banda.
- [ ] Nada de la lista de destripes, ni notas para el máster.
- [ ] La terminología es correcta.
- [ ] En la respuesta al usuario, avisa de los posibles choques con los PJs que ya existen (mira las fichas en `Notas de Campaña/Legado/`) y de los talentos sin verificar. Ese aviso va en la respuesta, no en la hoja.
