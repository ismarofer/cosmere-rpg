/* Generador de nombres (integrado en el buscador, #/nombres, Dirección). NOM.montar(el) pinta la herramienta en `el`.
   Fuente: «Nombres de…» de cada cultura (Mistborn Manual, cap. 2 · Cultura). Dos modos: nombres del libro tal cual, o inventados
   con una cadena de Márkov de orden 2 entrenada con los nombres de esa cultura (suenan igual, pero no están en el libro).
   Las culturas de Stormlight salen de las entradas «Cultura» de DATA_BASE (sección «Nombres»). La ambientación es la de la cabecera
   (window.CosmereAmb), esta herramienta no tiene filtro propio. NOM.generar(...) es puro para poder probarlo. Los nombres
   guardados viven en localStorage. */
(function (g) {
  'use strict';

  // era: ambientación Mistborn · Era 1 (1), Era 2 (2) o común a ambas (0). `clanes`: apellido de clan (sangre koloss).
  const CULTURAS = [
    { id: 'skaa', label: 'Skaa', era: 1, nombres: 'Alder, Bolan, Criden, Fare, Hosahn, Jeller, Karalle, Lened, Nendel, Phin, Ruel, Sannson, Thess, Venn, Yelin' },
    { id: 'luthadel', label: 'Luthadel', era: 1, nombres: 'Antou, Carmend, Dormond, Denna, Formont, Greston, Jateuse, Lavreux, Melvier, Obson, Quiss, Ren, Sebroux, Terneau, Vedent' },
    { id: 'interiores', label: 'Dominios Interiores', era: 1, nombres: 'Anture, Dammel, Farene, Galea, Japes, Keliera, Lian, Mantare, Nomoron, Parteau, Quindees, Seloux, Taradare, Vendex' },
    { id: 'terris', label: 'Dominio de Terris', era: 1, nombres: 'Arawyl, Cerytith, Deneleze, Forwyn, Handal, Idreh, Kwandel, Mylindweth, Orzed, Pyndal, Razwym, Tindel, Ulwyl, Vwashek, Wanderwyl' },
    { id: 'exteriores', label: 'Dominios Exteriores', era: 1, nombres: 'Axshon, Colette, Cartoux, Egon, Farlene, Hoxs, Janier, Mioux, Oskar, Renli, Seren, Seaban, Thrice, Ulla, Yuem' },
    { id: 'elendel', label: 'Elendel', era: 2, nombres: 'Allriandre, Alvery, Brill, Carmine, Collette, Daius, Ennasi, Hedwarn, Hinston, Jackstom, Juli, Karoline, Kip, Limmi, Matilda, Mase, Rian, Sindren, Windra, Xavian' },
    { id: 'koloss', label: 'Sangre koloss', era: 2, nombres: 'Augurd, Bailen, Boly, Dav, Dylan, Erma, Hadeline, Karoline, Larson, Lizzie, Lunille, Martin, Moe, Mollie, Nax, Persephonine, Ray, Roscoe, Tillie, Willium',
      clanes: 'Calder, Chennant, Douglan, Dramal, Hinnaird, Hudowen, Hukainly, Kobarr, Kogarroch, Kovlair' },
    { id: 'malwish', label: 'Malwish', era: 2, nombres: 'Andrid, Astrine, Brigine, Dagmar, Dagnus, Eihannes, Ellis, Folse, Hendrik, Hilda, Indraal, Jarika, Julavil, Kaanus, Kadri, Osval, Preida, Sveikki, Ulvis, Vilmmes' },
    { id: 'ciudades', label: 'Ciudades exteriores', era: 2, nombres: 'Attica, Billiam, Brambleton, Dion, Drefan, Gill, Hazy, Joshe, Mariola, Marven, Nip, Noal, Porval, Ro’chelle, Sebastia, Serefina, Tema, Tielle, Virzal, Vobrier' },
    { id: 'aridos', label: 'Los Áridos', era: 2, nombres: 'Abba, Avery, Benjamin, Carmen, Charls, Dora, Florence, Flossie, Frederick, Hannah, Herman, Jackson, Larker, Mareon, Mark, Nicah, Ryan, Sylvester, Vincent, Wanda' },
    { id: 'enclaves', label: 'Enclaves terrisanos', era: 2, nombres: 'Arathwyn, Gindanwyl, Hexaldweth, Idashim, Kanderwyl, Kenlew, Kwathendwyl, Marshek, Nessenwy, Nilzan, Razendal, Sazzek, Sebaam, Tellingwym, Tessen, Vedlip, Vezlanaze, Vorch, Vwadenar' },
    { id: 'kandra', label: 'Tierra Natal kandra', era: 0, nombres: 'CharSun, CheOon, DenMar, Draalm, FhorSell, JeOrr, JilMaar, KeeLaan, Laahm, LunPook, ParSaag, RaDuun, RenKood, SaCaar, SovDell, TaLeur, TeeSar, TeSun, VarLuur, ZanMuur' },
  ];
  const lista = s => (s ? s.split(',').map(x => x.trim()).filter(Boolean) : []);
  CULTURAS.forEach(c => { c.amb = c.era === 1 ? 'Mistborn Era 1' : c.era === 2 ? 'Mistborn Era 2' : 'Mistborn'; });
  // Culturas de otras ambientaciones: de los datos del libro («#### Nombres» al final de cada entrada de cultura)
  (g.DATA_BASE || []).forEach(e => {
    if (e.cat !== 'origen' || !e.f || e.f.tipo !== 'Cultura' || e.ambientacion === 'Mistborn' || /^Mistborn/.test(e.ambientacion)) return;
    const m = /#### Nombres\n([^\n]+)/.exec(e.body);
    if (!m) return;
    CULTURAS.push({ id: e.id, label: e.title, era: 0, amb: e.ambientacion, nombres: m[1].replace(/\.\s*$/, '') });
  });
  CULTURAS.forEach(c => { c.lista = lista(c.nombres); c.listaClanes = lista(c.clanes); });

  // ------------------------------------------------------------------ generador (puro)
  // Azar reproducible si se pasa una semilla (pruebas); si no, Math.random.
  function azar(semilla) {
    if (semilla == null) return Math.random;
    let s = semilla >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const elegir = (arr, r) => arr[Math.floor(r() * arr.length)];

  // Cadena de Márkov de orden 2 sobre letras ('^^' inicio, '$' fin). Se respeta la mayúscula interior (kandra: «KeeLaan»).
  function modelo(nombres) {
    const t = {};
    nombres.forEach(n => {
      const s = '^^' + n + '$';
      for (let i = 2; i < s.length; i++) (t[s.slice(i - 2, i)] = t[s.slice(i - 2, i)] || []).push(s[i]);
    });
    return t;
  }
  function inventar(c, r, conocidos) {
    const t = c._m || (c._m = modelo(c.lista));
    const lens = c.lista.map(n => n.length), min = Math.max(3, Math.min(...lens)), max = Math.max(...lens) + 1;
    for (let intento = 0; intento < 200; intento++) {
      let s = '^^', out = '';
      while (out.length <= max) {
        const sig = elegir(t[s.slice(-2)], r);
        if (sig === '$') break;
        out += sig; s += sig;
      }
      if (out.length < min || out.length > max || conocidos.has(out.toLowerCase())) continue;
      if (/(.)\1\1/.test(out)) continue; // «aaa», «lll»
      return out;
    }
    return null;
  }

  // opts: { culturas: [id], cantidad, modo: 'libro' | 'inventado' | 'mezcla', clan: bool, semilla }
  // Devuelve [{ nombre, cultura (label), inventado }], sin repetidos.
  function generar(opts) {
    const r = azar(opts.semilla);
    const cs = CULTURAS.filter(c => opts.culturas.includes(c.id));
    if (!cs.length) return [];
    const cant = Math.max(1, Math.min(60, opts.cantidad || 10));
    const vistos = new Set(), out = [];
    for (let i = 0; i < cant * 20 && out.length < cant; i++) {
      const c = elegir(cs, r);
      const libro = new Set(c.lista.map(n => n.toLowerCase()));
      const inv = opts.modo === 'inventado' || (opts.modo === 'mezcla' && r() < 0.5);
      let nombre = inv ? inventar(c, r, libro) : elegir(c.lista, r);
      if (!nombre) continue;
      if (opts.clan && c.listaClanes.length) nombre += ' del clan ' + elegir(c.listaClanes, r);
      if (vistos.has(nombre)) continue;
      vistos.add(nombre);
      out.push({ nombre, cultura: c.label, inventado: inv });
    }
    return out;
  }

  // ------------------------------------------------------------------ interfaz
  const CLAVE = 'cosmere-nombres-v1';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  function cargar() {
    try { const o = JSON.parse(localStorage.getItem(CLAVE) || 'null'); if (o && Array.isArray(o.guardados)) return o; } catch (e) { /* sin datos */ }
    return { era: 0, culturas: ['skaa'], cantidad: 12, modo: 'mezcla', clan: true, guardados: [] };
  }
  let st, res = [], root;
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(st)); } catch (e) { /* sin almacenamiento */ } }
  // La ambientación es la de la cabecera: una era muestra lo suyo más lo común a las dos; Stormlight, sus culturas.
  const visibles = () => CULTURAS.filter(c => !g.CosmereAmb || g.CosmereAmb.cubre(c.amb));

  function tirar() {
    const ids = st.culturas.filter(id => visibles().some(c => c.id === id));
    res = generar({ culturas: ids, cantidad: st.cantidad, modo: st.modo, clan: st.clan });
  }
  function copiar(t, el) {
    const ok = () => { if (el) { el.classList.add('nm-ok'); setTimeout(() => el.classList.remove('nm-ok'), 700); } };
    try { navigator.clipboard.writeText(t).then(ok, ok); } catch (e) { ok(); }
  }

  const chip = (on, a, v, txt) => `<button type="button" class="nm-chip${on ? ' on' : ''}" data-a="${a}" data-v="${esc(v)}" aria-pressed="${on}">${txt}</button>`;
  function render() {
    const vis = visibles();
    const ambTxt = a => a.replace(/ Era /, ' · Era ');
    const todas = !g.CosmereAmb || g.CosmereAmb.id() === '';
    const guardados = st.guardados.map((n, i) => `<li><button type="button" class="nm-nom" data-a="copiar" data-v="${esc(n.nombre)}" title="Copiar">${esc(n.nombre)}</button>
      <span class="nm-cult">${esc(n.cultura)}</span><button type="button" class="nm-x" data-a="quitar" data-v="${i}" aria-label="Quitar">×</button></li>`).join('');
    root.innerHTML = `<div class="nm">
      <h2>Generador de nombres</h2>
      <p class="nm-nota">Nombres típicos de cada cultura del Manual (cap. 2 · Cultura). «Inventados» combina sus sonidos para crear nombres nuevos con el mismo estilo. Pulsa un nombre para copiarlo; ☆ lo guarda.</p>
      <div class="nm-col">
        <div class="nm-fila"><span class="nm-et">Cultura</span>${vis.map(c => chip(st.culturas.includes(c.id), 'cult', c.id, esc(c.label) + (todas ? ` <small>${esc(ambTxt(c.amb))}</small>` : ''))).join('')}</div>
        <div class="nm-fila"><span class="nm-et">Tipo</span>${chip(st.modo === 'libro', 'modo', 'libro', 'Del libro')}${chip(st.modo === 'mezcla', 'modo', 'mezcla', 'Mezcla')}${chip(st.modo === 'inventado', 'modo', 'inventado', 'Inventados')}
          ${vis.some(c => c.listaClanes.length && st.culturas.includes(c.id)) ? `<label class="nm-chk"><input type="checkbox" data-a="clan"${st.clan ? ' checked' : ''}> con clan koloss</label>` : ''}</div>
        <div class="nm-fila"><span class="nm-et">Cuántos</span><input type="number" min="1" max="60" value="${st.cantidad}" data-a="cant" class="nm-num" aria-label="Cuántos nombres">
          <button type="button" class="btn primary nm-tirar" data-a="tirar">Generar</button>
          <button type="button" class="btn" data-a="copiar-todo"${res.length ? '' : ' disabled'}>Copiar todos</button></div>
      </div>
      <div class="nm-col">
        ${res.length ? `<ul class="nm-res">${res.map((n, i) => `<li><button type="button" class="nm-nom" data-a="copiar" data-v="${esc(n.nombre)}" title="Copiar">${esc(n.nombre)}</button>
          <span class="nm-cult">${esc(n.cultura)}${n.inventado ? ' · inventado' : ''}</span>
          <button type="button" class="nm-x" data-a="guardar" data-v="${i}" aria-label="Guardar" title="Guardar">${st.guardados.some(x => x.nombre === n.nombre) ? '★' : '☆'}</button></li>`).join('')}</ul>`
          : `<p class="nm-nota">${st.culturas.length ? 'Pulsa «Generar».' : 'Elige al menos una cultura.'}</p>`}
      </div>
      <div class="nm-col">
        <h3>Guardados <small>(${st.guardados.length})</small>${st.guardados.length ? ' <button type="button" class="nm-link" data-a="vaciar">vaciar</button>' : ''}</h3>
        ${guardados ? `<ul class="nm-res">${guardados}</ul>` : '<p class="nm-nota">Los nombres que guardes quedan aquí (en este navegador) para usarlos en la sesión.</p>'}
      </div>
    </div>`;
  }

  function onClick(ev) {
    const b = ev.target.closest('[data-a]');
    if (!b || !root.contains(b)) return;
    const a = b.dataset.a, v = b.dataset.v;
    if (a === 'cult') st.culturas = [v]; // selección exclusiva
    else if (a === 'modo') st.modo = v;
    else if (a === 'tirar') tirar();
    else if (a === 'copiar') return copiar(v, b);
    else if (a === 'copiar-todo') return copiar(res.map(n => n.nombre).join('\n'), b);
    else if (a === 'guardar') {
      const n = res[+v], i = st.guardados.findIndex(x => x.nombre === n.nombre);
      if (i < 0) st.guardados.push({ nombre: n.nombre, cultura: n.cultura }); else st.guardados.splice(i, 1);
    }
    else if (a === 'quitar') st.guardados.splice(+v, 1);
    else if (a === 'vaciar') { if (!confirm('¿Vaciar los nombres guardados?')) return; st.guardados = []; }
    else return;
    guardar(); render();
  }
  function onChange(ev) {
    const a = ev.target.dataset && ev.target.dataset.a;
    if (a === 'clan') st.clan = ev.target.checked;
    else if (a === 'cant') st.cantidad = Math.max(1, Math.min(60, parseInt(ev.target.value, 10) || 10));
    else return;
    guardar();
    if (a === 'clan') render();
  }

  function montar(el) {
    st = cargar();
    // contenedor propio: los manejadores no deben quedarse en la vista compartida al cambiar de página
    el.innerHTML = '';
    root = el.appendChild(document.createElement('div'));
    // la ambientación de la cabecera puede haber cambiado desde la última vez: solo se mantienen las culturas visibles
    const vis = visibles().map(c => c.id);
    const antes = st.culturas.join();
    st.culturas = st.culturas.filter(id => vis.includes(id)).slice(0, 1); // exclusiva: un guardado antiguo con varias se reduce a una
    if (!st.culturas.length) st.culturas = vis.slice(0, 1);
    if (st.culturas.join() !== antes) res = [];
    if (!res.length && st.culturas.length) tirar();
    render();
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.dataset.a === 'cant') { onChange(ev); tirar(); render(); } });
  }

  g.NOM = { CULTURAS, generar, montar };
})(typeof window !== 'undefined' ? window : globalThis);
