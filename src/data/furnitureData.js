// Everything you can buy for the cottage. To add an item, add an entry here
// and draw src/assets/furniture/<id>.svg (the picture fills its w x h box).
//
// place:   where it can go (one or more of these)
//   'floor'    stands on the floor; w = width, h = picture height,
//              depth = how much floor it covers behind its front edge
//   'rug'      lies flat on the floor under other furniture
//   'wall'     hangs on the back wall
//   'ceiling'  hangs from the ceiling beam
//   'surface'  sits on top of furniture that has a `surface`
// solid:   floor items that can't overlap other solid items
// surface: { top, width } for furniture other items can sit on:
//          top = height of the tabletop above the floor, width = usable width
// Sizes are in room units (the room is 1200 x 800).

export const FURNITURE_CATEGORIES = [
  { id: 'furniture', label: 'Furniture' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'decor', label: 'Decorations' },
  { id: 'special', label: 'Special' },
];

export const FURNITURE = [
  // ---- Furniture ----
  { id: 'wooden-bed', name: 'Wooden bed', category: 'furniture', cost: 180, unlockLevel: 1, place: ['floor'], w: 250, h: 170, depth: 90, solid: true,
    surface: { top: 74, width: 150 }, blurb: 'A snug bed with a patchwork quilt.' },
  { id: 'dining-table', name: 'Small dining table', category: 'furniture', cost: 90, unlockLevel: 1, place: ['floor'], w: 160, h: 96, depth: 50, solid: true,
    surface: { top: 90, width: 140 }, blurb: 'A round-edged table for two. Things can sit on top.' },
  { id: 'wooden-chair', name: 'Wooden chair', category: 'furniture', cost: 35, unlockLevel: 1, place: ['floor'], w: 64, h: 112, depth: 30, solid: true,
    blurb: 'A sturdy chair with a heart cut into the back.' },
  { id: 'bedside-table', name: 'Bedside table', category: 'furniture', cost: 45, unlockLevel: 1, place: ['floor'], w: 66, h: 74, depth: 30, solid: true,
    surface: { top: 70, width: 56 }, blurb: 'A little cabinet with a drawer. Perfect for a lamp.' },
  { id: 'bookshelf', name: 'Bookshelf', category: 'furniture', cost: 140, unlockLevel: 2, place: ['floor'], w: 124, h: 232, depth: 34, solid: true,
    blurb: 'Tall shelves full of well-loved books.' },
  { id: 'cozy-sofa', name: 'Cozy sofa', category: 'furniture', cost: 220, unlockLevel: 3, place: ['floor'], w: 220, h: 116, depth: 64, solid: true,
    surface: { top: 60, width: 160 }, blurb: 'A squashy green sofa. Add cushions on top!' },
  { id: 'wardrobe', name: 'Wardrobe', category: 'furniture', cost: 200, unlockLevel: 4, place: ['floor'], w: 136, h: 254, depth: 44, solid: true,
    blurb: 'Painted doors with little flower knobs.' },

  // ---- Lighting ----
  { id: 'wall-lantern', name: 'Wall lantern', category: 'lighting', cost: 40, unlockLevel: 1, place: ['wall'], w: 54, h: 86,
    blurb: 'A brass lantern with a warm glow.' },
  { id: 'table-lamp', name: 'Table lamp', category: 'lighting', cost: 50, unlockLevel: 2, place: ['surface'], w: 46, h: 70,
    blurb: 'A mushroom-shaped lamp. Put it on a table or bedside table.' },
  { id: 'hanging-light', name: 'Hanging light', category: 'lighting', cost: 70, unlockLevel: 3, place: ['ceiling'], w: 76, h: 160,
    blurb: 'A woven shade hanging from the beam.' },

  // ---- Decorations ----
  { id: 'potted-flowers', name: 'Potted flowers', category: 'decor', cost: 25, unlockLevel: 1, place: ['floor', 'surface'], w: 58, h: 72, depth: 22, solid: true,
    blurb: 'Cheerful daisies in a clay pot. Floor or table.' },
  { id: 'flower-vase', name: 'Flower vase', category: 'decor', cost: 30, unlockLevel: 1, place: ['surface'], w: 40, h: 64,
    blurb: 'A blue vase of freshly picked tulips.' },
  { id: 'framed-painting', name: 'Framed painting', category: 'decor', cost: 60, unlockLevel: 1, place: ['wall'], w: 112, h: 88,
    blurb: 'A painting of the valley and its mountains.' },
  { id: 'round-rug', name: 'Round rug', category: 'decor', cost: 55, unlockLevel: 1, place: ['rug'], w: 300, h: 96,
    blurb: 'A braided rug in warm colours.' },
  { id: 'stripe-rug', name: 'Striped runner', category: 'decor', cost: 45, unlockLevel: 2, place: ['rug'], w: 220, h: 70,
    blurb: 'A long striped rug for a sunny spot.' },
  { id: 'wall-clock', name: 'Wall clock', category: 'decor', cost: 65, unlockLevel: 2, place: ['wall'], w: 62, h: 86,
    blurb: 'Tick, tock. A cuckoo clock with a tiny bird.' },
  { id: 'cushions', name: 'Cushions', category: 'decor', cost: 30, unlockLevel: 2, place: ['surface'], w: 62, h: 40,
    blurb: 'Two plump cushions for a sofa or bed.' },
  { id: 'wall-shelf', name: 'Wall shelf', category: 'decor', cost: 50, unlockLevel: 2, place: ['wall'], w: 134, h: 64,
    blurb: 'A little shelf with jars and a teapot.' },
  { id: 'indoor-plant', name: 'Indoor plant', category: 'decor', cost: 70, unlockLevel: 3, place: ['floor'], w: 76, h: 150, depth: 26, solid: true,
    blurb: 'A leafy plant in a woven basket.' },

  // ---- Special ----
  { id: 'iron-stove', name: 'Cast-iron stove', category: 'special', cost: 320, unlockLevel: 6, place: ['floor'], w: 116, h: 196, depth: 52, solid: true,
    surface: { top: 98, width: 80 }, blurb: 'A cosy wood-burning stove with a copper kettle spot.' },
  { id: 'pot-rack', name: 'Copper pot rack', category: 'special', cost: 110, unlockLevel: 4, place: ['wall'], w: 150, h: 82,
    blurb: 'Shiny pans and a ladle, ready for soup.' },
  { id: 'harvest-wreath', name: 'Harvest wreath', category: 'special', cost: 90, unlockLevel: 5, place: ['wall'], w: 88, h: 88,
    blurb: 'Wheat, leaves and tiny pumpkins. A seasonal favourite.' },
  { id: 'pumpkin-trio', name: 'Pumpkin trio', category: 'special', cost: 75, unlockLevel: 5, place: ['floor'], w: 100, h: 66, depth: 24, solid: true,
    blurb: 'Three little pumpkins for the autumn.' },
  { id: 'fairy-lights', name: 'Fairy lights', category: 'special', cost: 95, unlockLevel: 4, place: ['wall'], w: 280, h: 44,
    blurb: 'A string of twinkly lights. Very festive.' },
];

export const FURNITURE_BY_ID = Object.fromEntries(FURNITURE.map((f) => [f.id, f]));

// The cottage is not empty when you move in.
export const STARTER_FURNITURE = [
  { id: 'round-rug', x: 620, y: 650 },
  { id: 'wooden-bed', x: 880, y: 560 },
  { id: 'dining-table', x: 610, y: 660 },
  { id: 'wooden-chair', x: 490, y: 670 },
];
