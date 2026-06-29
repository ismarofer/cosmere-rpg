"use strict";
// Datos rellenados por character-sheet-bootstrap.js antes de bootstrapCharacterSheet()
var CARDS, ITEMS, ATTRS, ATTR_ABBR, SKILLS, CAMINOS, PATH_ORDER, PATH_LABEL, RAD_IDS, PERICIAS_CATS, POWERS, POWER_ACTIONS, POWER_NAMES, POW_COLOR, POW_TINT, POW_DARK;
// Derivados poblados dentro de bootstrapCharacterSheet()
var PERICIAS, WEAPONS, ARMORS, OBJETOS;

/* Símbolos de acción — ▷ = acción gratuita, ▶ = 1 acción, ▶▶ = 2 acciones, etc. */
var SYM={'1':'▶','2':'▶▶','3':'▶▶▶','0':'▷','R':'↺','*':'✦','8':'∞'};
function symTal(a){ return SYM[a]||a||''; }
function symAct(a){ return SYM[a]||a||''; }
var COSTE = {'1':'1 acción','2':'2 acciones','3':'3 acciones','0':'Acción gratuita','R':'Reacción','*':'Especial / estado','8':'Siempre activo'};
var CUSTOM = {fis:[{id:'custFis1'}],cog:[{id:'custCog1'}],esp:[{id:'custEsp1'}]};
var NUM_METAS = 9;

var CAT_LABELS={al:'Armamento ligero',ap:'Armamento pesado',ae:'Arma especial',
  ar:'Armadura',fc:'Fabrial común',fu:'Fabrial único',co:'Consumible',eq:'Equipo con reglas'};
var CAT_COLORS={al:'#7A5299',ap:'#8B2222',ae:'#5A4A2A',ar:'#336699',
  fc:'#AA6622',fu:'#884422',co:'#3D6B35',eq:'#555555'};
function itemByName(nom){ for(var i=0;i<ITEMS.length;i++) if(ITEMS[i].name===nom) return ITEMS[i]; return null; }
function itemStat(item,key){ if(!item||!item.stats) return null; for(var i=0;i<item.stats.length;i++) if(item.stats[i][0]===key) return item.stats[i][1]; return null; }
var ESTADOS = [
  {n:'Afligido',buff:false,mec:'Al final de cada turno sufres el daño indicado [Xd] (cada 10 s fuera de combate). Acumulable.'},
  {n:'Agotado',buff:false,mec:'Penalización [−N] a tus pruebas. Acumulable. Baja 1 tras descanso largo.'},
  {n:'Aturdido',buff:false,mec:'Pierdes reacciones; en tu turno, 2 acciones menos y ninguna reacción.'},
  {n:'Concentrado',buff:true,mec:'Las habilidades que cuestan concentración cuestan 1 punto menos.'},
  {n:'Desorientado',buff:false,mec:'Sin reacciones; sentidos siempre ofuscados; desventaja en Percepción y similares.'},
  {n:'Empoderado',buff:true,mec:'Ventaja en todas las pruebas; Investidura al máximo al inicio de cada turno. Acaba al final de la escena.'},
  {n:'Inconsciente',buff:false,mec:'Movimiento 0; Tumbado; sueltas lo que sostienes. Despiertas al curarte 1+ salud.'},
  {n:'Inmovilizado',buff:false,mec:'Movimiento 0; no te puedes mover ni ser movido.'},
  {n:'Mejorado',buff:true,mec:'Atributo +N temporal (no cambia defensas/recursos máximos). Acumulable.'},
  {n:'Ralentizado',buff:false,mec:'Tu valor de movimiento se reduce a la mitad.'},
  {n:'Resuelto',buff:true,mec:'Al fallar una prueba puedes añadir una Oportunidad; luego se elimina.'},
  {n:'Retenido',buff:false,mec:'Movimiento 0; desventaja en todas las pruebas salvo para liberarte.'},
  {n:'Sorprendido',buff:false,mec:'Sin reacciones; no juegas turno rápido; 1 acción menos. Acaba tras tu próximo turno.'},
  {n:'Tumbado',buff:false,mec:'Estás en el suelo; vulnerable a ataques cuerpo a cuerpo; moverte cuesta más.'}
];
var ACCIONES_COMBATE=[
  {act:'1',name:'Acometida',mec:'Ataque contra la Defensa física de un objetivo, con un arma que empuñas o sin armas. Cada Acometida usa una mano distinta; con la mano secundaria, gasta 2 concentración.'},
  {act:'R',name:'Acometida reactiva',mec:'Cuando un enemigo abandona voluntariamente tu cercanía, gasta 1 concentración para un ataque cuerpo a cuerpo o sin armas contra su Física.'},
  {act:'2',name:'Agarrar',mec:'Prueba de Atletismo contra la Defensa física del objetivo. Si la superas, queda Retenido.'},
  {act:'R',name:'Ayudar',mec:'Antes de la prueba de un aliado, gasta 1 concentración para darle ventaja. Debes poder ayudarle de forma realista.'},
  {act:'0',name:'Charlar',mec:'Intercambias frases breves. No requiere acción más allá de la gratuita.'},
  {act:'1',name:'Destrabarse',mec:'Te mueves 1,5 m sin activar Acometidas reactivas.'},
  {act:'2',name:'Empujar',mec:'Prueba de Atletismo contra la Defensa física del objetivo para desplazarlo.'},
  {act:'R',name:'Esquivar',mec:'Antes de que un enemigo te elija como objetivo, gasta 1 concentración para añadir desventaja a su prueba. No vale contra ataques de zona.'},
  {act:'R',name:'Evitar peligro',mec:'Prueba de Agilidad (CD = resultado del efecto, o 15) para ponerte a salvo de una amenaza ambiental.'},
  {act:'1',name:'Interactuar',mec:'Manipulas algo a tu alcance: abrir una puerta, desenvainar, sacar algo de la mochila… Sin prueba. Puedes usarla varias veces por turno.'},
  {act:'1',name:'Moverse',mec:'Te mueves una distancia igual o menor a tu valor de movimiento.'},
  {act:'1',name:'Obtener ventaja',mec:'Maniobras para obtener ventaja en una prueba posterior (apuntar, fintar, estudiar al rival, posicionarte…).'},
  {act:'1',name:'Prepararse',mec:'Gasta 1 acción más el coste de la acción preparada. Defines un detonante; cuando ocurre, la ejecutas.'},
  {act:'1',name:'Prevenirse',mec:'Añade desventaja a los ataques contra ti. Con un arma Defensiva (escudo), creas cobertura móvil.'},
  {act:'2',name:'Recuperarse',mec:'Recuperas concentración (haces acopio de fuerzas según las reglas de recuperación).'},
  {act:'0',name:'Soltar',mec:'Sueltas un objeto que tienes en la mano.'},
  {act:'1',name:'Usar una habilidad',mec:'Haces una prueba de habilidad para una tarea: Percepción para buscar, Sigilo para esconderte, Medicina para tratar a un aliado…'}
];
var ACCIONES_RAD=[
  {act:'2',name:'Absorber luz tormentosa',flavor:'Atraes la luz de las esferas hacia tu interior.',mec:'Recuperas Investidura hasta tu máximo, drenando esferas infusas a ≤1,5 m (con suficientes marcos infusos disponibles). Puedes usarla incluso Inconsciente o si no puedes hacer otras acciones.'},
  {act:'0',name:'Aumentar',flavor:'La luz tormentosa potencia tu cuerpo más allá de lo normal.',mec:'Gasta Investidura para quedar Empoderado (consulta la carta de Empoderado). Tras el Segundo Ideal, muchos Radiantes pueden usar Aumentar como acción gratuita sin gastar Investidura.'},
  {act:'0',name:'Revitalizar',flavor:'La luz tormentosa sana tus heridas al instante.',mec:'Gasta Investidura para recuperar salud. Puedes usarla incluso Inconsciente o si no puedes hacer otras acciones. Con el talento Regeneración de heridas, también puedes curar lesiones (2 Inv. temporal, 3 Inv. permanente).'},
  {act:'*',name:'Empoderado',flavor:'Encarnas el poder de un Caballero Radiante.',mec:'Estado obtenido al pronunciar un Ideal (hasta el final de la escena) o mediante Aumentar. Mientras estás Empoderado, la luz tormentosa potencia tus capacidades físicas (fuerza, velocidad y resistencia mejoradas). Consulta tu camino Radiante para los detalles concretos.'}
];

var S = {};
var STORAGE_KEY = 'hojaCosmereRoshar_v3';
function estadoVacio(){
  var s = {fields:{}, attrs:{}, skills:{}, custom:{}, metas:[], caminos:[], pericias:[], estados:[], armas:[], armaduras:[], talentos:[], objetos:[], potencias:[]};
  ATTRS.forEach(function(a){ s.attrs[a]=0; });
  function reg(g){ g.forEach(function(sk){ s.skills[sk.id]={g:0}; }); }
  reg(SKILLS.fis); reg(SKILLS.cog); reg(SKILLS.esp);
  ['fis','cog','esp'].forEach(function(c){ CUSTOM[c].forEach(function(ck){ s.custom[ck.id]={nombre:'',attr:'',g:0}; }); });
  for (var i=0;i<NUM_METAS;i++) s.metas.push({txt:'',p:0});
  s.fields.nivel='1';
  return s;
}

/* ===== Tablas ===== */
function porTramo(v,t){ for (var i=0;i<t.length;i++){ if (v<=t[i][0]) return t[i][1]; } return t[t.length-1][1]; }
function movMetros(vel){ return porTramo(vel,[[0,'6 m'],[2,'7,5 m'],[4,'9 m'],[6,'12 m'],[8,'18 m'],[99,'24 m']]); }
function movCasillas(vel){ return porTramo(vel,[[0,'4 casillas'],[2,'5 casillas'],[4,'6 casillas'],[6,'8 casillas'],[8,'12 casillas'],[99,'16 casillas']]); }
function dadoRecupDe(vol){ return porTramo(vol,[[0,'1d4'],[2,'1d6'],[4,'1d8'],[6,'1d10'],[8,'1d12'],[99,'1d20']]); }
function alcanceDe(dis){ return porTramo(dis,[[0,'1,5 m'],[2,'3 m'],[4,'6 m'],[6,'15 m'],[8,'30 m'],[99,'sin límite']]); }
function alcanceCasillas(dis){ return porTramo(dis,[[0,'1 casilla'],[2,'2 casillas'],[4,'4 casillas'],[6,'10 casillas'],[8,'20 casillas'],[99,'sin límite']]); }
// Convierte 'A distancia [24/96]' → 'A distancia [16/64 casillas]' (1 casilla = 1,5 m)
function alcanceConCasillas(alc){
  if(!alc) return alc;
  var m=alc.match(/\[(\d+)\/(\d+)\]/);
  if(!m) return alc;
  var corto=Math.round(parseInt(m[1],10)/1.5), largo=Math.round(parseInt(m[2],10)/1.5);
  return alc.replace(/\[\d+\/\d+\]/, '['+m[1]+'/'+m[2]+' m · '+corto+'/'+largo+' casillas]');
}
function capLevantDe(fue){ return porTramo(fue,[[0,'45 kg'],[2,'90 kg'],[4,'225 kg'],[6,'450 kg'],[8,'2250 kg'],[99,'4500 kg']]); }
function n(v){ var x=parseInt(v,10); return isNaN(x)?0:x; }
function escapeHtml(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function attrEsc(s){ return escapeHtml(s); }
function modSkill(id){ var sk=null; ['fis','cog','esp'].forEach(function(c){ SKILLS[c].forEach(function(s){ if (s.id===id) sk=s; }); }); if (!sk) return 0; return S.skills[id].g + n(S.attrs[sk.attr]); }
function fmtMod(m){ return (m>=0?'+':'')+m; }
function fmtDano(die,m,tipo){ var b=m>0?('+'+m):(m<0?String(m):''); return die+b+' '+tipo; }

function llenarNivel(){ var sel=document.getElementById('selNivel'),h=''; for (var i=1;i<=20;i++) h+='<option value="'+i+'">'+i+'</option>'; sel.innerHTML=h; }
function llenarTalSelect(){ /* relleno dinámico en abrirSelector */ }
function llenarTalSelectParaPersonaje(){
  var sel=document.getElementById('modalTalSelect'); if(!sel) return;
  var ids=S.caminos.map(function(c){ return c.id; }).filter(Boolean);
  if(ids.indexOf('cantor')<0) ids=ids.concat(['cantor']);
  if(ids.length===1){
    // Solo cantor: mostramos directamente sin select
    sel.style.display='none'; modalTalPath=ids[0]; return;
  }
  var h='<option value="mis">Todos mis caminos</option>';
  ids.forEach(function(id){ h+='<option value="'+id+'">'+escapeHtml(PATH_LABEL[id]||id)+'</option>'; });
  sel.innerHTML=h; sel.value='mis'; modalTalPath='mis';
}
var SUBCATS={
  armas:[['','Todas'],['al','Ligeras'],['ap','Pesadas'],['ae','Especiales']],
  armaduras:[['','Todas'],['ar','Armaduras']],
  objetos:[['','Todos'],['fc','Fabriales comunes'],['fu','Fabriales únicos'],['co','Consumibles'],['eq','Equipo']],
  pericias:[['','Todas'],['cultural','Culturales'],['utilidad','De utilidad'],['arma','En arma'],['armadura','En armadura'],['especial','Especializadas']],
  estados:[['','Todos'],['buff','Beneficiosos'],['deb','Perjudiciales']]
};
var modalSubcat='';
function mostrarSubcat(tipo){ var sc=document.getElementById('modalSubcat'); if(!sc) return;
  var opts=SUBCATS[tipo]||[]; if(!opts.length){ sc.style.display='none'; return; }
  sc.innerHTML=opts.map(function(o){ return '<option value="'+o[0]+'">'+o[1]+'</option>'; }).join('');
  sc.value=''; sc.style.display='inline-block'; }
function onSubcat(){ var sc=document.getElementById('modalSubcat'); modalSubcat=sc?sc.value:''; renderModalBody(); }
function actualizarRango(){ var lv=n(S.fields.nivel)||1; document.getElementById('rangoBadge').textContent='Rango '+(Math.floor((lv-1)/5)+1); }

// ═══ Tabla de progreso de personaje (verbatim cap. 1) ═══
var PROGRESO=[
  {lv:1, atr:'12 pts iniciales', salud:'10 + FUE', gmax:2, grados:'4 (+1 camino inicial)', tal:'1 del camino inicial + ascendencia'},
  {lv:2, atr:'—', salud:'+5', gmax:2, grados:'+2', tal:'+1'},
  {lv:3, atr:'+1', salud:'+5', gmax:2, grados:'+2', tal:'+1'},
  {lv:4, atr:'—', salud:'+5', gmax:2, grados:'+2', tal:'+1'},
  {lv:5, atr:'—', salud:'+5', gmax:2, grados:'+2', tal:'+1'},
  {lv:6, atr:'+1', salud:'+4 + FUE', gmax:3, grados:'+2', tal:'+1 + ascendencia'},
  {lv:7, atr:'—', salud:'+4', gmax:3, grados:'+2', tal:'+1'},
  {lv:8, atr:'—', salud:'+4', gmax:3, grados:'+2', tal:'+1'},
  {lv:9, atr:'+1', salud:'+4', gmax:3, grados:'+2', tal:'+1'},
  {lv:10,atr:'—', salud:'+4', gmax:3, grados:'+2', tal:'+1'},
  {lv:11,atr:'—', salud:'+3 + FUE', gmax:4, grados:'+2', tal:'+1 + ascendencia'},
  {lv:12,atr:'+1', salud:'+3', gmax:4, grados:'+2', tal:'+1'},
  {lv:13,atr:'—', salud:'+3', gmax:4, grados:'+2', tal:'+1'},
  {lv:14,atr:'—', salud:'+3', gmax:4, grados:'+2', tal:'+1'},
  {lv:15,atr:'+1', salud:'+3', gmax:4, grados:'+2', tal:'+1'},
  {lv:16,atr:'—', salud:'+2 + FUE', gmax:5, grados:'+2', tal:'+1 + ascendencia'},
  {lv:17,atr:'—', salud:'+2', gmax:5, grados:'+2', tal:'+1'},
  {lv:18,atr:'+1', salud:'+2', gmax:5, grados:'+2', tal:'+1'},
  {lv:19,atr:'—', salud:'+2', gmax:5, grados:'+2', tal:'+1'},
  {lv:20,atr:'—', salud:'+2', gmax:5, grados:'+2', tal:'+1'},
  {lv:21,atr:'—', salud:'+1', gmax:5, grados:'elige +1 grado o +1 talento', tal:'(ascendencia solo nivel 21)'}
];
function abrirTablaNivel(){
  var lv=n(S.fields.nivel)||1;
  var filas=PROGRESO.map(function(r){
    var act=(r.lv===lv||(lv>=21&&r.lv===21));
    var rango=Math.floor((r.lv-1)/5)+1; if(r.lv>=21) rango=5;
    return '<tr'+(act?' class="prog-act"':'')+'>'
      +'<td class="prog-lv">'+r.lv+(r.lv===21?'+':'')+'</td>'
      +'<td class="prog-rg">R'+rango+'</td>'
      +'<td>'+r.atr+'</td><td>'+r.salud+'</td><td class="prog-c">'+r.gmax+'</td>'
      +'<td>'+r.grados+'</td><td>'+r.tal+'</td></tr>';
  }).join('');
  document.getElementById('tablaBody').innerHTML=
    '<table class="prog-tabla"><thead><tr><th>Nivel</th><th>Rango</th><th>Atributo</th><th>Salud</th><th>Grado máx</th><th>Grados habilidad</th><th>Talentos</th></tr></thead><tbody>'+filas+'</tbody></table>'
    +'<p class="prog-nota">El grado máximo es el tope de grados que puedes tener en una sola habilidad según tu rango. Los talentos de ascendencia se obtienen al inicio de cada rango (niveles 1, 6, 11, 16, 21). Tu nivel actual ('+lv+') está resaltado.</p>';
  document.getElementById('tablaBackdrop').classList.add('open');
}
function cerrarTablaNivel(){ document.getElementById('tablaBackdrop').classList.remove('open'); }

// ═══ Contador de talentos / grados / pericias esperados ═══
function calcEsperados(lv){
  var talBase = lv>=21 ? 20 : lv;
  var ascen = [1,6,11,16,21].filter(function(x){ return x<=lv; }).length;
  var talentos = talBase + ascen;
  // Grados: nivel 1 da 4+1 (camino inicial); +2 por cada nivel 2-20; nada en 21+
  var grados = 5;
  if(lv>1) grados += Math.min(lv-1,19)*2;
  var intel = n(S.attrs.intelecto)||0;
  var pericias = 2 + Math.max(0,intel);
  // Atributos: 12 iniciales + 1 en niveles 3,6,9,12,15,18
  var atrPuntos = 12 + [3,6,9,12,15,18].filter(function(x){ return x<=lv; }).length;
  var gmax = lv>=16?5:lv>=11?4:lv>=6?3:2;
  return {talentos:talentos, grados:grados, pericias:pericias, atrPuntos:atrPuntos, gmax:gmax};
}
function actualizarContadores(){
  var lv=n(S.fields.nivel)||1; var esp=calcEsperados(lv);
  var elT=document.getElementById('contTalentos');
  if(elT){ elT.innerHTML=badgeCont(S.talentos.length,esp.talentos,'talentos'); }
  var elP=document.getElementById('contPericias');
  if(elP){ elP.innerHTML=badgeCont(S.pericias.length,esp.pericias,'pericias'); }
  var elG=document.getElementById('contGrados');
  if(elG){ var gn=0; for(var k in S.skills) gn+=(S.skills[k].g||0); for(var c in S.custom) gn+=(S.custom[c].g||0);
    elG.innerHTML=badgeCont(gn,esp.grados,'grados'); }
  // Atributos
  var elA=document.getElementById('contAtributos');
  if(elA){ var an=0; for(var a in S.attrs) an+=n(S.attrs[a]);
    elA.innerHTML=badgeCont(an,esp.atrPuntos,'puntos de atributo'); }
}
function badgeCont(actual,esperado,tipo){
  var dif=actual-esperado;
  var color=dif===0?'#3D6B35':(dif>0?'#8B2222':'#9a6a30');
  var txt=actual+' / '+esperado;
  var nota=dif===0?'':(dif>0?' (+'+dif+')':' ('+dif+')');
  return '<span class="cont-badge" style="color:'+color+';border-color:'+color+'" title="Tienes '+actual+', se esperan '+esperado+' a tu nivel">'+txt+nota+'</span>';
}

/* ===== Habilidades ===== */
function dotsHTML(id,grados,tipo){
  var lv=n(S.fields.nivel)||1; var gmax=lv>=16?5:lv>=11?4:lv>=6?3:2;
  var h='<div class="dots" data-dots="'+tipo+':'+id+'">'; 
  for(var i=1;i<=5;i++){
    var cls='dot'; if(i<=grados) cls+=' on'; if(i>gmax) cls+=' locked';
    h+='<span class="'+cls+'" data-n="'+i+'"'+( i>gmax?' title="Grado máximo de tu rango: '+gmax+'"':'')+'></span>';
  } return h+'</div>'; }
function filaHabilidad(sk){ var st=S.skills[sk.id], m=st.g+n(S.attrs[sk.attr]);
  return '<div class="hab-row"><div class="mod-box" data-mod="'+sk.id+'">'+fmtMod(m)+'</div>'
    +'<div class="hab-nom">'+sk.nom+' <span class="attr">('+ATTR_ABBR[sk.attr]+')</span></div>'
    +dotsHTML(sk.id,st.g,'sk')+'</div>'; }
function filaCustom(ck){ var st=S.custom[ck.id], av=st.attr?n(S.attrs[st.attr]):0, m=st.g+av, opts='<option value="">(—)</option>';
  ATTRS.forEach(function(a){ opts+='<option value="'+a+'"'+(st.attr===a?' selected':'')+'>'+ATTR_ABBR[a]+'</option>'; });
  return '<div class="hab-row"><div class="mod-box" data-modc="'+ck.id+'">'+(st.attr?fmtMod(m):'—')+'</div>'
    +'<div class="hab-nom"><input type="text" placeholder="Potencia / habilidad" data-customnom="'+ck.id+'" value="'+escapeHtml(st.nombre)+'"> '
    +'<select data-customattr="'+ck.id+'">'+opts+'</select></div>'
    +dotsHTML(ck.id,st.g,'cu')+'</div>'; }
function construirHabilidades(){ var map={fis:'colFis',cog:'colCog',esp:'colEsp'};
  ['fis','cog','esp'].forEach(function(c){ var html=''; SKILLS[c].forEach(function(sk){ html+=filaHabilidad(sk); });
    CUSTOM[c].forEach(function(ck){ html+=filaCustom(ck); }); document.getElementById(map[c]).innerHTML=html; }); }

/* ===== Acciones (sección estática, dos contenedores) ===== */
function accRow(ac){
  return '<div class="acc-row">'
    +'<div class="acc-head"><span class="act">'+symAct(ac.act)+'</span><span class="anom">'+escapeHtml(ac.name)+'</span><span class="acost">'+(COSTE[ac.act]||'')+'</span></div>'
    +(ac.flavor?'<div class="acc-flavor">'+escapeHtml(ac.flavor)+'</div>':'')
    +'<div class="acc-mec">'+escapeHtml(ac.mec)+'</div></div>'; }
function renderAcciones(){
  document.getElementById('accionesSel').innerHTML=ACCIONES_COMBATE.map(accRow).join('');
  document.getElementById('accionesRadSel').innerHTML=ACCIONES_RAD.map(accRow).join(''); }

/* ===== Metas ===== */
function dots3HTML(idx,p){ var h='<div class="dots3" data-dots3="'+idx+'">';
  for (var i=1;i<=3;i++) h+='<span class="dot'+(i<=p?' on':'')+'" data-n="'+i+'"></span>'; return h+'</div>'; }
function construirMetas(){ var html=''; for (var i=0;i<NUM_METAS;i++){ var m=S.metas[i];
  html+='<div class="meta-row"><input type="text" data-meta="'+i+'" value="'+escapeHtml(m.txt)+'">'+dots3HTML(i,m.p)+'</div>'; }
  document.getElementById('metasLista').innerHTML=html; }

/* ===== Lookups ===== */
function colorCamino(nom){ for (var g in CAMINOS){ for (var i=0;i<CAMINOS[g].length;i++){ if (CAMINOS[g][i].nom===nom) return CAMINOS[g][i].c; } } return '#5a606e'; }
function caminoById(id){ for (var g in CAMINOS){ for (var i=0;i<CAMINOS[g].length;i++){ if (CAMINOS[g][i].id===id) return CAMINOS[g][i]; } } return null; }
function caminoByName(nom){ for (var g in CAMINOS){ for (var i=0;i<CAMINOS[g].length;i++){ if (CAMINOS[g][i].nom===nom) return CAMINOS[g][i]; } } return null; }
function caminoSelNom(nom){ return S.caminos.some(function(x){ return x.nom===nom; }); }
function estadoData(nom){ for (var i=0;i<ESTADOS.length;i++) if (ESTADOS[i].n===nom) return ESTADOS[i]; return null; }
function armaData(nom){ for (var i=0;i<WEAPONS.length;i++) if (WEAPONS[i].n===nom) return WEAPONS[i]; return null; }
function armaduraData(nom){ for (var i=0;i<ARMORS.length;i++) if (ARMORS[i].n===nom) return ARMORS[i]; return null; }
function objCat(nom){ for (var g in OBJETOS) if (OBJETOS[g].indexOf(nom)>=0) return g; return 'Objeto'; }
function objIdx(nom){ for (var i=0;i<S.objetos.length;i++) if (S.objetos[i].n===nom) return i; return -1; }
function talKey(t){ return t.path+'§'+t.spec+'§'+t.name; }
function talByKey(k){ for (var i=0;i<CARDS.length;i++) if (talKey(CARDS[i])===k) return CARDS[i]; return null; }
function calcArma(w){
  if (w.sk==='ligero'){ var m=modSkill('armaLigero'); return {hab:'Arm. ligero',ataque:fmtMod(m),dano:fmtDano(w.die,m,w.tipo)}; }
  if (w.sk==='pesado'){ var m2=modSkill('armaPesado'); return {hab:'Arm. pesado',ataque:fmtMod(m2),dano:fmtDano(w.die,m2,w.tipo)}; }
  if (w.sk==='unarmed'){ var atl=modSkill('atletismo'); return {hab:'Atletismo',ataque:fmtMod(atl),dano:(1+n(S.attrs.fuerza))+' '+w.tipo+' (1 + Fuerza)'}; }
  return {hab:'—',ataque:'según orden',dano:w.die+' '+w.tipo};
}
function desvioArmadura(){ var max=0; S.armaduras.forEach(function(nom){ var a=armaduraData(nom); if (a && a.des>max) max=a.des; }); return max; }

/* ===== Render ficha ===== */
function renderCaminos(){ var el=document.getElementById('caminosSel');
  el.innerHTML = S.caminos.length ? S.caminos.map(function(cm){
    return '<span class="chip col" style="background:'+cm.c+'" data-info="caminos:'+attrEsc(cm.nom)+'"><span>'+escapeHtml(cm.nom)+'</span><span class="x" data-rem="caminos:'+attrEsc(cm.nom)+'">×</span></span>'; }).join('')
    : '<span class="chip-vacio">Sin camino seleccionado</span>'; }
function renderPericias(){ var el=document.getElementById('periciasSel');
  el.innerHTML = S.pericias.length ? S.pericias.map(function(p){
    return '<span class="chip" data-info="pericias:'+attrEsc(p)+'"><span>'+escapeHtml(p)+'</span><span class="x" data-rem="pericias:'+attrEsc(p)+'">×</span></span>'; }).join('')
    : '<span class="chip-vacio">Sin pericias</span>'; }
function renderEstados(){ var el=document.getElementById('estadosSel');
  el.innerHTML = S.estados.length ? S.estados.map(function(nom){ var d=estadoData(nom);
    return '<span class="est-chip '+(d&&d.buff?'buff':'deb')+'" data-info="estados:'+attrEsc(nom)+'"><span>'+escapeHtml(nom)+'</span><span class="x" data-rem="estados:'+attrEsc(nom)+'">×</span></span>'; }).join('')
    : '<span class="chip-vacio">Sin estados activos</span>'; }
function renderArmas(){ var el=document.getElementById('armasSel');
  el.innerHTML = S.armas.length ? S.armas.map(function(nom){ var w=armaData(nom); if (!w) return ''; var c=calcArma(w);
    return '<div class="arma-row" data-info="armas:'+attrEsc(nom)+'"><div><div class="anombre">'+escapeHtml(w.n)+'</div>'
      +'<div class="ameta">'+escapeHtml(c.hab)+' · '+escapeHtml(alcanceConCasillas(w.alc))+' · '+escapeHtml(w.ras)+'</div>'
      +'<div class="acalc">Ataque <b>'+c.ataque+'</b> contra Física · Daño <b>'+c.dano+'</b></div></div>'
      +'<span class="x" data-rem="armas:'+attrEsc(nom)+'">×</span></div>'; }).join('')
    : '<span class="chip-vacio">Sin armas seleccionadas</span>'; }
function renderArmaduras(){ var el=document.getElementById('armadurasSel');
  el.innerHTML = S.armaduras.length ? S.armaduras.map(function(nom){ var a=armaduraData(nom);
    return '<span class="chip" data-info="armaduras:'+attrEsc(nom)+'"><span>'+escapeHtml(nom)+' <b style="color:var(--acento)">(desvío '+(a?a.des:'?')+')</b></span><span class="x" data-rem="armaduras:'+attrEsc(nom)+'">×</span></span>'; }).join('')
    : '<span class="chip-vacio">Sin armadura</span>'; }
function renderObjetos(){ var el=document.getElementById('objetosSel');
  el.innerHTML = S.objetos.length ? S.objetos.map(function(o){
    return '<div class="obj-row"><span class="obj-nom" data-info="objetos:'+attrEsc(o.n)+'">'+escapeHtml(o.n)+'</span>'
      +'<div class="qty"><button type="button" data-objdec="'+attrEsc(o.n)+'">−</button><b>'+o.q+'</b><button type="button" data-objinc="'+attrEsc(o.n)+'">+</button></div>'
      +'<span class="x" data-rem="objetos:'+attrEsc(o.n)+'">×</span></div>'; }).join('')
    : '<span class="chip-vacio">Sin objetos</span>'; }
function fullCardItem(item,on){
  var c=CAT_COLORS[item.cat]||'#666';
  var expVal=null;
  var statsH=item.stats?item.stats.filter(function(s){
    if(s[0]==='Experto'){ expVal=s[1]; return false; } // sacar Experto de la tabla
    return true;
  }).map(function(s){
    var val=(s[0]==='Alcance')?alcanceConCasillas(s[1]):s[1];
    return '<tr><td class="fc-item-key">'+escapeHtml(s[0])+'</td><td class="fc-item-val">'+escapeHtml(val)+'</td></tr>';
  }).join(''):'';
  // Calcular ataque/daño si es arma
  var w=armaData(item.name);
  var calcH='';
  if(w){ var wc=calcArma(w); calcH='<div class="fc-item-calc">Ataque <b>'+wc.ataque+'</b> · Daño <b>'+wc.dano+'</b></div>'; }
  // Rasgo de experto (lo que ganas si tienes la pericia)
  var expH=(expVal&&expVal!=='—')?'<div class="fc-item-exp"><b>Con pericia:</b> '+escapeHtml(expVal)+'</div>':'';
  return '<div class="full-card fc-item'+(on?' fc-item-on':'')+'" style="border-color:'+c+'">'
    +'<div class="fc-ch" style="background:linear-gradient(135deg,rgba(0,0,0,.04),#fff)">'
    +'<div class="fc-cn"><span>'+escapeHtml(item.name)+'</span></div>'
    +(item.sub?'<div class="fc-item-sub" style="color:'+c+'">'+escapeHtml(item.sub)+'</div>':'')
    +'<div class="fc-item-cat" style="color:'+c+'">'+escapeHtml(CAT_LABELS[item.cat]||'')+'</div></div>'
    +'<div class="fc-cb">'
    +(statsH?'<table class="fc-item-stats">'+statsH+'</table>':'')
    +(item.mec?'<div class="fc-cm" style="border-color:'+c+'">'+escapeHtml(item.mec)+'</div>':'')
    +expH
    +(item.mej?'<div class="fc-item-mej"><b>Mejora:</b> '+escapeHtml(item.mej)+'</div>':'')
    +(item.inc?'<div class="fc-item-inc"><b>Inconveniente:</b> '+escapeHtml(item.inc)+'</div>':'')
    +calcH+'</div>'
    +'<div class="fc-cf"><div class="fc-dot" style="background:'+c+'"></div>'
    +'<div><span class="fc-cf-tree" style="color:'+c+'">'+escapeHtml(CAT_LABELS[item.cat]||'')+'</span></div></div></div>'; }

function fullCardTal(t,on){
  var sym=symTal(t.act);
  var invB=t.inv?'<span class="b-inv">◆ '+escapeHtml(t.inv)+'</span>':'';
  var conB=t.con?'<span class="b-con">◈ '+escapeHtml(String(t.con))+'</span>':'';
  var badges=(invB||conB)?'<div class="fc-badges">'+invB+conB+'</div>':'';
  var reqB=(t.req&&t.req!=='ninguno')?'<span class="fc-cf-req">Req: '+escapeHtml(t.req)+'</span>':'';
  return '<div class="full-card fc-'+t.path+(on?' on':'')+'"><div class="fc-ch">'
    +'<div class="fc-cn"><span class="fc-asym">'+sym+'</span><span>'+escapeHtml(t.name)+'</span></div>'+badges+'</div>'
    +'<div class="fc-cb"><div class="fc-cm">'+escapeHtml(t.mec)+'</div></div>'
    +'<div class="fc-cf"><div class="fc-dot"></div><div>'
    +'<span class="fc-cf-tree">'+escapeHtml(PATH_LABEL[t.path]||t.path)+' · '+escapeHtml(t.spec)+'</span>'+reqB+'</div></div></div>'; }
function fullCardPot(p,on){
  var sym=symTal(p.act);
  var c=POW_COLOR[p.key]||'#7a3d9a';
  var tint=POW_TINT[p.key]||'#f8eefa';
  var dark=POW_DARK[p.key]||'#5a1a7a';
  var invB=p.inv?'<span class="b-inv">◆ '+escapeHtml(p.inv)+'</span>':'';
  var actsHtml=POWER_ACTIONS.filter(function(a){ return a.power===p.key; }).map(function(a){
    var aI=a.inv?'<span class="b-inv" style="font-size:8.5px">◆ '+escapeHtml(a.inv)+'</span>':'';
    var aC=a.con?'<span class="b-con" style="font-size:8.5px">◈ '+escapeHtml(String(a.con))+'</span>':'';
    return '<div class="pot-act-row" style="background:'+tint+'"><div class="pot-act-head">'
      +'<span class="pot-act-sym" style="color:'+c+'">'+symTal(a.act)+'</span>'
      +'<span class="pot-act-nom">'+escapeHtml(a.name)+'</span>'+aI+aC
      +(a.cond?'<span class="pot-act-cond"> — '+escapeHtml(a.cond)+'</span>':'')+'</div>'
      +'<div class="pot-act-mec">'+escapeHtml(a.mec)+'</div></div>'; }).join('');
  return '<div class="full-card" style="border-color:'+c+'"'+(on?' data-on="1"':'')+'>'
    +(on?'<div style="height:3px;background:'+c+'"></div>':'')
    +'<div class="fc-ch" style="background:linear-gradient(135deg,'+tint+',#fff)">'
    +'<div class="fc-cn"><span class="fc-asym" style="color:'+dark+'">'+sym+'</span>'
    +'<span>'+escapeHtml(POWER_NAMES[p.key]||p.key)+'</span>'
    +'<span style="font-size:9px;margin-left:4px;color:'+c+';font-family:Georgia,serif">'+escapeHtml(p.attr)+'</span></div>'
    +'<div class="fc-badges">'+invB+'</div></div>'
    +'<div class="fc-cb">'
    +'<div class="fc-cm" style="border-color:'+c+';background:'+tint+';font-style:italic;font-size:11px;margin-bottom:4px">'+escapeHtml(p.desc)+'</div>'
    +'<div class="fc-cm" style="border-color:'+c+';background:'+tint+'">'+escapeHtml(p.mec)+'</div></div>'
    +(actsHtml?'<div class="pot-act-sub">'+actsHtml+'</div>':'')
    +'<div class="fc-cf"><div class="fc-dot" style="background:'+c+'"></div>'
    +'<div><span class="fc-cf-tree" style="color:'+dark+'">'+escapeHtml(p.orders)+'</span></div></div></div>'; }
function chipTal(t,k){
  var invB=t.inv?'<span class="badge-inv">◆ '+escapeHtml(t.inv)+'</span>':'';
  var conB=t.con?'<span class="badge-con">◈ '+escapeHtml(String(t.con))+'</span>':'';
  var badges=(invB||conB)?'<div class="tal-chip-badges">'+invB+conB+'</div>':'';
  return '<div class="tal-chip tc-'+t.path+'" data-info="talentos:'+attrEsc(k)+'">'
    +'<div class="tal-chip-stripe"></div><div class="tal-chip-body">'
    +'<div class="tal-chip-head"><span class="tal-chip-sym">'+symTal(t.act)+'</span>'
    +'<span class="tal-chip-name">'+escapeHtml(t.name)+'</span>'
    +badges
    +'<span class="tal-chip-rem" data-rem="talentos:'+attrEsc(k)+'">×</span></div>'
    +'<div class="tal-chip-mec">'+escapeHtml(t.mec)+'</div>'
    +'</div></div>'; }
function chipPot(p){
  var c=POW_COLOR[p.key]||'#7a3d9a';
  var dark=POW_DARK[p.key]||'#5a1a7a';
  var invB=p.inv?'<span class="badge-inv">◆ '+escapeHtml(p.inv)+'</span>':'';
  return '<div class="tal-chip" style="border-color:'+c+'" data-info="potencias:'+attrEsc(p.key)+'">'
    +'<div class="tal-chip-stripe" style="background:'+c+'"></div><div class="tal-chip-body">'
    +'<div class="tal-chip-head"><span class="tal-chip-sym" style="color:'+dark+'">'+symTal(p.act)+'</span>'
    +'<span class="tal-chip-name">'+escapeHtml(POWER_NAMES[p.key]||p.key)+'</span>'
    +(invB?'<div class="tal-chip-badges">'+invB+'</div>':'')
    +'<span class="tal-chip-rem" data-rem="potencias:'+attrEsc(p.key)+'">×</span></div>'
    +'<div class="tal-chip-mec">'+escapeHtml(p.desc)+'</div>'
    +'</div></div>'; }
function tienePrimerIdeal(){
  return S.talentos.some(function(id){ return /primer ideal/i.test(id); });
}
function renderTalentos(){ var el=document.getElementById('talentosSel');
  el.innerHTML=S.talentos.length?S.talentos.map(function(k){ var t=talByKey(k); if(!t) return ''; return chipTal(t,k); }).join('')
    :'<span class="chip-vacio">Sin talentos seleccionados</span>'; }

function renderPotencias(){ var el=document.getElementById('potenciasSel');
  el.innerHTML=S.potencias.length?S.potencias.map(function(k){ var p=POWERS.filter(function(x){ return x.key===k; })[0]; if(!p) return ''; return chipPot(p); }).join('')
    :'<span class="chip-vacio">Sin potencias seleccionadas</span>'; }

/* ===== Descanso ===== */
function descanso(){
  var salMax=n(document.getElementById('saludMax').value);
  var conMax=n(document.getElementById('concMax').value);
  var invMax=n(S.fields.investMax)||0;
  var aS=document.querySelector('[data-field="saludAct"]'); if(aS){ aS.value=salMax; S.fields.saludAct=String(salMax); }
  var aC=document.querySelector('[data-field="concAct"]'); if(aC){ aC.value=conMax; S.fields.concAct=String(conMax); }
  var aI=document.querySelector('[data-field="investAct"]'); if(aI){ aI.value=invMax; S.fields.investAct=String(invMax); }
  guardarDebounced(); }

/* ===== Plegado de secciones ===== */
function aplicarColapsos(){ document.querySelectorAll('[data-sec]').forEach(function(el){ var id=el.getAttribute('data-sec');
  el.classList.toggle('collapsed', !!(S.collapsed && S.collapsed[id])); }); }
function plegarTodo(plegar){ document.querySelectorAll('[data-sec]').forEach(function(el){ var id=el.getAttribute('data-sec');
  el.classList.toggle('collapsed', plegar); S.collapsed[id]=plegar; }); guardarDebounced(); }

/* ===== Combobox de navegación ===== */
var SECCIONES=[['caminos','Caminos'],['atributos','Atributos y recursos'],['habilidades','Habilidades'],
  ['estados','Estados y lesiones'],['pericias','Pericias'],['armas','Armas'],['talentos','Talentos'],
  ['potencias','Potencias'],['acciones','Acciones de combate'],['accionesRad','Acciones radiantes'],
  ['equipo','Armadura y equipo'],['proposito','Propósito'],['obstaculo','Obstáculo'],
  ['metas','Metas'],['notas','Notas'],['conexiones','Conexiones']];
function llenarNavSel(){ var sel=document.getElementById('navSel'); if (!sel) return;
  SECCIONES.forEach(function(s){ var o=document.createElement('option'); o.value=s[0]; o.textContent=s[1]; sel.appendChild(o); }); }
function toggleHbg(){ var m=document.getElementById('hbgMenu'); if(m) m.classList.toggle('open'); }
function cerrarHbg(){ var m=document.getElementById('hbgMenu'); if(m) m.classList.remove('open'); }
function irASeccionSel(sel){ var id=sel.value; sel.value=''; if (!id) return; irASeccion(id); }
function irASeccion(id){ var el=document.querySelector('[data-sec="'+id+'"]'); if (!el) return;
  if (el.classList.contains('collapsed')){ el.classList.remove('collapsed'); S.collapsed[id]=false; guardarDebounced(); }
  var tb=document.querySelector('.toolbar'), off=(tb?tb.offsetHeight:0)+10;
  var y=el.getBoundingClientRect().top+window.pageYOffset-off;
  window.scrollTo({top:y<0?0:y,behavior:'smooth'}); }

/* ===== Selección genérica ===== */
function toggleSel(tipo,id){
  if (tipo==='caminos'){ var cm=caminoById(id); if (!cm) return; if (caminoSelNom(cm.nom)) S.caminos=S.caminos.filter(function(x){ return x.nom!==cm.nom; }); else S.caminos.push({id:cm.id,nom:cm.nom,c:cm.c}); renderCaminos(); renderTalentos(); }
  else if (tipo==='pericias'){ if (S.pericias.indexOf(id)>=0) S.pericias=S.pericias.filter(function(x){ return x!==id; }); else S.pericias.push(id); renderPericias(); }
  else if (tipo==='estados'){ if (S.estados.indexOf(id)>=0) S.estados=S.estados.filter(function(x){ return x!==id; }); else S.estados.push(id); renderEstados(); }
  else if (tipo==='armas'){ if (S.armas.indexOf(id)>=0) S.armas=S.armas.filter(function(x){ return x!==id; }); else S.armas.push(id); renderArmas(); }
  else if (tipo==='armaduras'){ if (S.armaduras.indexOf(id)>=0) S.armaduras=S.armaduras.filter(function(x){ return x!==id; }); else S.armaduras.push(id); renderArmaduras(); recalc(); }
  else if (tipo==='talentos'){ if (S.talentos.indexOf(id)>=0) S.talentos=S.talentos.filter(function(x){ return x!==id; }); else S.talentos.push(id); renderTalentos(); }
  else if (tipo==='potencias'){ if (S.potencias.indexOf(id)>=0) S.potencias=S.potencias.filter(function(x){ return x!==id; }); else S.potencias.push(id); renderPotencias(); }
  else if (tipo==='objetos'){ var ix=objIdx(id); if (ix>=0) S.objetos.splice(ix,1); else S.objetos.push({n:id,q:1}); renderObjetos(); }
  guardarDebounced();
  if (modalAbierto && modalTipo===tipo && modalModo==='pick') renderModalBody();
  actualizarContadores();
  actualizarContadores();
  var secRad=document.getElementById('secAccionesRad'); if(secRad) secRad.style.display=tienePrimerIdeal()?'':'none';
}
function quitarSel(tipo,id){
  if (tipo==='caminos'){ S.caminos=S.caminos.filter(function(x){ return x.nom!==id; }); renderCaminos(); renderTalentos(); }
  else if (tipo==='pericias'){ S.pericias=S.pericias.filter(function(x){ return x!==id; }); renderPericias(); }
  else if (tipo==='estados'){ S.estados=S.estados.filter(function(x){ return x!==id; }); renderEstados(); }
  else if (tipo==='armas'){ S.armas=S.armas.filter(function(x){ return x!==id; }); renderArmas(); }
  else if (tipo==='armaduras'){ S.armaduras=S.armaduras.filter(function(x){ return x!==id; }); renderArmaduras(); recalc(); }
  else if (tipo==='talentos'){ S.talentos=S.talentos.filter(function(x){ return x!==id; }); renderTalentos(); }
  else if (tipo==='potencias'){ S.potencias=S.potencias.filter(function(x){ return x!==id; }); renderPotencias(); }
  else if (tipo==='objetos'){ var ix=objIdx(id); if (ix>=0) S.objetos.splice(ix,1); renderObjetos(); }
  guardarDebounced();
}
function objAdjust(nom,delta){ var ix=objIdx(nom); if (ix<0) return; S.objetos[ix].q+=delta; if (S.objetos[ix].q<=0) S.objetos.splice(ix,1); renderObjetos(); guardarDebounced(); }

/* ===== MODAL ===== */
var modalAbierto=false, modalTipo=null, modalModo='pick', modalInfoId=null, modalBusqueda='', modalTalPath='mis';
var TITULOS={caminos:'Caminos',pericias:'Pericias',estados:'Estados',armas:'Armas',armaduras:'Armaduras',talentos:'Talentos',objetos:'Objetos',potencias:'Potencias'};
function abrirSelector(tipo){ modalTipo=tipo; modalModo='pick'; modalBusqueda=''; modalSubcat=''; modalAbierto=true;
  document.getElementById('modalTitulo').textContent='Elegir · '+TITULOS[tipo];
  document.getElementById('modalTools').style.display='flex';
  document.getElementById('modalBusca').value='';
  document.getElementById('modalAddWrap').style.display=(tipo==='caminos'||tipo==='pericias')?'inline-flex':'none';
  var ts=document.getElementById('modalTalSelect');
  if(tipo==='talentos'){ llenarTalSelectParaPersonaje(); ts.style.display=ts.innerHTML?'inline-block':'none'; }
  else ts.style.display='none';
  mostrarSubcat(tipo);
  document.getElementById('modalBackdrop').classList.add('open'); renderModalBody();
  setTimeout(function(){ var b=document.getElementById('modalBusca'); if (b) b.focus(); },30);
}
function abrirInfo(tipo,id){ modalTipo=tipo; modalModo='info'; modalInfoId=id; modalAbierto=true;
  document.getElementById('modalTitulo').textContent=TITULOS[tipo]||'Detalle';
  document.getElementById('modalTools').style.display='none';
  document.getElementById('modalBackdrop').classList.add('open');
  document.getElementById('modalBody').innerHTML=infoCardHTML(tipo,id);
  document.getElementById('modalCont').textContent=''; }
function cerrarModal(){ modalAbierto=false; document.getElementById('modalBackdrop').classList.remove('open'); }
function onBusca(){ modalBusqueda=(document.getElementById('modalBusca').value||'').toLowerCase(); renderModalBody(); }
function onTalPath(){ modalTalPath=document.getElementById('modalTalSelect').value; renderModalBody(); }
function anadirDesdeModal(){ var inp=document.getElementById('modalAddInput'),v=(inp.value||'').trim(); if (!v) return;
  if (modalTipo==='caminos'){ if (!caminoSelNom(v)) S.caminos.push({id:'',nom:v,c:colorCamino(v)}); renderCaminos(); }
  else if (modalTipo==='pericias'){ if (S.pericias.indexOf(v)<0) S.pericias.push(v); renderPericias(); }
  inp.value=''; guardarDebounced(); renderModalBody(); }
function pkContains(txt){ if (!modalBusqueda) return true; return (txt||'').toLowerCase().indexOf(modalBusqueda)>=0; }

function renderModalBody(){
  var body=document.getElementById('modalBody'), html='', count=0;
  if (modalTipo==='caminos'){
    for (var g in CAMINOS){ var items=CAMINOS[g].filter(function(cm){ return pkContains(cm.nom); }); if (!items.length) continue;
      html+='<div class="pk-grupo"><div class="pk-gtit">'+g+'</div>';
      items.forEach(function(cm){ var on=caminoSelNom(cm.nom); if (on) count++;
        html+='<div class="pk-card'+(on?' on':'')+'" data-tog="caminos:'+attrEsc(cm.id)+'"><div class="pk-head"><span class="pk-swatch" style="background:'+cm.c+'"></span><span class="pk-name">'+cm.nom+'</span><span class="pk-tag">'+(RAD_IDS.indexOf(cm.id)>=0?'Orden radiante':'Camino heroico')+'</span></div></div>'; });
      html+='</div>'; }
  } else if (modalTipo==='pericias'){
    var periCats=modalSubcat?PERICIAS_CATS.filter(function(c){ return c.key===modalSubcat; }):PERICIAS_CATS;
    periCats.forEach(function(cat){
      var todasItems=cat.grupos.flatMap(function(g){ return g.items; });
      var hayBusq=!!modalBusqueda;
      // Cabecera de categoría con descripción
      html+='<div class="pk-gtit" style="margin-top:8px">'+escapeHtml(cat.nom)+'</div>';
      html+='<div style="font-size:11.5px;color:var(--tinta-suave);margin-bottom:6px;padding:4px 8px;background:#f5f3ee;border-radius:6px;border-left:3px solid var(--acento-2)">'+escapeHtml(cat.desc)+'<br><span style="font-size:10px;font-style:italic">'+escapeHtml(cat.nota)+'</span></div>';
      cat.grupos.forEach(function(g){
        var its=g.items.filter(function(p){ return pkContains(p); }); if(!its.length) return;
        html+='<div style="font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#8a8f99;margin:4px 0 3px;font-family:Cinzel,serif">'+escapeHtml(g.sub)+'</div>';
        html+='<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">';
        its.forEach(function(p){ var on=S.pericias.indexOf(p)>=0; if(on) count++;
          html+='<span style="border:1.4px solid '+(on?'var(--acento)':'var(--linea-fina)')+';border-radius:12px;padding:5px 11px;cursor:pointer;background:'+(on?'#eef4fc':'#fff')+';font-size:13px" data-tog="pericias:'+attrEsc(p)+'">'+escapeHtml(p)+(on?' ✓':'')+'</span>'; });
        html+='</div>';
      });
    });
  } else if (modalTipo==='estados'){
    [['Beneficiosos',true,'buff'],['Perjudiciales',false,'deb']].forEach(function(par){
      if(modalSubcat&&modalSubcat!==par[2]) return;
      var its=ESTADOS.filter(function(e){ return e.buff===par[1] && (pkContains(e.n)||pkContains(e.mec)); }); if (!its.length) return;
      html+='<div class="pk-grupo"><div class="pk-gtit">'+par[0]+'</div>';
      its.forEach(function(e){ var on=S.estados.indexOf(e.n)>=0; if (on) count++;
        html+='<div class="pk-card'+(on?' on':'')+'" data-tog="estados:'+attrEsc(e.n)+'"><div class="pk-head"><span class="pk-name">'+e.n+'</span><span class="pk-tag '+(e.buff?'buff':'deb')+'">'+(e.buff?'Beneficioso':'Perjudicial')+'</span></div><div class="pk-mec">'+escapeHtml(e.mec)+'</div></div>'; });
      html+='</div>'; });
  } else if (modalTipo==='armas'){
    // Agrupar por categoría desde ITEMS directamente
    var armaCats=[['al','Armamento ligero'],['ap','Armamento pesado'],['ae','Armas especiales']];
    armaCats.forEach(function(par){
      var its=ITEMS.filter(function(i){ return i.cat===par[0]&&(pkContains(i.name)||pkContains(itemStat(i,'Rasgos')||'')||pkContains(itemStat(i,'Habilidad')||'')); });
      if(!its.length) return;
      html+='<div class="pk-gtit">'+par[1]+'</div><div class="modal-cards-grid">';
      its.forEach(function(item){
        var on=S.armas.indexOf(item.name)>=0; if(on) count++;
        html+='<div class="modal-card-wrap" data-tog="armas:'+attrEsc(item.name)+'">'+fullCardItem(item,on)+(on?'<span class="fc-added">✓ añadida</span>':'')+'</div>';
      });
      html+='</div>';
    });
  } else if (modalTipo==='armaduras'){
    html+='<div class="pk-gtit">Armaduras</div><div class="modal-cards-grid">';
    ITEMS.filter(function(i){ return i.cat==='ar'&&(pkContains(i.name)||pkContains(itemStat(i,'Rasgos')||'')); }).forEach(function(item){
      var on=S.armaduras.indexOf(item.name)>=0; if(on) count++;
      html+='<div class="modal-card-wrap" data-tog="armaduras:'+attrEsc(item.name)+'">'+fullCardItem(item,on)+(on?'<span class="fc-added">✓ equipada</span>':'')+'</div>';
    });
    html+='</div>';
  } else if (modalTipo==='potencias'){
    // Solo mostrar potencias accesibles desde los caminos radiantes del personaje
    var misRadIds=S.caminos.map(function(c){ return c.id; }).filter(function(id){ return RAD_IDS.indexOf(id)>=0; });
    function ordMatchPot(rid,orders){ var label=PATH_LABEL[rid]||''; return orders.toLowerCase().indexOf(label.split(' ')[0].toLowerCase())>=0; }
    var potFiltradas=modalBusqueda
      ? POWERS.filter(function(p){ return pkContains(POWER_NAMES[p.key]||p.key)||pkContains(p.mec)||pkContains(p.desc); })
      : (misRadIds.length ? POWERS.filter(function(p){ return misRadIds.some(function(rid){ return ordMatchPot(rid,p.orders); }); }) : POWERS);
    if(!potFiltradas.length && !modalBusqueda){
      html+='<div class="empty-msg">Selecciona un camino radiante para ver las potencias de tu orden.<br><span style="font-size:11px">O busca por nombre para ver todas.</span></div>';
    } else {
      html+='<div class="pk-gtit">'+(misRadIds.length&&!modalBusqueda?'Potencias de tus órdenes':'Potencias radiantes')+'</div><div class="modal-cards-grid">';
      potFiltradas.forEach(function(p){
        var on=S.potencias.indexOf(p.key)>=0; if(on) count++;
        html+='<div class="modal-card-wrap" data-tog="potencias:'+attrEsc(p.key)+'">'+fullCardPot(p,on)+(on?'<span class="fc-added">✓ añadido</span>':'')+'</div>'; });
      html+='</div>';
    }
  } else if (modalTipo==='objetos'){
    var objCatOrder=[['fc','Fabriales comunes'],['fu','Fabriales únicos'],['co','Consumibles'],['eq','Equipo con reglas']];
    objCatOrder.filter(function(p){ return !modalSubcat||modalSubcat===p[0]; }).forEach(function(par){
      var its=ITEMS.filter(function(i){ return i.cat===par[0]&&(pkContains(i.name)||(i.mec&&pkContains(i.mec))); });
      if(!its.length) return;
      html+='<div class="pk-gtit">'+par[1]+'</div><div class="modal-cards-grid">';
      its.forEach(function(item){
        var on=objIdx(item.name)>=0; if(on) count++;
        html+='<div class="modal-card-wrap" data-tog="objetos:'+attrEsc(item.name)+'">'+fullCardItem(item,on)+(on?'<span class="fc-added">✓ añadido</span>':'')+'</div>';
      });
      html+='</div>';
    });
  } else if (modalTipo==='talentos'){
    var lista;
    var talIds=S.caminos.map(function(c){ return c.id; }).filter(Boolean);
    if(talIds.indexOf('cantor')<0) talIds=talIds.concat(['cantor']);
    if(modalTalPath==='mis'){
      if(!talIds.filter(function(x){ return x!=='cantor'; }).length){ body.innerHTML='<div class="empty-msg">Añade un camino heroico primero.</div>'; document.getElementById('modalCont').textContent=''; return; }
      lista=CARDS.filter(function(t){ return talIds.indexOf(t.path)>=0&&(pkContains(t.name)||pkContains(t.mec)||pkContains(t.spec)); });
    } else {
      // path concreto — verificar que es un path del personaje
      if(talIds.indexOf(modalTalPath)<0) modalTalPath='mis';
      lista=CARDS.filter(function(t){ return t.path===modalTalPath&&(pkContains(t.name)||pkContains(t.mec)||pkContains(t.spec)); });
    }
    var byPath={}; lista.forEach(function(t){ (byPath[t.path]=byPath[t.path]||{}); (byPath[t.path][t.spec]=byPath[t.path][t.spec]||[]).push(t); });
    PATH_ORDER.forEach(function(p){ if(!byPath[p]) return;
      html+='<div class="pk-gtit">'+escapeHtml(PATH_LABEL[p]||p)+'</div>';
      Object.keys(byPath[p]).forEach(function(spec){
        html+='<div style="font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#8a8f99;margin:5px 0 4px;font-family:Cinzel,serif">'+escapeHtml(spec)+'</div><div class="modal-cards-grid">';
        byPath[p][spec].forEach(function(t){ var k=talKey(t); var on=S.talentos.indexOf(k)>=0; if(on) count++;
          html+='<div class="modal-card-wrap" data-tog="talentos:'+attrEsc(k)+'">'+fullCardTal(t,on)+(on?'<span class="fc-added">✓ añadido</span>':'')+'</div>'; });
        html+='</div>'; }); });
  }
  if (!html) html='<div class="empty-msg">Sin resultados.</div>';
  body.innerHTML=html;
  document.getElementById('modalCont').textContent=count+' seleccionado'+(count===1?'':'s');
}
function botonQuitar(tipo,id){ return '<div style="margin-top:10px"><button class="mini-btn" type="button" onclick="quitarSel(\''+tipo+'\',\''+attrEsc(id).replace(/'/g,"\\'")+'\');cerrarModal()">Quitar de la ficha</button></div>'; }
function infoCardHTML(tipo,id){
  if (tipo==='potencias'){ var p=POWERS.filter(function(x){ return x.key===id; })[0]; if(!p) return '';
    return fullCardPot(p,false)+botonQuitar('potencias',id); }
  if (tipo==='talentos'){ var t=talByKey(id); if(!t) return '<div class="empty-msg">No encontrado.</div>';
    return fullCardTal(t,false)+botonQuitar('talentos',id); }
  if (tipo==='armas'){ var item=itemByName(id); if(!item) return '';
    return fullCardItem(item,false)+botonQuitar('armas',id); }
  if (tipo==='armaduras'){ var item2=itemByName(id); if(!item2) return '';
    return fullCardItem(item2,false)+botonQuitar('armaduras',id); }
  if (tipo==='estados'){ var e=estadoData(id); if (!e) return '';
    return '<div class="full-card" style="border-color:'+(e.buff?'var(--verde)':'var(--marron)')+'">'+'<div class="fc-ch"><div class="fc-cn"><span>'+escapeHtml(e.n)+'</span><span style="font-size:9px;font-family:Cinzel,serif;text-transform:uppercase;padding:1px 6px;border-radius:8px;color:#fff;background:'+(e.buff?'var(--verde)':'var(--marron)')+'">'+(e.buff?'Beneficioso':'Perjudicial')+'</span></div></div><div class="fc-cb"><div class="fc-cm" style="border-color:'+(e.buff?'var(--verde)':'var(--marron)')+'">'+ escapeHtml(e.mec)+'</div></div></div>'+botonQuitar('estados',id); }
  if (tipo==='objetos'){ var item3=itemByName(id);
    if(!item3) return '<div class="full-card"><div class="fc-ch"><div class="fc-cn"><span>'+escapeHtml(id)+'</span></div></div></div>'+botonQuitar('objetos',id);
    return fullCardItem(item3,false)+botonQuitar('objetos',id); }
  if (tipo==='pericias'){
    var pcat=null; PERICIAS_CATS.forEach(function(c){ c.grupos.forEach(function(g){ if(g.items.indexOf(id)>=0) pcat=c; }); });
    return '<div class="full-card" style="border-color:var(--acento-2)">'
      +'<div class="fc-ch"><div class="fc-cn"><span>'+escapeHtml(id)+'</span></div>'
      +(pcat?'<div style="font-size:8.5px;font-family:Cinzel,serif;text-transform:uppercase;letter-spacing:.05em;color:var(--acento-2)">'+escapeHtml(pcat.nom)+'</div>':'')+'</div>'
      +(pcat?'<div class="fc-cb"><div class="fc-cm" style="border-color:var(--acento-2)">'+escapeHtml(pcat.desc)+'</div>'
        +'<div style="font-size:10.5px;margin-top:4px;padding:3px 7px;color:var(--tinta-suave);font-style:italic">'+escapeHtml(pcat.nota)+'</div></div>':'')
      +'</div>'+botonQuitar('pericias',id); }
  if (tipo==='caminos'){ var cm=caminoByName(id);
    return '<div class="info-card"><div class="pk-head" style="padding-right:0"><span class="pk-swatch" style="background:'+(cm?cm.c:'#5a606e')+'"></span><span class="pk-name" style="font-size:17px">'+escapeHtml(id)+'</span></div><div class="pk-mec" style="margin-top:6px">'+(cm?(RAD_IDS.indexOf(cm.id)>=0?'Orden radiante.':'Camino heroico.'):'Camino propio.')+'</div></div>'+botonQuitar('caminos',id); }
  return '';
}

/* ===== Recalcular ===== */
function recalc(){
  var a=S.attrs;
  setText('defFisica',10+n(a.fuerza)+n(a.velocidad)+n(S.fields.bonifDefFis));
  setText('defCognitiva',10+n(a.intelecto)+n(a.voluntad)+n(S.fields.bonifDefCog));
  setText('defEspiritual',10+n(a.discernimiento)+n(a.presencia)+n(S.fields.bonifDefEsp));
  var lv_=n(S.fields.nivel)||1; var fue_=n(a.fuerza);
  // Salud base nivel 1: 10 + FUE
  var sal_=10+fue_;
  // Incrementos por nivel según tabla Progreso de los personajes
  var salSteps_=[0, 5,5,5,5,  // lv 2-5: +5 cada uno
    (4+fue_),4,4,4,4,          // lv 6-10: +4 (lv6 +FUE)
    (3+fue_),3,3,3,3,          // lv 11-15: +3 (lv11 +FUE)
    (2+fue_),2,2,2,2];         // lv 16-20: +2 (lv16 +FUE)
  for(var i_=1;i_<Math.min(lv_,20);i_++) sal_+=salSteps_[i_];
  if(lv_>20) sal_+=(lv_-20)*1; // lv 21+: +1/lv
  sal_+=n(S.fields.bonifSalud);
  setVal('saludMax',sal_);
  setVal('concMax',2+n(a.voluntad)+n(S.fields.bonifConc));
  setText('movMetros',movMetros(n(a.velocidad))); setText('movCasillas',movCasillas(n(a.velocidad)));
  setText('dadoRecup',dadoRecupDe(n(a.voluntad))); setText('alcanceSent',alcanceDe(n(a.discernimiento))); setText('alcanceSentCas',alcanceCasillas(n(a.discernimiento)));
  setText('capLevant',capLevantDe(n(a.fuerza)));
  var dArm=desvioArmadura(); setText('desvioArmadura',dArm); setText('desvioTotal',dArm+n(S.fields.bonifDesvio));
  actualizarRango();
  ['fis','cog','esp'].forEach(function(c){
    SKILLS[c].forEach(function(sk){ var m=S.skills[sk.id].g+n(a[sk.attr]); var el=document.querySelector('[data-mod="'+sk.id+'"]'); if (el) el.textContent=fmtMod(m); });
    CUSTOM[c].forEach(function(ck){ var st=S.custom[ck.id], el=document.querySelector('[data-modc="'+ck.id+'"]'); if (!el) return; if (st.attr){ el.textContent=fmtMod(st.g+n(a[st.attr])); } else el.textContent='—'; });
  });
  renderArmas();
  actualizarContadores();
}
function setText(id,v){ var e=document.getElementById(id); if (e) e.textContent=v; }
function setVal(id,v){ var e=document.getElementById(id); if (e) e.value=v; }

function pintarEstado(){
  document.querySelectorAll('[data-field]').forEach(function(inp){ var k=inp.getAttribute('data-field'); if (S.fields[k]!==undefined) inp.value=S.fields[k]; });
  document.querySelectorAll('[data-attr]').forEach(function(inp){ inp.value=S.attrs[inp.getAttribute('data-attr')]; });
  construirHabilidades(); construirMetas(); renderAcciones();
  renderCaminos(); renderPericias(); renderEstados(); renderArmaduras(); renderObjetos(); renderTalentos(); renderPotencias();
  actualizarContadores();
  recalc();
  actualizarContadores();
}

/* ===== Guardado ===== */
var guardadoTimer=null;
function guardar(){ try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(S));
  var e=document.getElementById('estadoGuardado'); if (e){ var d=new Date(); e.textContent='Guardado · '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
  }catch(err){ var e2=document.getElementById('estadoGuardado'); if (e2) e2.textContent='No se pudo guardar (usa Exportar)'; } }
function guardarDebounced(){ var e=document.getElementById('estadoGuardado'); if (e) e.textContent='Guardando…'; clearTimeout(guardadoTimer); guardadoTimer=setTimeout(guardar,500); }
function fusionarEstado(base,obj){
  if (!obj) return base;
  if (obj.fields) for (var k in obj.fields) base.fields[k]=obj.fields[k];
  if (obj.attrs) for (var a in obj.attrs) if (base.attrs[a]!==undefined) base.attrs[a]=obj.attrs[a];
  if (obj.skills) for (var s in obj.skills) if (base.skills[s]) base.skills[s]={g:obj.skills[s].g||0};
  if (obj.custom) for (var c in obj.custom) if (base.custom[c]) base.custom[c]={nombre:obj.custom[c].nombre||'',attr:obj.custom[c].attr||'',g:obj.custom[c].g||0};
  if (obj.metas&&obj.metas.length) for (var i=0;i<NUM_METAS;i++) if (obj.metas[i]) base.metas[i]={txt:obj.metas[i].txt||'',p:obj.metas[i].p||0};
  if (obj.caminos&&obj.caminos.length){ base.caminos=obj.caminos.map(function(x){ if (typeof x==='string') return {id:'',nom:x,c:colorCamino(x)}; return {id:x.id||'',nom:x.nom||'',c:x.c||colorCamino(x.nom||'')}; }).filter(function(x){ return x.nom; }); }
  else if (obj.fields && obj.fields.caminos){ base.caminos=String(obj.fields.caminos).split(/[,;\n]/).map(function(t){ return t.trim(); }).filter(Boolean).map(function(t){ return {id:'',nom:t,c:colorCamino(t)}; }); }
  if (obj.pericias&&obj.pericias.length) base.pericias=obj.pericias.slice();
  else if (obj.fields && obj.fields.pericias) base.pericias=String(obj.fields.pericias).split(/[,;\n]/).map(function(t){ return t.trim(); }).filter(Boolean);
  if (obj.estados) base.estados=obj.estados.slice();
  if (obj.armas) base.armas=obj.armas.slice();
  if (obj.armaduras) base.armaduras=obj.armaduras.slice();
  if (obj.talentos) base.talentos=obj.talentos.slice();
  if (obj.objetos) base.objetos=obj.objetos.map(function(o){ return {n:o.n,q:o.q||1}; });
  if (obj.potencias) base.potencias=obj.potencias.slice();
  if (!base.fields.nivel) base.fields.nivel='1';
  return base;
}
function cargar(){ try{ var raw=localStorage.getItem(STORAGE_KEY); if (raw){ S=fusionarEstado(estadoVacio(),JSON.parse(raw)); return; } }catch(err){} S=estadoVacio(); }

/* ===== Eventos ===== */
function wireEventos(){
  document.querySelectorAll('[data-field]').forEach(function(inp){
    inp.addEventListener('input',function(){ var k=inp.getAttribute('data-field'); S.fields[k]=inp.value;
      if (k.indexOf('bonif')===0 || k==='investMax' || k==='nivel'){ recalc(); if(k==='nivel') construirHabilidades(); } guardarDebounced(); }); });
  document.querySelectorAll('[data-attr]').forEach(function(inp){
    inp.addEventListener('input',function(){ S.attrs[inp.getAttribute('data-attr')]=n(inp.value); recalc(); guardarDebounced(); }); });

  document.body.addEventListener('click',function(ev){
    var t=ev.target;
    
    var dot=t.closest?t.closest('.dot'):null; if(dot&&dot.classList.contains('locked')) return;
    if (dot && dot.parentNode.hasAttribute('data-dots')){
      var info=dot.parentNode.getAttribute('data-dots').split(':'), tipo=info[0], id=info[1], nd=parseInt(dot.getAttribute('data-n'),10);
      if (tipo==='sk'){ S.skills[id].g=(S.skills[id].g===nd)?nd-1:nd; actualizarDots(dot.parentNode,S.skills[id].g); }
      else { S.custom[id].g=(S.custom[id].g===nd)?nd-1:nd; actualizarDots(dot.parentNode,S.custom[id].g); }
      recalc(); guardarDebounced(); return; }
    if (dot && dot.parentNode.hasAttribute('data-dots3')){
      var idx=parseInt(dot.parentNode.getAttribute('data-dots3'),10), nm=parseInt(dot.getAttribute('data-n'),10);
      S.metas[idx].p=(S.metas[idx].p===nm)?nm-1:nm; actualizarDots(dot.parentNode,S.metas[idx].p); guardarDebounced(); return; }
    var oi=t.closest?t.closest('[data-objinc]'):null; if (oi){ objAdjust(oi.getAttribute('data-objinc'),1); return; }
    var od=t.closest?t.closest('[data-objdec]'):null; if (od){ objAdjust(od.getAttribute('data-objdec'),-1); return; }
    var rem=t.closest?t.closest('[data-rem]'):null;
    if (rem){ ev.stopPropagation(); var pr=rem.getAttribute('data-rem').split(':'); quitarSel(pr[0],pr.slice(1).join(':')); return; }
    var tog=t.closest?t.closest('[data-tog]'):null;
    if (tog){ var pt=tog.getAttribute('data-tog').split(':'); toggleSel(pt[0],pt.slice(1).join(':')); return; }
    var inf=t.closest?t.closest('[data-info]'):null;
    if (inf){ var pi=inf.getAttribute('data-info').split(':'); abrirInfo(pi[0],pi.slice(1).join(':')); return; }
  });

  document.body.addEventListener('input',function(ev){ var t=ev.target;
    if (t.hasAttribute && t.hasAttribute('data-customnom')){ S.custom[t.getAttribute('data-customnom')].nombre=t.value; guardarDebounced(); }
    else if (t.hasAttribute && t.hasAttribute('data-customattr')){ S.custom[t.getAttribute('data-customattr')].attr=t.value; recalc(); guardarDebounced(); }
    else if (t.hasAttribute && t.hasAttribute('data-meta')){ S.metas[parseInt(t.getAttribute('data-meta'),10)].txt=t.value; guardarDebounced(); } });

  document.addEventListener('keydown',function(e){ if (e.key==='Escape'){ if (modalAbierto) cerrarModal(); cerrarHbg(); cerrarTablaNivel(); } });
  document.addEventListener('click',function(e){ var btn=document.getElementById('hbgBtn'),menu=document.getElementById('hbgMenu');
    if(menu&&menu.classList.contains('open')&&!menu.contains(e.target)&&e.target!==btn) cerrarHbg(); });
  var addInp=document.getElementById('modalAddInput');
  addInp.addEventListener('keydown',function(e){ if (e.key==='Enter'){ e.preventDefault(); anadirDesdeModal(); } });
}
function actualizarDots(cont,valor){ cont.querySelectorAll('.dot').forEach(function(d){ d.classList.toggle('on',parseInt(d.getAttribute('data-n'),10)<=valor); }); }
function paso(field,delta){ var inp=document.querySelector('[data-field="'+field+'"]'); if (!inp) return; var v=n(inp.value)+delta; inp.value=v; S.fields[field]=String(v); guardarDebounced(); }
function sugerirInvestidura(){ var base=2+Math.max(n(S.attrs.discernimiento),n(S.attrs.presencia)); var inp=document.querySelector('[data-field="investMax"]'); if (inp){ inp.value=base; S.fields.investMax=String(base); recalc(); guardarDebounced(); } }

/* ===== Export / Import / Limpiar ===== */
function exportarJSON(){ var nombre=(S.fields.personaje||'personaje').trim().replace(/[^\wáéíóúñÁÉÍÓÚÑ -]/g,'').replace(/\s+/g,'_')||'personaje';
  var blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url; a.download='hoja_'+nombre+'.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
function importarJSON(ev){ var f=ev.target.files[0]; if (!f) return; var r=new FileReader();
  r.onload=function(e){ try{ S=fusionarEstado(estadoVacio(),JSON.parse(e.target.result)); pintarEstado(); guardar(); }catch(err){ alert('No se pudo leer el archivo: '+err.message); } };
  r.readAsText(f); ev.target.value=''; }
function limpiarTodo(){ if (!confirm('¿Vaciar la hoja y empezar de cero?')) return; S=estadoVacio(); pintarEstado(); guardar(); }

/* ===== Compartir por URL ===== */
function stateToBase64(s){
  try{
    var json=JSON.stringify(s);
    // encodeURIComponent para manejar UTF-8, luego btoa para base64url
    var b64=btoa(unescape(encodeURIComponent(json)));
    return b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  }catch(e){ return null; }
}
function base64ToState(b64){
  try{
    var b64std=b64.replace(/-/g,'+').replace(/_/g,'/');
    var padding=b64std.length%4===0?'':new Array(5-(b64std.length%4)).join('=');
    return JSON.parse(decodeURIComponent(escape(atob(b64std+padding))));
  }catch(e){ return null; }
}
function compartirPorURL(){
  var b64=stateToBase64(S);
  if (!b64){ alert('No se pudo codificar la hoja.'); return; }
  var u=new URL(window.location.href);
  u.searchParams.set('hoja',b64);
  var url=u.toString();
  if (navigator.clipboard){
    navigator.clipboard.writeText(url).then(function(){
      mostrarToast('🔗 URL copiada al portapapeles');
    }).catch(function(){ prompt('Copia este enlace:',url); });
  } else { prompt('Copia este enlace:',url); }
}
function cargarDesdeURL(){
  try{
    var params=new URLSearchParams(window.location.search);
    var b64=params.get('hoja');
    if (!b64) return false;
    var obj=base64ToState(b64);
    if (!obj) return false;
    S=fusionarEstado(estadoVacio(),obj);
    // Limpiar el param de la URL sin recargar
    var u=new URL(window.location.href);
    u.searchParams.delete('hoja');
    history.replaceState(null,'',u.pathname+(u.search?u.search:''));
    return true;
  }catch(e){ return false; }
}
function mostrarToast(msg){
  var t=document.getElementById('sheetToast');
  if (!t){ t=document.createElement('div'); t.id='sheetToast';
    t.style.cssText='position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#3a2a26;color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;font-family:Georgia,serif;box-shadow:0 4px 12px rgba(0,0,0,.3);z-index:300;opacity:0;pointer-events:none;transition:opacity .2s';
    document.body.appendChild(t); }
  t.textContent=msg; t.style.opacity='1';
  clearTimeout(t._t); t._t=setTimeout(function(){ t.style.opacity='0'; },2000);
}

/* ===== Init ===== */
function bootstrapCharacterSheet(){
  // Derivar datos a partir de los crudos cargados por el bootstrap.
  PERICIAS={};
  PERICIAS_CATS.forEach(function(c){ PERICIAS[c.nom]=c.grupos.flatMap(function(g){ return g.items; }); });
  WEAPONS=ITEMS.filter(function(i){ return i.cat==='al'||i.cat==='ap'||i.cat==='ae'; }).map(function(i){
    var dano=itemStat(i,'Daño')||'—'; var partes=dano.split(' ');
    return {n:i.name,cat:CAT_LABELS[i.cat],
      sk:i.cat==='al'?'ligero':i.cat==='ap'?'pesado':i.name==='Ataque sin armas'?'unarmed':'otro',
      die:partes[0]||'—',tipo:partes.slice(1).join(' ')||'golpe',
      alc:itemStat(i,'Alcance')||'—',ras:itemStat(i,'Rasgos')||'—'}; });
  ARMORS=ITEMS.filter(function(i){ return i.cat==='ar'; }).map(function(i){
    return {n:i.name,des:parseInt(itemStat(i,'Desvío')||'0',10),ras:itemStat(i,'Rasgos')||'—'}; });
  OBJETOS={};
  ['fc','fu','co','eq'].forEach(function(c){ OBJETOS[CAT_LABELS[c]]=ITEMS.filter(function(i){ return i.cat===c; }).map(function(i){ return i.name; }); });
  llenarNivel(); llenarTalSelect(); llenarNavSel();
  if (!cargarDesdeURL()) cargar();
  wireEventos(); pintarEstado();
}
window.bootstrapCharacterSheet = bootstrapCharacterSheet;
