// Wortreise — router and start-up.
import { $, $$, toast } from './util.js';
import { initScenes } from './scenes.js';
import * as S from './store.js';
import { sync, updateSyncDot } from './sync.js';
import heute from './views/heute.js';
import lesen from './views/lesen.js';
import karten from './views/karten.js';
import test from './views/test.js';
import wiederholen from './views/wiederholen.js';
import fortschritt from './views/fortschritt.js';
import grammatik from './views/grammatik.js';
import einstellungen from './views/einstellungen.js';

const ROUTES = { heute, lesen, karten, test, wiederholen, fortschritt, grammatik, einstellungen };
const NAV_FOR = { grammatik: 'wiederholen' };
let current = null;

function parse() {
  const h = decodeURIComponent(location.hash.replace(/^#/, '')) || 'heute';
  const [name, ...args] = h.split('/');
  return ROUTES[name] ? { name, args } : { name: 'heute', args: [] };
}

async function route() {
  const { name, args } = parse();
  if (current?.leave) {
    try { await current.leave(); } catch { /* leaving must never block navigation */ }
  }
  current = ROUTES[name];
  document.body.classList.toggle('working', name !== 'heute');
  document.body.classList.toggle('cards', name === 'karten');
  const navName = NAV_FOR[name] || name;
  $$('[data-route]').forEach(a => (a.dataset.route === navName ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  const root = $('#view');
  root.innerHTML = '';
  root.dataset.view = name;
  try {
    await current.render(root, args);
  } catch (e) {
    console.error(e);
    root.innerHTML = `<div class="sheet"><p class="eyebrow">Fehler</p><h2>Das hat nicht geklappt.</h2><p class="muted">${e.message}</p>
      <div class="row mt"><a class="btn" href="#einstellungen">Einstellungen prüfen</a><a class="link" href="#heute">Zur Startseite</a></div></div>`;
  }
  window.scrollTo(0, 0);
}

async function start() {
  initScenes();
  const restored = S.restoreCache();
  window.addEventListener('hashchange', route);
  if (restored) await route();
  try {
    await S.loadCore();
    // Re-render with fresh data unless the learner is in the middle of something.
    if (!restored || current?.refreshable?.() !== false) await route();
  } catch (e) {
    if (!restored) await route();
    toast(`Daten konnten nicht geladen werden: ${e.message}`, 'error');
  }
  updateSyncDot();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    current?.onHide?.();
    sync('Sitzung');
  }
});
window.addEventListener('online', () => sync('wieder online'));

start();
