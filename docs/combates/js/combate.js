/* Encuentros preparados: estado, amenaza y operaciones sobre los adversarios. Motor puro, sin DOM; todo es JSON simple.
   Un encuentro = datos del grupo (nº de jugadores y nivel medio) + lista de adversarios con sus valores actuales. Sin simulación de turnos. */
(function (g) {
  'use strict';
  const CB = g.CB = g.CB || {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const uid = () => 'c' + Math.random().toString(36).slice(2, 9);

  CB.nuevoEncuentro = (nombre) => ({
    id: uid(), nombre: nombre || 'Encuentro nuevo', jugadores: 4, nivel: 1, ajuste: 0, notas: '', combatientes: [], historial: [],
  });
  CB.nuevaBiblioteca = () => ({ version: 2, abierto: null, encuentros: [] });

  // ---- adversarios
  CB.nuevoCombatiente = (o) => Object.assign({
    id: uid(), fuente: '', nombre: 'Sin nombre', rol: null, rango: 1, amenazaManual: null,
    salud: { act: 1, max: 1 }, concentracion: { act: 0, max: 0 }, investidura: { act: 0, max: 0 }, desvio: 0, movimiento: '',
    estados: [], lesiones: [], modulos: [], notas: '',
  }, o);

  CB.desdeAdversario = (a, numero) => CB.nuevoCombatiente({
    fuente: a.nombre, nombre: numero > 1 ? `${a.nombre} ${numero}` : a.nombre, rol: a.rol, rango: a.rango,
    salud: { act: a.salud, max: a.salud }, saludRango: [a.saludMin, a.saludMax],
    concentracion: { act: a.concentracion, max: a.concentracion }, investidura: { act: a.investidura, max: a.investidura },
    desvio: a.desvio, movimiento: a.movimiento || '',
    // atributos y «ya usa un arte Investido» (el primer módulo no aumenta entonces la amenaza); los módulos los necesitan
    atributos: a.atributos, artesPrevios: a.investidura > 0,
  });

  // Derrotado a 0 de salud; el Secuaz, además, al sufrir una lesión.
  CB.derrotado = (c) => c.salud.act <= 0 || (c.rol === 'Secuaz' && c.lesiones.length > 0);

  // ---- amenaza del encuentro
  CB.rangoEncuentro = (enc) => CB.rangoDeNivel(enc.nivel);
  CB.resumenAmenaza = (enc) => {
    const rango = CB.rangoEncuentro(enc);
    const enemigos = enc.combatientes.map(c => {
      const factor = CB.efectos ? CB.efectos(c).factorAmenaza : 1;
      const base = c.rol ? CB.amenazaAdversario(c.rol, c.rango, rango) : 0;
      const calculada = factor === 1 ? base : CB.aCuarto(base * factor);
      return { id: c.id, nombre: c.nombre, rol: c.rol, rango: c.rango, calculada, valor: c.amenazaManual != null ? c.amenazaManual : calculada, manual: c.amenazaManual != null };
    });
    const total = enemigos.reduce((s, e) => s + e.valor, 0);
    return { jugadores: enc.jugadores, nivel: enc.nivel, rango, enemigos, total,
      objetivos: CB.objetivos(enc.jugadores, enc.ajuste), dificultad: CB.dificultad(total, enc.jugadores, enc.ajuste) };
  };

  // ---- recursos
  // `valorDesvio`: desvío a restar si no es el del combatiente (p. ej. el de un módulo, solo contra laceración).
  CB.daño = (c, cantidad, { desvio = false, perforante = false, valorDesvio = null } = {}) => {
    const real = desvio && !perforante ? Math.max(0, cantidad - (valorDesvio != null ? valorDesvio : c.desvio)) : cantidad;
    c.salud.act = clamp(c.salud.act - real, 0, c.salud.max);
    return real;
  };
  CB.curar = (c, n) => { c.salud.act = clamp(c.salud.act + n, 0, c.salud.max); };
  // Suma (o resta) a un recurso respetando 0 y el máximo.
  CB.ajustar = (c, recurso, n) => { const r = c[recurso]; r.act = clamp(r.act + n, 0, r.max); };
  // Fija el valor actual (clamp 0..máx).
  CB.fijar = (c, recurso, v) => { const r = c[recurso]; r.act = clamp(Math.round(v) || 0, 0, r.max); };
  // Cambia el máximo; el actual no puede superarlo.
  CB.fijarMax = (c, recurso, v) => { const r = c[recurso]; r.max = Math.max(recurso === 'salud' ? 1 : 0, Math.round(v) || 0); r.act = Math.min(r.act, r.max); };
  // Devuelve false (sin cambiar nada) si no hay recurso suficiente.
  CB.gastar = (c, recurso, n) => {
    const r = c[recurso];
    if (n > 0 && r.act < n) return false;
    r.act = clamp(r.act - n, 0, r.max);
    return true;
  };
  CB.restaurar = (c) => { ['salud', 'concentracion', 'investidura'].forEach(k => { c[k].act = c[k].max; }); c.estados = []; c.lesiones = []; };
  // Módulos aplicados: no se repite el mismo módulo (regla del libro). Devuelve false si ya estaba.
  // Aplica el módulo: sube los máximos que el libro fija (Investidura de la alomancia, salud o concentración de algunos clavos) y lo
  // anota para poder deshacerlo al quitarlo. Acciones, rasgos, defensas y amenaza salen de CB.efectos.
  CB.añadirModulo = (c, m, adv) => {
    c.modulos = c.modulos || [];
    const dat = CB.datosModulo ? CB.datosModulo(m) : null;
    const idDe = x => ((CB.datosModulo && CB.datosModulo(x)) || x).id;   // los combates antiguos guardan el id del buscador
    if (c.modulos.some(x => idDe(x) === (dat ? dat.id : m.id))) return false;
    const reg = { id: dat ? dat.id : m.id, nombre: m.nombre };
    const cam = dat ? CB.cambiosModulo(c, dat, adv) : {};
    if (cam.investidura) { c.investidura.max = cam.investidura.a; c.investidura.act = Math.max(c.investidura.act, cam.investidura.a); }
    if (cam.concentracion) { c.concentracion.max += cam.concentracion; c.concentracion.act += cam.concentracion; }
    if (cam.salud) { c.salud.max += cam.salud; c.salud.act += cam.salud; }
    if (Object.keys(cam).length) reg.cambios = cam;
    c.modulos.push(reg);
    return true;
  };
  CB.quitarModulo = (c, id) => {
    const reg = (c.modulos || []).find(x => x.id === id);
    c.modulos = (c.modulos || []).filter(x => x.id !== id);
    if (!reg) return;
    const cam = reg && reg.cambios;
    if (!cam) return;
    if (cam.concentracion) { c.concentracion.max = Math.max(0, c.concentracion.max - cam.concentracion); c.concentracion.act = Math.min(c.concentracion.act, c.concentracion.max); }
    if (cam.salud) { c.salud.max = Math.max(1, c.salud.max - cam.salud); c.salud.act = Math.min(c.salud.act, c.salud.max); }
    // la Investidura solo vuelve atrás si nadie la ha retocado y no queda otro módulo de alomancia que la exija
    const otra = c.modulos.find(x => /^alomancia:/.test(CB.datosModulo ? (CB.datosModulo(x) || {}).id || '' : ''));
    if (cam.investidura && otra) otra.cambios = Object.assign(otra.cambios || {}, { investidura: cam.investidura });   // la exige ahora el otro módulo
    else if (cam.investidura && c.investidura.max === cam.investidura.a) { c.investidura.max = cam.investidura.de; c.investidura.act = Math.min(c.investidura.act, c.investidura.max); }
  };
  CB.añadirLesion =(c, texto) => { c.lesiones.push({ texto: texto || 'Lesión' }); };

  // ---- biblioteca de encuentros
  CB.copiarEncuentro = (enc) => { const o = JSON.parse(JSON.stringify(enc)); o.id = uid(); o.nombre = enc.nombre + ' (copia)'; o.historial = []; o.combatientes.forEach(c => { c.id = uid(); }); return o; };
  CB.resumenLista = (enc) => { const r = CB.resumenAmenaza(enc); return { enemigos: enc.combatientes.length, total: r.total, dificultad: r.dificultad, rango: r.rango }; };

  // ---- historial (deshacer = restaurar una copia del estado anterior del encuentro)
  const copia = enc => { const o = Object.assign({}, enc); delete o.historial; return JSON.parse(JSON.stringify(o)); };
  // Ejecuta `fn(enc)` anotando el cambio y guardando el estado previo.
  CB.cambiar = (enc, texto, fn) => {
    const antes = copia(enc);
    const r = fn(enc);
    enc.historial.push({ texto, antes });
    if (enc.historial.length > 60) enc.historial.shift();
    return r;
  };
  CB.deshacer = (enc) => {
    const h = enc.historial.pop();
    if (!h) return false;
    const hist = enc.historial;
    Object.keys(enc).forEach(k => delete enc[k]);
    Object.assign(enc, h.antes, { historial: hist });
    return true;
  };
})(typeof window !== 'undefined' ? window : globalThis);
