// Run with: npm test
// Saving a garden to a file and loading it somewhere else (another browser,
// or the published website). Nothing may be lost or replaced without a backup.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/systems/game.js';
import { CONFIG } from '../src/data/config.js';
import { inspectSaveText } from '../src/systems/saveManager.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
}
function fakeClock(start = 1_000_000) {
  return { t: start, now() { return this.t; }, advance(ms) { this.t += ms; } };
}

// A garden with a bit of everything in it.
function playedGame() {
  const storage = memoryStorage(), clock = fakeClock();
  const game = createGame({ storage, clock });
  game.state.coins = 2000;
  game.act('plant', 'plot-0', 'carrot');
  game.act('plant', 'plot-1', 'carrot');
  clock.advance(10 * 60 * 1000);
  game.act('harvest', 'plot-0');
  game.act('plant', 'plot-2', 'carrot');
  game.act('buyDecor', 'fence');
  game.act('buyFurniture', 'wooden-chair');
  game.act('buyFurniture', 'dining-table');
  game.save();
  return { game, storage, clock };
}

// The parts of a garden a player would miss.
const keep = (s) => JSON.parse(JSON.stringify({
  coins: s.coins, xp: s.xp, level: s.level, plots: s.plots, seeds: s.seeds, produce: s.produce,
  unlockedBeds: s.unlockedBeds, decor: s.decor, home: s.home, creatures: Object.keys(s.creatures), quests: s.quests, stats: s.stats,
}));

test('a garden saved to a file loads elsewhere with nothing missing', () => {
  const { game: home, clock } = playedGame();
  const before = keep(home.state);
  const file = home.exportText();

  // Somewhere else: a brand-new garden at the same moment.
  const storage = memoryStorage();
  const web = createGame({ storage, clock: fakeClock(clock.t) });
  const check = web.inspectSaveText(file);
  assert.ok(check.ok);
  assert.equal(check.summary.coins, home.state.coins);
  assert.equal(check.summary.growing, 2);
  assert.ok(web.importSave(check.data).ok);
  assert.deepEqual(keep(web.state), before);

  // ...and it is really saved: a "refresh" (a new game on the same storage) still has it.
  const refreshed = createGame({ storage, clock: fakeClock(clock.t) });
  assert.equal(refreshed.loadStatus, 'loaded');
  assert.deepEqual(keep(refreshed.state), before);
});

test('loading a file keeps the garden it replaces as a backup', () => {
  const { game: home } = playedGame();
  const storage = memoryStorage(), clock = fakeClock();
  const web = createGame({ storage, clock });
  web.act('plant', 'plot-5', 'carrot');
  web.save();
  const replaced = storage.getItem(CONFIG.SAVE_KEY);
  web.importSave(web.inspectSaveText(home.exportText()).data);
  assert.equal(storage.getItem(`${CONFIG.SAVE_KEY}-before-import`), replaced);
  const backup = web.storedSaves().find((b) => b.key === `${CONFIG.SAVE_KEY}-before-import`);
  assert.ok(backup.ok);
  assert.ok(backup.summary.growing >= 1);
});

test('the file does not change the garden it came from', () => {
  const { game, storage } = playedGame();
  const saved = storage.getItem(CONFIG.SAVE_KEY);
  game.exportText();
  game.storedSaves();
  assert.equal(storage.getItem(CONFIG.SAVE_KEY), saved);
});

test('files that are not saves are turned away without changing anything', () => {
  const { game, storage } = playedGame();
  const saved = storage.getItem(CONFIG.SAVE_KEY);
  for (const text of ['', 'hello', '{"coins": "lots"}', '[]', '{"name": "my shopping list"}', '{"format":"little-sprout-garden","save":null}']) {
    const r = game.inspectSaveText(text);
    assert.equal(r.ok, false, text);
    assert.ok(r.reason);
  }
  assert.equal(storage.getItem(CONFIG.SAVE_KEY), saved);
});

test('a save from a newer version of the game is not loaded', () => {
  const { game } = playedGame();
  const file = JSON.parse(game.exportText());
  file.save.version = CONFIG.SAVE_VERSION + 1;
  const r = inspectSaveText(JSON.stringify(file));
  assert.equal(r.ok, false);
  assert.match(r.reason, /newer version/);
});

test('a plain save (no file label), even an old version 1 save, can be loaded', () => {
  const v1 = { version: 1, coins: 321, xp: 45, level: 2, plots: { 'plot-0': { cropId: 'carrot', plantedAt: 0, growMs: 1000 } }, seeds: { carrot: 3 }, produce: { carrot: 7 } };
  const r = inspectSaveText(JSON.stringify(v1), 5000);
  assert.ok(r.ok);
  assert.equal(r.summary.coins, 321);
  assert.equal(r.summary.produce, 7);
});

test('resetting the farm keeps one copy of the old garden', () => {
  const { game, storage } = playedGame();
  const saved = storage.getItem(CONFIG.SAVE_KEY);
  game.reset();
  assert.equal(storage.getItem(`${CONFIG.SAVE_KEY}-before-reset`), saved);
  assert.ok(game.storedSaves().some((b) => b.key.endsWith('-before-reset') && b.ok && b.summary.coins === JSON.parse(saved).coins));
});

test('an unreadable save is kept, and a second one never replaces the first copy', () => {
  const storage = memoryStorage();
  storage.setItem(CONFIG.SAVE_KEY, '{broken one');
  assert.equal(createGame({ storage, clock: fakeClock() }).loadStatus, 'recovered');
  assert.equal(storage.getItem(`${CONFIG.SAVE_KEY}-broken`), '{broken one');
  storage.setItem(CONFIG.SAVE_KEY, '{broken two');
  createGame({ storage, clock: fakeClock(2_000_000) });
  assert.equal(storage.getItem(`${CONFIG.SAVE_KEY}-broken`), '{broken one');
  assert.equal(storage.getItem(`${CONFIG.SAVE_KEY}-broken-2000000`), '{broken two');
});
