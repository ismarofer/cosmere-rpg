"""Limpieza de la Guía del Mundo de Scadrial: tablas, restos de maquetación del PDF y glosario.

El PDF entrega cada tabla como párrafos sueltos (una fila por párrafo, a veces partida) y deja pies de ilustración, créditos
de artista, citas y rótulos de mapa mezclados con el texto. `limpia_guia` los convierte o los quita; `glosario` saca los
términos del Apéndice A como filas (término, pronunciación, traducción)."""
import re

RANGO = re.compile(r"^(\d+(?: o \d+)?(?: o más)?)\s+(.+)$", re.S)
BONIF = re.compile(r"^(.*?)\s*((?:Una|Dos|Tres) ventajas?)$", re.S)
VENTAJA = re.compile(r"(?:Una|Dos|Tres) ventajas?")
MARCAS = "“‘¡¿\"«"

ESQUIRLAS = [
    ("Ambición*", "Uli Da", "Treno"), ("Autonomía", "Bavadin", "Taldain"), ("Capricho", "Desconocido", "Desconocido"),
    ("Conservación†", "Leras", "Scadrial"), ("Cultivación", "Koravellium Avast", "Roshar, Desconocido"), ("Devoción*", "Aona", "Sel"),
    ("Dominio*", "Skai", "Sel"), ("Dotación", "Edgli", "Nalthis"), ("Honor†", "Tanavast", "Roshar"),
    ("Invención", "Chan Ko Sar", "Desconocido"), ("Odium†", "Rayse", "Braize, Roshar"), ("Piedad", "Desconocido", "Desconocido"),
    ("Raciocinio", "Euridrius", "Desconocido"), ("Ruina†", "Ati", "Scadrial"), ("Valentía", "Medelantorius", "Desconocido"),
    ("Virtuosismo*", "Desconocido", "Komashi"),
]
FES = ["Astalsi", "Cazzi", "Dadradah", "HaDah", "Jaísmo", "Larstaísmo", "Verdades de los bennet"]
ESTACIONES = ("Otoño", "Invierno", "Primavera", "Verano")
MESES = [  # (estación, mes, festividad); el PDF mezcla las columnas en un solo párrafo por estación
    ("Otoño", "Lers", "—"),
    ("Otoño", "Kels", "Día del Superviviente. El día más sagrado de la Iglesia del Superviviente. Se celebra el primer día de Kels."),
    ("Otoño", "Marsh", "Noche de Todas las Lascas. Festividad del lasquismo en la que la gente trasnocha y viste máscaras festivas de Inquisidor. Se celebra la última noche de Marsh."),
    ("Otoño", "Doxil", "—"),
    ("Invierno", "Hammondar", "Día de la Fundación. Conmemora la fundación oficial de la ciudad de Elendel. (También conocido como la Décima de Hammondar)."),
    ("Invierno", "Tenson", "Día de Vershdad. Conmemora al héroe koloss conocido como Humano y celebra el legado del pueblo de sangre koloss."),
    ("Invierno", "Alcett", "Armondad. Festividad de pleno invierno que se celebra desde finales de Tenson hasta inicios de Alcett."),
    ("Invierno", "Lestib", "—"),
    ("Primavera", "Belsdret", "—"),
    ("Primavera", "Cladence", "—"),
    ("Primavera", "Voluntademare", "Víspera de la Guardia de la Bruma. Festividad sagrada del Camino."),
    ("Primavera", "Brisonio", "—"),
    ("Primavera", "Vinuarch", "Día del Ascenso. Conmemora a Vin, la Guerrera Ascendente."),
    ("Verano", "Elendre", "—"),
    ("Verano", "Tindwylure", "La Velada de Mare. Festividad estival."),
    ("Verano", "Saziembre", "—"),
]


def _tabla(cabecera, filas):
    esc = lambda s: str(s).replace("|", "\\|").replace("\n", " ").strip()
    out = ["| " + " | ".join(cabecera) + " |", "|" + "---|" * len(cabecera)]
    out += ["| " + " | ".join(esc(c) for c in f) + " |" for f in filas]
    return "\n".join(out)


def _filas(paras, i, rx):
    """Coincidencias de los párrafos consecutivos desde i que cumplen rx, y el índice donde acaba la tabla."""
    filas = []
    while i < len(paras):
        m = rx.match(paras[i].strip())
        if not m:
            break
        filas.append(m)
        i += 1
    return filas, i


def _convierte(paras):
    out, i = [], 0
    while i < len(paras):
        p = " ".join(paras[i].split())
        if p in ("Rango Frecuencia", "Rango Compañero", "Rango Delito indultado"):
            filas, j = _filas(paras, i + 1, RANGO)
            if filas:
                out.append(_tabla(p.split(" ", 1), [(f.group(1), " ".join(f.group(2).split())) for f in filas]))
                i = j
                continue
        if p == "Rango Pruebas Bonificación":
            filas, j = _filas(paras, i + 1, RANGO)
            rows = []
            for f in filas:
                resto = " ".join(f.group(2).split())
                b = BONIF.match(resto)
                rows.append((f.group(1), b.group(1).strip(), b.group(2)) if b else (f.group(1), resto, ""))
            if j < len(paras) and VENTAJA.fullmatch(paras[j].strip()) and rows and not rows[-1][2]:
                rows[-1] = (rows[-1][0], rows[-1][1], paras[j].strip())  # la bonificación cayó en el párrafo siguiente
                j += 1
            out.append(_tabla(["Rango", "Pruebas", "Bonificación"], rows))
            i = j
            continue
        if re.fullmatch(r"d6 Encuentros?", p):
            filas, j = _filas(paras, i + 1, re.compile(r"^([1-6])\s+(.+)$", re.S))
            if filas:
                out.append(_tabla(["d6", "Encuentro"], [(f.group(1), " ".join(f.group(2).split())) for f in filas]))
                i = j
                continue
        if p == "Esquirla Recipiente original Mundo":
            out.append(_tabla(["Esquirla", "Recipiente original", "Mundo"], ESQUIRLAS))
            nombres = {e[0] for e in ESQUIRLAS}
            i += 1
            while i < len(paras) and paras[i].split()[0] in nombres:
                i += 1
            continue
        if p == "Culturas y fes Creencias":
            rows, j = [], i + 1
            while j < len(paras):
                t = paras[j].strip()
                nombre = next((n for n in FES if t == n or t.startswith(n + " ")), None)
                if nombre and t == nombre and j + 1 < len(paras):  # nombre suelto: el texto está en el párrafo siguiente
                    rows.append((nombre, paras[j + 1].strip()))
                    j += 2
                elif nombre:
                    rows.append((nombre, t[len(nombre):].strip()))
                    j += 1
                else:
                    break
            if rows:
                out.append(_tabla(["Cultura o fe", "Creencias"], rows))
                i = j
                continue
        if p == "Estación Meses Festividades":
            out.append(_tabla(["Estación", "Mes", "Festividad"], MESES))
            i += 1
            while i < len(paras) and paras[i].split()[0] in ESTACIONES:
                i += 1
            continue
        if p == "Expresión Significado":
            frases, j = [], i + 1
            while j < len(paras) and not paras[j].startswith("#") and len(paras[j]) < 120:
                frases += re.findall(r".+?[.?!](?=\s|$)", " ".join(paras[j].split()))
                j += 1
            if frases and len(frases) % 2 == 0:
                out.append(_tabla(["Expresión", "Significado"], list(zip(frases[::2], frases[1::2]))))
                i = j
                continue
        if p == "Resultado original Resultado cambiado":
            out.append(_tabla(["Resultado original", "Resultado cambiado"], [("Vacío", "O o C2"), ("O", "C4"), ("C", "O")]))
            i += 1
            while i < len(paras) and len(paras[i]) < 14:
                i += 1
            continue
        out.append(paras[i])
        i += 1
    return out


RESTO_ROTULO = re.compile(r"^(#+\s+).*?™\s+(?=\S)")
CAPS_COLA = re.compile(r"^#+\s+(?:[A-ZÁÉÍÓÚÑÜ0-9,.'’-]+\s+){3,}([A-ZÁÉÍÓÚ][a-záéíóúñ]+(?:\s+[A-Za-záéíóúñ]+)*)$")


def _es_pie(linea):
    s = linea.strip()
    if s == "Introducción" or (re.match(r"^#*\s*(?:Capítulo \d+\b|Apéndice [A-C]\b)", s) and len(s) < 90):
        return True  # pie de página o inicio del capítulo siguiente
    texto = s.lstrip("# ").strip()
    if not texto:
        return False
    sin_minusc = not re.search(r"[a-záéíóúñü]", texto)
    if s.startswith("#"):
        letras = [c for c in texto if c.isalpha()]
        casi_mayusc = len(letras) > 15 and sum(c.isupper() for c in letras) > 0.85 * len(letras)
        if texto[0] in MARCAS or texto[0].islower() or len(texto) > 90 or sin_minusc or casi_mayusc:
            return True  # cita, pie o título de ilustración
        if texto.endswith((".", "”", "»")) and len(texto.split()) > 8:
            return True
    return sin_minusc and 2 <= len(texto.split()) <= 10 and not re.search(r"\d", texto)  # crédito de artista


def _rotulos(paras):
    """Rótulos de mapa: cuatro o más párrafos cortos seguidos sin puntuación final (las tablas ya están convertidas)."""
    def corto(p):
        return len(p) < 40 and "\n" not in p and not p.startswith(("|", "#")) and not re.search(r"[.:;!?”»)]$", p.strip())
    out, i = [], 0
    while i < len(paras):
        j = i
        while j < len(paras) and corto(paras[j]):
            j += 1
        if j - i >= 4:
            i = j
            continue
        out.append(paras[i])
        i += 1
    return out


def _cortado(p):
    """Párrafo largo que acaba sin puntuación: el PDF lo partió a mitad de frase."""
    return len(p) >= 40 and "\n" not in p and not p.startswith(("|", "#")) and re.search(r"[A-Za-záéíóúñü,;]$", p.strip()) is not None


def limpia_guia(body, titulo=""):
    paras = [p for p in re.split(r"\n\s*\n", body) if p.strip()]
    paras = _convierte(paras)
    limpios = []
    for p in paras:
        if p.lstrip().startswith("|"):
            limpios.append(p)
            continue
        lineas = []
        for l in p.split("\n"):
            l = RESTO_ROTULO.sub(r"\1", l)  # «e la bruma™ Feruquimia»: resto de un rótulo de ilustración antes del título
            m = CAPS_COLA.match(l.strip())  # pie de ilustración pegado al título del apartado siguiente
            lineas.append("### " + m.group(1) if m else l)
        k = [l for l in lineas if not _es_pie(l)]
        if k:
            limpios.append("\n".join(k))
    limpios = _rotulos(limpios)
    # rótulos de mapa repetidos (cada página los trae dos veces) y párrafos que el PDF partió a mitad de frase
    repetidos = {p for p in limpios if len(p) < 100 and limpios.count(p) > 1 and not p.startswith(("|", "#", "◆"))}
    unidos = []
    for p in (p for p in limpios if p not in repetidos):
        if unidos and _cortado(unidos[-1]) and not p.startswith(("|", "#", "◆")):
            unidos[-1] = unidos[-1] + " " + p
        else:
            unidos.append(p)
    limpios = ["#### Ettmetal" if p == "ettmetal" else p for p in unidos]  # la «E» capitular se perdió en el PDF
    limpios = [re.sub(r"^#{1,3} ", "#### ", p) for p in limpios]
    if titulo.startswith("Metas de "):
        limpios = [re.sub(r"^([A-ZÁÉÍÓÚ][^.:]{2,60}\.)\s", r"**\1** ", p) for p in limpios]
    return "\n\n".join(limpios).strip()


def _es_pron(tok):
    t = tok.strip(",.;")
    if not t:
        return False
    if "-" in t and re.search(r"[A-Za-z]", t):
        return True
    return t.isupper() and len(t) >= 2


def glosario(texto):
    """([(término, pronunciación, traducción)], [líneas dudosas]); la pronunciación empieza en el primer token en mayúsculas o con guion."""
    filas, dudosas = [], []
    for linea in texto.splitlines():
        l = " ".join(linea.split())
        if not l or l == "Nombre Pronunciación Traducción" or l.startswith(("#", "Capítulo", "Apéndice", "Esta ", "La tabla", "---", "title:", "source:", "chapter:", "pages:")):
            continue
        toks = l.split(" ")
        k = next((n for n, t in enumerate(toks) if n > 0 and _es_pron(t)), None)
        if k is None:
            dudosas.append(l)
            continue
        j = k
        while j < len(toks) and _es_pron(toks[j]):
            j += 1
        nombre, pron, trad = " ".join(toks[:k]), " ".join(toks[k:j]), " ".join(toks[j:])
        filas.append((nombre, pron, trad or nombre))
    return filas, dudosas
