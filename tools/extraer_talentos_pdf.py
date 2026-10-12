#!/usr/bin/env python3
"""Extrae los talentos de Mistborn directamente del PDF (texto con su estilo) a tools/fuentes/talentos-mistborn.json.

Por qué: la conversión a .md mezcla las dos columnas de la página y los talentos salen con párrafos de otra sección, truncados o con el
prerrequisito dentro del cuerpo (ver specs/auditoria-mistborn.md). En el PDF cada talento tiene un estilo fijo y reconocible:

  título          PlantinMTPro-Regular 12,5 pt, rojo         «Haz que hablen»
  prerrequisito   «Prerrequisito:» en negrita + valor        (puede partirse en dos bloques)
  activación      «Activación:» en negrita + glifo CosmereDingbats (1 2 3 0 r * 8)
  tema            cursiva                                    → párrafo temático
  mecánica        regular                                    → resto del cuerpo
  carta resumen   LaskiSans, dentro de un rectángulo blanco  → `resumen`

Uso:  python tools/extraer_talentos_pdf.py [ruta.pdf]      (el PDF no se versiona; el JSON sí, y es lo que lee el build)
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

import pymupdf

RAIZ = Path(__file__).resolve().parent.parent
# Un libro = dónde está el PDF, su carpeta de .md (solo para saber qué páginas son de cada camino), el JSON de salida y el estilo de sus talentos.
LIBROS = {
    "mistborn": {"pdf": "SPA_Mistborn_Handbook.pdf", "md": "Mistborn Manual", "salida": "talentos-mistborn.json",
                 "titulo": (12.5, 6954788), "credito": 9008760,
                 "capitulos": [("03 - *", "Ascendencia/Cultura"), ("05 - *", "Camino heroico"), ("06 - *", "Camino de nacido del metal"),
                               ("07 - *", "Arte metálica")]},
    "stormlight": {"pdf": "Manual del Archivo de las Tormentas.pdf", "md": "Manual del Archivo de las Tormentas",
                   "salida": "talentos-stormlight.json", "titulo": (13.5, 1981536), "credito": 9008760,
                   "sin_prerrequisito": {"Posición defensiva"},
                   "capitulos": [("03 - *", "Ascendencia/Cultura"), ("05 - *", "Camino heroico"), ("06 - *", "Camino radiante"),
                                 ("07 - *", "Potencia")]},
}
_args = [a for a in sys.argv[1:] if not a.startswith("--")]
LIBRO = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--libro=")), "mistborn")
CFG = LIBROS[LIBRO]
PDF = Path(_args[0]) if _args else RAIZ / "resources" / CFG["pdf"]
SALIDA = RAIZ / "tools" / "fuentes" / CFG["salida"]
MD = RAIZ / "resources" / CFG["md"]
CAPITULOS = CFG["capitulos"]
TIT_SIZE, ROJO = CFG["titulo"]
GLIFOS = {"1": "1", "2": "2", "3": "3", "0": "0", "r": "r", "R": "r", "*": "*", "8": "8"}


def norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower().strip()


def origenes_por_pagina():
    """{(tipo, índice de página del PDF): [(origen, orden)]} según las páginas de cada fichero del Manual (el .md numera desde 1)."""
    out = {}
    for patron, tipo in CAPITULOS:
        d = next(MD.glob(patron))
        for f in sorted(d.glob("*.md")):
            fm = f.read_text(encoding="utf-8")[:700]
            t = re.search(r'title:\s*"(.*?)"', fm).group(1)
            m = re.search(r'pages:\s*"(\d+)-(\d+)"', fm)
            if not m or t.startswith("Cómo"):
                continue
            for pg in range(int(m.group(1)) - 1, int(m.group(2))):
                out.setdefault((tipo, pg), []).append(re.sub(r"\s+ERA\s*\d", "", t).strip())
    return out


def rango_paginas():
    lo = {}
    for patron, tipo in CAPITULOS:
        d = next(MD.glob(patron))
        pgs = []
        for f in d.glob("*.md"):
            m = re.search(r'pages:\s*"(\d+)-(\d+)"', f.read_text(encoding="utf-8")[:700])
            if m:
                pgs += [int(m.group(1)) - 1, int(m.group(2)) - 1]
        lo[tipo] = (min(pgs), max(pgs))
    return lo


def spans_bloque(b):
    return [s for l in b["lines"] for s in l["spans"]]


def texto_bloque(b):
    """Texto de un bloque: líneas unidas, guiones de final de línea resueltos, viñetas ◆ como «◆ »."""
    out = ""
    for l in b["lines"]:
        # los créditos de ilustración (LaskiSans gris, en mayúsculas) a veces caen dentro de un párrafo
        t = "".join(s["text"] if s["font"] != "ZapfDingbatsITC" else "◆" for s in l["spans"]
                    if not (s["color"] == CFG["credito"] or (s["font"].startswith("LaskiSans") and s["text"].strip().isupper())))
        t = re.sub(r"[\t\u2002\u2003]+", " ", t).strip()
        if not t:
            continue
        if out.endswith("-") and t[:1].islower():
            out = out[:-1] + t
        else:
            out += (" " if out else "") + t
    return re.sub(r"\s+", " ", out).strip()


def es_laski(b):
    return all(s["font"].startswith("LaskiSans") for s in spans_bloque(b) if s["text"].strip())


def bloques_ordenados(page):
    mitad = page.rect.width / 2
    bs = [b for b in page.get_text("dict")["blocks"] if b["type"] == 0 and any(s["text"].strip() for s in spans_bloque(b))]
    izq = sorted([b for b in bs if b["bbox"][0] < mitad - 5 and (b["bbox"][2] - b["bbox"][0]) < mitad * 1.2], key=lambda b: (round(b["bbox"][1]), b["bbox"][0]))
    der = sorted([b for b in bs if b not in izq], key=lambda b: (round(b["bbox"][1]), b["bbox"][0]))
    return izq + der


def es_titulo(b):
    ss = [s for s in spans_bloque(b) if s["text"].strip()]
    return bool(ss) and ss[0]["font"].startswith("PlantinMTPro") and abs(ss[0]["size"] - TIT_SIZE) < 0.3 and ss[0]["color"] == ROJO


def es_corte(b):
    """Cabeceras de camino, arte o especialidad (texto grande o blanco sobre fondo): terminan el cuerpo del talento anterior."""
    for s in spans_bloque(b):
        if not s["text"].strip():
            continue
        if s["size"] > TIT_SIZE + 0.4 or s["font"].startswith("PenumbraSans") or (s["color"] == 16777215 and s["size"] >= 9.5):
            return True
    return False


def es_encabezado(b):
    """«Especialidad de X», «Talento principal de X»…: títulos de sección (15,5 pt rojo)."""
    ss = [s for s in spans_bloque(b) if s["text"].strip()]
    return bool(ss) and ss[0]["size"] > TIT_SIZE + 0.4 and ss[0]["color"] == ROJO


def basura(b):
    ss = [s for s in spans_bloque(b) if s["text"].strip()]
    if not ss:
        return True
    t = texto_bloque(b)
    if all(s["font"].startswith("LaskiSans") for s in ss):  # cartas del árbol, créditos de ilustración
        return True
    if "" in t or re.search(r"Prerrequisitos?:", t):  # carta resumen del capítulo 2 (texto Plantin con el glifo del icono)
        return True
    if re.match(r"^(Capítulo \d+: .*|\d{1,3})$", t) or all(s["color"] == ROJO and s["size"] <= 10 for s in ss) and len(t) < 45:
        return True
    return False


def glifo(bs, i, j):
    """Glifo de activación: primer span CosmereDingbats tras «Activación:»."""
    for b in bs[i:j]:
        for s in spans_bloque(b):
            if s["font"].startswith("CosmereDingbats") and s["text"].strip():
                return GLIFOS.get(s["text"].strip()[:1], s["text"].strip()[:1])
    return None


def talentos_pagina_secuencia(paginas):
    """Recorre las páginas en orden y devuelve los talentos descritos (con «Activación»)."""
    out, esp = [], ""
    seq = []   # [(pagina, bloque)]
    for pg, page in paginas:
        for b in bloques_ordenados(page):
            seq.append((pg, b))
    k = 0
    while k < len(seq):
        pg, b = seq[k]
        t = texto_bloque(b)
        if es_encabezado(b):
            m = re.match(r"^Especialidad de (.+?)(?:\s+ERA\s*\d)?$", t)
            esp = m.group(1).strip() if m else ("Principal" if t.startswith("Talento principal") else esp)
            k += 1
            continue
        if es_titulo(b):
            # ¿le sigue «Prerrequisito:»? (en el mismo bloque o en el siguiente)
            j = k
            cabecera = []
            while j < len(seq) and j < k + 4:
                cabecera.append(texto_bloque(seq[j][1]))
                if "Activación:" in cabecera[-1] or (j > k and not seq[j][1]["lines"]):
                    break
                j += 1
            junto = " ".join(cabecera)
            if "Prerrequisito" not in junto:
                k += 1
                continue
            if "Activación:" not in junto:
                k += 1  # carta resumen o aparición sin descripción
                continue
            fin_cab = j
            titulo_b = spans_bloque(b)
            tit = "".join(s["text"] for s in titulo_b if abs(s["size"] - TIT_SIZE) < 0.3 and s["color"] == ROJO).strip()
            tit = re.sub(r"\s+ERA\s*\d\s*$", "", re.sub(r"\s+", " ", tit))
            # el título puede partirse: «Posición vigilante (principal de» / «Guerrero)»
            m = re.search(r"Prerrequisitos?:\s*(.*?)\s*Activaci[oó]n:\s*(\S*)", junto)
            # si el título es solo la primera línea, lo que queda tras él en el bloque antes de «Prerrequisito» es su continuación
            antes = junto.split("Prerrequisito")[0].strip()
            tit = re.sub(r"\s+", " ", antes if antes and len(antes) < 90 else tit)
            tit = re.sub(r"\s+ERA\s*\d\s*$", "", tit).strip()
            prerreq = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""
            act = glifo([x[1] for x in seq], k, fin_cab + 1)
            # cuerpo: hasta el siguiente título / encabezado
            tema, mec = [], []
            j = fin_cab + 1
            while j < len(seq):
                bj = seq[j][1]
                if es_titulo(bj) or es_encabezado(bj) or es_corte(bj):
                    break
                if es_laski(bj) or basura(bj):
                    j += 1
                    continue
                ss = [s for s in spans_bloque(bj) if s["text"].strip()]
                tj = texto_bloque(bj)
                cursiva = all("Italic" in s["font"] for s in ss)
                destino = tema if (cursiva and not mec) else mec
                if destino and destino[-1] and not re.search(r"[.:;!?)”»…]$", destino[-1]) and not tj.startswith("◆"):
                    destino[-1] += " " + tj    # párrafo partido por el salto de columna o de página
                else:
                    destino.append(tj)
                j += 1
            out.append({"pagina": pg, "titulo": tit, "prerreq": prerreq, "activacion": act, "especialidad": esp, "tema": tema, "mecanica": mec})
            k = j
            continue
        k += 1
    return out


def _linea_texto(l):
    """Texto de una línea, sin créditos de ilustración, con las viñetas ◆."""
    t = "".join(s["text"] if s["font"] != "ZapfDingbatsITC" else "◆" for s in l["spans"]
                if not (s["color"] == CFG["credito"] or (s["font"].startswith("LaskiSans") and s["text"].strip().isupper())))
    return re.sub(r"\s+", " ", re.sub(r"[	  ]+", " ", t)).strip()


def _une(a, b):
    """Une dos trozos de un párrafo; resuelve el guion de final de línea («impor-» + «tante»)."""
    if a.endswith("-") and b[:1].islower():
        return a[:-1] + b
    return a + " " + b


def lineas_pagina(pg, page):
    """Líneas de la página en orden de lectura de dos columnas, con su estilo."""
    out = []
    for bi, b in enumerate(bloques_ordenados(page)):
        for l in b["lines"]:
            ss = [s for s in l["spans"] if s["text"].strip()]
            if not ss:
                continue
            t = _linea_texto(l)
            out.append({
                "pg": pg, "bi": (pg, bi), "bbox": l["bbox"], "texto": t, "spans": l["spans"],
                "titulo": ss[0]["font"].startswith("PlantinMTPro") and abs(ss[0]["size"] - TIT_SIZE) < 0.3 and ss[0]["color"] == ROJO,
                "encab": ss[0]["size"] > TIT_SIZE + 0.4 and ss[0]["color"] == ROJO,
                "corte": any(s["size"] > TIT_SIZE + 0.4 or s["font"].startswith("PenumbraSans") or (s["color"] == 16777215 and s["size"] >= 9.5)
                             for s in ss),
                # cartas del árbol y créditos: LaskiSans pequeña (8-8,5 pt); la de 9 pt es texto de acciones del propio talento
                "laski": all(s["font"].startswith("LaskiSans") and s["size"] <= 8.6 for s in ss),
                "cursiva": all("Italic" in s["font"] for s in ss),
                "basura": (bool(re.match(r"^(Capítulo \d+: .*|\d{1,3})$", t)) or "" in t or not t),
            })
    return out


def talentos_por_lineas(paginas):
    """Igual que talentos_pagina_secuencia pero a nivel de línea: en el Manual de Stormlight un bloque puede juntar el final de un talento
    y el título del siguiente."""
    L = []
    for pg, page in paginas:
        L += lineas_pagina(pg, page)
    out, esp, i = [], "", 0
    while i < len(L):
        l = L[i]
        if l["encab"] and not l["titulo"]:
            m = re.match(r"^Especialidad de (.+?)(?:\s+ERA\s*\d)?$", l["texto"])
            esp = m.group(1).strip() if m else ("Principal" if l["texto"].startswith("Talento principal") else esp)
            i += 1
            continue
        if not l["titulo"] or l["laski"]:
            i += 1
            continue
        # título (puede ocupar varias líneas)
        j = i
        tit = []
        while j < len(L) and L[j]["titulo"] and len(tit) < 3:
            tit.append("".join(s["text"] for s in L[j]["spans"] if abs(s["size"] - TIT_SIZE) < 0.3 and s["color"] == ROJO).strip())
            j += 1
        # cabecera: «Prerrequisito: … Activación: X» en las líneas siguientes
        k = j
        cab = []
        while k < len(L) and k < j + 7:
            cab.append(L[k])
            if "Activación:" in L[k]["texto"]:
                break
            k += 1
        junto = " ".join(x["texto"] for x in cab)
        sin_pre = " ".join(tit) in CFG.get("sin_prerrequisito", ())   # erratas del libro: la descripción larga omite la línea «Prerrequisito»
        if "Activación:" not in junto or ("Prerrequisito" not in junto and not sin_pre):
            i = j  # carta resumen, acción de un poder o título suelto
            continue
        m = re.search(r"Prerrequisitos?:\s*(.*?)\s*Activaci[oó]n:", junto)
        prerreq = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""
        act = None
        for x in cab:
            for s in x["spans"]:
                if s["font"].startswith("CosmereDingbats") and s["text"].strip():
                    act = GLIFOS.get(s["text"].strip()[:1], s["text"].strip()[:1])
        titulo = re.sub(r"\s+ERA\s*\d\s*$", "", re.sub(r"\s+", " ", " ".join(tit))).strip()
        # cuerpo
        tema, mec = [], []
        prev = None
        n = k + 1
        while n < len(L):
            x = L[n]
            if x["titulo"] or x["encab"] or x["corte"]:
                break
            n += 1
            if x["laski"] or x["basura"]:
                continue
            nuevo_parrafo = (prev is None or x["bi"] != prev["bi"] or x["bbox"][1] - prev["bbox"][3] > 2.2 or x["texto"].startswith("◆"))
            cursiva = x["cursiva"]
            destino = tema if (cursiva and not mec) else mec
            if not nuevo_parrafo and destino:
                destino[-1] = _une(destino[-1], x["texto"])
            elif destino and not re.search(r"[.:;!?)”»…]$", destino[-1]) and not x["texto"].startswith("◆") and prev is not None                     and (prev["cursiva"] == cursiva) and x["bi"] != prev["bi"]:
                destino[-1] = _une(destino[-1], x["texto"])       # párrafo partido por el salto de columna o de página
            else:
                destino.append(x["texto"])
            prev = x
        out.append({"pagina": L[i]["pg"], "titulo": titulo, "prerreq": prerreq, "activacion": act, "especialidad": esp,
                    "tema": tema, "mecanica": mec})
        i = n
    return out


def cartas(page):
    """Cartas resumen de la página: [(título, prerrequisito, texto)] (rectángulo blanco con texto LaskiSans: título en negrita,
    prerrequisito en cursiva y el resto, el resumen)."""
    spans = [(s, l) for blk in page.get_text("dict")["blocks"] if blk["type"] == 0 for l in blk["lines"] for s in l["spans"] if s["text"].strip()]
    res = []
    for d in page.get_drawings():
        if d["type"] != "f" or not d.get("fill") or tuple(round(c, 2) for c in d["fill"]) != (1.0, 1.0, 1.0):
            continue
        r = d["rect"]
        if r.width < 60 or r.height < 25 or r.width > 400:
            continue
        dentro = [s for s, _ in spans if r.x0 - 1 <= s["bbox"][0] and s["bbox"][2] <= r.x1 + 1 and r.y0 - 1 <= s["bbox"][1] and s["bbox"][3] <= r.y1 + 1]
        if not dentro:
            continue
        dentro.sort(key=lambda s: (round(s["bbox"][1]), s["bbox"][0]))
        tit = " ".join(s["text"].strip() for s in dentro if "Bold" in s["font"] and s["font"].startswith("LaskiSans"))
        pre = " ".join(s["text"].strip() for s in dentro if "Italic" in s["font"])
        y_tit = max([s["bbox"][3] for s in dentro if "Bold" in s["font"] and s["font"].startswith("LaskiSans")] or [0])
        # el texto de la carta, con los iconos de acción que lleva en línea (fuente CosmereDingbats: «1», «2», «r»…) tras el título
        cuerpo = " ".join(s["text"].strip() for s in dentro
                          if (s["font"].startswith("LaskiSans") and "Bold" not in s["font"] and "Italic" not in s["font"])
                          or (s["font"].startswith("CosmereDingbats") and s["bbox"][1] > y_tit - 1 and re.fullmatch(r"[0-9rRCO*8]", s["text"].strip())))
        cuerpo = re.sub(r"(?<=[a-záéíóúñ])-\s+(?=[a-záéíóúñ])", "", re.sub(r"\s+", " ", cuerpo)).strip()
        if tit:
            res.append((re.sub(r"\s+", " ", re.sub(r"^[^\wÁÉÍÓÚÑ¡¿]+", "", tit)).strip(), pre, cuerpo))
    return res


def main():
    doc = pymupdf.open(str(PDF))
    rangos = rango_paginas()
    pag_origen = origenes_por_pagina()
    todos = []
    for patron, tipo in CAPITULOS:
        a, b = rangos[tipo]
        paginas = [(i, doc[i]) for i in range(a, b + 1)]
        for t in talentos_por_lineas(paginas):
            t["tipo"] = tipo
            t["origenes"] = sorted(set(pag_origen.get((tipo, t["pagina"]), [])))
            todos.append(t)
    # cartas resumen: por (tipo, origen, título); la carta está en las páginas del árbol, no en las de la descripción
    cartas_por = {}
    for patron, tipo in CAPITULOS:
        a, b = rangos[tipo]
        for i in range(a, b + 1):
            for tit, pre, txt in cartas(doc[i]):
                for o in pag_origen.get((tipo, i), []):
                    cartas_por.setdefault((tipo, o, norm(re.sub(r"\s*\(.*?\)", "", tit))), (tit, pre, txt))
    for t in todos:
        clave = norm(re.sub(r"\s*\(.*?\)", "", t["titulo"]))
        c = next((cartas_por[(t["tipo"], o, clave)] for o in t["origenes"] if (t["tipo"], o, clave) in cartas_por), None)
        t["resumen"] = c[2] if c else ""
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(json.dumps({"fuente": PDF.name, "talentos": todos}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(todos)} talentos -> {SALIDA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
