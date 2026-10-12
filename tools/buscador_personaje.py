"""Reorganiza las entradas de personaje/origen por los pasos de la creación de personaje.
Se aplica después de finalize(): los ids no cambian, solo la categoría. Los enlaces [[cat|Título]] se reescriben solos."""
import json
import re
from pathlib import Path

from buscador_extras import norm
from buscador_limpieza import aplicar_formato, limpia

# correcciones de formato del catálogo Orígenes (mismo formato que las de las microrreglas)
FORMATO_ORIGENES = Path(__file__).parent / "reglas" / "formato" / "catalogo" / "origen.json"

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
    # textos de historia y trasfondo (Historia, clase social, ocupación…): no se publican
    "descartar": """como-contar-una-historia-convincente cosas-a-tener-en-cuenta-sobre-la-historia ten-en-cuenta-tus-origenes
        ascendencia-y-cultura clase-social ocupacion identidad amigos-y-facciones""",
}
POR_ID = {cat: set(ids.split()) for cat, ids in POR_ID.items()}



def _nueva_cat(e):
    pref, _, resto = e["id"].partition("-")
    b = base_id(resto)
    if pref == "origen" and b == "x":
        return None
    for cat, ids in POR_ID.items():
        if b in ids:
            return None if cat == "descartar" else cat
    if pref == "origen":
        return "origen"
    if b == "bienvenidos-a-scadrial" or (len(e["path"]) > 1 and e["path"][1] in SECCIONES_BASICAS):
        return "basicas"
    return "personaje"


def _clave(titulo):
    t = norm(titulo)
    t = re.sub(r"^(los|las|el|la)\s+", "", t)
    return re.sub(r"(?:os|as|[aos])$", "", t)  # «Peregrinos» / «Pericia Peregrina»


ASCENDENCIAS = [
    ("origen-ascendencia-humana", "origen-eleccion-de-ascendencia-humana", "#/caminos/heroicos", "Caminos heroicos (talentos adicionales)"),
    ("origen-ascendencia-kandra", "origen-eleccion-de-ascendencia-kandra", "#/arbol/ascendencia", "Árbol de talentos de ascendencia"),
    ("origen-ascendencia-de-sangre-koloss", "origen-eleccion-de-ascendencia-de-sangre-koloss", "#/arbol/ascendencia", "Árbol de talentos de ascendencia"),
]


def _bloque(fuentes, enlaces, titulo="Qué modifica"):
    lineas = []
    for src in fuentes:
        for ef in (src.get("x") or {}).get("efectos", []):
            lineas.append("◆ " + ef["texto"].strip())
    for destino, etiqueta in enlaces:
        lineas.append(f"◆ Ver: [[{destino}|{etiqueta}]]")
    if not lineas:
        return ""
    return f"\n\n#### {titulo}\n" + "\n".join(lineas)


# Introducciones de los árboles de ascendencia («los personajes kandra tienen a su disposición los siguientes talentos»): sin la
# lista del libro no dicen nada; la página de la ascendencia ya enlaza a su árbol
SIN_TEXTO = {"origen-talentos-kandra", "origen-talentos-de-sangre-koloss"}


def enriquecer_origenes(base):
    """El catálogo Orígenes solo lleva lo que se elige: ascendencias y culturas; las pericias (culturales y las del manual) van a su
    catálogo. La
    «Elección de ascendencia» y las Bendiciones kandra se funden en su ascendencia y los nombres típicos, en su cultura. Los textos de reglas y trasfondo
    (cuerpos y contratos kandra, historia de los koloss, introducciones…) pasan a ser microrreglas (tools/reglas/origenes.json)."""
    by_id = {e["id"]: e for e in base}
    for e in base:
        if e["cat"] == "origen":
            e["body"] = limpia(e["body"])
    _recoloca_kandra(by_id)
    formato = json.loads(FORMATO_ORIGENES.read_text(encoding="utf-8")) if FORMATO_ORIGENES.exists() else []
    quitar = {id(by_id[i]) for i in SIN_TEXTO if i in by_id}
    # las Bendiciones se eligen con la ascendencia: van como sección de «Ascendencia kandra», tras la elección (se formatean antes)
    ben = by_id.get("origen-bendiciones-kandra")
    if ben:
        ben["body"] = aplicar_formato(ben["title"], ben["body"], formato)
        quitar.add(id(ben))
    for pid, eid, ruta, etiqueta in ASCENDENCIAS:
        p, el = by_id.get(pid), by_id.get(eid)
        if p and el:
            p["body"] += "\n\n#### " + el["title"] + "\n" + el["body"].strip()
            if ben and pid == "origen-ascendencia-kandra":
                p["body"] += "\n\n#### " + ben["title"] + "\n" + ben["body"].strip()
            p["body"] += _bloque([], [(ruta, etiqueta)], "Ver también")
            quitar.add(id(el))
    culturas = {_clave(c["title"]): c for c in base if c["cat"] == "origen" and c["f"].get("seccion") == "Cultura"
                and not c["id"].startswith(("origen-pericia", "origen-nombres"))}
    for n in base:
        if n["id"].startswith("origen-nombres-"):
            c = culturas.get(_clave(re.sub(r"^Nombres\s+(de\s+)?", "", n["title"])))
            if c:
                c["body"] += "\n\n#### Nombres\n" + n["body"].strip()
                quitar.add(id(n))
    base[:] = [e for e in base if id(e) not in quitar]
    pericias = [e for e in base if e["id"].startswith("origen-pericia-")]
    for c in base:
        if c["cat"] != "origen" or c["f"].get("seccion") != "Cultura":
            continue
        if c["id"].startswith(("origen-pericia", "origen-nombres")):
            continue
        k = _clave(c["title"])
        m = [p for p in pericias if _clave(re.sub(r"^Pericias?\s+", "", p["title"])) == k]
        if m:
            c["body"] += _bloque(m, [("pericia", m[0]["title"])])
    for e in base:
        if e["cat"] == "origen":
            e["body"] = aplicar_formato(e["title"], e["body"], formato)
            # el filtro de la lista es el tipo de origen; la sección del libro ya no se enseña
            seccion = e["f"].pop("seccion", None)
            tipo = "Pericia cultural" if e["id"].startswith("origen-pericia-") else seccion
            if tipo:
                e["f"]["tipo"] = tipo
                e["path"] = [e["path"][0], tipo]
                if tipo.startswith("Pericia"):
                    e["cat"] = "pericia"  # las pericias tienen catálogo propio; los ids («origen-pericia-…») no cambian
    _pericias_del_manual(base)


# Pericias que el manual nombra (no hay lista cerrada: «Pericias», cap. 3). Las de arma y armadura salen de los catálogos de
# Equipo; las especializadas son las que el cap. 7 y el cap. 8 dicen que solo se obtienen con talentos, recompensas o entrenamiento.
ESPECIALIZADAS = {
    "Ametralladora rotatoria", "Bastón de duelo", "Dinamita", "Hoja koloss", "Palo de ruido", "Capa de bruma", "Gabán de bruma",
}
UTILIDAD = [
    "Cuidado de animales", "Cuidados en salud mental", "Diagnóstico", "Escándalos", "Estrategia militar", "Fabricar armaduras",
    "Fabricar armamento", "Fabricar equipo", "Ingeniería", "Juegos de manos", "Literatura", "Logística militar",
    "Mantenimiento de armas de fuego", "Mantenimiento de ballestas", "Mecánica de automóviles", "Montar a caballo", "Oratoria", "Religión",
]
DEF_PERICIA = {
    "Pericia en arma": "Las pericias en arma tienen relación con el mantenimiento y manejo de un tipo específico de arma. Eres experto en su limpieza, cuidado y fabricación, y puedes usar sus rasgos de experto, porque sabes cómo empuñarla mejor en combate.",
    "Pericia en armadura": "Las pericias en armadura se centran en el mantenimiento y el uso de cualquier tipo de armadura. Eres experto en su limpieza, cuidado e incluso fabricación, y puedes aprovechar sus rasgos de experto, porque sabes cómo vestirla y moverte con ella.",
    "Pericia de utilidad": "Las pericias de utilidad tienen relación con herramientas, oficios, conocimientos técnicos y áreas de estudio similares. Dominas un campo técnico: conoces las técnicas específicas, el equipo especializado y la jerga de tu especialidad.",
    "Pericia especializada": "Las pericias especializadas pertenecen a esferas restringidas de conocimiento. No puedes elegirlas con los puntos que te otorga el Intelecto: solo se obtienen mediante talentos, recompensas, entrenamiento o con el permiso explícito de la DJ.",
}


def _pericias_del_manual(base):
    """Añade al catálogo Orígenes las pericias en arma, en armadura, de utilidad y especializadas que nombra el manual."""
    def nueva(tipo, nombre, prefijo, cuerpo, pages, ambientacion, ident):
        return {"cat": "pericia", "title": f"{prefijo} {nombre}", "path": ["Capítulo 3 · Características", tipo], "pages": pages,
                "body": cuerpo, "id": "origen-" + ident, "ambientacion": ambientacion,
                "f": {"tipo": tipo, "pericia": nombre, "modifica": ["Pericias"]}}

    def slug(s):
        return re.sub(r"[^a-z0-9]+", "-", norm(s)).strip("-")

    out = []
    for cat, cat_nombre in (("arma", "arma"), ("armadura", "armadura")):
        for e in base:
            if e["cat"] != cat:
                continue
            nombre = re.sub(r"\s*\(.*?\)", "", e["title"]).strip()
            if cat == "armadura" and nombre == "Cuero":
                nombre = "Armadura de cuero"  # así la nombra el manual
            esp = nombre in ESPECIALIZADAS
            tipo = "Pericia especializada" if esp else f"Pericia en {cat_nombre}"
            exp = (e["f"].get("experto") or "").strip()
            partes = [DEF_PERICIA[tipo]]
            if exp and exp != "—":
                partes.append(f"Rasgo de experto: {exp}.")
            partes.append(f"Ver: [[{cat}|{e['title']}]]")
            out.append(nueva(tipo, nombre, "Pericia especializada en" if esp else "Pericia en", "\n\n".join(partes),
                             e["pages"], e["ambientacion"], f"pericia-{cat}-{slug(nombre)}"))
    for nombre in UTILIDAD:
        out.append(nueva("Pericia de utilidad", nombre, "Pericia en", DEF_PERICIA["Pericia de utilidad"], "60-62", "Mistborn",
                         "pericia-utilidad-" + slug(nombre)))
    out.append(nueva("Pericia especializada", "Hemalurgo", "Pericia especializada en",
                     DEF_PERICIA["Pericia especializada"] + "\n\nLa pericia especializada Hemalurgo te permite implantarte clavos hemalúrgicos "
                     "a ti mismo o a otros personajes dispuestos; se obtiene como recompensa junto a los clavos (consulta «Clavos hemalúrgicos» en el capítulo 8).",
                     "60-62", "Mistborn", "pericia-especializada-hemalurgo"))
    base.extend(out)


def _recoloca_kandra(by_id):
    """El PDF parte la lista de Bendiciones kandra: la mitad acaba en «Contratos kandra» y, a cambio, el párrafo del Cuerpo
    Verdadero (que es de «Cuerpos kandra») acaba en las Bendiciones."""
    ben, con, cue = (by_id.get("origen-" + s) for s in ("bendiciones-kandra", "contratos-kandra", "cuerpos-kandra"))
    if not (ben and con and cue):
        return
    i = con["body"].find("Bendición de la Presencia.")
    j = ben["body"].find("Cuando no adoptan la forma de otra especie")
    if i < 0 or j < 0:
        raise ValueError("cambió el texto de las Bendiciones kandra: revisa _recoloca_kandra")
    resto = con["body"][i:].strip()
    con["body"] = con["body"][:i].strip()
    cue["body"] = cue["body"].strip() + "\n\n" + ben["body"][j:].strip()
    ben["body"] = ben["body"][:j].strip() + " " + resto


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


def redirige_modificadores(base):
    """Los modificadores de una «Elección de ascendencia» enlazan a su ascendencia, donde ahora está ese texto."""
    destino = {eid: pid for pid, eid, _, _ in ASCENDENCIAS}
    for e in base:
        if e["cat"] == "modificador" and e.get("x", {}).get("fuente_id") in destino:
            e["x"]["fuente_id"] = destino[e["x"]["fuente_id"]]
