// Decorate mode: choose something from the shed and place it on a spot.
import { img } from '../assets/index.js';
import { DECORATIONS } from '../data/decorData.js';
import { count } from '../systems/inventory.js';
import { esc } from './ui.js';
import { emptyState } from './inventoryPanel.js';

export const decoratePanel = {
  id: 'decorate',
  title: 'Decorate',
  icon: 'decor',
  render(game, ui) {
    const s = game.state;
    const owned = DECORATIONS.filter((d) => count(s.decor.owned, d.id));
    const placed = Object.keys(s.decor.placed).length;
    const list = owned.length
      ? `<div class="packet-grid">${owned.map((d) => `<button type="button" class="packet-card ${ui.decorSel === d.id ? 'active' : ''}" data-action="select-decor" data-decor="${d.id}">${img(`decorations/${d.id}`, 'packet')}<span>${esc(d.name)}</span><b>×${count(s.decor.owned, d.id)}</b></button>`).join('')}</div>`
      : emptyState(img('decorations/flower-pot', 'empty-icon'), 'Your shed is empty', 'Buy fences, pots and more in the shop, then come back here to place them.', '<button type="button" class="btn btn-small" data-action="open-panel" data-panel="shop" data-tab="decor">Shop decorations</button>');
    return `<p class="hint strong">${ui.decorSel && count(s.decor.owned, ui.decorSel) ? 'Now click a glowing circle in the garden to place it.' : 'Pick a decoration, then click a glowing circle in the garden.'} Click a placed decoration to put it back in the shed.</p>
      <section><h3>In the shed</h3>${list}</section>
      <p class="hint">${placed} of 8 spots decorated.</p>`;
  },
};
