// The garden friends collection.
import { icon, img, raw } from '../assets/index.js';
import { CREATURES } from '../data/creaturesData.js';
import { CROPS_BY_ID } from '../data/cropsData.js';
import { CONFIG } from '../data/config.js';
import { currentBonus, petCooldownLeft } from '../systems/creatures.js';
import { count } from '../systems/inventory.js';
import { esc, meter, coins, produceImg } from './ui.js';

export const creaturePanel = {
  id: 'friends',
  title: 'Garden Friends',
  icon: 'critter',
  render(game) {
    const s = game.state;
    const now = game.now();
    return `<ul class="cards friends">${CREATURES.map((def) => {
      const c = s.creatures[def.id];
      const fav = CROPS_BY_ID[def.favoriteCrop];
      if (!c) {
        const locked = s.level < def.unlockLevel;
        return `<li class="card friend not-owned">
          ${img(`creatures/${def.id}-egg`, 'friend-art')}
          <div class="card-body"><strong>${locked ? 'A mysterious egg' : esc(def.name)}</strong>
            <span class="blurb">${locked ? `Something is stirring inside. It will be ready to hatch at level ${def.unlockLevel}.` : esc(def.description)}</span>
            <span class="facts">Bonus: up to +${Math.round(def.bonus.max * 100)}% ${esc(def.bonus.text)}</span></div>
          <div class="card-buy">${locked
            ? `<span class="lock">${icon('lock', 'icon icon-sm')}Level ${def.unlockLevel}</span>`
            : `<button type="button" class="btn btn-small btn-pink ${s.coins < def.cost ? 'cant-afford' : ''}" data-action="adopt" data-creature="${def.id}">Hatch · ${coins(def.cost)}</button>`}</div>
        </li>`;
      }
      const h = Math.round(c.happiness);
      const resting = petCooldownLeft(s, def.id, now) > 0;
      return `<li class="card friend">
        <span class="friend-art live">${raw(`creatures/${def.id}`)}</span>
        <div class="card-body"><strong>${esc(def.name)} <span class="qty">${esc(def.species)}</span></strong>
          <span class="blurb">${esc(def.description)}</span>
          <span class="happy-row">${icon('heart', 'icon icon-sm')}${meter(h / 100, 'meter-heart')}<b>${h}%</b></span>
          <span class="facts">Now: +${Math.round(currentBonus(s, def.id) * 100)}% ${esc(def.bonus.text)} · Loves ${produceImg(fav.id, 'icon icon-xs')}${esc(fav.plural.toLowerCase())}</span>
        </div>
        <div class="card-buy">
          <button type="button" class="btn btn-small btn-pink" data-action="pet" data-creature="${def.id}" ${resting ? 'disabled' : ''}>${resting ? 'Resting…' : 'Pet'}</button>
          <button type="button" class="btn btn-small ${count(s.produce, fav.id) ? '' : 'cant-afford'}" data-action="feed" data-creature="${def.id}" data-crop="${fav.id}">Feed ${produceImg(fav.id, 'icon icon-xs')}</button>
        </div>
      </li>`;
    }).join('')}</ul>
    <p class="hint">Happy friends give bigger bonuses. Happiness drifts down slowly, so pet them (+${CONFIG.PET_HAPPINESS}) and share their favourite food (+${CONFIG.FEED_FAVORITE_HAPPINESS}). Click a friend in the garden to say hello.</p>`;
  },
};
