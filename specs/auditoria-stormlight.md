# Auditoría de Stormlight (informe, sin cambios en los datos)

Fecha: 2026-10-14. Fuente: `resources/Manual del Archivo de las Tormentas` (Markdown convertido del PDF) y los datos generados
(`docs/data/base.js`). Método: contar lo cargado por categoría y ambientación, comparar las secciones del Manual de Stormlight con
las de Mistborn (`tools/auditoria/comparar_libros.py`), recorrer el asistente de personajes en un navegador real
(`tools/test-e2e.py`) y revisar el grafo de talentos con el motor (`PJ.evaluarTalento`). Solo lee; no modifica nada.

## 0. Resumen

| Área | Estado |
|---|---|
| Talentos y árboles (heroicos, radiantes, potencias, cantor) | Completos y enlazados. 324 talentos; 0 huérfanos; 1 enlace sin resolver. |
| Orígenes (ascendencias, culturas, pericias) | Completos: 2 ascendencias, 13 culturas. |
| Objetos del capítulo 7 | Cargados (25 armas, 8 armaduras, 19 rasgos, 96 de equipo con 6 conjuntos de equipo inicial). Sin manufactura ni fabriales únicos como objeto. |
| Asistente de personajes | Recorre bien todos los pasos de creación y de subida de nivel para humana y cantora. |
| **Reglas generales del juego (combate, descanso, conversaciones, empeños, dirección…)** | **No se ven con la ambientación Stormlight.** Es el hueco grande (§2). |
| Efectos automáticos sobre el personaje | 75 de 324 talentos (23 %). El resto es texto. |

## 1. Qué hay cargado

Con la ambientación Stormlight elegida (Stormlight + Cosmere), frente a Mistborn (Mistborn + Cosmere):

| Categoría | Stormlight | Mistborn |
|---|---|---|
| Talentos | 324 | 368 |
| Caminos | 93 | 90 |
| Acciones y reacciones | 59 | 140 |
| **Reglas** | **85** | **301** |
| **Estados** | **0** | 15 |
| **Valores y cálculos** | **0** | 15 |
| **Guía de creación de personaje** | **0** | 1 |
| Habilidades | 10 | 20 |
| Pericias | 56 | 77 |
| Armas / armaduras / rasgos | 25 / 8 / 19 | 35 / 8 / 21 |
| Equipo | 96 | 76 |
| Orígenes | 15 | 18 |

Talentos de Stormlight por árbol: Agente 33, Cazador 41, Enviado 33, Erudito 33, Guerrero 41, Líder 32 (compartidos con Mistborn
en un solo árbol por camino); nueve órdenes radiantes con 9 talentos, Iluminado con 5, diez potencias con 8, cantor con 8.

## 2. Hallazgo principal: las reglas generales no llegan a Stormlight

`tools/buscador_reglas_stormlight.py` declara que las reglas generales «ya existen como microrreglas de Mistborn». Es cierto, pero
esas 301 microrreglas (más estados, cálculos y la guía de creación) tienen ambientación **Mistborn**, no **Cosmere**, y el filtro
global de la cabecera las oculta cuando eliges Stormlight (`visible()` en `docs/js/app.js`). Con Stormlight elegida se ven 85
reglas (las propias: luz tormentosa, ideales, spren, potencias, fabriales…), ningún estado y ningún cálculo. Quien juegue
Stormlight no encuentra cómo se descansa, cómo se resuelve una conversación, qué hace «Aturdido» ni cómo se calcula la salud.

Para decidir qué hacer hay que saber qué secciones coinciden con las de Mistborn. Comparando cada apartado del Manual de
Stormlight con el de Mistborn (por encabezado; similitud de palabras):

| Capítulo | Igual (≥ 0,85) | Distinto | Sin equivalente en Mistborn |
|---|---|---|---|
| Introducción | 15 | 7 | 14 |
| 1 Creación de personajes | 12 | 6 | 35 |
| 3 Características | 59 | 25 | 13 |
| 8 Metas y recompensas | 4 | 13 | 29 |
| 9 Aventuras | 16 | 37 | 16 |
| 10 Combate | 37 | 40 | 13 |
| 11 Conversaciones | 6 | 13 | 9 |
| 12 Empeños | 26 | 15 | 16 |
| 13 Dirección del juego | 37 | 51 | 59 |
| Apéndice de compañeros | 6 | 5 | 14 |
| **Total (apartados con texto)** | **218** | **212** | **218** |

Es una aproximación (el encabezado puede coincidir con distinto contenido, o al revés), pero el orden de magnitud es claro: un
tercio de las reglas es idéntico y bastaría con marcarlo como Cosmere; otro tercio cambia (CD, descanso largo, lesiones, ataques a
distancia, reservas de recursos) y necesita su versión de Stormlight; y otro tercio no existe en Mistborn (reposo, metas,
recompensas, batallas, compañeros animales…).

**Propuesta:**
1. Marcar como Cosmere (fuente «Manual del Juego») las microrreglas, estados y cálculos que coinciden con ≥ 0,9 de similitud y
   mismas cifras. Es el cambio de mayor valor y menor coste.
2. Para los que difieren, extraer la versión de Stormlight como microrregla propia (`regla-roshar-…`) con la técnica que ya usa
   `buscador_reglas_stormlight.py`, y dejar la de Mistborn como está.
3. Lo que solo existe en Stormlight (capítulos 8, 9 y 13: metas, reposo, batallas, compañeros) cargarlo con el mismo molde.
4. Añadir un test que falle si una categoría queda en cero con Stormlight elegida (estados, cálculos, creación).

## 3. Talentos y árboles

- **Huérfanos:** ninguno. Todos los talentos de Stormlight tienen prerrequisito enlazado o son el principal del árbol.
- **Enlaces sin resolver (1):** «Reclamación de luz tormentosa» (variante 3) pide «talento Abrasión inversa» y no queda enlazado.
- **Prerrequisitos que hay que confirmar a mano (9):** patrocinadores, compañeros, liderar una organización, acceso a hoja o
  armadura esquirlada y vínculo con un brumaspren iluminado. No son evaluables por el motor; el asistente pide confirmación y la
  DJ puede saltarlos.
- **Texto de la Abrasión:** los ocho talentos salen de las cartas resumen del libro (el capítulo del PDF llegó casi vacío): el
  cuerpo es breve y sin cuerpo completo, y solo 1 de 8 tiene efecto.
- **Cantor:** 3 de los 8 talentos del árbol tienen la mecánica vacía; conviene revisarlos contra el libro.
- **Efectos automáticos:** 75 de 324. Por árbol, los radiantes (9) y las potencias (10) casi no tienen ninguno (0–2 por árbol):
  la mayoría de sus efectos son condicionales o dependen de la forma de uso y se dejan como texto. Es una decisión razonable por
  ahora, pero significa que la hoja de un Radiante no suma nada automáticamente salvo lo que da el camino y las ascendencias.
- **Variantes con Mistborn:** el reparto en Cosmere (86) y variantes de Stormlight está documentado en
  [contenido-comun-entre-ambientaciones](../decisions/reglas/contenido-comun-entre-ambientaciones.md).

## 4. Asistente de personajes (recorrido)

`tools/test-e2e.py` crea personajes de Stormlight (humana y cantora, nivel 1 y rango 2), abre todos los pasos de creación y de
subida de nivel y la hoja, sin errores en consola. Lo comprobado:

- Ascendencia humana: un talento adicional de camino heroico en nivel 1 y en cada rango; el asistente bloquea el último hueco
  libre para otra cosa (ver README, «Talentos adicionales de ascendencia»).
- Ascendencia cantora: Cambiar de forma automático, un talento de formas iniciales en nivel 1, y árbol de cantor o camino heroico en
  cada rango.
- 13 culturas; equipo inicial con 6 conjuntos (Prisionero, Bajos fondos, Académico, Artesano, Militar, Cortesano) en marcos.
- Paso «Radiante»: orden según el talento de Primer Ideal (desde nivel 2), Ideales con sus hitos, potencias que llegan con 1 grado
  al pronunciar el Primer Ideal.
- Subida de nivel: presupuestos de talentos, grados y mejoras de atributo correctos en los niveles 1, 2, 3, 5, 6, 10, 11, 16, 20,
  21 y 22 (`tools/test-personaje.mjs`).

Huecos conocidos:
- **Forjadores de Vínculos** solo tiene texto (sin árbol): no se puede elegir como orden en el asistente.
- El árbol **Iluminado** (Vigilantes de la verdad) tiene 5 talentos; su principal pide «Vínculo con un brumaspren iluminado»
  (confirmación manual).
- La hoja de un personaje de Stormlight no tiene Valores y cálculos ni estados a mano mientras no se resuelva el §2.

## 5. Orden sugerido

1. §2.1 y §2.4: marcar lo idéntico como Cosmere y añadir el test de categorías vacías (barato, desbloquea la mayor parte).
2. §2.2: reglas que difieren (combate, descanso, conversaciones) con su versión de Stormlight.
3. §2.3: reposo, metas, recompensas, batallas y compañeros animales.
4. Efectos de los talentos radiantes más usados y revisión de los tres talentos de cantor sin mecánica.
5. Enlace «Abrasión inversa» y glosario completo (llega cortado en «Selay»).
