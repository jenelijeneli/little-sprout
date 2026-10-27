// Where everything sits in the garden scene.
// Coordinates are in "scene units": the garden picture is 1200 x 800.
// Each plot position is the centre of its soil patch.
//
// The cottage stands in the top-left corner with mountains and the lake
// behind it, and twelve crop beds fill the meadow in front: four across and
// three deep, with a grassy aisle down the middle.

export const SCENE = { width: 1200, height: 800 };

// Columns and rows of the crop beds. Every bed holds two plots side by side.
const COLS = [150, 430, 770, 1050];
const ROWS = [406, 548, 688];
const PLOT_GAP = 56; // distance from a bed's centre to each plot's centre

// Twelve visible beds (garden patches), left to right, back to front.
export const PATCHES = ROWS.flatMap((y, r) => COLS.map((x, c) => ({ id: `patch-${r * 4 + c}`, x, y, row: r, col: c })));

// Beds are unlocked in "areas" of two neighbouring patches (four plots).
// The ids are kept from earlier versions of the game so old saves still match.
const AREA_NAMES = {
  meadow: 'Meadow Beds', sunny: 'Sunny Beds', brook: 'Brookside Beds',
  mossy: 'Mossy Beds', willow: 'Willow Beds', orchard: 'Orchard Beds',
};
const AREA_PATCHES = {
  meadow: [0, 1], sunny: [2, 3], brook: [4, 5], mossy: [6, 7], willow: [8, 9], orchard: [10, 11],
};
const TILTS = [-2, 2, 1, -2, 2, -1, -1, 3];

export const BEDS = Object.entries(AREA_PATCHES).map(([id, patchIdx], a) => ({
  id,
  name: AREA_NAMES[id],
  patches: patchIdx.map((i) => PATCHES[i].id),
  plots: patchIdx.flatMap((i, k) => [-1, 1].map((side, n) => ({
    x: PATCHES[i].x + side * PLOT_GAP,
    y: PATCHES[i].y + (n ? 2 : -2),
    tilt: TILTS[(a * 4 + k * 2 + n) % TILTS.length],
    patch: PATCHES[i].id,
  }))),
}));

// Flattened list of every plot with a stable id ("plot-0" ... "plot-23").
export const PLOTS = BEDS.flatMap((bed) => bed.plots.map((p) => ({ ...p, bed: bed.id })))
  .map((p, i) => ({ ...p, id: `plot-${i}` }));
for (const patch of PATCHES) patch.plots = PLOTS.filter((p) => p.patch === patch.id).map((p) => p.id);

// Spots in the front yard and the middle aisle where decorations can go.
export const DECOR_SPOTS = [
  { id: 'spot-0', x: 466, y: 330 },
  { id: 'spot-1', x: 760, y: 326 },
  { id: 'spot-2', x: 960, y: 326 },
  { id: 'spot-3', x: 600, y: 430 },
  { id: 'spot-4', x: 600, y: 580 },
  { id: 'spot-5', x: 600, y: 730 },
  { id: 'spot-6', x: 112, y: 336 },
  { id: 'spot-7', x: 372, y: 336 },
];

// Points on the grass aisles where creatures like to wander (feet position).
export const CREATURE_SPOTS = [
  { x: 120, y: 484 },
  { x: 330, y: 486 },
  { x: 880, y: 484 },
  { x: 1080, y: 486 },
  { x: 160, y: 634 },
  { x: 420, y: 636 },
  { x: 770, y: 634 },
  { x: 1040, y: 636 },
];

// Interactive scenery.
export const COTTAGE = { x: 20, y: 6, w: 440, h: 346, door: { x: 236, y: 250 } };
export const SCARECROW = { x: 1148, y: 338 };
export const GATE = { x: 600, y: 796 };
