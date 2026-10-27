// Decorations the player can buy and place on the garden paths.

export const DECORATIONS = [
  { id: 'stepping-stone', name: 'Stepping Stones', cost: 25, unlockLevel: 1, blurb: 'Mossy stones for tiny feet.' },
  { id: 'fence', name: 'Wooden Fence', cost: 40, unlockLevel: 1, blurb: 'A rustic little fence.' },
  { id: 'garden-sign', name: 'Garden Sign', cost: 35, unlockLevel: 2, blurb: 'Tell the world whose garden this is.' },
  { id: 'flower-pot', name: 'Flower Pot', cost: 60, unlockLevel: 2, blurb: 'A terracotta pot full of blossoms.' },
  { id: 'berry-bush', name: 'Berry Bush', cost: 90, unlockLevel: 3, blurb: 'Round, bushy and dotted with berries.' },
  { id: 'lantern', name: 'Garden Lantern', cost: 120, unlockLevel: 4, blurb: 'A warm glow for cosy evenings.' },
];

export const DECOR_BY_ID = Object.fromEntries(DECORATIONS.map((d) => [d.id, d]));
