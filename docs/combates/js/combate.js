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
  });

  // Derrotado a 0 de salud; el Secuaz, además, al sufrir una lesión.
  CB.derrotado = (c) => c.salud.act <= 0 || (c.rol === 'Secuaz' && c.lesiones.length > 0);

  // ---- amenaza del encuentro
  CB.rangoEncuentro = (enc) => CB.rangoDeNivel(enc.nivel);
  CB.resumenAmenaza = (enc) => {
    const rango = CB.rangoEncuentro(enc);
    const enemigos = enc.combatientes.map(c => {
      const calculada = c.rol ? CB.amenazaAdversario(c.rol, c.rango, rango) : 0;
      return { id: c.id, nombre: c.nombre, rol: c.rol, rango: c.rango, calculada, valor: c.amenazaManual != null ? c.amenazaManual : calculada, manual: c.amenazaManual != null };
    });
    const total = enemigos.reduce((s, e) => s + e.valor, 0);
    return { jugadores: enc.jugadores, nivel: enc.nivel, rango, enemigos, total,
      objetivos: CB.objetivos(enc.jugadores, enc.ajuste), dificultad: CB.dificultad(total, enc.jugadores, enc.ajuste) };
  };

  // ---- recursos
  CB.daño = (c, cantidad, { desvio = false, perforante = false } = {}) => {
    const real = desvio && !perforante ? Math.max(0, cantidad - c.desvio) : cantidad;
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
  CB.añadirModulo = (c, m) => {
    c.modulos = c.modulos || [];
    if (c.modulos.some(x => x.id === m.id)) return false;
    c.modulos.push({ id: m.id, nombre: m.nombre });
    return true;
  };
  CB.quitarModulo = (c, id) => { c.modulos = (c.modulos || []).filter(x => x.id !== id); };
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
