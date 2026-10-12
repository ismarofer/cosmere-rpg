/* Enrutador de la herramienta de personajes. Rutas (hash):
   #/                      lista de personajes
   #/personajes/nuevo                 crea un personaje y abre el asistente
   #/personajes/p/<id>                hoja
   #/personajes/p/<id>/crear/<paso>   asistente de creación
   #/personajes/p/<id>/nivel/<paso>   asistente de subida de nivel */
(function (g) {
  'use strict';
  const PJ = g.PJ;
  const { h, descargar, slugNombre, aviso } = PJ.ui;

  function lista(raiz) {
    const todos = PJ.store.lista();
    const entrada = h('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: async e => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const c = PJ.store.importar(await f.text());
        if (PJ.store.cargar(c.id) && !confirm(`Ya existe un personaje con este identificador («${PJ.store.cargar(c.id).nombre || 'Sin nombre'}»). ¿Sobrescribirlo?`)) { e.target.value = ''; return; }
        PJ.store.guardar(c); location.hash = '#/personajes/p/' + c.id;
      } catch (err) { aviso(err.message); }
      e.target.value = '';
    } });
    raiz.innerHTML = '';
    raiz.appendChild(h('div', { class: 'lista-pj' },
      h('div', { class: 'cab-seccion' }, h('h2', null, 'Personajes'),
        h('div', { class: 'acciones' },
          h('a', { class: 'btn primario', href: '#/personajes/nuevo' }, 'Nuevo personaje'),
          h('button', { type: 'button', class: 'btn', onclick: () => entrada.click() }, 'Importar JSON'), entrada)),
      h('p', { class: 'muted' }, 'Los personajes se guardan solo en este navegador. Exporta una copia en JSON para no perderlos o para llevarlos a otro equipo.'),
      todos.length ? h('div', { class: 'cartas' }, todos.map(c => {
        const d = PJ.derivar(c);
        return h('a', { class: 'carta', href: '#/personajes/p/' + c.id },
          h('b', null, c.nombre || 'Sin nombre'),
          h('span', null, `${PJ.ambito(c) === 'Stormlight' ? 'Stormlight · ' : ''}${PJ.ascDe(c).n} · ${PJ.ui.nombreCamino(c.camino) || 'sin camino'}${d.radiante ? ' · ' + d.radiante.nombre : ''} · nivel ${d.nivel}`),
          d.pendientes ? h('span', { class: 'mal' }, `${d.pendientes} pendiente(s) de completar`) : null);
      })) : h('p', { class: 'vacio' }, 'Todavía no hay ningún personaje. Crea uno con el asistente paso a paso.')));
  }

  // Pinta la herramienta dentro de `el` (la vista del buscador). `sub` = ruta tras «#/personajes», p. ej. «/p/<id>/crear/datos».
  function montar(el, sub) {
    const partes = (sub || '').split('/').filter(Boolean);
    el.innerHTML = '';
    const barra = h('p', { class: 'noprint pjbar' }, h('a', { href: '#/personajes' }, '← Mis personajes'));
    const raiz = h('div', { id: 'vista' });
    el.appendChild(barra); el.appendChild(raiz);
    barra.hidden = !partes.length;
    if (!partes.length) return lista(raiz);
    if (partes[0] === 'nuevo') {
      // La ambientación de la cabecera decide con qué ámbito y era arranca el personaje (se puede cambiar en el primer paso)
      const amb = (g.CosmereAmb && g.CosmereAmb.id()) || '';
      const c = PJ.nuevoPersonaje(amb === 'stormlight' ? { ambito: 'Stormlight' } : { era: amb === 'mistborn/2' ? 2 : 1 });
      PJ.store.guardar(c);
      location.replace(`#/personajes/p/${c.id}/crear/datos`);
      return;
    }
    if (partes[0] === 'p' && partes[1]) {
      const c = PJ.store.cargar(partes[1]);
      if (!c) { raiz.appendChild(h('p', { class: 'vacio' }, 'No se encuentra ese personaje. ', h('a', { href: '#/personajes' }, 'Volver a la lista'))); return; }
      if (partes[2] === 'crear' || partes[2] === 'nivel') return PJ.renderAsistente(raiz, c, partes[2], partes[3]);
      return PJ.renderHoja(raiz, c);
    }
    lista(raiz);
  }
  PJ.montar = montar;
})(window);
