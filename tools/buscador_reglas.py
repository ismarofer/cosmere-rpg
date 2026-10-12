"""Microrreglas: la unidad de consulta de las reglas es la regla suelta, no la sección del libro.

Cada fichero de `tools/reglas/<tema>.json` define un tema (p. ej. Combate) como una lista ordenada de microrreglas, agrupadas por
asunto. Una microrregla se compone de una o varias entradas ya extraídas del libro (`fuentes`, por id): así se fusionan fragmentos y se
descartan los encabezados contenedores sin tocar el texto. El resultado son entradas `cat = "regla"` con id estable `regla-<slug>`.
"""
import json
import re
import unicodedata
from pathlib import Path

from buscador_limpieza import aplicar_formato, aplicar_tablas, cargar_formato, cargar_tablas, limpia

DIR = Path(__file__).parent / "reglas"


def _texto(e, spec):
    """Cuerpo de una fuente. `spec` es un id (texto completo) o {id, desde, hasta}: recorta desde la primera aparición de `desde`
    (incluida) hasta `hasta` (excluida); sin `desde`, empieza al principio; sin `hasta`, llega al final. `encabezado` antepone un subtítulo (al fusionar varias fuentes); `reemplazar` corrige
    restos de maquetación del PDF: lista de [texto, sustituto]."""
    cuerpo = e["body"].strip()
    if isinstance(spec, dict):
        ini = cuerpo.index(spec["desde"]) if "desde" in spec else 0
        fin = cuerpo.index(spec["hasta"], ini + 1) if "hasta" in spec else len(cuerpo)
        cuerpo = cuerpo[ini:fin].strip()
        for antes, despues in spec.get("reemplazar", []):
            cuerpo = cuerpo.replace(antes, despues)
    if isinstance(spec, dict) and spec.get("encabezado"):
        cuerpo = "#### " + spec["encabezado"] + "\n" + cuerpo
    return cuerpo


def _arbol(e):
    """Si la fuente colgaba de un árbol (camino, arte u origen), la microrregla recuerda a cuál para mostrarse en su página."""
    ruta = e.get("path") or []
    return {"arbol": ruta[1]} if e["cat"] in ("camino", "arte", "origen") and len(ruta) > 1 else {}


def _norm(s):
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if unicodedata.category(c) != "Mn").lower().strip()


def _reenlaza(base):
    """Los enlaces `[[cat|Título]]` de los textos (p. ej. la guía de creación) apuntan a la categoría original; si esa entrada
    pasó a ser microrregla, el enlace se reescribe a `[[regla|Título]]`."""
    existentes = {(e["cat"], _norm(e["title"])) for e in base}
    reglas = {_norm(e["title"]) for e in base if e["cat"] == "regla"}

    def cambia(m):
        cat, _, titulo = m.group(1).partition("|")
        if not titulo or cat.startswith("#") or (cat, _norm(titulo)) in existentes:
            return m.group(0)
        return "[[regla|" + titulo + "]]" if _norm(titulo) in reglas else m.group(0)

    for e in base:
        if "[[" in e.get("body", ""):
            e["body"] = re.sub(r"\[\[([^\]]+)\]\]", cambia, e["body"])


def build_reglas(base):
    """Sustituye en `base` las entradas fuente por las microrreglas definidas en tools/reglas/*.json. Devuelve cuántas creó."""
    por_id = {e["id"]: e for e in base}
    TABLAS = cargar_tablas()
    FORMATO = cargar_formato()
    pendientes = {f["titulo"] for f in FORMATO}
    usadas, nuevas = set(), []
    for fichero in sorted(DIR.glob("*.json")):
        d = json.loads(fichero.read_text(encoding="utf-8"))
        tema = d["tema"]
        usadas.update(id(por_id[i]) for i in d.get("descartar", []))  # entradas fuente que no se publican como regla
        orden = 0
        for grupo in d["reglas_por_grupo"]:
            for r in grupo["reglas"]:
                specs = r["fuentes"]
                fuentes = [por_id[x["id"] if isinstance(x, dict) else x] for x in specs]  # KeyError si el libro cambia: es lo deseado
                orden += 1
                paginas = sorted({p for e in fuentes for p in str(e.get("pages", "")).split(",") if p})
                nuevas.append({
                    "cat": "regla", "title": r["titulo"],
                    "path": ["Reglas", tema, grupo["nombre"]],
                    "pages": ", ".join(paginas),
                    "body": aplicar_formato(r["titulo"], limpia(aplicar_tablas(
                        r["titulo"], "\n\n".join(t for t in (_texto(e, sp) for e, sp in zip(fuentes, specs)) if t), TABLAS)), FORMATO)
                    + (("\n\n" + r["anexo"]) if r.get("anexo") else ""),
                    "f": {"tema": tema, "grupo": grupo["nombre"], "orden": orden, **_arbol(fuentes[0])},
                    "id": "regla-" + r["slug"],
                    "ambientacion": fuentes[0].get("ambientacion", "Mistborn"),
                })
                # `copia`: la fuente sigue publicándose en su catálogo (p. ej. un valor de «Valores y cálculos»)
                usadas.update(id(e) for e, sp in zip(fuentes, specs) if not (isinstance(sp, dict) and sp.get("copia")))
                pendientes.discard(r["titulo"])
    assert not pendientes, f"tools/reglas/formato cita reglas que no existen: {sorted(pendientes)}"
    ids = [e["id"] for e in nuevas]
    repetidos = {i for i in ids if ids.count(i) > 1}
    assert not repetidos, f"ids de microrregla repetidos: {sorted(repetidos)}"
    base[:] = [e for e in base if id(e) not in usadas] + nuevas
    _reenlaza(base)
    return len(nuevas)
