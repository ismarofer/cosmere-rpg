(() => {
  const cv = document.getElementById('cv'), ctx = cv.getContext('2d'), ayuda = document.getElementById('ayuda');
  let d = null, modo = {}, aj = { pxPorCm: 38 }, t = 0, last = performance.now();
  let fade = 0, fadeT = 0, frames = 0, ultimoMsg = 0;

  function tam() { cv.width = innerWidth; cv.height = innerHeight; }
  tam();
  addEventListener('resize', () => { tam(); hola(); });
  addEventListener('dblclick', () => {
    if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen();
  });

  function enviar(m) { if (window.opener) window.opener.postMessage(Object.assign({ p: 'out' }, m), '*'); }
  function hola() { enviar({ t: 'hola', w: cv.width, h: cv.height }); }

  addEventListener('message', async ev => {
    if (ev.source !== window.opener) return;
    const m = ev.data;
    if (!m || m.p !== 'proy') return;
    ultimoMsg = performance.now();
    if (!d) ayuda.textContent = 'Conectado. Pulsa «Proyectar» en la consola.';
    switch (m.t) {
      case 'escena': {
        const img = await createImageBitmap(m.img);
        const fog = Niebla.crear(m.meta.iw, m.meta.ih);
        if (m.fog) Niebla.reemplazar(fog, m.fog);
        if (m.trans === 'fundido' && d) { fadeT = 1; await new Promise(r => setTimeout(r, 380)); }
        d = { img, iw: m.meta.iw, ih: m.meta.ih, fog, esc: m.meta };
        fadeT = 0; ayuda.style.display = 'none';
        break;
      }
      case 'meta': if (d && d.esc.id === m.meta.id) d.esc = m.meta; break;
      case 'trazo': if (d) Niebla.trazo(d.fog, m.trazo); break;
      case 'niebla': if (d) { Niebla.reemplazar(d.fog, m.fog); } break;
      case 'modo': modo = m.modo; break;
      case 'ajustes': aj = m.aj; break;
    }
  });

  function calib() {
    const s = aj.pxPorCm * 10, W = cv.width, H = cv.height;
    ctx.strokeStyle = 'rgba(0,220,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let x = 0; x <= W; x += s) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y <= H; y += s) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    ctx.fillStyle = '#0df'; ctx.font = '28px sans-serif';
    ctx.fillText('Cuadrícula de 10 cm — ajusta "px por cm" hasta que mida 10 cm en la mesa', 20, 40);
  }

  function bucle(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!modo.pausa) t += dt;
    fade += Math.sign(fadeT - fade) * Math.min(Math.abs(fadeT - fade), dt / 0.35);
    if (!modo.congelado) {
      if (modo.negro) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height); }
      else {
        Render.salida(ctx, cv.width, cv.height, d, t);
        if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, cv.width, cv.height); }
      }
      if (modo.calib) calib();
      frames++;
    }
    requestAnimationFrame(bucle);
  }
  requestAnimationFrame(bucle);

  setInterval(() => { enviar({ t: 'hola', w: cv.width, h: cv.height, fps: frames / 2 }); frames = 0; }, 2000);
  hola();
})();
