// The inside of the cottage. Like the garden, the room is a 1200 x 800 picture
// and every position is in those "room units".
//
// The room is seen from the front: the back wall fills the top part and the
// wooden floor the bottom part. Furniture snaps to an invisible GRID.

export const ROOM = { width: 1200, height: 800 };
export const GRID = 10;

// Where wall decorations may hang (their whole picture must fit inside).
export const WALL = { left: 24, right: 1176, top: 78, bottom: 462 };
// Where furniture may stand. `back` is where the floor meets the wall.
export const FLOOR = { left: 20, right: 1180, back: 470, front: 784 };
// Hanging lights hang from this beam.
export const CEILING_Y = 58;

// Parts of the room that are built in, so nothing can be placed over them.
export const BLOCKED = {
  wall: [
    { name: 'the fireplace', x1: 80, y1: 120, x2: 340, y2: 470 },
    { name: 'the window', x1: 500, y1: 118, x2: 740, y2: 336 },
    { name: 'the door', x1: 1028, y1: 226, x2: 1172, y2: 470 },
  ],
  floor: [
    { name: 'the hearth', x1: 70, y1: 470, x2: 350, y2: 530 },
    { name: 'the doorway', x1: 1020, y1: 470, x2: 1180, y2: 560 },
  ],
};

// The door back to the garden (a clickable spot in the room picture).
export const EXIT_DOOR = { x: 1100, y: 348, w: 140, h: 244 };
