"""Stormlight: qué potencias controla cada orden Radiante (tabla «Órdenes Radiantes», capítulo 5).

Añade a DATA_ARBOLES, para que la página de cada árbol pueda enlazarlos:
  - en el árbol de una orden: `potencias` (slugs de sus dos árboles de potencia), `spren` y `filosofia`;
  - en el árbol de una potencia: `ordenes` (slugs de las órdenes jugables que la controlan).
"""
import re
import unicodedata
from pathlib import Path

POTENCIAS = ["Abrasión", "Adhesión", "Cohesión", "División", "Gravitación", "Iluminación", "Progresión", "Tensión", "Transformación",
             "Transportación"]
ARCHIVO = "06 - Capítulo 5 Caminos radiantes/03 - Órdenes de Caballeros Radiantes.md"
ORDENES = ["Corredores del Viento", "Custodios de la Piedra", "Danzantes del Filo", "Escultores de Voluntad", "Nominadores de lo Otro",
           "Portadores del Polvo", "Rompedores del Cielo", "Tejedores de Luz", "Vigilantes de la Verdad", "Forjadores de Vínculos"]


def _norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower()


def _slug(s):
    return re.sub(r"[^a-z0-9]+", "-", _norm(s)).strip("-")


def tabla(resources):
    """{slug de la orden: {spren, potencias, filosofia}} leído de la tabla del libro (las diez órdenes)."""
    txt = (resources / "Manual del Archivo de las Tormentas" / ARCHIVO).read_text(encoding="utf-8")
    i = txt.find("### Órdenes Radiantes")
    if i < 0:
        raise ValueError("Stormlight órdenes: no se encuentra la tabla «Órdenes Radiantes»")
    fin = txt.find("*No disponible", i)
    bloque = txt[i:fin if fin > 0 else i + 3000]
    pot = "|".join(POTENCIAS)
    ordenes = "|".join(re.escape(o) for o in ORDENES)
    patron = re.compile(r"^(?P<orden>" + ordenes + r")\*? (?P<spren>[^\n]+?)\*? (?P<p1>" + pot + r") y (?P<p2>" + pot
                        + r") (?P<fil>[^\n]+)$", re.M)
    out = {}
    for m in patron.finditer(bloque):
        orden = m.group("orden").strip()
        out[_slug(orden)] = {"orden": orden, "spren": m.group("spren").strip(), "potencias": [m.group("p1"), m.group("p2")],
                             "filosofia": m.group("fil").strip()}
    if len(out) != 10:
        raise ValueError(f"Stormlight órdenes: se esperaban 10 órdenes en la tabla y salen {len(out)}")
    return out


def enlaza(resources, arboles):
    """Rellena `potencias`, `spren`, `filosofia` y `ordenes` en los árboles (lista DATA_ARBOLES). Devuelve cuántas órdenes enlazó."""
    t = tabla(resources)
    por_slug = {a["slug"]: a for a in arboles}
    ALIAS = {"danzantes-del-filo": "danzante-del-filo"}  # el libro la llama «Danzante del filo» en su capítulo y «Danzantes» en la tabla
    n = 0
    for slug, d in t.items():
        slug = ALIAS.get(slug, slug)
        orden = por_slug.get(slug)
        if orden is None:  # los Forjadores de Vínculos no son jugables y no tienen árbol
            continue
        pots = [_slug(p) for p in d["potencias"]]
        faltan = [p for p in pots if p not in por_slug]
        if faltan:
            raise ValueError(f"Stormlight órdenes: la orden {d['orden']} usa potencias sin árbol: {faltan}")
        orden["potencias"] = pots
        orden["spren"] = d["spren"]
        orden["filosofia"] = d["filosofia"]
        for p in pots:
            por_slug[p].setdefault("ordenes", []).append(slug)
        n += 1
    return n
