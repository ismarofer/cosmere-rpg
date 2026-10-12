#!/usr/bin/env python3
"""Genera los datos del buscador (docs/data/*.js) a partir de resources/*.md.

Uso: python tools/build-buscador.py [--report]

Salida:
  docs/data/base.js   -> window.DATA_BASE  (público)
  docs/data/dj.js     -> window.DATA_DJ    (Modo DJ: adversarios, módulos, Legado)

Qué hace:
  - Parte cada .md en entradas por encabezado (texto buscable).
  - Detecta catálogos con campos: talentos, acciones/reacciones, estados, habilidades,
    adversarios (stat blocks), equipo, metales y viales.
  - Armas y armaduras vienen de tablas muy aplanadas: se transcriben en CURATED_* (revisar
    contra el libro si se corrige algo).
  - Rasgos de armas/armaduras: se cortan del texto de "Rasgos de las armas/armaduras".
"""
import json, re, sys, unicodedata
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from buscador_efectos import aplicar as aplicar_efectos, OBJ_NOMBRE
from buscador_guia import glosario, limpia_guia
from buscador_personaje import redirige_modificadores, reorganizar
from buscador_reglas import build_reglas
from buscador_extras import build_mini, build_creacion, build_habilidades_investidas, apply_ambientacion, aplicar_eras, es_basura, link_talents, split_ascendencias

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / "resources"
OUT = ROOT / "docs" / "data"

MANUAL = RES / "Mistborn Manual"
GUIA = RES / "Mistborn Guia del Mundo"
LEGADO = RES / "Nacidos de la Bruma Legado"

# --------------------------------------------------------------------------- utilidades

def norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower()

def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", norm(s)).strip("-")[:70] or "x"

def read_md(path):
    txt = path.read_text(encoding="utf-8")
    txt = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", txt)  # glifos de iconos del PDF
    meta = {}
    m = re.match(r"---\n(.*?)\n---\n", txt, re.S)
    if m:
        for line in m.group(1).splitlines():
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip().strip('"')
        txt = txt[m.end():]
    return meta, txt

ERA_RE = re.compile(r"\bERA\s*([12])\b", re.I)

def find_era(*texts):
    eras = set()
    for t in texts:
        for m in ERA_RE.finditer(t or ""):
            eras.add(m.group(1))
    if len(eras) == 1:
        return "Era " + eras.pop()
    return "Ambas"

def strip_era(t):
    return re.sub(r"\s*\bERA\s*[12]\b\s*[.:]?", " ", t, flags=re.I).strip(" .")

def clean_title(t):
    t = re.sub(r"\s+", " ", t.strip())
    sin_era = strip_era(t)
    if re.search(r"\b(?:de|en|la|las|el|los|del|a|para|y|o)$", sin_era, re.I):
        return t.strip(" .")  # "…de la Era 1": quitar la era dejaría el título cortado
    return sin_era

def to_num(s):
    m = re.search(r"\d[\d.,]*", s or "")
    if not m:
        return None
    return float(m.group(0).replace(",", "."))

# --------------------------------------------------------------------------- limpieza de líneas

FOOTER = re.compile(r"^#{0,6}\s*Capítulo\s+\d+\s*:.*$", re.I)
APPENDIX_FOOTER = re.compile(r"^#{0,6}\s*Apéndice\s+[A-C]\s*:.*\d+\s*$", re.I)
CAPS_LINE = re.compile(r"^[A-ZÁÉÍÓÚÑÜ0-9 ,.'’:&\-–¡!¿?«»Y]{5,}$")

def is_junk_line(line):
    s = line.strip()
    if not s:
        return False
    if FOOTER.match(s) or APPENDIX_FOOTER.match(s):
        return True
    body = s.lstrip("# ").strip()
    if body and CAPS_LINE.match(body) and len(body) >= 5 and not re.search(r"[a-záéíóú]", body):
        # créditos de artista, rótulos de página, pies en mayúsculas
        if s.startswith("#") or len(body.split()) <= 8:
            return True
    return False

def is_caption_heading(title):
    """Pies de ilustración y rótulos de página que el PDF convierte en encabezados."""
    t = title.strip()
    if t.upper().startswith("PÁGINA ANTERIOR") or len(t) > 80:
        return True
    if len(t) > 70 and t.endswith("."):
        return True
    first = t.lstrip("★ ")[:1]
    if first.isalpha() and first.islower() and len(t) > 25:
        return True  # listas de objetos en minúscula bajo las ilustraciones
    letters = [c for c in t if c.isalpha()]
    if len(letters) > 15 and sum(c.isupper() for c in letters[1:]) > 0.6 * (len(letters) - 1):
        return True
    return False

HEAD = re.compile(r"^(#{1,6})\s+(.*?)\s*$")
COST_HEAD = re.compile(r"^(.+?)\s*\(\s*([0-3]\*?|[rR])\s*\)\s*$")
TALENT_BODY = re.compile(r"^\s*(?:\*\*)?Prerrequisitos?:", re.I)

# --------------------------------------------------------------------------- troceado en chunks

def split_chunks(txt, known=()):
    """Devuelve [{level,title,lines,start}] cortando por encabezados.
    Niveles 1-3 siempre cortan; el nivel 4+ corta solo si es talento o acción (coste)."""
    raw = txt.splitlines()
    heads = []
    for i, line in enumerate(raw):
        m = HEAD.match(line)
        if not m:
            continue
        lvl, title = len(m.group(1)), m.group(2)
        if is_junk_line(line) or is_caption_heading(title):
            continue
        nxt = ""
        for j in range(i + 1, min(i + 4, len(raw))):
            if raw[j].strip():
                nxt = raw[j]
                break
        is_talent = bool(TALENT_BODY.match(nxt)) or (lvl == 4 and norm(re.sub(r"^\d\s+", "", clean_title(title.replace("★", "")).strip())) in known)
        is_action = bool(COST_HEAD.match(re.sub(r"\s*\bERA\s*[12]\b", "", title)))
        if lvl <= 3 or is_talent or is_action:
            heads.append((i, lvl, title))
    chunks = []
    first = heads[0][0] if heads else len(raw)
    pre = [l for l in raw[:first] if not is_junk_line(l)]
    if "".join(pre).strip():
        chunks.append({"level": 0, "title": None, "lines": pre, "start": 0})
    for k, (i, lvl, title) in enumerate(heads):
        end = heads[k + 1][0] if k + 1 < len(heads) else len(raw)
        lines = [l for l in raw[i + 1:end] if not is_junk_line(l)]
        chunks.append({"level": lvl, "title": title, "lines": lines, "start": i})
    return chunks

def body_text(lines):
    out, blank = [], True
    for l in lines:
        s = l.rstrip()
        if not s.strip():
            if not blank:
                out.append("")
            blank = True
            continue
        out.append(s)
        blank = False
    return "\n".join(out).strip()

# --------------------------------------------------------------------------- catálogo de salida

ENTRIES = []          # base
DJ_ENTRIES = []       # modo DJ
_ids = {}

def add(entry, gated=False):
    entry.setdefault("era", "Ambas")
    entry.setdefault("f", {})
    (DJ_ENTRIES if gated else ENTRIES).append(entry)
    return entry

def squash(s):
    return re.sub(r"\W+", " ", norm(s)).strip()

def dedupe(entries):
    """Los .md repiten páginas compartidas entre secciones: quita entradas duplicadas o contenidas en otra."""
    groups = {}
    for e in entries:
        groups.setdefault((e["cat"], norm(e["title"]), e["f"].get("origen", "") if e["cat"] == "talento" else ""), []).append(e)
    drop = set()
    for g in groups.values():
        if len(g) < 2:
            continue
        nb = [(e, squash(e["body"])) for e in g]
        for i, (a, na) in enumerate(nb):
            for j, (b, nbb) in enumerate(nb):
                if i == j or id(b) in drop:
                    continue
                shorter = len(na) < len(nbb) or (len(na) == len(nbb) and i > j)
                if shorter and na and (na in nbb or na[:150] == nbb[:150]):
                    drop.add(id(a))
                    break
    return [e for e in entries if id(e) not in drop]

def finalize(entries):
    ids = {}
    for e in entries:
        base = e["cat"] + "-" + slug(e["title"])
        n = ids.get(base, 0)
        ids[base] = n + 1
        e["id"] = base if n == 0 else f"{base}-{n + 1}"
    return entries

CHAPTER_CAT = {
    "01": ("personaje", "Introducción"),
    "02": ("personaje", "Capítulo 1 · Creación de personajes"),
    "03": ("origen", "Capítulo 2 · Orígenes"),
    "04": ("personaje", "Capítulo 3 · Características"),
    "05": ("camino", "Capítulo 4 · Caminos heroicos"),
    "06": ("camino", "Capítulo 5 · Caminos de nacidos del metal"),
    "07": ("arte", "Capítulo 6 · Artes metálicas"),
    "08": ("objeto", "Capítulo 7 · Objetos"),
    "09": ("recompensa", "Capítulo 8 · Metas y recompensas"),
    "10": ("descanso", "Capítulo 9 · Aventuras"),
    "11": ("combate", "Capítulo 10 · Combate"),
    "12": ("conversacion", "Capítulo 11 · Conversaciones"),
    "13": ("empeno", "Capítulo 12 · Empeños"),
    "14": ("direccion", "Capítulo 13 · Dirección del juego"),
    "16": ("recompensa", "Apéndice · Compañeros animales"),
}

ATTR_TYPE = {"Fuerza": "Física", "Velocidad": "Física", "Intelecto": "Cognitiva",
             "Voluntad": "Cognitiva", "Discernimiento": "Espiritual", "Presencia": "Espiritual"}

ESTADOS = {"Concentrado", "Desorientado", "Desprovisto", "Afligido", "Agotado", "Ralentizado",
           "Resuelto", "Retenido", "Sorprendido", "Tumbado", "Inconsciente", "Inmovilizado",
           "Mejorado", "Mermado"}

ACTIVACION = {"1": "1 acción", "2": "2 acciones", "3": "3 acciones", "0": "Acción gratuita",
              "r": "Reacción", "R": "Reacción", "*": "Especial", "8": "Siempre activo"}

SKILLS = ["Agilidad", "Armamento ligero", "Armamento pesado", "Atletismo", "Engaño", "Deducción",
          "Diplomacia", "Disciplina", "Hurto", "Intimidación", "Liderazgo", "Manufactura", "Medicina",
          "Percepción", "Perspicacia", "Persuasión", "Saber", "Sigilo", "Supervivencia", "Feruquimia",
          "Alomancia", "Hemalurgia", "Pilotaje"]

def parse_talent(title, body, source_label, source_kind, pages, path, extra_map):
    joined = " ".join(body.split("\n")[:6])
    m = re.search(r"Prerrequisitos?:\s*(.*?)\s*Activaci[oó]n:\s*\[?([^\s\]]+)", joined)
    prereq, act = ("", "")
    if m:
        prereq, act = m.group(1).strip(), m.group(2).strip()
    else:
        m2 = re.search(r"Prerrequisitos?:\s*(.*)", joined)
        prereq = m2.group(1)[:120].strip() if m2 else ""
    skill, degrees = "", None
    ms = re.search(r"([A-ZÁÉÍÓÚ][A-Za-záéíóúñ ]+?)\s+(\d)\s+o más", prereq)
    if ms:
        skill, degrees = ms.group(1).strip(), int(ms.group(2))
    t = clean_title(title)
    t = re.sub(r"^[\d★\s]+(?=[A-Za-zÁÉÍÓÚÑ])", "", t)  # la cifra del icono de acción se cuela en algunos encabezados
    star = "★" in title
    t = t.replace("★", "").strip()
    info = extra_map.get(norm(t), {})
    esp = info.get("esp", "")
    if norm(esp) == norm(source_label):
        esp = ""
    return {
        "cat": "talento", "title": t, "path": path, "pages": pages,
        "era": find_era(title),
        "f": {"origen": source_label, "tipo_origen": source_kind,
              "especialidad": esp, "especialidades": info.get("esps") or ([esp] if esp else []), "clave": "★" if (star or info.get("star")) else "",
              "prerrequisito": prereq or "—", "habilidad": skill, "grados": degrees,
              "activacion": ACTIVACION.get(act, act or "—")},
    }

SPEC_ORDER = {  # en estos caminos el encabezado de la 1.ª especialidad se pierde: se asigna por grupos de 8 en orden de aparición
    "Agente": ["Investigador", "Rebelde", "Ladrón"],
    "Cazador": ["Francotirador", "Rastreador", "Mataneblinos"],
    "Enviado": ["Estafador", "Mentor", "Fiel"],
    "Erudito": ["Cirujano", "Inventor", "Estratega"],
}

def tree_map(txt, ftitle=""):
    """Mapa nombre-de-talento -> {esp, star} a partir del árbol del camino (# especialidad / #### talento)."""
    mp, cur = {}, ""
    order = SPEC_ORDER.get(ftitle.strip())
    seen = []
    for line in txt.splitlines():
        h = HEAD.match(line)
        if not h:
            continue
        lvl, title = len(h.group(1)), h.group(2)
        if order and lvl == 2 and clean_title(title).startswith("Especialidad de"):
            break
        if lvl == 1 and re.match(r"(C[oó]mo usar|Cap[ií]tulo)", clean_title(title), re.I):
            break
        if lvl == 1:
            tl = strip_era(title).strip()
            tl = re.sub(r"\s+[A-ZÁÉÍÓÚ]{4,}$", "", tl)  # "estratega ERUDITO"
            cur = tl.lower().capitalize() if tl else ""
        elif lvl == 4 and (cur or order):
            star = "★" in title
            name = clean_title(title.replace("★", "")).strip()
            name = re.sub(r"^\d\s+", "", name)
            if order:
                if not name or len(name.split()) > 5 or re.search(r"\bERA\b|Cap[ií]tulo", name, re.I) or norm(name) in seen:
                    continue
                seen.append(norm(name))
                if len(seen) <= 8 * len(order):
                    mp[norm(name)] = {"esp": order[(len(seen) - 1) // 8], "star": star}
            elif name and len(name.split()) <= 5 and len(name) < 50:
                prev_e = mp.get(norm(name))
                if prev_e:  # talento compartido por varias especialidades
                    if cur not in prev_e["esps"]:
                        prev_e["esps"].append(cur)
                else:
                    mp[norm(name)] = {"esp": cur, "esps": [cur], "star": star}
    return mp

TALENTS = {}
OWN = {}

def process_manual():
    for chdir in sorted(MANUAL.iterdir()):
        if not chdir.is_dir():
            continue
        num = chdir.name[:2]
        if num not in CHAPTER_CAT:
            continue  # glosario, agradecimientos, hojas, otro secreto
        cat0, chapter_label = CHAPTER_CAT[num]
        for f in sorted(chdir.glob("*.md")):
            meta, txt = read_md(f)
            ftitle = clean_title(meta.get("title", f.stem))
            pages = meta.get("pages", "")
            tmap = tree_map(txt, ftitle) if num in ("05", "06", "07") else {}
            chunks = split_chunks(txt, tmap)
            prev = None
            # la maquetación a doble columna deja los primeros talentos de la 1.ª especialidad antes de su encabezado
            cur_spec = ""
            for c in chunks:
                m0 = re.match(r"^Especialidad de (.+)$", clean_title(c["title"] or ""))
                if m0 and c["level"] == 2:
                    cur_spec = m0.group(1).strip()
                    break
            for c in chunks:
                title = c["title"] or ftitle
                mspec = re.match(r"^Especialidad de (.+)$", clean_title(title))
                if mspec and c["level"] == 2:
                    cur_spec = mspec.group(1).strip()
                elif clean_title(title).lower().startswith("talento principal"):
                    cur_spec = "Principal"
                body = body_text(c["lines"])
                if c["level"] == 0 and len(chunks) > 1:
                    continue  # cola de la sección anterior (maquetación a doble columna)
                if c["level"] == 0 and len(body) < 120:
                    continue
                clean_t = clean_title(title)
                path = [chapter_label, ftitle] if clean_t != ftitle else [chapter_label]
                if c["title"] and clean_t != ftitle and c["level"] >= 2:
                    pass
                # --- talentos
                if TALENT_BODY.match(body) or (c["level"] == 4 and norm(re.sub(r"^\d\s+", "", clean_title(title.replace("★", "")).strip())) in tmap and len(body) > 40):
                    kind = {"05": "Camino heroico", "06": "Camino de nacido del metal",
                            "07": "Arte metálica", "03": "Ascendencia/Cultura"}.get(num, "Otro")
                    e = parse_talent(title, body, ftitle, kind, pages, [chapter_label, ftitle],
                                     tmap if num == "05" else {})
                    e["body"] = body
                    # La especialidad no se puede deducir de forma fiable (columnas desordenadas): solo el talento principal
                    if "(principal" in title.lower():
                        e["f"]["especialidad"] = "Principal"
                    if kind == "Arte metálica":
                        mm = re.match(r"^(Alomancia|Feruquimia|Hemalurgia)\s+de\s+(.+)$", ftitle)
                        e["f"]["arte"] = mm.group(1) if mm else ftitle
                        e["f"]["metal"] = mm.group(2) if mm else ""
                    key = (kind, ftitle, norm(e["title"]))
                    old = TALENTS.get(key)
                    if old is None:
                        TALENTS[key] = e
                    else:
                        # el mismo talento aparece en el árbol (resumen) y en la descripción completa
                        best, other = (e, old) if (e["f"]["activacion"] != "—" and old["f"]["activacion"] == "—") or                             (len(e["body"]) > len(old["body"]) and (e["f"]["activacion"] != "—") == (old["f"]["activacion"] != "—")) else (old, e)
                        if other["f"]["especialidad"] and not best["f"]["especialidad"]:
                            best["f"]["especialidad"] = other["f"]["especialidad"]
                        if other["f"]["clave"] and not best["f"]["clave"]:
                            best["f"]["clave"] = other["f"]["clave"]
                        if other["body"] != best["body"]:
                            best["_resumen"] = other["body"]
                        TALENTS[key] = best
                    prev = None
                    continue
                # --- acciones / reacciones
                m = COST_HEAD.match(re.sub(r"\s*\bERA\s*[12]\b", "", title).strip())
                if m and (num in ("11", "06", "09")):
                    cost = m.group(2).lower()
                    tipo = "Reacción" if cost == "r" else ("Acción gratuita" if cost == "0" else "Acción")
                    add({"cat": "accion", "title": clean_title(m.group(1)), "path": [chapter_label, ftitle],
                         "pages": pages, "body": body, "era": find_era(title),
                         "f": {"coste": {"r": "r"}.get(cost, cost), "tipo": tipo,
                               "contexto": ftitle}})
                    prev = None
                    continue
                # --- estados
                if f.stem.endswith("Estados") and clean_t in ESTADOS and c["level"] == 2:
                    add({"cat": "estado", "title": clean_t, "path": [chapter_label, "Estados"],
                         "pages": pages, "body": body, "f": {}})
                    prev = None
                    continue
                # --- habilidades
                ms = re.match(r"^(.+?)\s*\(([A-Za-zñé]+)\)$", clean_t)
                if num == "04" and ms and ms.group(2) in ATTR_TYPE and c["level"] == 2:
                    attr = ms.group(2)
                    add({"cat": "habilidad", "title": ms.group(1).strip(),
                         "path": [chapter_label, "Habilidades"], "pages": pages, "body": body,
                         "f": {"atributo": attr, "defensa": ATTR_TYPE[attr]}})
                    prev = None
                    continue
                # --- resto de texto
                if len(body) < 150:
                    if c["level"] >= 3 and prev is not None and len(body) >= 40:
                        prev["body"] += f"\n\n#### {clean_t}\n{body}"
                    continue
                cat = cat0
                if norm(clean_t) == norm(ftitle) and c["level"] >= 1:
                    # varios fragmentos con el nombre de la propia sección (p. ej. intro + tabla): se unen
                    own = OWN.get((f, norm(clean_t)))
                    if own is not None:
                        own["body"] += "\n\n" + body
                        prev = own
                        continue
                # Capítulo 7: las tablas de armas/armaduras/equipo van a catálogos curados;
                # su texto sigue disponible como 'objeto'
                prev = add({"cat": cat, "title": clean_t, "path": path, "pages": pages, "body": body,
                            "era": find_era(title), "f": {"seccion": ftitle}})
                if norm(clean_t) == norm(ftitle) and c["level"] >= 1:
                    OWN[(f, norm(clean_t))] = prev
    for e in TALENTS.values():
        # la línea "Prerrequisito: … Activación: X" ya está en los campos: fuera del cuerpo
        e["body"] = re.sub(r"^\s*Prerrequisitos?:.{0,260}?Activaci[oó]n:\s*\S+\s*", "", e["body"], flags=re.S).strip() or e["body"]
        # a veces el texto de la siguiente tarjeta o un pie de ilustración se cuela dentro del cuerpo
        e["body"] = re.split(r"(?:^|\s)#{3,4}\s", e["body"])[0].strip() or e["body"]
        res = e.pop("_resumen", "")
        if res:
            # la tarjeta resumida del árbol del libro a veces conserva texto que la descripción larga pierde por la maquetación
            res = res.split("\n\n####")[0]
            res = re.sub(r"^\s*Prerrequisitos?:.{0,260}?Activaci[oó]n:\s*\S+\s*", "", res, flags=re.S).strip()
            res = re.sub(r"^\s*Prerrequisitos?:\s*ninguno\s*", "", res)
            res = re.sub(r"^\s*Prerrequisitos?:\s*[^.\n]*?\bo más\s+", "", res).strip()
        else:
            res = ""
        # primer párrafo = descripción temática; el resto = mecánica (si la maquetación la cortó, se usa la tarjeta del árbol)
        paras = [p.strip() for p in re.split(r"\n\s*\n", e["body"]) if p.strip()]
        theme, mech = (paras[0], "\n\n".join(paras[1:])) if paras else ("", "")
        if res and len(res) > 40 and (not mech or (len(res) > len(mech) and squash(res)[:60] not in squash(mech))):
            mech = res
        e["body"] = theme or e["body"]
        if mech:
            mech = re.split(r"\n\s*\n(?=Al subir de nivel)", mech)[0].strip()
            e["mecanica"] = mech
        res = re.sub(r"^\s*Prerrequisitos?:\s*.{0,60}?(?=\s+(?:Mientras|Cuando|Al|Si|Tus|Tu|Obtienes|Usa|Puedes|Elige)\b)", "", res).strip() if res.startswith("Prerrequisito") else res
        if res and len(res) > 20:
            e["resumen"] = res
        elif mech:
            e["resumen"] = re.split(r"\n\s*\n", mech)[0].strip()
        add(e)

# --------------------------------------------------------------------------- objetos (curado + parseo)

W = "Armamento ligero"
H = "Armamento pesado"
# nombre, habilidad, familia, alcance(cuerpo/distancia + texto), daño, tipo, rasgos, experto, peso, precio, era
CURATED_WEAPONS = [
    ("Bastón de madera", W, "Ligera", "Cuerpo a cuerpo", "1d6", "golpe", "Discreta, A dos manos", "Defensiva", "2 kg", "5 ar", "Ambas"),
    ("Cuchillo", W, "Ligera", "Cuerpo a cuerpo", "1d4", "laceración", "Discreta", "Mano secundaria, Arrojadiza [6/18]", "500 g", "2 ar", "Ambas"),
    ("Daga de cristal", W, "Ligera", "Cuerpo a cuerpo", "1d4", "laceración", "Discreta, Frágil", "Mano secundaria, Arrojadiza [6/18]", "250 g", "50 ar", "Ambas"),
    ("Espada lateral", W, "Ligera", "Cuerpo a cuerpo", "1d6", "laceración", "Preparación rápida", "Mano secundaria", "1 kg", "15 ar", "Ambas"),
    ("Lanza corta", W, "Ligera", "Cuerpo a cuerpo", "1d8", "laceración", "A dos manos", "Única: pierde el rasgo A dos manos", "1,5 kg", "5 ar", "Ambas"),
    ("Maza", W, "Ligera", "Cuerpo a cuerpo", "1d6", "golpe", "—", "Inercia", "1,5 kg", "10 ar", "Ambas"),
    ("Arco corto", W, "Ligera", "A distancia [24/96]", "1d6", "laceración", "A dos manos", "Preparación rápida", "1 kg", "40 ar", "Ambas"),
    ("Honda", W, "Ligera", "A distancia [9/36]", "1d4", "golpe", "Discreta", "Indirecta", "500 g", "1 ar", "Ambas"),
    ("Alabarda", H, "Pesada", "Cuerpo a cuerpo", "1d10", "laceración", "A dos manos", "Única: Cuerpo a cuerpo [+1,5]", "2,5 kg", "20 ar", "Ambas"),
    ("Escudo", H, "Pesada", "Cuerpo a cuerpo", "1d4", "golpe", "Defensiva", "Mano secundaria", "1 kg", "5 ar", "Ambas"),
    ("Escudo de madera", H, "Pesada", "Cuerpo a cuerpo", "1d6", "golpe", "Defensiva, A dos manos", "Única: pierde el rasgo A dos manos", "2 kg", "50 ar", "Ambas"),
    ("Espada larga", H, "Pesada", "Cuerpo a cuerpo", "1d8", "laceración", "Preparación rápida, A dos manos", "Única: pierde el rasgo A dos manos", "1,5 kg", "30 ar", "Ambas"),
    ("Hacha", H, "Pesada", "Cuerpo a cuerpo", "1d6", "laceración", "Arrojadiza [6/18]", "Mano secundaria", "1 kg", "10 ar", "Ambas"),
    ("Hacha de obsidiana", H, "Pesada", "Cuerpo a cuerpo", "1d6", "laceración", "Frágil", "Mano secundaria", "500 g", "100 ar", "Ambas"),
    ("Lanza larga", H, "Pesada", "Cuerpo a cuerpo [+1,5]", "1d8", "laceración", "A dos manos", "Defensiva", "4,5 kg", "20 ar", "Ambas"),
    ("Martillo", H, "Pesada", "Cuerpo a cuerpo", "1d10", "golpe", "A dos manos", "Inercia", "4 kg", "30 ar", "Ambas"),
    ("Arco largo", H, "Pesada", "A distancia [45/180]", "1d6", "laceración", "A dos manos", "Indirecta", "1,5 kg", "75 ar", "Ambas"),
    ("Ballesta", H, "Pesada", "A distancia [30/120]", "1d8", "laceración", "Cargada [1], A dos manos", "Mortífera", "3,5 kg", "100 ar", "Ambas"),
    # armas especiales
    ("Bastón de duelo", "Armamento pesado o ligero", "Especial", "Cuerpo a cuerpo", "1d8", "golpe", "Discreta, Única", "Mano secundaria", "1,5 kg", "40 ar", "Ambas"),
    ("Hoja koloss", H, "Especial", "Cuerpo a cuerpo [+1,5]", "1d12", "golpe", "Voluminosa [6], Peligrosa, Mortífera, A dos manos, Única", "Única: pierde el rasgo Peligrosa, el daño pasa a ser 1d20 golpe", "100 kg", "Solo recompensa", "Ambas"),
    ("Palo de ruido", W, "Especial", "Cuerpo a cuerpo", "1d4", "golpe", "Frágil, Única", "Mano secundaria", "250 g", "100 ar", "Ambas"),
    ("Ataque sin armas", "Atletismo", "Especial", "Cuerpo a cuerpo", "Única (según Fuerza)", "golpe", "Única", "Inercia, Mano secundaria", "No pesa", "—", "Ambas"),
    ("Arma improvisada", "La misma que un arma similar", "Especial", "Cuerpo a cuerpo", "El mismo que un arma similar", "—", "Frágil, Única", "Única", "—", "—", "Ambas"),
    # armas de fuego (Era 2)
    ("Granada de fragmentación", W, "De fuego (ligera)", "A distancia [6/18]", "2d4", "laceración", "Explosiva [5], Peligrosa, Perforante, Desechable, Arrojadiza [6/18]", "Única: pierde el rasgo Peligrosa", "250 g", "75 ar", "Era 2"),
    ("Fusil de caza", W, "De fuego (ligera)", "A distancia [45/180]", "1d8", "laceración", "Cargada [1], Perforante, A dos manos", "Única: Cargada [3] en lugar de Cargada [1]", "2,5 kg", "400 ar", "Era 2"),
    ("Pistola de bota", W, "De fuego (ligera)", "A distancia [6/12]", "1d4", "laceración", "Discreta, Cargada [1], Perforante", "Preparación rápida", "250 g", "125 ar", "Era 2"),
    ("Pistola de cañón corto", W, "De fuego (ligera)", "A distancia [6/18]", "1d4", "laceración", "Cargada [6], Perforante", "Discreta, Mano secundaria", "500 g", "175 ar", "Era 2"),
    ("Revólver", W, "De fuego (ligera)", "A distancia [6/24]", "1d6", "laceración", "Cargada [6], Perforante, A dos manos", "Única: pierde el rasgo A dos manos", "500 g", "250 ar", "Era 2"),
    ("Granada de conmoción", H, "De fuego (pesada)", "A distancia [6/18]", "2d6", "golpe", "Explosiva [10], Peligrosa, Desechable, Arrojadiza [6/18]", "Única: pierde el rasgo Peligrosa", "250 g", "50 ar", "Era 2"),
    ("Cañón de mano", H, "De fuego (pesada)", "A distancia [6/24]", "1d8", "laceración", "Cargada [6], Perforante, A dos manos", "Única: pierde el rasgo A dos manos", "1 kg", "300 ar", "Era 2"),
    ("Carabina", H, "De fuego (pesada)", "A distancia [24/96]", "1d8", "laceración", "Cargada [4], Perforante, A dos manos", "Única: Cargada [4] pasa a ser Cargada [8]", "3,5 kg", "750 ar", "Era 2"),
    ("Escopeta", H, "De fuego (pesada)", "A distancia [6/18]", "1d10", "laceración", "Peligrosa, Cargada [2], Perforante, A dos manos", "Explosiva [5]", "3,5 kg", "600 ar", "Era 2"),
    ("Fusil de cerrojo", H, "De fuego (pesada)", "A distancia [45/180]", "1d10", "laceración", "Cargada [1], Perforante, A dos manos", "Única: el alcance pasa a ser [75/300]", "4,5 kg", "600 ar", "Era 2"),
    ("Dinamita (1 cartucho)", H, "De fuego (especial)", "Cuerpo a cuerpo", "4d6", "golpe", "Explosiva [9], Peligrosa, Desechable, Arrojadiza [6/18], Única", "Única", "250 g", "100 ar", "Era 2"),
    ("Ametralladora rotatoria", H, "De fuego (especial)", "A distancia [6/18]", "3d4", "laceración", "Voluminosa [6], Peligrosa, Cargada [20], Perforante, A dos manos, Única", "Única: pierde el rasgo Peligrosa", "85 kg", "2500 ar", "Era 2"),
]

# nombre, desvío, rasgos, experto, peso, precio, era
CURATED_ARMOR = [
    ("Uniforme", 0, "Presentable", "—", "2,5 kg", "20 ar", "Ambas"),
    ("Capa de bruma", 0, "Única", "Única", "2,5 kg", "Solo recompensa", "Ambas"),
    ("Cuero", 1, "—", "Presentable", "5 kg", "30 ar", "Ambas"),
    ("Gabán de bruma", 1, "Presentable", "Única", "5 kg", "Solo recompensa", "Era 2"),
    ("Coraza", 2, "Voluminosa [3]", "Presentable", "15 kg", "50 ar", "Ambas"),
    ("Coraza de cerámica", 2, "Voluminosa [3], Frágil", "Única: Voluminosa [2] en lugar de Voluminosa [3]", "10 kg", "250 ar", "Ambas"),
    ("Armadura de placas y malla", 3, "Voluminosa [4]", "Única: Voluminosa [3] en lugar de Voluminosa [4]", "20 kg", "200 ar", "Ambas"),
    ("Armadura de madera", 3, "Voluminosa [5], Frágil", "Única: pierde el rasgo Frágil", "15 kg", "1000 ar", "Ambas"),
]

def grams(s):
    """'2,5 kg' -> 2500; '1 a 2 kg' -> 1000 (mínimo); 'No pesa' -> 0"""
    if not s or s in ("—",):
        return None
    if "no pesa" in s.lower():
        return 0
    m = re.search(r"(\d[\d,]*)(?:\s*(kg|g))?(?:\s*a\s*\d[\d,]*)?\s*(kg|g)", s)
    if not m:
        return None
    n = float(m.group(1).replace(",", "."))
    unit = m.group(2) or m.group(3)
    return int(n * (1000 if unit == "kg" else 1))

def price(s):
    if not s or s.startswith(("Solo", "—", "No dis")):
        return None
    return to_num(s)

def split_list(s):
    if not s or s == "—":
        return []
    parts, depth, cur = [], 0, ""
    for ch in s:
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur.strip())
            cur = ""
        else:
            cur += ch
    if cur.strip():
        parts.append(cur.strip())
    return parts

def trait_names(lst):
    return [re.sub(r"\s*\[.*?\]", "", t).split(":")[0].strip() for t in lst]

def cut_traits(text, names):
    """Parte un párrafo corrido 'A dos manos. xxx Arrojadiza [X/Y]. yyy ...' por nombre de rasgo."""
    res, pos = {}, 0
    marks = []
    for n in names:
        m = re.compile(rf"(?:(?<=[.!?] )|^|(?<=\n)){re.escape(n)}(?: \[[^\]]*\])?\.\s").search(text, pos)
        if m:
            marks.append((n, m.start(), m.end()))
            pos = m.end()
    for i, (n, s, e) in enumerate(marks):
        end = marks[i + 1][1] if i + 1 < len(marks) else len(text)
        res[n] = re.sub(r"\s+", " ", text[e:end]).strip()
    return res

def process_objects():
    objdir = next(MANUAL.glob("08 - *"))
    armas_md = (objdir / "03 - Armas.md").read_text(encoding="utf-8")
    armad_md = (objdir / "05 - Armaduras.md").read_text(encoding="utf-8")
    equipo_md = (objdir / "06 - Equipo.md").read_text(encoding="utf-8")
    meta_a, _ = read_md(objdir / "03 - Armas.md")
    meta_ar, _ = read_md(objdir / "05 - Armaduras.md")
    meta_e, _ = read_md(objdir / "06 - Equipo.md")

    # rasgos de armas (el texto viene partido en dos párrafos por la maquetación a doble columna)
    wtraits, atraits = {}, {}
    m = re.search(r"## Rasgos de las armas\n(.*?)\n###", armas_md, re.S)
    if m:
        wtraits = cut_traits(m.group(1), ["A dos manos", "Arrojadiza", "Cargada", "Defensiva", "Desechable",
                                          "Discreta", "Explosiva", "Frágil", "Indirecta"])
    m = re.search(r"^(Inercia\. .*)$", armas_md, re.M)
    if m:
        wtraits.update(cut_traits(m.group(1), ["Inercia", "Mano secundaria", "Mortífera", "Peligrosa",
                                               "Perforante", "Preparación rápida", "Única", "Voluminosa"]))
    m = re.search(r"^(Frágil\. Al sufrir.*)$", armad_md, re.M)
    if m:
        atraits = cut_traits(m.group(1), ["Frágil", "Presentable", "Única", "Voluminosa"])
    dup = set(wtraits) & set(atraits)
    for n, t in sorted(wtraits.items()):
        add({"cat": "rasgo", "title": n + (" (arma)" if n in dup else ""),
             "path": ["Capítulo 7 · Objetos", "Rasgos de las armas"],
             "pages": meta_a.get("pages", ""), "body": t, "f": {"aplica": "Armas", "nombre": n}})
    for n, t in sorted(atraits.items()):
        add({"cat": "rasgo", "title": n + (" (armadura)" if n in dup else ""),
             "path": ["Capítulo 7 · Objetos", "Rasgos de las armaduras"],
             "pages": meta_ar.get("pages", ""), "body": t, "f": {"aplica": "Armaduras", "nombre": n}})

    # armas
    for (n, skill, fam, rng, dmg, dtype, tr, exp, peso, prec, era) in CURATED_WEAPONS:
        melee = "Cuerpo a cuerpo" if rng.startswith("Cuerpo") else "A distancia"
        rm = re.search(r"\[(\d+)/(\d+)\]", rng)
        trs = split_list(tr)
        exs = split_list(exp)
        add({"cat": "arma", "gen": 1, "title": n, "path": ["Capítulo 7 · Objetos", "Armas"],
             "pages": "261-267" if fam != "De fuego (ligera)" and "fuego" not in fam else "267-270",
             "era": era, "body": f"{n}. {fam}. Habilidad: {skill}. Daño: {dmg} {dtype}. Alcance: {rng}. "
                                   f"Rasgos: {tr}. Rasgos de experto: {exp}. Peso: {peso}. Precio: {prec}.",
             "f": {"familia": fam, "habilidad": skill, "tipo": melee, "dano": f"{dmg} {dtype}".strip(),
                   "dado": dmg, "tipo_dano": dtype, "alcance": rng,
                   "alcance_corto": int(rm.group(1)) if rm else None,
                   "alcance_largo": int(rm.group(2)) if rm else None,
                   "rasgos": trait_names(trs), "rasgos_txt": tr,
                   "experto": exp, "peso": peso, "peso_g": grams(peso),
                   "precio": prec, "precio_n": price(prec)}})
    # armaduras
    for (n, dv, tr, exp, peso, prec, era) in CURATED_ARMOR:
        add({"cat": "armadura", "gen": 1, "title": n, "path": ["Capítulo 7 · Objetos", "Armaduras"],
             "pages": meta_ar.get("pages", ""), "era": era,
             "body": f"{n}. Valor de desvío {dv}. Rasgos: {tr}. Rasgos de experto: {exp}. Peso: {peso}. Precio: {prec}.",
             "f": {"desvio": dv, "rasgos": trait_names(split_list(tr)), "rasgos_txt": tr, "experto": exp,
                   "peso": peso, "peso_g": grams(peso), "precio": prec, "precio_n": price(prec)}})

    # equipo (parseado de la tabla)
    row = re.compile(r"^(?P<n>.+?) (?P<w>\d[\d,]*(?: (?:kg|g))?(?: a \d[\d,]* (?:kg|g))?(?: \(vacío\))?) "
                     r"(?P<p>\d[\d,]*(?: a \d[\d,]*)? ar)$")
    lines = [l.strip() for l in equipo_md.splitlines()]
    desc = {}
    for l in lines:
        mm = re.match(r"^([A-ZÁÉÍÓÚ][A-Za-záéíóúñ ]{2,30})\. (.{30,})$", l)
        if mm and not row.match(l):
            desc.setdefault(norm(mm.group(1)), mm.group(2))
    count = 0
    for l in lines:
        mm = row.match(l)
        if not mm or l.startswith("Nombre"):
            continue
        name = mm.group("n")
        starred = name.endswith("*")
        name = name.rstrip("*").strip()
        base = re.sub(r"\s*\(.*?\)", "", name).strip()
        d = desc.get(norm(base), "")
        if any(e["cat"] == "equipo" and e["title"] == name for e in ENTRIES):
            continue
        add({"cat": "equipo", "gen": 0 if d else 1, "title": name, "path": ["Capítulo 7 · Objetos", "Equipo"],
             "pages": meta_e.get("pages", ""),
             "body": (d or f"{name}. Peso {mm.group('w')}. Precio {mm.group('p')}."),
             "f": {"peso": mm.group("w"), "peso_g": grams(mm.group("w")), "precio": mm.group("p"),
                   "precio_n": price(mm.group("p")), "nota": "*" if starred else ""}})
        count += 1
    # metales y viales
    vrow = re.compile(r"^([A-ZÁÉÍÓÚ][a-záéíóúñ]+) (No disponible|\d[\d,]* ar/\w+) (No disponible|\d[\d,]* ar/\w+)$")
    for l in lines:
        mm = vrow.match(l)
        if mm:
            add({"cat": "metal", "gen": 1, "title": mm.group(1), "path": ["Capítulo 7 · Objetos", "Viales de metales raros"],
                 "pages": meta_e.get("pages", ""),
                 "body": f"{mm.group(1)}. Precio en la Era 1: {mm.group(2)}. Precio en la Era 2: {mm.group(3)}.",
                 "f": {"era1": mm.group(2), "era2": mm.group(3),
                       "era1_n": price(mm.group(2)), "era2_n": price(mm.group(3))}})
    return count

# --------------------------------------------------------------------------- adversarios

ERA_OVERRIDE = {"Alguacil": "Era 2", "Vigilante de la ley": "Era 2", "Aristócrata": "Ambas"}

STAT = re.compile(r"^(Secuaz|Rival|Jefe) de rango (\d)\s*[–-]\s*(.+)$")

def parse_items(text, kind):
    """Parte el texto de Rasgos/Acciones en ítems."""
    items = []
    lines = text.splitlines()
    if kind == "acciones":
        start = re.compile(r"^(?:#{1,6}\s+)?([0-3]|[rR]) ([A-ZÁÉÍÓÚÑ].*)$")
        nocost = re.compile(r"^([A-ZÁÉÍÓÚÑ][^.:]{1,35}?)(?: \([^)]*\))?[.:]\s")
        for l in lines:
            if not l.strip():
                continue
            m = start.match(l.strip())
            mc = nocost.match(l.strip()) if not m else None
            if m:
                items.append({"c": m.group(1).lower(), "t": m.group(2).strip()})
            elif mc and len(mc.group(1).split()) <= 5:
                items.append({"c": "—", "t": l.strip()})
            elif items:
                items[-1]["t"] += " " + l.strip().lstrip("#").strip()
        for it in items:
            mm = re.match(r"^([^.:(]{2,60}?)(?:\s*\(Coste:[^)]*\))?\s*[.:]\s*(.*)$", it["t"])
            nm = re.match(r"^([^.:(]{2,60})", it["t"])
            it["n"] = clean_title(nm.group(1)) if nm else it["t"][:30]
    else:
        paras = [p for p in re.split(r"\n\s*\n", text) if p.strip()]
        for p in paras:
            p = " ".join(p.split())
            m = re.match(r"^([A-ZÁÉÍÓÚÑ][^.]{1,50})\.\s+(.*)$", p)
            if m and len(m.group(1).split()) <= 6:
                items.append({"n": clean_title(m.group(1)), "t": m.group(2).strip()})
            elif items:
                items[-1]["t"] += " " + p
    return items

def process_adversarios():
    advdir = next(GUIA.glob("09 - *"))
    n_blocks = 0
    for f in sorted(advdir.glob("*.md")):
        meta, txt = read_md(f)
        ftitle = clean_title(meta.get("title", f.stem))
        pages = meta.get("pages", "")
        stem = f.stem
        if stem.startswith("01 -"):
            for c in split_chunks(txt):
                body = body_text(c["lines"])
                if len(body) < 150:
                    continue
                add({"cat": "direccion", "title": clean_title(c["title"] or "Cómo usar los adversarios (Guía del Mundo)"),
                     "path": ["Guía del Mundo · Cap. 8 Adversarios", "Cómo usar los adversarios"],
                     "pages": pages, "body": body, "f": {"seccion": "Guía del Mundo"}})
            continue
        if "Módulos de Adversario" in stem:
            prev = None
            for c in split_chunks(txt):
                body = body_text(c["lines"])
                if len(body) < 150:
                    if prev is not None and c["title"] and len(body) >= 40:
                        prev["body"] += f"\n\n#### {clean_title(c['title'])}\n{body}"
                    continue
                prev = add({"cat": "modulo", "title": clean_title(c["title"] or ftitle),
                            "path": ["Guía del Mundo · Cap. 8 Adversarios", ftitle], "pages": pages,
                            "body": body, "f": {"familia": ftitle.replace("Módulos de Adversario - ", "")}}, gated=True)
            continue
        n_blocks += stat_blocks(f, ftitle, pages, txt, ["Guía del Mundo · Cap. 8 Adversarios"], ERA_OVERRIDE)
    return n_blocks

def stat_blocks(f, ftitle, pages, txt, path, override, fuente=None):
    """Extrae los bloques de estadísticas de un .md de adversarios y los añade (gated) como cat «adversario»."""
    n_blocks = 0
    if fuente:  # glifos de coste del PDF del Legado: «1», «2», «r» y «▶» (1 acción), seguidos de un espacio en (U+2002)
        txt = re.sub(r"[ - ]\s*", " ", txt)
        txt = re.sub(r"(?m)^▶\s*", "1 ", txt)
        txt = re.sub(r"(?m)^([0-3r] .*?)\s+Era\s+([12])\b", r"\1 ERA \2", txt)
    lines = txt.splitlines()
    stats = [i for i, l in enumerate(lines) if STAT.match(l.strip())]
    if not stats:
        print("  [!] sin stat block:", f.name)
        return 0
    # encabezado de nombre anterior a cada stat line
    def name_idx(si):
        for j in range(si - 1, -1, -1):
            if re.match(r"^#{1,2}\s+\S", lines[j]) and not is_junk_line(lines[j]):
                return j
        return 0
    starts = [name_idx(si) for si in stats]
    for k, si in enumerate(stats):
        role, rank, size = STAT.match(lines[si].strip()).groups()
        nm = re.match(r"^#{1,2}\s+(.*)$", lines[starts[k]])
        name = clean_title(nm.group(1)) if nm else ftitle
        end = starts[k + 1] if k + 1 < len(stats) else len(lines)
        region = lines[si + 1:end]
        # cabecera hasta el primer ###
        head = []
        sections = {}
        sec = None
        for l in region:
            if is_junk_line(l) or l.startswith(FILE_MARK) or re.match(r"^(#+\s*)?Apéndice A: Adversarios\b", l.strip()):
                continue
            if fuente and sec in ("tácticas", "otro") and re.match(r"^Salud:", l.strip()):
                sec = None  # la cabecera de la ficha puede quedar tras las tácticas al maquetar a dos columnas
            hm = re.match(r"^###\s+(.*)$", l)
            if fuente and hm and re.search(r"Tácticas de", hm.group(1)):  # «### “cita” Tácticas de X»
                sec = "tácticas"
                sections.setdefault(sec, [])
                continue
            if hm and re.match(r"^(Rasgos|Acciones|Tácticas)", hm.group(1), re.I):
                sec = hm.group(1).split(":")[0].split()[0].lower()
                sections.setdefault(sec, [])
                continue
            if hm and sec is not None and not re.match(r"^(Rasgos|Acciones|Tácticas)", hm.group(1), re.I):
                # otro encabezado: corta la sección salvo que sea corto
                sec = "otro"
                sections.setdefault(sec, [])
                continue
            if re.match(r"^#{1,2}\s", l):
                sec = "otro"
                sections.setdefault(sec, [])
                continue
            if sec is None:
                head.append(l)
            else:
                sections[sec].append(l)
        htxt = " ".join(" ".join(head).split())
        f_ = {"rol": role, "rango": int(rank), "tamano": size.strip()}
        mn = re.search(r"fue def vel int def vol dis def pre\s+(-?\d+) (-?\d+) (-?\d+) (-?\d+) (-?\d+) (-?\d+) (-?\d+) (-?\d+) (-?\d+)", htxt)
        if mn:
            v = [int(x) for x in mn.groups()]
            f_.update({"fue": v[0], "def_fis": v[1], "vel": v[2], "int": v[3], "def_cog": v[4],
                       "vol": v[5], "dis": v[6], "def_esp": v[7], "pre": v[8]})
        ms = re.search(r"Salud:\s*(\d+)\s*\((\d+) a (\d+)\)", htxt)
        if ms:
            f_.update({"salud": int(ms.group(1)), "salud_min": int(ms.group(2)), "salud_max": int(ms.group(3))})
        for key, rx in (("concentracion", r"Concentración:\s*(\d+)"), ("investidura", r"Investidura:\s*(\d+)")):
            mm = re.search(rx, htxt)
            if mm:
                f_[key] = int(mm.group(1))
        mm = re.search(r"Desvío:\s*(\d+)(?:\s*\(([^)]*)\))?", htxt)
        f_["desvio"] = int(mm.group(1)) if mm else 0
        mm = re.search(r"Movimiento:\s*(.*?)\s+Sentidos:", htxt)
        if mm:
            f_["movimiento"] = mm.group(1)
        mm = re.search(r"Sentidos:\s*(.*?)\s*Habilidades", htxt)
        if mm:
            f_["sentidos"] = mm.group(1)
        for key, rx in (("hab_fis", r"Habilidades físicas:\s*(.*?)\s*(?:Habilidades cognitivas:|Habilidades espirituales:|$)"),
                        ("hab_cog", r"Habilidades cognitivas:\s*(.*?)\s*(?:Habilidades espirituales:|$)"),
                        ("hab_esp", r"Habilidades espirituales:\s*(.*)$")):
            mm = re.search(rx, htxt)
            if mm:
                f_[key] = mm.group(1).strip()
        rasgos = parse_items(body_text(sections.get("rasgos", [])), "rasgos")
        acciones = parse_items(body_text(sections.get("acciones", [])), "acciones")
        tact = body_text(sections.get("tácticas", []))
        if fuente:  # los bloques cruzan ficheros: página y era salen del encabezado «# Nombre  Era N» y del fichero de origen
            hs = [j for j in range(si, -1, -1) if re.match(r"^#\s+\S", lines[j]) and not is_junk_line(lines[j])]
            era = find_era(lines[hs[0]] if hs else "", lines[starts[k]])
            mk = next((lines[j][len(FILE_MARK):].split("|") for j in range(si, -1, -1) if lines[j].startswith(FILE_MARK)), None)
            if mk:
                pages = mk[1]
                if find_era(mk[0]) != "Ambas" and squash(name) in squash(mk[0]):
                    era = find_era(mk[0])
        else:
            era = override.get(name) or find_era(f.stem, name)
        f_["era"] = era
        f_["rasgos"] = [r["n"] for r in rasgos]
        f_["acciones"] = [a["n"] for a in acciones]
        parts = [f"{name}. {role} de rango {rank}. {size}."]
        parts += [f"{r['n']}. {r['t']}" for r in rasgos]
        parts += [f"{a['c']} {a['t']}" for a in acciones]
        if tact:
            parts.append(tact)
        if fuente:
            f_["fuente"] = fuente
            if any(e["cat"] == "adversario" and norm(e["title"]) == norm(name) for e in DJ_ENTRIES):
                name = f"{name} ({fuente})"
        add({"cat": "adversario", "title": name, "path": list(path),
             "pages": pages, "era": era, "body": "\n\n".join(parts), "f": f_,
             "x": {"rasgos": rasgos, "acciones": acciones, "tacticas": tact, "raw": htxt if not mn else ""}},
            gated=True)
        n_blocks += 1
    return n_blocks

# --------------------------------------------------------------------------- Legado (DJ)

FILE_MARK = "@@FICHERO@@"

def process_adversarios_legado():
    """Apéndice A del Legado: mismos bloques de estadísticas que la Guía del Mundo, marcados con f.fuente = «Legado»."""
    advdir = next(LEGADO.glob("11 - *"))
    # El PDF parte fichas entre páginas (y por tanto entre .md): se procesa el apéndice como un único texto.
    files = sorted(advdir.glob("*.md"))
    txt = "\n\n".join(f"{FILE_MARK}{f.stem}|{read_md(f)[0].get('pages', '')}\n\n{read_md(f)[1]}" for f in files)
    return stat_blocks(advdir / "Apéndice A.md", "Apéndice A Adversarios", "", txt,
                       ["Legado", "Apéndice A Adversarios"], {}, fuente="Legado")

# --------------------------------------------------------------------------- Guía del Mundo (ambientación; solo Modo DJ)
GUIA_ORGANIZACIONES = {
    "Casa Cett Ashweather y Allrianne", "Casa Venture Straff y Zane", "Kelsier y Su Banda", "Los Kandra", "Ministerio de Acero",
    "El Grupo", "Los Malwish", "Policía de Elendel", "Los Sangre Espectral",
}
# capítulo -> {nº de fichero: (catálogo, tipo)}; "*" es el valor por defecto del capítulo
GUIA_CLASE = {
    "01": {"02": ("cosmologia", "Cosmología")},
    "02": {"01": ("historia", "Historia"), "02": ("lugar", "Pueblos"), "03": ("cosmologia", "Artes metálicas"),
           "04": ("historia", "Historia"), "05": ("historia", "El mundo en cada era"), "06": ("historia", "El mundo en cada era"),
           "07": ("historia", "El mundo en cada era")},
    "03": {"01": ("lugar", "Pueblos"), "*": ("lugar", "Región")},
    "04": {"01": ("cosmologia", "Cosmología"), "02": ("cosmologia", "Cosmología"), "03": ("cosmologia", "Cosmología"),
           "04": ("cosmologia", "Cosmología"), "*": ("cosmologia", "Religión")},
    "05": {"*": ("historia", "Historia")},
    "07": {"*": ("lugar", "Lugar de interés")},
    "08": {"*": ("lugar", "Lugar de interés")},
}
GUIA_CAP = {"01": "Introducción", "02": "Cap. 1 El Mundo", "03": "Cap. 2 Regiones y Culturas", "04": "Cap. 3 Cosmología y Religión",
            "05": "Cap. 4 Historia", "06": "Cap. 5 Aliados y Organizaciones", "07": "Cap. 6 Lugares de interés (Era 1)",
            "08": "Cap. 7 Lugares de interés (Era 2)", "10": "Apéndice A Glosario"}
ERA_CAPITULO = {"07": "Era 1", "08": "Era 2"}


def _etiquetas_mapa(body):
    """Los mapas del PDF salen como rótulos con las letras separadas («er e l»): no son texto."""
    toks = body.split()
    return len(toks) > 5 and sum(len(t) for t in toks) / len(toks) < 3.2


def _glosario_guia(pages):
    """Una entrada por término del Apéndice A (nombre, pronunciación, traducción), ordenadas alfabéticamente."""
    d = next(d for d in sorted(GUIA.iterdir()) if d.name.startswith("10 - "))
    f = next(d.glob("*.md"))
    _, txt = read_md(f)
    filas, _ = glosario(txt)
    out = {}
    for nombre, pron, trad in filas:
        trad = re.split(r"\s+a siguiente tabla\b", trad)[0].strip() or nombre  # el párrafo introductorio cae en la última fila
        if nombre.endswith(" wuhn"):  # «Wan ShaiLu wuhn SHEYE-loo»: «wuhn» es la primera sílaba
            nombre, pron = nombre[:-5], "wuhn " + pron
        out[nombre] = (nombre, pron, trad)
    # fila partida por el PDF (pronunciación en tres tramos)
    out["Sanvith Prasanva Maahik va Sila"] = ("Sanvith Prasanva Maahik va Sila", "SAHN-vith prah-SAHNvah ma-AH-hik va SEE-lah", "Sanvith Prasanva Maahik va Sila")
    out.pop("SAHN-vith", None)
    entradas = []
    for nombre, pron, trad in sorted(out.values(), key=lambda r: norm(r[0])):
        entradas.append({"cat": "glosario", "title": nombre, "path": ["Guía del Mundo · Apéndice A", "Glosario"], "pages": pages,
                         "body": f"Pronunciación: {pron}.\n\nTraducción: {trad}.", "era": "Ambas",
                         "f": {"pronunciacion": pron, "traduccion": trad}})
    return entradas


def _partes_guia(chunks, titulo, h1c):
    """Texto limpio de cada trozo de un fichero de la Guía, como lista de [(título, cuerpo)] (los vacíos y las portadillas se quitan)."""
    out = []
    for c in chunks:
        body = body_text(c["lines"])
        titc = re.sub(r"^.*?™\s*", "", strip_era(clean_title(c["title"] or "")))  # «e la bruma™ Feruquimia»
        if not body or (_etiquetas_mapa(body) and c is not h1c):
            continue
        if re.match(r"(?:Capítulo \d|Apéndice)", titc) or titc.lower() == "tabla de metale":
            continue
        body = limpia_guia(body, titc)
        if body:
            out.append(("" if (c is h1c or not titc or norm(titc) == norm(titulo)) else titc, body))
    return out


def _texto_partes(partes):
    return "\n\n".join(f"#### {t}\n{b}" if t else b for t, b in partes).strip()


# Cuando el PDF intercala la barra lateral de un apartado en la página del siguiente, esos trozos se devuelven a su apartado
GUIA_DEVOLVER = re.compile(r"Ashweather|Allrianne|Lord Cett podr", re.I)
# entrada -> (primer y último trozo que pertenecen al apartado anterior)
GUIA_DEVOLVER_RANGO = {"Quellion": ("Noorden", "Indultos de obligadores"),
                       "Marasi Colms": ("Beneficio de patrocinador: los malwish", "Frecuencia de vuelo de aeronave")}


def process_guia():
    n = 0
    for chdir in sorted(GUIA.iterdir()):
        num = chdir.name[:2]
        if num not in GUIA_CAP:
            continue
        previo = None  # entrada del fichero anterior del mismo capítulo (a ella vuelve lo que el PDF dejó en la página siguiente)
        descartar_pre = False
        salida = []
        for f in sorted(chdir.glob("*.md")):
            fnum = f.stem[:2]
            if (num in ("06", "07", "08") and fnum == "01") or (num == "01" and fnum != "02"):
                previo, descartar_pre = None, True  # «Cómo usar este capítulo/libro»: instrucciones del libro; su desborde se descarta
                continue
            meta, txt = read_md(f)
            if num == "10":
                for e in _glosario_guia(meta.get("pages", "")):
                    add(e, gated=True)
                    n += 1
                continue
            chunks = split_chunks(txt)
            if not chunks:
                continue
            # el encabezado del apartado (los de «Capítulo N» y los vacíos son portadillas del PDF)
            h1c = next((c for c in chunks if c["title"] and c["level"] == 1 and not re.match(r"Capítulo \d|Apéndice", c["title"])
                        and body_text(c["lines"])), None)
            h1 = clean_title(h1c["title"]) if h1c else ""
            i0 = chunks.index(h1c) if h1c else 0
            tit = clean_title(meta.get("title", f.stem))
            # algunos títulos del PDF quedaron en inglés o con el h1 equivocado: se usa el del encabezado
            if re.search(r"\b(?:Of|The|After)\b", tit) and h1:
                tit = h1
            era = ERA_CAPITULO.get(num) or find_era(f.stem, meta.get("title", ""), h1)
            titulo = re.sub(r"^Apéndice [A-C]:\s*", "", strip_era(tit)).strip() or h1
            pre = _partes_guia(chunks[:i0], titulo, h1c)
            partes = _partes_guia(chunks[i0:], titulo, h1c)
            if previo is not None:
                # el final del apartado anterior quedó en la página donde empieza éste
                previo["partes"] += pre
                if num == "06" and previo["title"].startswith("Casa Cett"):
                    devueltas = [p for p in partes if GUIA_DEVOLVER.search(p[0]) or GUIA_DEVOLVER.search(p[1][:150])]
                    partes = [p for p in partes if p not in devueltas]
                    previo["partes"] += devueltas
                if titulo in GUIA_DEVOLVER_RANGO:
                    t0, t1 = GUIA_DEVOLVER_RANGO[titulo]
                    ts = [p[0] for p in partes]
                    if t0 in ts and t1 in ts:
                        i, j = ts.index(t0), ts.index(t1)
                        previo["partes"] += partes[i:j + 1]
                        partes = partes[:i] + partes[j + 1:]
            elif not descartar_pre:
                partes = pre + partes  # primer apartado del capítulo: lo anterior es su portadilla
            if num == "06":
                cat = "pnj"
                tipo = "Organización" if titulo.replace(":", "").strip() in GUIA_ORGANIZACIONES else "Personaje"
            else:
                clase = GUIA_CLASE.get(num, {})
                cat, tipo = clase.get(fnum) or clase.get("*") or ("cosmologia", "Cosmología")
            entrada = {"cat": cat, "title": titulo, "path": ["Guía del Mundo · " + GUIA_CAP[num], tipo], "pages": meta.get("pages", ""),
                       "era": era, "f": {"tipo": tipo}, "partes": partes}
            salida.append(entrada)
            previo = entrada
        for e in salida:
            e["body"] = _texto_partes(e.pop("partes"))
            if len(e["body"]) < 150:
                continue
            add(e, gated=True)
            n += 1
    return n


def process_legado():
    for chdir in sorted(LEGADO.iterdir()):
        if not chdir.is_dir():
            continue
        chap = re.sub(r"^\d+ - ", "", chdir.name)
        for f in sorted(chdir.glob("*.md")):
            meta, txt = read_md(f)
            ftitle = clean_title(meta.get("title", f.stem))
            pages = meta.get("pages", "")
            prev = None
            for c in split_chunks(txt):
                body = body_text(c["lines"])
                title = clean_title(c["title"] or ftitle)
                if len(body) < 300:
                    if prev is not None and len(body) >= 40:
                        prev["body"] += f"\n\n#### {title}\n{body}"
                    continue
                prev = add({"cat": "legado", "title": title, "path": ["Legado", chap, ftitle] if title != ftitle else ["Legado", chap],
                            "pages": pages, "body": body, "f": {"capitulo": chap}}, gated=True)

# --------------------------------------------------------------------------- salida

def libro_de(e):
    """Libro de origen, con el nombre de la ambientación: «Manual X», «Guía X» (Mistborn → Scadrial) o «Campaña Y»."""
    p0 = (e.get("path") or [""])[0]
    if p0.startswith("Guía"):
        return "Guía Scadrial"
    if p0 == "Legado":
        return "Campaña Legado"
    return "Manual Mistborn"

def dump(entries, var, path, extra=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    for e in entries:  # la página del libro no se publica: sí el libro (o campaña) de donde viene
        e.pop("pages", None)
        e["libro"] = libro_de(e)
    data = json.dumps(entries, ensure_ascii=False, separators=(",", ":"))
    out = f"window.{var}={data};\n"
    for k, v in (extra or {}).items():
        out += f"window.{k}=" + json.dumps(v, ensure_ascii=False, separators=(",", ":")) + ";\n"
    path.write_text(out, encoding="utf-8")
    return len(data)

ALUMINIO_INTRO = """A ojos de los scadrianos, la alomancia de aluminio carece de utilidad alguna, a menos que se tenga acceso a otras artes metálicas... e incluso en ese caso, su efecto se considera puramente perjudicial. Al quemar aluminio, agotas tus reservas de metales al instante (incluidos los efectos de cualquier mente de metal que estés decantando), lo que consume el poder sin producir resultado alguno. Por ello, a los brumosos de aluminio se los conoce como “mosquitos de aluminio”, víctimas de una maldición que les otorga un poder peor que inútil.

Sin embargo, quienes han viajado a otros mundos del Cosmere comprenden que este poder permite defenderse de otras Artes Investidas, especialmente de la potenciación. Mientras quemas aluminio, purgas toda Investidura de tu organismo y, al hacerlo, pones fin a los efectos Investidos de fuentes externas. Esto te vuelve completamente inmune a algunas de las capacidades más peligrosas del Cosmere. Por esta razón, los saltamundos conocen a estos alomantes como vacíos."""


def fix_aluminio(entries):
    """La sección de alomancia de aluminio quedó dentro del archivo de Acero al convertir el PDF."""
    src = [e for e in entries if e["cat"] == "arte" and e["path"][1:2] == ["Alomancia de Acero"]
           and e["title"] in ("Quemar aluminio", "Elección de alomancia de aluminio")]
    if not src:
        return
    for e in src:
        e["path"] = [e["path"][0], "Alomancia de Aluminio"]
    q = next((e for e in src if e["title"] == "Quemar aluminio"), src[0])
    entries.append({"cat": "arte", "title": "Alomancia de aluminio", "path": list(q["path"]),
                    "pages": q["pages"], "body": ALUMINIO_INTRO, "era": "Ambas", "f": {}})


def fix_juventud(entries):
    """"Almacenar juventud" (atium) quedó al final del archivo de Feruquimia de Aluminio al convertir el PDF."""
    for e in entries:
        if e["cat"] == "arte" and e["title"] == "Almacenar juventud" and e["path"][1:2] == ["Feruquimia de Aluminio"]:
            e["path"] = [e["path"][0], "Feruquimia de Atium"]


def acciones_de_poder(entries):
    """Las acciones de las artes metálicas pasan a la categoría 'accion' y todas las acciones reciben su origen."""
    for e in entries:
        if e["cat"] == "arte" and re.match(r"^Activaci[oó]n:", e["body"]):
            cost = re.match(r"^Activaci[oó]n:\s*(\S+)", e["body"]).group(1).lower()
            sec = e["path"][1] if len(e["path"]) > 1 else ""
            mm = re.match(r"^(?:Quemar|Tragar)\s+(.+)$", e["title"])
            if mm:
                origen, poder = "Alomancia", "Alomancia de " + mm.group(1)[:1].upper() + mm.group(1)[1:]
            else:
                origen, poder = ("Alomancia" if sec.startswith("Alomancia") else "Feruquimia"), sec
            e["cat"] = "accion"
            e["f"] = {"coste": cost, "tipo": "Reacción" if cost == "r" else "Acción", "origen": origen, "contexto": poder}
        elif e["cat"] == "accion":
            sec = e["f"].get("contexto", "")
            e["f"]["origen"] = ("Hemalurgia" if "Hemalúrgicos" in sec else
                                "Nacidos del metal" if "Nacidos del Metal" in sec else "General")


def acciones_de_caminos(base):
    """Los talentos de caminos heroicos, de nacido del metal y de ascendencia que dan una acción o reacción aparecen también en la lista de acciones."""
    COSTE = {"1 acción": "1", "2 acciones": "2", "3 acciones": "3", "Acción gratuita": "*", "Reacción": "r"}
    ORIGEN = {"Camino heroico": "Camino heroico", "Camino de nacido del metal": "Nacidos del metal",
              "Ascendencia/Cultura": "Ascendencia"}
    ids = {e["id"] for e in base}
    nuevas = []
    for e in base:
        f = e["f"]
        if e["cat"] != "talento" or f.get("tipo_origen") not in ORIGEN or f.get("activacion") not in COSTE:
            continue
        cost = COSTE[f["activacion"]]
        aid, n = "accion-" + slug(e["title"]), 1
        while aid in ids:
            n += 1
            aid = f"accion-{slug(e['title'])}-{n}"
        ids.add(aid)
        nuevas.append({"cat": "accion", "title": e["title"], "path": e["path"], "pages": e["pages"], "body": e["body"],
                       "id": aid, "ambientacion": e.get("ambientacion", "Mistborn"),
                       "f": {"coste": cost, "tipo": "Reacción" if cost == "r" else "Acción",
                             "origen": ORIGEN[f["tipo_origen"]], "contexto": f.get("origen", ""), "talento": e["id"]}})
    return nuevas


REGLAS_DUPLICADAS = """
descanso-orden-del-combate descanso-rondas-y-turnos descanso-turnos-de-los-pnjs-aliados
combate-ambientacion-de-la-escena combate-orden-de-las-conversaciones
combate-ten-en-cuenta-los-objetivos combate-rondas-flexibles
conversacion-establecimiento-del-umbral-de-empeno conversacion-ambientacion-de-la-escena-2
conversacion-presentacion-de-reglas-especiales
empeno-para-empezar empeno-seguridad empeno-conocimiento-de-la-ambientacion
origen-acerca-de-tus-caracteristicas
""".split()

# id -> (categoría, sección, páginas); el texto es el mismo, solo estaba colgado del capítulo vecino
REGLAS_MOVER = {
    "descanso-fases-del-turno": ("combate", "Capítulo 10 · Combate", "Orden del Combate", "323-324"),
    "descanso-aturdido": ("estado", "Capítulo 9 · Aventuras", "Estados", "316-318"),
    "descanso-dano-lesiones-y-muerte": ("descanso", "Capítulo 9 · Aventuras", "Daño, Lesiones y Muerte", "318-323"),
    "conversacion-definicion-de-objetivos-y-circunstancias": ("empeno", "Capítulo 12 · Empeños", "Ambientación de la Escena", "345-346"),
    "combate-cuando-usar-las-conversaciones": ("conversacion", "Capítulo 11 · Conversaciones", "Ambientación de la Escena", "337-337"),
    "empeno-el-primer-paso": ("direccion", "Capítulo 13 · Dirección del juego", "Para Empezar", "359-360"),
    "empeno-programacion-de-sesiones": ("direccion", "Capítulo 13 · Dirección del juego", "Para Empezar", "359-360"),
    "empeno-tematica": ("direccion", "Capítulo 13 · Dirección del juego", "Para Empezar", "359-360"),
    "personaje-pericias-de-utilidad": ("pericia", "Capítulo 3 · Características", "Pericias", None),
    "personaje-pericias-especializadas": ("pericia", "Capítulo 3 · Características", "Pericias", None),
    "personaje-usos-creativos-de-las-pericias": ("pericia", "Capítulo 3 · Características", "Pericias", None),
}

# La introducción de cada capítulo quedó pegada al final de una copia duplicada: (id de la copia, categoría, capítulo, sección, páginas, título, letra capitular perdida)
REGLAS_INTRO = [
    ("descanso-turnos-de-los-pnjs-aliados", "combate", "Capítulo 10 · Combate", "Orden del Combate", "323-324", "Introducción al combate", "A"),
    ("conversacion-presentacion-de-reglas-especiales", "empeno", "Capítulo 12 · Empeños", "Ambientación de la Escena", "345-346", "Introducción a los empeños", "T"),
    ("empeno-conocimiento-de-la-ambientacion", "direccion", "Capítulo 13 · Dirección del juego", "Para Empezar", "359-360", "Introducción a la dirección del juego", "S"),
]


def limpiar_reglas(base):
    """Quita copias duplicadas de reglas (el .md repite páginas de capítulos vecinos) y recoloca las que quedaron en la sección equivocada."""
    por_id = {e["id"]: e for e in base}
    nuevas = []
    for src, cat, cap, sec, pag, titulo, letra in REGLAS_INTRO:
        cola = "\n\n".join(por_id[src]["body"].split("\n\n")[1:]).strip()
        if cola and cola[0].islower():
            nuevas.append({"cat": cat, "title": titulo, "path": [cap, sec], "pages": pag, "body": letra + cola,
                           "era": "Ambas", "f": {"seccion": sec}, "id": f"{cat}-{slug(titulo)}"})
    # "* Disfraz kandra" es la descripción del talento Disfraz kandra, partida del encabezado por la maquetación
    desc = por_id.get("origen-disfraz-kandra")
    talento = por_id.get("talento-disfraz-kandra")
    if desc and talento:
        talento["body"] = desc["body"]
        por_id.pop("origen-disfraz-kandra")
        base[:] = [e for e in base if e["id"] != "origen-disfraz-kandra"]
    quitar = set(REGLAS_DUPLICADAS)
    base[:] = [e for e in base if e["id"] not in quitar]
    usados = {e["id"] for e in base} | {e["id"] for e in nuevas}
    for old, (cat, cap, sec, pag) in REGLAS_MOVER.items():
        e = por_id.get(old)
        if not e:
            continue
        nuevo_id = cat + "-" + old.partition("-")[2]
        if nuevo_id != old and nuevo_id in usados:
            nuevo_id = old
        usados.add(nuevo_id)
        e.update({"cat": cat, "path": [cap, sec], "id": nuevo_id})
        e["f"] = {**e.get("f", {}), "seccion": sec}
        if pag:
            e["pages"] = pag
    for n in nuevas:  # la introducción va la primera de su categoría
        i = next((k for k, e in enumerate(base) if e["cat"] == n["cat"]), len(base))
        base.insert(i, n)
    return base


def main():
    process_manual()
    n_equipo = process_objects()
    n_adv = process_adversarios()
    n_adv += process_adversarios_legado()
    process_legado()
    n_guia = process_guia()
    base = dedupe(ENTRIES)
    fix_aluminio(base)
    fix_juventud(base)
    acciones_de_poder(base)
    for e in base:  # la ★ de los diagramas del libro es el símbolo de activación "Especial"
        if e["cat"] == "talento" and "clave" in e["f"]:
            if e["f"].pop("clave"):
                e["f"]["activacion"] = "Especial"
    mini, used = build_mini(base)
    base = [e for e in base if id(e) not in used] + mini + [build_creacion()] + build_habilidades_investidas()
    for e in base:
        if e["cat"] == "habilidad":
            e["f"].setdefault("tipo", "Básica")
    base = finalize(base)
    limpiar_reglas(base)
    dj = finalize(dedupe(DJ_ENTRIES))
    base = [e for e in base if not es_basura(e)]
    apply_ambientacion(base)
    apply_ambientacion(dj)
    aplicar_eras(base)
    aplicar_eras(dj)
    link_talents(base)
    split_ascendencias(base)
    nuevas, arboles = aplicar_efectos(base)
    reorganizar(base, dj)
    base = base + finalize(nuevas)
    redirige_modificadores(base)
    base = base + acciones_de_caminos(base)
    n_reglas = build_reglas(base)
    s1 = dump(base, "DATA_BASE", OUT / "base.js", {"DATA_ARBOLES": arboles, "DATA_OBJETIVOS": OBJ_NOMBRE})
    s2 = dump(dj, "DATA_DJ", OUT / "dj.js")
    from collections import Counter
    c = Counter(e["cat"] for e in base)
    d = Counter(e["cat"] for e in dj)
    print(f"base.js {s1/1024:.0f} KB | dj.js {s2/1024:.0f} KB")
    print("base:", dict(c))
    print("dj:  ", dict(d))
    print("equipo:", n_equipo, "| adversarios:", n_adv, "| microrreglas:", n_reglas)

if __name__ == "__main__":
    main()

