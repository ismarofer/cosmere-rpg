"""Microrreglas de Stormlight: solo las reglas que no tiene Mistborn (spren, luz tormentosa, ideales, escuderos, órdenes, potencias,
fabriales, esferas, cantores…). Las generales (combate, conversaciones, empeños, descanso…) ya existen como microrreglas de Mistborn.

Mismo criterio que decisions/reglas/unidad-microregla.md: una microrregla = una regla suelta, con el texto del Manual en español.
Aquí las fuentes no se declaran por id (los ids de las entradas de Stormlight son los que reparte finalize) sino por (categoría,
título): `src()` falla ruidosamente si el libro cambia y una fuente ya no existe. Los datos salen de `PLAN` y de las listas de órdenes
y potencias, y se escriben como entradas `regla` con id `regla-roshar-<slug>` y ambientación Stormlight.
"""
import re
import unicodedata

from buscador_limpieza import limpia

TEMA = "Stormlight"

# (orden, nombre del árbol, spren, palabra que identifica al spren en los títulos del libro)
ORDENES = [
    ("Corredores del Viento", "Corredores del viento", "Honorspren", "honorspren"),
    ("Custodios de la Piedra", "Custodios de la piedra", "Cumbrespren", "cumbrespren"),
    ("Danzantes del Filo", "Danzante del filo", "Cultivacispren", "cultivacispren"),
    ("Escultores de Voluntad", "Escultores de voluntad", "Lumispren", "lumispren"),
    ("Nominadores de lo Otro", "Nominadores de lo otro", "Tintaspren", "tintaspren"),
    ("Portadores del Polvo", "Portadores del polvo", "Cenizaspren", "cenizaspren"),
    ("Rompedores del Cielo", "Rompedores del cielo", "Altospren", "altospren"),
    ("Tejedores de Luz", "Tejedores de luz", "Crípticos", "criptico"),
    ("Vigilantes de la Verdad", "Vigilantes de la verdad", "Brumaspren", "brumaspren"),
    ("Forjadores de Vínculos", "Forjadores de Vínculos", None, None),
]
POTENCIAS = ["Abrasión", "Adhesión", "Cohesión", "División", "Gravitación", "Iluminación", "Progresión", "Tensión", "Transformación",
             "Transportación"]

# (grupo, título de la regla, [(categoría, título de la fuente), …])  — la primera fuente es el texto; el resto, subapartados con su título
PLAN = [
    ("Luz tormentosa e Investidura", "Investidura y luz tormentosa", [("camino", "Investidura y luz tormentosa")]),
    ("Luz tormentosa e Investidura", "Luz y antiluz", [("camino", "Luz y antiluz")]),
    ("Luz tormentosa e Investidura", "Acciones de luz tormentosa", [("camino", "Acciones de luz tormentosa")]),
    ("Luz tormentosa e Investidura", "Cómo gastar Investidura", [("camino", "Cómo gastar Investidura")]),
    ("Luz tormentosa e Investidura", "Cómo recuperar luz tormentosa", [("camino", "Cómo recuperar luz tormentosa")]),
    ("Luz tormentosa e Investidura", "Cargas y recarga con luz tormentosa",
     [("objeto", "Cargas"), ("objeto", "Activación de objetos con cargas"), ("objeto", "Recarga de objetos")]),
    ("Luz tormentosa e Investidura", "Objetos Investidos (Roshar)", [("objeto", "Objetos Investidos")]),
    ("Caminos radiantes", "Cómo usar los caminos radiantes", [("camino", "Cómo usar los caminos radiantes"),
                                                             ("camino", "Opciones de caminos Radiantes")]),
    ("Caminos radiantes", "Cómo elegir un talento de Primer Ideal", [("camino", "Cómo elegir un talento de Primer Ideal")]),
    ("Caminos radiantes", "Cómo desbloquear la Investidura", [("camino", "Cómo desbloquear la Investidura")]),
    ("Caminos radiantes", "Cómo desbloquear las potencias", [("camino", "Cómo desbloquear las potencias")]),
    ("Caminos radiantes", "Cómo jugar como un Radiante", [("camino", "Cómo jugar como un Radiante"),
                                                         ("camino", "Antes de elegir un camino Radiante"),
                                                         ("camino", "Unirte con tu yo espiritual")]),
    ("Ideales", "Pronunciar las Palabras", [("camino", "Pronunciar las Palabras")]),
    ("Ideales", "Juramento de ideales", [("camino", "Juramento de ideales"), ("camino", "Juramento del Primer Ideal"),
                                         ("camino", "Juramento de Ideales más elevados")]),
    ("Ideales", "Ideales y metas", [("camino", "Ideales y metas"), ("camino", "Progresar en el Primer Ideal")]),
    ("Ideales", "Abandono de tus Ideales", [("camino", "Abandono de tus Ideales")]),
    ("Ideales", "El Quinto Ideal", [("camino", "El Quinto Ideal")]),
    ("Ideales", "Intercambio de talentos de Primer Ideal", [("camino", "Intercambio de talentos de Primer Ideal")]),
    ("Spren", "Atraer un spren", [("camino", "Atraer un spren"), ("camino", "Tu spren y tú")]),
    ("Spren", "Cómo jugar con un spren", [("camino", "Cómo jugar con un spren"), ("camino", "Reglas de los spren"),
                                         ("camino", "Movimiento"), ("camino", "Cómo interactuar con tu spren"),
                                         ("camino", "Capacidades spren")]),
    ("Spren", "Vínculos con varios spren Radiantes", [("camino", "Cómo establecer vínculos con varios spren radiantes")]),
    ("Escuderos", "Escuderos", [("camino", "Escuderos"), ("camino", "Cómo obtener tus propios escuderos"),
                                ("camino", "Capacidad de escudero"), ("camino", "Cómo jugar como escudero")]),
    ("Órdenes", "Órdenes de Caballeros Radiantes", [("camino", "Órdenes de Caballeros Radiantes"), ("camino", "Órdenes Radiantes")]),
    ("Potencias", "Cómo usar las potencias", [("arte", "Cómo obtener grados en potencia"), ("arte", "Efectos de potencia"),
                                             ("arte", "Habilidades de potencia")]),
    ("Potencias", "Escalado y dados de potencia", [("arte", "Escalado de potencias"), ("arte", "Dados de potencia"),
                                                   ("arte", "Magnitud de potencia")]),
    ("Potencias", "Ataques de potencia", [("arte", "Ataques de potencia")]),
    ("Potencias", "Infusión y duración de las potencias", [("arte", "Infusión y duración de las potencias"),
                                                           ("arte", "Cómo infundirte a ti mismo"), ("arte", "Cómo infundir un objeto"),
                                                           ("arte", "Cómo gastar investidura infundida"),
                                                           ("arte", "Cómo añadir investidura a una infusión"),
                                                           ("arte", "Poner fin a una potencia"), ("arte", "Duración fuera del combate")]),
    ("Potencias", "Anatomía de una potencia", [("arte", "Anatomía de una potencia")]),
    ("Potencias", "Uso creativo de potencias", [("arte", "Uso creativo de potencias")]),
    ("Fabriales", "Fabriales", [("objeto", "Fabriales")]),
    ("Fabriales", "Activación de fabriales", [("objeto", "Activación de fabriales")]),
    ("Fabriales", "Fabriales únicos", [("objeto", "Fabriales únicos")]),
    ("Fabriales", "Fabricación de fabriales comunes", [("objeto", "Manufactura de fabriales comunes"), ("objeto", "Pasos para crear fabriales"),
                                                      ("objeto", "Mejoras de fabrial")]),
    ("Fabriales", "Invención de fabriales únicos: efecto y materiales",
     [("objeto", "Invención de fabriales únicos"), ("objeto", "Paso 1: Elige el efecto"), ("objeto", "Paso 2: Consigue los materiales")]),
    ("Fabriales", "Invención de fabriales únicos: la gema y el spren", [("objeto", "La gema del fabrial"),
                                                                      ("objeto", "Paso 3: Atrapa a un spren"),
                                                                      ("objeto", "Metales de fabriales")]),
    ("Fabriales", "Invención de fabriales únicos: prueba y mejoras",
     [("objeto", "Paso 4: Haz una prueba de manufactura"), ("objeto", "Paso 5: Aplicación de mejoras e inconvenientes"),
      ("objeto", "Prueba de manufactura para fabriales"), ("objeto", "Mejoras e inconvenientes para fabriales")]),
    ("Fabriales", "Características avanzadas de fabriales", [("objeto", "Características avanzadas de fabriales")]),
    ("Esferas y divisa", "Esferas", [("objeto", "Esferas"), ("objeto", "Valores de esferas en marcos de diamante"),
                                     ("objeto", "Usos de las esferas")]),
    ("Mundo", "Bienvenidos a Roshar", [("personaje", "Bienvenidos a Roshar")]),
    ("Cantores", "Los cantores en las culturas humanas", [("origen", "Los cantores en las culturas humanas"),
                                                         ("origen", "Cantores previamente esclavizados"),
                                                         ("origen", "Oyentes"), ("origen", "Personajes cantores en campañas")]),
    ("Cantores", "Otras culturas (Roshar)", [("origen", "Otras culturas")]),
]

# efectos de fabriales únicos: un apartado del libro cada uno
EFECTOS_UNICOS = ["Acelerador", "Alterador", "Ascensor", "Aumentador de armadura", "Compresor", "Cremrial", "Cultivador",
                  "Dolorial (aumentador/reductor)", "Drenador", "Fabrial de potencia", "Lumirial", "Proyectil", "Vidarial",
                  "Vínculorial (uno mismo)", "Vínculorial (zona)"]

KITS = ["Prisionero", "Bajos fondos", "Académico", "Artesano", "Militar", "Cortesano"]


def _norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower().strip()


def _slug(s):
    return re.sub(r"[^a-z0-9]+", "-", _norm(s)).strip("-")[:70] or "x"


class Fuentes:
    """Índice de entradas fuente por (categoría, título normalizado); `usadas` registra las que se consumen."""

    def __init__(self, entradas):
        self.idx = {}
        for e in entradas:
            self.idx.setdefault((e["cat"], _norm(e["title"])), []).append(e)
        self.usadas = []

    def get(self, cat, titulo, ruta=None):
        c = self.idx.get((cat, _norm(titulo)))
        if not c:
            raise KeyError(f"Stormlight reglas: falta la fuente «{titulo}» ({cat}); ¿cambió el libro?")
        if ruta:
            c = [e for e in c if len(e["path"]) > 1 and _norm(e["path"][1]) == _norm(ruta)] or c
        return max(c, key=lambda e: len(e["body"]))  # el mismo texto repetido por el PDF: el más completo

    def buscar(self, cat, pred):
        return [e for (c, _), es in self.idx.items() if c == cat for e in es if pred(e)]


def _cuerpo(fuentes, primero_sin_titulo=True):
    partes = []
    for i, (titulo, e) in enumerate(fuentes):
        t = e["body"].strip()
        partes.append(t if (i == 0 and primero_sin_titulo) else f"#### {titulo}\n{t}")
    return "\n\n".join(p for p in partes if p.strip())


def _regla(tema_grupo, titulo, cuerpo, orden, arbol=None, pagina=""):
    f = {"tema": TEMA, "grupo": tema_grupo, "orden": orden}
    if arbol:
        f["arbol"] = arbol
    return {"cat": "regla", "title": titulo, "path": ["Reglas", TEMA, tema_grupo], "pages": pagina, "body": limpia(cuerpo),
            "f": f, "id": "regla-roshar-" + _slug(titulo), "ambientacion": "Stormlight", "libro": "Manual Stormlight"}


def _kits(resources):
    """Los seis conjuntos del Manual: {«Prisionero»: texto}. El PDF dejó cuatro de ellos en el fichero de las armas."""
    from buscador_stormlight_objetos import _formatea, _leer, _seccion, _tokens, CARPETA
    d = resources / "Manual del Archivo de las Tormentas" / CARPETA
    tokens = []
    for nombre in ("03 - Equipo inicial.md", "04 - Armas.md"):
        tokens += _tokens(_leer(d / nombre))
    out = {}
    for k in KITS:
        txt = _formatea(_seccion(tokens, "Equipo inicial de " + k, nivel=2))
        if not txt.strip():
            raise ValueError(f"Stormlight reglas: no se encuentra el equipo inicial de {k}")
        out[k] = txt
    return out


def _equipo_inicial(resources):
    partes = ["#### Equipo inicial de " + k + "\n" + txt for k, txt in _kits(resources).items()]
    intro = ("Durante el paso 6 de la creación del personaje, eliges uno de los siguientes conjuntos de equipo. Cada conjunto proporciona "
             "esferas (tira los dados indicados para saber con cuántos marcos empiezas), armas o armaduras y otras clases de equipo.")
    return intro + "\n\n" + "\n\n".join(partes)


def kits_en_equipo(resources):
    """Un conjunto = una entrada del catálogo Equipo (tipo «Equipo inicial»), además de la microrregla que los reúne."""
    out = []
    for k, txt in _kits(resources).items():
        out.append({"cat": "equipo", "title": f"Equipo inicial de {k}", "path": ["Capítulo 7 · Objetos", "Equipo inicial"], "pages": "250",
                    "body": txt, "id": "equipo-stormlight-inicial-" + _slug(k), "ambientacion": "Stormlight", "libro": "Manual Stormlight",
                    "f": {"tipo": "Equipo inicial", "peso": "—", "peso_g": None, "precio": "—", "precio_n": None, "nota": ""}})
    return out


def reglas(textos, base, resources):
    """Devuelve (microrreglas nuevas, entradas fuente de `base` que se consumen). `textos`: entradas de Stormlight que no son catálogo."""
    S = Fuentes([e for e in base if e.get("ambientacion") == "Stormlight" and e["cat"] in ("camino", "arte")] + textos)
    out, consumidas, n = [], [], 0

    def anota(*es):
        consumidas.extend(e for e in es if e in base)

    def aporta(grupo, titulo, specs, arbol=None):
        nonlocal n
        fs = [(t, S.get(cat, t)) for cat, t in specs]
        n += 1
        out.append(_regla(grupo, titulo, _cuerpo(fs), n, arbol))
        anota(*[e for _, e in fs])

    for grupo, titulo, specs in PLAN:
        aporta(grupo, titulo, specs)

    # Equipo inicial de Roshar (los de Mistborn, como «Equipo inicial (Scadrial)», los renombra build-buscador)
    n += 1
    out.append(_regla("Esferas y divisa", "Equipo inicial (Roshar)", _equipo_inicial(resources), n))

    # una regla por cada efecto de fabrial único
    for nombre in EFECTOS_UNICOS:
        aporta("Fabriales únicos: efectos", nombre + " (fabrial)", [("objeto", nombre)])

    # una regla por cada potencia: qué es, la potencia básica y cómo usarla sobre los demás
    for p in POTENCIAS:
        es = S.buscar("arte", lambda e: len(e["path"]) > 1 and e["path"][1] == p)
        orden = [(e["title"], e) for e in es
                 if not re.match(r"(?i)talentos de ", e["title"]) and not re.match(r"(?i)c[oó]mo usar la ", e["title"])]
        vistos, fs = set(), []
        for t, e in sorted(orden, key=lambda x: (not x[0].startswith("Qué es"), not x[0].startswith("Potencia de"), 0)):
            k = _norm(t)
            if k in vistos:
                continue
            vistos.add(k)
            fs.append((t, e))
        if not fs:
            continue  # la Abrasión solo trae su cabecera: su texto es el de «Potencia de Abrasión»
        n += 1
        out.append(_regla("Las diez potencias", f"Potencia de {p}", _cuerpo(fs), n, arbol=p))
        anota(*[e for _, e in fs])

    # una regla por cada orden Radiante (filosofía, Ideales, historia) y otra por cada spren (aspecto, cultura, nombres, cómo vincularse)
    for orden, arbol, spren, clave in ORDENES:
        base_orden = _norm(re.sub(r"^(Corredores|Custodios|Danzantes|Escultores|Nominadores|Portadores|Rompedores|Tejedores|Vigilantes|Forjadores) ",
                                  "", orden))
        tit = lambda e: _norm(e["title"])
        propios = S.buscar("camino", lambda e: base_orden in tit(e) and re.match(r"(?i)(filosof|historia|caminos heroicos recomendados)", e["title"]))
        ideales = S.buscar("camino", lambda e: len(e["path"]) > 1 and _norm(e["path"][1]) == _norm(arbol)
                           and re.match(r"(?i)el (segundo|tercer|cuarto) ideal", e["title"]))
        ordenados = sorted(propios, key=lambda e: (not re.match(r"(?i)filosof", e["title"]), e["title"])) + sorted(ideales, key=lambda e: e["title"])
        vistos, fs = set(), []
        for e in ordenados:
            if id(e) in vistos:
                continue
            vistos.add(id(e))
            fs.append((e["title"], e))
        if fs:
            n += 1
            out.append(_regla("Las órdenes Radiantes", f"Orden de los {orden}", _cuerpo(fs), n, arbol=arbol))
            anota(*[e for _, e in fs])
        if spren:
            sp = S.buscar("camino", lambda e: _norm(clave) in _norm(e["title"]) and re.match(
                r"(?i)(aspecto|cultura|nombres|c[oó]mo interpretar)", e["title"]))
            vinculo = S.buscar("camino", lambda e: len(e["path"]) > 1 and _norm(e["path"][1]) == _norm(arbol)
                               and re.match(r"(?i)(c[oó]mo ganarse el v[ií]nculo|preferencias para el v[ií]nculo)", e["title"]))
            fs = [(e["title"], e) for e in sorted(sp, key=lambda e: (not e["title"].startswith("Aspecto"), e["title"]))]
            fs += [(e["title"], e) for e in vinculo]
            if fs:
                n += 1
                out.append(_regla("Spren Radiantes", spren, _cuerpo(fs), n, arbol=arbol))
                anota(*[e for _, e in fs])
    return out, consumidas
