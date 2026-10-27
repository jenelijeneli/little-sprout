// Every crop in the game. To add a new crop:
//  1. Add an entry here with a new id.
//  2. Draw four stage pictures in src/assets/crops/<id>-0.svg ... <id>-3.svg,
//     a produce icon in src/assets/produce/<id>.svg and a seed packet in
//     src/assets/seeds/<id>.svg.
// Times are in seconds (scaled by CONFIG.GROWTH_TIME_SCALE).
//
// Fields:
//   category    'vegetable', 'fruit' or 'flower' (used for the shop tabs)
//   seedCost    coins for one seed        growSeconds  time to grow
//   yield       produce per harvest       sellPrice    coins per produce
//   xp          experience per harvest    unlockLevel  level needed for seeds
//   waterSpeed  optional: how much faster wet soil makes this crop grow
//               (defaults to CONFIG.WATER_SPEED)

export const CROP_CATEGORIES = [
  { id: 'vegetable', label: 'Vegetables' },
  { id: 'fruit', label: 'Fruits' },
  { id: 'flower', label: 'Flowers' },
];

export const CROPS = [
  { id: 'carrot', name: 'Carrot', plural: 'Carrots', category: 'vegetable', seedCost: 5, growSeconds: 30, yield: 1, sellPrice: 14, xp: 4, unlockLevel: 1,
    blurb: 'Quick and crunchy. A perfect first crop.' },
  { id: 'radish', name: 'Radish', plural: 'Radishes', category: 'vegetable', seedCost: 4, growSeconds: 25, yield: 1, sellPrice: 11, xp: 3, unlockLevel: 1,
    blurb: 'The speediest crop in the valley. Peppery and pink.' },
  { id: 'lettuce', name: 'Lettuce', plural: 'Lettuces', category: 'vegetable', seedCost: 6, growSeconds: 35, yield: 1, sellPrice: 17, xp: 5, unlockLevel: 1,
    blurb: 'A frilly green head for sandwiches and salads.' },
  { id: 'turnip', name: 'Turnip', plural: 'Turnips', category: 'vegetable', seedCost: 8, growSeconds: 40, yield: 1, sellPrice: 22, xp: 6, unlockLevel: 2,
    blurb: 'A round purple-topped root that peeks out of the soil.' },
  { id: 'onion', name: 'Onion', plural: 'Onions', category: 'vegetable', seedCost: 7, growSeconds: 50, yield: 2, sellPrice: 11, xp: 6, unlockLevel: 2,
    blurb: 'Two golden bulbs per plant. No tears, promise.' },
  { id: 'cabbage', name: 'Cabbage', plural: 'Cabbages', category: 'vegetable', seedCost: 14, growSeconds: 60, yield: 1, sellPrice: 40, xp: 10, unlockLevel: 3,
    blurb: 'A big leafy head wrapped in crinkly outer leaves.' },
  { id: 'potato', name: 'Potato', plural: 'Potatoes', category: 'vegetable', seedCost: 12, growSeconds: 55, yield: 3, sellPrice: 10, xp: 9, unlockLevel: 3,
    blurb: 'Dig up three lumpy potatoes from under the leaves.' },
  { id: 'garlic', name: 'Garlic', plural: 'Garlic bulbs', category: 'vegetable', seedCost: 11, growSeconds: 50, yield: 2, sellPrice: 14, xp: 8, unlockLevel: 3, waterSpeed: 1.3,
    blurb: 'Fine with less water: watering helps a little less.' },
  { id: 'tomato', name: 'Tomato', plural: 'Tomatoes', category: 'vegetable', seedCost: 18, growSeconds: 75, yield: 3, sellPrice: 12, xp: 11, unlockLevel: 3,
    blurb: 'Climbs its little stake and gives three tomatoes.' },
  { id: 'eggplant', name: 'Eggplant', plural: 'Eggplants', category: 'vegetable', seedCost: 20, growSeconds: 80, yield: 2, sellPrice: 24, xp: 13, unlockLevel: 4,
    blurb: 'Glossy purple fruit that hangs under the leaves.' },
  { id: 'cucumber', name: 'Cucumber', plural: 'Cucumbers', category: 'vegetable', seedCost: 16, growSeconds: 70, yield: 3, sellPrice: 11, xp: 12, unlockLevel: 4, waterSpeed: 1.7,
    blurb: 'Climbs a little ladder. Loves a drink: watering helps extra.' },
  { id: 'bellpepper', name: 'Bell pepper', plural: 'Bell peppers', category: 'vegetable', seedCost: 24, growSeconds: 90, yield: 2, sellPrice: 28, xp: 15, unlockLevel: 5,
    blurb: 'Sweet, crunchy and red as a postbox.' },
  { id: 'pumpkin', name: 'Pumpkin', plural: 'Pumpkins', category: 'vegetable', seedCost: 45, growSeconds: 180, yield: 1, sellPrice: 115, xp: 26, unlockLevel: 5,
    blurb: 'A big, proud, round pumpkin.' },
  { id: 'corn', name: 'Corn', plural: 'Corn cobs', category: 'vegetable', seedCost: 28, growSeconds: 110, yield: 2, sellPrice: 34, xp: 18, unlockLevel: 6,
    blurb: 'A tall stalk with golden cobs and a feathery tassel.' },
  { id: 'chili', name: 'Chili pepper', plural: 'Chili peppers', category: 'vegetable', seedCost: 30, growSeconds: 100, yield: 4, sellPrice: 15, xp: 18, unlockLevel: 6,
    blurb: 'A little bush covered in fiery red pods.' },
  { id: 'broccoli', name: 'Broccoli', plural: 'Broccoli heads', category: 'vegetable', seedCost: 34, growSeconds: 120, yield: 1, sellPrice: 82, xp: 20, unlockLevel: 7,
    blurb: 'A tree-shaped crown of tiny green buds.' },
  { id: 'strawberry', name: 'Strawberry', plural: 'Strawberries', category: 'fruit', seedCost: 10, growSeconds: 45, yield: 2, sellPrice: 12, xp: 7, unlockLevel: 2,
    blurb: 'Gives two sweet berries per harvest.' },
  { id: 'blueberry', name: 'Blueberry', plural: 'Blueberries', category: 'fruit', seedCost: 22, growSeconds: 90, yield: 4, sellPrice: 12, xp: 14, unlockLevel: 4,
    blurb: 'A round little bush dotted with blue berries.' },
  { id: 'raspberry', name: 'Raspberry', plural: 'Raspberries', category: 'fruit', seedCost: 26, growSeconds: 100, yield: 3, sellPrice: 18, xp: 16, unlockLevel: 5,
    blurb: 'Arching canes with soft, bumpy red berries.' },
  { id: 'watermelon', name: 'Watermelon', plural: 'Watermelons', category: 'fruit', seedCost: 40, growSeconds: 160, yield: 1, sellPrice: 105, xp: 24, unlockLevel: 5, waterSpeed: 1.7,
    blurb: 'A huge striped melon on a sprawling vine. Thirsty: watering helps extra.' },
  { id: 'grapes', name: 'Grapes', plural: 'Grape bunches', category: 'fruit', seedCost: 48, growSeconds: 170, yield: 3, sellPrice: 36, xp: 26, unlockLevel: 7,
    blurb: 'A vine on its own little arbor, heavy with purple bunches.' },
  { id: 'apple', name: 'Apple', plural: 'Apples', category: 'fruit', seedCost: 60, growSeconds: 200, yield: 4, sellPrice: 34, xp: 32, unlockLevel: 8,
    blurb: 'Grows into a little tree with shiny red apples.' },
  { id: 'pear', name: 'Pear', plural: 'Pears', category: 'fruit', seedCost: 64, growSeconds: 210, yield: 4, sellPrice: 36, xp: 34, unlockLevel: 8,
    blurb: 'A tall little tree with sweet golden-green pears.' },
  { id: 'peach', name: 'Peach', plural: 'Peaches', category: 'fruit', seedCost: 70, growSeconds: 220, yield: 4, sellPrice: 38, xp: 36, unlockLevel: 9,
    blurb: 'Soft, blushing peaches on a sunny little tree.' },
  { id: 'sunflower', name: 'Sunflower', plural: 'Sunflowers', category: 'flower', seedCost: 30, growSeconds: 120, yield: 1, sellPrice: 72, xp: 18, unlockLevel: 4,
    blurb: 'Slow to grow, but sells for a lot.' },
  { id: 'moonbloom', name: 'Moonbloom', plural: 'Moonblooms', category: 'flower', seedCost: 70, growSeconds: 240, yield: 1, sellPrice: 175, xp: 40, unlockLevel: 6,
    blurb: 'A rare flower that glows softly at its tips.' },
];

export const CROPS_BY_ID = Object.fromEntries(CROPS.map((c) => [c.id, c]));

// The four growth stages every crop goes through.
export const STAGES = ['Seed', 'Sprout', 'Growing', 'Ready to harvest'];
// A plant moves to the next stage at these fractions of its growth.
export const STAGE_THRESHOLDS = [0, 0.2, 0.55, 1];
