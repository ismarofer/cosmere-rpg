/* Interfaz de combates preparados, integrada en el buscador (#/combates, Modo DJ). CB.montar(el) pinta la herramienta en `el`.
   Dos pantallas: la lista de encuentros preparados y un encuentro (nº de jugadores + nivel medio, tabla de adversarios con sus valores
   editables y acciones). Todo se guarda en localStorage tras cada cambio; la vista se repinta entera. */
(function (g) {
  'use strict';
  const CB = g.CB;
  const CLAVE = 'cosmere-combates-v2';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const num = v => (Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100).replace('.', ','));
  const act = k => (g.UI && g.UI.act ? g.UI.act(k) : '');

  let bib, enc = null, root, advs = null, mods = [];
  const ui = { q: '', rol: '', libro: '', abiertos: new Set(), dano: {}, desvio: true, perforante: false, aviso: '' };

  // ------------------------------------------------------------------ almacenamiento
  function cargar() {
    try { const o = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (o && o.version === 2 && Array.isArray(o.encuentros)) return o; } catch (e) { /* sin datos */ }
    return CB.nuevaBiblioteca();
  }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(bib)); } catch (e) { /* sin almacenamiento */ } }
  function cambiar(texto, fn) { CB.cambiar(enc, texto, fn); guardar(); render(); }
  const comb = id => enc && enc.combatientes.find(c => c.id === id);
  const advDe = c => advs.find(a => a.nombre === c.fuente);
  // Desvío a restar: el del combatiente, o el del módulo (kandra: 5) cuando el daño es por laceración.
  const desvioEf = c => (ui.lacer ? Math.max(c.desvio, CB.efectos(c, advDe(c)).desvioLaceracion) : c.desvio);
  const fichaMod = m => { const d = CB.datosModulo(m); const k = d && mods.find(x => x.id === d.id); return k && k.ficha; };
  const modEnlace = m => (fichaMod(m) ? `<a href="#/e/${esc(fichaMod(m))}" title="Ver el módulo en el libro">${esc(m.nombre)}</a>` : esc(m.nombre));
  function aviso(t) {
    ui.aviso = t;
    const el = root.querySelector('#cb-aviso');
    if (el) { el.textContent = t; el.hidden = !t; }
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => { ui.aviso = ''; const e2 = root.querySelector('#cb-aviso'); if (e2) e2.hidden = true; }, 3500);
  }
  function descargar(nombre, datos) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 1)], { type: 'application/json' }));
    a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  }

  // ------------------------------------------------------------------ piezas
  const barra = (r, cls) => `<span class="cb-bar ${cls || ''}"><i style="width:${r.max ? Math.max(0, Math.min(100, r.act / r.max * 100)) : 0}%"></i></span>`;

  function vAmenaza(r) {
    const o = r.objetivos, tope = Math.max(r.total * 1.05, o.dificil * 1.3, 1);
    const pos = v => (v / tope * 100).toFixed(1);
    const marca = (v, t) => `<span class="cb-marca" style="left:${pos(v)}%"><b>${t} ${num(v)}</b></span>`;
    return `<section class="cb-amenaza dif-${r.dificultad.clave}">
      <div class="cb-amenaza-t"><b>Amenaza ${num(r.total)}</b><span class="cb-dif">${esc(r.dificultad.etiqueta)}</span>
        <span class="muted">${r.jugadores} jugador${r.jugadores === 1 ? '' : 'es'} · nivel medio ${num(r.nivel)} (rango ${r.rango})</span></div>
      <div class="cb-escala"><span class="cb-relleno" style="width:${pos(r.total)}%"></span>${marca(o.facil, 'Fácil')}${marca(o.promedio, 'Promedio')}${marca(o.dificil, 'Difícil')}</div>
    </section>`;
  }

  // ------------------------------------------------------------------ lista de encuentros
  function vLista() {
    const filas = bib.encuentros.map(e => {
      const s = CB.resumenLista(e);
      return `<tr><td><a href="#" data-a="abrir" data-id="${e.id}"><b>${esc(e.nombre)}</b></a></td>
        <td>${e.jugadores}</td><td>${num(e.nivel)} <span class="muted">(rango ${s.rango})</span></td><td>${s.enemigos}</td>
        <td>${num(s.total)}</td><td><span class="cb-dif dif-${s.dificultad.clave}">${esc(s.dificultad.etiqueta)}</span></td>
        <td class="cb-fin"><button class="btn small" data-a="abrir" data-id="${e.id}">Abrir</button>
          <button class="btn small" data-a="copiar" data-id="${e.id}">Duplicar</button>
          <button class="btn small" data-a="borrar" data-id="${e.id}">Borrar</button></td></tr>`;
    }).join('');
    return `<section class="cb-col"><div class="cb-acciones"><button class="btn primario" data-a="nuevo">Nuevo encuentro</button>
        <button class="btn" data-a="importar">Importar</button>${bib.encuentros.length ? '<button class="btn" data-a="exportar-todo">Exportar todo</button>' : ''}
        <input type="file" id="cb-imp" accept="application/json,.json" hidden></div>
      ${bib.encuentros.length ? `<table class="cb-tabla"><thead><tr><th>Encuentro</th><th>Jugadores</th><th>Nivel medio</th><th>Adversarios</th><th>Amenaza</th><th>Dificultad</th><th></th></tr></thead><tbody>${filas}</tbody></table>`
        : '<p class="muted">Todavía no hay combates preparados. Crea uno con «Nuevo encuentro».</p>'}
      <p class="nota">Los encuentros se guardan solo en este navegador. Exporta una copia en JSON para no perderlos o llevarlos a otro equipo.</p></section>`;
  }

  // ------------------------------------------------------------------ encuentro
  // La ambientación es la de la cabecera (window.CosmereAmb): esta herramienta no tiene filtro propio.
  const encajaAmb = a => !g.CosmereAmb || g.CosmereAmb.cubre(a.ambientacion);
  function vAdvs(r) {
    const q = norm(ui.q);
    const lista = advs.filter(a => (!ui.rol || a.rol === ui.rol) && encajaAmb(a) && (!ui.libro || a.libro === ui.libro) && (!q || norm(a.nombre).includes(q)));
    if (!lista.length) return '<p class="muted">Ningún adversario coincide.</p>';
    return '<ul class="cb-lista cb-advs">' + lista.map(a => `<li><span><a href="#/e/${esc(a.id)}" title="Ver la ficha completa"><b>${esc(a.nombre)}</b></a> <span class="cb-rol rol-${esc(a.rol)}">${esc(a.rol)}</span>${a.ambientacion !== 'Mistborn' ? ` <span class="chip small soft">${esc(a.ambientacion.replace('Mistborn ', ''))}</span>` : ''}
        <span class="muted">r${a.rango} · ♥${a.salud} · amenaza ${num(CB.amenazaAdversario(a.rol, a.rango, r.rango))}</span></span>
        <button class="btn small" data-a="añadir" data-id="${esc(a.nombre)}" title="Añadir al encuentro">+</button></li>`).join('') + '</ul>';
  }

  const campoNum = (c, k, campo) => `<input type="number" class="cb-n" min="0" data-a="val" data-id="${c.id}" data-k="${k}" data-c="${campo}" value="${c[k][campo]}">`;
  const celdaRecurso = (c, k, cls) => `<td class="cb-rec">${barra(c[k], cls)}<span class="cb-ctl">${campoNum(c, k, 'act')}<span class="muted">/ ${c[k].max}</span></span></td>`;
  // El máximo no se toca en la tabla: se cambia en «Modificar» del detalle (módulos, salud).
  const campoMax = (c, k, l) => `<label class="cb-campo">${l} máx. <input type="number" class="cb-n" min="${k === 'salud' ? 1 : 0}" data-a="val" data-id="${c.id}" data-k="${k}" data-c="max" value="${c[k].max}"></label>`;
  function vModificar(c) {
    const am = CB.resumenAmenaza(enc).enemigos.find(e => e.id === c.id);
    const ap = c.modulos || [], usados = new Set(ap.map(m => (CB.datosModulo(m) || m).id));
    const porFam = {};
    mods.filter(m => !usados.has(m.id)).forEach(m => { (porFam[m.familia] = porFam[m.familia] || []).push(m); });
    return `<h4>Modificar</h4><div class="cb-mod">
      <div class="cb-maxs">${campoMax(c, 'salud', 'Salud')}${campoMax(c, 'concentracion', 'Concentración')}${campoMax(c, 'investidura', 'Investidura')}
        <label class="cb-campo">Desvío <input type="number" class="cb-n" min="0" data-a="desvio-val" data-id="${c.id}" value="${c.desvio}"></label>
        <label class="cb-campo" title="Vacía la casilla para volver al valor calculado">Amenaza <input type="number" step="0.25" min="0" class="cb-n ${am.manual ? 'manual' : ''}" data-a="amenaza" data-id="${c.id}" value="${String(am.valor)}"></label>
        ${am.manual ? `<span class="muted">calculada ${num(am.calculada)}</span>` : ''}</div>
      <div class="cb-estados"><b>Módulos</b> ${ap.map(m => `<span class="chip soft">${modEnlace(m)}<button class="cb-x" data-a="modulo-quitar" data-id="${c.id}" data-m="${esc(m.id)}" title="Quitar módulo">✕</button></span>`).join('') || '<span class="muted">ninguno</span>'}
        <select data-a="modulo-add" data-id="${c.id}"><option value="">+ módulo…</option>${Object.keys(porFam).map(f => `<optgroup label="${esc(f)}">${porFam[f].map(m => `<option value="${esc(m.id)}">${esc(m.nombre)}</option>`).join('')}</optgroup>`).join('')}</select></div>
      ${vEfectos(c)}</div>`;
  }

  // Resumen de lo que hacen los módulos aplicados (Investidura, habilidades, defensas, desvío, amenaza) y avisos de reglas.
  function vEfectos(c) {
    const ef = CB.efectos(c, advDe(c));
    if (!ef.mods.length) return '<p class="nota">Al añadir un módulo se aplican sus acciones y rasgos, la Investidura y las habilidades que da, las defensas y la amenaza.</p>';
    const li = [];
    if (ef.factorAmenaza > 1) li.push('Amenaza ×1,5 (el primer módulo la aumenta en la mitad).');
    if (ef.investidura != null) li.push(`Investidura: al menos ${ef.investidura} (2 + Discernimiento o Presencia).`);
    ef.habilidades.forEach(h => li.push(`${esc(h.n)} ${h.mod >= 0 ? '+' : ''}${h.mod}${h.grados != null ? ` (${h.grados} grados)` : ''} — ${esc(h.nota)}.`));
    if (ef.escala) li.push(`Artes metálicas (rango ${c.rango}): dado ${ef.escala.dado}, alcance ${ef.escala.alcance}.`);
    const d = ef.defensas;
    if (d.fis || d.cog || d.esp) li.push(`Defensas: ${[['física', d.fis], ['cognitiva', d.cog], ['espiritual', d.esp]].filter(x => x[1]).map(x => `${x[0]} ${x[1] > 0 ? '+' : ''}${x[1]}`).join(', ')}.`);
    ef.notas.forEach(n => li.push(esc(n)));
    return `<ul class="cb-efectos">${li.map(x => `<li>${x}</li>`).join('')}${ef.avisos.map(x => `<li class="mal">⚠ ${esc(x)}</li>`).join('')}</ul>`;
  }

  // Acciones y rasgos que aportan los módulos aplicados, con los cálculos del libro resueltos para el rango del adversario.
  function vModulos(c) {
    const ef = CB.efectos(c, advDe(c));
    if (!ef.mods.length) return '';
    const rango = c.rango || 1;
    const texto = t => esc(CB.textoModulo(t, rango)).replace(/\n/g, '<br>');
    const accion = (a, mid, j) => {
      const coste = a.cab ? CB.adversarios.costeDe('(' + a.cab + ')') : null;
      const falta = coste && coste.recurso && c[coste.recurso].act < coste.cantidad;
      const noRango = a.rangoMin && rango < a.rangoMin;
      return `<li class="${falta || noRango ? 'sin-coste' : ''}"><div class="cb-it"><div class="cb-it-t">${a.glifo != null ? act(a.glifo) : ''}<b>${esc(a.n)}</b>${a.rangoMin ? ` <span class="chip small soft">rango ≥${a.rangoMin}</span>` : ''}${a.cab ? ` <span class="chip small">${esc(CB.textoModulo(a.cab.replace(/^Coste:\s*/i, ''), rango))}</span>` : ''}${a.glifo === 'r' ? ' <span class="chip small">reacción</span>' : ''}</div>
          <p>${texto(a.texto)}</p></div>
        ${coste && coste.recurso ? `<button class="btn small" data-a="pagar" data-id="${c.id}" data-m="${esc(mid)}" data-j="${j}" title="Descontar el coste del recurso">Usar</button>` : ''}</li>`;
    };
    const rasgo = a => `<li><div class="cb-it"><div class="cb-it-t"><b>${esc(a.n)}</b>${a.rangoMin ? ` <span class="chip small soft">rango ≥${a.rangoMin}</span>` : ''}${a.cab ? ` <span class="chip small">${esc(CB.textoModulo(a.cab, rango))}</span>` : ''}</div><p>${texto(a.texto)}</p></div></li>`;
    const bloques = ef.mods.filter(m => m.acciones.length || m.rasgos.length).map(m => `<li class="cb-mod-t"><span class="chip small">${esc(m.nombre)}</span>${m.era ? ` <span class="chip small soft">Era ${m.era}</span>` : ''}</li>`
      + m.acciones.map((a, j) => accion(a, m.id, j)).join('') + m.rasgos.map(rasgo).join('')).join('');
    const base = ef.acciones.map(a => `<li><div class="cb-it"><div class="cb-it-t">${act(a.glifo)}<b>${esc(a.n)}</b> <span class="chip small">${esc(a.modulo)}</span></div></div></li>`).join('');
    return `<h4>Módulos</h4><ul class="cb-acc">${base}${bloques}</ul>`;
  }

  function vDetalle(c) {
    const adv = advDe(c);
    const B = g.PJ.datos();
    const estados = B.byId, lista = B.base.filter(e => e.cat === 'estado');
    const dano = ui.dano[c.id] || '';
    const previo = dano ? Math.max(0, +dano - (ui.desvio && !ui.perforante ? desvioEf(c) : 0)) : null;
    const efM = CB.efectos(c, adv);
    let acciones = '';
    if (adv) {
      acciones = `<h4>Acciones</h4><ul class="cb-acc">${adv.acciones.map((a, i) => {
        const falta = a.coste && a.coste.recurso && c[a.coste.recurso].act < a.coste.cantidad;
        const paga = a.coste && a.coste.recurso ? `${a.coste.cantidad} ${a.coste.recurso === 'investidura' ? 'Investidura' : 'concentración'}` : '';
        return `<li class="${falta ? 'sin-coste' : ''}"><div class="cb-it"><div class="cb-it-t">${a.glifo != null ? act(a.glifo) : ''}<b>${esc(a.n)}</b>${a.era ? ` <span class="chip small soft">Era ${a.era}</span>` : ''}${paga ? ` <span class="chip small">${esc(paga)}</span>` : ''}${a.reaccion ? ' <span class="chip small">reacción</span>' : ''}</div><p>${esc(a.texto)}</p></div>
          ${a.coste && a.coste.recurso ? `<button class="btn small" data-a="pagar" data-id="${c.id}" data-i="${i}" title="Descontar el coste del recurso">Usar</button>` : ''}</li>`;
      }).join('') || '<li class="muted">Sin acciones registradas.</li>'}</ul>`;
      if (adv.rasgos.length) acciones += `<h4>Rasgos</h4><ul class="cb-acc">${adv.rasgos.map(x => `<li><div class="cb-it"><div class="cb-it-t"><b>${esc(x.n)}</b>${x.coste ? ` <span class="chip small">${esc(x.coste.texto)}</span>` : ''}</div><p>${esc(x.texto)}</p></div></li>`).join('')}</ul>`;
      if (c.rol === 'Jefe') acciones += '<p class="nota">Jefe: un turno rápido y uno lento por ronda; tras el turno de un enemigo puede gastar 1 de concentración para una acción 1 o 0 extra, y 1 en su turno para eliminar un estado.</p>';
    } else acciones = '<p class="muted">Adversario sin ficha: edita sus valores en la tabla.</p>';
    acciones += vModulos(c);
    return `<td colspan="8"><div class="cb-dano"><input type="number" min="0" placeholder="Daño" data-a="dano-in" data-id="${c.id}" value="${esc(dano)}">
          <label class="chk"><input type="checkbox" data-a="desvio" ${ui.desvio ? 'checked' : ''}> restar desvío (${desvioEf(c)})</label>
          ${efM.desvioLaceracion ? `<label class="chk" title="Los kandra tienen desvío ${efM.desvioLaceracion} solo contra laceración"><input type="checkbox" data-a="lacer" ${ui.lacer ? 'checked' : ''}> por laceración</label>` : ''}
          <label class="chk"><input type="checkbox" data-a="perforante" ${ui.perforante ? 'checked' : ''}> perforante</label>
          <button class="btn small" data-a="dano" data-id="${c.id}">Daño</button><button class="btn small" data-a="curar" data-id="${c.id}">Curar</button>
          <span class="muted" data-prev="${c.id}">${previo != null ? `→ ${previo} de daño` : ''}</span></div><div class="cb-det">
      <div>${acciones}</div>
      <div>
        <label class="cb-campo">Nombre <input data-a="nom" data-id="${c.id}" value="${esc(c.nombre)}"></label>
        ${vModificar(c)}
        <div class="cb-estados"><b>Estados</b> ${c.estados.map((e, i) => `<span class="chip soft">${estados[e.id] ? `<a href="#/e/${esc(e.id)}">${esc(e.nombre)}</a>` : esc(e.nombre)}<button class="cb-x" data-a="estado-quitar" data-id="${c.id}" data-i="${i}">✕</button></span>`).join('') || '<span class="muted">ninguno</span>'}
          <select data-a="estado-add" data-id="${c.id}"><option value="">+ estado…</option>${lista.map(e => `<option value="${esc(e.id)}">${esc(e.title)}</option>`).join('')}</select></div>
        <label class="cb-campo">Notas <textarea data-a="notas" data-id="${c.id}" rows="2">${esc(c.notas)}</textarea></label>
        <p class="nota">${adv ? `Defensas ${adv.defensas.fis + efM.defensas.fis}/${adv.defensas.cog + efM.defensas.cog}/${adv.defensas.esp + efM.defensas.esp}${adv.sentidos ? ' · Sentidos ' + esc(adv.sentidos) : ''}${adv.movimiento ? ' · Mov. ' + esc(adv.movimiento) : ''} · ` : ''}Salud en el libro: ${c.saludRango && c.saludRango[0] ? c.saludRango[0] + ' a ' + c.saludRango[1] : '—'}</p>
        ${adv && adv.tacticas ? `<h4>Tácticas</h4><p class="cb-tacticas">${esc(adv.tacticas)}</p>` : ''}
      </div></div></td>`;
  }

  function vTabla(r) {
    if (!enc.combatientes.length) return '<p class="muted">Añade adversarios desde la lista de la derecha.</p>';
    const filas = enc.combatientes.map(c => {
      const am = r.enemigos.find(e => e.id === c.id);
      const abierto = ui.abiertos.has(c.id);
      return `<tr class="cb-fila ${CB.derrotado(c) ? 'caido' : ''}" data-a="abrir-fila" data-id="${c.id}">
        <td><button class="cb-x cb-abre" data-a="abrir-fila" data-id="${c.id}" title="Acciones y detalles">${abierto ? '▾' : '▸'}</button></td>
        <td class="cb-nom">${advDe(c) ? `<a href="#/e/${esc(advDe(c).id)}" title="Ver la ficha completa"><b>${esc(c.nombre)}</b></a>` : `<b>${esc(c.nombre)}</b>`} <span class="cb-rol rol-${esc(c.rol)}">${esc(c.rol || '—')}</span> <span class="muted">r${c.rango}</span>${c.estados.length ? ` <span class="chip small soft">${c.estados.length} est.</span>` : ''}${(c.modulos || []).map(m => ` <span class="chip small">${esc(m.nombre)}</span>`).join('')}</td>
        <td><span class="${am.manual ? 'cb-man' : ''}" title="${am.manual ? `Ajustada a mano (calculada ${num(am.calculada)})` : 'Calculada por rol y rango'}">${num(am.valor)}</span></td>
        ${celdaRecurso(c, 'salud', 'salud')}${celdaRecurso(c, 'concentracion', 'concentracion')}${celdaRecurso(c, 'investidura', 'investidura')}
        <td>${c.desvio}</td>
        <td><button class="cb-x" data-a="quitar" data-id="${c.id}" title="Quitar del encuentro">✕</button></td></tr>
        ${abierto ? `<tr class="cb-detalle-fila">${vDetalle(c)}</tr>` : ''}`;
    }).join('');
    return `<div class="cb-scroll"><table class="cb-tabla cb-adv-tabla"><thead><tr><th></th><th>Adversario</th><th title="Valor de amenaza">Amenaza</th><th>Salud</th><th>Concentración</th><th>Investidura</th><th title="Valor de desvío">Desvío</th><th></th></tr></thead><tbody>${filas}</tbody></table></div>`;
  }

  function vEncuentro() {
    const r = CB.resumenAmenaza(enc);
    return `<section class="cb-col cb-cabecera">
        <div class="cb-acciones"><button class="btn" data-a="lista">← Combates</button>
          <button class="btn" data-a="deshacer" ${enc.historial.length ? '' : 'disabled'} title="Ctrl+Z">Deshacer${enc.historial.length ? ' (' + esc(enc.historial[enc.historial.length - 1].texto) + ')' : ''}</button>
          <button class="btn" data-a="restaurar" title="Salud, concentración e Investidura al máximo; sin estados">Restaurar valores</button>
          <button class="btn" data-a="copiar" data-id="${enc.id}">Duplicar</button>
          <button class="btn" data-a="exportar">Exportar</button></div>
        <div class="cb-grupo">
          <label class="cb-campo cb-ancho">Nombre del encuentro <input data-a="nombre" value="${esc(enc.nombre)}"></label>
          <label class="cb-campo">Jugadores <input type="number" min="1" max="12" data-a="jugadores" value="${enc.jugadores}"></label>
          <label class="cb-campo">Nivel medio <input type="number" min="1" max="30" step="0.5" data-a="nivel" value="${enc.nivel}"></label>
          <label class="cb-campo">Tipo de grupo <select data-a="ajuste">
            <option value="-0.25" ${enc.ajuste === -0.25 ? 'selected' : ''}>Más social (−25 %)</option>
            <option value="0" ${!enc.ajuste ? 'selected' : ''}>Mixto (normal)</option>
            <option value="0.25" ${enc.ajuste === 0.25 ? 'selected' : ''}>Muy optimizado para combate (+25 %)</option></select></label>
        </div></section>
      ${vAmenaza(r)}
      <div class="cb-cuerpo"><section class="cb-col cb-principal">${vTabla(r)}
          <p class="nota">Los módulos aumentan en la mitad la amenaza del adversario (solo con el primero, y no si ya usaba un arte Investido ni con la alomancia de bronce); puedes ajustarla a mano en su casilla.</p>
          <label class="cb-campo">Notas del encuentro <textarea data-a="notas-enc" rows="2">${esc(enc.notas)}</textarea></label></section>
        <section class="cb-col cb-picker"><h3>Adversarios</h3>
          <div class="cb-filtros"><span class="muted">Fuente:</span>${['', ...new Set(advs.map(a => a.libro).filter(Boolean))].map(l => `<button class="chip${ui.libro === l ? ' on' : ''}" data-a="libro" data-id="${esc(l)}">${g.UI && g.UI.ic ? g.UI.ic('book', 'sm') : ''}${l ? esc(l) : 'Todas'}</button>`).join('')}</div>
          <div class="cb-filtros"><input id="cb-q" type="search" placeholder="Buscar adversario…" value="${esc(ui.q)}">
            ${['Secuaz', 'Rival', 'Jefe'].map(x => `<button class="chip${ui.rol === x ? ' on' : ''}" data-a="rol" data-id="${x}">${x}</button>`).join('')}</div>
          <div id="cb-advs">${vAdvs(r)}</div></section></div>`;
  }

  function render() {
    if (!root) return;
    if (!advs) { root.innerHTML = '<section class="cb"><p class="empty">Esta herramienta es solo para la DJ. Activa el Modo DJ abriendo la página con <code>?dj=1</code>.</p></section>'; return; }
    const y = window.scrollY;
    root.innerHTML = `<section class="cb"><header class="cb-cab"><h2>${enc ? 'Combate: ' + esc(enc.nombre) : 'Combates preparados'}</h2></header>
      <p id="cb-aviso" class="cb-aviso" role="status" ${ui.aviso ? '' : 'hidden'}>${esc(ui.aviso)}</p>${enc ? vEncuentro() : vLista()}</section>`;
    window.scrollTo(0, y);
  }

  // ------------------------------------------------------------------ acciones
  const abrirEnc = id => { enc = bib.encuentros.find(e => e.id === id) || null; bib.abierto = enc ? enc.id : null; ui.abiertos = new Set(); guardar(); render(); };

  function alClic(ev) {
    const b = ev.target.closest('[data-a]');
    if (!b || /^(INPUT|SELECT|TEXTAREA|FORM|LABEL)$/.test(b.tagName)) return;
    // Fila de adversario: el clic en cualquier hueco la despliega, salvo sobre controles o enlaces propios.
    if (b.tagName === 'TR' && ev.target.closest('a, button, input, select, textarea, label')) return;
    const a = b.dataset.a, id = b.dataset.id, ds = b.dataset, c = comb(id);
    if (b.tagName === 'A' && b.getAttribute('href') === '#') ev.preventDefault();
    switch (a) {
      case 'nuevo': { const e = CB.nuevoEncuentro(); bib.encuentros.push(e); abrirEnc(e.id); break; }
      case 'abrir': abrirEnc(id); break;
      case 'lista': enc = null; bib.abierto = null; guardar(); render(); break;
      case 'copiar': { const o = bib.encuentros.find(e => e.id === id); if (o) { const k = CB.copiarEncuentro(o); bib.encuentros.push(k); if (enc) abrirEnc(k.id); else { guardar(); render(); } } break; }
      case 'borrar': { const o = bib.encuentros.find(e => e.id === id); if (o && confirm(`¿Borrar «${o.nombre}»? No se puede deshacer.`)) { bib.encuentros = bib.encuentros.filter(e => e.id !== id); guardar(); render(); } break; }
      case 'exportar': descargar('combate-' + (enc.nombre || 'encuentro').replace(/\W+/g, '-').toLowerCase() + '.json', { version: 2, abierto: null, encuentros: [enc] }); break;
      case 'exportar-todo': descargar('combates.json', bib); break;
      case 'importar': root.querySelector('#cb-imp').click(); break;
      case 'deshacer': if (CB.deshacer(enc)) { guardar(); render(); } break;
      case 'restaurar': cambiar('Restaurar valores', e => e.combatientes.forEach(CB.restaurar)); break;
      case 'rol': ui.rol = ui.rol === id ? '' : id; render(); break;
      case 'libro': ui.libro = id; render(); break;
      case 'añadir': {
        const ad = advs.find(x => x.nombre === id);
        const n = enc.combatientes.filter(x => x.fuente === id).length + 1;
        cambiar(`Añadir ${id}`, e => {
          if (n === 2) { const prim = e.combatientes.find(x => x.fuente === id); if (prim && prim.nombre === id) prim.nombre = id + ' 1'; }
          e.combatientes.push(CB.desdeAdversario(ad, n));
        });
        break;
      }
      case 'quitar': cambiar('Quitar ' + c.nombre, e => { e.combatientes = e.combatientes.filter(x => x.id !== id); }); break;
      case 'abrir-fila': if (ui.abiertos.has(id)) ui.abiertos.delete(id); else ui.abiertos.add(id); render(); break;
      case 'dano': case 'curar': {
        const n = parseInt(ui.dano[id], 10);
        if (!(n > 0)) return aviso('Escribe una cantidad.');
        if (a === 'dano') {
          const dv = desvioEf(c), real = Math.max(0, n - (ui.desvio && !ui.perforante ? dv : 0));
          cambiar(`${c.nombre}: −${real} salud${real !== n ? ` (${n} − desvío ${dv})` : ''}`, e => CB.daño(e.combatientes.find(x => x.id === id), n, { desvio: ui.desvio, perforante: ui.perforante, valorDesvio: dv }));
        } else cambiar(`${c.nombre}: +${n} salud`, e => CB.curar(e.combatientes.find(x => x.id === id), n));
        ui.dano[id] = ''; render();
        break;
      }
      case 'pagar': {
        const x = ds.m ? (() => { const a = CB.efectos(c, advDe(c)).mods.find(m => m.id === ds.m).acciones[+ds.j]; return { n: a.n, coste: CB.adversarios.costeDe('(' + a.cab + ')') }; })() : advDe(c).acciones[+ds.i];
        if (c[x.coste.recurso].act < x.coste.cantidad) return aviso(`${c.nombre} no tiene ${x.coste.cantidad} de ${x.coste.recurso === 'investidura' ? 'Investidura' : 'concentración'} para ${x.n}.`);
        cambiar(`${c.nombre}: ${x.n}`, e => CB.gastar(e.combatientes.find(y => y.id === id), x.coste.recurso, x.coste.cantidad));
        break;
      }
      case 'modulo-quitar': cambiar(`${c.nombre}: quitar módulo`, e => CB.quitarModulo(e.combatientes.find(x => x.id === id), ds.m)); break;
      case 'estado-quitar': cambiar(`${c.nombre}: quitar ${c.estados[+ds.i].nombre}`, e => { e.combatientes.find(x => x.id === id).estados.splice(+ds.i, 1); }); break;
      default: break;
    }
  }

  function alCambiar(ev) {
    const t = ev.target, a = t.dataset.a;
    if (!a) { if (t.id === 'cb-imp') importar(t); return; }
    const c = t.dataset.id ? comb(t.dataset.id) : null;
    const v = parseFloat(t.value);
    switch (a) {
      case 'nombre': enc.nombre = t.value.trim() || 'Encuentro'; guardar(); render(); break;
      case 'jugadores': enc.jugadores = Math.max(1, Math.min(12, Math.round(v) || 1)); guardar(); render(); break;
      case 'nivel': enc.nivel = Math.max(1, Math.min(30, v || 1)); guardar(); render(); break;
      case 'ajuste': enc.ajuste = +t.value; guardar(); render(); break;
      case 'notas-enc': enc.notas = t.value; guardar(); break;
      case 'notas': c.notas = t.value; guardar(); break;
      case 'nom': cambiar(`Renombrar ${c.nombre}`, e => { e.combatientes.find(x => x.id === c.id).nombre = t.value.trim() || c.nombre; }); break;
      case 'amenaza': cambiar(`Amenaza de ${c.nombre}`, e => { e.combatientes.find(x => x.id === c.id).amenazaManual = t.value === '' ? null : Math.max(0, v); }); break;
      case 'desvio-val': cambiar(`Desvío de ${c.nombre}`, e => { e.combatientes.find(x => x.id === c.id).desvio = Math.max(0, Math.round(v) || 0); }); break;
      case 'val': cambiar(`${c.nombre}: ${t.dataset.k} ${t.dataset.c === 'max' ? 'máx.' : ''} = ${t.value}`, e => (t.dataset.c === 'max' ? CB.fijarMax : CB.fijar)(e.combatientes.find(x => x.id === c.id), t.dataset.k, v)); break;
      case 'desvio': ui.desvio = t.checked; render(); break;
      case 'perforante': ui.perforante = t.checked; render(); break;
      case 'lacer': ui.lacer = t.checked; render(); break;
      case 'modulo-add': { const m = mods.find(x => x.id === t.value); if (m) cambiar(`${c.nombre}: módulo ${m.nombre}`, e => CB.añadirModulo(e.combatientes.find(x => x.id === c.id), m, advDe(c))); break; }
      case 'estado-add': if (t.value) { const s = g.PJ.datos().byId[t.value]; cambiar(`${c.nombre}: ${s.title}`, e => { e.combatientes.find(x => x.id === c.id).estados.push({ id: s.id, nombre: s.title }); }); } break;
      default: break;
    }
  }

  function alEscribir(ev) {
    const t = ev.target;
    if (t.id === 'cb-q') { ui.q = t.value; root.querySelector('#cb-advs').innerHTML = vAdvs(CB.resumenAmenaza(enc)); }
    else if (t.dataset.a === 'dano-in') {
      ui.dano[t.dataset.id] = t.value;
      const c = comb(t.dataset.id), p = root.querySelector(`[data-prev="${t.dataset.id}"]`);
      if (c && p) p.textContent = t.value ? `→ ${Math.max(0, +t.value - (ui.desvio && !ui.perforante ? desvioEf(c) : 0))} de daño` : '';
    }
  }

  async function importar(input) {
    const f = input.files[0]; if (!f) return;
    try {
      const o = JSON.parse(await f.text());
      if (!o || o.version !== 2 || !Array.isArray(o.encuentros)) throw new Error('No es un archivo de combates válido.');
      const ids = new Set(bib.encuentros.map(e => e.id));
      o.encuentros.forEach(e => { if (ids.has(e.id)) e.id = CB.copiarEncuentro(e).id; e.historial = e.historial || []; bib.encuentros.push(e); });
      enc = null; guardar(); render(); aviso(`${o.encuentros.length} encuentro(s) importado(s).`);
    } catch (e) { aviso(e.message); }
    input.value = '';
  }

  let atajos = false;
  CB.montar = function (el) {
    root = el;
    root.classList.add('cb-raiz');
    bib = cargar();
    enc = bib.encuentros.find(e => e.id === bib.abierto) || null;
    advs = g.DATA_DJ && g.PJ && g.PJ.datos ? CB.adversarios.todos(g.DATA_DJ) : null;
    mods = CB.catalogoModulos(g.DATA_DJ);
    // combates guardados antes de los módulos: se completan con los atributos del adversario (los necesitan sus efectos)
    if (advs) bib.encuentros.forEach(e => e.combatientes.forEach(c => { const a = advDe(c); if (a && !c.atributos) { c.atributos = a.atributos; c.artesPrevios = a.investidura > 0; } }));
    render();
    root.onclick = alClic; root.onchange = alCambiar; root.oninput = alEscribir;
    if (!atajos) {
      atajos = true;
      document.addEventListener('keydown', ev => {
        if (!enc || !root.isConnected || !root.querySelector('.cb') || /INPUT|SELECT|TEXTAREA/.test(ev.target.tagName)) return;
        if (ev.ctrlKey && ev.key.toLowerCase() === 'z') { ev.preventDefault(); if (CB.deshacer(enc)) { guardar(); render(); } }
      });
    }
  };
})(window);
