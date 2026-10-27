import { CONFIG } from '../data/config.js';
import { QUESTS, QUESTS_BY_ID } from '../data/questsData.js';
import { add } from './inventory.js';
import { addXp, earnCoins } from './economy.js';
import { ok, fail } from './result.js';

function record(state, id) {
  if (!state.quests[id]) state.quests[id] = { progress: 0, claimed: false, notified: false };
  return state.quests[id];
}

// The quests currently on the board: the first few that are not yet claimed.
export function activeQuestIds(state) {
  return QUESTS.filter((q) => !state.quests[q.id]?.claimed).slice(0, CONFIG.ACTIVE_QUESTS).map((q) => q.id);
}

export function questProgress(state, id) {
  const q = QUESTS_BY_ID[id];
  const r = state.quests[id];
  const progress = Math.min(q.target, r ? r.progress : 0);
  return { quest: q, progress, complete: progress >= q.target, claimed: !!r?.claimed };
}

// Counts gameplay events towards the active quests. Returns the ids of
// quests that just became complete (so the screen can celebrate).
export function trackQuests(state, events, activeIds = activeQuestIds(state)) {
  const justCompleted = [];
  for (const id of activeIds) {
    const q = QUESTS_BY_ID[id];
    const r = record(state, id);
    if (r.claimed) continue;
    if (q.type === 'level') {
      r.progress = state.level;
    } else {
      for (const e of events) {
        if (e.type !== q.type) continue;
        if (q.crop && e.crop !== q.crop) continue;
        r.progress += e.amount ?? 1;
      }
    }
    if (r.progress >= q.target && !r.notified) {
      r.notified = true;
      justCompleted.push(id);
    }
  }
  return justCompleted;
}

export function claimQuest(state, id) {
  const q = QUESTS_BY_ID[id];
  if (!q) return fail('Unknown quest.');
  if (!activeQuestIds(state).includes(id)) return fail('That quest is not on your board.');
  const r = record(state, id);
  if (r.claimed) return fail('You already claimed this reward.');
  if (r.progress < q.target) return fail('Keep going, this quest is not finished yet.');
  r.claimed = true;
  const events = [];
  const reward = q.reward;
  if (reward.coins) earnCoins(state, reward.coins, events);
  const xp = reward.xp ? addXp(state, reward.xp) : 0;
  if (reward.seeds) for (const [cropId, n] of Object.entries(reward.seeds)) add(state.seeds, cropId, n);
  return ok({ id, reward, xp, events });
}
