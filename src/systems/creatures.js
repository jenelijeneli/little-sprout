import { CONFIG } from '../data/config.js';
import { CREATURES, CREATURES_BY_ID } from '../data/creaturesData.js';
import { CROPS_BY_ID } from '../data/cropsData.js';
import { remove, count } from './inventory.js';
import { ok, fail } from './result.js';

const clamp = (n) => Math.max(0, Math.min(100, n));

export function owned(state) {
  return CREATURES.filter((c) => state.creatures[c.id]);
}

// Happiness slowly drifts down as real time passes (even while away).
export function updateCreatures(state, now) {
  for (const c of Object.values(state.creatures)) {
    const minutes = Math.max(0, now - c.updatedAt) / 60000;
    c.happiness = Math.max(10, c.happiness - minutes * CONFIG.HAPPINESS_DECAY_PER_MINUTE);
    c.updatedAt = now;
  }
}

// The bonus is strongest when friends are happy: max bonus * happiness%.
export function creatureBonus(state, type) {
  let bonus = 0;
  for (const def of CREATURES) {
    const c = state.creatures[def.id];
    if (c && def.bonus.type === type) bonus += def.bonus.max * (c.happiness / 100);
  }
  return bonus;
}

export function currentBonus(state, id) {
  const def = CREATURES_BY_ID[id], c = state.creatures[id];
  return c ? def.bonus.max * (c.happiness / 100) : 0;
}

export function adopt(state, id, now) {
  const def = CREATURES_BY_ID[id];
  if (!def) return fail('Unknown creature.');
  if (state.creatures[id]) return fail(`${def.name} already lives here.`);
  if (state.level < def.unlockLevel) return fail(`${def.name} arrives at level ${def.unlockLevel}.`);
  if (state.coins < def.cost) return fail(`You need ${def.cost - state.coins} more coins to welcome ${def.name}.`);
  state.coins -= def.cost;
  state.creatures[id] = { happiness: 70, lastPet: 0, updatedAt: now, adoptedAt: now };
  return ok({ id, events: [{ type: 'adopt', amount: 1 }] });
}

export function petCooldownLeft(state, id, now) {
  const c = state.creatures[id];
  return c ? Math.max(0, c.lastPet + CONFIG.PET_COOLDOWN_MS - now) : 0;
}

export function pet(state, id, now) {
  const def = CREATURES_BY_ID[id], c = state.creatures[id];
  if (!c) return fail('That friend doesn\'t live here yet.');
  const wait = petCooldownLeft(state, id, now);
  if (wait > 0) return fail(`${def.name} is still enjoying the last cuddle (${Math.ceil(wait / 1000)}s).`);
  c.happiness = clamp(c.happiness + CONFIG.PET_HAPPINESS);
  c.lastPet = now;
  const line = def.petLines[Math.floor(Math.random() * def.petLines.length)];
  return ok({ id, line, happiness: c.happiness, events: [{ type: 'pet', amount: 1 }] });
}

export function feed(state, id, cropId) {
  const def = CREATURES_BY_ID[id], c = state.creatures[id];
  if (!c) return fail('That friend doesn\'t live here yet.');
  const crop = CROPS_BY_ID[cropId];
  if (!crop || count(state.produce, cropId) < 1) return fail('You need some produce to share. Try harvesting first!');
  if (c.happiness >= 100) return fail(`${def.name} is already completely full and happy.`);
  remove(state.produce, cropId, 1);
  const favorite = def.favoriteCrop === cropId;
  c.happiness = clamp(c.happiness + (favorite ? CONFIG.FEED_FAVORITE_HAPPINESS : CONFIG.FEED_HAPPINESS));
  return ok({ id, cropId, favorite, happiness: c.happiness, events: [{ type: 'feed', amount: 1 }] });
}
