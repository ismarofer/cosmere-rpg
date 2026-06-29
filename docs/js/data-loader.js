// docs/js/data-loader.js
// Carga perezosa y compartida de los catálogos JSON (data/*.json).
//
// Uso típico en una página:
//
//   import { loadData } from './js/data-loader.js';
//   const { talents, paths } = await loadData(['talents', 'paths']);
//
// El loader:
//   - hace fetch() en paralelo de las entidades pedidas
//   - cachea el resultado en memoria (la misma petición se reutiliza)
//   - expone window.CRPG con los datos ya cargados, para scripts legacy
//   - dispara un CustomEvent('crpg:data-ready', { detail: { entities } })
//   - muestra un banner de error visible si falla algún fetch

const KNOWN = new Set([
  'talents', 'items', 'skills', 'pericias', 'paths',
  'powers', 'actions', 'conditions', 'adversaries'
]);

// Resuelve la URL base de los JSON relativa al propio módulo, para que el
// loader funcione igual aunque se importe desde rutas distintas.
const DATA_BASE = new URL('../data/', import.meta.url);

const cache = new Map(); // entity -> Promise<value>

function ensureGlobal() {
  if (!globalThis.CRPG) globalThis.CRPG = {};
  return globalThis.CRPG;
}

async function fetchOne(entity) {
  if (!KNOWN.has(entity)) {
    throw new Error(`Entidad desconocida: ${entity}`);
  }
  const url = new URL(`${entity}.json`, DATA_BASE);
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Error ${res.status} cargando ${entity}.json desde ${url}`);
  }
  return res.json();
}

function loadOne(entity) {
  if (!cache.has(entity)) {
    const p = fetchOne(entity).then(value => {
      ensureGlobal()[entity] = value;
      return value;
    });
    cache.set(entity, p);
  }
  return cache.get(entity);
}

/**
 * Carga las entidades pedidas. Devuelve un objeto { entidad: valor }.
 * @param {string[]} entities  Lista de identificadores (ver KNOWN).
 * @returns {Promise<Record<string, unknown>>}
 */
export async function loadData(entities) {
  try {
    const values = await Promise.all(entities.map(loadOne));
    const out = {};
    entities.forEach((e, i) => { out[e] = values[i]; });
    globalThis.dispatchEvent?.(new CustomEvent('crpg:data-ready', { detail: { entities } }));
    return out;
  } catch (err) {
    showError(err);
    throw err;
  }
}

/** Devuelve una entidad ya cargada (o lanza si todavía no). */
export function getData(entity) {
  const g = ensureGlobal();
  if (!(entity in g)) {
    throw new Error(`La entidad ${entity} no se ha cargado todavía. Usa loadData([...]) antes.`);
  }
  return g[entity];
}

function showError(err) {
  if (typeof document === 'undefined') return;
  let bar = document.getElementById('crpg-data-error');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'crpg-data-error';
    Object.assign(bar.style, {
      position: 'fixed', top: '0', left: '0', right: '0', zIndex: '99999',
      background: '#8B2222', color: '#fff', padding: '10px 16px',
      fontFamily: 'Georgia, serif', fontSize: '13px', textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    });
    document.body?.prepend(bar);
  }
  bar.textContent = `No se han podido cargar los datos: ${err.message}. ` +
    `Si abriste este archivo con doble clic, sírvelo con un servidor (por ejemplo, npm run serve).`;
}
