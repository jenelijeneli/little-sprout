import { CONFIG, STARTING_BEDS } from '../data/config.js';
import { PLOTS } from '../data/gardenLayout.js';
import { createHome } from './home.js';

// The complete game state. Everything the save file stores lives here,
// and nothing in here knows about the screen.
export function createNewState(now = Date.now()) {
  const plots = {};
  for (const p of PLOTS) if (STARTING_BEDS.includes(p.bed)) plots[p.id] = null;
  return {
    version: CONFIG.SAVE_VERSION,
    createdAt: now,
    lastSeen: now,
    coins: CONFIG.STARTING_COINS,
    xp: 0,
    level: 1,
    seeds: { ...CONFIG.STARTING_SEEDS },
    produce: {},
    unlockedBeds: [...STARTING_BEDS],
    // plotId -> null (empty) or { cropId, plantedAt, progressMs, updatedAt, wetUntil }
    plots,
    decor: { owned: {}, placed: {} },
    // The cottage: furniture in storage and furniture placed in the room.
    home: createHome(),
    // Button the mushroom already lives in the garden when you start.
    creatures: { button: { happiness: 70, lastPet: 0, updatedAt: now, adoptedAt: now } },
    quests: {},
    orders: [],
    stats: { planted: 0, harvested: 0, watered: 0, sold: 0, earned: 0, ordersDone: 0 },
  };
}

export function isPlotUnlocked(state, plotId) {
  return Object.prototype.hasOwnProperty.call(state.plots, plotId);
}
