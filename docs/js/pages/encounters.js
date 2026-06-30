// docs/js/pages/encounters.js
// Diseñador de combates: permite añadir adversarios y calcula la amenaza
// total según el rango del grupo y el número de PJs.
//
// Reglas de amenaza (Manual del Archivo de las Tormentas, cap. 13
// "Configuración de las escenas de combate"):
//   - Secuaz = 0,5 · Rival = 1 · Jefe = 4 (al mismo rango que el grupo).
//   - Si el adversario es de rango superior, se duplica la amenaza por cada
//     rango de diferencia.
//   - Si es de rango inferior, se divide a la mitad por cada rango,
//     redondeando al cuarto más cercano (con los cortes que indica la tabla).
//   - Combate fácil: amenaza total = PJs / 2.
//   - Combate promedio: amenaza total = PJs.
//   - Combate difícil: amenaza total = PJs × 1,5.
//
// La página soporta cargar un encuentro desde la URL (?e=Nombre*qty~Otro*qty&r=2&p=4).

import { loadData } from '../data-loader.js';

const { adversaries: ADV } = await loadData(['adversaries']);

const SYM = { '1': '▶', '2': '▶▶', '3': '▶▶▶', '0': '▷', 'R': '↺' };

// Tabla canónica de amenaza por diferencia de rango (adv.rango - grupo.rango).
// Diff positivo => adversario por encima del grupo.
const THREAT_TABLE = {
  '3':  { Secuaz: 4,    Rival: 8,    Jefe: 32   },
  '2':  { Secuaz: 2,    Rival: 4,    Jefe: 16   },
  '1':  { Secuaz: 1,    Rival: 2,    Jefe: 8    },
  '0':  { Secuaz: 0.5,  Rival: 1,    Jefe: 4    },
  '-1': { Secuaz: 0.25, Rival: 0.5,  Jefe: 2    },
  '-2': { Secuaz: 0,    Rival: 0.25, Jefe: 1    },
  '-3': { Secuaz: 0,    Rival: 0,    Jefe: 0.25 },
};

function threatPerUnit(rol, advRango, grupoRango) {
  const adv = Number(advRango) || 1;
  const grp = Number(grupoRango) || 1;
  const diff = adv - grp;
  if (diff > 3) {
    const base = THREAT_TABLE['3'][rol] ?? 0;
    return base * Math.pow(2, diff - 3);
  }
  if (diff < -3) return 0;
  return THREAT_TABLE[String(diff)][rol] ?? 0;
}

function fmtThreat(n) {
  if (n === 0) return '0';
  if (Number.isInteger(n)) return String(n);
  const rounded = Math.round(n * 100) / 100;
  return rounded.toString().replace('.', ',');
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ===== Estado =====
const STORAGE_KEY = 'encounterDesigner_v1';
const filters = { rol: 'all', rango: 'all', tipo: 'all' };
const group = { nPJs: 4, rango: 2 };
let encounter = []; // [{ name, qty }]
let modalName = null;

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ group, encounter }));
  } catch {}
  // La URL refleja siempre el encuentro, así que es compartible sin botón.
  try { window.history.replaceState(null, '', '?' + encodeURLParams()); } catch {}
}

function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    applyState(parsed);
  } catch {}
}

function applyState(parsed) {
  if (parsed?.group) {
    if (typeof parsed.group.nPJs === 'number') group.nPJs = parsed.group.nPJs;
    if (typeof parsed.group.rango === 'number') group.rango = parsed.group.rango;
  }
  if (Array.isArray(parsed?.encounter)) {
    const known = new Set(ADV.map(a => a.name));
    encounter = parsed.encounter
      .filter(e => e && known.has(e.name) && Number(e.qty) > 0)
      .map(e => ({ name: e.name, qty: Math.max(1, Math.floor(Number(e.qty))) }));
  }
}

// ===== URL ↔ estado =====
// Formato: ?e=Nombre1*qty~Nombre2*qty&p=4&r=2
// Se delega la codificación a URLSearchParams; los separadores `~` y `*` son
// seguros porque URLSearchParams no los confunde con caracteres del nombre.
function encodeURLParams() {
  const params = new URLSearchParams();
  if (encounter.length) {
    params.set('e', encounter.map(x => x.name + '*' + x.qty).join('~'));
  }
  params.set('p', String(group.nPJs));
  params.set('r', String(group.rango));
  return params.toString();
}

function tryLoadFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('e') && !params.has('p') && !params.has('r')) return false;
    const known = new Set(ADV.map(a => a.name));
    const p = parseInt(params.get('p'), 10);
    const r = parseInt(params.get('r'), 10);
    if (Number.isFinite(p) && p > 0) group.nPJs = p;
    if (Number.isFinite(r) && r >= 1 && r <= 4) group.rango = r;
    const eRaw = params.get('e');
    if (eRaw) {
      encounter = eRaw.split('~').map(piece => {
        const ix = piece.lastIndexOf('*');
        if (ix < 0) return null;
        const name = piece.slice(0, ix);
        const qty = parseInt(piece.slice(ix + 1), 10);
        if (!known.has(name) || !Number.isFinite(qty) || qty <= 0) {
          console.warn('[encuentros] Entrada de URL ignorada:', { name, qty, conocida: known.has(name) });
          return null;
        }
        return { name, qty };
      }).filter(Boolean);
    }
    return true;
  } catch (err) {
    console.error('[encuentros] Error al cargar desde la URL:', err);
    return false;
  }
}

function advByName(name) {
  return ADV.find(a => a.name === name);
}

// ===== Tarjeta completa (reutiliza el HTML de adversaries.js) =====
function cardHTML(a) {
  const vitals = a.vitals.map(v => '<span class="vit"><b>' + esc(v[0]) + ':</b> ' + esc(v[1]) + '</span>').join('');
  const lines = a.lines.map(l => '<div class="ln"><span class="lbl">' + esc(l[0]) + ':</span> ' + esc(l[1]) + '</div>').join('');
  const rasgos = a.rasgos.map(r => '<div class="entry"><span class="nm">' + esc(r[0]) + '.</span> ' + esc(r[1]) + '</div>').join('');
  const acciones = a.acciones.map(ac => {
    const cost = ac[2] ? ' <span class="cost">(' + esc(ac[2]) + ')</span>' : '';
    return '<div class="entry"><span class="sym">' + (SYM[ac[0]] || esc(ac[0])) + '</span><span class="nm">' + esc(ac[1]) + '.</span>' + cost + ' ' + esc(ac[3]) + '</div>';
  }).join('');
  const rasgosSec = a.rasgos.length ? '<div class="sec"><div class="sec-h">Rasgos</div>' + rasgos + '</div>' : '';
  let oyc = '';
  if (a.oyc) {
    oyc = '<div class="oyc">' + a.oyc.map(o => '<div><span class="' + (o[0] === 'Oportunidad' ? 'o' : 'c') + '">' + esc(o[0]) + ':</span> ' + esc(o[1]) + '</div>').join('') + '</div>';
  }
  return '<div class="card rol-' + esc(a.rol) + '">' +
    '<div class="ctag"><span>' + esc(a.rol) + '</span><span class="rng">Rango ' + esc(a.rango) + ' · ' + esc(a.tipo) + '</span></div>' +
    '<div class="ch"><div class="cn">' + esc(a.name) + '</div><div class="crole">' + esc(a.role) + '</div></div>' +
    '<div class="attrs">' + attrCol('Físico', a.attrs.fis) + attrCol('Cognitivo', a.attrs.cog) + attrCol('Espiritual', a.attrs.esp) + '</div>' +
    '<div class="vitals">' + vitals + '</div>' +
    '<div class="lines">' + lines + '</div>' +
    rasgosSec +
    '<div class="sec"><div class="sec-h">Acciones</div>' + acciones + '</div>' +
    oyc +
    (a.tactics ? '<div class="tactics"><span class="lbl">Tácticas</span>' + esc(a.tactics) + '</div>' : '') +
    '</div>';
}

function attrCol(cat, pairs) {
  return '<div class="attr-col"><div class="attr-cat">' + cat + '</div><div class="attr-vals">' +
    pairs.map(p => '<div><span class="k">' + esc(p[0]) + '</span><span class="v">' + esc(p[1]) + '</span></div>').join('') +
    '</div></div>';
}

// ===== Render: biblioteca =====
function matchSearch(a, q) {
  if (!q) return true;
  q = q.toLowerCase();
  const hay = [a.name, a.role,
    ...(a.rasgos ?? []).map(r => r[0] + ' ' + r[1]),
    ...(a.acciones ?? []).map(ac => ac[1] + ' ' + ac[3])].join(' ').toLowerCase();
  return hay.includes(q);
}

function renderLibrary() {
  const q = document.getElementById('search').value.trim();
  const list = ADV.filter(a =>
    (filters.rol === 'all' || a.rol === filters.rol) &&
    (filters.rango === 'all' || String(a.rango) === filters.rango) &&
    (filters.tipo === 'all' || a.tipo === filters.tipo) &&
    matchSearch(a, q)
  );
  const html = list.length
    ? list.map(libItemHTML).join('')
    : '<div class="empty">No hay adversarios que coincidan.</div>';
  document.getElementById('libList').innerHTML = html;
}

function libItemHTML(a) {
  const t = threatPerUnit(a.rol, a.rango, group.rango);
  const dn = esc(a.name);
  return '<div class="lib-item" data-name="' + dn + '" data-action="open">' +
    '<div class="info">' +
      '<div class="nm">' + esc(a.name) + '</div>' +
      '<div class="meta">Rango ' + esc(a.rango) + ' · ' + esc(a.tipo) + '</div>' +
    '</div>' +
    '<span class="role-tag ' + esc(a.rol) + '">' + esc(a.rol) + '</span>' +
    '<span class="thr' + (t === 0 ? ' zero' : '') + '" title="Amenaza por unidad">' + fmtThreat(t) + '</span>' +
    '<button class="add" data-name="' + dn + '" data-action="add" title="Añadir directamente">+</button>' +
  '</div>';
}

// Delegación de eventos en la biblioteca (evita problemas con comillas en nombres).
function onLibClick(ev) {
  const btn = ev.target.closest('[data-action="add"]');
  if (btn) {
    ev.stopPropagation();
    addAdversary(btn.dataset.name);
    return;
  }
  const item = ev.target.closest('[data-action="open"]');
  if (item) openModal(item.dataset.name);
}

// ===== Render: encuentro =====
function renderEncounter() {
  const cont = document.getElementById('encContainer');
  const badge = document.getElementById('encBadge');
  if (!encounter.length) {
    cont.innerHTML = '<div class="empty-enc">El encuentro está vacío.<small>Pulsa sobre un adversario de la biblioteca para ver su ficha y añadirlo.</small></div>';
    badge.textContent = '';
    renderSummary();
    return;
  }
  const grid = '<div class="enc-grid">' + encounter.map(encSlotHTML).join('') + '</div>';
  cont.innerHTML = grid;
  const nKinds = encounter.length;
  const nUnits = encounter.reduce((s, e) => s + e.qty, 0);
  badge.textContent = nUnits + ' unidad' + (nUnits === 1 ? '' : 'es') + ' · ' + nKinds + ' tipo' + (nKinds === 1 ? '' : 's');
  renderSummary();
}

function encSlotHTML(entry) {
  const a = advByName(entry.name);
  if (!a) return '';
  const tUnit = threatPerUnit(a.rol, a.rango, group.rango);
  const tTotal = tUnit * entry.qty;
  const dn = esc(a.name);
  return '<div class="enc-slot">' +
    '<div class="enc-controls">' +
      '<div class="qty">' +
        '<button data-name="' + dn + '" data-action="dec" title="Quitar uno">−</button>' +
        '<input type="number" min="1" value="' + entry.qty + '" data-name="' + dn + '" data-action="set">' +
        '<button data-name="' + dn + '" data-action="inc" title="Añadir uno">+</button>' +
        '<button class="del" data-name="' + dn + '" data-action="del" title="Eliminar">×</button>' +
      '</div>' +
      '<span class="thrtag" title="Amenaza por unidad × cantidad">' + fmtThreat(tUnit) + ' × ' + entry.qty + ' = <b>' + fmtThreat(tTotal) + '</b></span>' +
    '</div>' +
    cardHTML(a) +
  '</div>';
}

function onEncClick(ev) {
  const btn = ev.target.closest('[data-action]');
  if (!btn) return;
  const name = btn.dataset.name;
  const action = btn.dataset.action;
  if (action === 'inc') changeQty(name, 1);
  else if (action === 'dec') changeQty(name, -1);
  else if (action === 'del') removeAdversary(name);
}

function onEncInput(ev) {
  const inp = ev.target.closest('[data-action="set"]');
  if (!inp) return;
  setQty(inp.dataset.name, inp.value);
}

// ===== Modal =====
function openModal(name) {
  const a = advByName(name);
  if (!a) return;
  modalName = name;
  document.getElementById('modalBody').innerHTML = cardHTML(a);
  document.getElementById('modalBd').classList.add('on');
}

function closeModal() {
  document.getElementById('modalBd').classList.remove('on');
  modalName = null;
}

function closeModalIfBackdrop(ev) {
  if (ev.target.id === 'modalBd') closeModal();
}

function addFromModal() {
  if (modalName) {
    addAdversary(modalName);
    closeModal();
  }
}

// ===== Resumen =====
function renderSummary() {
  const nPJs = group.nPJs;
  const facil = nPJs / 2;
  const medio = nPJs;
  const dif = nPJs * 1.5;
  document.getElementById('thrFacil').textContent = fmtThreat(facil);
  document.getElementById('thrMedio').textContent = fmtThreat(medio);
  document.getElementById('thrDificil').textContent = fmtThreat(dif);

  let total = 0;
  let count = 0;
  let hasZero = false;
  for (const e of encounter) {
    const a = advByName(e.name);
    if (!a) continue;
    const tUnit = threatPerUnit(a.rol, a.rango, group.rango);
    if (tUnit === 0 && e.qty > 0) hasZero = true;
    total += tUnit * e.qty;
    count += e.qty;
  }
  document.getElementById('thrActual').textContent = fmtThreat(total);
  document.getElementById('thrCount').textContent =
    count === 0 ? '0 adversarios'
    : (count === 1 ? '1 adversario' : count + ' adversarios');

  const box = document.getElementById('boxDif');
  const lbl = document.getElementById('difLabel');
  const hint = document.getElementById('difHint');
  box.classList.remove('dif-facil','dif-medio','dif-dificil','dif-letal');
  if (total <= 0) {
    lbl.textContent = '—';
    hint.textContent = 'añade adversarios';
  } else if (total < facil) {
    box.classList.add('dif-facil');
    lbl.textContent = 'Trivial';
    hint.textContent = 'por debajo de fácil';
  } else if (total < medio) {
    box.classList.add('dif-facil');
    lbl.textContent = 'Fácil';
    hint.textContent = 'umbral promedio: ' + fmtThreat(medio);
  } else if (total < dif) {
    box.classList.add('dif-medio');
    lbl.textContent = 'Promedio';
    hint.textContent = 'umbral difícil: ' + fmtThreat(dif);
  } else if (total < dif * 1.5) {
    box.classList.add('dif-dificil');
    lbl.textContent = 'Difícil';
    hint.textContent = 'a partir de ' + fmtThreat(dif);
  } else {
    box.classList.add('dif-letal');
    lbl.textContent = 'Letal';
    hint.textContent = 'muy por encima de difícil';
  }

  const warn = document.getElementById('mismatchWarn');
  if (hasZero) {
    warn.style.display = '';
    warn.innerHTML = '<b>⚠ Aviso:</b> hay adversarios cuyo rango es muy inferior al del grupo. Su amenaza es <b>0</b> y no cuentan para el desafío.';
  } else {
    warn.style.display = 'none';
  }
}

// ===== Toast =====
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('on'), 2200);
}

// ===== Acciones expuestas (onclick inline) =====
window.setFilter = function setFilter(btn) {
  const f = btn.dataset.f;
  document.querySelectorAll('.fb[data-f="' + f + '"]').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  filters[f] = btn.dataset.v;
  renderLibrary();
};

window.renderLibrary = renderLibrary;

window.updateGroup = function updateGroup() {
  const n = parseInt(document.getElementById('nPJs').value, 10);
  const r = parseInt(document.getElementById('grupoRango').value, 10);
  if (Number.isFinite(n) && n > 0) group.nPJs = n;
  if (Number.isFinite(r) && r >= 1 && r <= 4) group.rango = r;
  saveState();
  renderLibrary();
  renderEncounter();
};

function addAdversary(name) {
  const existing = encounter.find(e => e.name === name);
  if (existing) existing.qty += 1;
  else encounter.push({ name, qty: 1 });
  saveState();
  renderEncounter();
}

function changeQty(name, delta) {
  const e = encounter.find(x => x.name === name);
  if (!e) return;
  e.qty += delta;
  if (e.qty <= 0) encounter = encounter.filter(x => x.name !== name);
  saveState();
  renderEncounter();
}

function setQty(name, value) {
  const e = encounter.find(x => x.name === name);
  if (!e) return;
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) encounter = encounter.filter(x => x.name !== name);
  else e.qty = n;
  saveState();
  renderEncounter();
}

function removeAdversary(name) {
  encounter = encounter.filter(x => x.name !== name);
  saveState();
  renderEncounter();
}

window.clearEncounter = function clearEncounter() {
  if (!encounter.length) return;
  if (!confirm('¿Vaciar el encuentro actual?')) return;
  encounter = [];
  saveState();
  renderEncounter();
};

window.openModal = openModal;
window.closeModal = closeModal;
window.closeModalIfBackdrop = closeModalIfBackdrop;
window.addFromModal = addFromModal;

// Cierra el modal con Esc.
window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') closeModal();
});

// ===== Init =====
// Prioridad: URL > localStorage. Si la URL trae datos, sobreescribe el estado
// guardado y se persiste el nuevo estado.
const fromURL = tryLoadFromURL();
if (!fromURL) loadStateFromStorage();
saveState(); // persiste y deja la URL reflejando ya el estado cargado

document.getElementById('nPJs').value = group.nPJs;
document.getElementById('grupoRango').value = group.rango;
document.getElementById('libList').addEventListener('click', onLibClick);
const encCont = document.getElementById('encContainer');
encCont.addEventListener('click', onEncClick);
encCont.addEventListener('input', onEncInput);

renderLibrary();
renderEncounter();
