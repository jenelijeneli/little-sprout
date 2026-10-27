// Run with: npm test
// These tests drive the game rules directly (no browser needed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/systems/game.js';
import { plotInfo, growthDuration } from '../src/systems/crops.js';
import { CONFIG } from '../src/data/config.js';

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

test('a new game starts with coins, carrot seeds, 12 plots and Button', () => {
  const { game } = newGame();
  assert.equal(game.state.coins, CONFIG.STARTING_COINS);
  assert.equal(game.state.seeds.carrot, 4);
  assert.equal(Object.keys(game.state.plots).length, 12);
  assert.ok(game.state.creatures.button);
  assert.equal(game.state.orders.length, CONFIG.ORDER_SLOTS);
});

test('planting uses a seed first, then coins', () => {
  const { game } = newGame();
  assert.ok(game.act('plant', 'plot-0', 'carrot').ok);
  assert.equal(game.state.seeds.carrot, 3);
  assert.equal(game.act('plant', 'plot-0', 'carrot').ok, false, 'cannot plant on an occupied plot');
  for (const id of ['plot-1', 'plot-2', 'plot-3']) game.act('plant', id, 'carrot');
  assert.equal(game.state.seeds.carrot, undefined);
  const coins = game.state.coins;
  assert.ok(game.act('plant', 'plot-4', 'carrot').ok);
  assert.equal(game.state.coins, coins - 5);
});

test('locked crops and locked plots cannot be planted', () => {
  const { game } = newGame();
  const r = game.act('plant', 'plot-0', 'sunflower');
  assert.equal(r.ok, false);
  assert.match(r.reason, /level 4/);
  assert.equal(game.act('plant', 'plot-12', 'carrot').ok, false);
});

test('crops grow with real time through four stages and harvest only when mature', () => {
  const { game, clock } = newGame();
  game.act('plant', 'plot-0', 'carrot');
  const total = growthDuration('carrot');
  assert.equal(plotInfo(game.state, 'plot-0', clock.now()).stage, 0);
  assert.equal(game.act('harvest', 'plot-0').ok, false, 'not mature yet');
  const stages = new Set();
  for (let i = 0; i < 10; i++) {
    clock.advance(total / 10);
    game.tick();
    stages.add(plotInfo(game.state, 'plot-0', clock.now()).stage);
  }
  for (const s of [1, 2, 3]) assert.ok(stages.has(s), `passed through stage ${s}`);
  assert.ok(plotInfo(game.state, 'plot-0', clock.now()).mature);
  const r = game.act('harvest', 'plot-0');
  assert.ok(r.ok);
  assert.ok(game.state.produce.carrot >= 1);
  assert.ok(game.state.xp > 0);
  assert.equal(game.state.plots['plot-0'], null);
});

test('watering makes a crop finish sooner and cannot be repeated while wet', () => {
  const { game, clock } = newGame();
  game.act('plant', 'plot-0', 'carrot');
  game.act('plant', 'plot-1', 'carrot');
  assert.ok(game.act('water', 'plot-0').ok);
  assert.equal(game.act('water', 'plot-0').ok, false);
  clock.advance(growthDuration('carrot') * 0.85);
  game.tick();
  const wet = plotInfo(game.state, 'plot-0', clock.now());
  const dry = plotInfo(game.state, 'plot-1', clock.now());
  assert.ok(wet.fraction > dry.fraction, 'watered crop is further along');
});

test('growth catches up after the game was closed', () => {
  const { game, storage, clock } = newGame();
  game.act('plant', 'plot-0', 'carrot');
  clock.advance(growthDuration('carrot') + 1000);
  const reopened = createGame({ storage, clock });
  assert.ok(plotInfo(reopened.state, 'plot-0', clock.now()).mature);
});

test('buying seeds checks coins and selling earns coins', () => {
  const { game } = newGame();
  const before = game.state.coins;
  assert.ok(game.act('buySeeds', 'carrot', 2).ok);
  assert.equal(game.state.coins, before - 10);
  game.state.coins = 3;
  const r = game.act('buySeeds', 'carrot', 1);
  assert.equal(r.ok, false);
  assert.match(r.reason, /more coins/);
  game.state.produce.carrot = 2;
  assert.ok(game.act('sell', 'carrot', 2).ok);
  assert.equal(game.state.coins, 3 + 28);
  assert.equal(game.act('sell', 'carrot', 1).ok, false);
});

test('quests track progress and can only be claimed once', () => {
  const { game } = newGame();
  game.state.coins = 500;
  for (let i = 0; i < 5; i++) game.act('plant', `plot-${i}`, 'carrot');
  const q = game.state.quests['carrot-patch'];
  assert.equal(q.progress, 5);
  const coins = game.state.coins;
  assert.ok(game.act('claimQuest', 'carrot-patch').ok);
  assert.equal(game.state.coins, coins + 30);
  assert.equal(game.act('claimQuest', 'carrot-patch').ok, false);
  assert.equal(game.act('claimQuest', 'first-harvest').ok, false, 'unfinished quest cannot be claimed');
});

test('creatures can be petted (with cooldown) and fed', () => {
  const { game, clock } = newGame();
  const h = game.state.creatures.button.happiness;
  assert.ok(game.act('pet', 'button').ok);
  assert.ok(game.state.creatures.button.happiness > h);
  assert.equal(game.act('pet', 'button').ok, false, 'cooldown');
  clock.advance(CONFIG.PET_COOLDOWN_MS + 1);
  assert.ok(game.act('pet', 'button').ok);
  assert.equal(game.act('feed', 'button', 'carrot').ok, false, 'no produce yet');
  game.state.produce.carrot = 1;
  game.state.creatures.button.happiness = 40;
  const r = game.act('feed', 'button', 'carrot');
  assert.ok(r.ok && r.favorite);
  assert.equal(game.act('adopt', 'sprig').ok, false, 'sprig is locked at level 1');
});

test('decorations can be bought, placed and picked up', () => {
  const { game } = newGame();
  assert.equal(game.act('placeDecor', 'spot-0', 'fence').ok, false);
  assert.ok(game.act('buyDecor', 'fence').ok);
  assert.ok(game.act('placeDecor', 'spot-0', 'fence').ok);
  assert.equal(game.state.decor.placed['spot-0'], 'fence');
  assert.ok(game.act('pickUpDecor', 'spot-0').ok);
  assert.equal(game.state.decor.owned.fence, 1);
});

test('garden expansion needs the right level and coins', () => {
  const { game } = newGame();
  game.state.coins = 1000;
  assert.equal(game.act('expand').ok, false);
  game.state.xp = 60;
  const r = game.act('expand');
  assert.ok(r.ok);
  assert.equal(Object.keys(game.state.plots).length, 16);
});

test('market orders pay out and refill', () => {
  const { game } = newGame();
  const order = game.state.orders[0];
  assert.equal(game.act('fulfilOrder', order.id).ok, false);
  for (const [id, q] of Object.entries(order.items)) game.state.produce[id] = q;
  const coins = game.state.coins;
  assert.ok(game.act('fulfilOrder', order.id).ok);
  assert.equal(game.state.coins, coins + order.coins);
  assert.equal(game.state.orders.length, CONFIG.ORDER_SLOTS);
});

test('saves restore everything, and broken or old saves load safely', () => {
  const { game, storage, clock } = newGame();
  game.act('plant', 'plot-3', 'carrot');
  game.act('buyDecor', 'fence');
  game.act('placeDecor', 'spot-2', 'fence');
  const again = createGame({ storage, clock });
  assert.equal(again.state.plots['plot-3'].cropId, 'carrot');
  assert.equal(again.state.decor.placed['spot-2'], 'fence');
  assert.equal(again.state.coins, game.state.coins);

  storage.setItem(CONFIG.SAVE_KEY, '{not json');
  const broken = createGame({ storage, clock });
  assert.equal(broken.loadStatus, 'recovered');
  assert.equal(broken.state.coins, CONFIG.STARTING_COINS);

  storage.setItem(CONFIG.SAVE_KEY, JSON.stringify({ coins: 99, seeds: { carrot: 2, mysteryBean: 5 }, plots: { 'plot-0': { cropId: 'nope' } }, creatures: 'oops' }));
  const old = createGame({ storage, clock });
  assert.equal(old.state.coins, 99);
  assert.deepEqual(old.state.seeds, { carrot: 2 });
  assert.equal(old.state.plots['plot-0'], null);
  assert.ok(old.state.creatures.button);
});

test('reset wipes progress', () => {
  const { game, storage, clock } = newGame();
  game.act('plant', 'plot-0', 'carrot');
  game.reset();
  assert.equal(game.state.plots['plot-0'], null);
  assert.equal(createGame({ storage, clock }).state.seeds.carrot, 4);
});

test('a broke player gets a care package', () => {
  const { game } = newGame();
  game.state.seeds = {};
  game.state.coins = 0;
  const r = game.act('pet', 'button');
  assert.ok(r.carePackage);
  assert.equal(game.state.seeds.carrot, 3);
});
