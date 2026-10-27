// Garden expansion: clear an overgrown bed to get four more plots.
import { icon, img } from '../assets/index.js';
import { BEDS } from '../data/gardenLayout.js';
import { nextExpansion } from '../systems/expansion.js';
import { esc, coins } from './ui.js';

export const expandPanel = {
  id: 'expand',
  title: 'Grow Your Garden',
  icon: 'shovel',
  render(game) {
    const s = game.state;
    const next = nextExpansion(s);
    const plots = Object.keys(s.plots).length;
    if (!next) return `<div class="empty">${icon('sparkle', 'empty-icon')}<strong>Your garden is fully grown!</strong><p>All ${plots} plots are yours to plant.</p></div>`;
    const bed = BEDS.find((b) => b.id === next.bed);
    const levelOk = s.level >= next.level, coinsOk = s.coins >= next.cost;
    return `<div class="expand-card">
      ${img('garden/plot-locked', 'expand-art')}
      <strong>${esc(bed.name)}</strong>
      <p>Clear this overgrown corner to get <b>4 new plots</b>. You have ${plots} plots now.</p>
      <ul class="reqs">
        <li class="${levelOk ? 'ok' : ''}">${icon(levelOk ? 'check' : 'lock', 'icon icon-sm')}Reach level ${next.level}${levelOk ? '' : ` (you are level ${s.level})`}</li>
        <li class="${coinsOk ? 'ok' : ''}">${icon(coinsOk ? 'check' : 'coin', 'icon icon-sm')}Pay ${coins(next.cost)}</li>
      </ul>
      <button type="button" class="btn btn-gold ${levelOk && coinsOk ? '' : 'cant-afford'}" data-action="expand">${icon('shovel', 'icon icon-sm')}Clear the land</button>
    </div>`;
  },
};
