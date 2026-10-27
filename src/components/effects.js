// Little bits of juice: floating rewards, toasts, sparkles and banners.
import { icon, url } from '../assets/index.js';
import { esc, prefersReducedMotion } from './ui.js';
import { SCENE } from '../data/gardenLayout.js';

export function createEffects({ stage, fxLayer, toastBox }) {
  // Floating text/icon that rises from a point in the garden (scene units).
  function floatAt(x, y, html, delay = 0) {
    const el = document.createElement('div');
    el.className = 'floater';
    el.innerHTML = html;
    el.style.left = `${(x / SCENE.width) * 100}%`;
    el.style.top = `${(y / SCENE.height) * 100}%`;
    el.style.animationDelay = `${delay}ms`;
    stage.appendChild(el);
    setTimeout(() => el.remove(), 1600 + delay);
  }

  // Floating text near any element on the page (for shop buttons etc).
  function floatFrom(target, html) {
    if (!target?.getBoundingClientRect) return;
    const r = target.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'floater floater-fixed';
    el.innerHTML = html;
    el.style.left = `${r.left + r.width / 2}px`;
    el.style.top = `${r.top}px`;
    fxLayer.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }

  // A small burst of particles (leaves, hearts, drops) at a garden point.
  function burst(x, y, kind = 'leaf', count = 7) {
    if (prefersReducedMotion()) return;
    const src = { leaf: url('icons/check'), heart: url('icons/heart'), drop: url('icons/water'), star: url('icons/sparkle'), dirt: null }[kind];
    for (let i = 0; i < count; i++) {
      const p = document.createElement(src ? 'img' : 'span');
      if (src) { p.src = src; p.alt = ''; }
      p.className = `particle particle-${kind}`;
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const dist = 26 + Math.random() * 34;
      p.style.left = `${(x / SCENE.width) * 100}%`;
      p.style.top = `${(y / SCENE.height) * 100}%`;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist - 24}px`);
      p.style.setProperty('--rot', `${Math.random() * 300 - 150}deg`);
      stage.appendChild(p);
      setTimeout(() => p.remove(), 900);
    }
  }

  function toast(message, kind = 'info', iconName = null) {
    const el = document.createElement('div');
    el.className = `toast toast-${kind}`;
    el.innerHTML = `${iconName ? icon(iconName, 'icon icon-sm') : ''}<span>${esc(message)}</span>`;
    toastBox.appendChild(el);
    while (toastBox.children.length > 3) toastBox.firstChild.remove();
    setTimeout(() => el.classList.add('leaving'), 2600);
    setTimeout(() => el.remove(), 3000);
  }

  function confetti(count = 26) {
    if (prefersReducedMotion()) return;
    const colors = ['#9fd06a', '#f2a7a8', '#e8b84a', '#7cc3e0', '#fbf3e1', '#d9473f'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'confetti';
      p.style.left = `${10 + Math.random() * 80}vw`;
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = `${Math.random() * 300}ms`;
      p.style.setProperty('--drift', `${Math.random() * 120 - 60}px`);
      p.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
      fxLayer.appendChild(p);
      setTimeout(() => p.remove(), 2600);
    }
  }

  function banner(title, lines = [], iconName = 'sparkle') {
    fxLayer.querySelector('.banner')?.remove();
    const el = document.createElement('div');
    el.className = 'banner';
    el.setAttribute('role', 'status');
    el.innerHTML = `${icon(iconName, 'banner-icon')}<div><strong>${esc(title)}</strong>${lines.map((l) => `<span>${esc(l)}</span>`).join('')}</div>`;
    el.addEventListener('click', () => el.remove());
    fxLayer.appendChild(el);
    setTimeout(() => el.classList.add('leaving'), 4200);
    setTimeout(() => el.remove(), 4700);
  }

  return { floatAt, floatFrom, burst, toast, confetti, banner };
}
