// Data layer. Two backends with the same interface:
//   github — the learner's private repo (needs a token in Einstellungen)
//   demo   — bundled sample data in ./demo/, writes stay in this browser
// Core data (cards, scheduling, Fehlerheft, inbox) is loaded once and cached locally,
// so the app opens instantly and works on a train; changes sync back when online.
import * as gh from './github.js';
import { store as ls, today } from './util.js';
import { mergeSrs, DEFAULT_SETTINGS, LEECH_LAPSES } from './srs.js';

export const PATHS = {
  manifest: 'manifest.json',
  cards: 'cards/cards.json',
  inbox: 'cards/inbox.json',
  srs: 'review/srs.json',
  mistakes: 'review/mistakes.json',
};

export const isDemo = () => !gh.ghPat();

// ── backends ──────────────────────────────────────────────────────────────
const demoKey = p => `wr_demo:${p}`;
const backend = {
  async get(path) {
    if (isDemo()) {
      const local = ls.get(demoKey(path));
      if (local !== null) return local;
      const res = await fetch(`demo/${path}`, { cache: 'no-store' }).catch(() => null);
      return res && res.ok ? res.text() : null;
    }
    const f = await gh.getFile(path);
    return f ? f.text : null;
  },
  async put(path, text, message, merge) {
    if (isDemo()) { ls.set(demoKey(path), text); return; }
    await gh.writeFile(path, text, message, merge);
  },
  async list(dir) {
    if (isDemo()) {
      const files = new Map();
      const index = await fetch('demo/files.json').then(r => (r.ok ? r.json() : [])).catch(() => []);
      for (const p of index) if (p.startsWith(dir + '/')) files.set(p, { name: p.slice(dir.length + 1), path: p });
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k.startsWith(demoKey(dir + '/'))) {
            const p = k.slice(demoKey('').length);
            files.set(p, { name: p.slice(dir.length + 1), path: p });
          }
        }
      } catch { /* storage unavailable */ }
      return [...files.values()].filter(f => !f.name.includes('/'));
    }
    return gh.listDir(dir);
  },
};

export const getText = path => backend.get(path);
export async function getJson(path, fallback = null) {
  const t = await backend.get(path);
  if (t === null) return fallback;
  try { return JSON.parse(t); } catch { throw new Error(`${path} ist kein gültiges JSON.`); }
}
export const putText = (path, text, message, merge) => backend.put(path, text, message, merge);
export const putJson = (path, obj, message, merge) =>
  backend.put(path, JSON.stringify(obj, null, 2) + '\n', message,
    merge ? (remote, local) => JSON.stringify(merge(JSON.parse(remote), JSON.parse(local)), null, 2) + '\n' : undefined);
export const list = dir => backend.list(dir);

// ── core data ─────────────────────────────────────────────────────────────
export const data = {
  manifest: null,
  cards: [],
  srs: emptySrs(),
  mistakes: { version: 1, items: {} },
  inbox: { version: 1, items: [] },
  loaded: false,
  error: null,
};

function emptySrs() {
  return { version: 1, updated: null, settings: { ...DEFAULT_SETTINGS }, cards: {}, log: {}, tests: [] };
}

const cacheKey = () => `wr_core:${isDemo() ? 'demo' : gh.ghRepo()}`;
const dirtyKey = () => `wr_dirty:${isDemo() ? 'demo' : gh.ghRepo()}`;

function applyCore(core) {
  data.manifest = core.manifest || null;
  data.cards = core.cards?.cards || [];
  data.srs = { ...emptySrs(), ...(core.srs || {}) };
  data.srs.settings = { ...DEFAULT_SETTINGS, ...(data.srs.settings || {}) };
  data.mistakes = core.mistakes || { version: 1, items: {} };
  data.inbox = core.inbox || { version: 1, items: [] };
}

function snapshot() {
  return {
    manifest: data.manifest,
    cards: { cards: data.cards },
    srs: data.srs,
    mistakes: data.mistakes,
    inbox: data.inbox,
  };
}

// Instant start from the local copy (if any). Returns true when something was restored.
export function restoreCache() {
  const cached = ls.json(cacheKey());
  if (!cached) return false;
  applyCore(cached);
  data.loaded = true;
  return true;
}

export async function loadCore() {
  try {
    const manifest = await getJson(PATHS.manifest, null);
    const cardsPath = manifest?.cards?.path || PATHS.cards;
    const [cards, srs, mistakes, inbox] = await Promise.all([
      getJson(cardsPath, { cards: [] }),
      getJson(PATHS.srs, null),
      getJson(PATHS.mistakes, null),
      getJson(PATHS.inbox, null),
    ]);
    const local = ls.json(dirtyKey());
    applyCore({ manifest, cards, srs, mistakes, inbox });
    if (local) {
      // Changes made offline (or a failed save) are merged back in and pushed.
      data.srs = mergeSrs(data.srs, local.srs);
      data.mistakes = mergeMistakes(data.mistakes, local.mistakes);
      await syncProgress('Offline-Änderungen').catch(() => {});
    }
    if (isDemo()) seedDemoLog();
    data.loaded = true;
    data.error = null;
    ls.setJson(cacheKey(), snapshot());
  } catch (e) {
    data.error = e.message;
    if (!data.loaded) throw e;
  }
}

// ── progress writes (srs + Fehlerheft) ───────────────────────────────────
let saving = null;
export function markDirty() {
  data.srs.updated = new Date().toISOString();
  ls.setJson(dirtyKey(), { srs: data.srs, mistakes: data.mistakes });
  ls.setJson(cacheKey(), snapshot());
}

export async function syncProgress(summary = 'Lernstand') {
  if (!ls.get(dirtyKey())) return false;
  if (saving) return saving;
  saving = (async () => {
    try {
      await putJson(PATHS.srs, data.srs, `srs: ${summary}`, mergeSrs);
      await putJson(PATHS.mistakes, data.mistakes, `fehlerheft: ${summary}`, mergeMistakes);
      ls.remove(dirtyKey());
      return true;
    } finally {
      saving = null;
    }
  })();
  return saving;
}
export const hasUnsynced = () => !!ls.get(dirtyKey());

export function mergeMistakes(remote, local) {
  if (!remote) return local;
  if (!local) return remote;
  const items = { ...remote.items };
  for (const [k, v] of Object.entries(local.items || {})) {
    const r = items[k];
    if (!r) { items[k] = v; continue; }
    const seen = new Set();
    const errors = [...(r.errors || []), ...(v.errors || [])].filter(e => {
      const key = `${e.date}|${e.given}|${e.expected}|${e.source}`;
      return seen.has(key) ? false : seen.add(key);
    });
    const count = Math.max(r.count || 0, v.count || 0);
    items[k] = { ...r, ...v, errors, count, last: [r.last, v.last].sort().pop(), leech: count >= LEECH_LAPSES || !!(r.leech || v.leech) };
  }
  // Items Claude cleared on purpose stay cleared: local copies only re-add items with new errors.
  return { ...remote, items };
}

// Record a wrong answer in the Fehlerheft.
export function recordMistake({ key, front, given = '', expected = '', source, note = '' }) {
  const items = data.mistakes.items || (data.mistakes.items = {});
  const it = items[key] || { front, count: 0, last: null, leech: false, errors: [] };
  it.front = it.front || front;
  it.count += 1;
  it.last = today();
  it.leech = it.leech || it.count >= LEECH_LAPSES;
  it.errors = [...(it.errors || []), { date: today(), given, expected, source, ...(note ? { note } : {}) }].slice(-12);
  items[key] = it;
}

export function logToday(field, n = 1, extra = {}) {
  const d = today();
  const log = data.srs.log || (data.srs.log = {});
  const e = log[d] || (log[d] = {});
  if (field) e[field] = (e[field] || 0) + n;
  Object.assign(e, extra);
}

// ── inbox ─────────────────────────────────────────────────────────────────
export async function addToInbox(item) {
  const entry = { ...item, added: today() };
  data.inbox.items = [...(data.inbox.items || []), entry];
  ls.setJson(cacheKey(), snapshot());
  const merge = (remote, local) => {
    const seen = new Set();
    const items = [...(remote.items || []), ...(local.items || [])].filter(i => {
      const k = `${i.text}|${i.article || ''}`;
      return seen.has(k) ? false : seen.add(k);
    });
    return { version: 1, items };
  };
  await putJson(PATHS.inbox, data.inbox, `inbox: ${item.text}`, merge);
}

// ── articles & annotations ───────────────────────────────────────────────
export async function listArticles() {
  if (data.manifest?.articles?.length) return data.manifest.articles;
  const items = await list('articles');
  return items.filter(f => f.name.endsWith('.md'))
    .map(f => ({ slug: f.name.replace(/\.md$/, ''), title: '', path: f.path }))
    .sort((a, b) => b.slug.localeCompare(a.slug));
}

export async function loadAnnotations(slug) {
  const j = await getJson(`annotations/${slug}.json`, null);
  return j ? j.annotations || [] : null;
}

export function saveAnnotations(slug, arr) {
  return putJson(`annotations/${slug}.json`, { slug, annotations: arr }, `Update annotations for ${slug}`);
}

export function saveArticle(meta) {
  const lines = ['---', `title: ${meta.title || meta.slug}`];
  if (meta.date) lines.push(`date: ${meta.date}`);
  if (meta.difficulty) lines.push(`difficulty: ${meta.difficulty}`);
  if (meta.source) lines.push(`source: ${meta.source}`);
  lines.push('---', '', meta.text);
  return putText(`articles/${meta.slug}.md`, lines.join('\n'), `Add article ${meta.slug}`);
}

// ── banks, grammar, journal, results ─────────────────────────────────────
export async function listBanks() {
  if (data.manifest?.banks) return data.manifest.banks;
  const items = await list('tests/bank');
  return items.filter(f => f.name.endsWith('.json')).map(f => ({ id: f.name.replace(/\.json$/, ''), title: f.name, path: f.path }));
}

export async function listGrammar() {
  if (data.manifest?.grammar) return data.manifest.grammar;
  const items = await list('grammar');
  return items.filter(f => f.name.endsWith('.md'))
    .map(f => ({ slug: f.name.replace(/\.md$/, ''), title: f.name.replace(/\.md$/, '').replace(/-/g, ' '), path: f.path, tags: [] }));
}

export function saveResult(result) {
  const stamp = new Date().toISOString().slice(0, 16).replace(':', '-');
  return putJson(`tests/results/${stamp}.json`, result, `test: ${result.score}/${result.of} ${result.bank}`);
}

export const journalPath = d => `journal/${d}.md`;
export function saveJournal(d, text) {
  const merge = (remote) => {
    // Keep Claude's correction if it already exists; replace only the entry itself.
    const corr = remote.indexOf('\n## Korrektur');
    const head = `# Tagebuch — ${d}\n\n${text.trim()}\n`;
    return corr === -1 ? head : head + remote.slice(corr);
  };
  return putText(journalPath(d), `# Tagebuch — ${d}\n\n${text.trim()}\n`, `journal: ${d}`, merge);
}

// ── demo helpers ─────────────────────────────────────────────────────────
function seedDemoLog() {
  // A believable study history so the progress screen has something to show.
  const log = data.srs.log || (data.srs.log = {});
  if (Object.keys(log).length > 3) return;
  const base = new Date();
  for (let i = 1; i < 70; i++) {
    const d = new Date(base); d.setDate(d.getDate() - i);
    const r = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    if (r < (i < 30 ? 0.25 : 0.55)) continue;
    log[today(d)] = { reviews: Math.round(5 + r * 25), again: Math.round(r * 4), new: Math.round(r * 6) };
  }
}
