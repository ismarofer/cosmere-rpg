/* Lectura de los conjuntos de características de adversarios (DATA_DJ, categoría «adversario»). Motor puro, sin DOM. */
(function (g) {
  'use strict';
  const CB = g.CB = g.CB || {};

  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // «(Coste: de 1 a 4 puntos de Investidura)» → { recurso, cantidad, texto }. Solo el coste explícito entre paréntesis.
  function costeDe(texto) {
    const m = /\(Coste:\s*([^)]+)\)/i.exec(texto);
    if (!m) return null;
    const t = m[1], num = /(\d+)/.exec(t);
    const recurso = /investidura/i.test(t) ? 'investidura' : /concentraci/i.test(t) ? 'concentracion' : null;
    return { recurso, cantidad: num ? parseInt(num[1], 10) : 1, texto: t.trim() };
  }

  // El cuerpo trae: cabecera, rasgos («Nombre. Texto»), acciones y, al final, a veces tácticas. Las acciones empiezan con su coste en
  // glifo («1 Acometida: Porra…», «2 …», «0 …», «r …» para reacciones) o, en otros perfiles, con «— » (y ` r ` en línea para reacciones).
  const INICIO_ACCION = /(^|\n\n)(?:([0-3r])\s+(?=[A-ZÁÉÍÓÚÑ])|— )|\sr\s(?=[A-ZÁÉÍÓÚÑ][^.\n]{2,60}[.(])/g;
  const nombreDe = t => { const m = /^([^.]+?)\.(\s|$)/.exec(t); return m ? { n: m[1].trim(), resto: t.slice(m[0].length).trim() } : { n: t.slice(0, 40), resto: '' }; };

  function bloques(e) {
    const body = e.body || '';
    const marcas = [];
    let m;
    INICIO_ACCION.lastIndex = 0;
    while ((m = INICIO_ACCION.exec(body))) {
      const ini = m.index + (m[1] ? m[1].length : 0);
      const reaccion = m[2] === 'r' || /^\sr\s/.test(m[0]);
      marcas.push({ ini, ini2: m.index + m[0].length, glifo: m[2] || (reaccion ? 'r' : null), reaccion });
    }
    const primera = marcas.length ? marcas[0].ini : body.length;
    // Rasgos: párrafos antes de la primera acción (el primero es la cabecera).
    const rasgos = body.slice(0, primera).split(/\n\n/).slice(1).map(t => t.trim()).filter(Boolean).map(t => {
      const { n: bruto, resto } = nombreDe(t);
      return { n: bruto.replace(/\s*\(Coste:[^)]*\)/i, ''), texto: resto, coste: costeDe(t) };
    });
    const acciones = []; let tacticas = '';
    marcas.forEach((mk, i) => {
      const fin = i + 1 < marcas.length ? marcas[i + 1].ini : body.length;
      let seg = body.slice(mk.ini2, fin).trim();
      if (i === marcas.length - 1 || /\n\n/.test(seg)) {   // lo que sigue a la acción tras un párrafo en blanco no es suyo
        const k = seg.indexOf('\n\n');
        if (k >= 0) { if (i === marcas.length - 1) tacticas = seg.slice(k).trim(); seg = seg.slice(0, k).trim(); }
      }
      const era = /\bERA\s*([12])\b/.exec(seg);
      seg = seg.replace(/\s*\bERA\s*[12]\b\s*/g, ' ').replace(/\s+/g, ' ').trim();
      const { n: bruto, resto } = nombreDe(seg);
      const n = bruto.replace(/\s*\(Coste:[^)]*\)/i, '');
      acciones.push({ n, texto: resto, glifo: mk.glifo, reaccion: mk.reaccion, era: era ? parseInt(era[1], 10) : null, coste: costeDe(resto) || costeDe(seg) });
    });
    return { rasgos, acciones, tacticas };
  }

  function leer(e) {
    const f = e.f || {};
    const b = bloques(e);
    return {
      id: e.id, nombre: e.title, ambientacion: e.ambientacion || 'Mistborn', libro: e.libro || '',
      rol: f.rol, rango: f.rango, tamano: f.tamano,
      salud: f.salud, saludMin: f.salud_min, saludMax: f.salud_max,
      concentracion: f.concentracion || 0, investidura: f.investidura || 0,
      desvio: f.desvio || 0, movimiento: f.movimiento, sentidos: f.sentidos,
      defensas: { fis: f.def_fis, cog: f.def_cog, esp: f.def_esp },
      atributos: { fue: f.fue || 0, vel: f.vel || 0, int: f.int || 0, vol: f.vol || 0, dis: f.dis || 0, pre: f.pre || 0 },
      rasgos: b.rasgos, acciones: b.acciones, tacticas: b.tacticas,
    };
  }

  function todos(datosDJ) {
    return (datosDJ || []).filter(e => e.cat === 'adversario').map(leer).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  // Módulos aplicables (categoría «modulo»): alomancia, feruquimia, ascendencia (kandra), medallones y clavos hemalúrgicos. El libro agrupa
  // los clavos en entradas «rasgos» cuyo primer párrafo es «Clavo de X.»; el resto de entradas «rasgos»/«acciones» o de reglas generales
  // no son módulos. Devuelve [{ id, nombre, familia }] con el id de la entrada para enlazar su ficha.
  function modulos(datosDJ) {
    const out = [];
    (datosDJ || []).filter(e => e.cat === 'modulo').forEach(e => {
      const fam = ((e.f && e.f.familia) || '').replace(/^Módulos de /, '');
      let nombre = null;
      if (/^(Alomancia|Feruquimia) de /.test(e.title) || /^modulo-(kandra|medallones-feruquimicos|recuperable)$/.test(e.id)) nombre = e.title;
      else if (e.title === 'rasgos') { const m = /^(Clavo de [^.\n]+)\./.exec(e.body || ''); if (m) nombre = m[1]; }
      if (nombre) out.push({ id: e.id, nombre, familia: fam });
    });
    return out;
  }

  CB.adversarios = { leer, todos, bloques, modulos, costeDe };
})(typeof window !== 'undefined' ? window : globalThis);
