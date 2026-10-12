"""Auditoría: apartados del Manual de Stormlight que no tienen equivalente (por encabezado) en el de Mistborn, o que difieren mucho.
Solo informa. Uso: python tools/auditoria/comparar_libros.py"""
import collections, glob, io, os, re, sys, unicodedata
RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SL = os.path.join(RAIZ, "resources", "Manual del Archivo de las Tormentas")
MB = os.path.join(RAIZ, "resources", "Mistborn Manual")


def norm(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if not unicodedata.combining(c)).lower().strip()


def secciones(root, caps=None):
    out, orden = {}, collections.defaultdict(list)
    for f in sorted(glob.glob(os.path.join(root, "*", "*.md"))):
        cap = os.path.basename(os.path.dirname(f))[:2]
        if caps and cap not in caps:
            continue
        t = open(f, encoding="utf-8").read().split("---", 2)[-1]
        cur = None
        for l in t.splitlines():
            m = re.match(r"^(#{2,4})\s+(.*?)\s*$", l)
            if m:
                cur = norm(re.sub(r"\s+ERA\s*\d", "", m.group(2)))
                out.setdefault(cur, [])
                orden[cap].append(cur)
            elif cur is not None and l.strip():
                out[cur].append(l.strip())
    return {k: " ".join(v) for k, v in out.items()}, orden


def bag(s):
    return collections.Counter(re.findall(r"[a-z0-9]+", norm(s)))


def cos(a, b):
    n = sum(a[k] * b[k] for k in a if k in b)
    d = (sum(v * v for v in a.values()) * sum(v * v for v in b.values())) ** 0.5
    return n / d if d else 0.0


def main():
    S, orden = secciones(SL)
    M, _ = secciones(MB)
    nuevas, dif = collections.defaultdict(list), collections.defaultdict(list)
    for cap in ("01", "02", "04", "09", "10", "11", "12", "13", "14", "16"):
        for h in dict.fromkeys(orden.get(cap, [])):
            if len(S.get(h, "")) < 150:
                continue
            if h not in M:
                nuevas[cap].append((h, len(S[h])))
            else:
                c = cos(bag(S[h]), bag(M[h]))
                if c < 0.85:
                    dif[cap].append((h, round(c, 2)))
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    for cap in sorted(set(nuevas) | set(dif)):
        print("## capítulo", cap)
        print("  sin equivalente en Mistborn:", "; ".join(f"{h} ({n})" for h, n in nuevas[cap]))
        print("  distintos (similitud < 0,85):", "; ".join(f"{h} {c}" for h, c in dif[cap]))


if __name__ == "__main__":
    main()
