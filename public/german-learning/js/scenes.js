// Background scenes: one random place per visit, never the same twice in a row.
import { $, store, dailyIndex } from './util.js';

let scenes = [];
let current = null;
const listeners = new Set();

export const currentScene = () => current;
export const allScenes = () => scenes;
export const onSceneChange = fn => listeners.add(fn);

export async function initScenes() {
  try {
    const res = await fetch('scenes/scenes.json', { cache: 'no-cache' });
    scenes = res.ok ? await res.json() : [];
  } catch { scenes = []; }
  if (!scenes.length) return;
  const mode = store.get('wr_scene_mode', 'random');
  let idx;
  if (mode === 'daily') idx = dailyIndex(scenes.length, 'scene');
  else if (mode === 'fixed') idx = Math.max(0, scenes.findIndex(s => s.file === store.get('wr_scene_fixed')));
  else idx = pickRandom(Number(store.get('wr_scene_last', -1)));
  show(idx);
  $('#shuffle').addEventListener('click', () => show(pickRandom(scenes.indexOf(current))));
}

function pickRandom(avoid) {
  if (scenes.length < 2) return 0;
  let i;
  do { i = Math.floor(Math.random() * scenes.length); } while (i === avoid);
  return i;
}

export function show(i) {
  const s = scenes[i];
  if (!s) return;
  current = s;
  store.set('wr_scene_last', String(i));
  const img = $('#sceneImg');
  img.classList.remove('on');
  const pre = new Image();
  pre.onload = () => {
    img.src = pre.src;
    img.style.setProperty('--focus', s.focus || '60% 55%');
    img.style.setProperty('--mfocus', s.mfocus || '55% 60%');
    requestAnimationFrame(() => img.classList.add('on'));
  };
  pre.src = `scenes/${s.file}`;
  document.documentElement.style.setProperty('--paper', s.paper || '#e6d7bd');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', s.paper || '#e6d7bd');
  $('#capDe').textContent = s.de || '';
  $('#capEn').textContent = s.en || '';
  $('#capPlace').textContent = s.place || '';
  listeners.forEach(fn => fn(s));
}

// Short city name for passport stamps: "Brandenburger Tor · Berlin" → "Berlin".
export const cityOf = s => (s?.place || '').split('·').pop().trim();
