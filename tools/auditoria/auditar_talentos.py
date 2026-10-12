"""Auditoría de talentos de Mistborn: PDF (texto limpio) frente a docs/data/base.js. Solo informa; no modifica nada.
Uso: python tools/auditoria/auditar_talentos.py [pdf] > informe.json
"""
import collections
import io
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import talentos_pdf as T

RAIZ = Path(__file__).resolve().parents[2]
PDF = sys.argv[1] if len(sys.argv) > 1 else str(RAIZ / "resources" / "SPA_Mistborn_Handbook.pdf")
RANGOS = {"Camino heroico": (84, 139), "Camino de nacido del metal": (138, 173), "Arte metálica": (172, 265)}
CARPETAS = {"Camino heroico": "05 - *", "Camino de nacido del metal": "06 - *", "Arte metálica": "07 - *"}
AMB_MB = ("Mistborn", "Mistborn Era 1", "Mistborn Era 2", "Cosmere")
ACTS = {"8": "Siempre activo", "r": "Reacción", "R": "Reacción", "*": "Especial", "0": "Acción gratuita", "1": "1 acción", "2": "2 acciones",
        "3": "3 acciones"}


def origenes_por_pagina():
    """{índice de página del PDF: {origen}} a partir de las páginas que da el frontmatter de cada fichero (el .md numera desde 1)."""
    out = collections.defaultdict(set)
    for tipo, patron in CARPETAS.items():
        d = next((RAIZ / "resources" / "Mistborn Manual").glob(patron))
        for f in sorted(d.glob("*.md")):
            fm = f.read_text(encoding="utf-8")[:600]
            t = re.search(r'title:\s*"(.*?)"', fm).group(1)
            m = re.search(r'pages:\s*"(\d+)-(\d+)"', fm)
            if not m or t.startswith("Cómo"):
                continue
            for pg in range(int(m.group(1)) - 1, int(m.group(2))):
                out[(tipo, pg)].add(re.sub(r"\s+ERA\s*\d", "", t).strip())
    return out


def datos():
    t = (RAIZ / "docs" / "data" / "base.js").read_text(encoding="utf-8")
    return json.loads(t[t.index("=") + 1:t.index(";\nwindow.DATA_ARBOLES")])


def pre_norm(s):
    s = re.sub(r"\s+", " ", s or "").replace("- ", "-").strip().lower()
    s = s.replace(" o más", " o más")
    s = re.sub(r"\s*[;,]\s*", "; ", s).rstrip(". ")
    return re.sub(r"\s+", " ", s)


def sin_par(t):
    t = re.sub(r"\s*\(.*?\)", "", t)
    t = re.sub(r"[★∞↻▷]", "", t)
    return T.norm(re.sub(r"\s+", " ", t).strip())


def main():
    base = datos()
    ours = [e for e in base if e["cat"] == "talento" and e["ambientacion"] in AMB_MB and e["f"]["tipo_origen"] in RANGOS]
    idx = collections.defaultdict(list)
    for e in ours:
        idx[(e["f"]["tipo_origen"], sin_par(e["title"]))].append(e)
    pag = origenes_por_pagina()
    inf = collections.OrderedDict((k, []) for k in ("faltan_en_datos", "sobran_en_datos", "especialidad", "prerreq", "activacion", "repetidos_datos",
                                                      "enlaces_de_mas", "enlaces_que_faltan"))
    por_id = {e["id"]: e for e in base}
    pareja = {}   # id -> texto de prerrequisito del PDF
    emparejados = set()
    n_pdf = 0
    pdfs = []
    for tipo, (a, b) in RANGOS.items():
        for t in T.talentos(T.paginas(PDF, a, b)):
            t["tipo"] = tipo
            pdfs.append(t)
    n_pdf = len(pdfs)
    # los títulos que el PDF parte en dos líneas («Posición vigilante (principal / de Guerrero)») se recomponen por el patrón de la línea siguiente
    for t in pdfs:
        tipo = t["tipo"]
        tit = sin_par(t["titulo"])
        origenes = pag.get((tipo, t["pagina"]), set())
        cand = [e for e in idx.get((tipo, tit), []) if e["id"] not in emparejados]
        if origenes:
            c2 = [e for e in cand if e["f"]["origen"] in origenes]
            cand = c2 or cand
        if tipo == "Camino heroico" and t["especialidad"] and t["especialidad"] != "Principal":
            c2 = [e for e in cand if t["especialidad"] in ([e["f"].get("especialidad")] + (e["f"].get("especialidades") or []))]
            if cand and not c2:
                inf["especialidad"].append({"titulo": t["titulo"], "pdf": t["especialidad"],
                                            "datos": sorted({f"{e['f']['origen']}/{e['f'].get('especialidad')}" for e in cand})})
            cand = c2 or cand
        if not cand:
            inf["faltan_en_datos"].append({"tipo": tipo, "titulo": t["titulo"], "especialidad": t["especialidad"], "pag": t["pagina"] + 1,
                                           "origenes": sorted(origenes)})
            continue
        e = cand[0]
        emparejados.add(e["id"])
        pareja[e["id"]] = t["prerreq"]
        if pre_norm(e["f"]["prerrequisito"]) != pre_norm(t["prerreq"]):
            inf["prerreq"].append({"id": e["id"], "origen": e["f"]["origen"], "titulo": t["titulo"], "pdf": t["prerreq"],
                                   "datos": e["f"]["prerrequisito"]})
        pa = ACTS.get(t["activacion"], t["activacion"])
        if pa != e["f"]["activacion"]:
            inf["activacion"].append({"id": e["id"], "origen": e["f"]["origen"], "titulo": t["titulo"], "pdf": pa, "datos": e["f"]["activacion"]})
    # enlaces: los padres que tenemos frente a los talentos del mismo camino que el prerrequisito del PDF nombra
    por_origen = collections.defaultdict(list)
    for e in ours:
        por_origen[e["f"]["origen"]].append(e)
    for eid, pre in pareja.items():
        e = por_id[eid]
        m = re.search(r"talentos?(.*)$", pre, re.I)
        texto = " " + T.norm(m.group(1) if m else "") + " "
        texto = re.sub(r"principal", " ", texto)
        # padres que tenemos
        tenemos = {por_id[r]["title"] for r in e["x"].get("req", []) + e["x"].get("xreq", []) if r in por_id}
        nombrados = set()
        pool =por_origen[e["f"]["origen"]] + [x for x in ours if x["f"]["origen"] != e["f"]["origen"]]
        for c in sorted(pool, key=lambda c: -len(sin_par(c["title"]))):
            nombre = sin_par(c["title"])
            if len(nombre) >= 5 and re.search(r"(?<![a-z])" + re.escape(nombre) + r"(?![a-z])", texto):
                nombrados.add(c["title"])
                texto = texto.replace(nombre, " ")
        tn = {sin_par(x) for x in tenemos}
        nn = {sin_par(x) for x in nombrados}
        if tn - nn:
            inf["enlaces_de_mas"].append({"id": eid, "titulo": e["title"], "origen": e["f"]["origen"], "prerreq_pdf": pre,
                                          "enlazados_de_mas": sorted(tenemos), "pdf_nombra": sorted(nombrados)})
        if nn - tn:
            inf["enlaces_que_faltan"].append({"id": eid, "titulo": e["title"], "origen": e["f"]["origen"], "prerreq_pdf": pre,
                                              "enlazados": sorted(tenemos), "pdf_nombra": sorted(nombrados)})
    for e in ours:
        if e["id"] not in emparejados:
            inf["sobran_en_datos"].append({"id": e["id"], "tipo": e["f"]["tipo_origen"], "origen": e["f"]["origen"], "titulo": e["title"]})
    cnt = collections.Counter((e["f"]["origen"], sin_par(e["title"])) for e in ours)
    inf["repetidos_datos"] = [f"{o}: {t} x{n}" for (o, t), n in cnt.items() if n > 1]
    inf["_resumen"] = {"talentos_en_pdf": n_pdf, "talentos_en_datos": len(ours), **{k: len(v) for k, v in inf.items()}}
    json.dump(inf, sys.stdout, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    main()
