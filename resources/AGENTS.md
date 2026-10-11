# resources/

Libros de referencia del Cosmere RPG convertidos a Markdown. Los PDFs originales
(`SPA_*.pdf`) están en esta carpeta pero **no se versionan** (ver `.gitignore`).

## Estructura

```
<Libro>/
  _index.md                  ← árbol de capítulos y secciones con páginas y tamaño
  NN - <Capítulo>/
    NN - <Sección>.md        ← frontmatter: title, source, chapter, pages
```

Un `.md` por sección (marcadores de nivel 2 del PDF). Las secciones muy pequeñas
(<1200 caracteres) están fusionadas con la anterior, como `## subtítulo`.

## Libros

- `Manual del Archivo de las Tormentas`, `Guia del Mundo del Archivo de las Tormentas`,
  `Caminapiedras`, `Stormlight Scenarios`, `Advanced Adversaries` — Stormlight.
- `Mistborn Manual` (`SPA_Mistborn_Handbook.pdf`), `Mistborn Guia del Mundo`
  (`SPA_Mistborn_World_Guide.pdf`), `Nacidos de la Bruma Legado`
  (`SPA_NacidosBruma_Legado.pdf`) — Mistborn. Generados con `tools/pdf_to_sections.py`.

## Cómo consultar

1. Busca con grep en `resources/` o abre el `_index.md` del libro; lee solo la sección que toca.
2. No cargues capítulos enteros: cada sección son unos pocos miles de tokens.
3. Para tablas, mapas o dudas de maquetación, consulta el PDF en las páginas indicadas en `pages`.

## Limitaciones de la conversión (Mistborn)

- Sin imágenes. Pueden colarse pies de ilustración y créditos de artista.
- El orden de recuadros laterales puede alterarse en páginas a doble columna.
- Tablas densas (glosarios, índices) salen como texto plano.
- Si dos marcadores caen en la misma página, esa página se repite en ambas secciones.

## Regenerar

```
python tools/pdf_to_sections.py resources/<libro>.pdf "resources/<Carpeta>"
```
