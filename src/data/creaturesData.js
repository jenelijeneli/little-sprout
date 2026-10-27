// The garden friends. `bonus.max` is the bonus at 100% happiness;
// the bonus shrinks as happiness drops, so caring for them matters.

export const CREATURES = [
  {
    id: 'button',
    name: 'Button',
    species: 'Puffcap Mushroom',
    description: 'A cheerful little mushroom who loves damp soil and finding things.',
    cost: 0,
    unlockLevel: 1,
    favoriteCrop: 'carrot',
    bonus: { type: 'luckyHarvest', max: 0.3, text: 'chance of an extra item when harvesting' },
    petLines: ['Button wiggles happily!', 'Button giggles. Squish!', 'Button does a tiny hop.'],
  },
  {
    id: 'posy',
    name: 'Posy',
    species: 'Flower Sprite',
    description: 'A shy sprite who hums to the plants. Everything feels more rewarding with her around.',
    cost: 120,
    unlockLevel: 3,
    favoriteCrop: 'strawberry',
    bonus: { type: 'xp', max: 0.25, text: 'more experience from harvests' },
    petLines: ['Posy twirls in the air!', 'Posy hums a little tune.', 'Posy sprinkles pollen sparkles.'],
  },
  {
    id: 'sprig',
    name: 'Sprig',
    species: 'Leaf Dragon',
    description: 'A tiny dragon whose warm breath helps every plant grow a little faster.',
    cost: 300,
    unlockLevel: 5,
    favoriteCrop: 'sunflower',
    bonus: { type: 'growth', max: 0.2, text: 'faster growth for every crop' },
    petLines: ['Sprig purrs like a kettle!', 'Sprig flaps his leafy wings.', 'Sprig puffs a warm little breeze.'],
  },
];

export const CREATURES_BY_ID = Object.fromEntries(CREATURES.map((c) => [c.id, c]));
