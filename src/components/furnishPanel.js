// The furniture shop and the storage chest for the cottage.
import { icon, img } from '../assets/index.js';
import { FURNITURE, FURNITURE_CATEGORIES } from '../data/furnitureData.js';
import { count } from '../systems/inventory.js';
import { esc, coins } from './ui.js';
import { emptyState } from './inventoryPanel.js';
import { placeWords } from './house.js';

const placedCount = (s, id) => s.home.placed.filter((p) => p.id === id).length;

// The illustrated catalogue, one category at a time.
export function furnitureCatalogue(s, ui) {
  const cat = ui.furnCat || 'furniture';
  const chips = FURNITURE_CATEGORIES.map((c) => `<button type="button" class="cat-tab ${c.id === cat ? 'active' : ''}" data-action="furn-cat" data-cat="${c.id}" aria-pressed="${c.id === cat}">${esc(c.label)}</button>`).join('');
  const cards = FURNITURE.filter((f) => f.category === cat).map((f) => {
    const locked = s.level < f.unlockLevel;
    const short = s.coins < f.cost;
    const owned = count(s.home.owned, f.id), placed = placedCount(s, f.id);
    const have = [owned && `${owned} stored`, placed && `${placed} in the cottage`].filter(Boolean).join(' · ');
    return `<li class="card furn-card ${locked ? 'locked' : ''}" data-furn="${f.id}">
      <span class="furn-art">${img(`furniture/${f.id}`, 'card-art')}</span>
      <div class="card-body">
        <strong>${esc(f.name)}</strong>
        <span class="blurb">${esc(f.blurb)}</span>
        <span class="facts"><span class="fact">${esc(placeWords(f))}</span>${have ? `<span class="fact own">${have}</span>` : ''}</span>
      </div>
      <div class="card-buy">${locked
        ? `<span class="lock">${icon('lock', 'icon icon-sm')}Level ${f.unlockLevel}</span>`
        : `<button type="button" class="btn btn-small" data-action="buy-furniture" data-furn="${f.id}" ${short ? 'disabled' : ''}>Buy · ${coins(f.cost, short ? 'short' : '')}</button>
           ${short ? `<span class="need-more">Need ${f.cost - s.coins} more</span>` : ''}`}
      </div></li>`;
  }).join('');
  return `<div class="cat-tabs" role="group" aria-label="Furniture types">${chips}</div><ul class="cards">${cards}</ul>`;
}

function storedList(s) {
  const owned = FURNITURE.filter((f) => count(s.home.owned, f.id));
  if (!owned.length) {
    return emptyState(img('furniture/potted-flowers', 'empty-icon'), 'Your storage chest is empty', 'Things you buy or put away wait here until you place them.', '<button type="button" class="btn btn-small" data-action="furnish-tab" data-tab="shop">Browse the shop</button>');
  }
  return `<div class="packet-grid">${owned.map((f) => `<button type="button" class="packet-card" data-action="furn-place" data-furn="${f.id}">${img(`furniture/${f.id}`, 'packet')}<span>${esc(f.name)}</span><b>×${count(s.home.owned, f.id)}</b></button>`).join('')}</div>
    <p class="hint">Click an item to place it in the cottage.</p>`;
}

export const furnishPanel = {
  id: 'furnish',
  title: 'Furniture Shop',
  icon: 'sofa',
  render(game, ui) {
    const s = game.state;
    const tab = ui.furnishTab || 'shop';
    const stored = Object.values(s.home.owned).reduce((a, b) => a + b, 0);
    const tabs = [{ id: 'shop', label: 'Shop' }, { id: 'stored', label: `Stored${stored ? ` (${stored})` : ''}` }];
    return `<div class="tabs" role="tablist">${tabs.map((t) => `<button type="button" role="tab" class="tab ${t.id === tab ? 'active' : ''}" aria-selected="${t.id === tab}" data-action="furnish-tab" data-tab="${t.id}">${t.label}</button>`).join('')}</div>
      ${tab === 'shop' ? furnitureCatalogue(s, ui) : storedList(s)}
      <p class="hint">${ui.scene === 'house' ? 'Click furniture in the room to move, flip or store it.' : 'Furniture goes inside the cottage. Click the cottage door to go in.'}</p>`;
  },
};
