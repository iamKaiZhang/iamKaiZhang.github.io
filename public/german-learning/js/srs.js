// Spaced repetition in the style of Anki. Pure functions only (unit-tested in src/__tests__).
//
// Each card yields sub-cards that are scheduled separately:
//   <id>#de     German on the front
//   <id>#en     English on the front
//   <id>#genus  der/die/das drill (nouns with a gender)
// Grades: 0 Nochmal, 1 Schwer, 2 Gut, 3 Leicht.
//
// A sub-card is in one of three states:
//   new        no entry in srs.cards yet
//   learning   `learn` is set: it walks through short steps in minutes (1 min, 10 min) inside
//              a session and only then graduates to a 1-day interval. A review card that is
//              missed goes back to learning (`relearn`) for one 10-minute step.
//   review     scheduled in days; the interval grows by the card's ease (2.5 at the start).

export const DEFAULT_SETTINGS = { newPerDay: 10, directions: 'both' };
export const LEECH_LAPSES = 4;
export const LEARN_STEPS = [1, 10];   // minutes
export const RELEARN_STEPS = [10];    // minutes
export const GRADUATING_DAYS = 1;
export const EASY_DAYS = 4;
export const LEARN_AHEAD_MIN = 20;    // show a learning card early if nothing else is left
const EASE_START = 2.5;
const EASE_MIN = 1.3;
const MINUTE = 60000;

// Local calendar date as YYYY-MM-DD.
export function localDay(ms = Date.now()) {
  const d = new Date(ms);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

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

// Learning (or relearning). Older data marked a missed card only by reps 0 / interval 0.
export const isLearning = st => !!st && (st.learn != null || (!st.reps && !st.interval));
const stepsOf = st => (st?.relearn ? RELEARN_STEPS : LEARN_STEPS);

// What a grade would do, without changing anything: { minutes } or { days }.
export function preview(st, grade) {
  if (!st || isLearning(st)) {
    const steps = stepsOf(st);
    const step = Math.min(st?.learn ?? 0, steps.length - 1);
    const graduate = st?.relearn ? Math.max(1, st.interval || 1) : GRADUATING_DAYS;
    if (grade === 0) return { minutes: steps[0] };
    if (grade === 1) return { minutes: step === 0 && steps.length > 1 ? Math.round((steps[0] + steps[1]) / 2) : steps[step] };
    if (grade === 2) return step + 1 < steps.length ? { minutes: steps[step + 1] } : { days: graduate };
    return { days: st?.relearn ? graduate + 1 : EASY_DAYS };
  }
  if (grade === 0) return { minutes: RELEARN_STEPS[0] };
  const ivl = Math.max(1, st.interval || 1);
  const ease = st.ease ?? EASE_START;
  const hard = Math.max(ivl + 1, Math.round(ivl * 1.2));
  const good = Math.max(hard + 1, Math.round(ivl * ease));
  const easy = Math.max(good + 1, Math.round(ivl * ease * 1.3));
  return { days: [0, hard, good, easy][grade] };
}

export function schedule(st, grade, now = Date.now()) {
  const day = localDay(now);
  const prev = st || { interval: 0, ease: EASE_START, reps: 0, lapses: 0 };
  const p = preview(st, grade);
  const next = { ...prev, last: day, lastAt: new Date(now).toISOString() };
  const setStep = (step, minutes) => {
    next.learn = step;
    next.due = day;
    next.dueAt = new Date(now + minutes * MINUTE).toISOString();
  };

  if (st && !isLearning(st)) {
    if (grade === 0) {
      // Lapse: back to relearning; afterwards the card restarts at a 1-day interval.
      next.lapses = (prev.lapses || 0) + 1;
      next.ease = Math.max(EASE_MIN, +(prev.ease - 0.2).toFixed(2));
      next.relearn = true;
      next.interval = 1;
      setStep(0, p.minutes);
      return next;
    }
    next.ease = Math.max(EASE_MIN, +(prev.ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0)).toFixed(2));
    next.interval = p.days;
    next.reps = (prev.reps || 0) + 1;
    next.due = addDays(day, p.days);
    return next;
  }

  // New or learning.
  if (p.minutes != null) {
    const step = grade === 0 ? 0 : grade === 1 ? (prev.learn ?? 0) : (prev.learn ?? 0) + 1;
    next.reps = prev.reps || 0;
    setStep(step, p.minutes);
    return next;
  }
  delete next.learn;
  delete next.relearn;
  delete next.dueAt;
  next.interval = p.days;
  next.reps = (prev.reps || 0) + 1;
  next.due = addDays(day, p.days);
  return next;
}

export const isLeech = st => (st?.lapses || 0) >= LEECH_LAPSES;
const dueAtMs = st => (st?.dueAt ? Date.parse(st.dueAt) : 0);

// Sort the collection into today's three piles. At most one sub-card per word (siblings are
// buried, as in Anki): a word in learning shows that card, else its most overdue review, else a new side.
//   match:  optional filter for focused practice; then every matching reviewed card counts, due or not.
export function studyPools({ cards, srs, now = Date.now(), settings = DEFAULT_SETTINGS, match = null, newDoneToday = 0 }) {
  const day = localDay(now);
  const states = srs?.cards || {};
  const learning = [], reviews = [], fresh = [];
  for (const card of cards) {
    if (match && !match(card)) continue;
    let lrn = null, rev = null, neu = null;
    for (const sub of subIds(card, settings.directions || 'both')) {
      const st = states[sub];
      if (!st) { if (!neu) neu = { card, sub, st: null, kind: 'new' }; continue; }
      if (isLearning(st)) {
        if (!lrn || dueAtMs(st) < lrn.at) lrn = { card, sub, st, kind: 'learning', at: dueAtMs(st) };
      } else if (match || st.due <= day) {
        if (!rev || st.due < rev.st.due) rev = { card, sub, st, kind: 'review' };
      }
    }
    if (lrn) learning.push(lrn);
    else if (rev) reviews.push(rev);
    else if (neu) fresh.push(neu);
  }
  learning.sort((a, b) => a.at - b.at);
  reviews.sort((a, b) => (a.st.due < b.st.due ? -1 : a.st.due > b.st.due ? 1 : 0));
  const newAllowed = match ? fresh.length : Math.max(0, (settings.newPerDay ?? 10) - newDoneToday);
  return { learning, reviews, news: fresh.slice(0, newAllowed) };
}

// Pick the next card of a session, Anki-style: a learning card whose step is due, then reviews
// with a new card after every two, then learning cards up to 20 minutes early. null = finished.
export function nextCard(pools, now = Date.now(), counter = 0) {
  const { learning, reviews, news } = pools;
  learning.sort((a, b) => a.at - b.at);
  if (learning.length && learning[0].at <= now) return learning.shift();
  if (news.length && (!reviews.length || counter % 3 === 2)) return news.shift();
  if (reviews.length) return reviews.shift();
  if (learning.length && learning[0].at <= now + LEARN_AHEAD_MIN * MINUTE) return learning.shift();
  return null;
}

// Everything that waits today, in session order (used for counts and for tests built from due words).
export function buildQueue(opts) {
  const pools = studyPools(opts);
  const out = [...pools.learning];
  const rest = { learning: [], reviews: [...pools.reviews], news: [...pools.news] };
  let item, i = 0;
  while ((item = nextCard(rest, Infinity, i++))) out.push(item);
  return out.slice(0, opts.limit ?? 500);
}

// Learning state of a word, judged by its German-front sub-card.
export function cardStage(card, srs) {
  const st = srs?.cards?.[`${card.id}#de`] || srs?.cards?.[`${card.id}#en`];
  if (!st) return 'new';
  if (isLearning(st) || st.reps < 2) return 'learning';
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
    const stamp = x => x.lastAt || x.last || '';
    if (!r || stamp(st) > stamp(r) || (stamp(st) === stamp(r) && (st.reps || 0) > (r.reps || 0))) cards[k] = st;
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
