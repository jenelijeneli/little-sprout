// Inside the cottage: the room picture, the furniture you have placed, and
// placement mode (a see-through "ghost" of the item that follows the pointer).
import { ROOM, EXIT_DOOR } from '../data/houseLayout.js';
import { FURNITURE_BY_ID } from '../data/furnitureData.js';
import { findSpot, pictureBox, childrenOf } from '../systems/home.js';
import { url, raw, icon } from '../assets/index.js';
import { esc, setHTML } from './ui.js';

const W = ROOM.width, H = ROOM.height;
const pct = (v, total) => `${(v / total) * 100}%`;
const place = (el, b) => Object.assign(el.style, { left: pct(b.left, W), top: pct(b.top, H), width: pct(b.width, W), height: pct(b.height, H) });

const PLACE_WORDS = { floor: 'Stands on the floor', rug: 'Lies on the floor', wall: 'Hangs on the wall', ceiling: 'Hangs from the ceiling', surface: 'Sits on a table' };
export const placeWords = (item) => item.place.map((k) => PLACE_WORDS[k]).join(' or ');

// Drawing order: rugs on the floor, things on the wall, then furniture from
// the back of the room to the front, with table-top items just above their table.
function layer(state, p) {
  if (p.kind === 'rug') return 10;
  if (p.kind === 'wall') return 20;
  if (p.kind === 'ceiling') return 30;
  if (p.kind === 'surface') {
    const parent = state.home.placed.find((q) => q.uid === p.on);
    return (parent ? layer(state, parent) : 500) + 1;
  }
  return 100 + Math.round(p.y);
}

export function createHouse({ stage, game, ui, actions }) {
  const state = game.state;
  stage.innerHTML = `
    <div class="room-bg">${raw('house/interior')}</div>
    <div class="room-items"></div>
    <div class="furn-ghost" hidden><img alt="" draggable="false" /><span class="ghost-note"></span></div>
    <button type="button" class="exit-door" data-action="exit-house" aria-label="Go outside to the garden">
      <span class="exit-sign">${icon('door', 'icon icon-sm')}Go outside</span>
    </button>
    <div class="place-bar" hidden></div>
    <div class="popover" role="dialog" hidden></div>`;
  const itemsEl = stage.querySelector('.room-items');
  const ghost = stage.querySelector('.furn-ghost');
  const ghostImg = ghost.querySelector('img');
  const ghostNote = ghost.querySelector('.ghost-note');
  const bar = stage.querySelector('.place-bar');
  const popover = stage.querySelector('.popover');
  place(stage.querySelector('.exit-door'), { left: EXIT_DOOR.x - EXIT_DOOR.w / 2, top: EXIT_DOOR.y - EXIT_DOOR.h / 2, width: EXIT_DOOR.w, height: EXIT_DOOR.h });

  const els = new Map(); // uid -> element
  let spot = null; // where the ghost would go right now

  function renderItems() {
    const placing = ui.place;
    const hidden = new Set();
    if (placing?.uid) {
      hidden.add(placing.uid);
      for (const k of childrenOf(state, placing.uid)) hidden.add(k.uid);
    }
    const seen = new Set();
    for (const p of state.home.placed) {
      seen.add(p.uid);
      const item = FURNITURE_BY_ID[p.id];
      let el = els.get(p.uid);
      if (!el) {
        el = document.createElement('button');
        el.type = 'button';
        el.className = `furn furn-${p.id}`;
        el.dataset.uid = p.uid;
        el.innerHTML = `<img src="${url(`furniture/${p.id}`)}" alt="" draggable="false" />`;
        itemsEl.appendChild(el);
        els.set(p.uid, el);
      }
      const key = `${p.kind}|${p.x}|${p.y}|${p.flip}|${layer(state, p)}`;
      if (el.dataset.key !== key) {
        place(el, pictureBox(item, p.kind, p.x, p.y));
        el.style.zIndex = layer(state, p);
        el.classList.toggle('flipped', p.flip);
        el.dataset.kind = p.kind;
        el.dataset.key = key;
      }
      el.hidden = hidden.has(p.uid);
      el.classList.toggle('is-selected', ui.popover?.kind === 'furniture' && ui.popover.id === p.uid);
      el.classList.toggle('lit', item.category === 'lighting' || p.id === 'iron-stove' || p.id === 'fairy-lights');
      el.setAttribute('aria-label', `${item.name}. Click to move, flip or put away.`);
    }
    for (const [uid, el] of els) if (!seen.has(uid)) { el.remove(); els.delete(uid); }
  }

  function renderGhost() {
    const placing = ui.place;
    stage.classList.toggle('placing', !!placing);
    bar.hidden = !placing;
    if (!placing) {
      ghost.hidden = true;
      spot = null;
      return;
    }
    const item = FURNITURE_BY_ID[placing.id];
    setHTML(bar, `<img src="${url(`furniture/${placing.id}`)}" alt="" class="bar-art" /><span><b>${placing.uid ? 'Moving' : 'Placing'} ${esc(item.name.toLowerCase())}</b><small>${esc(placeWords(item))}. Click a green spot to put it down.</small></span>
      <button type="button" class="btn btn-small btn-plain" data-action="furn-flip-ghost" title="Flip (F)">${icon('flip', 'icon icon-sm')}Flip</button>
      <button type="button" class="btn btn-small btn-plain" data-action="furn-cancel" title="Cancel (Esc)">Cancel</button>`);
    if (ghostImg.dataset.id !== placing.id) {
      ghostImg.src = url(`furniture/${placing.id}`);
      ghostImg.dataset.id = placing.id;
    }
    if (!spot) {
      ghost.hidden = true;
      return;
    }
    ghost.hidden = false;
    place(ghost, pictureBox(item, spot.kind, spot.x, spot.y));
    ghost.style.zIndex = spot.kind === 'surface' ? 2000 : spot.kind === 'floor' ? 100 + Math.round(spot.y) + 1 : 1500;
    ghost.classList.toggle('flipped', !!placing.flip);
    ghost.classList.toggle('ok', !!spot.ok);
    ghost.classList.toggle('bad', !spot.ok);
    ghostNote.textContent = spot.ok ? '' : spot.reason;
  }

  function furnPopoverHTML(p) {
    const item = FURNITURE_BY_ID[p.id];
    const kids = childrenOf(state, p.uid);
    return `<div class="pop-head"><img class="icon icon-md" src="${url(`furniture/${p.id}`)}" alt="" /><div><strong>${esc(item.name)}</strong><span>${esc(placeWords(item))}</span></div><button type="button" class="x" data-action="close-popover" aria-label="Close">×</button></div>
      <div class="pop-actions">
        <button type="button" class="btn btn-small" data-action="furn-move" data-uid="${p.uid}">${icon('move', 'icon icon-sm')}Move</button>
        <button type="button" class="btn btn-small btn-plain" data-action="furn-flip" data-uid="${p.uid}">${icon('flip', 'icon icon-sm')}Flip</button>
        <button type="button" class="btn btn-small btn-plain" data-action="furn-store" data-uid="${p.uid}">${icon('box', 'icon icon-sm')}Store</button>
      </div>
      ${kids.length ? `<p class="hint">The ${kids.map((k) => esc(FURNITURE_BY_ID[k.id].name.toLowerCase())).join(' and ')} on top will come along.</p>` : ''}`;
  }

  function renderPopover() {
    const pop = ui.popover;
    const p = pop?.kind === 'furniture' && !ui.place ? state.home.placed.find((q) => q.uid === pop.id) : null;
    if (!p) {
      popover.hidden = true;
      setHTML(popover, '');
      return;
    }
    setHTML(popover, furnPopoverHTML(p));
    popover.hidden = false;
    const b = pictureBox(FURNITURE_BY_ID[p.id], p.kind, p.x, p.y);
    const rect = stage.getBoundingClientRect();
    const scale = rect.width / W;
    const h = popover.offsetHeight, half = popover.offsetWidth / 2;
    let top = b.top * scale - h - 10;
    if (top < 6) top = Math.min((b.top + b.height) * scale + 10, rect.height - h - 6);
    popover.style.left = `${Math.min(Math.max((b.left + b.width / 2) * scale, half + 8), rect.width - half - 8)}px`;
    popover.style.top = `${Math.max(6, top)}px`;
  }

  function render() {
    renderItems();
    renderGhost();
    renderPopover();
  }

  // ---- Pointer handling ----
  function toRoom(e) {
    const rect = stage.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
  }
  function ignoreSet() {
    const uid = ui.place?.uid;
    return uid ? new Set([uid, ...childrenOf(state, uid).map((k) => k.uid)]) : new Set();
  }
  function track(e) {
    if (!ui.place) return;
    const pt = toRoom(e);
    spot = findSpot(state, ui.place.id, pt.x, pt.y, ignoreSet());
    renderGhost();
  }
  stage.addEventListener('pointermove', track);
  stage.addEventListener('pointerdown', track);
  stage.addEventListener('pointerleave', () => {
    if (!ui.place) return;
    spot = null;
    renderGhost();
  });

  stage.addEventListener('click', (e) => {
    if (e.target.closest('.popover') || e.target.closest('.place-bar')) return;
    if (ui.place) {
      if (e.target.closest('[data-action="exit-house"]')) return;
      e.preventDefault();
      e.stopPropagation();
      track(e);
      return actions.dropFurniture(spot);
    }
    if (e.target.closest('[data-action]')) return;
    const furn = e.target.closest('[data-uid]');
    if (furn) return actions.clickFurniture(Number(furn.dataset.uid));
    actions.closePopover();
  }, true);

  // Where an item is, for little effects.
  function itemPoint(uid) {
    const p = state.home.placed.find((q) => q.uid === uid);
    if (!p) return { x: W / 2, y: H / 2 };
    const b = pictureBox(FURNITURE_BY_ID[p.id], p.kind, p.x, p.y);
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  }
  function bounce(uid) {
    const el = els.get(uid);
    if (!el) return;
    el.classList.remove('dropped');
    void el.offsetWidth;
    el.classList.add('dropped');
    setTimeout(() => el.classList.remove('dropped'), 600);
  }
  const resetSpot = () => { spot = null; };

  return { render, itemPoint, bounce, resetSpot, element: stage };
}
