// Dibujo compartido por la consola (vista previa) y la salida (proyector).
(function (g) {
  const Render = {};
  let sc = null, sctx = null;

  function rgba(hex, a) {
    const n = parseInt((hex || '#ffcc66').slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  function flick(l, t) {
    if (!l.par) return 1;
    return 1 + 0.06 * Math.sin(t * 7 + l.x * 50) + 0.04 * Math.sin(t * 13.3 + l.y * 30);
  }

  const fr = x => x - Math.floor(x);
  const hs = (i, k) => fr(Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453);
  const mod = (a, n) => ((a % n) + n) % n;

  // Clima en espacio de pantalla, sin estado: la posición de cada partícula sale de (índice, t).
  function clima(ctx, W, H, ef, apply, iw, ih, t, prev) {
    const llu = ef.lluvia || 0, cen = ef.ceniza || 0, rel = ef.relampagos || 0;
    if (!(llu > 0 || cen > 0 || rel > 0)) return;
    const k = Math.min(W, H) / 1080, vw = ef.viento || 0, ang = vw * Math.PI / 180;
    const dx = Math.sin(ang), dy = Math.cos(ang);
    const m = 100 * k, Wm = W + 2 * m, Hm = H + 2 * m;
    ctx.save(); apply(ctx);
    ctx.beginPath(); ctx.rect(0, 0, iw, ih); ctx.clip();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (llu > 0) {
      const n = Math.round(llu * W * H / 1100);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const v = (1100 + 500 * hs(i, 3)) * k, L = (26 + 22 * hs(i, 4)) * k;
        const x = mod(hs(i, 1) * Wm + v * dx * t, Wm) - m, y = mod(hs(i, 2) * Hm + v * dy * t, Hm) - m;
        ctx.moveTo(x, y); ctx.lineTo(x - dx * L, y - dy * L);
      }
      ctx.lineWidth = Math.max(1, (1.1 + 1.2 * llu) * k); ctx.strokeStyle = `rgba(205,220,240,${0.25 + 0.6 * llu})`; ctx.stroke();
    }

    if (cen > 0) {
      const n = Math.round(cen * W * H / 3000), claro = new Path2D(), oscuro = new Path2D();
      for (let i = 0; i < n; i++) {
        const sz = (1.5 + 3 * hs(i, 3)) * k, v = (30 + 50 * hs(i, 4)) * k;
        const sw = Math.sin(t * (0.6 + hs(i, 5)) + hs(i, 6) * 6.28) * 25 * k;
        const x = mod(hs(i, 1) * Wm + vw * 3 * k * t, Wm) - m + sw, y = mod(hs(i, 2) * Hm + v * t, Hm) - m;
        claro.moveTo(x + sz + 1.2 * k, y); claro.arc(x, y, sz + 1.2 * k, 0, 6.3);
        oscuro.moveTo(x + sz, y); oscuro.arc(x, y, sz, 0, 6.3);
      }
      ctx.fillStyle = 'rgba(225,225,225,0.22)'; ctx.fill(claro);
      ctx.fillStyle = 'rgba(40,36,36,0.8)'; ctx.fill(oscuro);
    }

    if (rel > 0) {
      const P = 16 - 14 * rel, slot = Math.floor(t / P), loc = t - slot * P - hs(slot, 7) * P * 0.7;
      let f = 0;
      if (loc > 0) { f = Math.exp(-loc * 8); if (loc > 0.22) f = Math.max(f, 0.8 * Math.exp(-(loc - 0.22) * 7)); }
      if (f > 0.01) { ctx.fillStyle = `rgba(225,232,255,${Math.min(0.95, f * (0.5 + 0.5 * rel)) * (prev ? 0.6 : 1)})`; ctx.fillRect(0, 0, W, H); }
    }
    ctx.restore();
  }

  // apply(ctx) fija la transformación imagen->pantalla. s = escala (px pantalla por px imagen).
  Render.capas = function (ctx, W, H, d, apply, s, t, prev) {
    const e = d.esc, ef = e.efectos || {}, iw = d.iw, ih = d.ih, luces = ef.luces || [];
    ctx.save(); apply(ctx);
    ctx.drawImage(d.img, 0, 0, iw, ih);
    ctx.globalCompositeOperation = 'lighter';
    for (const l of luces) {
      const f = flick(l, t), x = l.x * iw, y = l.y * ih, R = l.r * iw * f;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, R);
      gr.addColorStop(0, rgba(l.color, 0.4 * (l.i ?? 1)));
      gr.addColorStop(1, rgba(l.color, 0));
      ctx.fillStyle = gr; ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
    }
    ctx.globalCompositeOperation = 'source-over';
    const cal = e.cal || {};
    if (cal.grid && cal.pxCasilla >= 4) {
      ctx.beginPath();
      const p = cal.pxCasilla, ox = cal.gx || 0, oy = cal.gy || 0;
      for (let x = ox % p; x <= iw; x += p) { ctx.moveTo(x, 0); ctx.lineTo(x, ih); }
      for (let y = oy % p; y <= ih; y += p) { ctx.moveTo(0, y); ctx.lineTo(iw, y); }
      ctx.lineWidth = 1.5 / s; ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.stroke();
    }
    ctx.restore();

    const osc = (ef.oscuridad || 0) * (prev ? 0.6 : 1);
    if (osc > 0) {
      if (!sc) { sc = document.createElement('canvas'); sctx = sc.getContext('2d'); }
      if (sc.width !== W || sc.height !== H) { sc.width = W; sc.height = H; }
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.globalCompositeOperation = 'source-over';
      sctx.clearRect(0, 0, W, H);
      sctx.fillStyle = `rgba(4,4,12,${osc})`; sctx.fillRect(0, 0, W, H);
      sctx.globalCompositeOperation = 'destination-out';
      apply(sctx);
      for (const l of luces) {
        const f = flick(l, t), x = l.x * iw, y = l.y * ih, R = l.r * iw * f * 1.2;
        const gr = sctx.createRadialGradient(x, y, 0, x, y, R);
        gr.addColorStop(0, `rgba(0,0,0,${l.i ?? 1})`);
        gr.addColorStop(0.55, `rgba(0,0,0,${0.5 * (l.i ?? 1)})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        sctx.fillStyle = gr; sctx.fillRect(x - R, y - R, 2 * R, 2 * R);
      }
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(sc, 0, 0);
    }

    if (ef.bruma > 0) {
      ctx.save(); apply(ctx);
      ctx.beginPath(); ctx.rect(0, 0, iw, ih); ctx.clip();
      const R = 0.45 * Math.max(iw, ih);
      for (let i = 0; i < 9; i++) {
        const x = (0.5 + 0.55 * Math.sin(t * 0.05 * (i + 1) + i * 2)) * iw;
        const y = (0.5 + 0.55 * Math.cos(t * 0.04 * (i + 2) + i * 3)) * ih;
        const gr = ctx.createRadialGradient(x, y, 0, x, y, R);
        gr.addColorStop(0, `rgba(225,228,235,${Math.min(1, ef.bruma * 0.75)})`);
        gr.addColorStop(1, 'rgba(225,228,235,0)');
        ctx.fillStyle = gr; ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
      }
      ctx.restore();
    }

    clima(ctx, W, H, ef, apply, iw, ih, t, prev);

    if (d.fog) {
      ctx.save(); apply(ctx);
      ctx.globalAlpha = prev ? 0.55 : 1;
      ctx.drawImage(d.fog, 0, 0, iw, ih);
      ctx.restore();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  Render.salida = function (ctx, W, H, d, t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (!d || !d.img) return;
    const v = d.esc.vista, z = v.zoom || 1;
    const apply = c => {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.translate(W / 2, H / 2); c.rotate(v.rot * Math.PI / 180); c.scale(z, z);
      c.translate(-v.cx * d.iw, -v.cy * d.ih);
    };
    Render.capas(ctx, W, H, { img: d.img, iw: d.iw, ih: d.ih, esc: d.esc, fog: d.esc.niebla ? d.fog : null }, apply, z, t, false);
  };

  g.Render = Render;
})(window);
