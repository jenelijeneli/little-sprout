// The village shop: buy seeds and decorations, sell produce, fill orders.
import { icon, img } from '../assets/index.js';
import { CROPS, CROP_CATEGORIES } from '../data/cropsData.js';
import { DECORATIONS } from '../data/decorData.js';
import { CONFIG } from '../data/config.js';
import { canFulfil } from '../systems/economy.js';
import { count } from '../systems/inventory.js';
import { esc, coins, formatTime, packetImg, produceImg } from './ui.js';
import { produceList } from './inventoryPanel.js';
import { furnitureCatalogue } from './furnishPanel.js';

const TABS = [
  { id: 'seeds', label: 'Seeds' },
  { id: 'sell', label: 'Sell' },
  { id: 'orders', label: 'Orders' },
  { id: 'decor', label: 'Decor' },
  { id: 'furniture', label: 'Furniture' },
];

function seedsTab(s, ui) {
  const cat = ui.seedCat || 'vegetable';
  const chips = CROP_CATEGORIES.map((c) => {
    const n = CROPS.filter((x) => x.category === c.id).length;
    return `<button type="button" class="cat-tab ${c.id === cat ? 'active' : ''}" data-action="seed-cat" data-cat="${c.id}" aria-pressed="${c.id === cat}">${esc(c.label)} <small>${n}</small></button>`;
  }).join('');
  return `<div class="cat-tabs" role="group" aria-label="Seed types">${chips}</div><ul class="cards">${CROPS.filter((c) => c.category === cat).map((c) => {
    const locked = s.level < c.unlockLevel;
    const t = formatTime(c.growSeconds * 1000 * CONFIG.GROWTH_TIME_SCALE);
    return `<li class="card ${locked ? 'locked' : ''}">
      ${packetImg(c.id, 'card-art')}
      <div class="card-body">
        <strong>${esc(c.name)} ${count(s.seeds, c.id) ? `<span class="qty">own ${count(s.seeds, c.id)}</span>` : ''}</strong>
        <span class="blurb">${esc(c.blurb)}</span>
        <span class="facts"><span class="fact">${icon('clock', 'icon icon-xs')}${t}</span><span class="fact">gives ${c.yield}</span><span class="fact">sells ${coins(c.sellPrice)}</span><span class="fact">${c.xp} XP</span></span>
      </div>
      <div class="card-buy">${locked
        ? `<span class="lock">${icon('lock', 'icon icon-sm')}Level ${c.unlockLevel}</span>`
        : `<button type="button" class="btn btn-small ${s.coins < c.seedCost ? 'cant-afford' : ''}" data-action="buy-seeds" data-crop="${c.id}" data-qty="1">Buy 1 · ${coins(c.seedCost)}</button>
           <button type="button" class="btn btn-small ${s.coins < c.seedCost * 5 ? 'cant-afford' : ''}" data-action="buy-seeds" data-crop="${c.id}" data-qty="5">Buy 5 · ${coins(c.seedCost * 5)}</button>`}
      </div></li>`;
  }).join('')}</ul>`;
}

function ordersTab(s) {
  return `<p class="hint">Neighbours pay extra for these! Orders refresh when you deliver one.</p>
    <ul class="cards">${s.orders.map((o) => {
    const ready = canFulfil(s, o);
    return `<li class="card order ${ready ? 'ready' : ''}">
      <div class="card-body">
        <strong>${esc(o.from)}</strong>
        <span class="needs">${Object.entries(o.items).map(([id, q]) => `<span class="need ${count(s.produce, id) >= q ? 'have' : ''}">${produceImg(id, 'icon icon-sm')}${Math.min(count(s.produce, id), q)}/${q}</span>`).join('')}</span>
        <span class="facts">Reward ${coins(o.coins)} · ${icon('xp', 'icon icon-xs')}${o.xp} XP</span>
      </div>
      <div class="card-buy"><button type="button" class="btn btn-small ${ready ? 'btn-gold' : 'cant-afford'}" data-action="fulfil-order" data-order="${o.id}">Deliver</button></div>
    </li>`;
  }).join('')}</ul>`;
}

function decorTab(s) {
  return `<ul class="cards">${DECORATIONS.map((d) => {
    const locked = s.level < d.unlockLevel;
    const placed = Object.values(s.decor.placed).filter((x) => x === d.id).length;
    const owned = count(s.decor.owned, d.id);
    return `<li class="card ${locked ? 'locked' : ''}">
      ${img(`decorations/${d.id}`, 'card-art')}
      <div class="card-body"><strong>${esc(d.name)}</strong><span class="blurb">${esc(d.blurb)}</span>
        ${owned || placed ? `<span class="facts">${owned ? `${owned} in the shed` : ''}${owned && placed ? ' · ' : ''}${placed ? `${placed} in the garden` : ''}</span>` : ''}</div>
      <div class="card-buy">${locked
        ? `<span class="lock">${icon('lock', 'icon icon-sm')}Level ${d.unlockLevel}</span>`
        : `<button type="button" class="btn btn-small ${s.coins < d.cost ? 'cant-afford' : ''}" data-action="buy-decor" data-decor="${d.id}">Buy · ${coins(d.cost)}</button>`}
      </div></li>`;
  }).join('')}</ul>
  <p class="hint">Bought decorations go to your shed. Open <button type="button" class="link" data-action="open-panel" data-panel="decorate">Decorate</button> to place them.</p>`;
}

export const shopPanel = {
  id: 'shop',
  title: 'Village Shop',
  icon: 'shop',
  render(game, ui) {
    const s = game.state;
    const tab = ui.shopTab || 'seeds';
    const body = { seeds: seedsTab, sell: (st) => produceList(st), orders: ordersTab, decor: decorTab, furniture: furnitureCatalogue }[tab](s, ui);
    return `<div class="tabs" role="tablist">${TABS.map((t) => `<button type="button" role="tab" class="tab ${t.id === tab ? 'active' : ''}" aria-selected="${t.id === tab}" data-action="shop-tab" data-tab="${t.id}">${t.label}${t.id === 'orders' && s.orders.some((o) => canFulfil(s, o)) ? '<span class="dot"></span>' : ''}</button>`).join('')}</div>${body}`;
  },
};
