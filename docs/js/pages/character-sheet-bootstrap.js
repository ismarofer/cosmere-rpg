// docs/js/pages/character-sheet-bootstrap.js
// Carga todos los datos compartidos y rellena los globales que espera
// character-sheet.js antes de llamar a window.bootstrapCharacterSheet().
import { loadData } from '../data-loader.js';

const data = await loadData([
  'talents', 'items', 'skills', 'pericias', 'paths', 'powers'
]);

// Volcar a los placeholders globales que declara character-sheet.js.
window.CARDS = data.talents;
window.ITEMS = data.items;
window.ATTRS = data.skills.attrs;
window.ATTR_ABBR = data.skills.attrAbbr;
window.SKILLS = data.skills.categories;
window.PERICIAS_CATS = data.pericias;
window.CAMINOS = data.paths.categories;
window.PATH_ORDER = data.paths.order;
window.PATH_LABEL = data.paths.names;
window.RAD_IDS = data.paths.radiantIds;
window.POWERS = data.powers.powers;
window.POWER_ACTIONS = data.powers.actions;
window.POWER_NAMES = data.powers.names;
window.POW_COLOR = data.powers.colors.main;
window.POW_TINT = data.powers.colors.tint;
window.POW_DARK = data.powers.colors.dark;

if (typeof window.bootstrapCharacterSheet !== 'function') {
  throw new Error('character-sheet.js no se cargó antes que el bootstrap');
}
window.bootstrapCharacterSheet();
