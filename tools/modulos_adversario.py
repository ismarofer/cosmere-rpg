#!/usr/bin/env python3
"""Genera docs/combates/js/modulos-datos.js a partir de los módulos de adversario de la Guía del Mundo de Mistborn
(resources/Mistborn Guia del Mundo/09 - Capítulo 8 Adversarios/32..35). Lo usa el gestor de combates para que un módulo
aplicado a un adversario añada de verdad sus acciones y rasgos. Uso: python tools/modulos_adversario.py"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CARPETA = RAIZ / 'resources' / 'Mistborn Guia del Mundo' / '09 - Capítulo 8 Adversarios'
SALIDA = RAIZ / 'docs' / 'combates' / 'js' / 'modulos-datos.js'

# «El <rol> tiene una mente…» → metal (el libro mezcla a veces el nombre de la mente; el rol es fiable).
ROL_FERRIN = {
    'mensajero de acero': 'acero', 'auténtico': 'aluminio', 'chispeante': 'cinc', 'archivero': 'cobre', 'incorporador': 'bendaleo',
    'centinela': 'bronce', 'resollante': 'cadmio', 'hilador': 'cromo', 'conector': 'duraluminio', 'pináculo': 'electro',
    'susurravientos': 'estano', 'ajustador': 'hierro', 'alma de fuego': 'laton', 'portaalmas': 'nicrosil',
    'hacedor de sangre': 'oro', 'bruto': 'peltre',
}
NOMBRE_METAL = {
    'acero': 'acero', 'atium': 'atium', 'bendaleo': 'bendaleo', 'bronce': 'bronce', 'cadmio': 'cadmio', 'cinc': 'cinc', 'cobre': 'cobre',
    'cromo': 'cromo', 'duraluminio': 'duraluminio', 'electro': 'electro', 'estano': 'estaño', 'hierro': 'hierro', 'laton': 'latón',
    'nicrosil': 'nicrosil', 'peltre': 'peltre', 'aluminio': 'aluminio', 'oro': 'oro',
}
SIN_ACENTOS = str.maketrans('áéíóúñ', 'aeioun')


def norm(s):
    return s.lower().translate(SIN_ACENTOS)


def leer(nombre):
    t = next(CARPETA.glob(nombre + ' - *.md')).read_text(encoding='utf-8')
    return re.sub(r'^---.*?---\s*', '', t, flags=re.S)


def secciones(texto):
    """[(encabezado, [párrafos])] por «### …» / «#### …»; el texto previo al primer encabezado va con encabezado ''."""
    out, cab, cuerpo = [], '', []
    for linea in texto.split('\n'):
        m = re.match(r'^#{3,4}\s+(.*)$', linea)
        if m:
            out.append((cab, cuerpo)); cab, cuerpo = m.group(1).strip(), []
        else:
            cuerpo.append(linea)
    out.append((cab, cuerpo))
    return out


def parrafos(lineas):
    ps, act = [], []
    for l in lineas:
        if l.strip():
            act.append(l.rstrip())
        elif act:
            ps.append(act); act = []
    if act:
        ps.append(act)
    return ps


def limpiar(t):
    t = re.sub(r'\s+', ' ', t).strip()
    return t


def rango_min(t):
    m = re.search(r'[Rr]ango\s*[≥]\s*(\d)', t) or re.search(r'[Rr]ango\s*(\d)\s*\+', t)
    return int(m.group(1)) if m else None


def items(lineas, tipo):
    """Divide el cuerpo de una sección RASGOS/ACCIONES en elementos [{tipo, glifo, n, texto}]."""
    res = []
    for ps in parrafos(lineas):
        cab = ps[0]
        if re.match(r'^[A-ZÁÉÍÓÚ ]{6,}$', cab.strip()):   # pies de ilustración en mayúsculas
            continue
        a = re.match(r'^([0-3r])\s+([A-ZÁÉÍÓÚ].*)$', cab) if tipo == 'acciones' else None
        r = re.match(r'^([A-ZÁÉÍÓÚ][^.◆\n]{2,60}?)\.\s+(.*)$', cab) if tipo == 'rasgos' and not cab.startswith('◆') else None
        if a:
            resto = a.group(2)
            nm = re.match(r'^(.+?)(?:\s*\(([^)]*)\))?\.\s+(.*)$', resto, re.S)
            if nm:
                res.append({'tipo': 'accion', 'glifo': a.group(1), 'n': nm.group(1).strip(), 'cab': nm.group(2) or '',
                            'lineas': [nm.group(3)] + ps[1:]})
            else:
                res.append({'tipo': 'accion', 'glifo': a.group(1), 'n': resto.strip(), 'cab': '', 'lineas': ps[1:]})
        elif r and res and res[-1]['tipo'] == 'rasgo' and False:
            pass
        elif r:
            nm = re.match(r'^(.+?)\s*\(([^)]*)\)$', r.group(1))
            res.append({'tipo': 'rasgo', 'glifo': None, 'n': (nm.group(1) if nm else r.group(1)).strip(), 'cab': nm.group(2) if nm else '',
                        'lineas': [r.group(2)] + ps[1:]})
        elif res:
            res[-1]['lineas'] += ps[0:] if True else []
    return res


def nuevo_item(it):
    texto = '\n'.join(it['lineas'])
    # viñetas ◆ en líneas propias; el resto se une
    partes, act = [], ''
    for l in texto.split('\n'):
        if l.startswith('◆'):
            if act:
                partes.append(act)
            act = l
        else:
            act = (act + ' ' + l).strip() if act else l
    if act:
        partes.append(act)
    cuerpo = '\n'.join(limpiar(p) for p in partes)
    rm = rango_min(cuerpo[:80])
    cuerpo = re.sub(r'^\s*(?:[Rr]ango\s*[≥]\s*\d|[Rr]ango\s*\d\s*\+)\s*', '', cuerpo)
    d = {'tipo': it['tipo'], 'n': it['n'], 'texto': cuerpo}
    if it['glifo'] is not None:
        d['glifo'] = it['glifo']
    if it['cab']:
        d['cab'] = it['cab']
    if rm:
        d['rangoMin'] = rm
    return d


def main():
    mods = {}   # id → módulo

    def modulo(fam, clave, nombre, **kw):
        i = f'{fam}:{clave}'
        if i not in mods:
            mods[i] = {'id': i, 'familia': fam, 'metal': clave, 'nombre': nombre, 'era': None, 'rangoMin': None, 'desc': '', 'reglas': '',
                       'rasgos': [], 'acciones': []}
        mods[i].update({k: v for k, v in kw.items() if v is not None})
        return mods[i]

    # ---------- alomancia (33) y feruquimia (34)
    for archivo, fam, patron in (('33', 'alomancia', r'^Los (?:brumosos|alomantes) de (\w+)'), ('34', 'feruquimia', r'^Los ferrins de (\w+)')):
        actual = None      # módulo al que pertenecen los elementos siguientes
        pendientes = []    # elementos previos a su acción «Quemar …»
        era_cab = None
        for cab, lineas in secciones(leer(archivo)):
            era_m = re.search(r'\bEra\s*([12])\b', cab)
            era_cab = int(era_m.group(1)) if era_m else (None if re.search(r'(Alomancia|Feruquimia) de', cab) else era_cab)
            # el nombre del módulo puede ir en el encabezado (a veces mezclado con un pie de ilustración)
            mcab = re.search(r'(Alomancia|Feruquimia) de (\w+)', cab)
            clave_cab = norm(mcab.group(2)) if mcab else None
            k = norm(cab).strip()
            if k in ('rasgos', 'acciones', 'oportunidades y complicaciones'):
                tipo = 'acciones' if k == 'acciones' else 'rasgos'
                for it in items(lineas, tipo):
                    d = nuevo_item(it)
                    if k.startswith('oportunidades'):
                        d['n'] = 'Oportunidades y complicaciones'
                    clave = None
                    if fam == 'alomancia':
                        q = re.match(r'^Quemar (\w+)', d['n'])
                        if q:
                            clave = norm(q.group(1))
                        elif 'duraluminio' in norm(d['n']):
                            clave = 'duraluminio'
                    else:
                        rol = re.search(r'^(?:El|La) (.+?) (?:tiene una mente|lleva)', d['texto'])
                        mt = re.match(r'^Mente(\w+)', d['n'])
                        if mt:   # el nombre de la mente manda; el libro confunde a veces el rol («Mentebendaleo … el centinela»)
                            c = norm(mt.group(1))
                            clave = 'electro' if c.startswith('lectro') else c
                        elif rol and rol.group(1) in ROL_FERRIN:
                            clave = ROL_FERRIN[rol.group(1)]
                        elif d['n'].startswith('Medallón'):
                            clave = 'medallon'
                    if clave:
                        actual = modulo(fam, clave, ('Medallón recuperable' if clave == 'medallon' else f'{fam.capitalize()} de {NOMBRE_METAL.get(clave, clave)}'))
                        for p in pendientes:
                            actual['rasgos' if p['tipo'] == 'rasgo' else 'acciones'].append(p)
                        pendientes = []
                        actual['rasgos' if d['tipo'] == 'rasgo' else 'acciones'].append(d)
                    elif fam == 'alomancia' and d['tipo'] == 'rasgo' and not actual:
                        pendientes.append(d)
                    elif actual is not None and not (fam == 'alomancia' and d['tipo'] == 'rasgo' and not re.search('Quemar', d['n'])):
                        actual['rasgos' if d['tipo'] == 'rasgo' else 'acciones'].append(d)
                    else:
                        pendientes.append(d)
                continue
            # descripción de módulo
            for ps in parrafos(lineas):
                t = limpiar(' '.join(ps))
                m = re.match(patron, t)
                if m and 'llamados' in t[:140] or (m and 'pueden' in t[:140]):
                    clave = norm(m.group(1))
                    actual = modulo(fam, clave, f'{fam.capitalize()} de {NOMBRE_METAL.get(clave, clave)}', desc=t)
                    if era_cab:
                        actual['era'] = era_cab
                    pendientes = []
                    continue
                if t.startswith('Reglas especiales.') and actual is not None:
                    actual['reglas'] = t[len('Reglas especiales.'):].strip()
                if t.startswith('Perfiles recomendados.') and actual is not None:
                    actual['perfiles'] = t[len('Perfiles recomendados.'):].strip()
        # Los elementos pendientes (p. ej. un rasgo previo a su «Quemar») ya se vaciaron al aparecer su módulo.

    # ---------- clavos hemalúrgicos (35)
    cl = None
    for cab, lineas in secciones(leer('35')):
        m = re.search(r'Clavo de (\w+)\s+Rango\s*[≥]\s*(\d)', cab)
        if m:
            clave = norm(m.group(1))
            cl = modulo('clavo', clave, f'Clavo de {m.group(1)}', rangoMin=int(m.group(2)), desc=limpiar(' '.join(' '.join(p) for p in parrafos(lineas))))
            continue
        if norm(cab) == 'rasgos' and cl is not None:
            for it in items(lineas, 'rasgos'):
                cl['rasgos'].append(nuevo_item(it))
            cl = None
    # el clavo de cinc/cobre/estaño/hierro llevan viñetas: se conservan en el texto del rasgo

    # ---------- ascendencia (32): kandra y sangre koloss
    sec = secciones(leer('32'))
    kandra = modulo('ascendencia', 'kandra', 'Kandra')
    koloss = modulo('ascendencia', 'koloss', 'De sangre koloss')
    for cab, lineas in sec:
        k = norm(cab)
        if k == 'rasgos':
            for it in items(lineas, 'rasgos'):
                kandra['rasgos'].append(nuevo_item(it))
        elif k == 'acciones':
            for it in items(lineas, 'acciones'):
                koloss['acciones'].append(nuevo_item(it))

    salida = [m for m in mods.values()]
    orden = {'alomancia': 0, 'feruquimia': 1, 'clavo': 2, 'ascendencia': 3}
    salida.sort(key=lambda m: (orden[m['familia']], m['nombre']))
    js = '/* Generado por tools/modulos_adversario.py desde la Guía del Mundo de Mistborn (cap. 8, módulos de adversario). No editar a mano. */\n'
    js += 'window.CB_MODULOS = ' + json.dumps(salida, ensure_ascii=False, indent=1) + ';\n'
    SALIDA.write_text(js, encoding='utf-8')
    print(f'{len(salida)} módulos → {SALIDA}')
    for m in salida:
        print(f"  {m['id']:28} era={m['era']} rmin={m['rangoMin']} rasgos={len(m['rasgos'])} acciones={len(m['acciones'])}"
              + ('  [REGLAS]' if m['reglas'] else ''))


if __name__ == '__main__':
    sys.exit(main())
