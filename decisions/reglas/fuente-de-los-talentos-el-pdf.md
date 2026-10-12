---
description: El texto, el prerrequisito, la activación y la carta resumen de los talentos de Mistborn salen del PDF (por estilo y orden de columnas), no del .md; el resultado se versiona en tools/fuentes/talentos-mistborn.json.
applies-to: tools/extraer_talentos_pdf.py, tools/fuentes/talentos-mistborn.json, tools/build-buscador.py (aplica_talentos_pdf), tools/buscador_extras.py (link_talents)
---

# Los talentos de Mistborn se leen del PDF

## Decisión

- La conversión a `.md` mezcla las dos columnas de cada página: los talentos salían con párrafos de otra sección, truncados, con el
  prerrequisito dentro del cuerpo o repetidos (ver `specs/auditoria-mistborn.md`). El PDF, leído por bloques con su estilo, no tiene ese problema.
- `python tools/extraer_talentos_pdf.py` lee `resources/SPA_Mistborn_Handbook.pdf` (no se versiona) y escribe
  `tools/fuentes/talentos-mistborn.json` (sí se versiona; es lo que lee el build). Reconoce cada talento por su estilo:

  | Pieza | Cómo se reconoce |
  |---|---|
  | título | Plantin 12,5 pt, rojo |
  | prerrequisito / activación | «Prerrequisito:» y «Activación:» en negrita; el glifo de activación es de la fuente CosmereDingbats (1 2 3 0 r * 8) |
  | tema | cursiva → `body` |
  | mecánica | texto regular → `mecanica` (viñetas ◆ conservadas) |
  | carta resumen | LaskiSans dentro de un rectángulo blanco → `resumen` |

- El build (`aplica_talentos_pdf`) sustituye esos campos en los talentos de Mistborn, empareja por (tipo, camino por páginas, título) y quita
  las entradas que eran la carta resumen de otra. Si el JSON no existe, usa el texto del `.md` y avisa.
- Cuando el PDF y la carta resumen discrepan en la activación (p. ej. ★ en la carta y «8» en la descripción), se conserva lo que ya había
  (la carta); no es un error de extracción.

## Enlaces

- `link_talents` enlaza «talento X» con **todas** las variantes de X compatibles (Mistborn, Stormlight, Cosmere), no solo con la primera.
- Radiantes: «pronunciar el Segundo/Tercer/Cuarto Ideal» enlaza con ese talento de la orden y el Primer Ideal es su talento principal.
- Potencias: los talentos sin talento padre cuelgan de la potencia, como los de las artes metálicas del poder.

## Por qué

Una sola fuente fiable por talento evita parches de especialidad, prerrequisitos y texto por camino, y hace los enlaces del árbol verificables
contra el libro. Para Stormlight se hará lo mismo cuando haya PDF del Manual.
