// The game "brain". It owns the state, runs actions through the systems,
// counts quest progress, saves, and tells the screen what happened.
// It never touches the page itself, which keeps it easy to test.

import { CROPS } from '../data/cropsData.js';
import { CREATURES } from '../data/creaturesData.js';
import { DECORATIONS } from '../data/decorData.js';
import { FURNITURE } from '../data/furnitureData.js';
import { EXPANSIONS } from '../data/config.js';
import { clock as defaultClock } from './clock.js';
import { createNewState } from './state.js';
import { loadGame, saveGame, clearSave } from './saveManager.js';
import { advanceAll, plant, water, harvest } from './crops.js';
import { buySeeds, sellProduce, fulfilOrder, fillOrders, ensureNotStuck, levelFromXp } from './economy.js';
import { updateCreatures, adopt, pet, feed } from './creatures.js';
import { activeQuestIds, trackQuests, claimQuest } from './quests.js';
import { buyDecor, placeDecor, pickUpDecor } from './decorations.js';
import { expand } from './expansion.js';
import { buyFurniture, placeFurniture, moveFurniture, flipFurniture, storeFurniture } from './home.js';

const ACTIONS = {
  plant: (s, now, plotId, cropId) => plant(s, plotId, cropId, now),
  water: (s, now, plotId) => water(s, plotId, now),
  harvest: (s, now, plotId) => harvest(s, plotId, now),
  buySeeds: (s, now, cropId, qty) => buySeeds(s, cropId, qty),
  sell: (s, now, cropId, qty) => sellProduce(s, cropId, qty),
  fulfilOrder: (s, now, orderId) => fulfilOrder(s, orderId),
  adopt: (s, now, id) => adopt(s, id, now),
  pet: (s, now, id) => pet(s, id, now),
  feed: (s, now, id, cropId) => feed(s, id, cropId),
  claimQuest: (s, now, id) => claimQuest(s, id),
  buyDecor: (s, now, id) => buyDecor(s, id),
  placeDecor: (s, now, spotId, id) => placeDecor(s, spotId, id),
  pickUpDecor: (s, now, spotId) => pickUpDecor(s, spotId),
  expand: (s) => expand(s),
  buyFurniture: (s, now, id) => buyFurniture(s, id),
  placeFurniture: (s, now, id, kind, x, y, flip, on) => placeFurniture(s, id, kind, x, y, flip, on),
  moveFurniture: (s, now, uid, kind, x, y, flip, on) => moveFurniture(s, uid, kind, x, y, flip, on),
  flipFurniture: (s, now, uid) => flipFurniture(s, uid),
  storeFurniture: (s, now, uid) => storeFurniture(s, uid),
};

// Things that become available at a given level (for the level-up banner).
export function unlocksAt(level) {
  return [
    ...CROPS.filter((c) => c.unlockLevel === level).map((c) => `${c.name} seeds`),
    ...CREATURES.filter((c) => c.unlockLevel === level && c.cost > 0).map((c) => `${c.name} the ${c.species}`),
    ...DECORATIONS.filter((d) => d.unlockLevel === level && level > 1).map((d) => d.name),
    ...FURNITURE.filter((f) => f.unlockLevel === level && level > 1).map((f) => f.name),
    ...EXPANSIONS.filter((e) => e.level === level).map(() => 'Garden expansion'),
  ];
}

export function createGame({ storage, clock = defaultClock } = {}) {
  const loaded = loadGame(storage, clock.now());
  const state = loaded.state;
  const listeners = new Set();
  let lastSaved = null;

  const notify = (event) => listeners.forEach((fn) => fn(event));

  // Bring growth and creature happiness up to date with real time.
  function catchUp(now) {
    state.level = levelFromXp(state.xp);
    advanceAll(state, now);
    updateCreatures(state, now);
  }

  function save() {
    if (saveGame(state, storage)) {
      lastSaved = Date.now();
      notify({ type: 'saved', at: lastSaved });
      return true;
    }
    notify({ type: 'saveFailed' });
    return false;
  }

  function act(name, ...args) {
    const action = ACTIONS[name];
    if (!action) throw new Error(`Unknown action: ${name}`);
    const now = clock.now();
    catchUp(now);
    const levelBefore = state.level;
    const activeBefore = activeQuestIds(state);
    const result = action(state, now, ...args);
    if (result.ok) {
      state.level = levelFromXp(state.xp);
      result.completedQuests = trackQuests(state, result.events, activeBefore);
      // Newly shown quests (e.g. "reach level 3") may already be done.
      result.completedQuests.push(...trackQuests(state, [], activeQuestIds(state).filter((id) => !activeBefore.includes(id))));
      result.levelUp = state.level > levelBefore ? { level: state.level, unlocks: unlocksAt(state.level) } : null;
      result.carePackage = ensureNotStuck(state);
      fillOrders(state);
      save();
    }
    notify({ type: 'action', name, args, result });
    return result;
  }

  function tick() {
    catchUp(clock.now());
    notify({ type: 'tick' });
  }

  function reset() {
    clearSave(storage);
    const fresh = createNewState(clock.now());
    for (const key of Object.keys(state)) delete state[key];
    Object.assign(state, fresh);
    fillOrders(state);
    trackQuests(state, []);
    save();
    notify({ type: 'reset' });
  }

  // First load: catch up on time spent away and make sure the boards are full.
  catchUp(clock.now());
  fillOrders(state);
  trackQuests(state, []);

  return {
    state,
    loadStatus: loaded.status,
    act,
    tick,
    save,
    reset,
    now: () => clock.now(),
    get lastSaved() { return lastSaved; },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  };
}

