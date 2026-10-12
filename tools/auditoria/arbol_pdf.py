"""Auditoría: reconstruye las flechas de un árbol de talentos del PDF a partir de los dibujos vectoriales de la página.

Las tarjetas son rectángulos rellenos de blanco; las conexiones, líneas blancas de 2 pt. Se agrupan los segmentos que se tocan (con una
pequeña tolerancia) y se miran qué tarjetas toca cada grupo. Devuelve tarjetas (título, rectángulo) y aristas (a, b) sin orientar.
"""
import re
import pymupdf

TOL = 3.0


def rects_cercanos(a, b, tol=TOL):
    return not (a.x1 + tol < b.x0 or b.x1 + tol < a.x0 or a.y1 + tol < b.y0 or b.y1 + tol < a.y0)


def tarjetas(page):
    """Rectángulos blancos con texto: [(Rect, titulo)]."""
    words = page.get_text("words")  # x0,y0,x1,y1,palabra,bloque,linea,pos
    out = []
    for d in page.get_drawings():
        if d["type"] != "f" or not d.get("fill") or tuple(round(c, 2) for c in d["fill"]) != (1.0, 1.0, 1.0):
            continue
        r = d["rect"]
        if r.width < 60 or r.height < 25 or r.width > 400:
            continue
        ws = [w for w in words if r.x0 - 1 <= w[0] and w[2] <= r.x1 + 1 and r.y0 - 1 <= w[1] and w[3] <= r.y1 + 1]
        if not ws:
            continue
        # el título: primera línea (fuente más grande o primera línea de texto)
        primera = min(w[1] for w in ws)
        linea = [w for w in ws if abs(w[1] - primera) < 3]
        titulo = " ".join(w[4] for w in sorted(linea, key=lambda w: w[0]))
        out.append((r, titulo, " ".join(w[4] for w in sorted(ws, key=lambda w: (round(w[1]), w[0])))))
    return out


def segmentos(page):
    """Segmentos de las líneas blancas de conexión: [(x0,y0,x1,y1)]. Se ignoran los fondos y las cajas."""
    segs = []
    for d in page.get_drawings():
        if d["type"] not in ("s", "fs"):
            continue
        col = d.get("color")
        if not col or tuple(round(c, 2) for c in col) != (1.0, 1.0, 1.0):
            continue
        w = d.get("width") or 0
        if not (1.5 <= w <= 3.5):
            continue
        for it in d["items"]:
            if it[0] == "l":
                p, q = it[1], it[2]
                segs.append((p.x, p.y, q.x, q.y))
            elif it[0] == "re":
                r = it[1]
                segs += [(r.x0, r.y0, r.x1, r.y0), (r.x1, r.y0, r.x1, r.y1), (r.x1, r.y1, r.x0, r.y1), (r.x0, r.y1, r.x0, r.y0)]
    return segs


def aristas(cards, segs):
    """Une segmentos que se tocan; cada grupo conecta las tarjetas que toca."""
    n = len(segs)
    padre = list(range(n))

    def f(i):
        while padre[i] != i:
            padre[i] = padre[padre[i]]
            i = padre[i]
        return i

    bb = [pymupdf.Rect(min(s[0], s[2]), min(s[1], s[3]), max(s[0], s[2]), max(s[1], s[3])) for s in segs]
    for i in range(n):
        for j in range(i + 1, n):
            if rects_cercanos(bb[i], bb[j], 2.5):
                padre[f(i)] = f(j)
    grupos = {}
    for i in range(n):
        grupos.setdefault(f(i), []).append(i)
    res = []
    for g in grupos.values():
        tocan = []
        for k, (r, _, _) in enumerate(cards):
            rr = pymupdf.Rect(r.x0 - 2, r.y0 - 2, r.x1 + 2, r.y1 + 2)
            # toca si algún segmento del grupo corta el borde (no atraviesa el interior entero)
            if any(rects_cercanos(bb[i], rr, 0) for i in g):
                tocan.append(k)
        res.append((g, tocan))
    return res


def _punto_en_segmento(px, py, s, tol=2.5):
    x0, y0, x1, y1 = s
    if x0 == x1:  # vertical
        return abs(px - x0) <= tol and min(y0, y1) - tol <= py <= max(y0, y1) + tol
    if y0 == y1:
        return abs(py - y0) <= tol and min(x0, x1) - tol <= px <= max(x0, x1) + tol
    return False


def grafo(cards, segs):
    """Aristas entre tarjetas siguiendo las líneas (que pasan por detrás de las tarjetas).

    Cada segmento (horizontal o vertical) se recorre de un extremo al otro: las tarjetas que cruza o toca y los puntos donde otro segmento
    lo toca quedan ordenados; los consecutivos se conectan. Los puntos de unión se colapsan: dos tarjetas unidas por un punto sin otra
    tarjeta entre medias quedan conectadas. Devuelve {(i, j): 'directa'|'union'} con i < j."""
    # normaliza a segmentos axiales (las diagonales no aparecen en estos árboles)
    S = [s for s in segs if s[0] == s[2] or s[1] == s[3]]
    rects = [pymupdf.Rect(r) for r, _, _ in cards]
    nodos = {}   # clave -> id (tarjeta: ('c', k); unión: ('j', n))
    adj = {}

    def conecta(a, b):
        if a == b:
            return
        adj.setdefault(a, set()).add(b)
        adj.setdefault(b, set()).add(a)

    juntas = []   # puntos de unión (x, y)
    for i, s in enumerate(S):
        for j, t in enumerate(S):
            if i == j:
                continue
            for (px, py) in ((t[0], t[1]), (t[2], t[3])):
                if _punto_en_segmento(px, py, s):
                    juntas.append((px, py))
    # agrupa uniones cercanas
    uniones = []
    for p in juntas:
        for k, q in enumerate(uniones):
            if abs(p[0] - q[0]) < 3 and abs(p[1] - q[1]) < 3:
                break
        else:
            uniones.append(p)
    for i, s in enumerate(S):
        vert = s[0] == s[2]
        eje0, eje1 = (min(s[1], s[3]), max(s[1], s[3])) if vert else (min(s[0], s[2]), max(s[0], s[2]))
        fijo = s[0] if vert else s[1]
        pts = []
        for k, r in enumerate(rects):
            if vert:
                if r.x0 - 1 <= fijo <= r.x1 + 1 and not (r.y1 < eje0 - 2 or r.y0 > eje1 + 2):
                    pts.append(((r.y0 + r.y1) / 2, ("c", k)))
            else:
                if r.y0 - 1 <= fijo <= r.y1 + 1 and not (r.x1 < eje0 - 2 or r.x0 > eje1 + 2):
                    pts.append(((r.x0 + r.x1) / 2, ("c", k)))
        for u, (px, py) in enumerate(uniones):
            if _punto_en_segmento(px, py, s):
                pts.append((py if vert else px, ("j", u)))
        pts.sort(key=lambda x: x[0])
        for (a, na), (b, nb) in zip(pts, pts[1:]):
            conecta(na, nb)
    # colapso de uniones: tarjetas alcanzables por uniones sin pasar por otra tarjeta
    res = {}
    def vecinos_tarjeta(inicio, visto):
        out, pila = set(), [inicio]
        while pila:
            n = pila.pop()
            for m in adj.get(n, ()):
                if m in visto:
                    continue
                visto.add(m)
                if m[0] == "c":
                    out.add(m[1])
                else:
                    pila.append(m)
        return out
    for n in list(adj):
        if n[0] != "c":
            continue
        directos = {m[1] for m in adj[n] if m[0] == "c"}
        for m in directos:
            res[tuple(sorted((n[1], m)))] = "directa"
        for m in vecinos_tarjeta(n, {n}):
            k = tuple(sorted((n[1], m)))
            res.setdefault(k, "union")
    return res
