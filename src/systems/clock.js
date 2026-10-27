// One place to ask "what time is it?". In development you can fast-forward
// time from the browser console with `sprout.warp(60)` (skips 60 seconds).
export const clock = {
  offset: 0,
  now() {
    return Date.now() + this.offset;
  },
};
