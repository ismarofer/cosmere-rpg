/* Iconos SVG en línea (trazo, 24x24) y glifos de coste de acción. Sin dependencias. */
(function () {
  const P = {
    // interfaz
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    columns: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    tree: '<line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    // categorías
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6M9 16h6"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.48 12.89 17 22l-5-3-5 3 1.52-9.11"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    sword: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/>',
    swords: '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    coins: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.7 2.5 1.7c0 2.3-5 1.3-5 3.6 0 1 1 1.7 2.5 1.7s2.5-.5 2.5-1.5"/>',
    tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    gift: '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    alert: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    skull: '<circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    crown: '<path d="M2 18h20"/><path d="M3 7l5 5 4-7 4 7 5-5-2 11H5z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    bulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
    hammer: '<path d="m15 12-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/>',
    slash: '<path d="M4 20 20 4"/><path d="M9 21 21 9"/><path d="M3 15 15 3"/>',
    infinity: '<path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
    pip: '<path d="M12 3l9 9-9 9-9-9z" fill="currentColor"/>',
    pipo: '<path d="M12 3l9 9-9 9-9-9z"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    expand: '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>',
    modif: '<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>',
    dot: '<circle cx="12" cy="12" r="3"/>',
    // ambientaciones (versión simplificada de los logotipos oficiales)
    cosmere: '<path stroke-width="1.7" d="M12 1.8 20.8 6.9v10.2L12 22.2 3.2 17.1V6.9z"/><circle cx="12" cy="12" r="2.6" stroke-width="0.9"/><g fill="currentColor" stroke="none"><path d="M12 7.3Q12.2 8.9 13 9.6H11Q11.8 8.9 12 7.3Z"/><path d="M7.4 8.6A4 4 0 0 0 7.4 15.4A8.6 8.6 0 0 1 7.4 8.6Z"/><path transform="rotate(90 12 12)" d="M12 7.3Q12.2 8.9 13 9.6H11Q11.8 8.9 12 7.3Z"/><path transform="rotate(90 12 12)" d="M7.4 8.6A4 4 0 0 0 7.4 15.4A8.6 8.6 0 0 1 7.4 8.6Z"/><path transform="rotate(180 12 12)" d="M12 7.3Q12.2 8.9 13 9.6H11Q11.8 8.9 12 7.3Z"/><path transform="rotate(180 12 12)" d="M7.4 8.6A4 4 0 0 0 7.4 15.4A8.6 8.6 0 0 1 7.4 8.6Z"/><path transform="rotate(270 12 12)" d="M12 7.3Q12.2 8.9 13 9.6H11Q11.8 8.9 12 7.3Z"/><path transform="rotate(270 12 12)" d="M7.4 8.6A4 4 0 0 0 7.4 15.4A8.6 8.6 0 0 1 7.4 8.6Z"/><circle cx="12" cy="12" r="0.9"/></g>',
    stormlight: '<g transform="translate(12 12) scale(0.24)" fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle r="29" fill="none" stroke-width="3.4"/><path fill="none" stroke-width="3.8" d="M-26 0Q-6 -4 0 -15 M26 0Q6 -4 0 -15 M-26 0Q-6 4 0 15 M26 0Q6 4 0 15"/><path fill="none" stroke-width="2.6" d="M-10 0Q-3 -3 0 -10Q3 -3 10 0Q3 3 0 10Q-3 3 -10 0Z"/><path stroke="none" d="M-26 0L-10 -1.8V1.8Z M26 0L10 -1.8V1.8Z"/><g stroke="none"><path d="M-18 -17.5L-9.5 -12.7Q-8 -10 -9.7 -9Q-12.5 -10.5 -18 -17.5Z"/><path transform="rotate(90)" d="M-18 -17.5L-9.5 -12.7Q-8 -10 -9.7 -9Q-12.5 -10.5 -18 -17.5Z"/><path transform="rotate(180)" d="M-18 -17.5L-9.5 -12.7Q-8 -10 -9.7 -9Q-12.5 -10.5 -18 -17.5Z"/><path transform="rotate(270)" d="M-18 -17.5L-9.5 -12.7Q-8 -10 -9.7 -9Q-12.5 -10.5 -18 -17.5Z"/></g><path fill="none" stroke-width="2.6" d="M-8.5 -19Q0 -22.5 8.5 -19"/><path stroke="none" d="M-0.95 -45H0.95V-19L2.09 -14V-10H-2.09V-14L-0.95 -19Z"/><path stroke="none" d="M-2.09 10H2.09V40L0 46L-2.09 40Z"/></g>',
    mistborn: '<g transform="translate(-0.4 1.6) scale(0.0272)" fill="currentColor" stroke="currentColor" stroke-width="14"><circle cx="455" cy="92" r="45"/><path d="M245 92C130 120 55 220 62 320C68 410 110 480 165 522L190 455C150 410 120 330 135 260C158 200 200 135 245 92Z"/><path transform="translate(910 0) scale(-1 1)" d="M245 92C130 120 55 220 62 320C68 410 110 480 165 522L190 455C150 410 120 330 135 260C158 200 200 135 245 92Z"/><path d="M345 98C250 160 205 240 208 320C212 450 330 548 455 548C580 548 698 450 702 320C705 240 660 160 565 98C620 180 650 250 645 320C635 420 560 478 455 478C350 478 275 420 265 320C260 250 290 180 345 98Z"/><path transform="translate(455 205)" d="M0 0L16 332L14 437.6Q22 482.9 43 503H-43Q-22 482.9 -14 437.6L-16 332Z"/><path transform="translate(415 285) rotate(20.1)" d="M0 0L11.5 249.5L10.1 328.9Q15.8 362.9 31 378H-31Q-15.8 362.9 -10.1 328.9L-11.5 249.5Z"/><path transform="translate(495 285) rotate(-20.1)" d="M0 0L11.5 249.5L10.1 328.9Q15.8 362.9 31 378H-31Q-15.8 362.9 -10.1 328.9L-11.5 249.5Z"/></g>',
  };

  function ic(name, cls) {
    const p = P[name] || P.dot;
    return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
  }

  // Glifo de coste/activación: rombos llenos (1-3 acciones), vacío (gratuita), flecha (reacción), infinito, destello.
  function act(v) {
    const s = String(v == null ? '' : v).trim();
    const pip = (n, open) => '<span class="act">' + new Array(n).fill(ic(open ? 'pipo' : 'pip', 'sm')).join('') + '</span>';
    switch (s) {
      case '1': case '1 acción': return pip(1);
      case '2': case '2 acciones': return pip(2);
      case '3': case '3 acciones': return pip(3);
      case '1*': return pip(1) + '<span class="act">*</span>';
      case '0': case 'Acción gratuita': return pip(1, true);
      case 'r': case 'Reacción': return '<span class="act">' + ic('rotate', 'sm') + '</span>';
      case 'Siempre activo': return '<span class="act">' + ic('infinity', 'sm') + '</span>';
      case 'Especial': case '*': return '<span class="act">' + ic('sparkle', 'sm') + '</span>';
      default: return '';
    }
  }

  window.UI = { ic, act, names: Object.keys(P) };
})();
