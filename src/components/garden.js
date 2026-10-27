// The garden scene: soil plots, crops, decorations and wandering creatures,
// plus the small pop-up panel that appears when you click a plot or friend.
import { BEDS, PLOTS, PATCHES, DECOR_SPOTS, CREATURE_SPOTS, SCENE, COTTAGE, SCARECROW, GATE } from '../data/gardenLayout.js';
import { CREATURES, CREATURES_BY_ID } from '../data/creaturesData.js';
import { CROPS, CROPS_BY_ID, STAGES, CROP_CATEGORIES } from '../data/cropsData.js';
import { DECOR_BY_ID } from '../data/decorData.js';
import { CONFIG } from '../data/config.js';
import { plotInfo, waterSpeed } from '../systems/crops.js';
import { isCropUnlocked } from '../systems/economy.js';
import { count } from '../systems/inventory.js';
import { petCooldownLeft, currentBonus } from '../systems/creatures.js';
import { url, raw, icon } from '../assets/index.js';
import { esc, setHTML, formatTime, coins, packetImg, produceImg, meter } from './ui.js';

const W = SCENE.width, H = SCENE.height;
const pct = (v, total) => `${(v / total) * 100}%`;
const PLOT_W = 112, CREATURE_W = 100, DECOR_W = 88;
const SIGN_W = 44;
const waterHint = (cropId) => `Watered soil makes ${CROPS_BY_ID[cropId].plural.toLowerCase()} grow ${waterSpeed(cropId)}× faster for a while.`;
// Where a crop sign stands for each bed (just right of its back corner).
const signPoint = (patch) => ({ x: patch.x + 114, y: patch.y - 12 });
const box = (el, x, y, w, h) => Object.assign(el.style, { left: pct(x, W), top: pct(y, H), width: pct(w, W), height: pct(h, H) });

export function createGarden({ stage, game, ui, actions }) {
  const state = game.state;
  stage.innerHTML = `
    <img class="stage-bg" src="${url('garden/background')}" alt="" draggable="false" />
    <div class="items">
      <div class="cottage" style="z-index:${COTTAGE.y + COTTAGE.h}">
        <span class="cottage-art">${raw('garden/cottage')}</span>
        <button type="button" class="cottage-door" data-action="enter-house" aria-label="Open the cottage door and go inside"><span class="door-tag">Go inside</span></button>
      </div>
      <button type="button" class="scarecrow" data-action="scarecrow" aria-label="Ask the scarecrow how the garden is doing">${raw('garden/scarecrow')}</button>
      <button type="button" class="garden-gate" data-action="garden-gate" aria-label="Walk through the gate to the seed shop">${raw('garden/gate')}<span class="door-tag">Seed shop</span></button>
    </div>
    <div class="butterflies" aria-hidden="true">
      <span class="butterfly bf-a"><span class="bf-flap">${raw('garden/butterfly-pink')}</span></span>
      <span class="butterfly bf-b"><span class="bf-flap">${raw('garden/butterfly-yellow')}</span></span>
    </div>
    <div class="popover" role="dialog" hidden></div>`;
  const items = stage.querySelector('.items');
  const popover = stage.querySelector('.popover');

  // ---- Scenery you can click: cottage door, scarecrow and gate ----
  const cottageEl = items.querySelector('.cottage');
  box(cottageEl, COTTAGE.x, COTTAGE.y, COTTAGE.w, COTTAGE.h);
  box(cottageEl.querySelector('.cottage-door'), (COTTAGE.door.x - 36 - COTTAGE.x) / COTTAGE.w * W, (COTTAGE.door.y - 62 - COTTAGE.y) / COTTAGE.h * H, 72 / COTTAGE.w * W, 116 / COTTAGE.h * H);
  const scarecrowEl = items.querySelector('.scarecrow');
  box(scarecrowEl, SCARECROW.x - 60, SCARECROW.y - 170, 120, 170);
  scarecrowEl.style.zIndex = SCARECROW.y;
  const gateEl = items.querySelector('.garden-gate');
  box(gateEl, GATE.x - 80, GATE.y - 110, 160, 110);
  gateEl.style.zIndex = GATE.y + 20;

  // ---- Plots ----
  const plotEls = {};
  PLOTS.forEach((p, i) => {
    const variant = i % 3; // three hand-drawn soil shapes so beds don't look stamped
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'plot';
    el.dataset.plot = p.id;
    el.style.left = pct(p.x, W);
    el.style.top = pct(p.y, H);
    el.style.width = pct(PLOT_W, W);
    el.style.zIndex = Math.round(p.y);
    el.style.setProperty('--sway-delay', `${(-Math.random() * 4).toFixed(2)}s`);
    el.innerHTML = `
      <span class="soil" style="--tilt:${p.tilt}deg">
        <img class="soil-dry" src="${url(`garden/plot-${variant}`)}" alt="" draggable="false" />
        <img class="soil-wet" src="${url(`garden/plot-${variant}-wet`)}" alt="" draggable="false" />
        <img class="soil-locked" src="${url('garden/plot-locked')}" alt="" draggable="false" />
      </span>
      <span class="crop"></span>
      <span class="bubble"></span>
      <span class="timer"><i></i></span>`;
    items.appendChild(el);
    plotEls[p.id] = { el, crop: el.querySelector('.crop'), bubble: el.querySelector('.bubble'), bar: el.querySelector('.timer i'), key: null, bubbleKey: null };
  });

  // ---- Signs in front of locked beds ----
  const signEls = {};
  for (const bed of BEDS) {
    const xs = bed.plots.map((p) => p.x), ys = bed.plots.map((p) => p.y);
    const x = (Math.min(...xs) + Math.max(...xs)) / 2, y = (Math.min(...ys) + Math.max(...ys)) / 2 + 26;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'bed-sign';
    el.dataset.bed = bed.id;
    el.setAttribute('aria-label', `${bed.name} is overgrown. Open garden expansion.`);
    el.style.left = pct(x, W);
    el.style.top = pct(y, H);
    el.style.zIndex = Math.round(y) + 100; // stand in front of the overgrown patches
    el.innerHTML = `<img src="${url('garden/bed-sign')}" alt="" draggable="false" /><span>${esc(bed.name)}</span>`;
    items.appendChild(el);
    signEls[bed.id] = el;
  }

  // ---- A wooden crop sign beside every bed ----
  const cropSignEls = {};
  for (const patch of PATCHES) {
    const pt = signPoint(patch);
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'crop-sign';
    el.dataset.patch = patch.id;
    box(el, pt.x - SIGN_W / 2, pt.y - SIGN_W * 4 / 3, SIGN_W, SIGN_W * 4 / 3);
    el.style.zIndex = Math.round(pt.y);
    el.innerHTML = `<img class="sign-board" src="${url('garden/crop-sign')}" alt="" draggable="false" /><span class="sign-pic"></span>`;
    items.appendChild(el);
    cropSignEls[patch.id] = { el, pic: el.querySelector('.sign-pic'), key: null };
  }

  // ---- Decoration spots ----
  const spotEls = {};
  for (const s of DECOR_SPOTS) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'spot';
    el.dataset.spot = s.id;
    el.tabIndex = -1;
    el.style.left = pct(s.x, W);
    el.style.top = pct(s.y, H);
    el.style.width = pct(DECOR_W, W);
    el.style.zIndex = Math.round(s.y);
    el.innerHTML = '<span class="spot-ring"></span><span class="spot-art"></span>';
    items.appendChild(el);
    spotEls[s.id] = { el, art: el.querySelector('.spot-art'), key: null };
  }

  // ---- Creatures ----
  const creatureEls = {};
  const taken = new Set();
  function placeCreature(id, spotIndex) {
    const c = creatureEls[id];
    const spot = CREATURE_SPOTS[spotIndex];
    if (c.spot != null) taken.delete(c.spot);
    taken.add(spotIndex);
    if (c.spot != null) c.el.style.setProperty('--face', spot.x < CREATURE_SPOTS[c.spot].x ? -1 : 1);
    c.spot = spotIndex;
    c.el.style.left = pct(spot.x, W);
    c.el.style.top = pct(spot.y, H);
    c.el.style.zIndex = Math.round(spot.y) + 1;
  }
  function ensureCreature(def) {
    if (creatureEls[def.id]) return;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = `creature creature-${def.id}`;
    el.dataset.creature = def.id;
    el.style.width = pct(CREATURE_W, W);
    el.setAttribute('aria-label', `${def.name} the ${def.species}`);
    el.innerHTML = `<span class="creature-art">${raw(`creatures/${def.id}`)}</span><span class="creature-name">${esc(def.name)}</span>`;
    items.appendChild(el);
    creatureEls[def.id] = { el, spot: null, nextMove: Date.now() + 3000 + Math.random() * 6000 };
    const free = CREATURE_SPOTS.map((_, i) => i).filter((i) => !taken.has(i));
    const start = { button: 2, posy: 3, sprig: 6 }[def.id];
    placeCreature(def.id, free.includes(start) ? start : free[0]);
    el.classList.add('arrive');
    setTimeout(() => el.classList.remove('arrive'), 900);
  }

  // Creatures wander between spots on the paths every few seconds.
  function wander() {
    const nowMs = Date.now();
    for (const [id, c] of Object.entries(creatureEls)) {
      if (nowMs < c.nextMove || (ui.popover?.kind === 'creature' && ui.popover.id === id)) continue;
      c.nextMove = nowMs + 7000 + Math.random() * 9000;
      const options = CREATURE_SPOTS.map((_, i) => i).filter((i) => !taken.has(i) && Math.abs(CREATURE_SPOTS[i].x - CREATURE_SPOTS[c.spot].x) < 520);
      if (!options.length) continue;
      placeCreature(id, options[Math.floor(Math.random() * options.length)]);
      c.el.classList.add('walking');
      setTimeout(() => c.el.classList.remove('walking'), 2600);
    }
  }

  function cheer(id) {
    const c = creatureEls[id];
    if (!c) return;
    c.el.classList.remove('happy');
    void c.el.offsetWidth;
    c.el.classList.add('happy');
    setTimeout(() => c.el.classList.remove('happy'), 800);
  }

  function creaturePoint(id) {
    const c = creatureEls[id];
    const s = CREATURE_SPOTS[c?.spot ?? 0];
    return { x: s.x, y: s.y - 60 };
  }

  // ---- Rendering ----
  let firstRender = true;
  function renderPlots(now) {
    const seedTool = ui.tool === 'seed' && ui.seed;
    for (const p of PLOTS) {
      const info = plotInfo(state, p.id, now);
      const v = plotEls[p.id];
      const { el } = v;
      el.classList.toggle('is-locked', !!info.locked);
      el.classList.toggle('is-empty', !!info.empty);
      el.classList.toggle('is-growing', !!info.crop && !info.mature);
      el.classList.toggle('is-ready', !!info.mature);
      el.classList.toggle('is-wet', !!info.wet);
      el.classList.toggle('is-thirsty', !!info.thirsty);
      el.classList.toggle('can-plant', !!info.empty && !!seedTool);
      el.classList.toggle('can-water', !!info.thirsty && ui.tool === 'water');
      el.classList.toggle('is-selected', ui.popover?.kind === 'plot' && ui.popover.id === p.id);

      const key = info.crop ? `${info.crop.id}-${info.stage}` : '';
      if (key !== v.key) {
        const planted = !v.key && key;
        v.crop.innerHTML = key ? raw(`crops/${key}`) : '';
        if (!firstRender && key) {
          v.crop.classList.remove('pop', 'planted');
          void v.crop.offsetWidth;
          v.crop.classList.add(planted ? 'planted' : 'pop');
        }
        v.key = key;
      }
      v.bar.style.width = info.crop ? `${Math.round(info.fraction * 100)}%` : '0%';

      const bubbleKey = info.mature ? 'ready' : info.thirsty ? 'thirsty' : '';
      if (bubbleKey !== v.bubbleKey) {
        v.bubble.innerHTML = bubbleKey === 'ready' ? icon('basket', 'icon') : bubbleKey === 'thirsty' ? icon('water', 'icon') : '';
        v.bubbleKey = bubbleKey;
      }

      let label;
      if (info.locked) label = 'Overgrown patch. Expand your garden to use it.';
      else if (info.empty) label = seedTool ? `Empty soil. Click to plant ${CROPS_BY_ID[ui.seed].name.toLowerCase()}.` : 'Empty soil. Click to plant a seed.';
      else if (info.mature) label = `${info.crop.name} is ready! Click to harvest.`;
      else label = `${info.crop.name}, ${STAGES[info.stage].toLowerCase()}, ready in ${formatTime(info.remainingMs)}${info.thirsty ? ', needs water' : ''}.`;
      el.setAttribute('aria-label', label);
    }
    for (const bed of BEDS) signEls[bed.id].hidden = state.unlockedBeds.includes(bed.id);

    // Crop signs show what is growing in their bed.
    for (const patch of PATCHES) {
      const v = cropSignEls[patch.id];
      const infos = patch.plots.map((id) => plotInfo(state, id, now));
      const locked = infos.some((i) => i.locked);
      v.el.hidden = locked;
      if (locked) continue;
      const crops = [...new Set(infos.filter((i) => i.crop).map((i) => i.crop.id))];
      const key = crops.join('+');
      if (key !== v.key) {
        v.pic.innerHTML = crops.length ? crops.slice(0, 2).map((c) => produceImg(c, 'sign-icon')).join('') : '<span class="sign-empty">+</span>';
        v.pic.dataset.n = Math.min(crops.length, 2);
        v.key = key;
      }
      const ready = infos.filter((i) => i.mature).length, thirsty = infos.filter((i) => i.thirsty).length;
      v.el.classList.toggle('has-ready', ready > 0);
      v.el.classList.toggle('is-selected', ui.popover?.kind === 'patch' && ui.popover.id === patch.id);
      const names = crops.map((c) => CROPS_BY_ID[c].plural.toLowerCase()).join(' and ');
      v.el.setAttribute('aria-label', `Crop sign: ${names || 'empty bed'}${ready ? `, ${ready} ready` : ''}${thirsty ? `, ${thirsty} thirsty` : ''}. Open bed care.`);
    }
  }

  function renderDecor() {
    const decorMode = ui.panel === 'decorate';
    stage.classList.toggle('decor-mode', decorMode);
    for (const s of DECOR_SPOTS) {
      const v = spotEls[s.id];
      const id = state.decor.placed[s.id] || '';
      if (id !== v.key) {
        v.art.innerHTML = id ? `<img src="${url(`decorations/${id}`)}" alt="${esc(DECOR_BY_ID[id].name)}" draggable="false" />` : '';
        if (!firstRender && id) {
          v.el.classList.remove('placed');
          void v.el.offsetWidth;
          v.el.classList.add('placed');
        }
        v.key = id;
      }
      v.el.classList.toggle('has-decor', !!id);
      v.el.classList.toggle('can-place', decorMode && !id && !!ui.decorSel && count(state.decor.owned, ui.decorSel) > 0);
      v.el.tabIndex = decorMode ? 0 : -1;
      v.el.setAttribute('aria-label', id ? `${DECOR_BY_ID[id].name}. Click to pick it up.` : 'Empty decoration spot');
    }
  }

  function renderCreatures() {
    for (const def of CREATURES) if (state.creatures[def.id]) ensureCreature(def);
    for (const [id, c] of Object.entries(creatureEls)) {
      const h = state.creatures[id]?.happiness ?? 0;
      c.el.classList.toggle('is-sad', h < 30);
    }
  }

  // ---- Pop-up panel ----
  function plotPopoverHTML(plotId, info) {
    if (info.empty) {
      const cat = ui.seedCat || 'vegetable';
      const tabs = CROP_CATEGORIES.map((c) => `<button type="button" class="cat-tab ${c.id === cat ? 'active' : ''}" data-action="seed-cat" data-cat="${c.id}" aria-pressed="${c.id === cat}">${esc(c.label)}</button>`).join('');
      const list = CROPS.filter((crop) => crop.category === cat).map((crop) => {
        const unlocked = isCropUnlocked(state, crop.id);
        const owned = count(state.seeds, crop.id);
        const affordable = owned > 0 || state.coins >= crop.seedCost;
        const cost = owned > 0 ? `<span class="owned">×${owned} seeds</span>` : coins(crop.seedCost, affordable ? '' : 'short');
        return `<button type="button" class="seed-option ${affordable ? '' : 'cant-afford'}" data-action="plant" data-plot="${plotId}" data-crop="${crop.id}" ${unlocked ? '' : 'disabled'}>
          ${packetImg(crop.id, 'packet')}
          <span class="seed-name">${esc(crop.name)}</span>
          ${unlocked ? `<span class="seed-meta">${cost}<span class="time">${icon('clock', 'icon icon-xs')}${formatTime(crop.growSeconds * 1000 * CONFIG.GROWTH_TIME_SCALE)}</span></span>` : `<span class="seed-meta locked">${icon('lock', 'icon icon-xs')}Level ${crop.unlockLevel}</span>`}
        </button>`;
      }).join('');
      return `<div class="pop-head"><strong>Plant a seed</strong><button type="button" class="x" data-action="close-popover" aria-label="Close">×</button></div>
        <div class="cat-tabs" role="group" aria-label="Seed types">${tabs}</div>
        <div class="seed-grid">${list}</div>
        <p class="hint">Uses a seed from your basket, or buys one with coins.</p>`;
    }
    const crop = info.crop;
    let care = '';
    if (info.thirsty) {
      care = `<button type="button" class="btn btn-water" data-action="water" data-plot="${plotId}">${icon('can', 'icon icon-sm')}Water</button><p class="hint">${waterHint(crop.id)}</p>`;
    } else if (info.wet) {
      care = `<p class="hint wet">${icon('water', 'icon icon-xs')}Wet soil: growing ${waterSpeed(crop.id)}× faster for <b data-bind="wet"></b>.</p>`;
    }
    return `<div class="pop-head">${produceImg(crop.id, 'icon icon-md')}<div><strong>${esc(crop.name)}</strong><span>${STAGES[info.stage]} · stage ${info.stage + 1} of 4</span></div><button type="button" class="x" data-action="close-popover" aria-label="Close">×</button></div>
      <div class="pop-progress"><span class="meter"><i data-bind="bar"></i></span><span class="time-left">${icon('clock', 'icon icon-xs')}Ready in <b data-bind="time"></b></span></div>
      ${care}`;
  }

  // Bed care, opened from a crop sign: plant, water or harvest the whole bed at once.
  function patchPopoverHTML(patchId, now) {
    const patch = PATCHES.find((p) => p.id === patchId);
    const infos = patch.plots.map((id) => ({ id, ...plotInfo(state, id, now) }));
    const empty = infos.filter((i) => i.empty), thirsty = infos.filter((i) => i.thirsty), ready = infos.filter((i) => i.mature);
    const growing = infos.filter((i) => i.crop && !i.mature);
    const seedId = patchSeed(patch);
    const rows = infos.map((i) => {
      const what = i.crop ? `${produceImg(i.crop.id, 'icon icon-sm')}<span>${esc(i.crop.name)}</span><em>${i.mature ? 'Ready!' : `${STAGES[i.stage]} · ${formatTime(i.remainingMs)}${i.thirsty ? ' · thirsty' : ''}`}</em>` : `<span class="dim">Empty soil</span>`;
      return `<li>${what}</li>`;
    }).join('');
    const btns = [];
    if (ready.length) btns.push(`<button type="button" class="btn btn-small btn-gold" data-action="patch-harvest" data-patch="${patchId}">${icon('basket', 'icon icon-sm')}Harvest ${ready.length}</button>`);
    if (thirsty.length) btns.push(`<button type="button" class="btn btn-small btn-water" data-action="patch-water" data-patch="${patchId}">${icon('can', 'icon icon-sm')}Water ${thirsty.length}</button>`);
    if (empty.length && seedId) btns.push(`<button type="button" class="btn btn-small" data-action="patch-plant" data-patch="${patchId}" data-crop="${seedId}">${packetImg(seedId, 'icon icon-sm')}Plant ${esc(CROPS_BY_ID[seedId].plural.toLowerCase())}</button>`);
    if (empty.length) btns.push(`<button type="button" class="btn btn-small btn-plain" data-action="patch-choose" data-plot="${empty[0].id}">${icon('sparkle', 'icon icon-sm')}Choose seeds</button>`);
    const status = !growing.length && !ready.length ? 'Ready for planting.' : ready.length ? 'Something is ripe!' : thirsty.length ? 'The soil is dry.' : 'Growing nicely.';
    return `<div class="pop-head">${icon('sign', 'icon icon-md')}<div><strong>Bed ${PATCHES.indexOf(patch) + 1}</strong><span>${status}</span></div><button type="button" class="x" data-action="close-popover" aria-label="Close">×</button></div>
      <ul class="bed-list">${rows}</ul>
      <div class="pop-actions">${btns.join('')}</div>`;
  }

  // The seed the "Plant" button in bed care offers: the seed in hand,
  // otherwise whatever already grows in the bed, otherwise the last one planted.
  function patchSeed(patch) {
    const ok = (id) => id && CROPS_BY_ID[id] && isCropUnlocked(state, id);
    if (ui.tool === 'seed' && ok(ui.seed)) return ui.seed;
    const growing = patch.plots.map((id) => state.plots[id]?.cropId).find(ok);
    if (growing) return growing;
    return ok(ui.lastSeed) ? ui.lastSeed : null;
  }

  function creaturePopoverHTML(id) {
    const def = CREATURES_BY_ID[id];
    const c = state.creatures[id];
    const h = Math.round(c.happiness);
    const resting = petCooldownLeft(state, id, game.now()) > 0;
    const foods = Object.keys(state.produce).sort((a, b) => (b === def.favoriteCrop) - (a === def.favoriteCrop)).slice(0, 4);
    const feedBtns = foods.length
      ? foods.map((f) => `<button type="button" class="btn btn-small ${f === def.favoriteCrop ? 'fav' : ''}" data-action="feed" data-creature="${id}" data-crop="${f}" title="Share a ${esc(CROPS_BY_ID[f].name.toLowerCase())}">${produceImg(f, 'icon icon-xs')}${f === def.favoriteCrop ? 'Favourite!' : 'Feed'}</button>`).join('')
      : `<span class="hint">No produce to share yet. ${esc(def.name)} loves ${esc(CROPS_BY_ID[def.favoriteCrop].plural.toLowerCase())}.</span>`;
    return `<div class="pop-head"><div><strong>${esc(def.name)}</strong><span>${esc(def.species)}</span></div><button type="button" class="x" data-action="close-popover" aria-label="Close">×</button></div>
      <div class="happy-row">${icon('heart', 'icon icon-sm')}${meter(h / 100, 'meter-heart')}<b>${h}%</b></div>
      <p class="hint">+${Math.round(currentBonus(state, id) * 100)}% ${esc(def.bonus.text)}</p>
      <div class="pop-actions"><button type="button" class="btn btn-pink" data-action="pet" data-creature="${id}" ${resting ? 'disabled' : ''}>${icon('hand', 'icon icon-sm')}${resting ? 'Resting…' : 'Pet'}</button></div>
      <div class="pop-actions feed">${feedBtns}</div>`;
  }

  function renderPopover(now) {
    const pop = ui.popover;
    let html = '', anchor = null, info = null;
    if (pop?.kind === 'plot') {
      info = plotInfo(state, pop.id, now);
      if (info.locked || info.mature) { ui.popover = null; return renderPopover(now); }
      html = plotPopoverHTML(pop.id, info);
      const p = PLOTS.find((x) => x.id === pop.id);
      anchor = { x: p.x, y: p.y, top: p.y - (info.empty ? 30 : 110), bottom: p.y + 34 };
    } else if (pop?.kind === 'patch') {
      html = patchPopoverHTML(pop.id, now);
      const patch = PATCHES.find((x) => x.id === pop.id);
      const pt = signPoint(patch);
      anchor = { x: patch.x + 40, y: pt.y, top: pt.y - 60, bottom: pt.y + 10 };
    } else if (pop?.kind === 'creature' && state.creatures[pop.id]) {
      html = creaturePopoverHTML(pop.id);
      const pt = creaturePoint(pop.id);
      anchor = { x: pt.x, y: pt.y, top: pt.y - 40, bottom: pt.y + 66 };
    }
    if (!html) {
      popover.hidden = true;
      setHTML(popover, '');
      return;
    }
    setHTML(popover, html);
    popover.hidden = false;
    popover.dataset.kind = pop.kind;
    // Live numbers are updated in place so buttons are not rebuilt every second.
    if (info?.crop) {
      const bar = popover.querySelector('[data-bind="bar"]');
      const time = popover.querySelector('[data-bind="time"]');
      const wet = popover.querySelector('[data-bind="wet"]');
      if (bar) bar.style.width = `${Math.round(info.fraction * 100)}%`;
      if (time) time.textContent = formatTime(info.remainingMs);
      if (wet) wet.textContent = formatTime(info.wetLeftMs);
    }
    {
      // Show the panel above the plot, or below it if there is no room,
      // and always keep it inside the garden.
      const stageRect = stage.getBoundingClientRect();
      const scale = stageRect.width / W;
      const h = popover.offsetHeight, half = popover.offsetWidth / 2;
      const above = anchor.top * scale - h - 10;
      const below = anchor.bottom * scale + 10;
      let top = above;
      if (above < 6) top = below + h <= stageRect.height - 6 ? below : Math.max(6, stageRect.height - h - 6);
      const left = Math.min(Math.max(anchor.x * scale, half + 8), stageRect.width - half - 8);
      popover.style.left = `${left}px`;
      popover.style.top = `${top}px`;
    }
  }

  function render(now) {
    renderPlots(now);
    renderDecor();
    renderCreatures();
    renderPopover(now);
    firstRender = false;
  }

  // ---- Clicks inside the garden ----
  stage.addEventListener('click', (e) => {
    if (e.target.closest('[data-action]') || e.target.closest('.popover')) return;
    const signEl = e.target.closest('[data-patch]');
    if (signEl) return actions.clickSign(signEl.dataset.patch);
    const plotEl = e.target.closest('[data-plot]');
    if (plotEl) return actions.clickPlot(plotEl.dataset.plot);
    const creatureEl = e.target.closest('[data-creature]');
    if (creatureEl) return actions.clickCreature(creatureEl.dataset.creature);
    const spotEl = e.target.closest('[data-spot]');
    if (spotEl && ui.panel === 'decorate') return actions.clickSpot(spotEl.dataset.spot);
    if (e.target.closest('[data-bed]')) return actions.openPanel('expand');
    actions.closePopover();
  });

  const plotPoint = (plotId) => {
    const p = PLOTS.find((x) => x.id === plotId);
    return { x: p.x, y: p.y };
  };
  const spotPoint = (spotId) => DECOR_SPOTS.find((s) => s.id === spotId);

  // A copy of the crop that jumps up and fades away when harvested.
  function harvestPop(plotId, cropId) {
    const v = plotEls[plotId];
    const ghost = document.createElement('span');
    ghost.className = 'crop harvest-ghost';
    ghost.innerHTML = raw(`crops/${cropId}-3`);
    v.el.appendChild(ghost);
    setTimeout(() => ghost.remove(), 700);
  }

  function splash(plotId) {
    const v = plotEls[plotId];
    const can = document.createElement('span');
    can.className = 'watering';
    can.innerHTML = `${icon('can', 'can')}<i></i><i></i><i></i>`;
    v.el.appendChild(can);
    setTimeout(() => can.remove(), 1100);
  }

  const replay = (el, cls, ms) => {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  };
  const wiggleScarecrow = () => replay(scarecrowEl, 'wiggle', 900);
  const swingGate = () => replay(gateEl, 'open', 900);
  const openDoor = () => replay(cottageEl, 'door-open', 900);
  const doorPoint = () => ({ x: COTTAGE.door.x, y: COTTAGE.door.y });
  const scarecrowPoint = () => ({ x: SCARECROW.x, y: SCARECROW.y - 120 });

  return { render, wander, cheer, plotPoint, spotPoint, creaturePoint, harvestPop, splash, wiggleScarecrow, swingGate, openDoor, doorPoint, scarecrowPoint };
}
