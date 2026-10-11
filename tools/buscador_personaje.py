"""Reorganiza las entradas de personaje/origen por los pasos de la creación de personaje.
Se aplica después de finalize(): los ids no cambian, solo la categoría. Los enlaces [[cat|Título]] se reescriben solos."""
import re
from buscador_extras import norm

SECCIONES_BASICAS = {
    "El Jdr del Cosmere", "Cómo Usar Este Libro", "Bienvenidos a Scadrial", "¿Qué Es un Juego de Rol?",
    "Cómo Usar los Dados del Jdr del Cosmere", "Acciones y Reacciones", "Aventuras y Progreso", "Ejemplo de Juego",
}


def base_id(i):
    return re.sub(r"-\d+$", "", i)


POR_ID = {
    "atributo": """acerca-de-tus-caracteristicas levantar-y-desplazar-personajes atributos fuerza voluntad movimiento-fuera-del-combate
        caracteristicas-afectadas establecer-conexiones desvio defensas salud-concentracion-e-investidura sentidos sobreestimulacion
        sentidos-y-diversidad-funcional apuntar-sin-los-sentidos como-sentir-personajes-y-objetos-ocultos sentidos-sobrenaturales
        como-usar-los-sentidos-sobrenaturales fisico-cognitivo-y-espiritual""",
    "pericia": """pericias como-usar-las-pericias eleccion-de-pericias pericias-culturales categorias-de-pericia pericias-en-arma
        pericias-en-armadura pericias-de-utilidad pericias-especializadas usos-creativos-de-las-pericias conocimientos-supuestos
        pensamiento-avanzado idiomas-conocidos rasgos-de-experto-en-objetos""",
    "progreso": """pasos-de-la-creacion-de-personajes antes-de-crear-personajes como-empezar-en-niveles-superiores
        progreso-de-los-personajes rangos-de-juego prerrequisitos como-elegir-recompensas niveles-y-metas aventuras-y-progreso""",
    "camino": "como-usar-los-caminos-y-los-talentos caminos-heroicos-y-de-nacido-del-metal",
    "historia": """como-contar-una-historia-convincente cosas-a-tener-en-cuenta-sobre-la-historia ten-en-cuenta-tus-origenes
        ascendencia-y-cultura clase-social ocupacion identidad amigos-y-facciones""",
}
POR_ID = {cat: set(ids.split()) for cat, ids in POR_ID.items()}

# duplicados de personaje que ya existen en origen (se conserva una sola copia, en Historia)
DUPLICADOS = {"ten-en-cuenta-tus-origenes", "ascendencia-y-cultura", "clase-social", "ocupacion", "identidad"}


def _nueva_cat(e):
    pref, _, resto = e["id"].partition("-")
    b = base_id(resto)
    if pref == "origen" and b == "x":
        return None
    for cat, ids in POR_ID.items():
        if b in ids:
            return cat
    if pref == "origen":
        return "origen"
    if b == "bienvenidos-a-scadrial" or (len(e["path"]) > 1 and e["path"][1] in SECCIONES_BASICAS):
        return "basicas"
    return "personaje"


def _clave(titulo):
    t = norm(titulo)
    t = re.sub(r"^(los|las|el|la)\s+", "", t)
    return re.sub(r"[aos]$", "", t)


ASCENDENCIAS = [
    ("origen-ascendencia-humana", "origen-eleccion-de-ascendencia-humana", "#/caminos/heroicos", "Caminos heroicos (talentos adicionales)"),
    ("origen-ascendencia-kandra", "origen-eleccion-de-ascendencia-kandra", "#/arbol/ascendencia", "Árbol de talentos de ascendencia"),
    ("origen-ascendencia-de-sangre-koloss", "origen-eleccion-de-ascendencia-de-sangre-koloss", "#/arbol/ascendencia", "Árbol de talentos de ascendencia"),
]


def _bloque(fuentes, enlaces):
    lineas = []
    for src in fuentes:
        for ef in (src.get("x") or {}).get("efectos", []):
            lineas.append("◆ " + ef["texto"].strip())
    for destino, etiqueta in enlaces:
        lineas.append(f"◆ Ver: [[{destino}|{etiqueta}]]")
    if not lineas:
        return ""
    return "\n\n#### Qué modifica\n" + "\n".join(lineas)


def enriquecer_origenes(base):
    by_id = {e["id"]: e for e in base}
    for pid, eid, ruta, etiqueta in ASCENDENCIAS:
        p, el = by_id.get(pid), by_id.get(eid)
        if p and el:
            p["body"] += _bloque([el], [(ruta, etiqueta), ("origen", el["title"])])
    pericias = [e for e in base if e["id"].startswith("origen-pericia-")]
    for c in base:
        if c["cat"] != "origen" or c["f"].get("seccion") != "Cultura":
            continue
        if c["id"].startswith(("origen-pericia", "origen-nombres")):
            continue
        k = _clave(c["title"])
        m = [p for p in pericias if _clave(re.sub(r"^Pericias?\s+", "", p["title"])) == k]
        if m:
            c["body"] += _bloque(m, [("origen", m[0]["title"])])


def reorganizar(base, dj):
    mov = {}
    quitar = set()
    for e in base:
        if e["cat"] not in ("personaje", "origen"):
            continue
        antigua = e["cat"]
        nueva = _nueva_cat(e)
        if nueva is None:
            quitar.add(id(e))
        elif antigua == "personaje" and base_id(e["id"].partition("-")[2]) in DUPLICADOS:
            quitar.add(id(e))
            mov[(antigua, norm(e["title"]))] = "historia"
        elif nueva != antigua:
            mov[(antigua, norm(e["title"]))] = nueva
            e["cat"] = nueva
    base[:] = [e for e in base if id(e) not in quitar]
    enriquecer_origenes(base)

    patron = re.compile(r"\[\[(personaje|origen)\|([^\]]+)\]\]")

    def reescribe(m):
        nueva = mov.get((m.group(1), norm(m.group(2))))
        return f"[[{nueva}|{m.group(2)}]]" if nueva else m.group(0)

    for e in base + dj:
        e["body"] = patron.sub(reescribe, e["body"])
    return len(quitar)
