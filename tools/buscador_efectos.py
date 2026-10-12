"""Efectos sobre el personaje (modificadores) de talentos, caminos, ascendencias, armaduras y culturas.

Pensado para que otra herramienta (p. ej. un gestor de fichas) pueda leer en el JSON qué cambia cada elemento:

  entrada.x.efectos = [ {tipo, objetivo, operacion, valor, por, condicion, permanente, texto, detalle}, ... ]
  entrada.f.modifica = [nombre legible del objetivo, ...]   (para filtrar y buscar)
  DATA_ARBOLES = [ {slug, nombre, seccion, talentos:[ids], efectos:[...], ...} ]
  entradas cat "modificador": una por efecto (para consultarlos todos en una tabla)

Los efectos de los talentos se extraen del texto con reglas (frases tipo «Cuando adquieres este talento, tu salud
máxima aumenta en 1 por nivel»); las de ascendencias y los talentos principales de los caminos de nacidos del metal
están transcritas a mano. `auto: true` marca los extraídos automáticamente. El campo `texto` siempre lleva la frase
original del libro, así que ante la duda manda ella.

Vocabulario de `tipo`: maximo, defensa, desvio, movimiento, atributo, atributo_max, puntos_atributo, pericia,
grado_habilidad, reaccion, recurso, poder, meta, talento, talento_adicional, arbol, sentidos, companero, tamano,
restriccion, recompensa, otro.
"""
import re
import unicodedata


def norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower()


def ws(s):
    return " ".join(s.split())


NUM = {"un": 1, "una": 1, "uno": 1, "dos": 2, "tres": 3, "cuatro": 4, "cinco": 5, "seis": 6}

OBJ_NOMBRE = {
    "salud_max": "Salud máxima", "concentracion_max": "Concentración máxima", "investidura_max": "Investidura máxima",
    "defensa_fisica": "Defensa física", "defensa_cognitiva": "Defensa cognitiva", "defensa_espiritual": "Defensa espiritual",
    "desvio": "Valor de desvío", "movimiento": "Valor de movimiento", "sentidos": "Alcance de los sentidos",
    "fuerza": "Fuerza", "velocidad": "Velocidad", "intelecto": "Intelecto", "voluntad": "Voluntad",
    "discernimiento": "Discernimiento", "presencia": "Presencia",
    "pericia": "Pericias", "grados_habilidad": "Grados en habilidad", "reaccion": "Reacciones", "poder": "Poderes",
    "meta": "Metas", "talento": "Talentos", "arbol": "Árboles de talentos", "companero": "Compañero animal",
    "cargas_mente_max": "Cargas de mente de metal", "dado_mando": "Dado de mando", "tamano": "Tamaño",
    "puntos_atributo": "Puntos de atributo", "recompensa": "Recompensas", "investidura": "Investidura",
    "habilidad": "Habilidades", "restriccion": "Restricciones",
}

SENT_SPLIT = re.compile(r"(?<=[.!?:])\s+(?=[A-ZÁÉÍÓÚ◆¡¿])")
ACQ = re.compile(r"(adquieres|adquirir|obtener|obtienes|consigues) este talento|creación del personaje|cada vez que subes de nivel", re.I)
COND = re.compile(r"\b(mientras|cuando|contra|tras|después|hasta|solo|durante|si|al inicio|siempre que)\b", re.I)


def eff(tipo, objetivo, operacion, valor=None, por=None, condicion=None, permanente=False, texto="", detalle=None, auto=True):
    d = {"tipo": tipo, "objetivo": objetivo, "operacion": operacion}
    if valor is not None:
        d["valor"] = valor
    if por:
        d["por"] = por
    if detalle:
        d["detalle"] = detalle
    if condicion:
        d["condicion"] = condicion
    d["permanente"] = bool(permanente)
    d["texto"] = ws(texto)
    if auto:
        d["auto"] = True
    return d


def sentences(body):
    cut = re.split(r"(?:^|\s)#{3,4}\s", body)[0]
    t = ws(cut.replace("\n", " "))
    return [s for s in SENT_SPLIT.split(t) if s.strip()]


def valor_en(st, default=None):
    m = re.search(r"\ben (un|una|dos|tres|cuatro|cinco|seis|\d+)\b(?! valor| cantidad)", st)
    if m:
        v = m.group(1)
        return int(v) if v.isdigit() else NUM[v]
    return default


def tipos_defensa(st):
    low = norm(st)
    out = []
    for k in ("fisica", "cognitiva", "espiritual"):
        if re.search(r"defensas?[^.]{0,40}" + k + r"|" + k + r"[^.]{0,20}defensa", low):
            out.append(k)
    if not out and re.search(r"(todas )?(tus )?defensas", low):
        out = ["fisica", "cognitiva", "espiritual"]
    return out


def extraer_talento(e):
    """Efectos de un talento a partir de su texto. Alta precisión: solo frases con estructura clara."""
    res = []
    siempre = e["f"].get("activacion") == "Siempre activo"
    for st in sentences(e["body"] + "\n\n" + e.get("mecanica", "")):
        low = norm(st)
        acq = bool(ACQ.search(st))
        cond = None
        if not acq and COND.search(st):
            cond = st
        perm = acq or (siempre and cond is None and st.startswith("◆"))
        # --- recursos máximos
        m = re.search(r"\b(salud|concentración|Investidura) máxima", st)
        if m and re.search(r"aumenta|incrementa", st) and not low.startswith("cuando tu rango aumenta") and "si esto" not in low and "disminuye" not in low:
            what = {"salud": "salud_max", "concentración": "concentracion_max", "Investidura": "investidura_max"}[m.group(1)]
            if "companero" in low:
                res.append(eff("companero", "companero", "suma", "5×rango", None, cond, perm, st,
                               "Salud máxima y actual del compañero animal: 5 veces tu rango"))
            else:
                valor, por = valor_en(st), None
                if re.search(r"(equivalente a|valor de) tu rango|equivalente a tu rango|igual a tu rango|en tu rango", low):
                    valor, por = "rango", None
                if "por nivel" in low or "cada vez que subes de nivel" in low:
                    por = "nivel"
                res.append(eff("maximo", what, "suma", valor, por, cond, perm, st))
            continue
        m = re.search(r"numero maximo de cargas", low)
        if m and re.search(r"aumenta", low) and "rango aumenta" not in low:
            res.append(eff("recurso", "cargas_mente_max", "suma", "rango", None, cond, perm, st))
            continue
        # --- defensas
        if re.search(r"defensas?", low) and re.search(r"aumentas?\b|aumentan\b|aumentar\b", low) and "objetivo" not in low and "aliado" not in low:
            ts = tipos_defensa(st)
            if ts:
                v = valor_en(st)
                if v is None and re.search(r"igual a|1 por cada", low):
                    v = "variable"
                for k in ts:
                    res.append(eff("defensa", "defensa_" + k, "suma", v, None, cond, perm, st))
            continue
        # --- desvío
        if re.search(r"valor de desvio", low) and re.search(r"aumenta|aumentas|aumentar", low) and "objetivo" not in low and re.search(r"\btu\b|\btus\b", low):
            v = valor_en(st)
            if v is None and "igual a" in low:
                v = "variable"
            res.append(eff("desvio", "desvio", "suma", v, None, cond, perm, st))
            continue
        # --- movimiento
        if re.search(r"tu valor de movimiento (aumenta|aumentan)|aumentas tu valor de movimiento", low):
            res.append(eff("movimiento", "movimiento", "suma", valor_en(st), None, cond, perm, st))
            continue
        # --- atributos
        m = re.search(r"\btu (Fuerza|Velocidad|Intelecto|Voluntad|Discernimiento|Presencia) aumenta en (\d+)", st)
        if m and "Mejorado" not in st:
            a = norm(m.group(1))
            v = int(m.group(2))
            res.append(eff("atributo", a, "suma", v, None, cond, perm, st))
            if "valor maximo" in low:
                res.append(eff("atributo_max", a, "suma", v, None, cond, perm, st))
            continue
        # --- pericias
        m = re.search(r"(?:obtienes|consigues)(?: (?:la|una|el|tantas|dos))? pericias?(?: (de utilidad|cultural|en arma|en))?\s*(?P<d>[^.]*)", st)
        if m:
            det = ws(((m.group(1) or "") + " " + m.group("d")).strip())
            res.append(eff("pericia", "pericia", "otorga", 1, None, cond, True, st, det or None))
            if " y un coche" in det:
                res.append(eff("recompensa", "recompensa", "otorga", 1, None, cond, True, st, "un coche con compartimento oculto"))
            continue
        # --- reacciones adicionales
        if re.search(r"obtienes (una|un) r adicional", low):
            fijo = "al inicio del combate" in low and "mientras dure" not in low
            det = None
            mm = re.search(r"que solo puedes (?:emplear|usar) para ([^.]+)", st)
            if mm:
                det = "solo para " + ws(mm.group(1))
            res.append(eff("reaccion", "reaccion", "suma", 1, None, None if fijo else cond, fijo or (perm and cond is None), st, det))
            continue
        # --- dado de mando
        if "dado de mando" in low and re.search(r"obtienes un dado de mando", low):
            res.append(eff("recurso", "dado_mando", "otorga", "d4", None, cond, True, st, "empieza como d4 y puede subir hasta d12"))
            continue
        if "dado de mando" in low and re.search(r"(incrementas|aumenta)[^.]*(magnitud|paso)", low):
            res.append(eff("recurso", "dado_mando", "suma", "1 paso", None, cond, True, st))
            continue
        # --- sentidos
        if re.search(r"alcance de (los |tus )?sentidos se (duplica|cuadruplica)", low):
            f = 2 if "duplica" in low else 4
            res.append(eff("sentidos", "sentidos", "multiplica", f, None, cond or st, False, st))
            continue
        # --- recompensas
        if re.search(r"consigues un patrocinador", low):
            res.append(eff("recompensa", "recompensa", "otorga", 1, None, cond, True, st, "un patrocinador"))
            continue
        if re.search(r"consigues la pericia de utilidad [^.]* y un coche", low):
            res.append(eff("recompensa", "recompensa", "otorga", 1, None, cond, True, st, "un coche con compartimento oculto"))
            continue
        # --- habilidad adicional de Ilustración
        if re.search(r"ilustracion te otorga una habilidad adicional", low):
            res.append(eff("grado_habilidad", "grados_habilidad", "otorga", 1, None, cond, True, st, "habilidad adicional de Ilustración"))
            continue
    return res


# --------------------------------------------------------------------------- transcritos a mano
# Talentos principales de los caminos de nacidos del metal y otros casos que no siguen una frase simple.
# Talento principal de Primer Ideal de cada orden Radiante (Manual de Stormlight, cap. 5): es igual en las nueve órdenes
PRIMER_IDEAL = [
    ("recurso", "investidura_max", "fija", "2 + Discernimiento o Presencia (el mayor)", "valor máximo de Investidura al adquirirlo"),
    ("recurso", "investidura", "otorga", None, "acciones Absorber luz tormentosa, Aumentar y Revitalizar"),
    ("meta", "meta", "otorga", 1, "meta «Pronunciar el Primer Ideal»"),
    ("poder", "poder", "otorga", 2, "las dos potencias de la orden, con 1 grado en cada una (al completar la meta)"),
]

MANUAL_TALENTO = {
    "Ruptura de brumoso (principal de brumoso)": [
        ("poder", "poder", "otorga", 1, "un poder alomántico a tu elección (disponible en tu era)"),
        ("pericia", "habilidad", "otorga", None, "habilidad Alomancia"),
        ("recurso", "investidura", "otorga", None, "valor de Investidura y la acción Beber vial"),
        ("meta", "meta", "otorga", 1, "meta de nacido del metal «Entrenar tu poder» (salvo alomancia de atium)"),
    ],
    "Ruptura de nacido de la bruma (principal de nacido de la bruma)": [
        ("poder", "poder", "otorga", None, "todos los poderes alománticos nacientes"),
        ("pericia", "habilidad", "otorga", None, "habilidad Alomancia"),
        ("recurso", "investidura", "otorga", None, "valor de Investidura y la acción Beber vial"),
        ("meta", "meta", "otorga", 1, "meta de nacido del metal «Entrenar tus poderes»"),
    ],
    "Herencia feruquímica (principal de feruquimista)": [
        ("poder", "poder", "otorga", 2, "dos poderes feruquímicos"),
        ("recurso", "cargas_mente_max", "otorga", None, "una mente de metal para cada poder (al completar la meta)"),
        ("meta", "meta", "otorga", 1, "meta de nacido del metal «Fabricar tus mentes de metal»"),
    ],
    "Herencia ferrin (principal de ferrin)": [
        ("poder", "poder", "otorga", 1, "un poder feruquímico a tu elección (disponible en tu era)"),
        ("recurso", "cargas_mente_max", "otorga", None, "una mente de metal (al completar la meta)"),
        ("meta", "meta", "otorga", 1, "meta de nacido del metal «Fabricar tu mente de metal»"),
    ],
    "Herencia nacidoble (principal de nacidoble)": [
        ("poder", "poder", "otorga", 2, "un poder alomántico y un poder feruquímico a tu elección (disponibles en tu era)"),
        ("meta", "meta", "otorga", 2, "metas «Entrenar tu poder» y «Fabricar tu mente de metal»"),
        ("recurso", "cargas_mente_max", "otorga", None, "una mente de metal (al completar la meta)"),
    ],
    "Ilustración (principal de Erudito)": [
        ("pericia", "pericia", "otorga", 1, "una pericia cultural o de utilidad (temporal; se reasigna tras un descanso largo con acceso a una biblioteca)"),
        ("grado_habilidad", "grados_habilidad", "otorga", 2, "un grado en dos habilidades cognitivas no Investidas (temporal; no cuentan para prerrequisitos)"),
    ],
    "Guardián del conocimiento": [
        ("atributo", "intelecto", "suma", 2, None),
        ("atributo_max", "intelecto", "suma", 2, None),
        ("pericia", "pericia", "otorga", 2, "dos pericias nuevas (por subir Intelecto en 2)"),
    ],
}

# Efectos a nivel de ascendencia (texto «Elección de ascendencia …», capítulo 2)
ASC_EFECTOS = {
    "ascendencia-humana": [
        eff("tamano", "tamano", "otorga", "Mediano", None, None, True,
            "Si eliges la ascendencia humana, tu tamaño es Mediano.", None, False),
        eff("talento_adicional", "talento", "otorga", 1, None, None, True,
            "Talentos adicionales de ascendencia (niveles 1, 6, 11, 16 y 21): como humano, debes elegir este talento de un camino heroico.",
            "niveles 1, 6, 11, 16 y 21; de un camino heroico", False),
    ],
    "ascendencia-kandra": [
        eff("tamano", "tamano", "otorga", "Mediano", None, None, True, "Si eliges la ascendencia kandra, tu tamaño es Mediano.", None, False),
        eff("restriccion", "restriccion", "otorga", None, None, None, True,
            "No puedes elegir talentos de los caminos de nacidos del metal del capítulo 5.", "sin talentos de caminos de nacidos del metal", False),
        eff("puntos_atributo", "puntos_atributo", "fija", 6, None, None, True,
            "En el paso 3 de la creación solo distribuyes 6 puntos entre tus seis atributos, en lugar de los 12 habituales. A cambio, elige una Bendición.",
            "en lugar de los 12 habituales; además eliges una Bendición kandra", False),
        eff("arbol", "arbol", "desbloquea", 1, None, None, True,
            "Árbol de talentos único: cada vez que elijas un talento nuevo, puedes elegirlo del árbol kandra.", "árbol kandra", False),
        eff("talento", "talento", "otorga", 2, None, None, True,
            "Obtienes el talento Forma natural (principal de kandra) y el talento Disfraz kandra del árbol kandra.",
            "Forma natural (principal de kandra) y Disfraz kandra", False),
        eff("talento_adicional", "talento", "otorga", 1, None, None, True,
            "Al alcanzar un nuevo rango (niveles 6, 11, 16 y 21) obtienes un talento adicional, del árbol kandra o de cualquier camino heroico.",
            "niveles 6, 11, 16 y 21; del árbol kandra o de un camino heroico", False),
    ],
    "ascendencia-cantora": [
        eff("tamano", "tamano", "otorga", "Mediano", None, None, True, "Si eliges la ascendencia cantora, tu tamaño es Mediano.", None, False),
        eff("arbol", "arbol", "desbloquea", 1, None, None, True,
            "Árbol de talentos único: siempre que obtengas un talento nuevo, podrás elegirlo del árbol de talentos de cantor.", "árbol de cantor", False),
        eff("talento", "talento", "otorga", 2, None, None, True,
            "Obtienes el talento Cambiar de forma (principal de cantor) del árbol de cantor, junto con un talento adicional vinculado.",
            "Cambiar de forma (principal de cantor) y un talento adicional vinculado", False),
        eff("talento_adicional", "talento", "otorga", 1, None, None, True,
            "Al alcanzar un nuevo rango (niveles 6, 11, 16 y 21) obtienes un talento adicional, del árbol de cantor o de cualquier camino heroico.",
            "niveles 6, 11, 16 y 21; del árbol de cantor o de un camino heroico", False),
    ],
    "ascendencia-de-sangre-koloss": [
        eff("tamano", "tamano", "otorga", "Mediano", None, None, True, "Si eliges la ascendencia de sangre koloss, tu tamaño es Mediano.", None, False),
        eff("atributo_max", "fuerza", "suma", 1, None, None, True, "Tu puntuación máxima para el atributo Fuerza aumenta en 1.", None, False),
        eff("puntos_atributo", "fuerza", "fija", 4, None, None, True,
            "Durante el paso 3 de la creación puedes asignar hasta 4 puntos de atributo a Fuerza (en lugar de 3).", "máximo de puntos a Fuerza al crear (en lugar de 3)", False),
        eff("talento", "talento", "otorga", 1, None, None, True,
            "Obtienes el talento Resistencia koloss (principal de sangre koloss) del árbol de sangre koloss.", "Resistencia koloss (principal de sangre koloss)", False),
        eff("arbol", "arbol", "desbloquea", 1, None, None, True,
            "Árbol de talentos único: cada vez que elijas un talento nuevo, puedes elegirlo del árbol de sangre koloss.", "árbol de sangre koloss", False),
        eff("talento_adicional", "talento", "otorga", 1, None, None, True,
            "Al alcanzar un nuevo rango (niveles 6, 11, 16 y 21) obtienes un talento adicional, del árbol de sangre koloss o de cualquier camino heroico.",
            "niveles 6, 11, 16 y 21; del árbol de sangre koloss o de un camino heroico", False),
    ],
}


def tuple_to_eff(t, texto):
    tipo, obj, op, val, det = t
    return eff(tipo, obj, op, val, None, None, True, texto, det, False)


def aplicar(entries):
    """Rellena x.efectos / f.modifica en las entradas y devuelve (nuevas_entradas_modificador, arboles)."""
    por_id = {e["id"]: e for e in entries}
    # --- talentos
    for e in entries:
        if e["cat"] != "talento":
            continue
        ef = extraer_talento(e)
        manual = MANUAL_TALENTO.get(e["title"])
        if manual is None and e["f"].get("tipo_origen") == "Camino radiante" and e["title"].startswith("Primer Ideal (principal de "):
            manual = PRIMER_IDEAL
        if manual:
            txt = "Efectos del talento principal (transcritos del libro)."
            ef = [tuple_to_eff(t, txt) for t in manual]
            if e["title"].startswith("Ilustración"):
                ef[0]["texto"] = "Elegirás una pericia cultural o de utilidad que no tengas y dos habilidades cognitivas diferentes que no sean Investidas."
                ef[1]["texto"] = ef[0]["texto"]
            elif e["title"] == "Guardián del conocimiento":
                for x in ef:
                    x["texto"] = "Tu Intelecto aumenta en 2, y tu valor máximo para dicho atributo también se incrementa en 2. Como es habitual al subir tu Intelecto en 2, obtienes dos pericias nuevas."
        e["x"]["efectos"] = ef
        e["f"]["modifica"] = sorted({OBJ_NOMBRE.get(x["objetivo"], x["objetivo"]) for x in ef})
    # --- armaduras: el valor de desvío al vestirlas
    for e in entries:
        if e["cat"] == "armadura" and (e["f"].get("desvio") or 0) > 0:
            e.setdefault("x", {})["efectos"] = [eff("desvio", "desvio", "suma", e["f"]["desvio"], None, "mientras vistes esta armadura (solo se beneficia de una armadura a la vez)",
                                                   False, f"Valor de desvío {e['f']['desvio']} mientras la vistes.", None, False)]
            e["f"]["modifica"] = [OBJ_NOMBRE["desvio"]]
    # --- culturas: pericia cultural
    for e in entries:
        if e["cat"] == "origen" and e["title"].startswith("Pericia ") and e["path"][-1] != "Pericias":
            nombre = e["title"][len("Pericia "):]
            e.setdefault("x", {})["efectos"] = [eff("pericia", "pericia", "otorga", 1, None, None, True,
                                                   f"Pericia cultural: {nombre}.", f"pericia cultural {nombre}", False)]
            e["f"]["modifica"] = [OBJ_NOMBRE["pericia"]]
    # --- ascendencias (nivel ascendencia)
    for e in entries:
        if e["cat"] == "origen":
            key = None
            if e["title"] in ("Elección de ascendencia humana",):
                key = "ascendencia-humana"
            elif e["title"] == "Elección de ascendencia kandra":
                key = "ascendencia-kandra"
            elif e["title"] == "Elección de ascendencia de sangre koloss":
                key = "ascendencia-de-sangre-koloss"
            if key:
                e.setdefault("x", {})["efectos"] = ASC_EFECTOS[key]
                e["f"]["modifica"] = sorted({OBJ_NOMBRE.get(x["objetivo"], x["objetivo"]) for x in ASC_EFECTOS[key]})
    # --- árboles
    arboles = []
    por_origen = {}
    for e in entries:
        if e["cat"] == "talento":
            por_origen.setdefault(e["f"]["origen"], []).append(e)
    for nombre, tals in por_origen.items():
        f0 = tals[0]["f"]
        slug = re.sub(r"[^a-z0-9]+", "-", norm(nombre)).strip("-")
        principal = next((t for t in tals if t["x"]["main"]), None)
        efectos = []
        textos = []
        if f0["tipo_origen"] in ("Camino heroico", "Camino de nacido del metal"):
            for c in entries:
                if c["cat"] == "camino" and len(c["path"]) > 1 and c["path"][1] == nombre and c["title"].lower().startswith("talento principal"):
                    m = re.search(r"Habilidad inicial: ([^.]+)\.", c["body"])
                    if m and norm(m.group(1)) != "ninguna":
                        h = ws(m.group(1))
                        efectos.append(eff("grado_habilidad", "habilidad", "otorga", 1, None, "si es tu camino inicial", True,
                                           f"Habilidad inicial: {h}. Si eliges {nombre} como tu camino inicial, obtienes un grado en habilidad gratuito en {h}.",
                                           f"1 grado gratuito en {h} (si es tu camino inicial)", False))
                    textos.append(c["id"])
        if f0["tipo_origen"] == "Ascendencia/Cultura":
            key = {"Ascendencia kandra": "ascendencia-kandra", "Ascendencia de sangre koloss": "ascendencia-de-sangre-koloss",
                   "Ascendencia cantora": "ascendencia-cantora"}.get(nombre)
            if key:
                efectos = ASC_EFECTOS[key]
        arboles.append({
            "slug": slug, "nombre": nombre, "tipo": f0["tipo_origen"],
            "talento_principal": principal["id"] if principal else None,
            "talentos": [t["id"] for t in tals], "efectos": efectos,
            "modifica": sorted({x["objetivo"] for x in efectos} | {x["objetivo"] for t in tals for x in t["x"].get("efectos", [])}),
        })
    # --- entradas "modificador": una por efecto
    nuevas = []
    fuentes = [e for e in entries if e.get("x", {}).get("efectos")]
    for e in fuentes:
        for x in e["x"]["efectos"]:
            nuevas.append(modificador_entry(e, x))
    for a in arboles:
        for x in a["efectos"]:
            if a["tipo"] in ("Camino heroico", "Camino de nacido del metal"):  # los de ascendencia ya salen por su entrada de texto
                nuevas.append({
                    "cat": "modificador", "title": f"{a['nombre']} → habilidad inicial", "path": ["Caminos", a["nombre"]],
                    "pages": "", "body": x["texto"], "ambientacion": "Mistborn", "gen": 1,
                    "f": {"fuente": a["nombre"], "fuente_tipo": "Camino", "objetivo": "habilidad", "operacion": x["operacion"],
                          "valor": x.get("detalle", ""), "cuando": "si es tu camino inicial"},
                    "x": {"fuente_id": None, "arbol": a["slug"], "efecto": x}})
    return nuevas, arboles


def valor_txt(x):
    v = x.get("valor")
    s = "" if v is None else str(v)
    if x.get("por"):
        s += f" por {x['por']}"
    if x.get("detalle") and not s:
        return x["detalle"]
    return s


def modificador_entry(e, x):
    tipo_fuente = {"talento": "Talento", "armadura": "Armadura", "origen": "Ascendencia/Cultura"}.get(e["cat"], e["cat"])
    cuando = "al adquirirlo / siempre" if x.get("permanente") else (x.get("condicion") and "condicional" or "temporal o activable")
    return {
        "cat": "modificador", "title": f"{e['title'].replace('Elección de ascendencia', 'Ascendencia')} → {OBJ_NOMBRE.get(x['objetivo'], x['objetivo'])}",
        "path": ["Modificadores", e["f"].get("origen") or tipo_fuente],
        "pages": e["pages"], "body": x["texto"], "ambientacion": e["ambientacion"], "gen": 1,
        "f": {"fuente": e["title"], "fuente_tipo": tipo_fuente, "origen": e["f"].get("origen", ""),
              "objetivo": OBJ_NOMBRE.get(x["objetivo"], x["objetivo"]), "objetivo_clave": x["objetivo"], "operacion": x["operacion"],
              "valor": valor_txt(x), "cuando": cuando},
        "x": {"fuente_id": e["id"], "efecto": x},
    }
