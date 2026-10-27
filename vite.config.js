import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths so the built game in dist/ works from any folder or web
  // address, including GitHub Pages (https://<you>.github.io/little-sprout/).
  base: './',
  server: { open: true },
  build: {
    // The game's hand-drawn SVG art is bundled into one file (about 280 kB
    // once compressed), which is fine for a game, so don't warn about it.
    chunkSizeWarningLimit: 2500,
  },
});
