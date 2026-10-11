// Pruebas de regresión del motor de la hoja de personaje (docs/personaje).
// Uso: node tools/test-personaje.mjs
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['data/base.js', 'personaje/js/rules.js', 'personaje/js/engine.js', 'personaje/js/store.js']) {
  vm.runInContext(fs.readFileSync(path.join(raiz, f), 'utf8'), ctx, { filename: f });
}
const PJ = ctx.PJ;
const D = PJ.datos();
let fallos = 0, ok = 0;
const eq = (nombre, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  if (bien) ok++; else { fallos++; console.log(`FALLO ${nombre}: obtenido ${JSON.stringify(real)}, esperado ${JSON.stringify(esperado)}`); }
};
const cierto = (nombre, v) => eq(nombre, !!v, true);

// --- Tablas
eq('rango', [1, 5, 6, 10, 11, 15, 16, 20, 21].map(PJ.rango), [1, 1, 2, 2, 3, 3, 4, 4, 5]);
eq('subidas atributo', [1, 2, 3, 6, 18, 25].map(PJ.subidasAtributo), [0, 0, 1, 2, 6, 6]);
eq('grados totales', [1, 2, 20, 22].map(n => PJ.gradosTotales(n, n === 22 ? ['grado', 'talento'] : [])), [4, 6, 42, 43]);
eq('salud nivel 1 FUE 2', PJ.saludBase(1, 2), 12);
eq('salud nivel 5 FUE 2', PJ.saludBase(5, 2), 10 + 20 + 2);
eq('salud nivel 6 FUE 2', PJ.saludBase(6, 2), 10 + 20 + 4 + 4);
eq('movimiento', [0, 2, 4, 6, 8, 10].map(PJ.movimiento), [6, 7.5, 9, 12, 18, 24]);
eq('arte metálica', [0, 1, 3, 6].map(g => PJ.arteMetalica(g).dado), ['1 sin tirada', 'd4', 'd8', 'd20']);
eq('recompensas rango 2 era 2', PJ.recompensasInicio(8, 2), { arquillas: 1000, recompensas: { 1: 2, 2: 1 } });
eq('sin recompensas nivel 1', PJ.recompensasInicio(1, 1), null);

// --- Datos
for (const a of ['alomancia', 'feruquimia']) for (const m of D.metales[a]) {
  if (!m.sinArbol) cierto(`árbol existe ${m.arbol}`, D.arbol[m.arbol]);
}
cierto('atium no disponible en era 2', !D.metalEra(D.metales.alomancia.find(m => m.slug === 'atium'), 2));
cierto('bendaleo no disponible en era 1', !D.metalEra(D.metales.alomancia.find(m => m.slug === 'bendaleo'), 1));
cierto('aluminio alomancia sin árbol', D.metales.alomancia.find(m => m.slug === 'aluminio').sinArbol);
for (const asc of Object.values(PJ.ASCENDENCIAS)) for (const id of asc.auto) cierto(`talento auto existe ${id}`, D.byId[id]);
for (const c of PJ.CAMINOS_HEROICOS.concat(PJ.CAMINOS_METAL)) {
  cierto(`camino ${c} con talento principal`, D.arbol[c] && D.byId[D.arbol[c].talento_principal]);
}
for (const [c, n] of Object.entries(PJ.CULTURAS_ERA)) cierto(`cultura ${c} existe`, D.culturas.some(x => x.nombre === c));

// --- Prerrequisitos: cuántas cláusulas se entienden y cuántas quedan como manuales
const ctxVacio = { nivel: 1, atr: Object.fromEntries(PJ.ATRIBUTOS.map(a => [a.k, 0])), grados: {}, poderes: new Set(), titulos: new Set(), idsPoseidos: [], ascendencia: 'humana' };
let total = 0, manual = 0;
const ejemplosManual = new Set();
for (const t of D.talentos) {
  for (const cl of PJ.clausulas(t.f && t.f.prerrequisito)) {
    total++;
    if (PJ.evaluarClausula(cl, ctxVacio, t.id).estado === 'manual') { manual++; ejemplosManual.add(cl); }
  }
}
console.log(`Prerrequisitos: ${total} cláusulas, ${total - manual} entendidas, ${manual} manuales.`);
if (ejemplosManual.size) console.log('  Ejemplos manuales:', [...ejemplosManual].slice(0, 12).join(' | '));
cierto('la mayoría de cláusulas se entiende', manual < total * 0.25);

const ev = (cl, over) => PJ.evaluarClausula(cl, Object.assign({}, ctxVacio, over), 'x').estado;
eq('habilidad suficiente', ev('Alomancia 2 o más', { grados: { Alomancia: 2 } }), 'ok');
eq('habilidad insuficiente', ev('Alomancia 2 o más', { grados: { Alomancia: 1 } }), 'falta');
eq('alternativa de habilidades', ev('Atletismo 2 o más o Agilidad 2 o más', { grados: { Agilidad: 2 } }), 'ok');
eq('nivel', ev('nivel 6 o más', { nivel: 6 }), 'ok');
eq('poder alomántico', ev('poder Alomancia de acero', { poderes: new Set(['alomancia:acero']) }), 'ok');
eq('poder no desbloqueado', ev('poder Alomancia de acero', {}), 'falta');

const evT = (id, poderes) => PJ.evaluarTalento(id, Object.assign({}, ctxVacio, { poderes: new Set(poderes) }), {}).cumple;
eq('talento de árbol de poder bloqueado', evT('talento-rafaga-de-monedas', []), false);
eq('talento de árbol de poder desbloqueado', evT('talento-rafaga-de-monedas', ['alomancia:acero']), true);

// --- Personaje de ejemplo: brumoso humano de nivel 1
const c = PJ.nuevoPersonaje({ nombre: 'Prueba', camino: 'brumoso' });
Object.assign(c.atributos.creacion, { fuerza: 1, velocidad: 2, intelecto: 2, voluntad: 3, discernimiento: 2, presencia: 2 });
const d = PJ.derivar(c);
eq('puntos de atributo usados', d.presupuesto.atributosCreacion, { total: 12, usados: 12 });
eq('Alomancia gratis', d.habilidades.Alomancia.grados, 1);
eq('salud inicial', d.salud, 10 + 1);
eq('concentración', d.concentracion, 5);
eq('Investidura', d.investidura, 4);
eq('defensa física', d.defensas.fisica, 13);
eq('presupuesto de grados', d.presupuesto.grados, { total: 4, usados: 0, max: 2 });
eq('talento extra humano nivel 1', d.presupuesto.talentos.total, 1);
cierto('talento principal automático', d.talentos.auto.includes(D.arbol.brumoso.talento_principal));
cierto('avisos pendientes si falta repartir', d.pendientes > 0);

c.nivel = 7; const d7 = PJ.derivar(c);
eq('nivel 7 rango 2', d7.rango, 2);
eq('nivel 7 grado máx', d7.presupuesto.grados.max, 3);
eq('nivel 7 mejoras de atributo', d7.presupuesto.atributosSubidas.total, 2);

// kandra: 6 puntos y sin caminos de nacido del metal
const k = PJ.nuevoPersonaje({ ascendencia: 'kandra', camino: 'nacidoble' });
const dk = PJ.derivar(k);
eq('kandra puntos de creación', dk.presupuesto.atributosCreacion.total, 6);
cierto('kandra con camino de nacido del metal es error', dk.errores > 0);

// --- Almacenamiento: exportar / importar
if (PJ.store) {
  const json = PJ.store.exportar(c);
  const r = PJ.store.importar(json);
  eq('importación recupera nombre', r.nombre, 'Prueba');
  eq('importación recupera camino', r.camino, 'brumoso');
  let falla = false; try { PJ.store.importar('{"nada":1}'); } catch (e) { falla = true; }
  cierto('importar JSON inválido falla', falla);
}

console.log(`\n${ok} comprobaciones correctas, ${fallos} fallos.`);
process.exit(fallos ? 1 : 0);

