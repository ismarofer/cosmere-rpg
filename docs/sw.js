/* Service worker: la web funciona sin conexión.
   Estrategia: red primero y, si falla, la copia guardada. Así, con conexión siempre ves la última versión
   desplegada, y sin ella (en la mesa, sin wifi) usas lo último que cargaste. No hay que versionar nada a mano:
   sube CACHE solo si quieres vaciar las copias guardadas. */
const CACHE = 'cosmere-v1';
const BASICO = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css', 'personaje/css/personaje.css',
  'proyector/css/proyector.css', 'combates/css/combates.css', 'nombres/css/nombres.css',
  'data/base.js', 'js/curated.js', 'js/icons.js', 'js/search.js', 'js/app-base.js', 'js/app-ficha.js', 'js/app-arboles.js', 'js/app-catalogo.js', 'js/app.js',
  'personaje/js/rules.js', 'personaje/js/engine.js', 'personaje/js/store.js', 'personaje/js/ui-common.js',
  'personaje/js/wizard-comun.js', 'personaje/js/wizard-datos.js', 'personaje/js/wizard-talentos.js', 'personaje/js/wizard-poderes.js', 'personaje/js/wizard-equipo.js', 'personaje/js/wizard.js', 'personaje/js/sheet.js', 'personaje/js/app.js', 'proyector/js/vista.js',
  'combates/js/amenaza.js', 'combates/js/adversarios.js', 'combates/js/modulos-datos.js', 'combates/js/modulos.js', 'combates/js/combate.js', 'combates/js/vista.js',
  'nombres/js/nombres.js', 'img/cosmere.svg', 'img/mistborn.svg', 'img/stormlight.svg',
];

self.addEventListener('install', (e) => {
  // guardado de cortesía: si algún fichero falla, no se aborta la instalación
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASICO.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(r).then((resp) => {
      if (resp.ok) { const copia = resp.clone(); caches.open(CACHE).then((c) => c.put(r, copia)); }
      return resp;
    }).catch(() => caches.match(r, { ignoreSearch: true }).then((m) => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))),
  );
});
