(() => {
  const $ = s => document.querySelector(s);
  const aj = Object.assign({ pxPorCm: 38 }, JSON.parse(localStorage.getItem('proy.aj') || '{}'));
  let escenas = [], activa = null, proy = null, out = null, conectado = false, outW = 1920, outH = 1080, fps = 0;
  const modo = { negro: false, pausa: false, congelado: false, calib: false };
  const cache = {};
  const prev = $('#prev'), pctx = prev.getContext('2d');
  $('#zoom').min = -500;

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const esc = () => escenas.find(e => e.id === activa);
  const dat = () => cache[activa];
  const igual = () => activa && activa === proy;
  const deb = (fn, ms) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };

  // ---------- comunicación ----------
  function enviar(m, tr) { if (out && !out.closed) out.postMessage(Object.assign({ p: 'proy' }, m), '*', tr || []); }
  async function enviarEscena() {
    const e = esc(), c = dat(); if (!e || !c) return;
    proy = activa;
    const fog = e.niebla ? await createImageBitmap(c.fog) : null;
    enviar({ t: 'escena', meta: e, img: c.blob, fog, trans: $('#trans').value }, fog ? [fog] : []);
    pintarLista(); pintarInfo();
  }
  function sync() {
    enviar({ t: 'ajustes', aj }); enviar({ t: 'modo', modo });
    if (proy && cache[proy]) { const a = activa; activa = proy; enviarEscena().then(() => { activa = a; pintarLista(); }); }
  }
  async function enviarNiebla() {
    if (!igual()) return;
    const b = await createImageBitmap(dat().fog);
    enviar({ t: 'niebla', fog: b }, [b]);
  }
  const enviarMeta = () => { if (igual()) enviar({ t: 'meta', meta: esc() }); guardarMeta(); };

  addEventListener('message', ev => {
    const m = ev.data;
    if (!m || m.p !== 'out' || !ev.source || ev.source.opener !== window) return;
    if (out !== ev.source) { out = ev.source; conectado = false; }
    outW = m.w; outH = m.h; fps = m.fps || fps;
    if (!conectado) { conectado = true; sync(); }
    $('#estado').textContent = `proyección ${outW}×${outH} · ${Math.round(fps)} fps`;
  });
  setInterval(() => {
    if (conectado && (!out || out.closed)) { conectado = false; $('#estado').textContent = 'sin proyección'; }
  }, 1500);

  // ---------- persistencia ----------
  const guardarMeta = deb(() => { const e = esc(); if (e) Alm.poner('escenas', e.id, e); }, 400);
  const guardarNiebla = deb(() => {
    const c = dat(); if (c) c.fog.toBlob(b => Alm.poner('nieblas', activa, b), 'image/png');
  }, 1200);

  async function datos(id) {
    if (cache[id]) return cache[id];
    const e = escenas.find(x => x.id === id);
    const blob = await Alm.leer('imagenes', id);
    const img = await createImageBitmap(blob);
    const fog = Niebla.crear(e.iw, e.ih);
    const fb = await Alm.leer('nieblas', id);
    if (fb) Niebla.reemplazar(fog, await createImageBitmap(fb));
    return (cache[id] = { blob, img, fog, undo: [], redo: [], url: URL.createObjectURL(blob) });
  }

  async function nuevaDesdeArchivo(file) {
    const img = await createImageBitmap(file);
    const e = {
      id: uid(), nombre: file.name.replace(/\.[^.]+$/, ''), tipo: 'mapa', iw: img.width, ih: img.height,
      niebla: true, orden: escenas.length,
      efectos: { oscuridad: 0, bruma: 0, lluvia: 0, ceniza: 0, relampagos: 0, viento: 0, luces: [] },
      vista: { cx: 0.5, cy: 0.5, zoom: 1, rot: 0 },
      cal: { pxCasilla: 70, cmCasilla: 2.5, grid: false },
    };
    await Alm.poner('imagenes', e.id, file); await Alm.poner('escenas', e.id, e);
    escenas.push(e);
    cache[e.id] = { blob: file, img, fog: Niebla.crear(e.iw, e.ih), undo: [], redo: [], url: URL.createObjectURL(file) };
    await Alm.poner('nieblas', e.id, await new Promise(r => cache[e.id].fog.toBlob(r, 'image/png')));
    return e.id;
  }

  async function subir(files) {
    let ultimo = null;
    const aud = files.filter(f => f.type.startsWith('audio/'));
    for (const f of files) if (f.type.startsWith('image/')) ultimo = await nuevaDesdeArchivo(f);
    if (aud.length) await subirAudio(aud);
    if (ultimo) await seleccionar(ultimo); else pintarLista();
  }

  // ---------- música ----------
  let pistas = [];
  Musica.obtener = id => Alm.leer('audios', id);
  Musica.vol = (aj.mVol ?? 80) / 100; Musica.fade = aj.mFade || 3;
  $('#mVol').value = aj.mVol ?? 80; $('#mFade').value = Musica.fade;
  const guardarAj = () => localStorage.setItem('proy.aj', JSON.stringify(aj));
  const mus = e => e.musica || (e.musica = { ids: [], aleatorio: false });
  const nombrePista = id => (pistas.find(p => p.id === id) || {}).nombre || '?';
  Musica.velocidad = id => (pistas.find(p => p.id === id) || {}).vel || 100;
  // El deslizador de velocidad actúa sobre la pista que suena y se guarda en la propia pista.
  let velId = null;
  function pintarVel(id) {
    const p = pistas.find(q => q.id === id);
    $('#mVel').disabled = !p; $('#mVel').value = p ? p.vel || 100 : 100; $('#mVelN').textContent = $('#mVel').value;
  }
  $('#mVel').addEventListener('input', ev => {
    const p = pistas.find(q => q.id === velId); if (!p) return;
    p.vel = +ev.target.value; $('#mVelN').textContent = p.vel;
    Musica.refrescarVel(); Alm.poner('pistas', p.id, p);
  });
  $('#mVel').addEventListener('dblclick', ev => { ev.target.value = 100; ev.target.dispatchEvent(new Event('input')); });

  async function subirAudio(files) {
    for (const f of files) {
      const p = { id: uid(), nombre: f.name.replace(/\.[^.]+$/, '') };
      await Alm.poner('audios', p.id, f); await Alm.poner('pistas', p.id, p);
      pistas.push(p);
    }
    pistas.sort((a, b) => a.nombre.localeCompare(b.nombre));
    pintarPistas();
  }
  function pintarPistas() {
    const ul = $('#pistas'); ul.innerHTML = '';
    const e = esc(), m = e ? mus(e) : { ids: [], aleatorio: false }, st = Musica.estado();
    $('#mAleat').checked = !!m.aleatorio;
    if (!pistas.length) ul.innerHTML = '<li class="mut">Sin pistas: usa «Añadir pistas» o suelta audio</li>';
    for (const p of pistas) {
      const li = document.createElement('li'); if (p.id === st.id) li.className = 'suena';
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = m.ids.includes(p.id); cb.disabled = !e;
      cb.onchange = () => {
        const l = mus(esc()).ids, k = l.indexOf(p.id);
        if (cb.checked && k < 0) l.push(p.id); else if (!cb.checked && k >= 0) l.splice(k, 1);
        enviarMeta();
      };
      const sp = document.createElement('span'); sp.textContent = p.nombre; sp.title = p.nombre;
      const pl = document.createElement('button'); pl.textContent = '▶'; pl.title = 'Reproducir ahora (con fundido)';
      pl.onclick = () => { const l = e ? mus(e).ids : []; if (l.includes(p.id)) Musica.ids = l.slice(); Musica.reproducirId(p.id); };
      const x = document.createElement('button'); x.textContent = '✕'; x.title = 'Quitar de la biblioteca';
      x.onclick = async () => {
        if (!confirm(`¿Quitar "${p.nombre}" de la biblioteca?`)) return;
        await Alm.borrar('audios', p.id); await Alm.borrar('pistas', p.id);
        pistas = pistas.filter(q => q.id !== p.id);
        for (const s of escenas) if (s.musica) { s.musica.ids = s.musica.ids.filter(i => i !== p.id); Alm.poner('escenas', s.id, s); }
        pintarPistas();
      };
      li.append(cb, sp, pl, x); ul.append(li);
    }
  }
  function aplicarMusica() {
    const e = esc(); if (!e) return;
    const m = mus(e); if (m.ids.length) Musica.poner(m.ids, m.aleatorio);
  }
  setInterval(() => {
    const st = Musica.estado();
    $('#mActual').textContent = st.id ? (st.pausado ? '⏸ ' : '♪ ') + nombrePista(st.id) : 'Nada sonando';
    $('#mBar').value = st.dur ? st.pos / st.dur : 0;
    if (st.id !== velId) { velId = st.id; pintarVel(st.id); }
    const prevSuena = document.querySelector('#pistas li.suena'), i = pistas.findIndex(p => p.id === st.id);
    const li = i >= 0 ? $('#pistas').children[i] : null;
    if (prevSuena !== li && $('#pistas').children.length === pistas.length) {
      if (prevSuena) prevSuena.classList.remove('suena');
      if (li) li.classList.add('suena');
    }
  }, 300);
  $('#mAdd').onclick = () => $('#fAud').click();
  $('#fAud').onchange = ev => { subirAudio([...ev.target.files]); ev.target.value = ''; };
  $('#mPrev').onclick = () => Musica.avanzar(-1);
  $('#mNext').onclick = () => Musica.avanzar(1);
  $('#mPlay').onclick = () => { if (Musica.estado().id) Musica.alternar(); else aplicarMusica(); };
  $('#mStop').onclick = () => Musica.parar();
  $('#mEsc').onclick = aplicarMusica;
  $('#mVol').addEventListener('input', ev => { aj.mVol = +ev.target.value; Musica.vol = aj.mVol / 100; Musica.refrescarVol(); guardarAj(); });
  $('#mFade').addEventListener('input', ev => { aj.mFade = Math.max(0.5, +ev.target.value || 3); Musica.fade = aj.mFade; guardarAj(); });
  $('#mAleat').addEventListener('change', ev => { mus(esc()).aleatorio = ev.target.checked; Musica.aleatorio = ev.target.checked; enviarMeta(); });

  // ---------- selección y UI ----------
  async function seleccionar(id) {
    activa = id; await datos(id); pintarLista(); pintarPanel(); ajustarVista(true);
  }
  function pintarLista() {
    const ul = $('#escenas'); ul.innerHTML = '';
    for (const e of escenas) {
      const li = document.createElement('li');
      li.className = (e.id === activa ? 'act ' : '') + (e.id === proy ? 'proy' : '');
      const im = document.createElement('img'); if (cache[e.id]) im.src = cache[e.id].url;
      const sp = document.createElement('span'); sp.textContent = e.nombre;
      li.append(im, sp); li.onclick = () => seleccionar(e.id); ul.append(li);
    }
  }
  function pintarInfo() { $('#infoProy').textContent = proy ? 'Proyectando: ' + (escenas.find(e => e.id === proy) || {}).nombre : ''; }
  function pintarPanel() {
    const e = esc(); if (!e) return;
    $('#nombre').value = e.nombre; $('#tipo').value = e.tipo; $('#nieb').checked = e.niebla;
    const ef = e.efectos;
    $('#osc').value = ef.oscuridad * 100; $('#bru').value = ef.bruma * 100;
    $('#llu').value = (ef.lluvia || 0) * 100; $('#cen').value = (ef.ceniza || 0) * 100;
    $('#rel').value = (ef.relampagos || 0) * 100; $('#vie').value = ef.viento || 0;
    $('#zoom').value = Math.round(Math.log2(e.vista.zoom) * 100);
    $('#pxCas').value = e.cal.pxCasilla; $('#cmCas').value = e.cal.cmCasilla; $('#grid').checked = e.cal.grid;
    $('#pxCm').value = aj.pxPorCm;
    pintarLuces(); pintarInfo(); pintarPistas();
  }
  function pintarLuces() {
    const ul = $('#luces'); ul.innerHTML = '';
    (esc().efectos.luces).forEach((l, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span style="color:${l.color}">● Luz ${i + 1}</span>`;
      const b = document.createElement('button'); b.textContent = '✕';
      b.onclick = () => { esc().efectos.luces.splice(i, 1); pintarLuces(); enviarMeta(); };
      li.append(b); ul.append(li);
    });
  }

  // ---------- vista ----------
  function ajustarVista(soloSiNueva) {
    const e = esc(); if (!e) return;
    const r = e.vista.rot % 180 ? [outH, outW] : [outW, outH];
    e.vista.zoom = Math.min(r[0] / e.iw, r[1] / e.ih); e.vista.cx = 0.5; e.vista.cy = 0.5;
    if (!soloSiNueva) { pintarPanel(); enviarMeta(); }
    else pintarPanel();
  }
  function escalaReal() {
    const e = esc(); if (!e) return;
    e.vista.zoom = aj.pxPorCm * e.cal.cmCasilla / e.cal.pxCasilla;
    pintarPanel(); enviarMeta();
  }

  // ---------- puntero en la vista previa ----------
  let ps = 1, ox = 0, oy = 0, hover = null, trazo = null, arrastre = null, crece = null;
  const aImg = ev => {
    const r = prev.getBoundingClientRect(), c = dat();
    return [(ev.clientX - r.left - ox) / ps / c.img.width, (ev.clientY - r.top - oy) / ps / c.img.height];
  };
  const herr = () => document.querySelector('input[name=h]:checked').value;
  const params = () => ({ r: $('#rad').value / 1000, h: $('#dur').value / 100, o: $('#int').value / 100 });

  function pushUndo() {
    const c = dat(); c.undo.push(Niebla.clonar(c.fog)); if (c.undo.length > 12) c.undo.shift(); c.redo = [];
  }
  function aplicar(tr) {
    Niebla.trazo(dat().fog, tr);
    if (igual()) enviar({ t: 'trazo', trazo: tr });
    guardarNiebla();
  }

  prev.addEventListener('contextmenu', e => e.preventDefault());
  prev.addEventListener('pointerdown', ev => {
    if (!activa || !dat()) return;
    prev.setPointerCapture(ev.pointerId);
    const p = aImg(ev), h = herr(), e = esc();
    if (ev.button === 1 || ev.button === 2 || h === 'vista') {
      arrastre = { p0: p, c0: [e.vista.cx, e.vista.cy] }; return;
    }
    if (ev.button !== 0) return;
    if (h === 'luz') {
      e.efectos.luces.push({ x: p[0], y: p[1], r: $('#tamLuz').value / 100, color: $('#colLuz').value, par: $('#parLuz').checked, i: 1 });
      pintarLuces(); enviarMeta(); return;
    }
    pushUndo();
    const q = params();
    if (h === 'crece') {
      crece = { p, r: 0.01, max: 0.3 };
      crece.id = setInterval(() => {
        crece.r = Math.min(crece.max, crece.r + 0.004);
        aplicar({ m: 'rev', pts: [crece.p], r: crece.r, h: q.h, o: Math.min(1, q.o) * 0.5 + 0.1 });
      }, 50);
      return;
    }
    trazo = { m: h, last: p, ...q };
    aplicar({ m: h, pts: [p], ...q });
  });
  prev.addEventListener('pointermove', ev => {
    if (!dat()) return;
    const p = aImg(ev); hover = p;
    if (arrastre) {
      const e = esc();
      e.vista.cx = Math.min(1, Math.max(0, arrastre.c0[0] - (p[0] - arrastre.p0[0])));
      e.vista.cy = Math.min(1, Math.max(0, arrastre.c0[1] - (p[1] - arrastre.p0[1])));
      enviarMeta(); return;
    }
    if (trazo) { aplicar({ m: trazo.m, pts: [trazo.last, p], r: trazo.r, h: trazo.h, o: trazo.o }); trazo.last = p; }
    if (crece) crece.p = p;
  });
  const fin = () => {
    trazo = null; arrastre = null;
    if (crece) { clearInterval(crece.id); crece = null; }
  };
  prev.addEventListener('pointerup', fin); prev.addEventListener('pointercancel', fin);
  prev.addEventListener('pointerleave', () => { hover = null; });
  prev.addEventListener('wheel', ev => {
    const e = esc(); if (!e) return; ev.preventDefault();
    e.vista.zoom = Math.min(16, Math.max(0.02, e.vista.zoom * (ev.deltaY < 0 ? 1.1 : 1 / 1.1)));
    $('#zoom').value = Math.round(Math.log2(e.vista.zoom) * 100); enviarMeta();
  }, { passive: false });

  // ---------- bucle de la vista previa ----------
  function bucle(now) {
    const r = prev.parentElement.getBoundingClientRect();
    if (prev.width !== (r.width | 0) || prev.height !== (r.height | 0)) { prev.width = r.width | 0; prev.height = r.height | 0; }
    const W = prev.width, H = prev.height;
    pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.fillStyle = '#0c0c0e'; pctx.fillRect(0, 0, W, H);
    const e = esc(), c = dat();
    if (e && c) {
      const iw = e.iw, ih = e.ih;
      ps = Math.min((W - 20) / iw, (H - 20) / ih); ox = (W - iw * ps) / 2; oy = (H - ih * ps) / 2;
      const t = now / 1000;
      Render.capas(pctx, W, H, { img: c.img, iw, ih, esc: e, fog: e.niebla ? c.fog : null }, x => x.setTransform(ps, 0, 0, ps, ox, oy), ps, t, true);
      // marco de la proyección
      const v = e.vista;
      pctx.save(); pctx.setTransform(ps, 0, 0, ps, ox, oy);
      pctx.translate(v.cx * iw, v.cy * ih); pctx.rotate(-v.rot * Math.PI / 180);
      pctx.lineWidth = 2 / ps; pctx.strokeStyle = modo.negro ? '#f44' : '#fc3'; pctx.setLineDash([8 / ps, 5 / ps]);
      pctx.strokeRect(-outW / v.zoom / 2, -outH / v.zoom / 2, outW / v.zoom, outH / v.zoom);
      // marca de "arriba" de la proyección
      pctx.setLineDash([]); pctx.beginPath(); pctx.moveTo(-14 / ps, -outH / v.zoom / 2 + 4 / ps); pctx.lineTo(14 / ps, -outH / v.zoom / 2 + 4 / ps); pctx.lineWidth = 6 / ps; pctx.stroke();
      pctx.restore();
      if (hover && ['rev', 'ocu', 'crece'].includes(herr())) {
        pctx.setTransform(1, 0, 0, 1, 0, 0); pctx.beginPath();
        pctx.arc(ox + hover[0] * iw * ps, oy + hover[1] * ih * ps, params().r * iw * ps, 0, 7);
        pctx.strokeStyle = '#fff'; pctx.lineWidth = 1; pctx.stroke();
      }
    }
    requestAnimationFrame(bucle);
  }
  requestAnimationFrame(bucle);

  // ---------- controles ----------
  const sobre = (id, fn) => $(id).addEventListener('input', fn);
  function undoRedo(de, a) {
    const c = dat(); if (!c || !c.undo) return;
    const src = c[de].pop(); if (!src) return;
    c[a].push(Niebla.clonar(c.fog)); Niebla.restaurar(c.fog, src); enviarNiebla(); guardarNiebla();
  }
  $('#bUndo').onclick = () => undoRedo('undo', 'redo');
  $('#bRedo').onclick = () => undoRedo('redo', 'undo');
  $('#bRevT').onclick = () => { if (!dat()) return; pushUndo(); Niebla.todo(dat().fog, true); enviarNiebla(); guardarNiebla(); };
  $('#bOcuT').onclick = () => {
    if (!dat() || !confirm('¿Ocultar todo el mapa?')) return;
    pushUndo(); Niebla.todo(dat().fog, false); enviarNiebla(); guardarNiebla();
  };
  $('#bProy').onclick = () => { enviarEscena(); aplicarMusica(); };
  $('#bBorrar').onclick = async () => {
    const e = esc(); if (!e || !confirm(`¿Borrar "${e.nombre}"?`)) return;
    for (const s of ['escenas', 'imagenes', 'nieblas']) await Alm.borrar(s, e.id);
    escenas = escenas.filter(x => x !== e); delete cache[e.id];
    if (proy === e.id) proy = null;
    activa = null; if (escenas.length) await seleccionar(escenas[0].id); else pintarLista();
  };
  sobre('#nombre', ev => { esc().nombre = ev.target.value; pintarLista(); guardarMeta(); });
  sobre('#tipo', ev => { const e = esc(); e.tipo = ev.target.value; e.niebla = e.tipo === 'mapa'; $('#nieb').checked = e.niebla; enviarMeta(); });
  sobre('#nieb', ev => { esc().niebla = ev.target.checked; enviarMeta(); });
  sobre('#osc', ev => { esc().efectos.oscuridad = ev.target.value / 100; enviarMeta(); });
  sobre('#bru', ev => { esc().efectos.bruma = ev.target.value / 100; enviarMeta(); });
  sobre('#llu', ev => { esc().efectos.lluvia = ev.target.value / 100; enviarMeta(); });
  sobre('#cen', ev => { esc().efectos.ceniza = ev.target.value / 100; enviarMeta(); });
  sobre('#rel', ev => { esc().efectos.relampagos = ev.target.value / 100; enviarMeta(); });
  sobre('#vie', ev => { esc().efectos.viento = +ev.target.value; enviarMeta(); });
  sobre('#zoom', ev => { esc().vista.zoom = Math.pow(2, ev.target.value / 100); enviarMeta(); });
  sobre('#pxCas', ev => { esc().cal.pxCasilla = +ev.target.value; enviarMeta(); });
  sobre('#cmCas', ev => { esc().cal.cmCasilla = +ev.target.value; enviarMeta(); });
  sobre('#grid', ev => { esc().cal.grid = ev.target.checked; enviarMeta(); });
  sobre('#pxCm', ev => { aj.pxPorCm = +ev.target.value || 38; localStorage.setItem('proy.aj', JSON.stringify(aj)); enviar({ t: 'ajustes', aj }); });
  $('#bRotI').onclick = () => { const e = esc(); e.vista.rot = (e.vista.rot + 270) % 360; enviarMeta(); };
  $('#bRotD').onclick = () => { const e = esc(); e.vista.rot = (e.vista.rot + 90) % 360; enviarMeta(); };
  $('#bAjustar').onclick = () => ajustarVista(false);
  $('#bReal').onclick = escalaReal;

  const alt = (id, k) => { $(id).onclick = () => { modo[k] = !modo[k]; $(id).classList.toggle('on', modo[k]); enviar({ t: 'modo', modo }); }; };
  alt('#bNegro', 'negro'); alt('#bPausa', 'pausa'); alt('#bCong', 'congelado'); alt('#bCalib', 'calib');
  const visible = () => !$('#pyr').hidden;   // la consola vive en el buscador: los atajos solo valen con ella a la vista
  addEventListener('keydown', ev => {
    if (!visible()) return;
    if (/INPUT|SELECT|TEXTAREA/.test(ev.target.tagName) && ev.target.type !== 'radio' && ev.target.type !== 'range') return;
    const k = ev.key.toLowerCase();
    if (k === 'b') $('#bNegro').click(); else if (k === 'p') $('#bPausa').click(); else if (k === 'f') $('#bCong').click();
    else if (k === 'z' && ev.ctrlKey) { ev.preventDefault(); $('#bUndo').click(); }
    else if (k === 'y' && ev.ctrlKey) { ev.preventDefault(); $('#bRedo').click(); }
  });

  $('#bAbrir').onclick = () => {
    out = window.open('proyector/salida.html', 'proyeccion', 'popup,width=1280,height=720');
    if (!out) alert('El navegador bloqueó la ventana emergente. Permítela e inténtalo de nuevo.');
  };

  // arrastrar y soltar / elegir archivos
  const drop = $('#drop');
  drop.onclick = () => $('#fImg').click();
  $('#fImg').onchange = ev => { subir([...ev.target.files]); ev.target.value = ''; };
  ['dragenter', 'dragover'].forEach(n => addEventListener(n, ev => { if (!visible()) return; ev.preventDefault(); drop.classList.add('over'); }));
  addEventListener('dragleave', ev => { if (!ev.relatedTarget) drop.classList.remove('over'); });
  addEventListener('drop', ev => { if (!visible()) return; ev.preventDefault(); drop.classList.remove('over'); subir([...ev.dataTransfer.files]); });

  // exportar / importar
  $('#bExp').onclick = async () => {
    const files = [], enc = new TextEncoder();
    for (const e of escenas) {
      if (cache[e.id]) await new Promise(r => cache[e.id].fog.toBlob(b => Alm.poner('nieblas', e.id, b).then(r), 'image/png'));
      files.push({ name: `img/${e.id}`, data: new Uint8Array(await (await Alm.leer('imagenes', e.id)).arrayBuffer()) });
      const fb = await Alm.leer('nieblas', e.id);
      if (fb) files.push({ name: `niebla/${e.id}.png`, data: new Uint8Array(await fb.arrayBuffer()) });
    }
    for (const p of pistas) {
      const b = await Alm.leer('audios', p.id);
      if (b) files.push({ name: `audio/${p.id}`, data: new Uint8Array(await b.arrayBuffer()) });
    }
    files.unshift({ name: 'escenas.json', data: enc.encode(JSON.stringify({ version: 2, aj, escenas, pistas })) });
    const a = document.createElement('a'); a.href = URL.createObjectURL(Zip.crear(files));
    a.download = 'proyector-' + new Date().toISOString().slice(0, 10) + '.zip'; a.click();
  };
  $('#bImp').onclick = () => $('#fImp').click();
  $('#fImp').onchange = async ev => {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    try {
      const fs = Zip.leer(await f.arrayBuffer()), por = n => fs.find(x => x.name === n);
      const man = JSON.parse(new TextDecoder().decode(por('escenas.json').data));
      for (const e of man.escenas) {
        await Alm.poner('escenas', e.id, e);
        await Alm.poner('imagenes', e.id, new Blob([por(`img/${e.id}`).data]));
        const n = por(`niebla/${e.id}.png`); if (n) await Alm.poner('nieblas', e.id, new Blob([n.data], { type: 'image/png' }));
        delete cache[e.id];
      }
      for (const p of man.pistas || []) {
        const d = por(`audio/${p.id}`); if (!d) continue;
        await Alm.poner('audios', p.id, new Blob([d.data])); await Alm.poner('pistas', p.id, p);
      }
      await cargar();
    } catch (err) { alert('No se pudo importar: ' + err.message); }
  };

  async function cargar() {
    pistas = (await Alm.todos('pistas')).sort((a, b) => a.nombre.localeCompare(b.nombre));
    escenas = (await Alm.todos('escenas')).sort((a, b) => a.orden - b.orden);
    for (const e of escenas) await datos(e.id);
    activa = null; pintarLista(); pintarPistas();
    if (escenas.length) await seleccionar(escenas[0].id);
  }
  // secciones plegables del panel (estado persistente)
  const plegadas = new Set(JSON.parse(localStorage.getItem('proy.plegadas') || '["Vista y escala"]'));
  document.querySelectorAll('#panel fieldset').forEach(fs => {
    const lg = fs.querySelector('legend'), k = lg.textContent.trim();
    fs.classList.toggle('cerr', plegadas.has(k));
    lg.onclick = () => {
      fs.classList.toggle('cerr');
      if (fs.classList.contains('cerr')) plegadas.add(k); else plegadas.delete(k);
      localStorage.setItem('proy.plegadas', JSON.stringify([...plegadas]));
    };
  });

  Alm.persistir();
  cargar().catch(err => alert('Error al abrir el almacenamiento del navegador: ' + err.message));
})();
