"""Stormlight: árbol de talentos de la ascendencia cantora (Manual, capítulo 2).

Son 8 talentos: Cambiar de forma (principal) y siete que dan formas de cantor. Se añaden antes de link_talents() y de los efectos,
con la forma de un talento de ascendencia de Mistborn (f.origen «Ascendencia cantora», x.req, resumen/mecánica), para que el
árbol, los prerrequisitos y los modificadores del personaje salgan por el mismo camino que los demás.

El PDF dejó el texto a doble columna con párrafos cortados y bloques fuera de sitio, y la tarjeta resumen de cada forma («Forma
artística: Discernimiento +1, …») separada de su descripción larga. Cada forma declara por qué párrafo empieza cada pieza.
"""
import re
import unicodedata

from buscador_stormlight_objetos import _unir

AMBIENTACION = "Stormlight"
LIBRO = "Manual Stormlight"
ORIGEN = "Ascendencia cantora"
RUTA = ["Capítulo 2 · Orígenes", "Ascendencia"]
ARCHIVO = "03 - Capítulo 2 Orígenes/02 - Ascendencia.md"

# forma -> párrafos de su descripción larga (por el comienzo; las frases partidas por columna ya vienen unidas)
FORMAS = {
    "Forma gris": ["Forma gris. Tu forma no está especializada"],
    "Forma carnal": ["Forma carnal. Te has vinculado con un vidaspren"],
    "Forma artística": ["La forma artística se especializa", "Te has vinculado a un creacionspren", "Además, obtienes una ventaja en las pruebas de Manufactura"],
    "Forma diestra": ["La forma diestra se especializa", "Te has vinculado a un vientospren"],
    "Forma de guerra": ["La forma de guerra se especializa", "Te has vinculado a un dolorspren", "Además, cuando te mueves, puedes saltar"],
    "Forma de trabajo": ["La forma de trabajo se especializa", "Te has vinculado a un gravitacionspren", "Además, puedes camuflarte"],
    "Forma de mediación": ["La forma de mediación se especializa", "Te has vinculado a un unespren", "Además, no tienes que gastar concentración"],
    "Forma sabia": ["La forma sabia se especializa", "Te has unido a un logispren", "Además, cuando adoptas esta forma", "Si obtienes el talento Ilustración"],
    "Forma funesta": ["Forma funesta se especializa", "Te has unido a un desalmaspren", "Además, cuando un personaje desencadena una Acometida"],
    "Forma tormenta": ["Forma tormenta es una forma de batalla", "Te has unido a un tormentaspren", "Además, puedes usar Desatar rayos", "2 Desatar rayos."],
    "Forma emisaria": ["La forma emisaria es una forma embellecida", "Te has vinculado a un fanatispren", "Además, obtienes una ventaja en las pruebas de Perspicacia"],
    "Forma comunicadora": ["La forma comunicadora otorga velocidad", "Te has vinculado a un prisaspren", "Además, cuando realizas una prueba de Agilidad"],
    "Forma pútrida": ["La enigmática forma pútrida", "Te has unido a un desgracispren", "* Toque putrefacto."],
    "Forma nocturna": ["La forma nocturna otorga visiones", "Te has vinculado a un nochespren", "r Premoniciones interpuestas.", "* Premoniciones esporádicas."],
}

# talento: (prerrequisito, habilidad, grados, activación, párrafo temático, formas, párrafos de la tarjeta resumen)
TALENTOS = [
    ("Cambiar de forma (principal de cantor)", "ascendencia cantora", "", None, "3 acciones",
     ["Aprendes a vincularte con un spren durante las altas tormentas"],
     ["Cuando adquieres este talento, comienzas con dos formas", "Forma gris", "Forma carnal",
      "Si te encuentras al aire libre durante una alta tormenta", "Mientras estás en una forma concreta"],
     ["Durante una alta tormenta, puedes cambiar a forma gris"]),
    ("Formas de delicadeza", "talento principal Cambiar de forma", "", None, "Siempre activo",
     ["Obtienes dos nuevas formas de cantor (forma artística"], ["Forma artística", "Forma diestra"],
     ["Obtienes forma artística y forma diestra", "Forma diestra: Velocidad +1"]),
    ("Formas de determinación", "talento principal Cambiar de forma", "", None, "Siempre activo",
     ["Obtienes dos nuevas formas de cantor (forma de guerra"], ["Forma de guerra", "Forma de trabajo"],
     ["Obtienes forma de guerra y forma de trabajo", "Forma de guerra: Fuerza +1", "Forma de trabajo: Voluntad +1"]),
    ("Formas de sabiduría", "talento principal Cambiar de forma", "", None, "Siempre activo",
     ["Obtienes dos nuevas formas de cantor (forma de mediación"], ["Forma de mediación", "Forma sabia"],
     ["Obtienes forma de mediación y forma sabia", "Forma sabia: Intelecto +1"]),
    ("Mente ambiciosa", "Disciplina 3 o superior, y el talento Formas de delicadeza, Formas de determinación o Formas de sabiduría",
     "Disciplina", 3, "Siempre activo",
     ["Tu creciente sed de poder te predispone", "Aunque todavía no te has unido a un vacíospren", "Mientras estás unido a un vacíospren, te vuelves vulnerable"],
     [], ["Aumenta tu Defensa cognitiva en 2. Puedes vincularte"]),
    ("Formas de destrucción", "talento Mente ambiciosa", "", None, "Siempre activo",
     ["Obtienes dos nuevas formas de cantor (forma funesta"], ["Forma funesta", "Forma tormenta"],
     ["Obtienes forma funesta y forma tormenta", "Forma tormenta: Fuerza +1"]),
    ("Formas de expansión", "talento Mente ambiciosa", "", None, "Siempre activo",
     ["Obtienes dos nuevas formas de cantor (forma emisaria"], ["Forma emisaria", "Forma comunicadora"],
     ["Obtienes forma emisaria y forma comunicadora", "Forma comunicadora: Velocidad +2"]),
    ("Formas de misterio", "talento Mente ambiciosa", "", None, "Siempre activo",
     ["Obtienes dos nuevas formas de cantor (forma pútrida"], ["Forma pútrida", "Forma nocturna"],
     ["Obtienes forma pútrida y forma nocturna", "Forma nocturna: Discernimiento +1"]),
]

# recuadros laterales que se cuelgan del talento al que explican: título -> (talento, comienzo del párrafo)
NOTAS = [
    ("Cambiar de forma (principal de cantor)", "Consejo de reglas: acciones y reacciones", "Algunas formas de poder otorgan acciones"),
    ("Mente ambiciosa", "Los vacíospren y las formas de poder", "Mientras que la mayoría de los spren que se vinculan"),
]


def _norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower()


def _slug(s):
    return re.sub(r"[^a-z0-9]+", "-", _norm(s)).strip("-")[:70] or "x"


def _textos(resources):
    txt = (resources / "Manual del Archivo de las Tormentas" / ARCHIVO).read_text(encoding="utf-8")
    txt = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\xad]", "", txt)
    m = re.match(r"---\n(.*?)\n---\n", txt, re.S)
    txt = txt[m.end():] if m else txt
    out = []
    for bloque in re.split(r"\n\s*\n", txt):
        bloque = " ".join(bloque.split())
        if not bloque or bloque.startswith("#"):
            continue
        if re.match(r"^Capítulo \d+: ", bloque) or (bloque.upper() == bloque and len(bloque) < 60) or bloque.startswith("icono significado"):
            continue
        if re.match(r"^1 1 acción 2 2 acciones", bloque):
            continue
        out.append(bloque)
    # la línea «Prerrequisito: … Activación: X» ya va en los campos del talento: fuera del párrafo
    sueltos = []
    for t in _unir(out):
        t = re.sub(r"^Prerrequisitos?:.{0,200}?Activación:\s*\S+\s+(?=\S)", "", t)
        t = re.sub(r"^Prerrequisito: (?:ascendencia cantora|Disciplina 3 o superior) (?=[A-ZÁÉÍÓÚ])", "", t)  # tarjeta del árbol
        sueltos += re.split(r"(?<=\.) (?=Forma carnal\. )", t)  # forma gris y forma carnal quedaron en un solo párrafo
    return sueltos


def _toma(textos, prefijo, donde, usados=None):
    for t in textos:
        if t.startswith(prefijo) and (usados is None or t not in usados):
            if usados is not None:
                usados.append(t)
            return t
    raise ValueError(f"Stormlight cantor: falta el párrafo «{prefijo}» ({donde}); ¿cambió el libro?")


def _bien(t):
    """Negrita en el rótulo del libro («Forma gris.», «Desatar rayos.») y símbolos de coste de acción en texto."""
    t = re.sub(r"^(?:\*|r|\d) ([A-ZÁÉÍÓÚ][^.]{2,40})\. ", lambda m: "**" + m.group(1) + ".** ", t)
    return re.sub(r"^(Forma (?:gris|carnal))\. ", r"**\1.** ", t)


def _resumen(t):
    """La tarjeta del árbol junta «Obtienes forma X y forma Y» con la primera forma: cada forma, en su línea."""
    return re.sub(r"^(Obtienes forma [^:\n]*?)\.? (Forma [a-záéíóú ]+:)", r"\1.\n\2", t)


def talentos(resources):
    textos = _textos(resources)
    out = []
    for titulo, prereq, habilidad, grados, activ, tema, formas, resumen in TALENTOS:
        usados = []
        cuerpo = "\n\n".join(_toma(textos, p, titulo) for p in tema)
        mec = []
        for f in formas:
            if f in FORMAS:
                sub = "\n\n".join(_bien(_toma(textos, p, f)) for p in FORMAS[f])
                # gris y carnal son líneas de la lista inicial de Cambiar de forma; las demás, secciones propias
                mec.append(sub if f in ("Forma gris", "Forma carnal") else "#### " + f + "\n" + sub)
            else:
                mec.append(_toma(textos, f, titulo))
        for t_nota, enc, ini_nota in NOTAS:
            if t_nota == titulo:
                mec.append("#### " + enc + "\n" + _toma(textos, ini_nota, titulo))
        card = []
        for p in resumen:
            for t in textos:
                if t.startswith(p):
                    if not any(t in c or c in t for c in card):
                        card.append(t)
                    break
            else:
                raise ValueError(f"Stormlight cantor: falta la tarjeta «{p}» ({titulo})")
        e = {
            "cat": "talento", "title": titulo, "path": list(RUTA), "pages": "37-45", "body": cuerpo,
            "mecanica": "\n\n".join(mec), "resumen": _resumen("\n".join(card)),
            "id": "talento-" + _slug(titulo), "ambientacion": AMBIENTACION, "libro": LIBRO,
            "f": {"origen": ORIGEN, "tipo_origen": "Ascendencia/Cultura",
                  "especialidad": "Principal" if "(principal" in titulo else "", "especialidades": [],
                  "prerrequisito": prereq, "habilidad": habilidad, "grados": grados, "activacion": activ},
        }
        out.append(e)
    return out
