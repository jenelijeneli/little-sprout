// Tiny helpers for "bags" of items, e.g. { carrot: 3, tomato: 1 }.

export function count(bag, id) {
  return bag[id] || 0;
}

export function add(bag, id, amount = 1) {
  bag[id] = count(bag, id) + amount;
}

// Returns false (and changes nothing) if there are not enough items.
export function remove(bag, id, amount = 1) {
  if (count(bag, id) < amount) return false;
  bag[id] -= amount;
  if (bag[id] <= 0) delete bag[id];
  return true;
}

export function total(bag) {
  return Object.values(bag).reduce((sum, n) => sum + n, 0);
}
