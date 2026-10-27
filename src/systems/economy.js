import { CONFIG, xpForLevel } from '../data/config.js';
import { CROPS, CROPS_BY_ID } from '../data/cropsData.js';
import { add, count, remove, total } from './inventory.js';
import { ok, fail } from './result.js';

export function levelFromXp(xp) {
  let level = 1;
  while (level < CONFIG.MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  return level;
}

// Progress through the current level, from 0 to 1.
export function levelProgress(xp) {
  const level = levelFromXp(xp);
  if (level >= CONFIG.MAX_LEVEL) return { level, into: 0, needed: 0, fraction: 1 };
  const start = xpForLevel(level), end = xpForLevel(level + 1);
  return { level, into: xp - start, needed: end - start, fraction: (xp - start) / (end - start) };
}

export function addXp(state, amount) {
  const gained = Math.round(amount);
  state.xp += gained;
  state.level = levelFromXp(state.xp);
  return gained;
}

// Adds coins and records an "earn" event so quests can count it.
export function earnCoins(state, amount, events) {
  const coins = Math.round(amount);
  state.coins += coins;
  state.stats.earned += coins;
  events.push({ type: 'earn', amount: coins });
  return coins;
}

export function isCropUnlocked(state, cropId) {
  const crop = CROPS_BY_ID[cropId];
  return !!crop && state.level >= crop.unlockLevel;
}

export function buySeeds(state, cropId, qty = 1) {
  const crop = CROPS_BY_ID[cropId];
  if (!crop) return fail('That seed does not exist.');
  if (!isCropUnlocked(state, cropId)) return fail(`${crop.name} seeds unlock at level ${crop.unlockLevel}.`);
  const price = crop.seedCost * qty;
  if (state.coins < price) return fail(`You need ${price - state.coins} more coins for that.`);
  state.coins -= price;
  add(state.seeds, cropId, qty);
  return ok({ cropId, qty, spent: price, events: [{ type: 'buySeeds', crop: cropId, amount: qty }] });
}

export function sellProduce(state, cropId, qty = 1) {
  const crop = CROPS_BY_ID[cropId];
  if (!crop) return fail('Nothing to sell.');
  if (count(state.produce, cropId) < qty || qty <= 0) return fail(`You don't have ${qty} ${qty === 1 ? crop.name.toLowerCase() : crop.plural.toLowerCase()}.`);
  remove(state.produce, cropId, qty);
  const events = [];
  const coins = earnCoins(state, crop.sellPrice * qty, events);
  state.stats.sold += qty;
  events.push({ type: 'sell', crop: cropId, amount: qty });
  return ok({ cropId, qty, coins, events });
}

// ---- Market orders: "bring me these items for a bonus" ----

let orderCounter = 0;
export function makeOrder(state, rng = Math.random) {
  const unlocked = CROPS.filter((c) => c.unlockLevel <= state.level);
  const kinds = Math.min(unlocked.length, rng() < 0.5 ? 1 : 2);
  const items = {};
  const pool = [...unlocked];
  for (let i = 0; i < kinds; i++) {
    const crop = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    // Cheaper crops are requested in bigger numbers.
    const qty = crop.sellPrice >= 60 ? 1 + Math.floor(rng() * 2) : 2 + Math.floor(rng() * 3);
    items[crop.id] = qty;
  }
  const value = Object.entries(items).reduce((sum, [id, q]) => sum + CROPS_BY_ID[id].sellPrice * q, 0);
  const names = ['Baker Bea', 'Old Tom', 'Miss Clover', 'Chef Pip', 'Granny Fern', 'Little Wren', 'Mayor Moss'];
  return {
    id: `order-${Date.now().toString(36)}-${(orderCounter++).toString(36)}`,
    from: names[Math.floor(rng() * names.length)],
    items,
    coins: Math.round(value * CONFIG.ORDER_BONUS),
    xp: Math.max(4, Math.round(value / 8)),
  };
}

export function fillOrders(state, rng = Math.random) {
  while (state.orders.length < CONFIG.ORDER_SLOTS) state.orders.push(makeOrder(state, rng));
}

export function canFulfil(state, order) {
  return Object.entries(order.items).every(([id, q]) => count(state.produce, id) >= q);
}

export function fulfilOrder(state, orderId, rng = Math.random) {
  const index = state.orders.findIndex((o) => o.id === orderId);
  if (index === -1) return fail('That order is no longer on the board.');
  const order = state.orders[index];
  if (!canFulfil(state, order)) return fail('You don\'t have everything for this order yet.');
  for (const [id, q] of Object.entries(order.items)) remove(state.produce, id, q);
  const events = [];
  earnCoins(state, order.coins, events);
  const xp = addXp(state, order.xp);
  state.stats.ordersDone += 1;
  events.push({ type: 'order', amount: 1 });
  state.orders.splice(index, 1);
  fillOrders(state, rng);
  return ok({ order, coins: order.coins, xp, events });
}

// If the player has spent everything and has nothing growing, give them a
// little care package so they can never get stuck.
export function ensureNotStuck(state) {
  const cheapest = Math.min(...CROPS.map((c) => c.seedCost));
  const growing = Object.values(state.plots).some(Boolean);
  if (state.coins >= cheapest || total(state.seeds) > 0 || total(state.produce) > 0 || growing) return false;
  add(state.seeds, 'carrot', 3);
  return true;
}
