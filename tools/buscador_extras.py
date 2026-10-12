"""Piezas del buscador que se construyen sobre las entradas ya extraídas:
  - mini-reglas de personaje ("Valores y cálculos") y la guía de creación de personaje
  - grafo de prerrequisitos de talentos (árboles)
  - etiquetas de ambientacion (Mistborn / Mistborn Era 1 / Mistborn Era 2)
"""
import re
import unicodedata


def norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower()


def ws(s):
    return " ".join(s.split())


# --------------------------------------------------------------------------- ambientacion
AMBIENTACION = {"Ambas": "Mistborn", "Era 1": "Mistborn Era 1", "Era 2": "Mistborn Era 2"}


def apply_ambientacion(entries):
    for e in entries:
        era = e.pop("era", "Ambas")
        e["ambientacion"] = AMBIENTACION.get(era, "Mistborn")
        e["f"].pop("era", None)


# Era a la que se limita cada contenido, según el Manual («Uso de las Eras», tablas «Caminos de nacidos del metal por era» y
# «Metales de Scadrial»). El libro marca la exclusividad en subtítulos y cabeceras de arte que el título de la entrada no refleja.
ERA_CAMINOS = {"Nacido de la Bruma": "Era 1", "Feruquimista": "Era 1", "Ferrin": "Era 2", "Nacidoble": "Era 2"}
ERA_ESPECIALIDADES = {"Inventor": "Era 2", "Pistolero": "Era 2"}
ERA_METALES = {"atium": "Era 1", "bendaleo": "Era 2", "cadmio": "Era 2", "cromo": "Era 2", "nicrosil": "Era 2"}
RE_ARTE = re.compile(r"\b(?:alomancia|feruquimia) de (" + "|".join(ERA_METALES) + r")\b", re.I)


def es_basura(e):
    """Restos del parser: marcas de nota al pie (‡, †) y pies de página («Capítulo 6: Artes metálicas 193») convertidos en talento."""
    t = e["title"].strip()
    return e["cat"] == "talento" and (re.fullmatch(r"[†‡*]+", t) is not None or re.match(r"Capítulo \d+:", t) is not None)


def era_de(e):
    """Era exclusiva de la entrada, o None si no está limitada (se deja la que ya tiene)."""
    f = e.get("f") or {}
    ruta = "/".join(e.get("path") or [])
    for nombre, era in ERA_CAMINOS.items():
        if f.get("origen") == nombre or re.search(r"Capítulo 5[^/]*/" + re.escape(nombre) + r"$", ruta):
            return era
    if e["cat"] == "talento" and f.get("especialidad") in ERA_ESPECIALIDADES:
        return ERA_ESPECIALIDADES[f["especialidad"]]
    m = RE_ARTE.search(ruta) or RE_ARTE.search(f.get("origen") or "") or RE_ARTE.search(e["title"])
    if m:
        return ERA_METALES[m.group(1).lower()]
    if e["id"] == "modulo-medallones-feruquimicos":
        return "Era 2"
    return None


def aplicar_eras(entries):
    """Fija la ambientación de lo que el libro limita a una era y propaga a lo derivado (modificadores y acciones de un talento)."""
    por_id = {}
    for e in entries:
        era = era_de(e)
        if era:
            e["ambientacion"] = AMBIENTACION[era]
            por_id[e["id"]] = e["ambientacion"]
    for e in entries:
        x = e.get("x") or {}
        origen = x.get("fuente_id") or (e.get("f") or {}).get("talento")
        if e["cat"] in ("modificador", "accion") and origen in por_id:
            e["ambientacion"] = por_id[origen]
        # subsecciones de «Metales de Scadrial»: notas de disponibilidad válidas para ambas eras
        if e["cat"] == "arte" and (e.get("path") or [""])[-1] == "Metales de Scadrial":
            e["ambientacion"] = AMBIENTACION["Ambas"]
            if not e["title"].strip():
                e["title"] = "Metales de la Era 2"


# --------------------------------------------------------------------------- mini-reglas
T = "Tabla"  # marcador para fórmulas dadas por tabla

# (título, [(título origen, predicado sobre el cuerpo)], fórmula, depende de, orden)
MINI = [
    ("Salud máxima", [("Salud", None)], "10 + Fuerza + bonificaciones", ["Fuerza"]),
    ("Concentración máxima", [("Concentración", None)], "2 + Voluntad + bonificaciones", ["Voluntad"]),
    ("Investidura máxima", [("Investidura", None)],
     "2 + Discernimiento o Presencia (el mayor) + bonificaciones (solo con alomancia)", ["Discernimiento", "Presencia"]),
    ("Defensas (física, cognitiva y espiritual)",
     [("Defensas", lambda b: b.startswith("Los atributos se combinan")), ("Las defensas y la clase de dificultad", None)],
     "10 + los dos atributos de la categoría + bonificaciones",
     ["Fuerza", "Velocidad", "Intelecto", "Voluntad", "Discernimiento", "Presencia"]),
    ("Valor de desvío", [("Desvío", lambda b: len(b) > 300)],
     "Se resta del daño por golpe, laceración y energía", ["Armadura"]),
    ("Valor de movimiento",
     [("Valor de movimiento", lambda b: b.startswith("Tu Velocidad")), ("Valor de movimiento", lambda b: b.startswith("Velocidad"))],
     "Según Velocidad: 0 → 6 m · 1-2 → 7,5 m · 3-4 → 9 m · 5-6 → 12 m · 7-8 → 18 m · 9+ → 24 m (por acción)", ["Velocidad"]),
    ("Alcance de los sentidos",
     [("Sentidos", lambda b: b.startswith("Tus sentidos abarcan")), ("Alcance de los sentidos", None)],
     "Según Discernimiento: 0 → 1,5 m · 1-2 → 3 m · 3-4 → 6 m · 5-6 → 15 m · 7-8 → 30 m · 9+ → no se ve afectado", ["Discernimiento"]),
    ("Capacidad de levantamiento y de carga",
     [("Capacidad de levantamiento", lambda b: b.startswith("La capacidad de levantamiento")),
      ("Capacidad de carga", None), ("Capacidad de levantamiento y de carga", None)],
     "Según Fuerza (levantamiento / carga): 0 → 50/25 kg · 1-2 → 100/50 · 3-4 → 250/125 · 5-6 → 500/250 · 7-8 → 2500/1250 · 9+ → 5000/2500",
     ["Fuerza"]),
    ("Dado de recuperación", [("Dado de recuperación", None)],
     "Según Voluntad: 0 → 1d4 · 1-2 → 1d6 · 3-4 → 1d8 · 5-6 → 1d10 · 7-8 → 1d12 · 9+ → 1d20", ["Voluntad"]),
    ("Modificador de habilidad", [("Grados en habilidad y modificadores", None)],
     "Atributo asociado a la habilidad + grados en ella", ["Atributos", "Grados"]),
    ("Pericias adicionales", [("Pericias adicionales", None)],
     "2 pericias culturales + 1 por cada punto de Intelecto", ["Intelecto"]),
    ("Progreso por nivel", [("Progreso de los personajes", lambda b: "Rango" in b[:600]), ("Cómo subir de nivel", None)],
     "Tabla por nivel: puntos de atributo, salud, grados en habilidad y talentos", ["Nivel"]),
    ("Aumento de atributos por nivel", [("Paso 2: Incrementas un atributo", None)],
     "+1 punto de atributo en los niveles 3, 6, 9, 12, 15 y 18 (máximo 5)", ["Nivel"]),
    ("Grados en habilidad por nivel", [("Paso 4: Obtienes grados en habilidad", None)],
     "+2 grados por nivel hasta el 20, sin superar el máximo de tu rango", ["Nivel"]),
    ("Talentos por nivel", [("Paso 5: Obtienes un talento", None)],
     "+1 talento por nivel hasta el 20 y un talento de ascendencia al inicio de cada rango", ["Nivel"]),
]


def build_mini(entries):
    """Devuelve (nuevas, quitar_ids_objeto) aplicando MINI sobre las entradas de personaje."""
    pool = [e for e in entries if e["cat"] == "personaje"]
    used = set()
    out = []
    sens_extra = ""
    for title, sources, formula, deps in MINI:
        parts = []
        pages = ""
        for src_title, pred in sources:
            cand = [e for e in pool if e["title"] == src_title and id(e) not in used and (pred is None or pred(e["body"]))]
            if not cand:
                continue
            e = cand[0]
            used.add(id(e))
            body = e["body"]
            pages = pages or e["pages"]
            if title == "Valor de movimiento" and "#### Alcance de los sentidos" in body:
                body, tail = body.split("#### Alcance de los sentidos", 1)
                sens_extra = tail.strip()
            parts.append(body.strip())
        if title == "Alcance de los sentidos" and sens_extra and not any("Discernimiento Alcance" in p for p in parts):
            parts.append("#### Tabla de alcance\n" + sens_extra)
        if not parts:
            print("  [!] mini-regla sin fuentes:", title)
            continue
        out.append({"cat": "calculo", "title": title, "path": ["Creación de personaje", "Valores y cálculos"],
                    "pages": pages, "body": "\n\n".join(parts), "ambientacion": "Mistborn", "gen": 0,
                    "f": {"formula": formula, "depende": deps}})
    return out, used


# --------------------------------------------------------------------------- guía de creación
CREACION = """La creación de personajes consta de ocho pasos. Seguirlos en orden facilita los cálculos, pero puedes empezar por la historia del personaje y rellenar el resto después. Para inspirarte, los caminos heroicos incluyen ejemplos de arquetipos icónicos.

### Antes de empezar
◆ [[personaje|Pasos de la creación de personajes]]

### Paso 1 · Elige tus orígenes
Ascendencia y cultura: te dan talentos de ascendencia y pericias culturales (2 al crear el personaje).
◆ [[#/c/origen|Catálogo de orígenes (ascendencias y culturas)]]
◆ [[#/arbol/ascendencia|Talentos de ascendencia]]

### Paso 2 · Elige tu camino inicial
El camino inicial da su talento principal y un grado en habilidad extra.
◆ [[#/caminos/heroicos|Caminos heroicos]]
◆ [[#/caminos/nacidos-del-metal|Caminos de nacidos del metal]]
◆ [[camino|Camino y habilidad iniciales]]

### Paso 3 · Elige tus atributos
En el nivel 1 tienes 12 puntos de atributo (máximo 5 en cada uno). Son seis: Fuerza, Velocidad, Intelecto, Voluntad, Discernimiento y Presencia.
◆ [[personaje|Atributos]]
◆ [[personaje|Fuerza]]
◆ [[calculo|Aumento de atributos por nivel]]

### Paso 4 · Elige tus habilidades y pericias
En el nivel 1 tienes 4 grados en habilidad (+1 del camino inicial), con un máximo de 2 grados por habilidad.
◆ [[#/c/habilidad|Catálogo de habilidades]]
◆ [[personaje|Pericias]]
◆ [[calculo|Pericias adicionales]]
◆ [[calculo|Modificador de habilidad]]

### Paso 5 · Elige tus talentos
En el nivel 1 tienes el talento principal del camino inicial más el talento (o talentos) de tu ascendencia. Los demás talentos se eligen respetando los prerrequisitos del árbol.
◆ [[#/caminos|Árboles de talentos]]
◆ [[calculo|Talentos por nivel]]
◆ [[personaje|Prerrequisitos]]

### Paso 6 · Equípate
◆ [[objeto|Equipo inicial]]
◆ [[#/c/arma|Armas]] · [[#/c/armadura|Armaduras]] · [[#/c/equipo|Equipo]]

### Paso 7 · Cuenta tu historia
Propósito, obstáculo, metas y conexiones de tu personaje.

### Paso 8 · Calcula tus características finales
◆ [[calculo|Salud máxima]]: 10 + Fuerza
◆ [[calculo|Concentración máxima]]: 2 + Voluntad
◆ [[calculo|Investidura máxima]]: 2 + Discernimiento o Presencia (el mayor), solo con alomancia
◆ [[calculo|Defensas (física, cognitiva y espiritual)]]: 10 + los dos atributos de la categoría
◆ [[calculo|Valor de movimiento]] (según Velocidad)
◆ [[calculo|Alcance de los sentidos]] (según Discernimiento)
◆ [[calculo|Dado de recuperación]] (según Voluntad)
◆ [[calculo|Capacidad de levantamiento y de carga]] (según Fuerza)
◆ [[calculo|Valor de desvío]]

### Después: subir de nivel
◆ [[calculo|Grados en habilidad por nivel]]
◆ [[calculo|Progreso por nivel]]
◆ [[personaje|Rangos de juego]]
◆ [[#/c/calculo|Todos los valores y cálculos]]
"""


def build_creacion():
    return {"cat": "creacion", "title": "Creación de personaje", "path": ["Creación de personaje"],
            "pages": "20-37", "body": CREACION.strip(), "ambientacion": "Mistborn", "gen": 0, "f": {}}


# --------------------------------------------------------------------------- habilidades Investidas
# Alomancia y Feruquimia no tienen sección propia en el capítulo 3: las describe «Cómo usar las habilidades Investidas» (cap. 5)
HABILIDADES_INVESTIDAS = [
    ("Alomancia", "Voluntad", "alomancia", "Brumoso, Nacido de la bruma y Nacidoble",
     "Alomancia mide tu capacidad para quemar metales y dirigir los poderes alománticos. Cada vez que lleves a cabo una prueba con un poder alomántico, haces una prueba de Alomancia, igual que harías una de Agilidad con cualquier otra habilidad."),
    ("Feruquimia", "Intelecto", "feruquimia", "Feruquimista, Ferrin y Nacidoble",
     "Feruquimia mide tu capacidad para almacenar y usar las propiedades de tus mentes de metal. La feruquimia rara vez exige pruebas de habilidad; si eres un ferrin, feruquimista o nacidoble, te conviene revisar tus poderes feruquímicos antes de decidir si inviertes puntos en el atributo Intelecto."),
]


def build_habilidades_investidas():
    out = []
    for nombre, attr, slug_, caminos, intro in HABILIDADES_INVESTIDAS:
        body = "\n\n".join([
            intro,
            "Habilidad Investida. No puedes acceder a ella hasta que tu camino de nacido del metal (o alguna otra regla, como un clavo hemalúrgico) "
            f"te lo permita. La obtienes con el talento principal de los caminos: {caminos}. Se rige por tu valor de {attr} y es una habilidad "
            "cognitiva; su modificador combina tus grados con el valor de ese atributo. Puedes obtener grados adicionales de la misma forma que "
            "con el resto de habilidades.",
            f"Progresión. Tus grados en {nombre} aumentan el alcance, el límite y el dado de tus poderes (consulta "
            "[[regla|Alcance de artes metálicas]] y [[regla|Límite de artes metálicas]]).",
            "Consulta [[regla|Cómo usar las habilidades Investidas]].",
        ])
        out.append({"cat": "habilidad", "title": nombre, "path": ["Capítulo 5 · Caminos de nacidos del metal", "Habilidades Investidas"],
                    "pages": "133-140", "body": body, "ambientacion": "Mistborn", "gen": 0,
                    "f": {"atributo": attr, "defensa": "Cognitiva", "tipo": "Investida"}, "id": "habilidad-" + slug_})
    return out


# --------------------------------------------------------------------------- árboles de talentos
def basename(t):
    return ws(re.sub(r"\s*\(.*?\)\s*", " ", t))


def link_talents(entries):
    tal = [e for e in entries if e["cat"] == "talento"]
    for e in tal:
        e["x"] = {"req": [], "xreq": [], "main": "(principal" in e["title"].lower(), "power": False}
    by_origin = {}
    for e in tal:
        by_origin.setdefault(e["f"]["origen"], []).append(e)
    for e in tal:
        pr = norm(ws(e["f"]["prerrequisito"]))
        origin = e["f"]["origen"]
        e["x"]["power"] = (e["f"]["tipo_origen"] == "Arte metálica" and
                           (pr == norm(origin) or "poder " in pr or pr.startswith(norm(origin))))
        i = pr.find("talento")
        if i < 0:
            continue
        text = pr[i:]
        for pool, key in ((sorted(by_origin[origin], key=lambda t: -len(basename(t["title"]))), "req"),
                          (sorted([t for t in tal if t["f"]["origen"] != origin], key=lambda t: -len(basename(t["title"]))), "xreq")):
            for c in pool:
                if c is e:
                    continue
                b = norm(basename(c["title"]))
                if len(b) < 5:
                    continue
                m = re.search(r"(?<![a-z0-9])" + re.escape(b) + r"(?![a-z0-9])", text)
                if m:
                    e["x"][key].append(c["id"])
                    text = text[:m.start()] + " " * (m.end() - m.start()) + text[m.end():]
        e["x"]["req"] = list(dict.fromkeys(e["x"]["req"]))
        e["x"]["xreq"] = list(dict.fromkeys(e["x"]["xreq"]))


def split_ascendencias(entries):
    """Los talentos de ascendencia salen todos bajo el mismo archivo: se reparten por ascendencia
    siguiendo las dependencias desde cada talento principal ("principal de kandra", "principal de sangre koloss")."""
    tal = [e for e in entries if e["cat"] == "talento" and e["f"]["tipo_origen"] == "Ascendencia/Cultura"]
    by_id = {e["id"]: e for e in tal}
    label = {}
    for e in tal:
        m = re.search(r"\(principal de ([^)]+)\)", e["title"])
        if m and e["x"]["main"]:
            name = ws(m.group(1))
            label[e["id"]] = "Ascendencia " + (name if name.startswith("sangre") is False else "de " + name)
    changed = True
    while changed:
        changed = False
        for e in tal:
            if e["id"] in label:
                continue
            for r in e["x"]["req"]:
                if r in label:
                    label[e["id"]] = label[r]
                    changed = True
                    break
    for e in tal:
        name = label.get(e["id"], "Ascendencia")
        e["f"]["origen"] = name
        if "koloss" in name:
            e["ambientacion"] = "Mistborn Era 2"
