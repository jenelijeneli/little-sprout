// Connects the game rules to the screen: renders every part of the
// interface and turns clicks into game actions with friendly feedback.
import { icon } from '../assets/index.js';
import { CROPS_BY_ID } from '../data/cropsData.js';
import { CREATURES_BY_ID } from '../data/creaturesData.js';
import { DECOR_BY_ID } from '../data/decorData.js';
import { FURNITURE_BY_ID } from '../data/furnitureData.js';
import { PATCHES } from '../data/gardenLayout.js';
import { QUESTS_BY_ID } from '../data/questsData.js';
import { CONFIG } from '../data/config.js';
import { plotInfo } from '../systems/crops.js';
import { count } from '../systems/inventory.js';
import { createGarden } from './garden.js';
import { createHouse } from './house.js';
import { createHud } from './hud.js';
import { createDock } from './dock.js';
import { createEffects } from './effects.js';
import { setHTML, esc, produceImg, cropName } from './ui.js';
import { basketPanel } from './inventoryPanel.js';
import { shopPanel } from './shop.js';
import { questPanel } from './questPanel.js';
import { creaturePanel } from './creaturePanel.js';
import { decoratePanel } from './decoratePanel.js';
import { expandPanel } from './expandPanel.js';
import { settingsPanel } from './settingsPanel.js';
import { furnishPanel } from './furnishPanel.js';

const PANELS = Object.fromEntries([basketPanel, shopPanel, questPanel, creaturePanel, decoratePanel, expandPanel, settingsPanel, furnishPanel].map((p) => [p.id, p]));
const MOTION_KEY = 'little-sprout-reduce-motion';
const FADE_MS = 380;

export function createApp(game) {
  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), drawer = $('drawer'), houseStage = $('house'), fade = $('scene-fade');

  // Interface-only state (never saved with the game).
  const ui = {
    panel: null, // which side panel is open
    shopTab: 'seeds',
    tool: null, // null | 'seed' | 'water'
    seed: null, // crop id when the seed tool is active
    decorSel: null, // decoration chosen in decorate mode
    popover: null, // { kind: 'plot' | 'creature', id }
    confirmReset: false,
    reduceMotion: false,
    scene: 'garden', // 'garden' | 'house'
    seedCat: 'vegetable', // seed category shown in the plant pop-up
    lastSeed: null, // the last crop planted (offered by the bed-care pop-up)
    furnishTab: 'shop',
    furnCat: 'furniture',
    place: null, // furniture being placed: { id, uid?, flip }
  };
  try { ui.reduceMotion = localStorage.getItem(MOTION_KEY) === '1'; } catch { /* ignore */ }
  document.documentElement.classList.toggle('reduce-motion', ui.reduceMotion);

  const effects = createEffects({ stage, fxLayer: $('fx'), toastBox: $('toasts') });
  const hud = createHud($('hud'), game);
  const dock = createDock($('dock'), game, ui);

  // ---------- Rendering ----------
  function renderDrawer() {
    const panel = PANELS[ui.panel];
    drawer.hidden = !panel;
    document.body.classList.toggle('drawer-open', !!panel);
    if (!panel) return setHTML(drawer, '');
    setHTML(drawer, `
      <div class="drawer-head">${icon(panel.icon, 'icon icon-lg')}<h2>${esc(panel.title)}</h2><button type="button" class="x" data-action="close-panel" aria-label="Close panel">×</button></div>
      <div class="drawer-body" data-panel-body="${panel.id}">${panel.render(game, ui)}</div>`);
  }

  function render() {
    const now = game.now();
    hud.render();
    if (ui.scene === 'house') house.render();
    else garden.render(now);
    dock.render();
    renderDrawer();
  }

  // ---------- Feedback shared by all actions ----------
  function fail(result) {
    effects.toast(result.reason, 'warn', 'sparkle');
    return result;
  }

  function celebrate(result) {
    for (const id of result.completedQuests || []) {
      effects.toast(`Quest complete: ${QUESTS_BY_ID[id].title}! Claim your reward on the Quest Board.`, 'quest', 'quest');
      document.querySelector('[data-panel="quests"].dock-btn')?.classList.add('wiggle');
      setTimeout(() => document.querySelector('[data-panel="quests"].dock-btn')?.classList.remove('wiggle'), 1200);
    }
    if (result.levelUp) {
      const { level, unlocks } = result.levelUp;
      effects.banner(`Level ${level}!`, unlocks.length ? [`New: ${unlocks.join(', ')}`] : ['Your garden is growing up.'], 'level');
      effects.confetti();
    }
    if (result.carePackage) {
      effects.toast('A neighbour left you 3 carrot seeds. Never give up, little gardener!', 'info', 'basket');
    }
  }

  function run(name, ...args) {
    const result = game.act(name, ...args);
    if (!result.ok) return fail(result);
    celebrate(result);
    return result;
  }

  // ---------- Garden actions ----------
  function plantAt(plotId, cropId) {
    const r = run('plant', plotId, cropId);
    if (!r.ok) return;
    const p = garden.plotPoint(plotId);
    effects.burst(p.x, p.y, 'dirt', 8);
    if (r.paid) effects.floatAt(p.x, p.y - 30, `${icon('coin', 'icon icon-sm')}−${r.paid}`);
    ui.tool = 'seed';
    ui.seed = cropId;
    ui.lastSeed = cropId;
    ui.popover = null;
    render();
  }

  function waterAt(plotId) {
    const r = run('water', plotId);
    if (!r.ok) return;
    const p = garden.plotPoint(plotId);
    garden.splash(plotId);
    effects.burst(p.x, p.y - 10, 'drop', 6);
    render();
  }

  function harvestAt(plotId) {
    const info = plotInfo(game.state, plotId, game.now());
    const r = run('harvest', plotId);
    if (!r.ok) return;
    const p = garden.plotPoint(plotId);
    garden.harvestPop(plotId, info.crop.id);
    effects.burst(p.x, p.y - 40, 'star', 6);
    effects.floatAt(p.x, p.y - 70, `${produceImg(r.cropId, 'icon icon-md')}+${r.qty}`);
    effects.floatAt(p.x + 34, p.y - 40, `${icon('xp', 'icon icon-sm')}+${r.xp} XP`, 180);
    if (r.extra) effects.toast(`Lucky! Button found an extra ${CROPS_BY_ID[r.cropId].name.toLowerCase()}.`, 'info', 'sparkle');
    render();
  }

  const actions = {
    clickPlot(plotId) {
      const info = plotInfo(game.state, plotId, game.now());
      if (info.locked) {
        effects.toast('This patch is overgrown. Clear it from the Expand panel.', 'info', 'shovel');
        return openPanel('expand');
      }
      if (info.mature) return harvestAt(plotId);
      if (info.empty && ui.tool === 'seed' && ui.seed) return plantAt(plotId, ui.seed);
      if (info.thirsty && ui.tool === 'water') return waterAt(plotId);
      const same = ui.popover?.kind === 'plot' && ui.popover.id === plotId;
      ui.popover = same ? null : { kind: 'plot', id: plotId };
      render();
    },
    clickCreature(id) {
      const same = ui.popover?.kind === 'creature' && ui.popover.id === id;
      ui.popover = same ? null : { kind: 'creature', id };
      render();
    },
    clickSpot(spotId) {
      if (game.state.decor.placed[spotId]) {
        const id = game.state.decor.placed[spotId];
        if (run('pickUpDecor', spotId).ok) effects.toast(`${DECOR_BY_ID[id].name} went back to the shed.`, 'info', 'decor');
        ui.decorSel = ui.decorSel || id;
        return render();
      }
      if (!ui.decorSel || !count(game.state.decor.owned, ui.decorSel)) {
        effects.toast('Pick a decoration from the shed first.', 'info', 'decor');
        return;
      }
      const r = run('placeDecor', spotId, ui.decorSel);
      if (r.ok) {
        const s = garden.spotPoint(spotId);
        effects.burst(s.x, s.y - 30, 'leaf', 7);
        if (!count(game.state.decor.owned, ui.decorSel)) ui.decorSel = null;
      }
      render();
    },
    clickSign(patchId) {
      const same = ui.popover?.kind === 'patch' && ui.popover.id === patchId;
      ui.popover = same ? null : { kind: 'patch', id: patchId };
      render();
    },
    clickFurniture(uid) {
      const same = ui.popover?.kind === 'furniture' && ui.popover.id === uid;
      ui.popover = same ? null : { kind: 'furniture', id: uid };
      render();
    },
    // Puts the ghost item down where it is (spot comes from house.findSpot).
    dropFurniture(spot) {
      const p = ui.place;
      if (!p || !spot) return;
      if (!spot.ok) return fail({ reason: spot.reason || 'That spot won\'t work.' });
      const r = p.uid
        ? run('moveFurniture', p.uid, spot.kind, spot.x, spot.y, p.flip, spot.on)
        : run('placeFurniture', p.id, spot.kind, spot.x, spot.y, p.flip, spot.on);
      if (!r.ok) return render();
      const uid = r.placed.uid;
      ui.place = null;
      house.resetSpot();
      render();
      house.bounce(uid);
      effects.toast(`${FURNITURE_BY_ID[r.placed.id].name} ${p.uid ? 'moved' : 'placed'}. Click it any time to move, flip or store it.`, 'info', 'sofa');
    },
    openPanel: (id) => openPanel(id),
    closePopover() {
      if (!ui.popover) return;
      ui.popover = null;
      render();
    },
  };

  function openPanel(id, extra = {}) {
    ui.panel = id;
    ui.confirmReset = false;
    if (extra.tab) ui.shopTab = extra.tab;
    if (id === 'decorate') {
      ui.tool = null;
      if (extra.decor) ui.decorSel = extra.decor;
      else if (!ui.decorSel || !count(game.state.decor.owned, ui.decorSel)) ui.decorSel = Object.keys(game.state.decor.owned)[0] || null;
    }
    render();
    drawer.querySelector('.drawer-body')?.scrollTo?.(0, 0);
  }

  const garden = createGarden({ stage, game, ui, actions });
  const house = createHouse({ stage: houseStage, game, ui, actions });

  // ---------- Going in and out of the cottage ----------
  let switching = false;
  function goTo(scene) {
    if (switching || ui.scene === scene) return;
    switching = true;
    ui.popover = null;
    ui.place = null;
    ui.tool = null;
    ui.seed = null;
    if (scene === 'house') garden.openDoor();
    const quick = ui.reduceMotion;
    fade.classList.add('on');
    setTimeout(() => {
      ui.scene = scene;
      stage.hidden = scene !== 'garden';
      houseStage.hidden = scene !== 'house';
      document.body.dataset.scene = scene;
      if (ui.panel === 'decorate' || ui.panel === 'expand') ui.panel = null;
      render();
      fade.classList.remove('on');
      switching = false;
      if (scene === 'house' && !game.state.home.placed.length) effects.toast('An empty cottage! Open the Furniture Shop to make it cosy.', 'info', 'sofa');
    }, quick ? 60 : FADE_MS);
  }

  function startPlacing(id, uid = null) {
    if (!uid && !count(game.state.home.owned, id)) return fail({ reason: `You don't have a ${FURNITURE_BY_ID[id].name.toLowerCase()} in storage.` });
    const existing = uid ? game.state.home.placed.find((p) => p.uid === uid) : null;
    ui.place = { id, uid, flip: existing ? existing.flip : false };
    ui.popover = null;
    ui.panel = null;
    house.resetSpot();
    if (ui.scene !== 'house') goTo('house');
    else render();
  }

  function patchPlots(patchId) {
    return PATCHES.find((p) => p.id === patchId).plots;
  }

  // ---------- Buttons anywhere on the page (data-action="...") ----------
  const handlers = {
    'plant': (d) => plantAt(d.plot, d.crop),
    'water': (d) => waterAt(d.plot),
    'close-popover': () => actions.closePopover(),
    'toggle-panel': (d) => (ui.panel === d.panel ? (ui.panel = null, render()) : openPanel(d.panel)),
    'open-panel': (d) => openPanel(d.panel, { tab: d.tab, decor: d.decor }),
    'close-panel': () => { ui.panel = null; render(); },
    'shop-tab': (d) => { ui.shopTab = d.tab; render(); },
    'toggle-water': () => { ui.tool = ui.tool === 'water' ? null : 'water'; ui.popover = null; render(); },
    'clear-tool': () => { ui.tool = null; ui.seed = null; render(); },
    'select-seed': (d) => { if (ui.scene === 'house') goTo('garden'); ui.tool = 'seed'; ui.seed = d.crop; effects.toast(`Click empty soil to plant ${cropName(d.crop, 2).toLowerCase()}.`, 'info', 'basket'); render(); },
    'buy-seeds': (d, el) => {
      const r = run('buySeeds', d.crop, Number(d.qty));
      if (r.ok) effects.floatFrom(el, `+${r.qty} ${esc(cropName(d.crop, r.qty).toLowerCase())} seeds`);
      render();
    },
    'sell': (d, el) => {
      const r = run('sell', d.crop, Number(d.qty));
      if (r.ok) effects.floatFrom(hud.coinChip, `${icon('coin', 'icon icon-sm')}+${r.coins}`);
      render();
    },
    'fulfil-order': (d) => {
      const r = run('fulfilOrder', d.order);
      if (r.ok) {
        effects.floatFrom(hud.coinChip, `${icon('coin', 'icon icon-sm')}+${r.coins}`);
        effects.toast(`${r.order.from} is delighted! +${r.coins} coins, +${r.xp} XP.`, 'quest', 'basket');
      }
      render();
    },
    'claim-quest': (d) => {
      const r = run('claimQuest', d.quest);
      if (r.ok) {
        effects.confetti(18);
        effects.toast(`Reward claimed: ${QUESTS_BY_ID[d.quest].title}`, 'quest', 'sparkle');
        if (r.reward.coins) effects.floatFrom(hud.coinChip, `${icon('coin', 'icon icon-sm')}+${r.reward.coins}`);
      }
      render();
    },
    'adopt': (d) => {
      const r = run('adopt', d.creature);
      if (r.ok) {
        const def = CREATURES_BY_ID[d.creature];
        effects.banner(`${def.name} hatched!`, [`${def.species} joined your garden.`], 'critter');
        effects.confetti();
      }
      render();
    },
    'pet': (d) => {
      const r = run('pet', d.creature);
      if (r.ok) {
        garden.cheer(d.creature);
        const p = garden.creaturePoint(d.creature);
        effects.burst(p.x, p.y - 10, 'heart', 6);
        effects.toast(r.line, 'love', 'heart');
      }
      render();
    },
    'feed': (d) => {
      const r = run('feed', d.creature, d.crop);
      if (r.ok) {
        garden.cheer(d.creature);
        const p = garden.creaturePoint(d.creature);
        effects.burst(p.x, p.y - 10, 'heart', r.favorite ? 9 : 5);
        const def = CREATURES_BY_ID[d.creature];
        effects.toast(r.favorite ? `${def.name} loves ${cropName(d.crop, 2).toLowerCase()}! Happiness ${Math.round(r.happiness)}%.` : `${def.name} munches happily. Happiness ${Math.round(r.happiness)}%.`, 'love', 'heart');
      }
      render();
    },
    'buy-decor': (d, el) => {
      const r = run('buyDecor', d.decor);
      if (r.ok) {
        effects.floatFrom(el, `+1 ${esc(DECOR_BY_ID[d.decor].name.toLowerCase())}`);
        ui.decorSel = d.decor;
        effects.toast(`${DECOR_BY_ID[d.decor].name} is in your shed. Open Decorate to place it.`, 'info', 'decor');
      }
      render();
    },
    'select-decor': (d) => { ui.decorSel = d.decor; render(); },
    'expand': () => {
      const r = run('expand');
      if (r.ok) {
        effects.banner('More room to grow!', ['4 new plots are ready for planting.'], 'shovel');
        effects.confetti();
        ui.panel = null;
      }
      render();
    },
    'enter-house': () => goTo('house'),
    'exit-house': () => goTo('garden'),
    'scarecrow': () => {
      garden.wiggleScarecrow();
      const now = game.now();
      const infos = PATCHES.flatMap((p) => p.plots).map((id) => plotInfo(game.state, id, now)).filter((i) => !i.locked);
      const ready = infos.filter((i) => i.mature).length, thirsty = infos.filter((i) => i.thirsty).length;
      const empty = infos.filter((i) => i.empty).length;
      const p = garden.scarecrowPoint();
      effects.burst(p.x, p.y, 'leaf', 5);
      const bits = [ready && `${ready} ready to pick`, thirsty && `${thirsty} thirsty`, empty && `${empty} empty`].filter(Boolean);
      effects.toast(bits.length ? `Scarecrow says: ${bits.join(', ')}. No crows today!` : 'Scarecrow says: all quiet. Everything is growing nicely.', 'info', 'sparkle');
    },
    'garden-gate': () => { garden.swingGate(); openPanel('shop', { tab: 'seeds' }); },
    'seed-cat': (d) => { ui.seedCat = d.cat; render(); },
    'patch-choose': (d) => { ui.popover = { kind: 'plot', id: d.plot }; render(); },
    'patch-plant': (d) => {
      const plots = patchPlots(d.patch).filter((id) => plotInfo(game.state, id, game.now()).empty);
      let planted = 0;
      for (const id of plots) {
        const r = run('plant', id, d.crop);
        if (!r.ok) break;
        planted++;
        const pt = garden.plotPoint(id);
        effects.burst(pt.x, pt.y, 'dirt', 5);
      }
      if (planted) { ui.lastSeed = d.crop; effects.toast(`Planted ${planted} ${cropName(d.crop, planted).toLowerCase()}.`, 'info', 'basket'); }
      render();
    },
    'patch-water': (d) => {
      for (const id of patchPlots(d.patch).filter((x) => plotInfo(game.state, x, game.now()).thirsty)) {
        if (!run('water', id).ok) break;
        garden.splash(id);
      }
      render();
    },
    'patch-harvest': (d) => {
      for (const id of patchPlots(d.patch).filter((x) => plotInfo(game.state, x, game.now()).mature)) harvestAt(id);
      ui.popover = null;
      render();
    },
    'furnish-tab': (d) => { ui.furnishTab = d.tab; render(); },
    'furn-cat': (d) => { ui.furnCat = d.cat; render(); },
    'buy-furniture': (d, el) => {
      const r = run('buyFurniture', d.furn);
      if (!r.ok) return render();
      const item = FURNITURE_BY_ID[d.furn];
      effects.floatFrom(hud.coinChip, `${icon('coin', 'icon icon-sm')}−${r.spent}`);
      effects.toast(`${item.name} bought! Move the see-through ${item.name.toLowerCase()} and click to place it, or press Esc to keep it in storage.`, 'info', 'sofa');
      startPlacing(d.furn);
    },
    'furn-place': (d) => startPlacing(d.furn),
    'furn-move': (d) => {
      const p = game.state.home.placed.find((q) => q.uid === Number(d.uid));
      if (p) startPlacing(p.id, p.uid);
    },
    'furn-flip': (d) => { run('flipFurniture', Number(d.uid)); render(); },
    'furn-store': (d) => {
      const r = run('storeFurniture', Number(d.uid));
      if (r.ok) effects.toast(`${r.stored.map((id) => FURNITURE_BY_ID[id].name).join(' and ')} went into storage. Find ${r.stored.length > 1 ? 'them' : 'it'} under Furniture Shop › Stored.`, 'info', 'box');
      ui.popover = null;
      render();
    },
    'furn-flip-ghost': () => { if (ui.place) { ui.place.flip = !ui.place.flip; render(); } },
    'furn-cancel': () => { cancelPlacing(); },
    'save-now': () => { game.save(); effects.toast('Garden saved.', 'info', 'check'); render(); },
    'toggle-motion': (d, el) => {
      ui.reduceMotion = el.checked;
      document.documentElement.classList.toggle('reduce-motion', ui.reduceMotion);
      try { localStorage.setItem(MOTION_KEY, ui.reduceMotion ? '1' : '0'); } catch { /* ignore */ }
      render();
    },
    'reset-ask': () => { ui.confirmReset = true; render(); },
    'reset-cancel': () => { ui.confirmReset = false; render(); },
    'reset-confirm': () => {
      game.reset();
      Object.assign(ui, { panel: null, tool: null, seed: null, decorSel: null, popover: null, confirmReset: false, place: null });
      effects.toast('A fresh start! Your new garden is ready.', 'info', 'sparkle');
      render();
    },
  };

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    if (el.tagName === 'INPUT') return; // checkboxes use the change event
    const handler = handlers[el.dataset.action];
    if (handler) handler(el.dataset, el);
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('input[data-action]');
    if (el) handlers[el.dataset.action]?.(el.dataset, el);
  });
  function cancelPlacing() {
    if (!ui.place) return;
    const moving = !!ui.place.uid;
    ui.place = null;
    house.resetSpot();
    effects.toast(moving ? 'Move cancelled. It stays where it was.' : 'Placing cancelled. The item is waiting in storage.', 'info', 'box');
    render();
  }

  document.addEventListener('keydown', (e) => {
    if (ui.place && (e.key === 'f' || e.key === 'F') && !e.target.closest?.('input, textarea')) {
      ui.place.flip = !ui.place.flip;
      return render();
    }
    if (e.key !== 'Escape') return;
    if (ui.place) return cancelPlacing();
    if (ui.popover) ui.popover = null;
    else if (ui.tool) { ui.tool = null; ui.seed = null; }
    else ui.panel = null;
    render();
  });

  // ---------- Game events ----------
  game.on((event) => {
    if (event.type === 'saved') hud.showSave(true);
    if (event.type === 'saveFailed') hud.showSave(false);
  });

  // Keep plants growing on screen and remember to save now and then.
  setInterval(() => {
    game.tick();
    if (ui.scene === 'garden') garden.wander();
    render();
  }, 1000);
  setInterval(() => game.save(), CONFIG.AUTOSAVE_MS);
  window.addEventListener('beforeunload', () => game.save());
  document.addEventListener('visibilitychange', () => { if (document.hidden) game.save(); });

  document.body.dataset.scene = ui.scene;
  render();
  if (game.loadStatus === 'loaded') effects.toast('Welcome back! Your garden kept growing while you were away.', 'info', 'level');
  else if (game.loadStatus === 'recovered') effects.toast('Your old save could not be read, so a fresh garden was started.', 'warn', 'sparkle');
  else effects.toast('Welcome to Little Sprout! Click a patch of soil to plant your first carrot.', 'info', 'level');

  return { game, ui, render };
}
