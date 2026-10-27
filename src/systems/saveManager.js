import { CONFIG, STARTING_BEDS } from '../data/config.js';
import { CROPS_BY_ID } from '../data/cropsData.js';
import { CREATURES_BY_ID } from '../data/creaturesData.js';
import { DECOR_BY_ID } from '../data/decorData.js';
import { QUESTS_BY_ID } from '../data/questsData.js';
import { BEDS, PLOTS, DECOR_SPOTS } from '../data/gardenLayout.js';
import { createNewState } from './state.js';
import { createHome, sanitizeHome } from './home.js';
import { levelFromXp } from './economy.js';

// localStorage can be missing or blocked (private windows, some previews).
// This falls back to an in-memory store so the game still runs.
export function safeStorage() {
  try {
    const test = '__sprout_test__';
    window.localStorage.setItem(test, '1');
    window.localStorage.removeItem(test);
    return window.localStorage;
  } catch {
    const mem = new Map();
    // persistent: false lets the game warn that progress won't be kept.
    return { persistent: false, getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  }
}

const num = (v, fallback = 0, min = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= min ? v : fallback);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

function cleanBag(bag, validIds) {
  const out = {};
  if (!isObj(bag)) return out;
  for (const [id, n] of Object.entries(bag)) {
    const amount = Math.floor(num(n));
    if (validIds[id] && amount > 0) out[id] = amount;
  }
  return out;
}

// Builds a fresh, valid state and copies over everything from the saved data
// that still makes sense. Unknown or broken values are simply dropped, so a
// change to the game's code never wipes a player's progress.
export function sanitize(data, now = Date.now()) {
  const state = createNewState(now);
  if (!isObj(data)) return state;

  state.createdAt = num(data.createdAt, now);
  state.lastSeen = num(data.lastSeen, now);
  state.coins = Math.floor(num(data.coins, state.coins));
  state.xp = Math.floor(num(data.xp, 0));
  state.level = levelFromXp(state.xp);
  state.seeds = isObj(data.seeds) ? cleanBag(data.seeds, CROPS_BY_ID) : state.seeds;
  state.produce = cleanBag(data.produce, CROPS_BY_ID);

  const bedIds = new Set(BEDS.map((b) => b.id));
  const beds = Array.isArray(data.unlockedBeds) ? data.unlockedBeds.filter((b) => bedIds.has(b)) : [];
  state.unlockedBeds = [...new Set([...STARTING_BEDS, ...beds])];

  state.plots = {};
  const saved = isObj(data.plots) ? data.plots : {};
  for (const p of PLOTS) {
    if (!state.unlockedBeds.includes(p.bed)) continue;
    const s = saved[p.id];
    const valid = isObj(s) && CROPS_BY_ID[s.cropId] && Number.isFinite(s.plantedAt) && Number.isFinite(s.updatedAt);
    state.plots[p.id] = valid
      ? { cropId: s.cropId, plantedAt: s.plantedAt, progressMs: num(s.progressMs), updatedAt: s.updatedAt, wetUntil: num(s.wetUntil) }
      : null;
  }

  if (isObj(data.decor)) {
    state.decor.owned = cleanBag(data.decor.owned, DECOR_BY_ID);
    const spots = new Set(DECOR_SPOTS.map((s) => s.id));
    for (const [spot, id] of Object.entries(isObj(data.decor.placed) ? data.decor.placed : {})) {
      if (spots.has(spot) && DECOR_BY_ID[id]) state.decor.placed[spot] = id;
    }
  }

  state.home = isObj(data.home) ? sanitizeHome(state, data.home) : createHome();

  if (isObj(data.creatures)) {
    for (const [id, c] of Object.entries(data.creatures)) {
      if (!CREATURES_BY_ID[id] || !isObj(c)) continue;
      state.creatures[id] = {
        happiness: Math.min(100, num(c.happiness, 70)),
        lastPet: num(c.lastPet),
        updatedAt: num(c.updatedAt, now),
        adoptedAt: num(c.adoptedAt, now),
      };
    }
  }

  if (isObj(data.quests)) {
    for (const [id, q] of Object.entries(data.quests)) {
      if (!QUESTS_BY_ID[id] || !isObj(q)) continue;
      state.quests[id] = { progress: num(q.progress), claimed: q.claimed === true, notified: q.notified === true };
    }
  }

  if (Array.isArray(data.orders)) {
    state.orders = data.orders.filter((o) =>
      isObj(o) && typeof o.id === 'string' && isObj(o.items) && Object.keys(o.items).length > 0 &&
      Object.entries(o.items).every(([id, q]) => CROPS_BY_ID[id] && num(q) > 0) && num(o.coins) > 0,
    ).map((o) => ({ id: o.id, from: String(o.from || 'A neighbour'), items: o.items, coins: o.coins, xp: num(o.xp) }));
  }

  if (isObj(data.stats)) for (const k of Object.keys(state.stats)) state.stats[k] = num(data.stats[k]);
  return state;
}

export function saveGame(state, storage) {
  try {
    state.lastSeen = Date.now();
    storage.setItem(CONFIG.SAVE_KEY, JSON.stringify({ ...state, version: CONFIG.SAVE_VERSION }));
    return true;
  } catch (err) {
    console.warn('Little Sprout could not save:', err);
    return false;
  }
}

// Returns { state, status } where status is "new", "loaded" or "recovered".
export function loadGame(storage, now = Date.now()) {
  let raw = null;
  try {
    raw = storage.getItem(CONFIG.SAVE_KEY);
  } catch {
    return { state: createNewState(now), status: 'new' };
  }
  if (!raw) return { state: createNewState(now), status: 'new' };
  try {
    const data = JSON.parse(raw);
    // Before an older save is upgraded, keep an untouched copy of it.
    const version = isObj(data) ? num(data.version, 1) : 1;
    if (version < CONFIG.SAVE_VERSION) {
      const backupKey = `${CONFIG.SAVE_KEY}-backup-v${version}`;
      try { if (!storage.getItem(backupKey)) storage.setItem(backupKey, raw); } catch { /* ignore */ }
    }
    return { state: sanitize(data, now), status: 'loaded' };
  } catch {
    // Keep a copy of the broken save, just in case, then start fresh.
    // An earlier broken copy is never replaced: a different one gets its own key.
    try {
      const old = storage.getItem(`${CONFIG.SAVE_KEY}-broken`);
      if (!old) storage.setItem(`${CONFIG.SAVE_KEY}-broken`, raw);
      else if (old !== raw) storage.setItem(`${CONFIG.SAVE_KEY}-broken-${now}`, raw);
    } catch { /* ignore */ }
    return { state: createNewState(now), status: 'recovered' };
  }
}

// ---------- Moving a garden between browsers (save files) ----------
// A save file is the normal save wrapped with a label, so it can be checked
// before use. Older plain saves (just the save object) are accepted too.

export const FILE_FORMAT = 'little-sprout-garden';

// Other copies the game may keep in this browser, besides the main save.
export const BACKUP_KEYS = [
  { key: `${CONFIG.SAVE_KEY}-before-import`, label: 'Your garden from just before you last loaded a file' },
  { key: `${CONFIG.SAVE_KEY}-before-reset`, label: 'Your garden from just before you last reset the farm' },
  { key: `${CONFIG.SAVE_KEY}-backup-v1`, label: 'Your garden from before the cottage update' },
  { key: `${CONFIG.SAVE_KEY}-broken`, label: 'A save that could not be read' },
];

export function exportText(state, now = Date.now()) {
  return JSON.stringify({
    format: FILE_FORMAT,
    exportedAt: new Date(now).toISOString(),
    save: { ...state, version: CONFIG.SAVE_VERSION },
  }, null, 1);
}

// A short description of a garden, to show before replacing anything.
export function summarize(state) {
  const total = (bag) => Object.values(bag || {}).reduce((a, b) => a + b, 0);
  return {
    level: state.level,
    xp: state.xp,
    coins: state.coins,
    seeds: total(state.seeds),
    produce: total(state.produce),
    growing: Object.values(state.plots).filter(Boolean).length,
    beds: state.unlockedBeds.length * 2,
    decorations: Object.keys(state.decor.placed).length + total(state.decor.owned),
    furniture: state.home.placed.length + total(state.home.owned),
    friends: Object.keys(state.creatures).length,
    quests: Object.values(state.quests).filter((q) => q.claimed).length,
  };
}

// Checks the text of a save file. Returns { ok, reason } or
// { ok, data, state, summary, exportedAt } without changing anything.
export function inspectSaveText(text, now = Date.now()) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "That file isn't a Little Sprout save (it can't be read)." };
  }
  const data = isObj(parsed) && parsed.format === FILE_FORMAT ? parsed.save : parsed;
  const looksRight = isObj(data) && typeof data.coins === 'number' && typeof data.xp === 'number' && isObj(data.plots);
  if (!looksRight) return { ok: false, reason: "That file isn't a Little Sprout save." };
  if (num(data.version, 1) > CONFIG.SAVE_VERSION) {
    return { ok: false, reason: 'That save comes from a newer version of the game. Update the game first, then try again.' };
  }
  const state = sanitize(data, now);
  return { ok: true, data, state, summary: summarize(state), exportedAt: isObj(parsed) && typeof parsed.exportedAt === 'string' ? parsed.exportedAt : null };
}

// Every Little Sprout save kept in this browser, with a summary of each.
export function listStoredSaves(storage, now = Date.now()) {
  const out = [];
  for (const { key, label } of [{ key: CONFIG.SAVE_KEY, label: 'Your current garden' }, ...BACKUP_KEYS]) {
    let raw = null;
    try { raw = storage.getItem(key); } catch { /* ignore */ }
    if (!raw) continue;
    const check = inspectSaveText(raw, now);
    out.push({ key, label, raw, ok: check.ok, summary: check.ok ? check.summary : null });
  }
  return out;
}

export function clearSave(storage) {
  // Keep one copy of the farm being reset, in case it was a mistake.
  try {
    const raw = storage.getItem(CONFIG.SAVE_KEY);
    if (raw) storage.setItem(`${CONFIG.SAVE_KEY}-before-reset`, raw);
  } catch { /* ignore */ }
  try { storage.removeItem(CONFIG.SAVE_KEY); } catch { /* ignore */ }
}
