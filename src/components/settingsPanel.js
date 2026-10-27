// Settings: saving, motion, how to play, and resetting the farm.
import { icon } from '../assets/index.js';
import { CONFIG } from '../data/config.js';

export const settingsPanel = {
  id: 'settings',
  title: 'Settings',
  icon: 'gear',
  render(game, ui) {
    const saved = game.lastSaved ? new Date(game.lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'not yet';
    return `
      <section><h3>Saving</h3>
        <p class="hint">Your garden saves itself in this browser after every action. Last save: <b>${saved}</b>.</p>
        <p class="hint">Your garden lives only in this browser on this device. Friends who open the same link get their own garden, and switching browser or device starts a new one. Clearing browsing data deletes it.</p>
        <button type="button" class="btn btn-small" data-action="save-now">${icon('check', 'icon icon-sm')}Save now</button>
      </section>
      <section><h3>Comfort</h3>
        <label class="toggle"><input type="checkbox" data-action="toggle-motion" ${ui.reduceMotion ? 'checked' : ''} /> Reduce motion (fewer animations)</label>
      </section>
      <section><h3>How to play</h3>
        <ul class="tips">
          <li>Click empty soil to plant. Click a ripe crop (basket bubble) to harvest.</li>
          <li>A water-drop bubble means the plant is thirsty. Watered soil grows about ${CONFIG.WATER_SPEED}× faster for a while (thirsty crops like cucumbers and watermelons even more).</li>
          <li>Click a wooden crop sign to plant, water or harvest that whole bed at once. The scarecrow tells you how the garden is doing.</li>
          <li>Click the cottage door (or Home) to go inside. Buy furniture in the Furniture Shop, then click a green spot to place it. Click placed furniture to move, flip or store it.</li>
          <li>Sell your harvest or fill orders in the Shop to earn coins.</li>
          <li>Level up to unlock new seeds, friends, decorations and more land.</li>
          <li>Plants keep growing while the game is closed.</li>
          <li>Keyboard: Esc closes panels, puts tools away and cancels placing furniture. F flips furniture while placing it.</li>
        </ul>
      </section>
      <section class="danger"><h3>Start over</h3>
        ${ui.confirmReset
          ? `<p class="hint strong">This deletes your whole garden, coins and friends. Are you sure?</p>
             <div class="row-actions"><button type="button" class="btn btn-small btn-danger" data-action="reset-confirm">Yes, reset my farm</button><button type="button" class="btn btn-small" data-action="reset-cancel">Keep my farm</button></div>`
          : '<button type="button" class="btn btn-small btn-danger" data-action="reset-ask">Reset farm…</button>'}
      </section>`;
  },
};
