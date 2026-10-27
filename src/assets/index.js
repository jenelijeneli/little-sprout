// Gives every SVG in this folder a name, so the rest of the code can say
// art.url('icons/coin') or art.raw('crops/carrot-2').
//  - url(): a link to the file, used in <img> tags.
//  - raw(): the SVG text itself, placed straight into the page so parts of
//           creatures and plants can be animated with CSS.

const urls = import.meta.glob('./**/*.svg', { eager: true, query: '?url', import: 'default' });
const raws = import.meta.glob(['./crops/*.svg', './creatures/*.svg', './garden/butterfly-*.svg', './garden/cottage.svg', './garden/scarecrow.svg', './garden/gate.svg', './house/*.svg'], { eager: true, query: '?raw', import: 'default' });

export function url(path) {
  return urls[`./${path}.svg`];
}

export function raw(path) {
  return raws[`./${path}.svg`] || '';
}

// Small helper for an <img> tag of an icon.
export function img(path, className = 'icon', alt = '') {
  return `<img class="${className}" src="${url(path)}" alt="${alt}" draggable="false" />`;
}

export const icon = (name, className = 'icon', alt = '') => img(`icons/${name}`, className, alt);
