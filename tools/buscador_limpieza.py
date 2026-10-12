"""Limpieza del texto de las microrreglas: tablas del libro y restos de maquetación del PDF.

- Tablas: el PDF entrega las tablas como párrafos sueltos. `tools/reglas/tablas/tablas.json` las sustituye por tablas «| a | b |»
  (la interfaz las pinta como tabla). Cada entrada indica la regla, el texto con el que empieza la tabla (`desde`), lo que sigue
  (`hasta`: un texto, o «<FIN>» para llegar al final) y el markdown (`md`). Si no se da `hasta`, la tabla acaba en el siguiente
  encabezado, nota con * o párrafo largo.
- Restos: créditos de ilustradores y pies de foto en MAYÚSCULAS, «ARRIBA:/ABAJO:», pies de página «Capítulo N: …» y párrafos partidos
  por el salto de columna (se unen a su continuación).
"""
import json
import re
from pathlib import Path

TABLAS = Path(__file__).parent / "reglas" / "tablas" / "tablas.json"
FORMATO = Path(__file__).parent / "reglas" / "formato"
MAY = "A-ZÁÉÍÓÚÑÜÖÄ"
RE_MAYUS = re.compile(rf"\b[{MAY}]{{3,}}(?:[  ]+[{MAY}“”«»'’]{{2,}}){{1,7}}\b")
RE_POS = re.compile(rf"(?:ARRIBA|ABAJO|IZQUIERDA|DERECHA)\s*:\s*[{MAY} ]+;?")
RE_PIE = re.compile(r"\s*Capítulo \d+: [^\n]{3,45}? \d{1,3}(?=\s*(?:\n|$))")
PERMITIDAS = ("ERA ", "PNJ", "FUE ", "DEF ", "VEL ", "INT ", "VOL ", "DIS ", "PRE ")


def aplicar_tablas(titulo, cuerpo, tablas):
    for t in tablas:
        if t["titulo"] != titulo:
            continue
        if "buscar" in t:  # corrección de texto puntual
            if t["buscar"] not in cuerpo:
                raise ValueError(f"texto a corregir no encontrado en «{titulo}»: {t['buscar'][:50]!r}")
            cuerpo = cuerpo.replace(t["buscar"], t["por"], 1)
            continue
        i = cuerpo.find(t["desde"])
        if i < 0:
            raise ValueError(f"tabla no encontrada en «{titulo}»: {t['desde'][:50]!r}")
        resto = i + len(t["desde"])
        if t.get("hasta") == "<FIN>":
            j = len(cuerpo)
        elif t.get("hasta"):
            j = cuerpo.find(t["hasta"], resto)
            if j < 0:
                raise ValueError(f"fin de tabla no encontrado en «{titulo}»: {t['hasta'][:50]!r}")
        else:
            j = len(cuerpo)
            pos = resto
            for p in re.finditer(r"\n\n([^\n].*?)(?=\n\n|$)", cuerpo[resto:], flags=re.S):
                txt = p.group(1)
                if txt.startswith("####") or txt.startswith("*") or len(txt) > 260:
                    j = resto + p.start()
                    break
                pos = resto + p.end()
            else:
                j = pos
        previo = cuerpo[:i]
        sep = "\n\n" if (not previo or previo.endswith("\n")) else " "  # `desde` a mitad de párrafo: sigue la frase
        cuerpo = previo.rstrip("\n") + sep + t["md"].strip("\n") + "\n\n" + cuerpo[j:].lstrip("\n")
    return cuerpo.strip("\n")


def _une_parrafos(cuerpo):
    partes = re.split(r"\n\n+", cuerpo)
    out = []
    for p in partes:
        prev = out[-1] if out else ""
        ultima = prev.split("\n")[-1]  # un párrafo puede empezar por su subtítulo: cuenta la última línea
        sigue = p and out and not ultima.startswith(("|", "#")) and not re.search(r"[.:;!?”»)\]*]$", prev)
        minus = re.match(r"[a-záéíóúñ(“¿¡]", p) and not p.startswith("(Era") and (not prev.startswith("◆") or p.startswith("("))
        # frase cortada por el salto de columna: el párrafo (o el punto de lista) acaba en palabra, coma o cifra
        cortada = re.search(r"[a-záéíóúñ0-9,]$", prev) and (len(ultima) >= 50 or ultima.startswith("◆")) and not re.match(r"\d+ \+ ", ultima) \
            and re.match(r"[A-ZÁÉÍÓÚÑa-záéíóúñ0-9(“¿¡]", p) and not p.startswith("(Era")
        if sigue and (minus or cortada):
            out[-1] = prev + " " + p
        else:
            out.append(p)
    return "\n\n".join(out)


def _une_listas(cuerpo):
    """Los puntos de lista seguidos (◆) forman una sola lista, sin línea en blanco entre ellos."""
    cuerpo = re.sub(r"(?m)^◆(?=\S)", "◆ ", cuerpo)
    return re.sub(r"(?m)^(◆[^\n]*)\n\n(?=◆)", r"\1\n", cuerpo)


def limpia(cuerpo):
    lineas = []
    for l in cuerpo.split("\n"):
        if not l.startswith("|"):
            # el PDF convierte en encabezado el arranque de párrafos con símbolo de era: vuelve a ser texto
            if l.startswith("#### ") and re.search(r"ERA\s*[12]", l):
                l = l[5:]
            m = re.fullmatch(r"#### Era ([12])\s*", l)
            if m:  # etiqueta de era de un poder, suelta como encabezado
                l = f"Disponible solo en la Era {m.group(1)}."
            if l.strip() == "Introducción" or re.match(r"### [^#]", l):  # cabecera de página y pies de ilustración
                continue
            l = RE_PIE.sub("", l)
            if not l.startswith("#"):
                l = RE_POS.sub("", l)
                l = RE_MAYUS.sub(lambda m: m.group(0) if m.group(0).startswith(PERMITIDAS) else "", l)
                l = re.sub(r"(?<=[a-záéíóúñ])- (?=[a-záéíóúñ])", "", l)  # palabras partidas por guion a final de línea
            l = re.sub(r"\s*\bERA\s*([12])\b(\s*\.)?", lambda m: f" (Era {m.group(1)})" + ("." if m.group(2) else ""), l)
            l = re.sub(r"\) ([,.;:])", r")\1", l)
            l = re.sub(r"[ \t]{2,}", " ", l).strip()
        lineas.append(l)
    cuerpo = "\n".join(lineas)
    cuerpo = re.sub(r"\n{3,}", "\n\n", cuerpo)
    return _une_listas(_une_parrafos(cuerpo)).strip()


def cargar_tablas():
    return json.loads(TABLAS.read_text(encoding="utf-8")) if TABLAS.exists() else []


def cargar_formato():
    """Correcciones de formato, un fichero por tema en `tools/reglas/formato/`."""
    return [f for p in sorted(FORMATO.glob("*.json")) for f in json.loads(p.read_text(encoding="utf-8"))]


def _definiciones(titulo, cuerpo, terminos, como_lista=False):
    """Separa en párrafos las listas de definiciones que el PDF junta en uno («Rango. … Rol. … Tamaño. …»): cada término pasa a
    empezar párrafo, en negrita. Los términos se buscan en orden, al principio de párrafo o tras un fin de frase. Un término que
    acaba en «:», «?» o «!» se busca tal cual; si no, seguido de punto. Con `como_lista`, cada término empieza un punto de lista."""
    pos = 0
    for t in terminos:
        punto = "" if t[-1] in "?!:" else "."  # «¿Quién es usted? Si un personaje…», «Armas: dos armas ligeras»
        m = re.compile(r"(?:^|(?<=[.!?”)»:] ))(?:◆\s*)?" + re.escape(t + punto) + " ", re.M).search(cuerpo, pos)
        if not m:
            raise ValueError(f"definición no encontrada en «{titulo}»: {t!r}")
        lista = como_lista or cuerpo[m.start():m.end()].startswith("◆")
        nuevo = ("◆ " if lista else "") + "**" + t + punto + "** "
        antes = cuerpo[:m.start()].rstrip(" ")
        sep = "" if (not antes or antes.endswith("\n")) else ("\n" if lista else "\n\n")
        cuerpo = antes + sep + nuevo + cuerpo[m.end():]
        pos = len(antes) + len(sep) + len(nuevo)
    return cuerpo


def aplicar_formato(titulo, cuerpo, formato):
    """Correcciones de formato de una microrregla ya limpia (`tools/reglas/formato/<tema>.json`): `cambios` es una lista de
    [texto, sustituto], [desde, hasta, sustituto] o [desde, hasta, ancla, "antes"|"despues"] (recolocar fragmentos, partir párrafos, añadir subtítulos) y `definiciones`, una lista de términos que
    empiezan párrafo en negrita (o punto de lista, con `"lista": true`)."""
    for f in formato:
        if f["titulo"] != titulo:
            continue
        for c in f.get("cambios", []):
            i = cuerpo.find(c[0])
            if i < 0:
                raise ValueError(f"texto a corregir no encontrado en «{titulo}»: {c[0][:60]!r}")
            if len(c) == 2:  # [texto, sustituto]
                cuerpo = cuerpo[:i] + c[1] + cuerpo[i + len(c[0]):]
                continue
            j = cuerpo.find(c[1], i)
            if j < 0:
                raise ValueError(f"fin del tramo no encontrado en «{titulo}»: {c[1][:60]!r}")
            j += len(c[1])
            if len(c) == 3:  # [desde, hasta (incluido), sustituto]: para tramos largos
                cuerpo = cuerpo[:i] + c[2] + cuerpo[j:]
                continue
            # [desde, hasta, ancla, "antes"|"despues"]: mueve el tramo (como párrafos) junto a la ancla; "^" es el principio
            tramo = cuerpo[i:j].strip("\n")
            cuerpo = (cuerpo[:i].rstrip("\n") + "\n\n" + cuerpo[j:].lstrip("\n")).strip("\n")
            if c[2] == "^":
                k = 0
            else:
                k = cuerpo.find(c[2])
                if k < 0:
                    raise ValueError(f"ancla no encontrada en «{titulo}»: {c[2][:60]!r}")
                if c[3] == "despues":
                    k += len(c[2])
            cuerpo = (cuerpo[:k].rstrip("\n") + "\n\n" + tramo + "\n\n" + cuerpo[k:].lstrip("\n")).strip("\n")
        if f.get("definiciones"):
            cuerpo = _definiciones(titulo, cuerpo, f["definiciones"], f.get("lista", False))
    return _une_listas(re.sub(r"\n{3,}", "\n\n", cuerpo)).strip()
