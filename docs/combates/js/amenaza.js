/* Cálculo de amenaza (Manual, cap. 13: «Configuración de las escenas de combate»). Motor puro, sin DOM. */
(function (g) {
  'use strict';
  const CB = g.CB = g.CB || {};

  const BASE = { Secuaz: 0.5, Rival: 1, Jefe: 4 };
  // Mismo rango = BASE. ×2 por rango que el adversario supera al grupo; ×½ por rango que el grupo lo supera, redondeando al cuarto más cercano
  // (con el empate 0,125 → 0, como en la tabla del libro).
  const aCuarto = x => Math.floor(x * 4 + 0.5 - 1e-9) / 4;

  function amenazaAdversario(rol, rangoAdversario, rangoGrupo) {
    const base = BASE[rol];
    if (base == null) return 0;
    const dif = rangoAdversario - rangoGrupo;
    return dif >= 0 ? base * Math.pow(2, dif) : aCuarto(base * Math.pow(2, dif));
  }

  // Rango de juego según el nivel (cap. 1): 1-5 → 1, 6-10 → 2, 11-15 → 3, 16-20 → 4, 21+ → 5. El nivel medio se redondea.
  const rangoDeNivel = nivel => Math.max(1, Math.min(5, Math.ceil(Math.round(nivel || 1) / 5)));

  // Amenaza total objetivo de cada dificultad. `ajuste`: 0 normal, +0.25 grupo muy optimizado para combate, −0.25 más social.
  function objetivos(numPJs, ajuste) {
    const k = 1 + (ajuste || 0);
    return { facil: numPJs * 0.5 * k, promedio: numPJs * k, dificil: numPJs * 1.5 * k };
  }

  // Etiqueta según la franja más cercana a cada objetivo.
  function dificultad(total, numPJs, ajuste) {
    const o = objetivos(numPJs, ajuste);
    if (!numPJs) return { clave: 'sinpj', etiqueta: 'Sin grupo' };
    if (total <= 0) return { clave: 'nada', etiqueta: 'Sin adversarios' };
    if (total < o.facil * 0.5) return { clave: 'trivial', etiqueta: 'Trivial' };
    if (total < (o.facil + o.promedio) / 2) return { clave: 'facil', etiqueta: 'Fácil' };
    if (total < (o.promedio + o.dificil) / 2) return { clave: 'promedio', etiqueta: 'Promedio' };
    if (total < o.dificil * 1.25) return { clave: 'dificil', etiqueta: 'Difícil' };
    return { clave: 'extremo', etiqueta: 'Por encima de difícil' };
  }

  CB.aCuarto = aCuarto;
  CB.amenazaAdversario = amenazaAdversario;
  CB.rangoDeNivel = rangoDeNivel;
  CB.objetivos = objetivos;
  CB.dificultad = dificultad;
  CB.AMENAZA_BASE = BASE;
})(typeof window !== 'undefined' ? window : globalThis);
