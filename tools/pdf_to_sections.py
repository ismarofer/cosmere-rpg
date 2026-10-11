#!/usr/bin/env python3
"""PDF -> carpeta por capítulo + un .md por sección (marcadores nivel 1 y 2).

Uso: python tools/pdf_to_sections.py LIBRO.pdf SALIDA/ [--pages A-B]
Reutiliza el conversor del skill pdf-split-markdown (sin OCR, doble columna).
--pages limita a un rango (1-indexado) para pruebas piloto.

- Los marcadores de nivel 1 son capítulos (carpeta); los de nivel 2, secciones (.md).
- Un capítulo sin secciones se escribe como un único .md.
- Los marcadores del PDF apuntan al inicio de página, así que se localiza el
  encabezado real (página, columna, y) y cada sección se corta ahí: no se
  duplican páginas compartidas ni se pierde texto previo al encabezado.
- Las secciones de menos de 1200 caracteres se fusionan con la anterior.
- Las de más de 40000 caracteres se trocean por encabezados.
- Genera _index.md en la raíz de SALIDA (solo si se convierte el libro entero).
"""
import os, re, argparse, importlib.util, glob, warnings
warnings.filterwarnings("ignore")
import pymupdf as fitz
from pymupdf4llm.helpers.multi_column import column_boxes

spec_path = glob.glob(os.path.expanduser(
    "~/.claude/skills/synced/*/pdf-split-markdown/scripts/pdf2md.py"))[0]
spec = importlib.util.spec_from_file_location("pdf2md", spec_path)
p2m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p2m)

SMALL = {"de", "del", "la", "el", "los", "las", "y", "e", "en", "a", "un", "una",
         "por", "con", "para", "o", "u", "al", "lo", "que"}
END_PUNCT = (".", ":", ";", "!", "?", "”", "»", ")")
MAX_CHARS, TARGET = 40000, 20000
LETTER = "a-záéíóúñü"


def clean_title(t):
    t = t.replace("\n", " ").replace("�", "")
    t = re.sub(r"(?i)\b(alomancia|feruquimia)de\b", r"\1 de", t)
    t = re.sub(r"\s+:", ":", re.sub(r"\s+", " ", t)).strip()
    out, cap = [], True
    for w in t.lower().split(" "):
        if cap or w not in SMALL:
            w = re.sub(rf"^([^{LETTER}]*)([{LETTER}])",
                       lambda m: m.group(1) + m.group(2).upper(), w)
        out.append(w)
        cap = w.endswith(":")
    t = " ".join(out)
    return re.sub(r"(?i)^(Ap[ée]ndice) ([a-z])\b",
                  lambda m: m.group(1) + " " + m.group(2).upper(), t)


def slug(t):
    return re.sub(r'[\\/:*?"<>|]', "", t).strip(" .")


def join_paragraphs(chunks):
    """Une trozos partidos por saltos de columna/página (siguiente empieza en minúscula)."""
    out = []
    for c in chunks:
        c = re.sub(r"\s*\n\s*", " ", c.strip())
        if (out and c[:1].islower() and not out[-1].startswith("#")
                and not out[-1].rstrip().endswith(END_PUNCT)):
            out[-1] += " " + c
        else:
            out.append(c)
    return out


_boxes = {}


def page_boxes(doc, i):
    if i not in _boxes:
        page = doc[i]
        _boxes[i] = list(column_boxes(page, footer_margin=30, header_margin=30,
                                      no_image_text=True)) or [page.rect]
    return _boxes[i]


def find_marker(doc, i, raw, body):
    """((página, caja, y), encontrado) del encabezado de un marcador (páginas 0-indexadas)."""
    page = doc[i]
    base = re.sub(r"\s+", " ", raw.replace("�", "").replace("\n", " ")).strip()
    cands = [base, base.split(":")[0].strip(), " ".join(base.split()[:3])]
    for n, c in enumerate(cands):
        if len(c) < 4:
            continue
        hits = page.search_for(c)
        best = None
        for r in hits:
            d = page.get_text("dict", clip=r)
            sizes = [sp["size"] for b in d.get("blocks", []) for l in b.get("lines", [])
                     for sp in l.get("spans", [])]
            if sizes and max(sizes) >= body * 1.15:
                best = r
                break
        if best is None and hits and n == 0:
            best = hits[0]
        if best is not None:
            cx, cy = (best.x0 + best.x1) / 2, (best.y0 + best.y1) / 2
            bi = next((k for k, b in enumerate(page_boxes(doc, i))
                       if b.x0 - 2 <= cx <= b.x1 + 2 and b.y0 - 2 <= cy <= b.y1 + 2), None)
            if bi is not None:
                return (i, bi, best.y0 - 2), True
    return (i, 0, 0.0), False


def section_md(doc, start, end, body):
    chunks = []
    for i in range(start[0], min(end[0], len(doc) - 1) + 1):
        page = doc[i]
        for bi, box in enumerate(page_boxes(doc, i)):
            key = (i, bi)
            if key < start[:2] or (key >= end[:2] and not (key == end[:2] and end[2] > 0)):
                continue
            clip = fitz.Rect(box)
            if key == start[:2]:
                clip.y0 = max(clip.y0, start[2])
            if key == end[:2]:
                clip.y1 = min(clip.y1, end[2])
            if clip.y1 - clip.y0 < 2:
                continue
            chunks.extend(p2m.region_md(doc, page, clip, body))
    chunks = [c for c in p2m.post_process(chunks) if c.strip()]
    md = "\n\n".join(join_paragraphs(chunks))
    return re.sub(r"\n{3,}", "\n\n", md)


def split_big(title, md):
    """Trocea un .md > MAX_CHARS por encabezados (##, ###, ####) o, si no hay, por párrafos."""
    if len(md) <= MAX_CHARS:
        return [(title, md)]
    sep = "\n\n"
    for pat in (r"(?m)^(?=## )", r"(?m)^(?=### )", r"(?m)^(?=#### )", None):
        blocks = [b for b in (re.split(pat, md) if pat else md.split("\n\n")) if b.strip()]
        if len(blocks) > 1 and max(len(b) for b in blocks) <= MAX_CHARS:
            sep = "" if pat else "\n\n"
            break
    parts, cur = [], ""
    for b in blocks:
        if cur and len(cur) + len(b) > TARGET:
            parts.append(cur)
            cur = ""
        cur = b if not cur else cur + sep + b
    if cur:
        parts.append(cur)
    out = []
    for n, ptxt in enumerate(parts, 1):
        m = re.match(r"#+\s+(.*)", ptxt)
        label = clean_title(m.group(1))[:50] if m else f"parte {n}"
        out.append((f"{title} - {label}", ptxt))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("out")
    ap.add_argument("--pages")
    a = ap.parse_args()
    doc = fitz.open(a.pdf)
    lo, hi = 1, doc.page_count
    if a.pages:
        lo, hi = map(int, a.pages.split("-"))
    body = p2m.collect_body_size(doc)
    raw = doc.get_toc()
    toc = [(l, clean_title(t), p) for l, t, p in raw]
    src = os.path.basename(a.pdf)
    end_all = (hi, 0, 0.0)  # exclusivo: la página hi+1 (índice hi) ya no entra
    marks, miss = [], 0
    for l, t, p in raw:
        if lo <= p <= hi:
            m, ok = find_marker(doc, p - 1, t, body)
            miss += not ok
            marks.append(m)
        else:
            marks.append(None)

    secs, chap, chap_mark, first = [], None, None, False
    for k, (lvl, title, pg) in enumerate(toc):
        if lvl == 1:
            chap, chap_mark, first = title, marks[k], True
            if k + 1 < len(toc) and toc[k + 1][0] == 2:
                continue
        if marks[k] is None:
            first = False
            continue
        start = marks[k]
        if first and lvl == 2 and chap_mark and chap_mark[0] == start[0]:
            start = min(chap_mark, start)
        first = False
        nxt = next((marks[j] for j in range(k + 1, len(toc)) if marks[j]), end_all)
        if nxt < start:
            nxt = (start[0] + 1, 0, 0.0)
        md = section_md(doc, start, nxt, body)
        end_pg = max(start[0], nxt[0] - (1 if nxt[1] == 0 and nxt[2] == 0 else 0)) + 1
        secs.append([chap, title, start[0] + 1, end_pg, md])
        print(f"{chap[:30]} | {title} p{start[0]+1}-{end_pg} {len(md)}", flush=True)
    print(f"marcadores sin localizar (se usa inicio de página): {miss}", flush=True)

    merged = []
    for s in secs:
        if merged and merged[-1][0] == s[0] and len(s[4]) < 1200:
            m = merged[-1]
            m[3] = max(m[3], s[3])
            m[4] += "\n\n## " + s[1] + "\n\n" + s[4]
        else:
            merged.append(s)

    final = []
    for chap, title, pg, end, md in merged:
        for name, body_md in split_big(title, md):
            final.append((chap, name, pg, end, body_md))

    cnum, snum, last, index = 0, 0, None, []
    for chap, title, pg, end, md in final:
        if chap != last:
            cnum += 1
            snum = 0
            last = chap
            index.append("\n## " + chap + "\n")
        snum += 1
        cdir = f"{cnum:02d} - {slug(chap)}"
        os.makedirs(os.path.join(a.out, cdir), exist_ok=True)
        fn = f"{snum:02d} - {slug(title)}.md"
        front = (f'---\ntitle: "{title}"\nsource: "{src}"\n'
                 f'chapter: "{chap}"\npages: "{pg}-{end}"\n---\n\n')
        with open(os.path.join(a.out, cdir, fn), "w", encoding="utf-8") as f:
            f.write(front + md + "\n")
        index.append(f"- [{title}]({cdir}/{fn}) — pp. {pg}-{end}, {max(len(md) // 1000, 1)}k caracteres")
    if not a.pages:
        with open(os.path.join(a.out, "_index.md"), "w", encoding="utf-8") as f:
            f.write(f"# Índice — {src}\n" + "\n".join(index) + "\n")


if __name__ == "__main__":
    main()
