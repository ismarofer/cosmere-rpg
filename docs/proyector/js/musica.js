// Reproductor de la consola: lista en bucle con fundido cruzado, automático y manual.
(function (g) {
  const M = { vol: 0.8, fade: 3, aleatorio: false, ids: [], idx: -1, obtener: null };
  let canales = [], cur = null, pausado = false, cambiando = false, ultimo = performance.now();

  const aplicarVol = c => { c.a.volume = Math.min(1, c.g * c.g * M.vol); };
  M.refrescarVol = () => canales.forEach(aplicarVol);

  // Velocidad por pista (%). preservesPitch = false: el tono sube/baja con la velocidad, como una cinta.
  const velDe = id => Math.max(25, Math.min(200, (M.velocidad ? M.velocidad(id) : 100) || 100)) / 100;
  const aplicarVel = c => { c.a.preservesPitch = false; c.a.playbackRate = velDe(c.id); };
  M.refrescarVel = () => canales.forEach(aplicarVel);

  function quitar(c) {
    c.a.pause(); URL.revokeObjectURL(c.url);
    canales = canales.filter(x => x !== c);
    if (cur === c) cur = null;
  }
  function salir(c) { c.obj = 0; c.rate = 1 / c.f; }

  async function sonarIdx(i) {
    const n = M.ids.length; if (!n) return;
    cambiando = true;
    try {
      i = ((i % n) + n) % n;
      const id = M.ids[i], blob = await M.obtener(id); if (!blob) return;
      const a = new Audio(), url = URL.createObjectURL(blob); a.src = url;
      const c = { a, id, url, g: 0, obj: 1, f: M.fade, rate: 1 / M.fade };
      a.addEventListener('loadedmetadata', () => {
        c.f = Math.max(0.3, Math.min(M.fade, a.duration / 3)); if (c.obj === 1) c.rate = 1 / c.f;
      });
      a.addEventListener('ended', () => { if (c === cur && !cambiando) M.avanzar(1); });
      if (cur) salir(cur);
      canales.push(c); cur = c; M.idx = i; pausado = false;
      aplicarVol(c); aplicarVel(c);
      await a.play().catch(() => {});
    } finally { cambiando = false; }
  }

  M.avanzar = dir => {
    const n = M.ids.length; if (!n) return;
    let i;
    if (M.aleatorio && n > 1) { do { i = Math.floor(Math.random() * n); } while (i === M.idx); }
    else i = M.idx + dir;
    return sonarIdx(i);
  };

  M.poner = (ids, aleatorio) => {
    M.aleatorio = !!aleatorio;
    const mismo = ids.length === M.ids.length && ids.every((x, k) => x === M.ids[k]);
    M.ids = ids.slice();
    if (mismo && cur) return;
    const k = cur ? M.ids.indexOf(cur.id) : -1;
    if (k >= 0) { M.idx = k; return; }
    M.idx = -1;
    M.avanzar(1);
  };

  M.reproducirId = id => {
    const k = M.ids.indexOf(id);
    if (k < 0) { M.ids = [id]; return sonarIdx(0); }
    return sonarIdx(k);
  };

  M.alternar = () => {
    if (!cur) return;
    pausado = !pausado;
    canales.forEach(c => pausado ? c.a.pause() : c.a.play().catch(() => {}));
  };

  M.parar = () => { canales.forEach(salir); cur = null; pausado = false; };

  M.estado = () => ({
    id: cur ? cur.id : null, pausado,
    pos: cur ? cur.a.currentTime : 0, dur: cur && isFinite(cur.a.duration) ? cur.a.duration : 0,
  });

  setInterval(() => {
    const ahora = performance.now(), dt = Math.min(1, (ahora - ultimo) / 1000); ultimo = ahora;
    for (const c of canales.slice()) {
      if (!pausado) c.g += Math.sign(c.obj - c.g) * Math.min(Math.abs(c.obj - c.g), dt * c.rate);
      aplicarVol(c);
      if (c.obj === 0 && c.g === 0) quitar(c);
    }
    if (cur && !pausado && !cambiando && cur.a.duration > 0 && (cur.a.duration - cur.a.currentTime) / (cur.a.playbackRate || 1) <= cur.f) M.avanzar(1);
  }, 50);

  g.Musica = M;
})(window);
