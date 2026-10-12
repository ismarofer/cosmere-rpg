---
description: Qué va en cada menú principal; Reglas lleva el texto de las reglas y los modificadores del personaje, y el resto de listas filtrables viven en el menú de su tema.
applies-to: docs/js/curated.js (campo group y ord de cada catálogo), docs/js/app.js (menuItems)
---

# Organización del menú

## Decisión

- **Reglas contiene el texto de las reglas** (las microrreglas), **las acciones y reacciones y los modificadores del personaje**: la tabla de todo lo que cambia una característica es una consulta de reglas, no algo que se elija. Cualquier otro catálogo que sea una lista filtrable de cosas va al menú de su tema.
- Reparto, siguiendo la idea de Demiplane de una categoría por tipo de entidad, pero agrupada por tema:

| Menú | Contenido |
|---|---|
| **Personaje** | Creación y progreso · Orígenes (solo lo que se elige: ascendencias y culturas) · Atributos y defensas · Habilidades · Pericias (culturales, en arma, en armadura, de utilidad y especializadas) · Valores y cálculos · Estados |
| **Caminos** | Árboles de talentos · Talentos |
| **Equipo** | Armas · Armaduras · Equipo · Metales y viales · Rasgos de objetos |
| **Reglas** | «Reglas»: las microrreglas (una por página de Demiplane), con filtros de ambientación, tema y asunto · «Acciones y reacciones» · «Modificadores del personaje» |
| **Mundo** (solo Modo DJ, por spoilers) | Lugares · Personajes y organizaciones · Cosmología y religión · Historia · Glosario: la Guía del Mundo de Scadrial salvo adversarios |
| **Dirección** | Adversarios · Módulos · Legado · herramientas de mesa |

## Cómo aplicarlo

Cada catálogo declara su `group` en `curated.js`; el orden dentro del menú sale de `ord` (sin `ord`, al final y en orden de declaración). Un catálogo nuevo que sea lista va a Personaje, Caminos, Equipo o Dirección según su tema; a Reglas solo van las microrreglas y los modificadores.

## Pendiente

Separar Orígenes en Ascendencias y Culturas, y dar lista propia a Patrocinadores (hoy dentro de Recompensas y compañeros).

Los textos de Orígenes que no se eligen (introducciones, cuerpos y contratos kandra, historia de los koloss, pericias culturales por era, otras culturas) son microrreglas del tema «Orígenes»; la «Elección de ascendencia» (y, en los kandra, las Bendiciones) va dentro de su ascendencia y los nombres típicos, dentro de su cultura.
