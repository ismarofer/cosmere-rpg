"""Stormlight: objetos del Manual (capítulo 7): armas, armaduras, rasgos, equipo, esferas, monturas y vehículos, y fabriales comunes.

Misma idea que buscador_stormlight.py: entradas con su forma final (ambientación y libro propios, ids `…-stormlight-…`), añadidas
después de reorganizar() para no mezclarse con las de Mistborn. Las tablas de armas y armaduras salen aplanadas del PDF y van
transcritas a mano (como CURATED_WEAPONS/CURATED_ARMOR de Mistborn): si el libro se corrige, revisar `ARMAS` y `ARMADURAS`.

El PDF parte los párrafos de este capítulo a media frase (columnas) y mezcla el orden de algunos bloques: los textos se unen y se
trocean por sus rótulos conocidos («Cargas (1 carga).», «Recarga.», nombres de objetos…).
"""
import re
import unicodedata

AMBIENTACION = "Stormlight"
LIBRO = "Manual Stormlight"
CAP = "Capítulo 7 · Objetos"
CARPETA = "08 - Capítulo 7 Objetos"
W, H = "Armamento ligero", "Armamento pesado"

# nombre, habilidad, familia, alcance, daño, tipo de daño, rasgos, rasgos de experto, peso, precio
ARMAS = [
    ("Arco corto", W, "Ligera", "A distancia [24/96]", "1d6", "laceración", "A dos manos", "Preparación rápida", "1 kg", "80 mc"),
    ("Bastón", W, "Ligera", "Cuerpo a cuerpo", "1d6", "golpe", "Discreta, A dos manos", "Defensiva", "2 kg", "1 mc"),
    ("Cuchillo", W, "Ligera", "Cuerpo a cuerpo", "1d4", "laceración", "Discreta", "Mano secundaria, Arrojadiza [6/18]", "0,5 kg", "8 mc"),
    ("Espada lateral", W, "Ligera", "Cuerpo a cuerpo", "1d6", "laceración", "Preparación rápida", "Mano secundaria", "1 kg", "40 mc"),
    ("Espada ropera", W, "Ligera", "Cuerpo a cuerpo", "1d6", "laceración", "Preparación rápida", "Defensiva", "1 kg", "100 mc"),
    ("Honda", W, "Ligera", "A distancia [9/36]", "1d4", "golpe", "Discreta", "Indirecta", "0,5 kg", "2 mc"),
    ("Jabalina", W, "Ligera", "Cuerpo a cuerpo", "1d6", "laceración", "Arrojadiza [10/40]", "Indirecta", "1 kg", "20 mc"),
    ("Lanza corta", W, "Ligera", "Cuerpo a cuerpo", "1d8", "laceración", "A dos manos", "Única: pierde el rasgo A dos manos", "1,5 kg", "10 mc"),
    ("Maza", W, "Ligera", "Cuerpo a cuerpo", "1d6", "golpe", "—", "Inercia", "1,5 kg", "20 mc"),
    ("Alabarda", H, "Pesada", "Cuerpo a cuerpo", "1d10", "laceración", "A dos manos", "Única: Cuerpo a cuerpo [+1,5]", "2,5 kg", "40 mc"),
    ("Arco largo", H, "Pesada", "A distancia [45/180]", "1d6", "laceración", "A dos manos", "Indirecta", "1,5 kg", "100 mc"),
    ("Ballesta", H, "Pesada", "A distancia [30/120]", "1d8", "laceración", "Cargada [1], A dos manos", "Mortífera", "3,5 kg", "200 mc"),
    ("Escudo", H, "Pesada", "Cuerpo a cuerpo", "1d4", "golpe", "Defensiva", "Mano secundaria", "1 kg", "10 mc"),
    ("Espada larga", H, "Pesada", "Cuerpo a cuerpo", "1d8", "laceración", "Preparación rápida, A dos manos", "Única: pierde el rasgo A dos manos", "1,5 kg", "60 mc"),
    ("Hacha", H, "Pesada", "Cuerpo a cuerpo", "1d6", "laceración", "Arrojadiza [6/18]", "Mano secundaria", "1 kg", "20 mc"),
    ("Lanza larga", H, "Pesada", "Cuerpo a cuerpo [+1,5]", "1d8", "laceración", "A dos manos", "Defensiva", "4,5 kg", "15 mc"),
    ("Mandoble", H, "Pesada", "Cuerpo a cuerpo", "1d10", "laceración", "A dos manos", "Mortífera", "3,5 kg", "200 mc"),
    ("Martillo", H, "Pesada", "Cuerpo a cuerpo", "1d10", "golpe", "A dos manos", "Inercia", "4 kg", "40 mc"),
    # armas especiales
    ("Arma improvisada", "La misma que un arma similar", "Especial", "Cuerpo a cuerpo", "El mismo que un arma similar", "—", "Frágil, Única", "—", "—", "—"),
    ("Ataque sin armas", "Atletismo", "Especial", "Cuerpo a cuerpo", "Única (según Fuerza)", "golpe", "Única", "Inercia, Mano secundaria", "No pesa", "—"),
    ("Gran arco", H, "Especial", "A distancia [60/240]", "2d6", "laceración", "Voluminosa [5], A dos manos", "Perforante", "10 kg", "1000 mc"),
    ("Hoja esquirlada", H, "Especial", "Cuerpo a cuerpo", "2d8", "espiritual", "Peligrosa, Mortífera, Única", "Única: pierde el rasgo Peligrosa", "2 kg", "Solo recompensa"),
    ("Hoja esquirlada (Radiante)", H, "Especial", "Cuerpo a cuerpo", "2d*", "espiritual", "Mortífera, Única", "—", "No pesa", "Solo talento"),
    ("Martillo de guerra", H, "Especial", "Cuerpo a cuerpo", "2d10", "golpe", "Voluminosa [5], A dos manos", "Única", "75 kg", "400 mc"),
    ("Semiesquirla", H, "Especial", "Cuerpo a cuerpo", "2d4", "golpe", "Defensiva, A dos manos, Única", "Inercia", "5 kg", "2000 mc"),
]

# nombre, desvío, rasgos, rasgos de experto, peso, precio
ARMADURAS = [
    ("Uniforme", 0, "Presentable", "—", "2,5 kg", "40 mc"),
    ("Cuero", 1, "—", "Presentable", "5 kg", "60 mc"),
    ("Malla", 2, "Voluminosa [3]", "Única: pierde el rasgo Voluminosa", "12,5 kg", "80 mc"),
    ("Coraza", 2, "Voluminosa [3]", "Presentable", "15 kg", "120 mc"),
    ("Armadura de placas y malla", 3, "Voluminosa [4]", "Única: Voluminosa [3] en lugar de Voluminosa [4]", "20 kg", "400 mc"),
    ("Armadura completa", 4, "Voluminosa [5]", "—", "27,5 kg", "1600 mc"),
    ("Armadura esquirlada", 5, "Peligrosa, Única", "Única: pierde el rasgo Peligrosa", "700 kg", "Solo recompensa"),
    ("Armadura esquirlada (Radiante)", 5, "Única", "—", "No pesa", "Solo talento"),
]

RASGOS_ARMA = ["A dos manos", "Arrojadiza", "Cargada", "Defensiva", "Discreta", "Frágil", "Indirecta", "Inercia", "Mano secundaria",
               "Mortífera", "Peligrosa", "Perforante", "Preparación rápida", "Única", "Voluminosa"]
RASGOS_ARMADURA = ["Peligrosa", "Presentable", "Única", "Voluminosa"]

# vehículos: tabla aplanada en el PDF → transcrita (nombre, tipo, velocidad de viaje, alquiler por día, precio de compra)
VEHICULOS = [
    ("Carro de chulls", "Terrestre", "3 km/h", "5 mc", "500 mc"),
    ("Barca de remos", "Acuático", "4,5 km/h a favor de corriente, 1,5 km/h a contracorriente", "3 mc", "250 mc"),
    ("Navío mercante", "Acuático", "7,5 km/h", "50 mc", "10000 mc"),
    ("Barco de guerra", "Acuático", "12 km/h", "250 mc", "100000 mc"),
]

VINOS = ["Rosa", "Naranja", "Amarillo", "Rojizo", "Rojo", "Zafiro", "Azul", "Violeta"]

# Rótulos en negrita dentro del texto de cada objeto especial
ROTULOS = ["Rasgos únicos", "Cargas \\(\\d+ cargas?\\)", "Recarga", "Invocación/Descarte", "Lesión espiritual", "Invocación más rápida",
           "Forma maleable", "Hoja esquirlada Radiante", "Peso aplastante", "Rompible", "Atributos mejorados",
           "Protección de capacidad Investida", "Armadura viviente", "Armadura restrictiva", "Recuperación natural",
           "Armadura esquirlada Radiante", "Chip", "Marco", "Broam", "Siempre disponible", "Entrenamiento de fuerza", "Pericia", "Cómo usar un arma improvisada"]
RE_ROTULO = re.compile(r"(?:(?<=[.!?”)] )|^)(" + "|".join(ROTULOS) + r")\.\s")


def _norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower()


def _slug(s):
    return re.sub(r"[^a-z0-9]+", "-", _norm(s)).strip("-")[:70] or "x"


def _leer(path):
    txt = path.read_text(encoding="utf-8")
    txt = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\xad]", "", txt)
    m = re.match(r"---\n(.*?)\n---\n", txt, re.S)
    return txt[m.end():] if m else txt


def _tokens(txt):
    """[(nivel, texto)] en orden; nivel 0 = bloque de texto (separado por líneas en blanco), 1-6 = encabezado."""
    out, buf = [], []

    def vuelca():
        if buf:
            out.append((0, " ".join(" ".join(buf).split())))
            buf.clear()

    for linea in txt.splitlines():
        m = re.match(r"^(#{1,6})\s+(.*?)\s*$", linea)
        if m:
            vuelca()
            out.append((len(m.group(1)), m.group(2)))
        elif not linea.strip():
            vuelca()
        else:
            buf.append(linea.strip())
    vuelca()
    return out


def _basura(t):
    """Pies de página, créditos de ilustración (nombres en mayúsculas) y pies de foto."""
    t = t.strip()
    return bool(re.match(r"^Capítulo \d+:", t)) or (t.upper() == t and len(t) < 70)


def _unir(textos):
    """Une bloques que el PDF partió a media frase o por guion de fin de línea."""
    out = []
    for t in textos:
        if not out:
            out.append(t)
        elif out[-1].endswith("-") and t[:1].islower():
            out[-1] = out[-1][:-1] + t
        elif not re.search(r"[.!?:”)\]]$", out[-1]) and not t.startswith(("◆", "#")) and not out[-1].startswith(("◆", "#")):
            out[-1] += " " + t
        else:
            out.append(t)
    return [re.sub(r"(?<=[a-záéíóúñ])- (?=[a-záéíóúñ])", "", p) for p in out]


def _seccion(tokens, inicio, fin=None, nivel=2):
    """Textos entre el encabezado `inicio` y el siguiente encabezado de ese nivel (o `fin`); subtítulos legítimos como «####»."""
    i = next((k for k, (n, t) in enumerate(tokens) if n and _norm(t) == _norm(inicio)), None)
    if i is None:
        raise ValueError(f"Stormlight objetos: falta la sección «{inicio}»; ¿cambió el libro?")
    out = []
    for n, t in tokens[i + 1:]:
        if n and (n <= nivel and (n == 2 or len(t.split()) <= 3)) or (fin and n and _norm(t) == _norm(fin)):
            break
        if n == 0:
            if not _basura(t):
                out.append(t)
        elif n >= 3 and not _basura(t) and not t[:1].islower() and "Capítulo" not in t and not t.startswith(("“", '"')):
            out.append("#### " + t)
    return out


def _formatea(textos):
    """Párrafos unidos, con los rótulos del libro en negrita y listas ◆ conservadas."""
    partes = []
    for p in _unir(textos):
        if p.startswith("####"):
            partes.append(p)
            continue
        partes.append(RE_ROTULO.sub(lambda m: "\n\n**" + m.group(1) + ".** ", p).strip())
    return "\n\n".join(partes).replace("\n\n\n", "\n\n")


def _tabla(filas, cabecera):
    out = ["| " + " | ".join(cabecera) + " |", "|" + "---|" * len(cabecera)]
    out += ["| " + " | ".join(f) + " |" for f in filas]
    return "\n".join(out)


def _precio_n(s):
    if not s or s.startswith(("Solo", "—", "Gratis")):
        return None
    s = re.sub(r"(?<=\d)[. ](?=\d{3}\b)", "", s)
    m = re.search(r"\d[\d]*(?:,\d+)?", s)
    return float(m.group(0).replace(",", ".")) if m else None


def _entrada(cat, titulo, ident, cuerpo, f, pagina, seccion):
    return {"cat": cat, "title": titulo, "path": [CAP, seccion], "pages": pagina, "body": cuerpo, "f": f, "id": ident,
            "ambientacion": AMBIENTACION, "libro": LIBRO}


def objetos(resources, h):
    """h: ayudas de build-buscador.py (grams, split_list, trait_names, cut_traits). Devuelve la lista de entradas."""
    d = resources / "Manual del Archivo de las Tormentas" / CARPETA
    armas_t = _tokens(_leer(d / "04 - Armas.md"))
    armad_t = _tokens(_leer(d / "05 - Armaduras.md"))
    equipo_t = _tokens(_leer(d / "06 - Equipo.md"))
    out = []

    # ---- rasgos de armas: el párrafo corrido está partido en dos sitios del PDF (antes y después de «Alcance de las armas»)
    parte1 = " ".join(_unir(_bloques_hasta_subtitulo(armas_t, "Rasgos de las armas")))
    i = next((k for k, (n, t) in enumerate(armas_t) if n == 0 and t.startswith("almacenada. Con 1")), None)
    if i is None:
        raise ValueError("Stormlight objetos: no se encuentra el final de los rasgos de las armas")
    resto = []
    for n, t in armas_t[i:]:
        if n:
            if n == 2:
                break
            continue
        if not _basura(t):
            resto.append(t)
    rw = h.cut_traits(parte1 + " " + " ".join(_unir(resto)), RASGOS_ARMA)
    pa = " ".join(_unir(_bloques_hasta_subtitulo(armad_t, "Rasgos de las armaduras")))
    ra = h.cut_traits(pa, RASGOS_ARMADURA)
    faltan = [n for n in RASGOS_ARMA if n not in rw] + [n for n in RASGOS_ARMADURA if n not in ra]
    if faltan:
        raise ValueError(f"Stormlight objetos: no se han podido separar los rasgos {faltan}")
    dup = set(rw) & set(ra)
    for n, t in rw.items():
        out.append(_entrada("rasgo", n + (" (arma)" if n in dup else ""), "rasgo-stormlight-" + _slug(n) + ("-arma" if n in dup else ""),
                            t, {"aplica": "Armas", "nombre": n}, "245-247", "Rasgos de las armas"))
    for n, t in ra.items():
        out.append(_entrada("rasgo", n + (" (armadura)" if n in dup else ""), "rasgo-stormlight-" + _slug(n) + ("-armadura" if n in dup else ""),
                            t, {"aplica": "Armaduras", "nombre": n}, "252", "Rasgos de las armaduras"))

    # ---- textos de los objetos especiales
    def sec(t, a, **kw):
        return _formatea(_seccion(t, a, **kw))

    lesiones = _tabla([
        ("16 o más", "Herida superficial. El personaje sufre una lesión temporal durante el resto del día."),
        ("1 a 15", "Lesión espiritual. El objetivo sufre una lesión permanente. La carne cortada se queda gris y sin vida. "
                   "La curación no Investida no puede sanar esta lesión."),
        ("0 o menos", "Muerte. El personaje muere (consultar “Muerte”)."),
    ], ["Tirada de lesión", "Lesión"])
    hoja = sec(armas_t, "Hojas esquirladas y hojas esquirladas Radiantes")
    if "### Duración de lesiones" in hoja or "#### Duración de lesiones de hoja esquirlada" in hoja:
        hoja = re.sub(r"#### Duración de lesiones de hoja esquirlada\s*(?:Tirada de lesión Lesión.*?)(?=\n\n\*\*|\Z)",
                      "#### Duración de lesiones de hoja esquirlada\n\n" + lesiones, hoja, flags=re.S)
    else:
        hoja += "\n\n#### Duración de lesiones de hoja esquirlada\n\n" + lesiones
    hoja += "\n\n#### Cómo vincularse a una hoja esquirlada\n\n" + sec(armas_t, "Cómo vincularse a una hoja esquirlada")
    radiante_ht = _seccion(armas_t, "Hojas esquirladas Radiantes")
    martillo_ht = _seccion(armas_t, "Martillos de guerra", nivel=1)
    # «Radiantes empuñando hojas esquirladas no Radiantes» cuelga del final de los martillos de guerra en el PDF
    j = next((k for k, t in enumerate(martillo_ht) if "Radiantes empuñando hojas esquirladas" in t), len(martillo_ht))
    emp = martillo_ht[j:]
    martillo_ht = martillo_ht[:j]
    radiante = _formatea(radiante_ht) + ("\n\n" + _formatea(emp) if emp else "")
    sinarmas = _formatea(_seccion(armas_t, "Ataques sin armas"))
    daño = [("0 a 2", "1 por golpe (sin tirada)"), ("3 a 4", "1d4 por golpe"), ("5 a 6", "1d8 por golpe"),
            ("7 a 8", "2d6 por golpe"), ("9 o más", "2d10 por golpe")]
    sinarmas = re.split(r"\n\n#### Daño sin armas", sinarmas)[0] + "\n\n#### Daño sin armas\n\n" + _tabla(daño, ["Fuerza", "Daño sin armas"])
    textos = {
        "Semiesquirla": sec(armas_t, "Semiesquirlas"), "Hoja esquirlada": hoja, "Hoja esquirlada (Radiante)": radiante,
        "Martillo de guerra": _formatea(martillo_ht), "Ataque sin armas": sinarmas,
        "Arma improvisada": sec(armas_t, "Armas improvisadas", nivel=2, fin="Armas: armas especiales"),
        "Armadura esquirlada": sec(armad_t, "Armadura esquirlada y armadura esquirlada Radiante"),
        "Armadura esquirlada (Radiante)": sec(armad_t, "Armadura esquirlada Radiante", nivel=2,
                                              fin="Consejo para la DJ: otorgar objetos como recompensas"),
    }
    for k in list(textos):  # las secciones ya traen «Daño sin armas» como tabla aplanada, que no se publica
        textos[k] = re.sub(r"\n\n#### Daño sin armas\n\n\| Fuerza.*", lambda m: m.group(0), textos[k], flags=re.S)

    # ---- armas
    for n, skill, fam, rng, dmg, dtype, tr, exp, peso, prec in ARMAS:
        melee = "Cuerpo a cuerpo" if rng.startswith("Cuerpo") else "A distancia"
        rm = re.search(r"\[(\d+)/(\d+)\]", rng)
        cab = (f"{n}. {fam}. Habilidad: {skill}. Daño: {dmg} {dtype}. Alcance: {rng}. "
               f"Rasgos: {tr}. Rasgos de experto: {exp}. Peso: {peso}. Precio: {prec}.")
        cuerpo = cab + ("\n\n" + textos[n] if n in textos else "")
        out.append(_entrada("arma", n, "arma-stormlight-" + _slug(n), cuerpo, {
            "familia": fam, "habilidad": skill, "tipo": melee, "dano": f"{dmg} {dtype}".strip(), "dado": dmg, "tipo_dano": dtype,
            "alcance": rng, "alcance_corto": int(rm.group(1)) if rm else None, "alcance_largo": int(rm.group(2)) if rm else None,
            "rasgos": h.trait_names(h.split_list(tr)), "rasgos_txt": tr, "experto": exp, "peso": peso, "peso_g": h.grams(peso),
            "precio": prec, "precio_n": _precio_n(prec)}, "244-250", "Armas"))
    for n, dv, tr, exp, peso, prec in ARMADURAS:
        cab = f"{n}. Valor de desvío {dv}. Rasgos: {tr}. Rasgos de experto: {exp}. Peso: {peso}. Precio: {prec}."
        cuerpo = cab + ("\n\n" + textos[n] if n in textos else "")
        out.append(_entrada("armadura", n, "armadura-stormlight-" + _slug(n), cuerpo, {
            "desvio": dv, "rasgos": h.trait_names(h.split_list(tr)), "rasgos_txt": tr, "experto": exp,
            "peso": peso, "peso_g": h.grams(peso), "precio": prec, "precio_n": _precio_n(prec)}, "252-254", "Armaduras"))

    out += _equipo(equipo_t, h)
    out += _esferas(_tokens(_leer(d / "02 - Esferas.md")))
    out += _monturas(_tokens(_leer(d / "07 - Viajes.md")), equipo_t, h)
    out += _fabriales(_tokens(_leer(d / "08 - Fabriales.md")), h)
    return out


def _bloques_hasta_subtitulo(tokens, inicio):
    """Bloques de texto tras el encabezado `inicio` hasta el siguiente encabezado de cualquier nivel."""
    i = next((k for k, (n, t) in enumerate(tokens) if n and _norm(t) == _norm(inicio)), None)
    if i is None:
        raise ValueError(f"Stormlight objetos: falta «{inicio}»")
    out = []
    for n, t in tokens[i + 1:]:
        if n:
            break
        if not _basura(t):
            out.append(t)
    return out


# ------------------------------------------------------------------ equipo

FILA = re.compile(r"^(?P<n>.+?) (?P<w>\d[\d,]*(?: (?:kg|g))?(?: a \d[\d,]*(?: (?:kg|g))?)?(?: \(vacío\))?) "
                  r"(?P<p>\d[\d,]*(?: a \d[\d,]*)? mc)$")
ALIAS_DESC = {"libro (de referencia)": "libro (referencia)", "linterna (esfera)": "linterna (esferas)"}


def _filas_equipo(tokens):
    bloques = []
    for n, t in tokens:
        if n and _norm(t) == "chull":  # lo que sigue son monturas y vehículos
            break
        if n == 0:
            bloques.append(t)
    filas = []
    previo = None
    for b in bloques:
        for linea in re.split(r"(?<=mc)\s+(?=[A-ZÁÉÍÓÚ])", b):  # varias filas pueden haber quedado en un bloque
            linea = linea.strip()
            m = FILA.match(linea)
            if m and not linea.startswith("Nombre"):
                filas.append((m.group("n"), m.group("w"), m.group("p")))
                previo = None
                continue
            solo = re.fullmatch(r"(\d[\d,]*(?: (?:kg|g))?) (\d[\d,]*(?: a \d[\d,]*)? mc)", linea)
            if solo and previo:  # «Tienda de campaña (dos personas)*» deja peso y precio en el bloque siguiente
                filas.append((previo, solo.group(1), solo.group(2)))
                previo = None
                continue
            previo = linea if re.match(r"^[A-ZÁÉÍÓÚ][^.]{3,60}\*?$", linea) and "(" in linea else None
    return filas


def _descripciones_equipo(tokens, nombres):
    """Párrafo de cada objeto, por su rótulo («Aceite.», «Antiséptico (débil).»…). Los bloques se unen antes de trocear."""
    textos = []
    for n, t in tokens:
        if n and _norm(t) == "chull":  # a partir de aquí, monturas y vehículos
            break
        if n == 0 and not _basura(t):
            textos.append(t)
    # quita las filas de la tabla y su cabecera
    textos = [t for t in textos if not FILA.match(t) and not t.startswith(("Nombre Peso", "*Este objeto", "Color Efecto"))
              and not re.match(r"^(?:" + "|".join(VINOS) + r") [A-ZÁÉÍÓÚ]", t)
              and not re.fullmatch(r"\d[\d,]*(?: (?:kg|g))? \d[\d,]*(?: a \d[\d,]*)? mc", t)
              and _norm(t.rstrip("*")) not in {_norm(n.rstrip("*")) for n in nombres}]
    unido = " ".join(_unir(textos))
    unido = re.sub(r"(?<=[a-záéíóúñ.])\s+(?:[A-ZÁÉÍÓÚ]\w+\s+){0,3}[A-ZÁÉÍÓÚ]\w+(?=\s+(?:Aceite|Alcohol)\.)", " ", unido)
    bases = {re.sub(r"\s*\(.*?\)", "", n.rstrip("*")).strip() for n in nombres}
    rotulos = sorted({_rotulo(n) for n in nombres} | bases | {"Veneno débil", "Veneno efectivo", "Veneno potente"} - {""},
                     key=lambda s: -len(s))
    patron = re.compile(r"(?:(?<=[.!?:”)] )|^)(" + "|".join(re.escape(r) for r in rotulos) + r")\.\s")
    marcas = [(m.start(), m.end(), m.group(1)) for m in patron.finditer(unido)]
    out = {}
    for i, (s, e, r) in enumerate(marcas):
        fin = marcas[i + 1][0] if i + 1 < len(marcas) else len(unido)
        out.setdefault(_norm(r), unido[e:fin].strip())
    return out


def _rotulo(nombre):
    """«Antiséptico (débil, 5 dosis)» → «Antiséptico (débil)»; «Aceite (1 frasco)» → «Aceite»."""
    n = nombre.rstrip("*").strip()
    n = ALIAS_DESC_NOMBRE.get(_norm(n), n)
    m = re.match(r"^(.*?)\s*\(([^,)]*)(?:,[^)]*)?\)$", n)
    if not m:
        return n
    base, q = m.group(1), m.group(2).strip()
    return f"{base} ({q})" if re.match(r"^[a-záéíóúñ ]+$", q) and not re.match(r"^\d", q) and q not in ("vacío",) else base


ALIAS_DESC_NOMBRE = {"libro (de referencia)": "Libro (referencia)", "linterna (esfera)": "Linterna (esferas)"}


def _equipo(tokens, h):
    filas = _filas_equipo(tokens)
    if len(filas) < 55:
        raise ValueError(f"Stormlight objetos: la tabla de equipo salió con {len(filas)} filas (¿cambió el PDF?)")
    desc = _descripciones_equipo(tokens, [f[0] for f in filas])
    vinos = _tabla_vinos(tokens)
    out, vistos = [], set()
    for nombre, peso, precio in filas:
        estrella = nombre.endswith("*")
        nombre = nombre.rstrip("*").strip()
        if nombre in vistos:
            continue
        vistos.add(nombre)
        base = re.sub(r"\s*\(.*?\)", "", nombre).strip()
        d = desc.get(_norm(_rotulo(nombre))) or desc.get(_norm(base)) or ""
        if base == "Veneno":
            efecto = desc.get(_norm("Veneno " + re.search(r"\(([^,)]+)", nombre).group(1)), "")
            d = (d + " " + efecto).strip()
        if base == "Alcohol" and vinos:
            d += "\n\n" + vinos
        cuerpo = d or (f"{nombre}. Peso {peso}. Precio {precio}." + (
            " Este objeto se incluye para contribuir al juego y no cuenta con características ni reglas específicas." if estrella else ""))
        out.append(_entrada("equipo", nombre, "equipo-stormlight-" + _slug(nombre), cuerpo, {
            "peso": peso, "peso_g": h.grams(peso), "precio": precio, "precio_n": _precio_n(precio),
            "nota": "*" if estrella else "", "tipo": "Equipo"}, "257-261", "Equipo"))
    return out


def _tabla_vinos(tokens):
    filas = []
    en = False
    for n, t in tokens:
        if n:
            continue
        if t.startswith("Color Efecto"):
            en = True
            continue
        if en:
            m = re.match(r"^(" + "|".join(VINOS) + r") (.+)$", t)
            if m:
                filas.append((m.group(1), m.group(2)))
            else:
                break
    return ("Vinos vorin, de menos a más embriagador:\n\n" + _tabla(filas, ["Color", "Efecto"])) if filas else ""


# ------------------------------------------------------------------ esferas, monturas y vehículos, fabriales

def _esferas(tokens):
    bloques = [t for n, t in tokens if n == 0 and not _basura(t)]
    filas = [m.groups() for t in bloques if (m := re.match(r"^(.+?) ([\d,]+) ([\d,]+) ([\d,]+)$", t)) and not t.startswith("Gema ")]
    if len(filas) != 5:
        raise ValueError("Stormlight objetos: tabla de esferas no esperada")
    intro = _formatea(_seccion(tokens, "Esferas", nivel=1))
    usos = _formatea(_seccion(tokens, "Usos de las esferas"))
    cuerpo = (intro + "\n\n#### Valores de esferas en marcos de diamante\n\n" + _tabla(filas, ["Gema", "Chip", "Marco", "Broam"])
              + "\n\n#### Usos de las esferas\n\n" + usos)
    return [_entrada("equipo", "Esferas", "equipo-stormlight-esferas", cuerpo,
                     {"peso": "—", "peso_g": None, "precio": "—", "precio_n": None, "nota": "", "tipo": "Esferas"}, "249-250", "Esferas")]


def _monturas(viajes, equipo, h):
    """Textos de chull, caballo y ryshadio y la tabla de vehículos, en «Equipo»; precios y velocidades, en «Viajes»."""
    filas = {}
    for n, t in viajes:
        m = re.match(r"^(Chull|Caballo|Ryshadio) (\d[\d,]* km/h) (\d+ kg) (.+)$", t) if n == 0 else None
        if m:
            filas[m.group(1)] = m.groups()[1:]
    if len(filas) != 3:
        raise ValueError("Stormlight objetos: tabla de monturas no esperada")
    out = []
    for nombre in ("Chull", "Caballo", "Ryshadio"):
        vel, carga, precio = filas[nombre]
        cuerpo = (f"{nombre}. Velocidad de viaje: {vel}. Capacidad de carga: {carga}. Precio de compra: {precio}.\n\n"
                  + _formatea(_seccion(equipo, nombre, nivel=2)))
        out.append(_entrada("equipo", nombre, "equipo-stormlight-" + _slug(nombre), cuerpo,
                            {"peso": "—", "peso_g": None, "precio": precio, "precio_n": _precio_n(precio), "nota": "", "tipo": "Montura"},
                            "261-262", "Viajes"))
    intro = _formatea(_seccion(equipo, "Vehículos", nivel=2))
    intro = re.split(r"\n\n#### Vehículos", intro)[0]
    for n, tipo, vel, alq, comp in VEHICULOS:
        cuerpo = f"{n}. {tipo}. Velocidad de viaje: {vel}. Alquiler por día: {alq}. Precio de compra: {comp}.\n\n" + intro
        out.append(_entrada("equipo", n, "equipo-stormlight-" + _slug(n), cuerpo,
                            {"peso": "—", "peso_g": None, "precio": comp, "precio_n": _precio_n(comp), "nota": "", "tipo": "Vehículo",
                             "alquiler": alq}, "262", "Viajes"))
    aloj = [(m.group(1), m.group(2)) for n, t in viajes if n == 0
            for m in [re.match(r"^(Refugio para tormentas|Modesto|Confortable|Lujoso|Aristocrático) (.+)$", t)] if m]
    if len(aloj) != 5:
        raise ValueError("Stormlight objetos: tabla de alojamiento no esperada")
    cuerpo = ("Cuando viajas, es posible que quieras una habitación, especialmente durante una alta tormenta. Precio por noche y por persona:"
              "\n\n" + _tabla(aloj, ["Alojamiento", "Precio por noche y por persona"]))
    out.append(_entrada("equipo", "Alojamiento", "equipo-stormlight-alojamiento", cuerpo,
                        {"peso": "—", "peso_g": None, "precio": "Gratis a 20 mc", "precio_n": 0.0, "nota": "", "tipo": "Alojamiento"},
                        "261", "Viajes"))
    return out


FABRIALES = [  # nombre, cargas, peso, precio (tabla «Fabriales comunes»)
    ("Alertador", "5", "500 g a 5 kg", "500 mc"), ("Atractor", "5", "4 kg", "750 mc"),
    ("Brazalete emocional", "3", "100 g", "200 mc"), ("Calorial", "5", "500 g a 5 kg", "50 a 500 mc"),
    ("Dolorial (aumentador)", "3", "500 g", "750 mc"), ("Dolorial (reductor)", "3", "500 g", "750 mc"),
    ("Drenador", "2", "250 g", "1000 mc"), ("Moldeador de almas", "5", "2,5 kg", "Solo recompensa"),
    ("Reloj fabrial", "3", "1 kg", "200 mc"), ("Repulsor", "5", "4 kg", "1500 mc"),
    ("Sillalibre", "—", "6 kg", "Gratis u 800 mc"), ("Supresor", "2", "500 g", "Solo recompensa"),
    ("Vinculacañas (1 par)", "3", "500 g cada una", "100 mc"),
]
ROTULO_FABRIAL = {"Dolorial (aumentador)": "Dolorial (aumentador; 3 cargas)", "Dolorial (reductor)": "Dolorial (reductor; 3 cargas)",
                  "Vinculacañas (1 par)": "Vinculacañas (3 cargas)", "Sillalibre": "Sillalibre (cargas ilimitadas)"}
# párrafos que el PDF dejó tras el de otro fabrial pero que son del moldeador de almas
COLA_MOLDEADOR = "Si un personaje no Radiante practica el tiempo suficiente"


def _fabriales(tokens, h):
    i = next((k for k, (n, t) in enumerate(tokens) if n and _norm(t) == "fabriales comunes" and n == 3), None)
    if i is None:
        raise ValueError("Stormlight objetos: falta la tabla «Fabriales comunes»")
    bloques = [t for n, t in tokens[i + 1:] if n == 0 and not _basura(t)]
    k0 = next((k for k, t in enumerate(bloques) if t.startswith("Alertador (5 cargas).")), None)
    if k0 is None:
        raise ValueError("Stormlight objetos: no se encuentra la descripción de los fabriales comunes")
    bloques = bloques[k0:]  # la tabla (aplanada) queda atrás
    rot = {n: ROTULO_FABRIAL.get(n, f"{n} ({c} cargas)") for n, c, _, _ in FABRIALES}
    patron = re.compile(r"(?:(?<=[.!?”)] )|^)(" + "|".join(re.escape(r) for r in rot.values()) + r")\.\s")
    unido = " ".join(_unir(bloques))
    marcas = [(m.start(), m.end(), m.group(1)) for m in patron.finditer(unido)]
    desc = {}
    for k, (s, e, r) in enumerate(marcas):
        desc[r] = unido[e:(marcas[k + 1][0] if k + 1 < len(marcas) else len(unido))].strip()
    # el final del texto («Fabriales únicos») no es de ningún fabrial común
    desc = {r: re.split(r"\s+(?:Fabriales únicos|Más allá de los fabriales comunes)\b", t)[0] for r, t in desc.items()}
    # el PDF dejó dos colas fuera de sitio: la de la sillalibre (tras el drenador) y la del moldeador de almas (tras las vinculacañas)
    k = desc[rot["Drenador"]].find("de forma gratuita y no tienen")
    if k >= 0:
        desc[rot["Sillalibre"]] += " " + desc[rot["Drenador"]][k:]
        desc[rot["Drenador"]] = desc[rot["Drenador"]][:k].strip()
    for r, t in desc.items():
        k = t.find(COLA_MOLDEADOR)
        if k >= 0 and r != rot["Moldeador de almas"]:
            desc[rot["Moldeador de almas"]] += "\n\n" + t[k:]
            desc[r] = t[:k].strip()
    out = []
    for n, c, peso, precio in FABRIALES:
        cuerpo = re.sub(r"\s*◆\s*", "\n◆ ", desc.get(rot[n], "")).replace("\n◆", "\n\n◆", 1)
        if not cuerpo:
            raise ValueError(f"Stormlight objetos: sin descripción para el fabrial {n}")
        out.append(_entrada("equipo", n, "equipo-stormlight-" + _slug(n), cuerpo, {
            "peso": peso, "peso_g": h.grams(peso), "precio": precio, "precio_n": _precio_n(precio), "nota": "",
            "tipo": "Fabrial", "cargas": c}, "263-264", "Fabriales"))
    return out


# ------------------------------------------------------------------ pericias que salen de las armas y armaduras

ESPECIALIZADAS = {"Gran arco", "Hoja esquirlada", "Martillo de guerra", "Semiesquirla", "Armadura esquirlada"}


def pericias(objetos, base, definiciones):
    """Pericias en arma, en armadura y especializadas de los objetos de Stormlight (mismo método que Mistborn).
    Si ya existe la de Mistborn con exactamente el mismo texto, esa pasa a ser común (Cosmere, «Manual del Juego»), con enlace
    a las dos entradas, y no se crea otra (decisions/reglas/contenido-comun-entre-ambientaciones.md)."""
    existentes = {(e["f"].get("tipo"), e["f"].get("pericia")): e for e in base if e["cat"] == "pericia" and e["f"].get("pericia")}
    nuevas = []
    for e in objetos:
        if e["cat"] not in ("arma", "armadura") or e["title"].endswith("(Radiante)"):
            continue
        nombre = re.sub(r"\s*\(.*?\)", "", e["title"]).strip()
        if e["cat"] == "armadura" and nombre == "Cuero":
            nombre = "Armadura de cuero"  # así la nombra el manual
        esp = nombre in ESPECIALIZADAS
        tipo = "Pericia especializada" if esp else ("Pericia en arma" if e["cat"] == "arma" else "Pericia en armadura")
        exp = (e["f"].get("experto") or "").strip()
        texto = definiciones[tipo] + (f"\n\nRasgo de experto: {exp}." if exp and exp != "—" else "")
        enlace = f"[[#/e/{e['id']}|{e['title']}]]"
        previa = existentes.get((tipo, nombre))
        if previa is not None and re.sub(r"\n\nVer: .*$", "", previa["body"], flags=re.S) == texto:
            cat_m = previa["body"].rsplit("Ver: ", 1)[1].strip()
            previa["body"] = texto + f"\n\n◆ Ver: {cat_m} (Mistborn)\n◆ Ver: {enlace} (Stormlight)"
            previa["ambientacion"] = "Cosmere"
            previa["libro"] = LIBRO_COMUN
            continue
        prefijo = "Pericia especializada en" if esp else "Pericia en"
        clase = "especializada-" if esp else ("arma-" if e["cat"] == "arma" else "armadura-")
        nuevas.append({"cat": "pericia", "title": f"{prefijo} {nombre}", "path": ["Capítulo 3 · Características", tipo],
                       "pages": e["pages"], "body": texto + f"\n\nVer: {enlace}", "id": "origen-stormlight-pericia-" + clase + _slug(nombre),
                       "ambientacion": AMBIENTACION, "libro": LIBRO,
                       "f": {"tipo": tipo, "pericia": nombre, "modifica": ["Pericias"]}})
    return nuevas


LIBRO_COMUN = "Manual del Juego"
