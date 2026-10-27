// The top status bar: level, experience, coins and the save indicator.
import { icon } from '../assets/index.js';
import { levelProgress } from '../systems/economy.js';
import { setHTML, fmt } from './ui.js';

export function createHud(el, game) {
  el.innerHTML = `
    <div class="brand">${icon('level', 'brand-leaf')}<span>Little Sprout</span></div>
    <div class="hud-chip hud-level" title="Level and experience">
      <span class="level-badge">${icon('level', 'badge-leaf')}<b data-bind="level"></b></span>
      <span class="xp"><span class="xp-label"><span data-bind="xp"></span></span><span class="meter meter-xp"><i data-bind="xpbar"></i></span></span>
    </div>
    <div class="hud-chip hud-coins" title="Coins">${icon('coin', 'icon icon-md')}<b data-bind="coins"></b></div>
    <div class="hud-right">
      <span class="save-indicator" data-bind="save" role="status"></span>
      <button type="button" class="icon-btn" data-action="open-panel" data-panel="settings" aria-label="Settings">${icon('gear', 'icon icon-md')}</button>
    </div>`;
  const $ = (k) => el.querySelector(`[data-bind="${k}"]`);
  const levelEl = $('level'), xpEl = $('xp'), barEl = $('xpbar'), coinsEl = $('coins'), saveEl = $('save');
  const coinChip = el.querySelector('.hud-coins'), levelChip = el.querySelector('.hud-level');
  let lastCoins = null, lastLevel = null;

  function bump(chip) {
    chip.classList.remove('bump');
    void chip.offsetWidth;
    chip.classList.add('bump');
  }

  function render() {
    const s = game.state;
    const lp = levelProgress(s.xp);
    levelEl.textContent = lp.level;
    xpEl.textContent = lp.needed ? `${fmt(lp.into)} / ${fmt(lp.needed)} XP` : 'Max level!';
    barEl.style.width = `${Math.round(lp.fraction * 100)}%`;
    coinsEl.textContent = fmt(s.coins);
    if (lastCoins !== null && s.coins !== lastCoins) bump(coinChip);
    if (lastLevel !== null && lp.level !== lastLevel) bump(levelChip);
    lastCoins = s.coins;
    lastLevel = lp.level;
  }

  let savedTimer;
  function showSave(ok) {
    setHTML(saveEl, ok ? `${icon('check', 'icon icon-sm')}<span>Saved</span>` : '<span>Could not save!</span>');
    saveEl.classList.toggle('error', !ok);
    saveEl.classList.remove('flash');
    void saveEl.offsetWidth;
    saveEl.classList.add('flash');
    clearTimeout(savedTimer);
  }

  return { render, showSave, coinChip };
}
