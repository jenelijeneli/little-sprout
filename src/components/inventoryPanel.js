// The basket: seeds, harvested produce and decorations you own.
import { icon, img } from '../assets/index.js';
import { CROPS } from '../data/cropsData.js';
import { DECORATIONS } from '../data/decorData.js';
import { total } from '../systems/inventory.js';
import { esc, coins, packetImg, produceImg } from './ui.js';

export function emptyState(art, title, text, button = '') {
  return `<div class="empty">${art}<strong>${esc(title)}</strong><p>${esc(text)}</p>${button}</div>`;
}

// Shared with the shop's "Sell" tab.
export function produceList(state) {
  const items = CROPS.filter((c) => state.produce[c.id]);
  if (!items.length) {
    return emptyState(icon('basket', 'empty-icon'), 'Your basket is empty', 'Harvest ripe crops (look for the little basket bubble) and they will appear here, ready to sell or share.');
  }
  return `<ul class="rows">${items.map((c) => {
    const n = state.produce[c.id];
    return `<li class="row">
      ${produceImg(c.id, 'row-icon')}
      <div class="row-text"><strong>${esc(c.plural)} <span class="qty">×${n}</span></strong><span>${coins(c.sellPrice)} each</span></div>
      <div class="row-actions">
        <button type="button" class="btn btn-small" data-action="sell" data-crop="${c.id}" data-qty="1">Sell 1</button>
        <button type="button" class="btn btn-small btn-gold" data-action="sell" data-crop="${c.id}" data-qty="${n}">Sell all · ${coins(c.sellPrice * n)}</button>
      </div>
    </li>`;
  }).join('')}</ul>`;
}

export const basketPanel = {
  id: 'basket',
  title: 'Basket',
  icon: 'basket',
  render(game, ui) {
    const s = game.state;
    const seeds = CROPS.filter((c) => s.seeds[c.id]);
    const seedHTML = seeds.length
      ? `<div class="packet-grid">${seeds.map((c) => `<button type="button" class="packet-card ${ui.tool === 'seed' && ui.seed === c.id ? 'active' : ''}" data-action="select-seed" data-crop="${c.id}" title="Plant ${esc(c.plural.toLowerCase())}">${packetImg(c.id, 'packet')}<span>${esc(c.name)}</span><b>×${s.seeds[c.id]}</b></button>`).join('')}</div><p class="hint">Pick a packet, then click empty soil to plant.</p>`
      : emptyState(img('seeds/carrot', 'empty-icon'), 'No seeds in your basket', 'You can still plant: click empty soil and pay for a seed with coins, or stock up in the shop.', '<button type="button" class="btn btn-small" data-action="open-panel" data-panel="shop" data-tab="seeds">Visit the shop</button>');
    const decor = DECORATIONS.filter((d) => s.decor.owned[d.id]);
    return `
      <section><h3>Seeds <span class="count">${total(s.seeds)}</span></h3>${seedHTML}</section>
      <section><h3>Harvest <span class="count">${total(s.produce)}</span></h3>${produceList(s)}</section>
      ${decor.length ? `<section><h3>In the shed</h3><div class="packet-grid">${decor.map((d) => `<button type="button" class="packet-card" data-action="open-panel" data-panel="decorate" data-decor="${d.id}">${img(`decorations/${d.id}`, 'packet')}<span>${esc(d.name)}</span><b>×${s.decor.owned[d.id]}</b></button>`).join('')}</div></section>` : ''}`;
  },
};
