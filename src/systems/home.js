// The cottage: buying furniture and placing, moving, flipping and storing it.
// Positions are in room units (see data/houseLayout.js). Nothing here knows
// about the screen, so the same rules check the ghost preview, the real
// placement and old saves.
import { FURNITURE_BY_ID, STARTER_FURNITURE } from '../data/furnitureData.js';
import { WALL, FLOOR, CEILING_Y, GRID, BLOCKED } from '../data/houseLayout.js';
import { add, remove, count } from './inventory.js';
import { ok, fail } from './result.js';

// A brand-new cottage with a little starter furniture.
export function createHome() {
  const home = { owned: {}, placed: [], nextUid: 1 };
  for (const s of STARTER_FURNITURE) {
    home.placed.push({ uid: home.nextUid++, id: s.id, kind: FURNITURE_BY_ID[s.id].place[0], x: s.x, y: s.y, flip: false, on: null });
  }
  return home;
}

const snap = (v) => Math.round(v / GRID) * GRID;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
const overlaps = (a, b) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
const nameOf = (p) => FURNITURE_BY_ID[p.id].name.toLowerCase();

// The patch of room an item takes up (used for overlap checks).
export function footprint(item, kind, x, y) {
  const hw = item.w / 2;
  if (kind === 'floor') return { x1: x - hw, x2: x + hw, y1: y - item.depth, y2: y };
  if (kind === 'ceiling') return { x1: x - hw, x2: x + hw, y1: CEILING_Y, y2: CEILING_Y + item.h };
  if (kind === 'surface') return { x1: x - hw, x2: x + hw, y1: y - item.h, y2: y };
  return { x1: x - hw, x2: x + hw, y1: y - item.h / 2, y2: y + item.h / 2 }; // wall, rug
}

// Where the item's picture is drawn: { left, top, width, height }.
export function pictureBox(item, kind, x, y) {
  if (kind === 'floor' || kind === 'surface') return { left: x - item.w / 2, top: y - item.h, width: item.w, height: item.h };
  if (kind === 'ceiling') return { left: x - item.w / 2, top: CEILING_Y, width: item.w, height: item.h };
  return { left: x - item.w / 2, top: y - item.h / 2, width: item.w, height: item.h };
}

export const childrenOf = (state, uid) => state.home.placed.filter((p) => p.on === uid);

// Can item `id` go at (x, y) as `kind`? `ignore` is a set of placed uids to
// leave out (the item being moved and anything sitting on it).
export function checkPlacement(state, id, kind, x, y, { on = null, ignore = new Set() } = {}) {
  const item = FURNITURE_BY_ID[id];
  if (!item) return fail('Unknown furniture.');
  if (!item.place.includes(kind)) return fail(`The ${item.name.toLowerCase()} can't go there.`);
  const others = state.home.placed.filter((p) => !ignore.has(p.uid));

  if (kind === 'surface') {
    const parent = others.find((p) => p.uid === on);
    const top = parent && FURNITURE_BY_ID[parent.id].surface;
    if (!top) return fail(`The ${item.name.toLowerCase()} needs a table or shelf to sit on.`);
    const reach = top.width / 2 - item.w / 2;
    if (reach < 0 || Math.abs(x - parent.x) > reach + 0.5) return fail(`The ${item.name.toLowerCase()} would fall off the ${nameOf(parent)}.`);
    const sy = parent.y - top.top;
    const box = footprint(item, kind, x, sy);
    const hit = others.find((p) => p.kind === 'surface' && p.on === on && overlaps(box, footprint(FURNITURE_BY_ID[p.id], p.kind, p.x, p.y)));
    if (hit) return fail(`There's already a ${nameOf(hit)} there.`);
    return ok({ kind, x, y: sy, on });
  }

  const box = footprint(item, kind, x, y);
  if (kind === 'wall') {
    if (box.x1 < WALL.left || box.x2 > WALL.right || box.y1 < WALL.top || box.y2 > WALL.bottom) return fail('Wall decorations have to fit on the wall.');
    const zone = BLOCKED.wall.find((z) => overlaps(box, z));
    if (zone) return fail(`That would cover ${zone.name}.`);
  } else if (kind === 'ceiling') {
    if (box.x1 < WALL.left || box.x2 > WALL.right) return fail('That is outside the room.');
  } else {
    // floor and rug
    if (box.x1 < FLOOR.left || box.x2 > FLOOR.right || box.y1 < FLOOR.back || box.y2 > FLOOR.front) return fail('Furniture has to stay inside the room.');
    const zone = BLOCKED.floor.find((z) => overlaps(box, z));
    if (zone) return fail(`Keep ${zone.name} clear.`);
  }
  const clash = (p) => {
    const other = FURNITURE_BY_ID[p.id];
    if (kind === 'floor') return p.kind === 'floor' && other.solid && item.solid;
    return p.kind === kind; // rugs vs rugs, wall vs wall, ceiling vs ceiling
  };
  const hit = others.find((p) => clash(p) && overlaps(box, footprint(FURNITURE_BY_ID[p.id], p.kind, p.x, p.y)));
  if (hit) return fail(`That spot overlaps the ${nameOf(hit)}.`);
  return ok({ kind, x, y, on: null });
}

// Turns a pointer position into the best spot for an item: it snaps to the
// grid, stays inside the room and hops onto tables when it is over one.
// Returns { kind, x, y, on, ok, reason }.
export function findSpot(state, id, px, py, ignore = new Set()) {
  const item = FURNITURE_BY_ID[id];
  if (item.place.includes('surface')) {
    let best = null;
    for (const p of state.home.placed) {
      const top = FURNITURE_BY_ID[p.id].surface;
      if (!top || ignore.has(p.uid)) continue;
      const sy = p.y - top.top;
      if (Math.abs(px - p.x) > top.width / 2 + 10 || py < sy - item.h - 30 || py > sy + 40) continue;
      const d = Math.abs(px - p.x) + Math.abs(py - (sy - item.h / 2));
      if (!best || d < best.d) best = { p, top, d };
    }
    if (best) {
      const reach = Math.max(0, best.top.width / 2 - item.w / 2);
      const x = clamp(snap(px), best.p.x - reach, best.p.x + reach);
      return { ...checkPlacement(state, id, 'surface', x, 0, { on: best.p.uid, ignore }), kind: 'surface', on: best.p.uid, x, y: best.p.y - best.top.top };
    }
  }
  const kind = item.place.find((k) => k !== 'surface');
  if (!kind) return { ok: false, reason: `Put the ${item.name.toLowerCase()} on a table, bedside table or sofa.`, kind: 'surface', x: snap(px), y: snap(py), on: null };
  let x = clamp(snap(px), FLOOR.left + item.w / 2, FLOOR.right - item.w / 2), y;
  if (kind === 'floor') y = clamp(snap(py + item.h / 2), FLOOR.back + item.depth, FLOOR.front);
  else if (kind === 'rug') y = clamp(snap(py), FLOOR.back + item.h / 2, FLOOR.front - item.h / 2);
  else if (kind === 'wall') {
    x = clamp(snap(px), WALL.left + item.w / 2, WALL.right - item.w / 2);
    y = clamp(snap(py), WALL.top + item.h / 2, WALL.bottom - item.h / 2);
  } else y = CEILING_Y;
  return { ...checkPlacement(state, id, kind, x, y, { ignore }), kind, x, y, on: null };
}

// ---------- actions ----------

export function buyFurniture(state, id) {
  const item = FURNITURE_BY_ID[id];
  if (!item) return fail('That item is not in the catalogue.');
  if (state.level < item.unlockLevel) return fail(`The ${item.name.toLowerCase()} unlocks at level ${item.unlockLevel}.`);
  if (state.coins < item.cost) return fail(`You need ${item.cost - state.coins} more coins for the ${item.name.toLowerCase()}.`);
  state.coins -= item.cost;
  add(state.home.owned, id, 1);
  return ok({ id, spent: item.cost, events: [{ type: 'buyFurniture', amount: 1 }] });
}

export function placeFurniture(state, id, kind, x, y, flip = false, on = null) {
  const item = FURNITURE_BY_ID[id];
  if (!item) return fail('Unknown furniture.');
  if (count(state.home.owned, id) < 1) return fail(`You don't have a ${item.name.toLowerCase()} in storage. Buy one first.`);
  const check = checkPlacement(state, id, kind, x, y, { on });
  if (!check.ok) return check;
  remove(state.home.owned, id, 1);
  const placed = { uid: state.home.nextUid++, id, kind, x: check.x, y: check.y, flip: !!flip, on: check.on };
  state.home.placed.push(placed);
  return ok({ placed, events: [{ type: 'placeFurniture', amount: 1 }] });
}

export function moveFurniture(state, uid, kind, x, y, flip, on = null) {
  const p = state.home.placed.find((q) => q.uid === uid);
  if (!p) return fail('That furniture is not in the room.');
  const kids = childrenOf(state, uid);
  if (on != null && (on === uid || kids.some((k) => k.uid === on))) return fail('Something can\'t sit on itself.');
  const check = checkPlacement(state, p.id, kind, x, y, { on, ignore: new Set([uid, ...kids.map((k) => k.uid)]) });
  if (!check.ok) return check;
  const dx = check.x - p.x, dy = check.y - p.y;
  for (const k of kids) { k.x += dx; k.y += dy; }
  Object.assign(p, { kind, x: check.x, y: check.y, on: check.on, flip: flip == null ? p.flip : !!flip });
  return ok({ placed: p, events: [] });
}

export function flipFurniture(state, uid) {
  const p = state.home.placed.find((q) => q.uid === uid);
  if (!p) return fail('That furniture is not in the room.');
  p.flip = !p.flip;
  return ok({ placed: p, events: [] });
}

// Puts an item (and anything sitting on it) back into storage.
export function storeFurniture(state, uid) {
  const p = state.home.placed.find((q) => q.uid === uid);
  if (!p) return fail('That furniture is not in the room.');
  const gone = [p, ...childrenOf(state, uid)];
  state.home.placed = state.home.placed.filter((q) => !gone.includes(q));
  for (const q of gone) add(state.home.owned, q.id, 1);
  return ok({ stored: gone.map((q) => q.id), events: [] });
}

// Rebuilds the home from a save, keeping every item the player owns. Items
// whose saved spot is no longer valid go back to storage instead of vanishing.
export function sanitizeHome(state, data) {
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  if (!isObj(data)) return createHome();
  state.home = { owned: {}, placed: [], nextUid: 1 };
  if (isObj(data.owned)) {
    for (const [id, n] of Object.entries(data.owned)) {
      const amount = Math.floor(Number(n));
      if (FURNITURE_BY_ID[id] && amount > 0) state.home.owned[id] = amount;
    }
  }
  const saved = Array.isArray(data.placed) ? data.placed.filter((p) => isObj(p) && FURNITURE_BY_ID[p.id]) : [];
  // Saved ids are kept when they are sensible, so nothing gets renumbered.
  const used = new Set();
  const uidOf = new Map();
  let next = Math.max(1, Math.floor(Number(data.nextUid)) || 1);
  for (const p of saved) {
    const uid = Number.isInteger(p.uid) && p.uid > 0 && !used.has(p.uid) ? p.uid : null;
    if (uid) { used.add(uid); next = Math.max(next, uid + 1); }
    uidOf.set(p, uid);
  }
  for (const p of saved) if (!uidOf.get(p)) uidOf.set(p, next++);
  state.home.nextUid = next;
  // Things that other things sit on go first, so their passengers can find them.
  const order = [...saved].sort((a, b) => (a.kind === 'surface') - (b.kind === 'surface'));
  const kept = new Set();
  for (const p of order) {
    const nums = [p.x, p.y].every((v) => typeof v === 'number' && Number.isFinite(v));
    const on = p.kind === 'surface' && kept.has(p.on) ? p.on : null;
    const check = nums ? checkPlacement(state, p.id, p.kind, p.x, p.y, { on }) : { ok: false };
    if (check.ok) {
      const uid = uidOf.get(p);
      kept.add(uid);
      state.home.placed.push({ uid, id: p.id, kind: p.kind, x: check.x, y: check.y, flip: p.flip === true, on: check.on });
    } else {
      add(state.home.owned, p.id, 1);
    }
  }
  // Keep the saved order (it doesn't matter for drawing, but keeps saves stable).
  const rank = new Map(saved.map((p, i) => [uidOf.get(p), i]));
  state.home.placed.sort((a, b) => rank.get(a.uid) - rank.get(b.uid));
  return state.home;
}
