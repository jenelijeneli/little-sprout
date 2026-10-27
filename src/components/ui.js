// Small shared helpers for building the interface.
import { icon, img } from '../assets/index.js';
import { CROPS_BY_ID } from '../data/cropsData.js';

export function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// Only touches the page when the HTML really changed. This keeps buttons
// from being rebuilt (and clicks from being lost) on every tick.
export function setHTML(el, html) {
  if (el._html === html) return false;
  el.innerHTML = html;
  el._html = html;
  return true;
}

export function formatTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

export const fmt = (n) => Math.floor(n).toLocaleString('en-US');

export const coins = (n, cls = '') => `<span class="price ${cls}">${icon('coin', 'icon icon-xs')}${fmt(n)}</span>`;

export function cropName(id, n = 1) {
  const c = CROPS_BY_ID[id];
  return n === 1 ? c.name : c.plural;
}

export const produceImg = (id, cls = 'icon') => img(`produce/${id}`, cls, CROPS_BY_ID[id]?.name || '');
export const packetImg = (id, cls = 'icon') => img(`seeds/${id}`, cls, `${CROPS_BY_ID[id]?.name} seeds`);

export function rewardChips(reward) {
  const chips = [];
  if (reward.coins) chips.push(`<span class="chip">${icon('coin', 'icon icon-xs')}${reward.coins}</span>`);
  if (reward.xp) chips.push(`<span class="chip">${icon('xp', 'icon icon-xs')}${reward.xp} XP</span>`);
  if (reward.seeds) for (const [id, n] of Object.entries(reward.seeds)) chips.push(`<span class="chip">${packetImg(id, 'icon icon-xs')}${n} ${cropName(id, 1).toLowerCase()} seeds</span>`);
  return chips.join('');
}

export function meter(fraction, cls = '') {
  return `<span class="meter ${cls}"><i style="width:${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%"></i></span>`;
}

export function prefersReducedMotion() {
  return document.documentElement.classList.contains('reduce-motion') ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
