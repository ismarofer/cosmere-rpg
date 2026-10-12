/* Almacenamiento local (localStorage) e importación/exportación JSON. Sin DOM. */
(function (g) {
  'use strict';
  const PJ = g.PJ = g.PJ || {};
  const CLAVE = 'cosmere-personajes-v1';
  const VERSION = 1;

  const ls = () => { try { return g.localStorage || null; } catch (e) { return null; } };
  let memoria = {};

  function leerTodo() {
    const s = ls();
    if (!s) return memoria;
    try { return JSON.parse(s.getItem(CLAVE) || '{}') || {}; } catch (e) { return {}; }
  }
  function escribirTodo(o) {
    const s = ls();
    if (!s) { memoria = o; return true; }
    try { s.setItem(CLAVE, JSON.stringify(o)); return true; } catch (e) { return false; }
  }

  // Historia antigua (todo texto libre) -> modelo con propósito, obstáculo, metas y conexiones. Idempotente.
  const lineas = s => String(s || '').split(/\r?\n/).map(l => l.replace(/^\s*[-•·*]\s*/, '').trim()).filter(Boolean);
  function migrarHistoria(h) {
    if (h.motivacion) { if (!h.proposito) h.proposito = h.motivacion; delete h.motivacion; }
    if (h.apariencia) { if (!h.aspectoTexto) h.aspectoTexto = h.apariencia; delete h.apariencia; }
    if (typeof h.objetivos === 'string') {
      if (!Array.isArray(h.metas)) h.metas = [];
      lineas(h.objetivos).forEach(t => h.metas.push({ texto: t, comoAvanzar: '', hitos: 0 }));
      delete h.objetivos;
    }
    if (typeof h.conexiones === 'string') {
      h.conexiones = lineas(h.conexiones).map(t => ({ nombre: t, nota: '' }));
    }
    const resto = [['concepto', 'Concepto'], ['personalidad', 'Personalidad'], ['patrocinador', 'Patrocinador'], ['companero', 'Compañero']]
      .filter(([k]) => h[k]).map(([k, n]) => `${n}: ${h[k]}`);
    ['concepto', 'personalidad', 'patrocinador', 'companero'].forEach(k => { delete h[k]; });
    if (resto.length) h.trasfondo = [h.trasfondo, ...resto].filter(Boolean).join('\n');
    if (!Array.isArray(h.metas)) h.metas = [];
    if (!Array.isArray(h.conexiones)) h.conexiones = [];
    h.metas = h.metas.map(m => ({ texto: String(m.texto || ''), comoAvanzar: String(m.comoAvanzar || ''), hitos: Math.max(0, Math.min(3, +m.hitos || 0)) }));
    return h;
  }

  // Completa campos que falten con los de un personaje nuevo (compatibilidad hacia adelante).
  function migrar(c) {
    if (!c || typeof c !== 'object' || !c.atributos || typeof c.ascendencia !== 'string') throw new Error('El fichero no es un personaje válido.');
    if ((c.version || 1) > VERSION) throw new Error('El personaje se creó con una versión más reciente de la herramienta.');
    const base = PJ.nuevoPersonaje();
    const r = Object.assign({}, base, c, { version: VERSION });
    r.atributos = Object.assign({}, base.atributos, c.atributos);
    r.atributos.creacion = Object.assign({}, base.atributos.creacion, c.atributos.creacion);
    r.historia = migrarHistoria(Object.assign({}, base.historia, c.historia));
    r.estado = Object.assign({}, base.estado, c.estado);
    if (!Array.isArray(r.estado.lista)) r.estado.lista = [];
    if (typeof r.estado.estados === 'string' && r.estado.estados.trim()) {
      r.estado.estados.split(/[,\n;]+/).map(s => s.trim()).filter(Boolean).forEach(t => r.estado.lista.push({ id: '', nombre: t }));
    }
    r.estado.estados = '';
    r.hemalurgia = Object.assign({}, base.hemalurgia, c.hemalurgia);
    r.radiante = Object.assign({}, base.radiante, c.radiante);
    if (!r.radiante.hitos || typeof r.radiante.hitos !== 'object') r.radiante.hitos = {};
    if (!PJ.AMBITOS[r.ambito]) r.ambito = 'Mistborn';
    if (!r.id) r.id = PJ.nuevoId();
    return r;
  }

  PJ.store = {
    VERSION,
    lista() {
      return Object.values(leerTodo()).sort((a, b) => String(b.modificado).localeCompare(String(a.modificado)));
    },
    cargar(id) { const c = leerTodo()[id]; return c ? migrar(c) : null; },
    guardar(c) {
      c.modificado = new Date().toISOString();
      const todo = leerTodo();
      todo[c.id] = c;
      return escribirTodo(todo);
    },
    borrar(id) { const todo = leerTodo(); delete todo[id]; escribirTodo(todo); },
    exportar(c) { return JSON.stringify(c, null, 2); },
    importar(texto) {
      let o;
      try { o = JSON.parse(texto); } catch (e) { throw new Error('El fichero no es JSON válido.'); }
      return migrar(o);
    },
    duplicar(c) {
      const copia = JSON.parse(JSON.stringify(c));
      copia.id = PJ.nuevoId(); copia.nombre = (c.nombre || 'Personaje') + ' (copia)'; copia.creado = new Date().toISOString();
      return copia;
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
