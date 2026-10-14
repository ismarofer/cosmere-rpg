"""Pruebas de extremo a extremo en un navegador real (Playwright + Edge o Chromium).

Uso:  python tools/test-e2e.py
Requiere: pip install playwright (usa el Edge instalado; si no hay, Chromium de Playwright).
Sirve docs/ por HTTP en un puerto libre; no modifica nada del repositorio.
"""
import functools
import http.server
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent / "docs"
LISTO = "!document.querySelector('#loading')"
fallos, ok = [], 0


def cierto(nombre, valor, detalle=""):
    global ok
    if valor:
        ok += 1
    else:
        fallos.append(f"FALLO {nombre} {detalle}")
        print(fallos[-1])


def servir():
    class Callado(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    manejador = functools.partial(Callado, directory=str(RAIZ))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), manejador)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def lanzar(p):
    try:
        return p.chromium.launch(channel="msedge")
    except Exception:
        return p.chromium.launch()


def main():
    srv = servir()
    base = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
    with sync_playwright() as p:
        nav = lanzar(p)
        ctx = nav.new_context(viewport={"width": 1280, "height": 900})
        pg = ctx.new_page()
        errores = []
        pg.on("pageerror", lambda e: errores.append(str(e)))
        pg.on("console", lambda m: errores.append(m.text) if m.type == "error" else None)

        def ir(hash_):
            pg.goto(base + hash_)
            pg.wait_for_function(LISTO, timeout=15000)
            pg.wait_for_timeout(150)

        # --- portada y buscador
        ir("#/")
        cierto("portada: sin errores de consola", not errores, str(errores))
        pg.fill("#q", "robusto")
        pg.wait_for_timeout(400)
        cierto("buscador: devuelve resultados", pg.locator("#view a").count() > 3)

        # --- personajes: se crean por el almacén y se recorren todos los pasos
        def crear(opciones, **campos):
            return pg.evaluate(
                """([o, campos]) => { const c = PJ.nuevoPersonaje(o); Object.assign(c, campos);
                   if (campos.nivel) c.nivelInicial = campos.nivel; PJ.store.guardar(c); return c.id; }""",
                [opciones, campos])

        casos = [
            ("humano Mistborn", dict(ascendencia="humana", camino="guerrero"), {}),
            ("kandra", dict(ascendencia="kandra", camino="agente"), {}),
            ("koloss", dict(ascendencia="koloss", camino="guerrero"), {}),
            ("humano Stormlight", dict(ambito="Stormlight", ascendencia="humana", camino="erudito"), {}),
            ("cantora", dict(ambito="Stormlight", ascendencia="cantora", camino="lider"), {}),
            ("humano rango 2", dict(ascendencia="humana", camino="cazador"), dict(nivel=6)),
            ("Stormlight rango 2", dict(ambito="Stormlight", ascendencia="humana", camino="guerrero"), dict(nivel=6)),
        ]
        ir("#/personajes")
        ids = {}
        for nombre, op, campos in casos:
            ids[nombre] = crear(op, **campos)
        for nombre, _, _ in casos:
            pid = ids[nombre]
            for modo in ("crear", "nivel"):
                pasos = pg.evaluate(
                    "([id, m]) => PJ.secuencia(m, PJ.store.cargar(id))", [pid, modo])
                for paso in pasos:
                    antes = len(errores)
                    ir(f"#/personajes/p/{pid}/{modo}/{paso}")
                    cierto(f"{nombre} · {modo}/{paso}: se pinta", pg.locator(".asistente .titulo-paso").count() == 1)
                    cierto(f"{nombre} · {modo}/{paso}: sin errores", len(errores) == antes, str(errores[antes:]))
            antes = len(errores)
            ir(f"#/personajes/p/{pid}")
            cierto(f"{nombre}: hoja se pinta", pg.locator("#vista").inner_text().strip() != "")
            cierto(f"{nombre}: hoja sin errores", len(errores) == antes, str(errores[antes:]))

        # --- restricción de ascendencia en el asistente (bloqueo duro)
        pid = ids["humano Mistborn"]
        ir(f"#/personajes/p/{pid}/crear/talentos")

        def botones(arbol):
            pg.select_option(".form select", arbol)
            pg.wait_for_timeout(100)
            return pg.locator("ul.lista.talentos >> nth=-1").locator("button:has-text('Añadir')")

        listos = botones("lider")
        cierto("humano: talentos heroicos se pueden añadir", listos.count() > 0 and listos.first.is_enabled())
        # entre los caminos de nacido del metal, ninguno debe poder añadirse
        pg.select_option(".form select", "brumoso")
        pg.wait_for_timeout(100)
        fuera = pg.locator("button:has-text('Añadir')")
        habilitados = sum(1 for i in range(fuera.count()) if fuera.nth(i).is_enabled())
        cierto("humano: talentos de nacido del metal bloqueados", fuera.count() > 0 and habilitados == 0,
               f"{habilitados}/{fuera.count()} habilitados")
        cierto("humano: motivo visible", pg.locator("text=Reservado").count() > 0)
        pg.locator("label.chk:has-text('Ignorar prerrequisitos') input").check()
        pg.wait_for_timeout(150)
        pg.select_option(".form select", "brumoso")
        fuera = pg.locator("button:has-text('Añadir')")
        habilitados = sum(1 for i in range(fuera.count()) if fuera.nth(i).is_enabled())
        cierto("humano: «Ignorar prerrequisitos» desbloquea", habilitados > 0)

        # --- subida de nivel desde la hoja
        pid = crear(dict(ascendencia="humana", camino="guerrero"))
        ir(f"#/personajes/p/{pid}")
        pg.locator("button:has-text('Subir de nivel')").click()
        pg.wait_for_timeout(300)
        cierto("subir de nivel: abre el asistente de nivel", "/nivel/" in pg.url)
        nivel = pg.evaluate("id => PJ.store.cargar(id).nivel", pid)
        cierto("subir de nivel: nivel 2", nivel == 2)

        # --- persistencia tras recargar
        pg.reload()
        pg.wait_for_function(LISTO)
        cierto("recarga: el personaje sigue guardado", pg.evaluate("id => !!PJ.store.cargar(id)", pid))

        # --- recorrido de rutas del buscador (Modo DJ): ninguna debe lanzar errores
        pg.goto(base + "?dj=1")
        pg.wait_for_function(LISTO)
        cats = pg.evaluate("CURATED.catalogs.map(c => c.id)")
        rutas = ["#/", "#/caminos", "#/buscar?q=robusto", "#/arbol/guerrero", "#/arbol/corredores-del-viento",
                 "#/talento/talento-robusto", "#/e/talento-robusto", "#/p/talento-robusto", "#/nombres",
                 "#/personajes", "#/combates", "#/proyector"] + [f"#/c/{c}" for c in cats]
        for amb in ("", "stormlight", "mistborn/1"):
            pg.evaluate("a => { localStorage.setItem('cosmere_ambientacion', a); }", amb)
            for r in rutas:
                antes = len(errores)
                pg.goto(base + r)
                pg.reload()
                try:
                    pg.wait_for_function(LISTO, timeout=15000)
                except Exception:
                    errores.append("no termina de cargar: " + pg.url + " :: " + pg.evaluate("document.body.innerText.slice(0, 120)"))
                pg.wait_for_timeout(120)
                cierto(f"ruta {r} [{amb or 'cosmere'}]: sin errores", len(errores) == antes, str(errores[antes:])[:200])
        pg.evaluate("localStorage.removeItem('cosmere_ambientacion')")

        # --- interacción: filtros del catálogo, árbol dibujado y panel lateral
        antes = len(errores)
        pg.goto(base + "#/c/talento")
        pg.reload()
        pg.wait_for_function(LISTO)
        pg.wait_for_timeout(300)
        filas = pg.locator("#view tbody tr").count()
        pg.locator("#view .chip.tog").first.click()
        pg.wait_for_timeout(200)
        cierto("catálogo: un filtro reduce las filas", 0 < pg.locator("#view tbody tr").count() < filas)
        pg.goto(base + "#/arbol/guerrero")
        pg.reload()
        pg.wait_for_function(LISTO)
        pg.wait_for_timeout(500)
        cierto("árbol: dibuja flechas", pg.locator(".treewrap path.e").count() > 5)
        pg.goto(base + "#/caminos")
        pg.reload()
        pg.wait_for_function(LISTO)
        pg.locator("#view a[href^='#/e/']").first.click()
        pg.wait_for_timeout(300)
        cierto("panel lateral: se abre", pg.locator("#drawer:not([hidden])").count() == 1 or "#/e/" in pg.url)
        cierto("interacción: sin errores", len(errores) == antes, str(errores[antes:])[:200])

        # --- PWA: manifiesto, service worker y funcionamiento sin conexión
        ir("#/")
        cierto("PWA: manifiesto enlazado", pg.locator("link[rel=manifest]").count() == 1)
        pg.evaluate("navigator.serviceWorker.ready")
        pg.reload()
        pg.wait_for_function("navigator.serviceWorker.controller !== null", timeout=10000)
        pg.wait_for_timeout(1500)
        ctx.set_offline(True)
        pg.reload()
        pg.wait_for_function(LISTO, timeout=15000)
        cierto("PWA: sin conexión carga la portada", pg.locator("#q").count() == 1)
        pg.fill("#q", "robusto")
        pg.wait_for_timeout(400)
        cierto("PWA: sin conexión el buscador funciona", pg.locator("#view a").count() > 3)
        ctx.set_offline(False)

        nav.close()
    srv.shutdown()
    print(f"\n{ok} comprobaciones correctas, {len(fallos)} fallos.")
    return 1 if fallos else 0


if __name__ == "__main__":
    sys.exit(main())
