# Auditoría de Mistborn frente al PDF (informe, sin cambios en los datos)

Fuente: `resources/SPA_Mistborn_Handbook.pdf` (416 páginas). Método: texto del PDF por **bloques ordenados en dos columnas** (no el flujo
bruto ni los `.md` convertidos) y, para los árboles, los dibujos vectoriales de la página. Herramientas en `tools/auditoria/`
(`talentos_pdf.py`, `auditar_talentos.py`, `arbol_pdf.py`); solo leen, no modifican nada.

## 0. Hallazgo principal: el `.md` mezcla columnas; el PDF, bien leído, no

Al ordenar los bloques de cada página por columnas, el PDF da **150 de 150 talentos heroicos con su especialidad correcta** (8 por
especialidad + 6 principales) y 354 talentos descritos en total, que cuadran con los 357 de los datos. La conversión a `.md` que usa el build
mezcla párrafos de columnas vecinas: de ahí los textos pegados, truncados y los prerrequisitos que absorben el cuerpo.

## 1. Talentos: texto de las descripciones

Comparando palabra a palabra el cuerpo de cada talento con el del PDF (347 emparejados):

| Resultado | Talentos |
|---|---|
| Igual | 238 (69 %) |
| **Contaminado** (lleva texto de otra sección) | 21 |
| **Truncado** (falta texto del libro; a menudo solo queda la carta resumen) | 43 |
| Mixto (las dos cosas, o prerrequisito duplicado en el cuerpo) | 45 |

Comprobados a mano: «Contemplación profunda» (lleva un párrafo de Medicina), «Francotirador con monedas» (lleva el texto entero de la
alomancia de aluminio y la carta resumen en lugar de la descripción), «Autoridad» (prerrequisito repetido dentro del cuerpo).

## 2. Talentos: prerrequisitos, activación y repetidos

Reales (el resto de las 21 diferencias que marca el comparador son créditos de ilustrador que el PDF mezcla en el texto, no errores):

- **Prerrequisito mal extraído y sin enlace al padre (5):** Poderoso (Enviado) → «talento Demostración práctica»; Burbuja defensiva → «talento
  Burbuja espontánea»; Quemar instintivamente (Nacidoble) → «Alomancia 3 o más; talento principal Herencia nacidoble»; Búsqueda constante →
  «Alomancia 2 o más; talento Buscador distante»; Susurros del viento espontáneos → «Feruquimia 2 o más; talento Control sensorial». En los
  datos el prerrequisito está vacío (—) o absorbe el cuerpo, y por eso el talento sale **huérfano** en su árbol.
- **Activación distinta (5):** Echar leña al fuego (datos: Especial; PDF: siempre activo), Poderoso (Enviado, —), Ejecución fluida (Especial),
  Burbuja defensiva (—), Susurros del viento espontáneos (— / reacción).
- **Repetidos (2):** «Ruptura de brumoso» y «Ruptura de nacido de la bruma» están dos veces (la entrada «(principal de…)» y otra sin sufijo):
  la segunda es la carta resumen. En el PDF solo hay una.
- **Compartidos entre especialidades:** solo «Compostura» (Oficial y Planificador) y está bien (un nodo con `especialidades`).
- Enlaces entre talentos por texto: 5 faltan (los mismos 5 de arriba) y 1 sobra por un crédito («Vidente social»). Es decir, **el grafo de
  Mistborn es correcto salvo esos 5**.

## 3. Árboles (lo que ves repetido o mal enlazado)

Calculado sobre `DATA_ARBOLES` con cada ambientación elegida:

1. **Variantes Mistborn/Stormlight que no se funden (introducido con Stormlight):** 26 pares con el mismo camino y nombre (Ojo avizor, Ojo
   agudo, Paso firme…). Con «Cosmere» se ven dos nodos iguales. Es lo que más parece «repetido».
2. **Enlace a una sola variante (error mío):** `link_talents` enlaza un prerrequisito «talento X» con **el primer** talento de ese nombre. Si X
   tiene variante de Mistborn y de Stormlight, un talento común (Cosmere) o de Stormlight cuelga de la de Mistborn y queda **huérfano en la
   vista Stormlight**. Son 22 nodos en los seis caminos heroicos (Guerrero 6, Enviado 4, Líder 4…).
3. **Árboles sin raíz modelada:**
   - Artes metálicas (28 árboles): el padre real es el «poder» (alomancia/feruquimia de X), que no es un talento; los talentos de primer
     nivel quedan sin padre.
   - Radiantes (9 + Iluminado) y potencias (10): los prerrequisitos son «pronunciar el Primer/Segundo/Tercer/Cuarto Ideal»; no hay enlaces,
     así que Segundo→Tercero→Cuarto Ideal y todo lo que cuelga de ellos aparecen sueltos (8 de 9 nodos por orden).
   - Brumoso / Nacido de la Bruma / Nacidoble: un nodo duplicado (§2) y «Quemar instintivamente» huérfano.
4. **Flechas del libro:** reconstruidas de los dibujos del PDF, coinciden con los prerrequisitos del texto en el árbol de Investigador. El
   método sirve para validar el resto, con un límite: las líneas pasan por detrás de las tarjetas y a veces están troceadas.

## 4. Efectos

- 71 de 370 talentos tienen efectos extraídos. Candidatos claros sin efecto (por frases del texto): aumentos numéricos (Resucitación, Posición
  de dos armas, Marcha implacable, Plena forma, Nube de cobre ampliada), máximos de recurso (Imitación improvisada, Ojo agudo, Buscador de
  reservas), desvío (Formas desagradables, Introspección experta), pericias (Contactos en los bajos fondos), grados (Portentoso) y movimiento
  (Encajar los golpes, Golpetazo, Avance cauteloso, Dilatación temporal, Pies ligeros).
- Ningún efecto está marcado «condicional» cuando el texto dice «al adquirirlo».
- Armaduras: 6 de 8 llevan efecto de desvío; Uniforme y Capa de bruma, no (correcto: desvío 0). Ascendencias: efectos en las entradas
  «Elección de…» (3 de 3).

## 5. Tablas y reglas

- **Armas (35):** contrastadas con el PDF fila a fila; las 17 que el comparador no casa son saltos de línea de la maquetación (revisadas a
  mano las más sospechosas); no he hallado ningún valor distinto. Armaduras y equipo: pendiente con el mismo método.
- 51 microrreglas llevan tabla en markdown. Pendiente de comprobar contra el PDF: progreso de los personajes, valores y viales de metales,
  duración de lesiones, tamaños, módulos de adversario y las tablas de recompensas.
- Una posible tabla aplanada sin convertir: «CD de visiones del pasado» (Stormlight).

## 6. Estado: puntos 1-4 de la propuesta, hechos

- Talentos de Mistborn desde el PDF (`tools/extraer_talentos_pdf.py` → `tools/fuentes/talentos-mistborn.json`): resuelve el texto contaminado
  y truncado, los 5 prerrequisitos, los 5 enlaces y los 2 repetidos. Quedan 2 activaciones que difieren entre carta (★) y descripción (8).
- `link_talents` enlaza todas las variantes; radiantes enlazados por Ideales; potencias con raíz «Poder». Huérfanos en los árboles: de 173 a 1
  (un talento de Stormlight, hasta que haya PDF del Manual).
- Pendiente: puntos 5-7 (variantes en «Cosmere», efectos, resto de tablas).

## 7. Propuesta original (para aprobar)

1. **Corregir los 5 prerrequisitos, las 5 activaciones y los 2 repetidos** (cambios mínimos, con test). Impacto: bajo.
2. **Arreglar `link_talents`** para enlazar todas las variantes compatibles, no solo la primera (quita los 22 huérfanos de Stormlight).
3. **Modelar las raíces que faltan:** nodos virtuales «Poder» (artes), «Primer Ideal» (potencias) y la cadena Primer→Segundo→Tercero→Cuarto Ideal
   (radiantes), para que no queden nodos sueltos.
4. **Volver a extraer los talentos desde el PDF** (bloques ordenados) en lugar del `.md` para los capítulos 4-6: resuelve de golpe las
   ~109 diferencias de texto y simplifica los parches de especialidades. Es el cambio grande; propongo hacerlo detrás del test que ya existe
   (y de uno nuevo que compara contra el PDF).
5. **Decidir cómo se muestran las variantes** Mistborn/Stormlight en «Cosmere»: nodo único con pestaña, o ocultar la variante cuando ya está
   el común.
6. **Ampliar efectos** a los candidatos del §4 (con revisión manual: son reglas, no deducciones).
7. **Auditar el resto de tablas** (§5) y las ascendencias/culturas/pericias contra el PDF.

Fuera de alcance de este informe: Stormlight (no tengo su PDF) y los libros de lore (Guía del Mundo, Legado).

## 8. Cobertura de Stormlight (revisión con el PDF del Manual)

Herramienta: `tools/auditoria/comparar_libros.py` (apartados por encabezado, Stormlight frente a Mistborn). Resultado aproximado
(por encabezado; lo cargado bajo otro título aparece como «falta»):

- **Talentos:** extraídos del PDF (324); 81 comunes (Cosmere), 69 solo de Stormlight; quedan 9 pares de variantes (6 con regla distinta).
- **Equipo inicial:** ya aparece en Equipo (Scadrial y Roshar).
- **No cargado, reglas de juego:** efectos de nivel «Cantora en forma artística», sentidos y discapacidades, «lesiones o discapacidades»
  y luz tormentosa, vuelo/monturas (capacidades), localizar/sentir objetivos, ataques a distancia y cercanía, desenlaces de
  contribuciones (empeños), pruebas con ventajas/desventajas, compañeros (actividades y ejemplos) y apéndice de compañeros animales.
- **No cargado, consejos y ambientación:** historia de Roshar, patrocinadores/títulos/esquirlas/fabriales como recompensas, batallas
  (fases, sucesos, tropas), cómo desafiar a radiantes, cómo evocar Roshar y herramientas de seguridad específicas.
- **Distintos de Mistborn (mismo encabezado):** el ~60 % de los apartados de reposo, lesiones, combate y conversaciones difieren
  (tablas y texto); los capítulos 4, 10 y 11 son los que más (capacidad de carga, CD, ataques a distancia, descanso largo).
