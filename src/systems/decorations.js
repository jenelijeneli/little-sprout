import { DECOR_BY_ID } from '../data/decorData.js';
import { DECOR_SPOTS } from '../data/gardenLayout.js';
import { add, remove, count } from './inventory.js';
import { ok, fail } from './result.js';

const SPOT_IDS = new Set(DECOR_SPOTS.map((s) => s.id));

export function buyDecor(state, id) {
  const d = DECOR_BY_ID[id];
  if (!d) return fail('Unknown decoration.');
  if (state.level < d.unlockLevel) return fail(`${d.name} unlocks at level ${d.unlockLevel}.`);
  if (state.coins < d.cost) return fail(`You need ${d.cost - state.coins} more coins for the ${d.name.toLowerCase()}.`);
  state.coins -= d.cost;
  add(state.decor.owned, id, 1);
  return ok({ id, events: [{ type: 'buyDecor', amount: 1 }] });
}

// Decorations waiting in the shed (owned but not placed).
export function unplaced(state, id) {
  return count(state.decor.owned, id);
}

export function placeDecor(state, spotId, id) {
  if (!SPOT_IDS.has(spotId)) return fail('You can\'t place that there.');
  if (state.decor.placed[spotId]) return fail('That spot already has a decoration. Pick it up first.');
  if (!remove(state.decor.owned, id, 1)) return fail('Buy this decoration in the shop first.');
  state.decor.placed[spotId] = id;
  return ok({ spotId, id, events: [{ type: 'placeDecor', amount: 1 }] });
}

export function pickUpDecor(state, spotId) {
  const id = state.decor.placed[spotId];
  if (!id) return fail('Nothing to pick up there.');
  delete state.decor.placed[spotId];
  add(state.decor.owned, id, 1);
  return ok({ spotId, id });
}
