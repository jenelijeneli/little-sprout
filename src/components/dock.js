// The toolbar along the bottom of the screen.
import { icon } from '../assets/index.js';
import { activeQuestIds, questProgress } from '../systems/quests.js';
import { nextExpansion } from '../systems/expansion.js';
import { count } from '../systems/inventory.js';
import { CROPS_BY_ID } from '../data/cropsData.js';
import { setHTML, esc, packetImg } from './ui.js';

const BUTTONS = [
  { panel: 'basket', label: 'Basket', icon: 'basket' },
  { panel: 'furnish', label: 'Furnish', icon: 'sofa', house: true },
  { panel: 'shop', label: 'Shop', icon: 'shop' },
  { panel: 'quests', label: 'Quests', icon: 'quest' },
  { panel: 'friends', label: 'Friends', icon: 'critter' },
  { panel: 'decorate', label: 'Decorate', icon: 'decor', garden: true },
  { panel: 'expand', label: 'Expand', icon: 'shovel', garden: true },
];

export function createDock(el, game, ui) {
  function badge(panel) {
    const s = game.state;
    if (panel === 'quests') {
      const n = activeQuestIds(s).filter((id) => questProgress(s, id).complete).length;
      return n ? `<span class="badge">${n}</span>` : '';
    }
    if (panel === 'expand') {
      const next = nextExpansion(s);
      return next && s.level >= next.level && s.coins >= next.cost ? '<span class="badge">!</span>' : '';
    }
    return '';
  }

  function render() {
    const s = game.state;
    const seedChip = ui.tool === 'seed' && ui.seed
      ? `<div class="tool-chip">${packetImg(ui.seed, 'icon icon-sm')}<span>Planting <b>${esc(CROPS_BY_ID[ui.seed].plural.toLowerCase())}</b> · ${count(s.seeds, ui.seed) ? `${count(s.seeds, ui.seed)} seeds left` : `${CROPS_BY_ID[ui.seed].seedCost} coins each`} · click empty soil</span><button type="button" class="x" data-action="clear-tool" aria-label="Stop planting">×</button></div>`
      : ui.tool === 'water'
        ? `<div class="tool-chip water">${icon('can', 'icon icon-sm')}<span>Watering can ready · click thirsty plants</span><button type="button" class="x" data-action="clear-tool" aria-label="Put the watering can away">×</button></div>`
        : '';
    const inside = ui.scene === 'house';
    const sceneBtns = inside
      ? `<button type="button" class="dock-btn tool go-out" data-action="exit-house">${icon('door', 'dock-icon')}<span>Go outside</span></button>`
      : `<button type="button" class="dock-btn tool ${ui.tool === 'water' ? 'active' : ''}" data-action="toggle-water" aria-pressed="${ui.tool === 'water'}">${icon('can', 'dock-icon')}<span>Water</span></button>
      <button type="button" class="dock-btn tool" data-action="enter-house">${icon('home', 'dock-icon')}<span>Home</span></button>`;
    const shown = BUTTONS.filter((b) => (inside ? !b.garden : !b.house));
    setHTML(el, `
      ${inside ? '' : seedChip}
      ${sceneBtns}
      <span class="dock-sep"></span>
      ${shown.map((b) => `<button type="button" class="dock-btn ${ui.panel === b.panel ? 'active' : ''}" data-action="toggle-panel" data-panel="${b.panel}" aria-pressed="${ui.panel === b.panel}">${icon(b.icon, 'dock-icon')}<span>${b.label}</span>${badge(b.panel)}</button>`).join('')}`);
  }
  return { render };
}
