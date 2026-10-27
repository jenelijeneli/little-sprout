// Quests are offered in this order, a few at a time.
// type: which gameplay event counts towards the quest
//   plant / harvest / water / sell / earn / pet / feed / order / placeDecor / adopt / expand / level
//   buyFurniture / placeFurniture
// crop: optional, only count that crop.
// reward: any of coins, xp, seeds ({ cropId: amount }).

export const QUESTS = [
  { id: 'carrot-patch', title: 'Carrot Patch', description: 'Plant 5 carrots.', type: 'plant', crop: 'carrot', target: 5, reward: { coins: 30, xp: 10 } },
  { id: 'first-harvest', title: 'First Harvest', description: 'Harvest 3 crops.', type: 'harvest', target: 3, reward: { coins: 25, xp: 10 } },
  { id: 'pocket-money', title: 'Pocket Money', description: 'Earn 100 coins.', type: 'earn', target: 100, reward: { xp: 15, seeds: { strawberry: 3 } } },
  { id: 'splish-splash', title: 'Splish Splash', description: 'Water 5 thirsty plants.', type: 'water', target: 5, reward: { coins: 20, xp: 8 } },
  { id: 'belly-rubs', title: 'Belly Rubs', description: 'Pet your garden friends 3 times.', type: 'pet', target: 3, reward: { coins: 15, xp: 10 } },
  { id: 'home-sweet-home', title: 'Home Sweet Home', description: 'Buy a piece of furniture for your cottage.', type: 'buyFurniture', target: 1, reward: { coins: 40, xp: 15 } },
  { id: 'special-delivery', title: 'Special Delivery', description: 'Complete 2 market orders.', type: 'order', target: 2, reward: { coins: 50, xp: 15 } },
  { id: 'make-it-home', title: 'Make It Pretty', description: 'Place a decoration in your garden.', type: 'placeDecor', target: 1, reward: { coins: 30, xp: 15 } },
  { id: 'growing-up', title: 'Growing Up', description: 'Reach level 3.', type: 'level', target: 3, reward: { coins: 50 } },
  { id: 'root-cellar', title: 'Root Cellar', description: 'Plant 4 turnips.', type: 'plant', crop: 'turnip', target: 4, reward: { coins: 40, xp: 15, seeds: { cabbage: 2 } } },
  { id: 'berry-nice', title: 'Berry Nice', description: 'Harvest 4 strawberry plants.', type: 'harvest', crop: 'strawberry', target: 4, reward: { coins: 40, xp: 20 } },
  { id: 'leafy-greens', title: 'Leafy Greens', description: 'Harvest 3 cabbages.', type: 'harvest', crop: 'cabbage', target: 3, reward: { coins: 60, xp: 20 } },
  { id: 'market-day', title: 'Market Day', description: 'Sell 15 pieces of produce.', type: 'sell', target: 15, reward: { coins: 40, xp: 15 } },
  { id: 'interior-designer', title: 'Interior Designer', description: 'Place 5 pieces of furniture in your cottage.', type: 'placeFurniture', target: 5, reward: { coins: 60, xp: 25 } },
  { id: 'new-friend', title: 'A New Friend', description: 'Adopt a new garden friend.', type: 'adopt', target: 1, reward: { coins: 60, xp: 20 } },
  { id: 'purple-pride', title: 'Purple Pride', description: 'Harvest 2 eggplant plants.', type: 'harvest', crop: 'eggplant', target: 2, reward: { coins: 60, xp: 25, seeds: { watermelon: 1 } } },
  { id: 'more-room', title: 'More Room to Grow', description: 'Expand your garden.', type: 'expand', target: 1, reward: { coins: 80, xp: 30 } },
  { id: 'snack-time', title: 'Snack Time', description: 'Feed your garden friends 3 times.', type: 'feed', target: 3, reward: { coins: 30, xp: 15 } },
  { id: 'melon-summer', title: 'Melon Summer', description: 'Harvest a watermelon.', type: 'harvest', crop: 'watermelon', target: 1, reward: { coins: 90, xp: 30 } },
  { id: 'orchard-keeper', title: 'Orchard Keeper', description: 'Harvest 3 apple trees.', type: 'harvest', crop: 'apple', target: 3, reward: { coins: 150, xp: 50 } },
  { id: 'big-earner', title: 'Big Earner', description: 'Earn 1,000 coins.', type: 'earn', target: 1000, reward: { coins: 150, xp: 50 } },
];

export const QUESTS_BY_ID = Object.fromEntries(QUESTS.map((q) => [q.id, q]));
