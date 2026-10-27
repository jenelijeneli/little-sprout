// Little Sprout starts here.
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/nunito/latin-600.css';
import '@fontsource/nunito/latin-800.css';
import './styles/main.css';
import './styles/garden.css';
import './styles/ui.css';
import './styles/art.css';
import './styles/house.css';

import { createGame } from './systems/game.js';
import { safeStorage } from './systems/saveManager.js';
import { clock } from './systems/clock.js';
import { createApp } from './components/app.js';

const game = createGame({ storage: safeStorage(), clock });
const app = createApp(game);

// Ask the browser to keep this garden's save even when the disk gets full.
// (Browsers may say no; the game works the same either way.)
navigator.storage?.persist?.().catch(() => {});

// Developer helpers, only available while running `npm run dev`.
// Open the browser console and try: sprout.warp(30) or sprout.coins(500)
if (import.meta.env.DEV) {
  window.sprout = {
    game,
    warp(seconds = 30) {
      clock.offset += seconds * 1000;
      game.tick();
      app.render();
      return `Skipped ahead ${seconds} seconds.`;
    },
    coins(amount = 100) {
      game.state.coins += amount;
      game.save();
      app.render();
      return `Added ${amount} coins.`;
    },
  };
}
