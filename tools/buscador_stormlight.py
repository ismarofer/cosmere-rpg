"""Stormlight en el buscador, paso a paso. Hoy: Orígenes del Manual (capítulo 2): ascendencias, culturas y pericias culturales.

Las entradas se añaden ya con su forma final (categoría, tipo, ambientación e id propios, `origen-stormlight-…`), después de
reorganizar() y de los efectos, para no mezclarse con el tratamiento de los orígenes de Mistborn: el asistente de personajes
(engine.js) toma como cultura todo id `origen-pericia-…`, y enriquecer_origenes casa culturas con nombres por título.

El PDF dejó el capítulo a doble columna: nombres, pericias y párrafos de descripción aparecen fuera de su cultura y alguna frase
quedó partida entre columnas. Por eso cada cultura declara con qué párrafos empieza su descripción (`CULTURAS`) y los nombres y la
pericia se buscan por su encabezado. Las dos «Elección de ascendencia» salen del libro tal cual, pero a mano (`ELECCION_*`).
"""
import re
import unicodedata

from buscador_efectos import ASC_EFECTOS, OBJ_NOMBRE, modificador_entry
from pathlib import Path

AMBIENTACION = "Stormlight"
CAPITULO = "Capítulo 2 · Orígenes"
LIBRO = "Manual Stormlight"
CARPETA = "03 - Capítulo 2 Orígenes"

# cultura -> (prefijos de los párrafos de la descripción, en orden; fragmento del encabezado «Nombres …»; nombre en «Pericia cultural …»)
CULTURAS = {
    "Alezi": (["Alezkar está gobernada", "La mayoría de los alezi son"], "alezi", "Alezi"),
    "Azishiana": (["El Aqasix Supremo y una clase", "La mayoría de los azishianos"], "azishianos", "Azishiana"),
    "Herdaziana": (["Herdaz es una nación verde", "El vorinismo es popular en Herdaz", "La ascendencia cantora en su historia antigua"], "herdazianos", "Herdaziana"),
    "Iriali": (["Iri está gobernada", "Los individuos de etnia iriali"], "iriali", "Iriali"),
    "Kharbranthiana": (["Kharbranth, la Ciudad", "Los futuros cirujanos", "Étnicamente similares"], "kharbranthianos", "Kharbranthiana"),
    "Natana": (["La ciudad-estado vorin de Nueva Natanan", "Los natanos étnicos"], "natanos", "Natana"),
    "Oyente": (["Los oyentes son un grupo de cantores", "Cuando supieron que el rey Gavilar", "La Canción de las clasificaciones"],
               "oyentes", "Oyente"),
    "Reshi": (["Las islas Reshi son", "La mayoría de los reshi"], "reshi", "Reshi"),
    "Shin": (["La nación aislada de Shinovar", "Los agricultores son muy apreciados", "Los tonos de piel de los shin",
              "Las convenciones de nombres incluyen"], "shin", "Shin"),
    "Thayleña": (["La nación insular de Thaylenah", "Los thayleños étnicos"], "thayleños", "Thayleña"),
    "Unkalaki": (["Los Picos Comecuernos", "Los unkalaki étnicos", "En la tradición unkalaki"], "unkalaki", "Unkalaki"),
    "Veden": (["Jah Keved está gobernado", "Dentro de las fronteras de Jah Keved", "En Jah Keved, a los hijos varones"], "veden", "Veden"),
    "Peregrina": (["La ocupación, el exilio"], None, "Peregrina"),
}

# frases que el PDF partió entre columnas: (comienzo del párrafo que queda cortado, comienzo del párrafo que lo continúa)
CONTINUACIONES = [
    ("Cuando supieron que el rey Gavilar", "la Venganza como represalia"),
    ("Como personaje con la pericia Oyente", "y la forma de trabajo (incluso si eres humano"),
]

ASCENDENCIAS = {
    "Ascendencia humana (Roshar)": (
        ["La mayor parte de Roshar está dividida", "Dentro de la especie humana hay muchos", "La sección “Cultura” de este capítulo analiza"],
        """#### Elección de ascendencia humana
Si eliges la ascendencia humana, tu tamaño es Mediano y obtienes los siguientes beneficios en los niveles especificados:

**Talentos adicionales de ascendencia (niveles 1, 6, 11, 16 y 21).** Durante el paso 5 de la creación del personaje, obtienes un talento adicional. Como humano, debes elegir este talento de un camino heroico (como los que se mencionan en el capítulo 4). Siempre que alcances un nuevo rango (como se indica en la tabla Progreso de los personajes en el capítulo 1), obtendrás un nuevo talento adicional de un camino heroico.

Como de costumbre, debes cumplir con los prerrequisitos para estos talentos (consulta la sección “Cómo progresar por un camino” del capítulo 4)."""),
    "Ascendencia cantora": (
        ["Los cantores son la población indígena", "Los cantores tienen la piel jaspeada", "Los cantores utilizan estos ritmos",
         "La sección “Cultura” de este capítulo describe a los oyentes"],
        """#### Elección de ascendencia cantora
Si eliges la ascendencia cantora, tu tamaño es Mediano y obtienes los siguientes beneficios en los niveles especificados:

**Árbol de talentos únicos (nivel 1).** Siempre que obtengas un talento nuevo, podrás elegirlo del árbol de talentos de cantor de este capítulo (además de los otros árboles a los que tengas acceso).

**Cambiar de forma (nivel 1).** Obtienes el talento Cambiar de forma (principal de cantor) del árbol de cantor, junto con un talento adicional vinculado. Decide en qué forma vas a comenzar la partida, eligiendo de entre las formas de esos dos talentos. A medida que subes de nivel, puedes aprender nuevas formas de los talentos del árbol de cantor.

**Talentos adicionales de ascendencia (niveles 6, 11, 16 y 21).** Siempre que alcances un nuevo rango (como se indica en la tabla Progreso de los personajes en el capítulo 1), obtendrás un talento adicional. Debes elegirlo del árbol de cantor o de cualquier camino heroico (consulta el capítulo 4).

Como de costumbre, debes cumplir con los prerrequisitos para estos talentos (consulta la sección “Cómo progresar por un camino” del capítulo 4)."""),
}


def _norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower()


def _slug(s):
    return re.sub(r"[^a-z0-9]+", "-", _norm(s)).strip("-")


def _leer(path):
    txt = path.read_text(encoding="utf-8")
    txt = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\xad]", "", txt)
    m = re.match(r"---\n(.*?)\n---\n", txt, re.S)
    return txt[m.end():] if m else txt


def _es_resto_de_maquetacion(p):
    """Pies de página y créditos de ilustración (nombres en mayúsculas) que el PDF mezcló con el texto."""
    return bool(re.match(r"^Capítulo \d+: ", p)) or (p.upper() == p and len(p) < 60)


def _parrafos(txt):
    """[(es_encabezado, texto)] en el orden del libro, con un solo espacio entre palabras."""
    out = []
    for bloque in re.split(r"\n\s*\n", txt):
        bloque = " ".join(bloque.split())
        if not bloque or _es_resto_de_maquetacion(bloque.lstrip("# ")):
            continue
        out.append((bloque.startswith("#"), bloque.lstrip("# ").strip()))
    return out


def _con_continuaciones(ps):
    """Une al párrafo cortado su continuación (que el PDF dejó en otra columna) y la quita de su sitio."""
    textos = [t for esh, t in ps if not esh]
    for corto, cont in CONTINUACIONES:
        i = next((k for k, t in enumerate(textos) if t.startswith(corto)), None)
        j = next((k for k, t in enumerate(textos) if t.startswith(cont)), None)
        if i is None or j is None:
            raise ValueError(f"Stormlight orígenes: no se encuentra la frase partida «{corto[:40]}» / «{cont[:40]}»")
        textos[i] = textos[i] + " " + textos[j]
        del textos[j]
    return textos


def _parrafo(textos, prefijo, donde):
    for t in textos:
        if t.startswith(prefijo):
            return t
    raise ValueError(f"Stormlight orígenes: falta el párrafo «{prefijo}» ({donde}); ¿cambió el libro?")


def _bajo_encabezado(ps, patron, donde):
    """Párrafos que siguen al encabezado que cumple `patron`, hasta el siguiente encabezado."""
    for i, (esh, t) in enumerate(ps):
        if esh and re.fullmatch(patron, t, re.I):
            out = []
            for esh2, t2 in ps[i + 1:]:
                if esh2:
                    break
                out.append(t2)
            if out:
                return out
    raise ValueError(f"Stormlight orígenes: falta el encabezado «{patron}» ({donde})")


def _entrada(cat, titulo, tipo, cuerpo, paginas, ident, f=None, x=None):
    e = {"cat": cat, "title": titulo, "path": [CAPITULO, tipo], "pages": paginas, "body": cuerpo,
         "f": {**(f or {}), "tipo": tipo}, "id": ident, "ambientacion": AMBIENTACION, "libro": LIBRO}
    if x:
        e["x"] = x
    return e


def origenes(resources):
    """Ascendencias, culturas y pericias culturales del Manual del Archivo de las Tormentas."""
    carpeta = resources / "Manual del Archivo de las Tormentas" / CARPETA
    asc_ps = _parrafos(_leer(carpeta / "02 - Ascendencia.md"))
    asc_tx = [t for esh, t in asc_ps if not esh]
    cul_ps = _parrafos(_leer(carpeta / "03 - Cultura.md"))
    cul_tx = _con_continuaciones(cul_ps)
    out = []
    for titulo, (prefijos, eleccion) in ASCENDENCIAS.items():
        cuerpo = "\n\n".join(_parrafo(asc_tx, p, titulo) for p in prefijos) + "\n\n" + eleccion
        out.append(_entrada("origen", titulo, "Ascendencia", cuerpo, "37-45", "origen-stormlight-" + _slug(re.sub(r"\s*\(.*?\)", "", titulo))))
    for nombre, (prefijos, nombres, pericia) in CULTURAS.items():
        cuerpo = "\n\n".join(_parrafo(cul_tx, p, nombre) for p in prefijos)
        if nombres:
            lista = _bajo_encabezado(cul_ps, r"Nombres " + re.escape(nombres), nombre)
            cuerpo += "\n\n#### Nombres\n" + lista[0]  # solo el primer párrafo: el PDF pega detrás texto de otra cultura
        # la pericia: encabezado «Pericia cultural X» + sus párrafos (con la frase que el PDF partió, ya unida)
        crudo = _bajo_encabezado(cul_ps, r"Pericia cultural " + re.escape(pericia), nombre)
        unidos = [next((t for t in cul_tx if t.startswith(c[:40])), c) for c in crudo]
        titulo_pericia = "Pericia " + nombre
        cuerpo += f"\n\n#### Qué modifica\n◆ Pericia cultural: {nombre}.\n◆ Ver: [[pericia|{titulo_pericia}]]"
        out.append(_entrada("origen", nombre, "Cultura", cuerpo, "45-54", "origen-stormlight-" + _slug(nombre)))
        out.append(_entrada(
            "pericia", titulo_pericia, "Pericia cultural", "\n\n".join(unidos), "45-54",
            "origen-stormlight-pericia-" + _slug(nombre), {"modifica": ["Pericias"]},
            {"efectos": [{"tipo": "pericia", "objetivo": "pericia", "operacion": "otorga", "valor": 1,
                          "detalle": "pericia cultural " + nombre, "permanente": True, "texto": f"Pericia cultural: {nombre}."}]}))
    # efectos de la ascendencia (mismos que dan los textos «Elección de ascendencia» de Mistborn) y sus filas de modificadores
    for e in list(out):
        clave = {"Ascendencia humana (Roshar)": "ascendencia-humana", "Ascendencia cantora": "ascendencia-cantora"}.get(e["title"])
        if clave:
            e["x"] = {"efectos": ASC_EFECTOS[clave]}
            e["f"]["modifica"] = sorted({OBJ_NOMBRE.get(x["objetivo"], x["objetivo"]) for x in ASC_EFECTOS[clave]})
            for k, x in enumerate(ASC_EFECTOS[clave]):
                m = modificador_entry(e, x)
                m["id"] = "modificador-stormlight-" + _slug(e["title"]) + f"-{k + 1}"
                m["libro"] = LIBRO
                out.append(m)
    return out


# Pericias especializadas que el Manual nombra como ejemplo (cap. 3, «Pericias especializadas») o que otorgan sus talentos
# (Guerrero: «Armadura esquirlada», «Gran arco»; Erudito: «Fabricación de fabriales»). No hay lista cerrada.
ESPECIALIZADAS = ["Fabricación de fabriales", "Historia de los cantores", "Caballeros Radiantes"]
# (Gran arco, Hoja esquirlada, Armadura esquirlada, Martillo de guerra y Semiesquirla salen de los objetos: buscador_stormlight_objetos.pericias)

# Ejemplos de pericia de utilidad del Manual de Stormlight que no están en el de Mistborn con ese nombre; los comunes están en
# buscador_personaje.UTILIDAD_COMUN (ambientación Cosmere).
UTILIDAD_PROPIA = ["Historia", "Fabricar armas"]


def pericias_de_utilidad():
    desc = ("Las pericias de utilidad tienen relación con herramientas, oficios, conocimientos técnicos y áreas de estudio similares. "
            "Dominas un campo técnico: conoces las técnicas específicas, el equipo especializado y la jerga de tu especialidad.")
    out = []
    for nombre in UTILIDAD_PROPIA:
        e = _entrada("pericia", "Pericia en " + nombre, "Pericia de utilidad", desc, "60-62",
                     "origen-stormlight-pericia-utilidad-" + _slug(nombre), {"pericia": nombre, "modifica": ["Pericias"]})
        e["path"] = ["Capítulo 3 · Características", "Pericia de utilidad"]
        out.append(e)
    return out


def pericias_especializadas(resources):
    carpeta = resources / "Manual del Archivo de las Tormentas" / "04 - Capítulo 3 Características de los personajes"
    textos = [t for esh, t in _parrafos(_leer(carpeta / "07 - Sentidos.md")) if not esh]
    base = "\n\n".join([
        _parrafo(textos, "Las pericias especializadas pertenecen", "pericias especializadas"),
        _parrafo(textos, "Si tienes una pericia especializada", "pericias especializadas"),
        _parrafo(textos, "Restricciones.", "pericias especializadas"),
    ])
    out = []
    for nombre in ESPECIALIZADAS:
        e = _entrada("pericia", "Pericia especializada en " + nombre, "Pericia especializada", base, "61-62",
                     "origen-stormlight-pericia-especializada-" + _slug(nombre), {"pericia": nombre, "modifica": ["Pericias"]})
        e["path"] = ["Capítulo 3 · Características", "Pericia especializada"]
        out.append(e)
    return out


# --------------------------------------------------------------------------- habilidades de potencia
# nombre -> (atributo, órdenes que la manejan). El atributo viene en el rótulo del título de cada potencia del capítulo 6.
POTENCIAS = {
    "Abrasión": ("Velocidad", "Danzantes del Filo y Portadores del Polvo"),
    "Adhesión": ("Presencia", "Corredores del Viento y Forjadores de Vínculos"),
    "Cohesión": ("Voluntad", "Custodios de la Piedra y Escultores de Voluntad"),
    "División": ("Intelecto", "Portadores del Polvo y Rompedores del Cielo"),
    "Gravitación": ("Discernimiento", "Corredores del Viento y Rompedores del Cielo"),
    "Iluminación": ("Presencia", "Tejedores de Luz y Vigilantes de la Verdad"),
    "Progresión": ("Discernimiento", "Danzantes del Filo y Vigilantes de la Verdad"),
    "Tensión": ("Fuerza", "Custodios de la Piedra y Forjadores de Vínculos"),
    "Transformación": ("Voluntad", "Nominadores de lo Otro y Tejedores de Luz"),
    "Transportación": ("Intelecto", "Escultores de Voluntad y Nominadores de lo Otro"),
}
DEFENSA_DE = {"Fuerza": "Física", "Velocidad": "Física", "Intelecto": "Cognitiva", "Voluntad": "Cognitiva",
              "Discernimiento": "Espiritual", "Presencia": "Espiritual"}


def habilidades_potencia(resources):
    """Una entrada de habilidad por potencia (como Alomancia y Feruquimia en Mistborn): no se tiene hasta pronunciar el Primer Ideal."""
    carpeta = next((resources / "Manual del Archivo de las Tormentas").glob("07 - *"))
    intro = {}
    for f in sorted(carpeta.glob("*.md")):
        txt = _leer(f)
        for m in re.finditer(r"^# ([^\n]+)\n+### [a-zñé]+\n+([^\n#]+)", txt, re.M):
            intro.setdefault(m.group(1).strip(), m.group(2).strip())
    out = []
    for nombre, (attr, ordenes) in POTENCIAS.items():
        cuerpo = "\n\n".join([
            intro.get(nombre, f"La potencia de {nombre} es una de las diez potencias de Roshar."),
            f"Habilidad de potencia. No puedes acceder a ella hasta que pronuncias el Primer Ideal de una orden que la maneje ({ordenes}); "
            f"entonces obtienes 1 grado gratuito. Se rige por tu valor de {attr} y es una habilidad {DEFENSA_DE[attr].lower()}; su modificador "
            "combina tus grados con el valor de ese atributo. Puedes obtener grados adicionales de la misma forma que con el resto de habilidades.",
            "Progresión. Tus grados en la potencia aumentan el dado y el tamaño máximo de lo que afectas (consulta «Escalado de potencias»).",
        ])
        out.append({"cat": "habilidad", "title": nombre, "path": ["Capítulo 6 · Potencias", "Habilidades Investidas"], "pages": "216-219",
                    "body": cuerpo, "f": {"atributo": attr, "defensa": DEFENSA_DE[attr], "tipo": "Investida"},
                    "id": "habilidad-stormlight-" + _slug(nombre), "ambientacion": AMBIENTACION, "libro": LIBRO})
    return out
