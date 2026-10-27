import { CONFIG } from '../data/config.js';
import { CROPS_BY_ID, STAGE_THRESHOLDS } from '../data/cropsData.js';
import { add, remove, count } from './inventory.js';
import { addXp, isCropUnlocked } from './economy.js';
import { creatureBonus } from './creatures.js';
import { isPlotUnlocked } from './state.js';
import { ok, fail } from './result.js';

// How long a crop takes to grow, in milliseconds, without any bonuses.
export function growthDuration(cropId) {
  return CROPS_BY_ID[cropId].growSeconds * 1000 * CONFIG.GROWTH_TIME_SCALE;
}

function speed(state) {
  return 1 + creatureBonus(state, 'growth');
}

// How much faster wet soil makes this crop grow (some crops are thirstier).
export function waterSpeed(cropId) {
  return CROPS_BY_ID[cropId].waterSpeed ?? CONFIG.WATER_SPEED;
}

// Moves a plant's growth forward to `now`. Growth is calculated from the
// real time that has passed, so plants keep growing while the game is closed.
// While the soil is wet the plant grows waterSpeed() times faster.
export function advancePlot(state, plot, now) {
  if (!plot) return;
  const total = growthDuration(plot.cropId);
  const elapsed = Math.max(0, now - plot.updatedAt);
  const wetTime = Math.min(elapsed, Math.max(0, plot.wetUntil - plot.updatedAt));
  const rate = speed(state);
  const gained = (elapsed - wetTime) * rate + wetTime * rate * waterSpeed(plot.cropId);
  plot.progressMs = Math.min(total, plot.progressMs + gained);
  plot.updatedAt = Math.max(plot.updatedAt, now);
}

export function advanceAll(state, now) {
  for (const plot of Object.values(state.plots)) advancePlot(state, plot, now);
}

// Everything the screen needs to know about one plot.
export function plotInfo(state, plotId, now) {
  const plot = state.plots[plotId];
  if (!isPlotUnlocked(state, plotId)) return { locked: true };
  if (!plot) return { empty: true };
  const total = growthDuration(plot.cropId);
  const fraction = Math.min(1, plot.progressMs / total);
  let stage = 0;
  STAGE_THRESHOLDS.forEach((t, i) => { if (fraction >= t) stage = i; });
  const mature = fraction >= 1;
  const wet = !mature && plot.wetUntil > now;
  // Estimate the time left, using the current growth speed and wet soil.
  const rate = speed(state);
  let remaining = total - plot.progressMs;
  let ms = 0;
  if (wet) {
    const wetLeft = plot.wetUntil - now;
    const boost = waterSpeed(plot.cropId);
    const wetGrowth = wetLeft * rate * boost;
    if (wetGrowth >= remaining) ms = remaining / (rate * boost);
    else ms = wetLeft + (remaining - wetGrowth) / rate;
  } else {
    ms = remaining / rate;
  }
  return {
    crop: CROPS_BY_ID[plot.cropId], stage, fraction, mature, wet,
    thirsty: !mature && !wet,
    remainingMs: mature ? 0 : ms,
    wetLeftMs: wet ? plot.wetUntil - now : 0,
  };
}

export function plant(state, plotId, cropId, now) {
  const crop = CROPS_BY_ID[cropId];
  if (!crop) return fail('Unknown seed.');
  if (!isPlotUnlocked(state, plotId)) return fail('That patch is still overgrown. Expand your garden first.');
  if (state.plots[plotId]) return fail('Something is already growing there.');
  if (!isCropUnlocked(state, cropId)) return fail(`${crop.name} unlocks at level ${crop.unlockLevel}.`);
  let paid = 0;
  if (count(state.seeds, cropId) > 0) {
    remove(state.seeds, cropId, 1);
  } else if (state.coins >= crop.seedCost) {
    state.coins -= crop.seedCost;
    paid = crop.seedCost;
  } else {
    return fail(`No ${crop.name.toLowerCase()} seeds, and you need ${crop.seedCost - state.coins} more coins to buy one.`);
  }
  state.plots[plotId] = { cropId, plantedAt: now, progressMs: 0, updatedAt: now, wetUntil: 0 };
  state.stats.planted += 1;
  return ok({ plotId, cropId, paid, events: [{ type: 'plant', crop: cropId, amount: 1 }] });
}

export function water(state, plotId, now) {
  const plot = state.plots[plotId];
  if (!plot) return fail('There is nothing planted here to water.');
  advancePlot(state, plot, now);
  const info = plotInfo(state, plotId, now);
  if (info.mature) return fail('This one is ready! Harvest it instead.');
  if (info.wet) return fail(`The soil is still wet for ${Math.ceil(info.wetLeftMs / 1000)}s.`);
  plot.wetUntil = now + growthDuration(plot.cropId) * CONFIG.WATER_DURATION_SHARE;
  state.stats.watered += 1;
  return ok({ plotId, events: [{ type: 'water', crop: plot.cropId, amount: 1 }] });
}

export function harvest(state, plotId, now, rng = Math.random) {
  const plot = state.plots[plotId];
  if (!plot) return fail('There is nothing to harvest here.');
  advancePlot(state, plot, now);
  const info = plotInfo(state, plotId, now);
  if (!info.mature) return fail(`Not ready yet. ${info.crop.name} needs a little more time.`);
  const crop = info.crop;
  // Button the mushroom sometimes finds an extra item.
  const extra = rng() < creatureBonus(state, 'luckyHarvest') ? 1 : 0;
  const qty = crop.yield + extra;
  add(state.produce, crop.id, qty);
  // Posy the sprite makes harvests worth more experience.
  const xp = addXp(state, crop.xp * (1 + creatureBonus(state, 'xp')));
  state.plots[plotId] = null;
  state.stats.harvested += 1;
  return ok({ plotId, cropId: crop.id, qty, extra, xp, events: [{ type: 'harvest', crop: crop.id, amount: 1 }] });
}
