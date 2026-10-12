// Pruebas de regresión del buscador: cada consulta debe devolver la entrada esperada en el top N.
// Uso: node tools/test-buscador.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const ctx = { window: {}, console };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['data/base.js', 'data/dj.js', 'js/curated.js', 'js/search.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
}
const { Engine, normChars } = ctx.Search;
const C = ctx.CURATED;
const opts = { synonyms: C.synonyms, aliases: C.aliases, boost: C.boost };
const entries = ctx.DATA_BASE;
const engine = new Engine(entries, opts);          // sin Modo DJ
const engineDJ = new Engine(ctx.DATA_BASE.concat(ctx.DATA_DJ), opts);
const cats = C.catalogs;

// [consulta, regex sobre "cat:título", top]
const cases = [
  ['nivel de amenaza', /regla:(Configuración de las escenas|Elección de adversarios|Cómo decidir la dificultad|Cálculo de la amenaza|Cómo escalar|Escalado de amenazas)/i, 3],
  ['curar', /talento:(Medicina de campo|Cuidados continuos|Sanación ágil)|habilidad:Medicina/i, 5],
  ['medicina de campo', /talento:Medicina de campo/i, 1],
  ['oportunidad', /regla:Oportunidades y Complicaciones en combate|personaje:Oportunidades y Complicaciones|personaje:Cómo gastar/i, 4],
  ['oportunidades en combate', /regla:Oportunidades y Complicaciones en combate/i, 2],
  ['ayudar', /accion:Ayudar/i, 1],
  ['ayuda en combate', /personaje:Ayuda en combate|accion:Ayudar/i, 2],
  ['destrabarse', /accion:Destrabarse/i, 1],
  ['huir', /accion:Destrabarse/i, 3],
  ['sorprendido', /estado:Sorprendido|regla:Sorpresa/i, 2],
  ['agarrar', /accion:Agarrar/i, 1],
  ['turno rapido', /regla:(Orden del combate|Rondas y turnos)/i, 3],
  ['concentracion', /(personaje|calculo):(Concentración|Salud, concentración)/i, 3],
  ['dado de trama', /(regla|personaje|direccion):.*[Dd]ado de [Tt]rama/i, 3],
  ['ballesta', /arma:Ballesta/i, 1],
  ['espada larga', /arma:Espada larga/i, 1],
  ['revolver', /arma:Revólver/i, 1],
  ['pistola', /arma:(Pistola|Revólver)/i, 3],
  ['coraza', /armadura:Coraza/i, 2],
  ['agotado', /estado:Agotado/i, 1],
  ['cuanto cuesta una cuerda', /equipo:Cuerda/i, 3],
  ['"medicina de campo"', /talento:Medicina de campo/i, 2],
  ['prevenirse', /accion:Prevenirse/i, 1],
  ['cobertura', /accion:Prevenirse|regla:Cobertura/i, 3],
  ['reposo', /regla:Reposo/i, 3],
  ['lesion', /regla:(Lesiones|Sufrir una lesión|Efectos de las lesiones)/i, 3],
  ['investidura', /calculo:Investidura máxima|personaje:(Investidura|Salud, concentración)/i, 3],
  ['como se calcula la investidura', /calculo:Investidura máxima/i, 1],
  ['calcular salud', /calculo:Salud máxima/i, 1],
  ['movimiento', /calculo:Valor de movimiento/i, 2],
  ['crear personaje', /creacion:Creación de personaje/i, 1],
  ['dado de recuperacion', /calculo:Dado de recuperación/i, 1],
  ['defensas', /calculo:Defensas/i, 2],
  ['alcance de los sentidos', /calculo:Alcance de los sentidos/i, 1],
  ['prevenirse con palanca', /talento:Prevenirse con palanca/i, 1],
  ['cultura alezi', /origen:Alezi/i, 1],
  ['ascendencia cantora', /origen:Ascendencia cantora/i, 1],
  ['pericia oyente', /pericia:Pericia Oyente/i, 1],
  ['hoja esquirlada', /arma:Hoja esquirlada/i, 1],
  ['semiesquirla', /arma:Semiesquirla/i, 1],
  ['armadura esquirlada', /armadura:Armadura esquirlada/i, 1],
  ['sillalibre', /equipo:Sillalibre/i, 1],
  ['moldeador de almas', /equipo:Moldeador de almas/i, 1],
  ['cambiar de forma', /talento:Cambiar de forma/i, 1],
  ['entrenamiento de esquirlada', /talento:Entrenamiento de esquirlada/i, 1],
  ['filo asesino', /talento:Filo asesino/i, 1],
  ['enlace inverso', /talento:Enlace inverso/i, 1],
  ['escuadron aereo', /talento:Escuadrón aéreo/i, 1],
  ['luz y antiluz', /regla:Luz y antiluz/i, 1],
  ['fabricar fabriales', /regla:Fabricación de fabriales comunes/i, 1],
  ['honorspren', /regla:Honorspren/i, 1],
  ['equipo inicial roshar', /regla:Equipo inicial \(Roshar\)/i, 1],
  ['abrasion inversa', /talento:Abrasión inversa/i, 1],
  ['absorber luz tormentosa', /accion:Absorber luz tormentosa/i, 1],
  ['forma tormenta', /talento:Formas de destrucción/i, 1],
];

const djCases = [
  ['koloss', /adversario:Koloss/i, 3],
  ['forajido', /adversario:(Forajido|Jefe de forajidos)/i, 2],
  ['kandra espia', /adversario:Espía kandra/i, 1],
];
let fail = 0;
// efectos sobre el personaje: estructura mínima y casos conocidos
const tal = (t, o) => ctx.DATA_BASE.find((e) => e.cat === 'talento' && e.title === t && (!o || e.f.origen === o));
const has = (e, obj, fn) => e && e.x.efectos.some((x) => x.objetivo === obj && (!fn || fn(x)));
const efCasos = [
  ['Robusto/Agente salud +1 por nivel', has(tal('Robusto', 'Agente'), 'salud_max', (x) => x.valor === 1 && x.por === 'nivel' && x.permanente)],
  ['Serenidad/Erudito defensa cognitiva +2', has(tal('Serenidad', 'Erudito'), 'defensa_cognitiva', (x) => x.valor === 2)],
  ['Serenidad/Erudito defensa espiritual +2', has(tal('Serenidad', 'Erudito'), 'defensa_espiritual', (x) => x.valor === 2)],
  ['Paso firme/Guerrero movimiento +3', has(tal('Paso firme', 'Guerrero'), 'movimiento', (x) => x.valor === 3)],
  ['Compostura/Líder concentración = rango', has(tal('Compostura', 'Líder'), 'concentracion_max', (x) => x.valor === 'rango')],
  ['Investido/Brumoso Investidura = rango', has(tal('Investido', 'Brumoso'), 'investidura_max', (x) => x.valor === 'rango')],
  ['Tamaño desmedido fuerza +1 y máximo', has(tal('Tamaño desmedido'), 'fuerza')],
  ['Conexión salvaje compañero', has(tal('Conexión salvaje'), 'companero')],
  ['Forma natural desvío +5', has(tal('Forma natural (principal de kandra)'), 'desvio', (x) => x.valor === 5)],
  ['Ruptura de brumoso otorga poder', has(tal('Ruptura de brumoso (principal de brumoso)'), 'poder')],
];
for (const [n, ok] of efCasos) { if (!ok) { fail++; console.log('FAIL efecto:', n); } }
for (const e of ctx.DATA_BASE) {
  for (const x of ((e.x && e.x.efectos) || [])) {
    if (!x.texto || !x.tipo || !x.objetivo || typeof x.permanente !== 'boolean') { fail++; console.log('FAIL efecto mal formado', e.id); break; }
  }
}
const asc = ctx.DATA_ARBOLES.filter((a) => a.tipo === 'Ascendencia/Cultura');
// caminos heroicos: Mistborn + Stormlight en el mismo árbol; lo común, Cosmere; las especialidades nuevas, solo Stormlight
const heroicos = ctx.DATA_BASE.filter((e) => e.cat === 'talento' && e.f.tipo_origen === 'Camino heroico');
const espDe = (amb, origen) => new Set(heroicos.filter((e) => e.ambientacion === amb && e.f.origen === origen).map((e) => e.f.especialidad));
const heroCasos = [
  ['hay talentos comunes (Cosmere)', heroicos.filter((e) => e.ambientacion === 'Cosmere').length >= 40],
  ['Espía solo Stormlight', espDe('Stormlight', 'Agente').has('Espía') && !espDe('Mistborn', 'Agente').has('Espía')],
  ['Rebelde solo Mistborn', espDe('Mistborn', 'Agente').has('Rebelde') && !espDe('Stormlight', 'Agente').has('Rebelde')],
  ['Ardid táctico es de Político', heroicos.some((e) => e.title === 'Ardid táctico' && e.f.especialidad === 'Político')],
  ['Plan maestro es de Planificador', heroicos.some((e) => e.title === 'Plan maestro' && e.f.especialidad === 'Planificador')],
  ['sin talentos heroicos sin especialidad', heroicos.every((e) => e.f.especialidad)],
];
for (const [n, ok] of heroCasos) { if (!ok) { fail++; console.log('FAIL heroicos:', n); } }
// caminos radiantes: nueve órdenes con 9 talentos de vínculo (+ el árbol Iluminado); el talento de Primer Ideal da Investidura
const radiantes = ctx.DATA_ARBOLES.filter((a) => a.tipo === 'Camino radiante');
const idealOk = radiantes.filter((a) => a.nombre !== 'Iluminado').every((a) => a.talentos.length === 9 && a.talento_principal &&
  ctx.DATA_BASE.find((e) => e.id === a.talento_principal).x.efectos.some((x) => x.objetivo === 'investidura_max'));
const potencias = ctx.DATA_ARBOLES.filter((a) => a.tipo === 'Potencia');
if (potencias.length !== 10 || potencias.some((a) => a.talentos.length !== 8)) { fail++; console.log('FAIL potencias (10 árboles de 8 talentos)'); }
if (radiantes.length !== 10 || !idealOk) { fail++; console.log('FAIL caminos radiantes'); }
// talentos de Mistborn: texto, prerrequisitos y enlaces del PDF (tools/extraer_talentos_pdf.py)
const tm = (t, o) => ctx.DATA_BASE.find((e) => e.cat === 'talento' && e.title === t && e.ambientacion !== 'Stormlight' && (!o || e.f.origen === o));
const nombresReq = (e) => (e.x.req || []).map((i) => ctx.DATA_BASE.find((x) => x.id === i).title);
const pdfCasos = [
  ['Ruptura de brumoso una sola vez', ctx.DATA_BASE.filter((e) => e.cat === 'talento' && e.f.origen === 'Brumoso' && /^Ruptura de brumoso/.test(e.title)).length === 1],
  ['Poderoso (Enviado) cuelga de Demostración práctica', nombresReq(tm('Poderoso', 'Enviado')).includes('Demostración práctica')],
  ['Burbuja defensiva cuelga de Burbuja espontánea', nombresReq(tm('Burbuja defensiva')).includes('Burbuja espontánea')],
  ['Quemar instintivamente (Nacidoble) cuelga del principal', nombresReq(tm('Quemar instintivamente', 'Nacidoble')).some((n) => /Herencia nacidoble/.test(n))],
  ['Francotirador con monedas sin texto de otra sección', !/aluminio/i.test(tm('Francotirador con monedas').body + (tm('Francotirador con monedas').mecanica || ''))],
  ['Contemplación profunda sin párrafo de Medicina', !/dado de recuperación/.test((tm('Contemplación profunda').mecanica || '') + tm('Contemplación profunda').body)],
  ['Echar leña al fuego y Ejecución fluida son de activación Especial (la carta del libro lleva ★)', tm('Echar leña al fuego').f.activacion === 'Especial' && tm('Ejecución fluida').f.activacion === 'Especial'],
  ['Vidente social sin crédito de ilustrador en el prerrequisito', !/CLARK/.test(tm('Vidente social').f.prerrequisito)],
  ['Análisis rápido (común) cuelga de todas las variantes de Ojo avizor',
   ctx.DATA_BASE.filter((e) => e.cat === 'talento' && e.title === 'Ojo avizor').every((o) => ctx.DATA_BASE.filter((e) => e.title === 'Análisis rápido' && e.cat === 'talento').some((a) => (a.x.req || []).includes(o.id)))],
  ['Tercer Ideal cuelga del Segundo (Corredores del viento)',
   nombresReq(ctx.DATA_BASE.find((e) => e.cat === 'talento' && /^Tercer Ideal/.test(e.title) && e.f.origen === 'Corredores del viento')).some((n) => /^Segundo Ideal/.test(n))],
  ['Segundo Ideal cuelga del Primer Ideal (principal)',
   nombresReq(ctx.DATA_BASE.find((e) => e.cat === 'talento' && /^Segundo Ideal/.test(e.title) && e.f.origen === 'Corredores del viento')).some((n) => /^Primer Ideal/.test(n))],
  ['talentos de potencia sin talento padre cuelgan de la potencia',
   ctx.DATA_BASE.filter((e) => e.cat === 'talento' && e.f.tipo_origen === 'Potencia' && !/talento/i.test(e.f.prerrequisito)).every((e) => e.x.power)],
];
for (const [n, ok] of pdfCasos) { if (!ok) { fail++; console.log('FAIL talentos (PDF):', n); } }
if (asc.length !== 3 || asc.some((a) => !a.efectos.length)) { fail++; console.log('FAIL ascendencias sin efectos'); }
const mod = ctx.DATA_BASE.filter((e) => e.cat === 'modificador');
if (mod.length < 100 || mod.some((m) => m.x.fuente_id && !ctx.DATA_BASE.some((e) => e.id === m.x.fuente_id))) { fail++; console.log('FAIL modificadores'); }

// enlaces [[cat|Título]] de la guía de creación: todos deben resolver
const creacion = ctx.DATA_BASE.find((e) => e.cat === 'creacion');
for (const m of creacion.body.matchAll(/\[\[([^\]]+)\]\]/g)) {
  const parts = m[1].split('|');
  if (parts[0].startsWith('#')) continue;
  const ok = ctx.DATA_BASE.some((e) => e.cat === parts[0] && normChars(e.title) === normChars(parts[1]));
  if (!ok) { fail++; console.log('FAIL enlace roto en creación:', m[1]); }
}
// todos los talentos tienen árbol (origen) y sus dependencias apuntan a talentos existentes
const ids = new Set(ctx.DATA_BASE.map((e) => e.id));
for (const e of ctx.DATA_BASE.filter((x) => x.cat === 'talento')) {
  for (const r of e.x.req.concat(e.x.xreq)) if (!ids.has(r)) { fail++; console.log('FAIL dependencia rota', e.id, r); }
}

for (const [q, rx, top] of djCases) {
  const r = engineDJ.search(q, { cats });
  const got = r.hits.slice(0, top).map((h) => `${h.e.cat}:${h.e.title}`);
  const ok = got.some((g) => rx.test(g));
  if (!ok) fail++;
  console.log((ok ? 'OK  ' : 'FAIL') + ' [DJ] ' + q.padEnd(23) + ' -> ' + r.hits.slice(0, 3).map((h) => `${h.e.cat}:${h.e.title}`).join(' | '));
}
// sin Modo DJ no debe aparecer nada gated
for (const q of ['koloss', 'forajido', 'neBaal', 'legado']) {
  const leak = engine.search(q, { cats }).hits.filter((h) => ['adversario', 'modulo', 'legado'].includes(h.e.cat));
  if (leak.length) { fail++; console.log('FAIL fuga DJ en', q); }
}

for (const [q, rx, top] of cases) {
  const r = engine.search(q, { cats });
  const got = r.hits.slice(0, top).map((h) => `${h.e.cat}:${h.e.title}`);
  const ok = got.some((g) => rx.test(g));
  if (!ok) fail++;
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + q.padEnd(28) + ' -> ' + r.hits.slice(0, 4).map((h) => `${h.e.cat}:${h.e.title}`).join(' | '));
}
const t0 = Date.now();
for (let i = 0; i < 20; i++) engine.search('oportunidades complicaciones combate', { cats });
console.log(`\n${entries.length} entradas, índice con ${engine.terms.length} términos; 20 búsquedas en ${Date.now() - t0} ms`);
console.log(fail ? `${fail} consultas fallan` : 'Todas las consultas pasan');
process.exit(fail ? 1 : 0);

