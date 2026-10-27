// Settings: saving, motion, how to play, and resetting the farm.
import { icon } from '../assets/index.js';
import { CONFIG } from '../data/config.js';
import { esc } from './ui.js';

const ROWS = [
  ['level', 'Level'], ['coins', 'Coins'], ['xp', 'XP'], ['growing', 'Plants growing'],
  ['seeds', 'Seed packets'], ['produce', 'Harvest in basket'], ['beds', 'Garden plots'],
  ['decorations', 'Decorations'], ['furniture', 'Furniture'], ['friends', 'Animal friends'], ['quests', 'Quests done'],
];
const short = (m) => `Level ${m.level} · ${m.coins} coins · ${m.growing} growing · ${m.furniture} furniture`;
const when = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : null);

// The "are you sure?" card shown before a loaded garden replaces this one.
function confirmCard(pending, now) {
  const rows = ROWS.map(([k, label]) => `<tr><th scope="row">${label}</th><td>${pending.summary[k]}</td><td>${now[k]}</td></tr>`).join('');
  return `<div class="import-confirm" role="alertdialog" aria-label="Replace your garden?">
    <p class="hint strong">Replace the garden in this browser with ${esc(pending.name)}?</p>
    ${pending.exportedAt ? `<p class="hint">Saved to a file on ${esc(when(pending.exportedAt))}.</p>` : ''}
    <table class="compare"><thead><tr><th></th><th scope="col">Loading</th><th scope="col">Here now</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="hint">The garden here now is kept as a backup in this browser, so you can switch back from this panel.</p>
    <div class="row-actions">
      <button type="button" class="btn btn-small" data-action="import-confirm">Yes, replace my garden</button>
      <button type="button" class="btn btn-small btn-plain" data-action="import-cancel">Cancel</button>
    </div>
    <button type="button" class="btn btn-small btn-plain" data-action="export-save">${icon('box', 'icon icon-sm')}Save the garden here now to a file first</button>
  </div>`;
}

function moveSection(game, ui) {
  if (ui.pendingImport) return `<section class="move-garden"><h3>Move your garden</h3>${confirmCard(ui.pendingImport, game.summary())}</section>`;
  const backups = game.storedSaves().filter((b) => b.key !== CONFIG.SAVE_KEY);
  const list = backups.map((b) => `<li><span><b>${esc(b.label)}</b><small>${b.ok ? esc(short(b.summary)) : 'This one could not be read.'}</small></span>
      <span class="row-actions"><button type="button" class="btn btn-small btn-plain" data-action="export-backup" data-key="${esc(b.key)}">Download</button>${b.ok ? `<button type="button" class="btn btn-small btn-plain" data-action="use-backup" data-key="${esc(b.key)}">Use this one…</button>` : ''}</span></li>`).join('');
  return `<section class="move-garden"><h3>Move your garden</h3>
    <p class="hint">To play the same garden in another browser, on another computer or on the website: save it to a file here, then open the game there and load the file.</p>
    <div class="row-actions">
      <button type="button" class="btn btn-small" data-action="export-save">${icon('box', 'icon icon-sm')}Save garden to a file</button>
      <button type="button" class="btn btn-small" data-action="import-pick">${icon('sparkle', 'icon icon-sm')}Load garden from a file…</button>
    </div>
    ${ui.importError ? `<p class="hint warn-text" role="alert">${esc(ui.importError)}</p>` : ''}
    ${backups.length ? `<h4>Other gardens kept in this browser</h4><ul class="backup-list">${list}</ul>` : ''}
  </section>`;
}

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
        ${game.persistent ? '' : '<p class="hint warn-text">This browser is not letting the game save (a private window, perhaps). Use "Save garden to a file" below before you close the page.</p>'}
        <button type="button" class="btn btn-small" data-action="save-now">${icon('check', 'icon icon-sm')}Save now</button>
      </section>
      ${moveSection(game, ui)}
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
          ? `<p class="hint strong">This replaces your whole garden, coins and friends with a new one. (One copy of the old garden is kept under Move your garden, but save it to a file first if it matters.) Are you sure?</p>
             <div class="row-actions"><button type="button" class="btn btn-small btn-danger" data-action="reset-confirm">Yes, reset my farm</button><button type="button" class="btn btn-small" data-action="reset-cancel">Keep my farm</button></div>`
          : '<button type="button" class="btn btn-small btn-danger" data-action="reset-ask">Reset farm…</button>'}
      </section>`;
  },
};
