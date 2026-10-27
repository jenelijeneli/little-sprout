// Tests for the cottage update: new crops, furniture and save migration.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/systems/game.js';
import { growthDuration } from '../src/systems/crops.js';
import { findSpot, checkPlacement } from '../src/systems/home.js';
import { CONFIG } from '../src/data/config.js';
import { CROPS, CROPS_BY_ID } from '../src/data/cropsData.js';
import { FURNITURE_BY_ID, STARTER_FURNITURE } from '../src/data/furnitureData.js';
import { PLOTS, PATCHES } from '../src/data/gardenLayout.js';
import { existsSync } from 'node:fs';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
}
function fakeClock(start = 1_000_000) {
  return { t: start, now() { return this.t; }, advance(ms) { this.t += ms; } };
}
function newGame() {
  const storage = memoryStorage(), clock = fakeClock();
  return { game: createGame({ storage, clock }), storage, clock };
}

test('every crop has data, a category and all of its pictures', () => {
  assert.ok(CROPS.length >= 26);
  for (const c of CROPS) {
    assert.ok(['vegetable', 'fruit', 'flower'].includes(c.category), c.id);
    for (const k of ['seedCost', 'growSeconds', 'yield', 'sellPrice', 'xp', 'unlockLevel']) assert.ok(c[k] > 0, `${c.id}.${k}`);
    for (let s = 0; s < 4; s++) assert.ok(existsSync(`src/assets/crops/${c.id}-${s}.svg`), `${c.id}-${s}`);
    assert.ok(existsSync(`src/assets/produce/${c.id}.svg`) && existsSync(`src/assets/seeds/${c.id}.svg`), c.id);
  }
  assert.ok(CROPS.filter((c) => c.unlockLevel === 1).length >= 3, 'enough starter crops');
});

test('cabbage, turnip, eggplant and watermelon can be bought, grown, harvested and sold', () => {
  const { game, clock } = newGame();
  game.state.coins = 5000;
  game.state.xp = 500; // level 5
  game.tick();
  ['cabbage', 'turnip', 'eggplant', 'watermelon'].forEach((id, i) => {
    assert.ok(game.act('buySeeds', id, 1).ok, `buy ${id}`);
    assert.ok(game.act('plant', `plot-${i}`, id).ok, `plant ${id}`);
  });
  clock.advance(Math.max(...['cabbage', 'turnip', 'eggplant', 'watermelon'].map(growthDuration)) + 1000);
  ['cabbage', 'turnip', 'eggplant', 'watermelon'].forEach((id, i) => {
    const r = game.act('harvest', `plot-${i}`);
    assert.ok(r.ok, `harvest ${id}`);
    assert.ok(game.state.produce[id] >= CROPS_BY_ID[id].yield);
    const coins = game.state.coins;
    const n = game.state.produce[id];
    assert.ok(game.act('sell', id, n).ok);
    assert.equal(game.state.coins, coins + CROPS_BY_ID[id].sellPrice * n);
  });
});

test('thirsty crops get a bigger boost from water', () => {
  const { game, clock } = newGame();
  game.state.coins = 5000;
  game.state.xp = 500;
  game.tick();
  game.act('plant', 'plot-0', 'watermelon');
  game.act('plant', 'plot-1', 'pumpkin');
  game.act('water', 'plot-0');
  game.act('water', 'plot-1');
  clock.advance(10_000);
  game.tick();
  const melon = game.state.plots['plot-0'].progressMs, pumpkin = game.state.plots['plot-1'].progressMs;
  assert.ok(Math.abs(melon - 10_000 * CROPS_BY_ID.watermelon.waterSpeed) < 5);
  assert.ok(Math.abs(pumpkin - 10_000 * CONFIG.WATER_SPEED) < 5);
});

test('the garden has 12 beds of two plots and a third expansion', () => {
  assert.equal(PATCHES.length, 12);
  assert.equal(PLOTS.length, 24);
  const { game } = newGame();
  game.state.coins = 5000;
  game.state.xp = 2000;
  for (let i = 0; i < 3; i++) assert.ok(game.act('expand').ok);
  assert.equal(Object.keys(game.state.plots).length, 24);
  assert.equal(game.act('expand').ok, false);
});

test('a new cottage comes with starter furniture', () => {
  const { game } = newGame();
  assert.equal(game.state.home.placed.length, STARTER_FURNITURE.length);
  assert.deepEqual(game.state.home.owned, {});
});

test('furniture costs coins and cannot be bought without enough', () => {
  const { game } = newGame();
  game.state.coins = 30;
  const r = game.act('buyFurniture', 'wooden-chair');
  assert.equal(r.ok, false);
  assert.match(r.reason, /more coins/);
  assert.equal(game.state.coins, 30);
  game.state.coins = 100;
  assert.ok(game.act('buyFurniture', 'wooden-chair').ok);
  assert.equal(game.state.coins, 100 - FURNITURE_BY_ID['wooden-chair'].cost);
  assert.equal(game.state.home.owned['wooden-chair'], 1);
  assert.equal(game.act('buyFurniture', 'iron-stove').ok, false, 'locked by level');
});

test('furniture can be placed, refuses bad spots, moved, flipped and stored', () => {
  const { game } = newGame();
  game.state.coins = 1000;
  game.act('buyFurniture', 'wooden-chair');
  assert.equal(game.act('placeFurniture', 'wooden-chair', 'floor', 880, 560).ok, false, 'bed is there');
  assert.equal(game.act('placeFurniture', 'wooden-chair', 'floor', 5000, 600).ok, false, 'outside the room');
  assert.equal(game.act('placeFurniture', 'wooden-chair', 'floor', 200, 520).ok, false, 'hearth');
  assert.equal(game.act('placeFurniture', 'wooden-chair', 'wall', 600, 300).ok, false, 'chairs are not wall items');
  const r = game.act('placeFurniture', 'wooden-chair', 'floor', 420, 740);
  assert.ok(r.ok, r.reason);
  assert.equal(game.state.home.owned['wooden-chair'], undefined);
  const uid = r.placed.uid;
  assert.ok(game.act('moveFurniture', uid, 'floor', 200, 740, true).ok);
  const chair = game.state.home.placed.find((p) => p.uid === uid);
  assert.deepEqual([chair.x, chair.y, chair.flip], [200, 740, true]);
  assert.ok(game.act('flipFurniture', uid).ok);
  assert.equal(chair.flip, false);
  assert.ok(game.act('storeFurniture', uid).ok);
  assert.equal(game.state.home.owned['wooden-chair'], 1);
  assert.ok(game.act('placeFurniture', 'wooden-chair', 'floor', 300, 740).ok, 'stored furniture is reused without buying again');
});

test('table-top items sit on furniture and travel with it', () => {
  const { game } = newGame();
  game.state.coins = 1000;
  game.act('buyFurniture', 'flower-vase');
  const table = game.state.home.placed.find((p) => p.id === 'dining-table');
  assert.equal(game.act('placeFurniture', 'flower-vase', 'floor', 400, 700).ok, false, 'vases need a surface');
  const spot = findSpot(game.state, 'flower-vase', table.x + 20, table.y - 110);
  assert.equal(spot.kind, 'surface');
  assert.equal(spot.on, table.uid);
  assert.ok(spot.ok, spot.reason);
  const r = game.act('placeFurniture', 'flower-vase', spot.kind, spot.x, spot.y, false, spot.on);
  assert.ok(r.ok, r.reason);
  assert.ok(game.act('moveFurniture', table.uid, 'floor', table.x, 760).ok);
  const vase = game.state.home.placed.find((p) => p.id === 'flower-vase');
  assert.equal(vase.y, 760 - FURNITURE_BY_ID['dining-table'].surface.top);
  assert.ok(game.act('storeFurniture', table.uid).ok);
  assert.equal(game.state.home.owned['flower-vase'], 1, 'things on the table go to storage too');
  assert.equal(game.state.home.owned['dining-table'], 1);
});

test('wall items stay on the wall and off the window', () => {
  const { game } = newGame();
  const s = game.state;
  assert.equal(checkPlacement(s, 'framed-painting', 'wall', 620, 220).ok, false, 'window');
  assert.equal(checkPlacement(s, 'framed-painting', 'wall', 420, 600).ok, false, 'below the wall');
  assert.ok(checkPlacement(s, 'framed-painting', 'wall', 420, 240).ok);
});

test('furniture positions survive a reload', () => {
  const { game, storage, clock } = newGame();
  game.state.coins = 1000;
  game.act('buyFurniture', 'wall-lantern');
  game.act('placeFurniture', 'wall-lantern', 'wall', 900, 200);
  game.act('buyFurniture', 'potted-flowers');
  const again = createGame({ storage, clock });
  const lantern = again.state.home.placed.find((p) => p.id === 'wall-lantern');
  assert.deepEqual([lantern.x, lantern.y], [900, 200]);
  assert.equal(again.state.home.owned['potted-flowers'], 1);
  assert.equal(again.state.home.placed.length, game.state.home.placed.length);
  // Nothing is renumbered or reordered, so a table and the lamp on it stay together.
  assert.deepEqual(again.state.home, JSON.parse(JSON.stringify(game.state.home)));
});

test('a version 1 save upgrades without losing progress, and is backed up', () => {
  const storage = memoryStorage(), clock = fakeClock();
  const v1 = {
    version: 1, coins: 777, xp: 330, seeds: { carrot: 2, tomato: 1 }, produce: { pumpkin: 3 },
    unlockedBeds: ['meadow', 'sunny', 'brook', 'mossy', 'willow'],
    plots: { 'plot-0': { cropId: 'carrot', plantedAt: 1, progressMs: 5000, updatedAt: clock.t, wetUntil: 0 }, 'plot-19': { cropId: 'pumpkin', plantedAt: 1, progressMs: 1000, updatedAt: clock.t, wetUntil: 0 } },
    decor: { owned: { fence: 1 }, placed: { 'spot-4': 'lantern' } },
    creatures: { button: { happiness: 50, lastPet: 0, updatedAt: clock.t, adoptedAt: 1 }, posy: { happiness: 90, lastPet: 0, updatedAt: clock.t, adoptedAt: 1 } },
    quests: { 'carrot-patch': { progress: 5, claimed: true, notified: true } },
    stats: { planted: 9, harvested: 4, watered: 1, sold: 3, earned: 200, ordersDone: 1 },
  };
  const raw = JSON.stringify(v1);
  storage.setItem(CONFIG.SAVE_KEY, raw);
  const g = createGame({ storage, clock });
  const s = g.state;
  assert.equal(g.loadStatus, 'loaded');
  assert.equal(s.coins, 777);
  assert.equal(s.xp, 330);
  assert.deepEqual(s.seeds, { carrot: 2, tomato: 1 });
  assert.equal(s.produce.pumpkin, 3);
  assert.equal(s.plots['plot-0'].cropId, 'carrot');
  assert.equal(s.plots['plot-19'].cropId, 'pumpkin');
  assert.equal(Object.keys(s.plots).length, 20);
  assert.equal(s.decor.placed['spot-4'], 'lantern');
  assert.equal(s.creatures.posy.happiness > 80, true);
  assert.equal(s.quests['carrot-patch'].claimed, true);
  assert.equal(s.home.placed.length, STARTER_FURNITURE.length, 'old saves get the starter cottage');
  assert.equal(storage.getItem(`${CONFIG.SAVE_KEY}-backup-v1`), raw);
  g.save();
  assert.equal(JSON.parse(storage.getItem(CONFIG.SAVE_KEY)).version, CONFIG.SAVE_VERSION);
  assert.equal(storage.getItem(`${CONFIG.SAVE_KEY}-backup-v1`), raw, 'the backup is never overwritten');
});

test('broken furniture entries in a save go back to storage', () => {
  const storage = memoryStorage(), clock = fakeClock();
  storage.setItem(CONFIG.SAVE_KEY, JSON.stringify({ version: 2, coins: 10, home: { owned: { 'wooden-chair': 1, nonsense: 3 }, placed: [
    { uid: 4, id: 'bookshelf', kind: 'floor', x: 99999, y: 600 },
    { uid: 5, id: 'dining-table', kind: 'floor', x: 600, y: 700 },
    { uid: 6, id: 'flower-vase', kind: 'surface', x: 600, y: 0, on: 5 },
    { uid: 7, id: 'mystery', kind: 'floor', x: 300, y: 700 },
  ] } }));
  const s = createGame({ storage, clock }).state;
  assert.equal(s.home.owned.bookshelf, 1);
  assert.equal(s.home.owned['wooden-chair'], 1);
  assert.equal(s.home.owned.nonsense, undefined);
  const vase = s.home.placed.find((p) => p.id === 'flower-vase');
  const table = s.home.placed.find((p) => p.id === 'dining-table');
  assert.equal(vase.on, table.uid);
});
