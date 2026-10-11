// Máscara de niebla: canvas cuyo alfa es la opacidad de la niebla (1 = oculto).
(function (g) {
  const Niebla = {
    crear(iw, ih) {
      const k = Math.min(1, 2048 / Math.max(iw, ih));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(iw * k)); c.height = Math.max(1, Math.round(ih * k));
      const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
      return c;
    },
    // trazo: {m:'rev'|'ocu', pts:[[x,y]...] (0-1 sobre la imagen), r (fracción del ancho), h (dureza 0-1), o (intensidad 0-1)}
    trazo(c, tr) {
      const ctx = c.getContext('2d');
      ctx.globalCompositeOperation = tr.m === 'rev' ? 'destination-out' : 'source-over';
      const R = Math.max(1, tr.r * c.width), a = tr.o >= 0.99 ? 1 : tr.o * 0.25;
      const h = Math.min(tr.h, 0.98), col = `rgba(0,0,0,${a})`;
      const dab = (x, y) => {
        const gr = ctx.createRadialGradient(x, y, 0, x, y, R);
        gr.addColorStop(0, col);
        for (let i = 1; i < 8; i++) {
          const u = i / 8, s = 1 - u * u * (3 - 2 * u);
          gr.addColorStop(h + (1 - h) * u, `rgba(0,0,0,${a * s})`);
        }
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
      };
      const step = Math.max(1, R * 0.18), W = c.width, H = c.height;
      const p = tr.pts;
      dab(p[0][0] * W, p[0][1] * H);
      for (let i = 1; i < p.length; i++) {
        const x0 = p[i - 1][0] * W, y0 = p[i - 1][1] * H, x1 = p[i][0] * W, y1 = p[i][1] * H;
        const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
        for (let k = 1; k <= n; k++) dab(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n);
      }
      ctx.globalCompositeOperation = 'source-over';
    },
    todo(c, revelar) {
      const ctx = c.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      if (revelar) ctx.clearRect(0, 0, c.width, c.height);
      else { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height); }
    },
    reemplazar(c, bmp) {
      const ctx = c.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(bmp, 0, 0, c.width, c.height);
    },
    clonar(c) {
      const n = document.createElement('canvas'); n.width = c.width; n.height = c.height;
      n.getContext('2d').drawImage(c, 0, 0); return n;
    },
    restaurar(c, src) {
      const ctx = c.getContext('2d'); ctx.clearRect(0, 0, c.width, c.height); ctx.drawImage(src, 0, 0);
    },
  };
  g.Niebla = Niebla;
})(window);
