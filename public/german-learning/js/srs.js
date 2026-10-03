// Spaced repetition, Anki-style SM-2 lite. Pure functions only (unit-tested in src/__tests__).
//
// Each card yields sub-cards that are scheduled separately:
//   <id>#de     German on the front
//   <id>#en     English on the front
//   <id>#genus  der/die/das drill (nouns with a gender)
// Grades: 0 Nochmal, 1 Schwer, 2 Gut, 3 Leicht.

export const DEFAULT_SETTINGS = { newPerDay: 10, directions: 'both' };
export const LEECH_LAPSES = 4;
const EASE_START = 2.5;
const EASE_MIN = 1.3;

function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

export function subIds(card, directions = 'both') {
  const ids = [];
  if (directions !== 'en') ids.push(`${card.id}#de`);
  if (directions !== 'de') ids.push(`${card.id}#en`);
  if (card.pos === 'noun' && card.gender) ids.push(`${card.id}#genus`);
  return ids;
}

export const kindOf = sub => sub.slice(sub.lastIndexOf('#') + 1);
export const cardIdOf = sub => sub.slice(0, sub.lastIndexOf('#'));

// Interval in days that a grade would give. 0 means "again today".
export function nextInterval(st, grade) {
  if (grade === 0) return 0;
  const reps = st?.reps ?? 0;
  const ivl = st?.interval ?? 0;
  const ease = st?.ease ?? EASE_START;
  if (reps === 0) return [0, 1, 1, 4][grade];
  if (reps === 1) return [0, 3, 6, 8][grade];
  if (grade === 1) return Math.max(ivl + 1, Math.round(ivl * 1.2));
  if (grade === 2) return Math.max(ivl + 1, Math.round(ivl * ease));
  return Math.max(ivl + 2, Math.round(ivl * ease * 1.3));
}

export function schedule(st, grade, day) {
  const prev = st || { due: day, interval: 0, ease: EASE_START, reps: 0, lapses: 0, last: null };
  const next = { ...prev, last: day };
  if (grade === 0) {
    next.lapses = (prev.lapses || 0) + (prev.reps > 0 ? 1 : 0);
    next.reps = 0;
    next.interval = 0;
    next.ease = Math.max(EASE_MIN, +(prev.ease - 0.2).toFixed(2));
    next.due = day;
    return next;
  }
  next.interval = nextInterval(prev, grade);
  next.ease = Math.max(EASE_MIN, +(prev.ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0)).toFixed(2));
  next.reps = (prev.reps || 0) + 1;
  next.due = addDays(day, next.interval);
  return next;
}

export const isLeech = st => (st?.lapses || 0) >= LEECH_LAPSES;

// Build a study queue.
//   filter: 'due' (scheduled reviews + today's new cards) or a predicate name handled by the caller via `match`.
//   Siblings are buried: at most one sub-card per word per session, as in Anki.
export function buildQueue({ cards, srs, day, settings = DEFAULT_SETTINGS, match = null, newDoneToday = 0, limit = 200 }) {
  const states = srs?.cards || {};
  const directions = settings.directions || 'both';
  const reviews = [];
  const fresh = [];
  for (const card of cards) {
    if (match && !match(card)) continue;
    let best = null;
    for (const sub of subIds(card, directions)) {
      const st = states[sub];
      if (st) {
        if (match || st.due <= day) {
          if (!best || best.kind === 'new' || st.due < best.st.due) best = { card, sub, st, kind: 'review' };
        }
      } else if (!best) {
        best = { card, sub, st: null, kind: 'new' };
      }
    }
    if (!best) continue;
    (best.kind === 'review' ? reviews : fresh).push(best);
  }
  reviews.sort((a, b) => (a.st.due < b.st.due ? -1 : a.st.due > b.st.due ? 1 : 0));
  const newAllowed = match ? fresh.length : Math.max(0, (settings.newPerDay ?? 10) - newDoneToday);
  const news = fresh.slice(0, newAllowed);
  // Spread new cards through the reviews: one new after every two reviews.
  const out = [];
  let r = 0, n = 0;
  while (r < reviews.length || n < news.length) {
    if (r < reviews.length) out.push(reviews[r++]);
    if (r < reviews.length) out.push(reviews[r++]);
    if (n < news.length) out.push(news[n++]);
  }
  return out.slice(0, limit);
}

// Learning state of a word, judged by its German-front sub-card.
export function cardStage(card, srs) {
  const st = srs?.cards?.[`${card.id}#de`] || srs?.cards?.[`${card.id}#en`];
  if (!st) return 'new';
  if (st.reps < 2 || st.interval < 1) return 'learning';
  if (st.interval < 21) return 'young';
  return 'mature';
}

// Merge two copies of srs.json (e.g. phone and laptop): per sub-card the later review wins.
export function mergeSrs(remote, local) {
  if (!remote) return local;
  if (!local) return remote;
  const cards = { ...remote.cards };
  for (const [k, st] of Object.entries(local.cards || {})) {
    const r = cards[k];
    if (!r || (st.last || '') > (r.last || '') || ((st.last || '') === (r.last || '') && st.reps > r.reps)) cards[k] = st;
  }
  const log = { ...(remote.log || {}) };
  for (const [d, e] of Object.entries(local.log || {})) {
    const r = log[d] || {};
    const merged = { ...r, ...e };
    for (const f of ['reviews', 'again', 'new', 'tests']) merged[f] = Math.max(r[f] || 0, e[f] || 0);
    log[d] = merged;
  }
  const seen = new Set();
  const tests = [...(remote.tests || []), ...(local.tests || [])]
    .filter(t => (seen.has(t.at) ? false : seen.add(t.at)))
    .sort((a, b) => (a.at < b.at ? -1 : 1));
  return { ...remote, ...local, cards, log, tests, settings: local.settings || remote.settings };
}
