import { EXPANSIONS } from '../data/config.js';
import { PLOTS } from '../data/gardenLayout.js';
import { ok, fail } from './result.js';

// The next bed that can be unlocked, or null when the garden is full size.
export function nextExpansion(state) {
  return EXPANSIONS.find((e) => !state.unlockedBeds.includes(e.bed)) || null;
}

export function expand(state) {
  const next = nextExpansion(state);
  if (!next) return fail('Your garden is already as big as it can be!');
  if (state.level < next.level) return fail(`Reach level ${next.level} to clear more land.`);
  if (state.coins < next.cost) return fail(`You need ${next.cost - state.coins} more coins to clear this land.`);
  state.coins -= next.cost;
  state.unlockedBeds.push(next.bed);
  for (const p of PLOTS) if (p.bed === next.bed) state.plots[p.id] = null;
  return ok({ bed: next.bed, events: [{ type: 'expand', amount: 1 }] });
}
