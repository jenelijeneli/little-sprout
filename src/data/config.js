// Game-wide tuning knobs. Change these to make the game faster, slower,
// easier or harder. Every number here is safe to edit.

export const CONFIG = {
  // Where the save lives in the browser's localStorage.
  SAVE_KEY: 'little-sprout-save',
  // Bump this only when the save format changes (see saveManager.js).
  // Version 2 added the cottage (home) and the orchard beds.
  SAVE_VERSION: 2,

  // Multiplies every crop's growth time. Crop times in cropsData.js are
  // short "testing" times; set this to 60 to turn seconds into minutes.
  GROWTH_TIME_SCALE: 1,

  STARTING_COINS: 60,
  STARTING_SEEDS: { carrot: 4 },

  // Watering rule: a watered plant grows 1.5x faster while the soil is wet.
  // The soil stays wet for 40% of that crop's normal growth time.
  WATER_SPEED: 1.5,
  WATER_DURATION_SHARE: 0.4,

  // Creature happiness slowly drifts down over real time.
  HAPPINESS_DECAY_PER_MINUTE: 0.5,
  PET_COOLDOWN_MS: 15000,
  PET_HAPPINESS: 8,
  FEED_HAPPINESS: 12,
  FEED_FAVORITE_HAPPINESS: 25,

  // How many quests are shown at once, and market orders on the board.
  ACTIVE_QUESTS: 3,
  ORDER_SLOTS: 3,
  // Orders pay this much more than selling the same produce in the shop.
  ORDER_BONUS: 1.6,

  MAX_LEVEL: 20,
  AUTOSAVE_MS: 10000,
};

// Total experience needed to reach a level: 20, 60, 120, 200, 300 ...
export function xpForLevel(level) {
  return 10 * level * (level - 1);
}

// Garden beds that start locked, and what it takes to open them.
export const EXPANSIONS = [
  { bed: 'mossy', level: 3, cost: 150 },
  { bed: 'willow', level: 5, cost: 400 },
  { bed: 'orchard', level: 7, cost: 700 },
];

export const STARTING_BEDS = ['meadow', 'sunny', 'brook'];
