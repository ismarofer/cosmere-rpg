// Pruebas del motor de combates (docs/combates). Uso: node tools/test-combates.mjs
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['data/base.js', 'data/dj.js', 'combates/js/amenaza.js', 'combates/js/adversarios.js', 'combates/js/combate.js']) {
  vm.runInContext(fs.readFileSync(path.join(raiz, f), 'utf8'), ctx, { filename: f });
}
const CB = ctx.CB;
let fallos = 0, ok = 0;
const eq = (nombre, real, esperado) => {
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++;
  else { fallos++; console.log(`FALLO ${nombre}: obtenido ${JSON.stringify(real)}, esperado ${JSON.stringify(esperado)}`); }
};
const cierto = (n, v) => eq(n, !!v, true);

// --- Tabla de escalado del Manual (grupo vs. adversario): [dif de rango adversario − grupo, Secuaz, Rival, Jefe]
const TABLA = [[3, 4, 8, 32], [2, 2, 4, 16], [1, 1, 2, 8], [0, 0.5, 1, 4], [-1, 0.25, 0.5, 2], [-2, 0, 0.25, 1], [-3, 0, 0, 0.5]];
for (const [dif, s, r, j] of TABLA) {
  eq(`secuaz dif ${dif}`, CB.amenazaAdversario('Secuaz', 4 + dif, 4), s);
  eq(`rival dif ${dif}`, CB.amenazaAdversario('Rival', 4 + dif, 4), r);
  eq(`jefe dif ${dif}`, CB.amenazaAdversario('Jefe', 4 + dif, 4), j);
}
eq('ejemplo libro: rival rango 2, grupo 1', CB.amenazaAdversario('Rival', 2, 1), 2);
eq('ejemplo libro: grupo 2', CB.amenazaAdversario('Rival', 2, 2), 1);
eq('ejemplo libro: grupo 3', CB.amenazaAdversario('Rival', 2, 3), 0.5);

// --- Dificultad
eq('objetivos 4 PJs', CB.objetivos(4, 0), { facil: 2, promedio: 4, dificil: 6 });
eq('ajuste +25 %', CB.objetivos(4, 0.25), { facil: 2.5, promedio: 5, dificil: 7.5 });
eq('4 PJs, 2 = fácil', CB.dificultad(2, 4, 0).clave, 'facil');
eq('4 PJs, 4 = promedio', CB.dificultad(4, 4, 0).clave, 'promedio');
eq('4 PJs, 6 = difícil', CB.dificultad(6, 4, 0).clave, 'dificil');
eq('4 PJs, 12 = extremo', CB.dificultad(12, 4, 0).clave, 'extremo');
eq('rango por nivel', [1, 5, 6, 10, 11, 15, 16, 20, 21, 30].map(CB.rangoDeNivel), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
eq('nivel medio decimal se redondea', [CB.rangoDeNivel(5.4), CB.rangoDeNivel(5.6)], [1, 2]);

// --- Resumen de un encuentro: 4 jugadores de nivel 3 (rango 1), 1 Jefe + 2 Rivales del mismo rango = 6 (difícil)
const enc = CB.nuevoEncuentro('Prueba'); enc.jugadores = 4; enc.nivel = 3;
enc.combatientes.push(CB.nuevoCombatiente({ rol: 'Jefe', rango: 1 }), CB.nuevoCombatiente({ rol: 'Rival', rango: 1 }), CB.nuevoCombatiente({ rol: 'Rival', rango: 1 }));
let r = CB.resumenAmenaza(enc);
eq('jefe + 2 rivales con 4 jugadores', [r.rango, r.total, r.dificultad.clave], [1, 6, 'dificil']);
enc.combatientes.push(CB.nuevoCombatiente({ rol: 'Jefe', rango: 2 }));
eq('jefe rango 2 vs. grupo rango 1 suma 8', CB.resumenAmenaza(enc).total, 14);
enc.nivel = 12;
eq('al subir el nivel medio a rango 3 baja la amenaza', CB.resumenAmenaza(enc).total, 1 + 0.25 + 0.25 + 2);   // jefe r1 = 1, rivales r1 = 0,25, jefe r2 = 2
enc.nivel = 3;
enc.combatientes[3].amenazaManual = 1;
eq('amenaza manual sobrescribe', CB.resumenAmenaza(enc).total, 7);
enc.jugadores = 2;
eq('con 2 jugadores el mismo encuentro es extremo', CB.resumenAmenaza(enc).dificultad.clave, 'extremo');

// --- Adversarios reales
const advs = CB.adversarios.todos(ctx.DATA_DJ);
const advLegado = ctx.DATA_DJ.filter(x => x.cat === 'adversario' && x.f.fuente === 'Legado').length;
const advSL = ctx.DATA_DJ.filter(x => x.cat === 'adversario' && x.ambientacion === 'Stormlight').length;
eq('38 adversarios de la Guía del Mundo (Scadrial)', advs.length - advLegado - advSL, 38);
eq('55 perfiles del bestiario de Roshar', advSL, 55);
eq('adversarios del Apéndice A del Legado', advLegado, 44);
let sinBloques = 0;   // en perfiles con «— » las reacciones no figuran en f.acciones pero sí se leen, de ahí el «<»
for (const a of advs) {
  const e = ctx.DATA_DJ.find(x => x.cat === 'adversario' && x.title === a.nombre);
  if (a.rasgos.length !== (e.f.rasgos || []).length || a.acciones.length < (e.f.acciones || []).length) { sinBloques++; console.log('  bloques distintos en', a.nombre, a.rasgos.length + '/' + (e.f.rasgos || []).length, a.acciones.length + '/' + (e.f.acciones || []).length); }
}
eq('todos los rasgos y acciones localizados', sinBloques, 0);
const detective = advs.find(a => a.nombre === 'Detective');
cierto('detective: salud, rol y rango', detective.salud === 50 && detective.rol === 'Rival' && detective.rango === 2);
cierto('detective: tiene acciones con texto', detective.acciones.length >= 3 && detective.acciones.every(a => a.texto.length > 10));
const agente = advs.find(a => a.nombre === 'Agente del grupo');
eq('coste de Tirón de hierro', (agente.acciones.find(a => a.n.startsWith('Tirón de hierro')) || {}).coste, { recurso: 'investidura', cantidad: 1, texto: 'de 1 a 4 puntos de Investidura' });
cierto('reacción detectada', detective.acciones.find(a => a.n.startsWith('Ayudar')).reaccion);

// --- Desde un adversario real
const detectiveEnc = CB.desdeAdversario(detective, 2);
eq('copia de adversario', [detectiveEnc.nombre, detectiveEnc.salud, detectiveEnc.rol, detectiveEnc.rango], ['Detective 2', { act: 50, max: 50 }, 'Rival', 2]);

// --- Daño, desvío, recursos
const c = CB.nuevoCombatiente({ salud: { act: 20, max: 20 }, desvio: 2, concentracion: { act: 1, max: 3 } });
eq('daño con desvío', CB.daño(c, 10, { desvio: true }), 8); eq('salud tras daño', c.salud.act, 12);
eq('daño perforante ignora desvío', CB.daño(c, 5, { desvio: true, perforante: true }), 5); eq('salud', c.salud.act, 7);
CB.daño(c, 100); eq('salud no baja de 0', c.salud.act, 0);
CB.curar(c, 100); eq('curar no supera el máximo', c.salud.act, 20);
eq('gastar concentración', CB.gastar(c, 'concentracion', 1), true);
eq('sin concentración no gasta', [CB.gastar(c, 'concentracion', 1), c.concentracion.act], [false, 0]);
CB.ajustar(c, 'concentracion', 99); eq('ajustar respeta el máximo', c.concentracion.act, 3);
CB.fijar(c, 'salud', 7.4); eq('fijar redondea', c.salud.act, 7);
CB.fijar(c, 'salud', 999); eq('fijar respeta el máximo', c.salud.act, 20);
CB.fijarMax(c, 'salud', 10); eq('bajar el máximo recorta el actual', [c.salud.act, c.salud.max], [10, 10]);
CB.fijarMax(c, 'salud', 0); eq('la salud máxima mínima es 1', c.salud.max, 1);
CB.fijarMax(c, 'investidura', 4); CB.fijar(c, 'investidura', 4); eq('investidura con máximo nuevo', c.investidura, { act: 4, max: 4 });

// --- Secuaz y derrota
const sec = CB.nuevoCombatiente({ rol: 'Secuaz', salud: { act: 5, max: 5 } });
eq('secuaz sano', CB.derrotado(sec), false);
CB.añadirLesion(sec); eq('secuaz derrotado con lesión', CB.derrotado(sec), true);
eq('rival a 0 de salud derrotado', CB.derrotado(CB.nuevoCombatiente({ rol: 'Rival', salud: { act: 0, max: 5 } })), true);

// --- Restaurar y copiar
const jf = CB.nuevoCombatiente({ salud: { act: 3, max: 10 }, concentracion: { act: 0, max: 2 }, estados: [{ id: 'x', nombre: 'X' }] });
CB.restaurar(jf); eq('restaurar recursos y estados', [jf.salud.act, jf.concentracion.act, jf.estados.length], [10, 2, 0]);
const cop = CB.copiarEncuentro(enc);
eq('copia de encuentro: nombre, ids nuevos y sin historial', [cop.nombre, cop.id !== enc.id, cop.combatientes[0].id !== enc.combatientes[0].id, cop.historial.length], ['Prueba (copia)', true, true, 0]);
eq('resumen de lista', Object.keys(CB.resumenLista(enc)), ['enemigos', 'total', 'dificultad', 'rango']);

// --- Deshacer
const u = CB.nuevoEncuentro(); u.combatientes.push(CB.nuevoCombatiente({ salud: { act: 10, max: 10 } }));
CB.cambiar(u, '−4', e => CB.daño(e.combatientes[0], 4));
eq('daño aplicado', u.combatientes[0].salud.act, 6);
CB.cambiar(u, '−2', e => CB.daño(e.combatientes[0], 2));
CB.deshacer(u); eq('deshacer un paso', u.combatientes[0].salud.act, 6);
CB.deshacer(u); eq('deshacer dos pasos', u.combatientes[0].salud.act, 10);
eq('sin historial no deshace', CB.deshacer(u), false);

console.log(`${ok} comprobaciones correctas, ${fallos} fallos.`);
process.exit(fallos ? 1 : 0);
