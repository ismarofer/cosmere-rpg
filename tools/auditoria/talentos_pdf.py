"""Auditoría: talentos del PDF (texto limpio por páginas, sin la mezcla de columnas del .md) para compararlos con los datos."""
import re
import unicodedata
import pymupdf

ICONOS = {"8": "Siempre activo", "r": "Reacción", "R": "Reacción", "*": "Especial", "0": "Acción gratuita",
          "1": "1 acción", "2": "2 acciones", "3": "3 acciones"}


def norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower().strip()


def _texto_ordenado(page):
    """Texto de la página en orden de lectura de dos columnas (el flujo del PDF no siempre lo respeta)."""
    mitad = page.rect.width / 2
    bloques = [b for b in page.get_text("blocks") if b[6] == 0 and b[4].strip()]
    izq = sorted([b for b in bloques if b[0] < mitad - 5 and (b[2] - b[0]) < mitad * 1.2], key=lambda b: (round(b[1]), b[0]))
    der = sorted([b for b in bloques if b not in izq], key=lambda b: (round(b[1]), b[0]))
    return "\n".join(b[4].rstrip() for b in izq + der)


def paginas(pdf, a, b):
    d = pymupdf.open(pdf)
    return [(i, _texto_ordenado(d[i])) for i in range(a, b)]


def talentos(paginas_txt):
    """[{titulo, prerreq, activacion, cuerpo, seccion, especialidad, pagina}] en orden del libro."""
    lineas = []
    for i, t in paginas_txt:
        for l in t.splitlines():
            l = l.strip()
            if not l or re.match(r"^(Capítulo \d+: .*|\d{1,3})$", l):
                continue
            lineas.append((i, l))
    out = []
    seccion = esp = ""
    k = 0
    while k < len(lineas):
        pg, l = lineas[k]
        m = re.match(r"^Especialidad de (.+?)(?:\s+ERA\s*\d)?$", l)
        if m:
            esp = m.group(1).strip()
        if re.match(r"^Talento principal de ", l):
            esp = "Principal"
        if k + 1 < len(lineas) and re.match(r"^Prerrequisitos?:", lineas[k + 1][1]) and len(l) < 80 and not l.startswith("Prerrequisito"):
            # bloque de talento: título, prerrequisito (puede ocupar varias líneas) y «Activación: X»
            titulo = re.sub(r"\s*ERA\s*[12]\s*$", "", l).strip()
            j = k + 1
            pre = []
            act = None
            while j < len(lineas) and j < k + 8:
                t = lineas[j][1]
                ma = re.search(r"Activaci[oó]n:\s*(\S+)\s*$", t)
                if ma:
                    pre.append(t[:ma.start()].strip())
                    act = ma.group(1)
                    j += 1
                    break
                pre.append(t)
                j += 1
            cuerpo = []
            while j < len(lineas):
                t = lineas[j][1]
                if j + 1 < len(lineas) and re.match(r"^Prerrequisitos?:", lineas[j + 1][1]) and len(t) < 80:
                    break
                if re.match(r"^Especialidad de ", t) or re.match(r"^Talento principal de ", t):
                    break
                cuerpo.append(t)
                j += 1
            p = " ".join(pre)
            p = re.sub(r"^Prerrequisitos?:\s*", "", p).replace("- ", "-") if False else re.sub(r"^Prerrequisitos?:\s*", "", p)
            if act is not None:  # sin «Activación» es una carta resumen del árbol, no la descripción
                out.append({"titulo": titulo, "prerreq": re.sub(r"\s+", " ", p).strip(), "activacion": act, "cuerpo": " ".join(cuerpo),
                            "especialidad": esp, "pagina": pg})
            k = j
            continue
        k += 1
    return out
