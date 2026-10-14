/* Proyector de la mesa, integrado en el buscador (#/proyector). Se monta una sola vez y se oculta al navegar a otra sección,
   así la proyección y la música no se interrumpen. La ventana de salida (salida.html) sigue siendo independiente. */
(function () {
  'use strict';
  let montado = false;
  const MARCADO = `<header class="pybar">
  <strong>Proyector de la mesa</strong>
  <button id="bAbrir">Abrir proyección</button>
  <button id="bNegro" title="B">Negro</button>
  <button id="bPausa" title="P">Pausa efectos</button>
  <button id="bCong" title="F">Congelar</button>
  <button id="bCalib">Calibrar mesa</button>
  <span id="estado" class="mut">sin proyección</span>
  <span class="sp"></span>
  <button id="bExp">Exportar .zip</button>
  <button id="bImp">Importar .zip</button>
  <input type="file" id="fImp" accept=".zip" hidden>
</header>
<div class="pymain">
  <section id="lista" aria-label="Biblioteca">
    <div id="drop">Suelta aquí imágenes o audio<br><small>o haz clic para elegirlas</small></div>
    <input type="file" id="fImg" accept="image/*" multiple hidden>
    <ul id="escenas"></ul>
  </section>
  <section id="centro"><canvas id="prev"></canvas></section>
  <section id="panel" aria-label="Controles">
    <fieldset><legend>Escena</legend>
      <input id="nombre" placeholder="Nombre">
      <label>Tipo <select id="tipo"><option value="mapa">Mapa (con niebla)</option><option value="imagen">Imagen</option></select></label>
      <label>Transición <select id="trans"><option value="corte">Corte</option><option value="fundido">Fundido por negro</option></select></label>
      <div class="fila"><button id="bProy" class="prim">Proyectar</button><button id="bBorrar">Borrar</button></div>
      <div id="infoProy" class="mut"></div>
    </fieldset>
    <fieldset><legend>Herramienta (clic izq.)</legend>
      <div class="herr" id="herr">
        <label><input type="radio" name="h" value="rev" checked>Revelar</label>
        <label><input type="radio" name="h" value="ocu">Ocultar</label>
        <label><input type="radio" name="h" value="crece">Crecer</label>
        <label><input type="radio" name="h" value="luz">Luz</label>
        <label><input type="radio" name="h" value="vista">Mover vista</label>
      </div>
      <label>Radio <input type="range" id="rad" min="5" max="150" value="40"></label>
      <label>Dureza <input type="range" id="dur" min="0" max="100" value="5"></label>
      <label>Intensidad <input type="range" id="int" min="5" max="100" value="100"></label>
      <div class="mut">Rueda: zoom de la proyección · clic der./central: mover la vista</div>
    </fieldset>
    <fieldset><legend>Niebla</legend>
      <label><input type="checkbox" id="nieb"> Niebla activa</label>
      <div class="fila"><button id="bUndo">Deshacer</button><button id="bRedo">Rehacer</button></div>
      <div class="fila"><button id="bRevT">Revelar todo</button><button id="bOcuT">Ocultar todo</button></div>
    </fieldset>
    <fieldset><legend>Efectos</legend>
      <label>Oscuridad <input type="range" id="osc" min="0" max="95" value="0"></label>
      <label>Bruma <input type="range" id="bru" min="0" max="100" value="0"></label>
      <label>Lluvia <input type="range" id="llu" min="0" max="100" value="0"></label>
      <label>Ceniza <input type="range" id="cen" min="0" max="100" value="0"></label>
      <label>Relámpagos <input type="range" id="rel" min="0" max="100" value="0"></label>
      <label>Viento (ángulo) <input type="range" id="vie" min="-45" max="45" value="0"></label>
      <label>Color luz<input type="color" id="colLuz" value="#ffb347"></label>
      <label>Tamaño luz <input type="range" id="tamLuz" min="3" max="40" value="12"></label>
      <label><input type="checkbox" id="parLuz" checked> Parpadeo (fuego)</label>
      <ul id="luces"></ul>
    </fieldset>
    <fieldset><legend>Música</legend>
      <div id="mActual" class="mut">Nada sonando</div>
      <progress id="mBar" value="0" max="1"></progress>
      <div class="fila"><button id="mPrev" title="Anterior">⏮</button><button id="mPlay" title="Reproducir / pausa">⏯</button><button id="mNext" title="Siguiente">⏭</button><button id="mStop" title="Parar con fundido">⏹</button></div>
      <label>Volumen <input type="range" id="mVol" min="0" max="100" value="80"></label>
      <label>Fundido (s) <input type="number" id="mFade" min="0.5" max="15" step="0.5" value="3"></label>
      <label>Velocidad pista (%) <input type="range" id="mVel" min="50" max="150" step="1" value="100"> <output id="mVelN">100</output></label>
      <div class="mut">Pistas de esta escena (marca las que suenan):</div>
      <ul id="pistas"></ul>
      <label><input type="checkbox" id="mAleat"> Orden aleatorio</label>
      <div class="fila"><button id="mEsc">▶ Lista de la escena</button><button id="mAdd">+ Añadir pistas</button></div>
      <input type="file" id="fAud" accept="audio/*" multiple hidden>
    </fieldset>
    <fieldset><legend>Vista y escala</legend>
      <label>Zoom <input type="range" id="zoom" min="-300" max="300" value="0"></label>
      <div class="fila"><button id="bRotI">⟲ 90°</button><button id="bRotD">⟳ 90°</button><button id="bAjustar">Ajustar</button></div>
      <label>px de mapa por casilla <input type="number" id="pxCas" min="4" value="70"></label>
      <label>cm por casilla (mesa) <input type="number" id="cmCas" min="0.5" step="0.1" value="2.5"></label>
      <div class="fila"><button id="bReal">Escala real</button><label><input type="checkbox" id="grid"> Cuadrícula</label></div>
      <label>px de pantalla por cm <input type="number" id="pxCm" min="5" step="0.5" value="38"></label>
    </fieldset>
  </section>
</div>`;
  const SCRIPTS = ['niebla', 'render', 'almacen', 'musica', 'consola'];
  function cargar(i) {
    if (i >= SCRIPTS.length) return;
    const s = document.createElement('script');
    s.src = 'proyector/js/' + SCRIPTS[i] + '.js';
    s.onload = () => cargar(i + 1);
    s.onerror = () => { const e = document.querySelector('#pyr .mut'); if (e) e.textContent = 'No se pudo cargar ' + SCRIPTS[i] + '.js'; };
    document.head.appendChild(s);
  }
  window.Proyector = {
    montar(el) {
      if (montado) return;
      montado = true;
      el.innerHTML = MARCADO;
      cargar(0);
    },
  };
})();
