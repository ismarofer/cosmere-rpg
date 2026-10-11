---
description: Spec de una aplicación local para proyectar mapas e imágenes en partida en vivo, con niebla de guerra gradual controlada desde el portátil del DJ y efectos ambientales
status: borrador
---

# Proyector de mapas (mesa en vivo) — spec

## 1. Objetivo

Una aplicación local, **independiente del buscador** (`proyector/`), con dos pantallas:

- **Consola del DJ** (portátil): biblioteca de escenas, vista completa del mapa, herramientas de niebla, efectos y control de lo que se ve fuera.
- **Salida de proyector** (segunda pantalla): muestra *solo* lo que el DJ ha decidido enseñar, a pantalla completa, sin ninguna interfaz.

Lo más importante, en orden:

1. **Niebla de guerra (fog of war) gradual** que el DJ abre y cierra en directo desde la consola, y que el proyector refleja al instante.
2. **Lista de escenas** (mapas e imágenes narrativas) con cambio rápido y transición.
3. **Efectos ambientales** colocables: bruma, luces, fuego, lluvia, oscuridad, relámpagos…

**No-objetivos (por ahora):** no es un VTT completo (sin fichas de personaje, sin reglas, sin multijugador remoto por internet), no gestiona iniciativa, no genera mapas. Los jugadores no tienen interfaz: miran el proyector.

## 2. Decisiones de planteamiento (a validar)

1. **Página estática pura, sin backend ni servidor**: se abre con doble clic en `proyector/index.html` (como el buscador) o se aloja en cualquier hosting estático. Sin instalar nada.
2. **Dos ventanas conectadas con `window.open` + `postMessage`.** La consola abre la salida con `window.open("salida.html")` (desde un clic, para que no la bloquee el navegador) y se comunica por la referencia a esa ventana. Esto funciona también en `file://`, donde `BroadcastChannel` y el almacenamiento compartido entre pestañas no son fiables. La ventana de salida se arrastra al proyector y se pone en pantalla completa (F11, o la API de Window Management si está disponible). Si la salida se cierra, un botón la reabre; si se recarga la consola, se reabre y se reconecta. *Ampliación (fase 4):* WebSocket/WebRTC para proyectar desde otro dispositivo; la capa de mensajes queda desacoplada.
3. **El estado vive en la consola; el proyector es un renderizador "tonto".** Recibe mensajes (escena, trazos de niebla, efectos, vista) y dibuja. Si se reconecta, la consola le envía una *instantánea* y queda igual. Nada que el DJ no quiera enseñar sale de la consola.
4. **Persistencia en el navegador, sin servidor:**
   - **IndexedDB** guarda biblioteca (imágenes como blobs), estado de escenas y máscaras de niebla, con autoguardado.
   - **Exportar / importar** biblioteca o escena suelta como `.zip` (copia de seguridad y traslado entre equipos).
   - **P1, opcional:** enlazar una **carpeta en disco** con la File System Access API (Chrome/Edge) para trabajar con ficheros normales; se ofrece solo si el navegador la permite en ese contexto, y IndexedDB sigue siendo la base.
   - Las imágenes entran por **arrastrar y soltar** o selector de ficheros (sin servidor no se puede escanear una carpeta).
5. **Vanilla JS + Canvas 2D**, sin framework ni paso de build (igual que el buscador). Bruma animada con WebGL/shader o texturas de ruido en scroll solo si Canvas 2D no da fps suficientes en el proyector (se mide en la fase 2).
6. **La niebla es una máscara por escena, independiente de la imagen**, con trazos reproducibles (no un bitmap opaco): permite deshacer, sincronizar solo diferencias y guardar/restaurar.

## 3. Modelo mental

- **Biblioteca**: carpeta de escenas, agrupables (por sesión/capítulo) y con etiquetas.
- **Escena**: una imagen base + su estado guardado (niebla, efectos, vista, rejilla). Tipo `mapa` (niebla activada por defecto) o `imagen` (a pantalla completa, sin niebla por defecto; para ilustraciones, retratos, pistas).
- **Capas** (de abajo arriba) en la salida: imagen base → luces → efectos de ambiente → **niebla** → viñeta/oscurecimiento global → *cursor/puntero del DJ* (opcional).
- **Estado de proyección**: escena activa + vista (encuadre/zoom/rotación) + modo (normal, pausa, negro).

## 4. Funcionalidades

Prioridad: **P0** = MVP, **P1** = siguiente iteración, **P2** = deseable.

### 4.1 Biblioteca de escenas (P0)

- Lista con **miniaturas**, nombre, tipo (mapa/imagen), grupo y etiquetas; reordenable por arrastre; búsqueda por nombre.
- **Biblioteca en el navegador** (IndexedDB, ver §2.4): **arrastrar y soltar** una o varias imágenes sobre la consola crea escenas (miniaturas generadas al importar). Exportar/importar `.zip` como copia de seguridad.
- **Preparar sin proyectar**: seleccionar una escena en la consola no cambia el proyector hasta pulsar **Proyectar** (o doble clic). Pestaña "siguiente" para tener lista la próxima mientras se juega.
- **Transición** al cambiar de escena: corte, fundido a negro o fundido cruzado (configurable por escena).
- **Estado persistente por escena**: al volver a un mapa, la niebla, los efectos y el encuadre están como se dejaron (autoguardado).
- **Duplicar escena** (misma imagen, estado limpio) y **restablecer** (volver a todo oculto).
- Atajos: `←/→` escena anterior/siguiente de la lista, `Enter` proyectar la seleccionada.

### 4.2 Niebla de guerra (P0 — núcleo)

**Modelo:** una máscara de opacidad (0 = visible, 1 = oculto) a resolución propia (lado largo ≤ 2048 px, independiente de la imagen), con **valores intermedios**: es lo que permite la apertura gradual.

**Herramientas en la consola** (la vista del DJ muestra el mapa completo con la niebla como velo semitransparente para saber qué hay debajo):

| Herramienta | Comportamiento |
|---|---|
| **Pincel revelar / ocultar** | Radio y **dureza** ajustables (borde suave ↔ duro) y **opacidad por trazo**: con opacidad baja, pasar varias veces va aclarando poco a poco. Arrastrar = abrir un camino. `Alt` o clic derecho alterna revelar/ocultar. |
| **Camino animado** | El DJ traza una polilínea sobre el mapa (un pasillo, una ruta) y la niebla se abre **avanzando a una velocidad configurable** (p. ej. "caminando"), de modo que el proyector muestra cómo se va descubriendo el camino. Pausable y cancelable. |
| **Revelar desde un punto** | Clic sostenido en un punto: el área visible **crece en círculo** mientras se mantiene (o hasta un radio objetivo), con degradado suave. Para "la luz de una antorcha llega hasta aquí". |
| **Formas con degradado** | Rectángulo, elipse y polígono (para salas): revelan u ocultan con **difuminado** (feather) ajustable. Atajo: "revelar sala completa" con un clic dentro de un polígono pre-dibujado (P1, ver 4.4). |
| **Revelar todo / ocultar todo** | Con confirmación en "ocultar todo". |
| **Deshacer / rehacer** | Pila de trazos ilimitada durante la sesión (`Ctrl+Z`, `Ctrl+Y`). |

**Aspecto de la niebla en el proyector** (por escena): negro opaco · oscuro texturizado · **bruma animada** (humo lento, temática Mistborn).

**Memoria / zona explorada** (P1): un segundo nivel opcional: lo que ya se vio y se vuelve a ocultar queda **atenuado** (p. ej. 35 %) en vez de negro total, para mazmorras que los jugadores recorren.

**Sincronización:** se envían los **trazos** (herramienta, puntos, radio, dureza, opacidad, modo) y el proyector los reaplica sobre su máscara; la consola manda una instantánea de la máscara al conectar/reconectar y al cambiar de escena. Los trazos del DJ se envían mientras arrastra (≤ 50 ms de retardo percibido), no al soltar.

### 4.3 Control de lo que ve el proyector (P0)

- **Vista de proyección sobre el mapa**: un recuadro arrastrable/redimensionable en la consola indica qué encuadre ve el proyector; se mueve (pan), se escala (zoom con rueda) y se **rota** en pasos de 90° / libre. La salida se actualiza en directo con animación suave.
- **Ajustar a pantalla / al ancho / 1:1**.
- **Botones de emergencia**, siempre visibles y con atajo:
  - **Negro** (`B`): pantalla negra inmediata en el proyector, sin tocar el estado.
  - **Pausa / imagen de espera** (`P`): una escena o pantalla "un momento" configurable.
  - **Congelar** (`F`): el proyector deja de actualizarse mientras el DJ prepara cosas; al soltar se aplica todo.
- **Puntero del DJ** (P1): un punto/señal que el DJ mueve en la consola y aparece en el proyector ("mirad aquí"), con eco/pulsación al hacer clic.
- **Indicador** en la consola de si la salida está conectada, su resolución y los fps.

### 4.4 Rejilla y escala física (P0/P1)

Si el proyector se usa **sobre la mesa con miniaturas** (a confirmar, §10), la escala importa:

- **Calibración** (P0): el DJ indica "una casilla = N píxeles del mapa" (o marca dos puntos a distancia conocida) y "una casilla = X cm en la mesa"; la salida escala para que las casillas proyectadas midan lo mismo que las reales. El valor se guarda **por escena** y como valor por defecto de la proyección.
- **Rejilla superpuesta** opcional (cuadrada/hexagonal), color y opacidad ajustables, solo en la salida o también en la consola.
- **Regla/medición** (P1): arrastrar y ver la distancia en casillas y en las unidades del juego (alcances: cuerpo a cuerpo, corto, medio, largo).
- **Salas pre-dibujadas** (P1): el DJ prepara de antemano polígonos nombrados ("Sala del trono") y luego los revela con un clic, con o sin animación gradual.

### 4.5 Efectos (P0 básico / P1 ampliado)

Cada efecto es un objeto **colocable en el mapa** (posición, tamaño, intensidad, activo/inactivo) y se puede activar/desactivar en directo con fundido. Los efectos se guardan en la escena.

| Efecto | Tipo | Descripción | Prio. |
|---|---|---|---|
| **Luz** | puntual | Foco radial con color, radio, intensidad y **parpadeo** opcional (antorcha, farol, brasas). Ilumina la zona y oscurece el resto según el ambiente. | P0 |
| **Oscuridad ambiente** | global | Oscurece toda la escena (0-100 %) con color de tinte; solo las luces la rompen. Base del "mazmorra / noche". | P0 |
| **Bruma** | global o zona | Niebla/humo animado de baja velocidad; densidad, color, velocidad y deriva. Zona con borde difuminado. Temática alomántica. | P0 |
| **Fuego** | puntual | Llamas con partículas + luz parpadeante asociada. | P1 |
| **Lluvia / ceniza** | global | Partículas cayendo (ceniza de Scadrial) con densidad, ángulo y velocidad. | P1 |
| **Relámpago / destello** | evento | Un clic dispara un fogonazo blanco con eco; botón de "tormenta" automática. | P1 |
| **Corrección de color** | global | Tinte, saturación, contraste (p. ej. "recuerdo en sepia", "escena fría"). | P1 |
| **Temblor** | evento | Sacudida breve de la imagen (explosión, derrumbe). | P2 |
| **Brillo de metal / pulsos** | puntual | Líneas azules de alomancia (Acero/Hierro) desde un punto; pulso de Peltre… | P2 |
| **Imagen superpuesta** | puntual | PNG con transparencia (hoguera, trampa, símbolo) colocable y animable. | P2 |

Los efectos de **luz y oscuridad se aplican por debajo de la niebla**: la niebla decide *qué* se ve; los efectos, *cómo* se ve. Presets guardables ("Noche en el camino", "Mazmorra con antorchas").

### 4.6 Imágenes narrativas (P0)

- Una escena de tipo `imagen` se muestra **ajustada a pantalla** (sin recorte, con fondo negro o difuminado), con fundido.
- Puede activarse **niebla** también en una imagen (para revelarla por partes, p. ej. una carta con pistas) y efectos suaves (bruma, ceniza, viñeta).
- **Revelado progresivo en una pulsación** (P1): cortinilla de izquierda a derecha, de abajo arriba o desde el centro, con duración configurable.

### 4.7 Fichas de objeto en el mapa (P2)

Marcadores y notas (solo visibles para el DJ): puertas secretas, trampas, PNJ, pistas, enlaces a otra escena ("la escalera lleva a *Sótano*") con clic. Opcionalmente **marcadores públicos** (iconos que sí se ven en el proyector).

### 4.8 Visión dinámica con muros (P2)

Dibujar **muros** y puertas sobre el mapa para que la luz y la visión de un punto (antorcha, personaje) revele automáticamente lo visible con *raycasting*, bloqueada por muros. Es el estilo de los VTT; solo si el control manual de §4.2 se queda corto.

### 4.9 Otras utilidades (P2)

- **Música/ambiente** ligado a la escena (reproducir/loop, volumen, fundido), solo en el portátil.
- **Importación desde Notas de Campaña**: enlazar una escena con una nota de `Notas de Campaña/` para tener el texto a mano al proyectarla.
- **Notas del DJ** por escena (descripción para leer, pistas).
- Exportar/importar una escena completa (`.zip`) para compartir o hacer copia.

### 4.10 No funcionales

- **Local primero**: estática, funciona con doble clic y sin internet; sin cuentas ni telemetría. Probada en Chrome/Edge sobre `file://`.
- **Fluidez**: ≥ 30 fps con efectos en un proyector 1080p/4K; latencia consola → proyector < 100 ms al abrir niebla.
- **Robustez en directo**: si la salida se cierra o se desconecta, la consola sigue y al reconectar la salida queda igual. Cerrar el navegador no pierde estado (autoguardado).
- **Imágenes grandes**: mapas de hasta ~8000 × 8000 px; la niebla va a su propia resolución limitada y la imagen se renderiza por zonas/escalada para no saturar la memoria.
- **Consola con ratón/teclado**; objetivos táctiles amplios por si se usa en pantalla táctil.
- **Español** como idioma de interfaz.
- **Derechos**: las imágenes de los libros tienen copyright; viven solo en el navegador del DJ (o en `.zip` exportados que no se versionan) y la app no sube nada a ningún sitio.

## 5. Modelo de datos

```jsonc
// registro de escena en IndexedDB (y escena.json dentro del .zip exportado)
{
  "id": "karanah-laberinto",
  "nombre": "Laberinto de Karanah",
  "tipo": "mapa",                          // mapa | imagen
  "grupo": "Karanah",
  "etiquetas": ["mazmorra", "sesión 4"],
  "imagen": "blob:idb/img-karanah-laberinto",   // en el .zip: "imagen.png"
  "transicion": { "tipo": "fundido", "ms": 600 },
  "vista": { "cx": 0.5, "cy": 0.5, "zoom": 1, "rotacion": 0 },
  "escala": { "pxPorCasilla": 70, "cmPorCasilla": 2.5 },   // null si no se calibra
  "rejilla": { "visible": false, "tipo": "cuadrada", "color": "#ffffff", "opacidad": 0.25 },
  "niebla": {
    "activa": true,
    "aspecto": "bruma",                    // negro | oscuro | bruma
    "memoria": 0.35,                       // 0 = desactivada
    "mascara": "blob:idb/niebla-karanah-laberinto",   // instantánea autoguardada (en el .zip: niebla.png)
    "salas": [ { "id": "trono", "nombre": "Sala del trono", "poligono": [[0.1,0.2],[0.4,0.2],[0.4,0.5]] } ]
  },
  "efectos": [
    { "id": "e1", "tipo": "luz", "x": 0.42, "y": 0.31, "radio": 0.12, "color": "#ffb060",
      "intensidad": 0.9, "parpadeo": 0.3, "activo": true },
    { "id": "e2", "tipo": "bruma", "zona": null, "densidad": 0.4, "velocidad": 0.2, "activo": true }
  ],
  "ambiente": { "oscuridad": 0.6, "tinte": "#101830" },
  "notas": "Texto para el DJ"
}
```

Coordenadas **normalizadas (0-1)** respecto a la imagen: el estado no depende de la resolución del mapa ni del proyector.

**Mensajes consola → salida** (por `postMessage` a la ventana abierta con `window.open`; los blobs/`ImageBitmap` se transfieren sin copiar; versionados):

| Mensaje | Contenido |
|---|---|
| `escena` | id + estado completo + máscara (instantánea) |
| `niebla.trazo` | herramienta, puntos, radio, dureza, opacidad, modo (revelar/ocultar), velocidad (si es camino animado) |
| `niebla.instantanea` | máscara completa (al reconectar, deshacer largo, ocultar/revelar todo) |
| `efectos` | lista completa o delta (alta/baja/cambio de un efecto), con fundido |
| `vista` | encuadre/zoom/rotación (con interpolación) |
| `modo` | normal · negro · pausa · congelado |
| `puntero` | posición y pulso |
| `hola` (salida → consola) | la salida se ha conectado: resolución, devicePixelRatio; la consola responde con instantánea |

## 6. Sin backend: conexión y almacenamiento

- **Conexión:** la salida (`salida.html`) lee `window.opener` al cargar y envía `hola`; la consola responde con la instantánea. Si la salida se abre sola (sin `opener`), muestra "Esperando consola…"; basta reabrirla desde el botón "Abrir proyector" de la consola.
- **Seguridad del canal:** se comprueba `event.source` (solo se aceptan mensajes de la ventana enlazada); la salida ignora cualquier otro origen.
- **Almacenamiento:** IndexedDB con tres almacenes (`escenas`, `imagenes`, `nieblas`) y `localStorage` para ajustes. Se solicita `navigator.storage.persist()` para que el navegador no purgue la biblioteca.
- **Límite conocido:** el almacenamiento de `file://` está ligado al navegador y a la ruta de la página; si se mueve la carpeta de la app, la biblioteca "desaparece" (sigue en el navegador bajo la ruta antigua). Por eso el exportar `.zip` es P0 y se recomienda hacer copia tras preparar una sesión.

## 7. Estructura propuesta en el repo

```
specs/mapas-proyector.md        ← este documento
proyector/
  index.html                    ← consola del DJ
  salida.html                   ← salida de proyector
  css/
  js/
    estado.js                   ← modelo de escena, autoguardado
    canal.js                    ← window.open/postMessage + protocolo de mensajes
    almacen.js                  ← IndexedDB, exportar/importar .zip
    niebla.js                   ← máscara, pincel, caminos animados, deshacer
    efectos.js                  ← luces, bruma, fuego, lluvia…
    render.js                   ← composición por capas (compartida consola/salida)
    consola.js                  ← UI del DJ
    salida.js                   ← renderizador de la salida
```

Sin carpeta de biblioteca ni scripts en `tools/`: la app es autocontenida. Si hace falta leer `.zip`, se incluye una librería pequeña vendorizada (`js/vendor/`).

`render.js` es **compartido**: la consola y la salida dibujan con el mismo código (la consola con el velo semitransparente), lo que evita divergencias entre "lo que veo" y "lo que se proyecta".

## 8. Fases

| Fase | Contenido | Resultado |
|---|---|---|
| **0 · Esqueleto** | Página estática, abrir salida con `window.open`, conexión por `postMessage`, cargar una imagen (arrastrar y soltar), mostrar/encuadrar en la salida, botón Negro. | Se ve en el proyector lo que pongo en el portátil |
| **1 · MVP niebla** | Máscara, pincel revelar/ocultar con dureza y opacidad, revelar/ocultar todo, deshacer, sincronización por trazos + instantánea, IndexedDB con autoguardado por escena, biblioteca con miniaturas, Proyectar y exportar/importar `.zip`. | **Abrir un camino gradual en la niebla en directo** |
| **2 · Efectos y escenas** | Luces con parpadeo, oscuridad ambiente, bruma, transiciones, imágenes narrativas, calibración de escala + rejilla, camino animado y revelar desde un punto, presets. Medir fps. | Partida completa con ambiente |
| **3 · Pulido de mesa** | Congelar, puntero, regla, salas pre-dibujadas, memoria de zona, fuego/lluvia/relámpago, corrección de color, atajos, vista previa de "siguiente". | Comodidad en directo |
| **4 · Ampliaciones** | Marcadores, enlaces entre escenas, muros y visión dinámica, audio, proyección en otro dispositivo (WebSocket), exportar/importar escena. | Según necesidad |

## 9. Criterios de aceptación del MVP (fases 0-1)

1. Con la consola en el portátil y la salida a pantalla completa en el proyector, **arrastrar el pincel sobre el mapa abre la niebla en el proyector en < 100 ms**, sin saltos.
2. Un trazo con **opacidad baja** repetido 3 veces aclara progresivamente (no es todo/nada); el borde con dureza baja es **difuminado**, no escalonado.
3. **Deshacer** revierte el último trazo en consola y proyector.
4. Cambiar de escena y volver **conserva** la niebla, el encuadre y los efectos.
5. **Negro** deja el proyector a oscuras al instante y al soltar vuelve exactamente igual.
6. Cerrar y reabrir la ventana de salida la deja **idéntica** sin que el DJ haga nada.
7. Arrastrar una imagen a la consola la añade como escena nueva, y tras cerrar y reabrir el navegador (abriendo `index.html` con doble clic) la biblioteca sigue ahí; exportar e importar `.zip` la restaura en otro equipo.
8. Funciona con un mapa de 6000 × 6000 px a ≥ 30 fps.
9. Nada de lo oculto (niebla, notas, marcadores privados) es visible en la salida, ni siquiera por transparencia con baja opacidad en el proyector (se verifica con un mapa de prueba con texto bajo la niebla).

## 10. Riesgos y preguntas abiertas

1. **¿Proyector sobre la mesa (con miniaturas) o sobre pared/pantalla?** Cambia mucho: sobre mesa exige la calibración de escala (§4.4), rotación para sentarse alrededor, y cuidar el contraste (la niebla "negra" sobre la mesa es el color de la mesa). Sobre pared basta con ajustar a pantalla. **Necesito tu respuesta** para priorizar §4.4.
2. **Navegador y equipo:** se asume Chrome/Edge en Windows con el proyector como segunda pantalla extendida. Si se proyecta por otra vía (cable a otro equipo, Chromecast), pasa a depender de la fase 4 (WebRTC/WebSocket, que ya necesitaría un punto de encuentro).
3. **Riesgos de ir sin servidor:** (a) el navegador puede bloquear la ventana emergente si no sale de un clic (mitigado: botón "Abrir proyector"); (b) la biblioteca queda ligada al navegador y a la ruta de la página (mitigado con `.zip` y `storage.persist()`); (c) sin escaneo de carpetas, cargar muchas imágenes es por arrastrar y soltar. Se verifica en la fase 0 que `postMessage` y IndexedDB funcionan en `file://` con el Chrome/Edge del portátil; si algo fallara, el plan B es servir la carpeta con cualquier servidor estático (`python -m http.server`) sin cambiar la app.
3. **Rendimiento de efectos** (bruma, partículas) en Canvas 2D: si no llega a 30 fps en 4K, se pasa a WebGL solo para esas capas. Se mide en la fase 2, no se anticipa.
4. **Peso de la biblioteca:** muchas imágenes grandes ocupan almacenamiento del navegador (cuota habitual de varios GB en Chrome/Edge); al importar se puede reducir el lado largo a un máximo configurable (p. ej. 6000 px).
5. **Copyright de las imágenes** (mapas de libros): uso personal; no se publica la biblioteca.
6. **Niebla manual vs. visión dinámica con muros:** se propone manual primero (más rápida de preparar y de controlar en una partida narrativa); los muros (§4.8) solo si los mapas se vuelven muy tácticos.
7. **Tamaño de máscara:** 2048 px de lado largo da bordes suaves incluso en mapas grandes; si se nota en 4K, se sube o se interpola con suavizado.
8. **Encaje con el buscador:** no comparten código; se podría añadir en el futuro un enlace "proyectar" desde una nota o ficha. Fuera de alcance de este spec.
