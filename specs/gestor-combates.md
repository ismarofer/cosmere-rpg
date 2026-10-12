---
description: Spec de una herramienta estática para la DJ que prepara y guarda combates del Cosmere RPG (Mistborn) —nivel de amenaza según nº de jugadores y nivel medio— y gestiona los valores y acciones de los adversarios
status: implementado (v2: lista de encuentros preparados y tabla de adversarios; sin simulación de turnos)
---

# Combates preparados (mesa en vivo) — spec

## 1. Objetivo

Una herramienta local, hermana del buscador, del gestor de personajes y del proyector, integrada en el buscador como ruta `#/combates` (menú **Dirección → Combates**, solo Modo DJ). Reutiliza `data/dj.js` (adversarios) y `data/base.js` (estados), sin backend ni build.

Sirve para dos cosas:

1. **Preparar y guardar encuentros.** Hay una **lista de combates preparados**; cada encuentro guarda su nombre, el grupo (**número de jugadores y nivel medio**) y sus adversarios. Se calcula el **nivel de amenaza** con las reglas del Manual (cap. 13) y se ve si el encuentro es fácil, promedio o difícil.
2. **Gestionar los adversarios durante la partida.** Cada encuentro es una **tabla de adversarios** con sus valores editables (salud, concentración, Investidura, desvío, amenaza), estados, lesiones y notas, y sus **acciones y rasgos** a la vista.

**No-objetivos:** no simula turnos ni rondas ni iniciativa, no gestiona a los personajes jugadores (solo se usa su número y nivel medio), no tira dados ni resuelve ataques, no sincroniza con otros dispositivos.

## 2. Reglas que implementa

Fuente: `resources/Mistborn Manual/14 - Capítulo 13 Dirección del Juego/` (`07 - Cómo Usar los Adversarios.md`, `08 - Configuración de las Escenas de Combate.md`).

### 2.1 Grupo → rango

El grupo se describe solo con `jugadores` (n) y `nivel` medio. El **rango de juego** sale del nivel: 1-5 → 1, 6-10 → 2, 11-15 → 3, 16-20 → 4, 21+ → 5 (el nivel medio decimal se redondea).

### 2.2 Amenaza por rol y diferencia de rango

| Grupo respecto al adversario | Secuaz | Rival | Jefe |
|---|---|---|---|
| 3 rangos por debajo | 4 | 8 | 32 |
| 2 por debajo | 2 | 4 | 16 |
| 1 por debajo | 1 | 2 | 8 |
| Mismo rango | 0,5 | 1 | 4 |
| 1 por encima | 0,25 | 0,5 | 2 |
| 2 por encima | 0 | 0,25 | 1 |
| 3 por encima | 0 | 0 | 0,5 |

Regla general: ×2 por rango que el adversario supera al grupo; ×½ por rango que el grupo lo supera, redondeando al cuarto más cercano (el empate 0,125 se redondea a 0, como en la tabla).

### 2.3 Dificultad objetivo (*n* jugadores)

Fácil = n × 0,5; promedio = n; difícil = n × 1,5. El selector **tipo de grupo** multiplica esos objetivos por 0,75 (más social), 1 (mixto) o 1,25 (muy optimizado para combate), como sugiere el Manual. La etiqueta (trivial, fácil, promedio, difícil, por encima de difícil) es la franja más cercana al total.

### 2.4 Módulos

Alomancia, feruquimia y clavos aumentan la amenaza pero el libro no da cifra: cada adversario tiene su **amenaza editable** (resaltada cuando está sobrescrita).

### 2.5 Reglas de rol que se muestran

- **Secuaz:** derrotado al sufrir una lesión (la herramienta lo marca al anotarla).
- **Jefe:** un turno rápido y uno lento por ronda; 1 de concentración para una acción 1 o 0 extra tras el turno de un enemigo y 1 para eliminar un estado en su turno (se muestra como recordatorio).
- Derrotado = 0 de salud (o lesión en el Secuaz).

## 3. Funcionalidades

### 3.1 Lista de combates preparados

Tabla con nombre, jugadores, nivel medio (y rango), nº de adversarios, amenaza total y dificultad. Acciones: **nuevo**, **abrir**, **duplicar**, **borrar** (con confirmación), **importar** y **exportar todo** (JSON). Se guarda en el navegador y se recupera al volver.

### 3.2 Encuentro

- **Cabecera:** nombre, jugadores, nivel medio y tipo de grupo, con **deshacer** (Ctrl+Z), **restaurar valores** (salud, concentración e Investidura al máximo; sin estados ni lesiones), duplicar y exportar.
- **Barra de amenaza** siempre visible, con los umbrales fácil/promedio/difícil y la etiqueta resultante. Se recalcula al instante al cambiar jugadores, nivel o adversarios.
- **Selector de adversarios** (38 del libro): buscador y filtros por rol y por **ambientación** (Todas / Era 1 / Era 2; una era muestra lo general de Mistborn más lo de esa era, como el buscador). Cada fila muestra rango, salud y amenaza para este grupo; pulsar el **nombre abre su ficha en el panel lateral** antes de añadirlo, y «+» lo añade (numerado: «Bandido 1, 2…»). Las acciones marcadas Era 1 / Era 2 se muestran todas, con su etiqueta.
- **Tabla de adversarios**, una fila por adversario: nombre, rol y rango; amenaza; **salud, concentración e Investidura** con barra, botones (−10/−5/−1/+1/+5 en salud; −1/+1 en los demás) y **valor actual y máximo editables a mano**; desvío editable; quitar.
- **Detalle desplegable** de cada fila:
  - **Acciones** (con icono de coste, era, coste en concentración/Investidura y marca de reacción), cada una desplegable con su texto completo; si cuesta concentración o Investidura, un botón **Usar** descuenta el coste (y avisa si no alcanza).
  - **Rasgos** y **tácticas** del perfil.
  - **Daño/curación** con opción de restar el desvío (y *perforante*, que lo ignora) y previsión del daño real.
  - **Estados** (de los datos del libro, con enlace a su regla), **lesiones**, notas y renombrar.
- Notas del encuentro.

## 4. Modelo de datos

Almacenado en `localStorage` (`cosmere-combates-v2`): `{ version: 2, abierto, encuentros: [ … ] }`. Un encuentro:

```jsonc
{
  "id": "…", "nombre": "Emboscada en el camino",
  "jugadores": 4, "nivel": 3,            // el rango se calcula
  "ajuste": 0,                           // -0.25 | 0 | 0.25
  "notas": "",
  "combatientes": [
    {
      "id": "…", "fuente": "Detective", "nombre": "Detective 1", "rol": "Rival", "rango": 2,
      "amenazaManual": null,
      "salud": { "act": 50, "max": 50 }, "saludRango": [40, 60],
      "concentracion": { "act": 5, "max": 5 }, "investidura": { "act": 0, "max": 0 },
      "desvio": 1, "movimiento": "9 m",
      "estados": [ { "id": "estado-ralentizado", "nombre": "Ralentizado" } ],
      "lesiones": [], "notas": ""
    }
  ],
  "historial": [ { "texto": "Detective 1: −9 salud", "antes": { /* copia del encuentro */ } } ]
}
```

Solo se guardan decisiones y valores; amenaza total, rango y dificultad se calculan.

## 5. Estructura en el repo

```
docs/combates/
  css/combates.css            ← acotado a .cb
  js/amenaza.js               ← rango por nivel, amenaza, objetivos y dificultad (puro)
  js/adversarios.js           ← lectura de los perfiles de DATA_DJ: rasgos, acciones, tácticas, costes (puro)
  js/combate.js               ← encuentros, recursos, daño con desvío, copiar, deshacer (puro)
  js/vista.js                 ← interfaz: CB.montar(el); lista de encuentros y encuentro
  index.html                  ← redirige a ../index.html#/combates
tools/test-combates.mjs       ← node tools/test-combates.mjs
```

Lectura de los adversarios: las acciones empiezan con su coste en glifo («1 Acometida: …», «2 …», «0 …», «r …») o con «— » (y « r » en línea para las reacciones); lo que hay antes de la primera acción son los rasgos y lo que queda tras la última, las tácticas. Los 38 perfiles se leen enteros (verificado en las pruebas).

## 6. Criterios de aceptación

- [x] Abre desde `file://` con `?dj=1`; sin Modo DJ muestra cómo activarlo.
- [x] 4 jugadores: fácil 2, promedio 4, difícil 6; 1 Jefe + 2 Rivales del mismo rango = 6 (difícil).
- [x] La tabla de escalado del Manual y sus ejemplos se cumplen (pruebas).
- [x] El rango se deduce del nivel medio (1-5 → 1 … 21+ → 5).
- [x] Valores actuales y máximos editables; no bajan de 0 ni superan el máximo; sin recurso suficiente no se paga una acción.
- [x] 10 de daño con desvío 1 resta 9 (y 10 si es perforante); el Secuaz cae con una lesión.
- [x] Los encuentros se guardan, se duplican, se borran y se recuperan al recargar; exportar/importar sin pérdida.
- [x] Deshacer revierte los cambios de valores.
- [x] Las pruebas de `tools/test-combates.mjs` pasan (68).

## 7. Pendiente y preguntas abiertas

1. **Sugeridor de encuentros** («un combate difícil para este grupo» → combinaciones de adversarios).
2. **Adversarios propios** (crear uno desde cero o a partir de otro con módulos) y módulos con su amenaza.
3. **Coste en acciones** de los perfiles con formato «— Acción» (no traen glifo); hoy solo se descuenta el coste en concentración o Investidura.
4. **Estados con duración** automática y efectos de los estados sobre los valores.
5. **Plantillas** importadas de las aventuras publicadas (Caminapiedras, escenarios).
6. **Proyector:** mostrar en la salida de la mesa alguna información del encuentro (¿conviene o rompe la inmersión?).
7. **Aliados y PNJ de apoyo:** el libro no dice cómo cuentan para la amenaza.
