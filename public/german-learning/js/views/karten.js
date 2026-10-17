import { $, $$, escapeHtml, today, speak, numberWord } from '../util.js';
import { data, markDirty, recordMistake, logToday } from '../store.js';
import { studyPools, nextCard, schedule, preview, kindOf, isLeech, isLearning, LEARN_AHEAD_MIN } from '../srs.js';
import { germanHtml, germanText, posLabel, formsLine, shortDate } from '../cardtext.js';
import { currentScene, cityOf } from '../scenes.js';
import { sync } from '../sync.js';
import * as icons from '../icons.js';

// The normal session is Anki's: the app decides what comes next. These filters are only for
// focused practice ("Gezielt üben") on one group of words, due or not.
const FILTERS = [
  { key: 'new', label: 'Neu', match: c => !Object.keys(data.srs.cards).some(k => k.startsWith(c.id + '#')) },
  { key: 'fehler', label: 'Fehlerheft', match: c => !!data.mistakes.items?.[c.id] },
  { key: 'noun', label: 'Nomen', match: c => c.pos === 'noun' },
  { key: 'verb', label: 'Verben', match: c => c.pos === 'verb' },
  { key: 'phrase', label: 'Wendungen', match: c => c.pos === 'phrase' || c.pos === 'connector' },
];
const FILTER_LIMIT = 25;

const fmtDays = n => (n === 1 ? '1 Tag' : n < 31 ? `${n} Tage` : n < 365 ? `${Math.round(n / 30)} Mon.` : `${(n / 365).toFixed(1).replace('.', ',')} J.`);
const fmtPreview = p => (p.minutes != null ? `${p.minutes} Min` : fmtDays(p.days));

let state = null;
let keyHandler = null;
let waitTimer = null;

function makePools(filterKey) {
  const day = today();
  const f = FILTERS.find(x => x.key === filterKey);
  const pools = studyPools({
    cards: data.cards, srs: data.srs, settings: data.srs.settings,
    match: f?.match || null, newDoneToday: data.srs.log?.[day]?.new || 0,
  });
  if (f) {
    pools.reviews = pools.reviews.slice(0, FILTER_LIMIT);
    pools.news = pools.news.slice(0, Math.max(0, FILTER_LIMIT - pools.reviews.length));
  }
  return pools;
}

export default {
  refreshable: () => !(state && state.graded > 0),

  render(root, args) {
    const filter = FILTERS.some(f => f.key === args[0]) ? args[0] : null;
    state = { filter, pools: makePools(filter), current: null, counter: 0, graded: 0, again: 0, flipped: false };
    const f = FILTERS.find(x => x.key === filter);
    root.innerHTML = `
      <section>
        <div class="deckline">
          <div class="srs-counts" id="counts" aria-live="polite"></div>
          ${f ? `<span>Gezielt üben: <b>${f.label}</b></span><a class="link" href="#karten">Zurück zur Wiederholung</a>`
              : '<button type="button" class="link" id="focusToggle" aria-expanded="false">Gezielt üben</button>'}
          <div class="chips" id="focusChips" role="group" aria-label="Gezielt üben" ${f ? '' : 'hidden'}>
            ${FILTERS.map(x => `<button type="button" data-f="${x.key}" aria-pressed="${x.key === filter}">${x.label}<small>${data.cards.filter(x.match).length}</small></button>`).join('')}
          </div>
        </div>
        <div id="stage"></div>
      </section>`;
    $('#focusToggle')?.addEventListener('click', e => {
      const chips = $('#focusChips');
      chips.hidden = !chips.hidden;
      e.target.setAttribute('aria-expanded', String(!chips.hidden));
    });
    $$('#focusChips button', root).forEach(b => b.addEventListener('click', () => {
      history.replaceState(null, '', `#karten/${b.dataset.f}`);
      this.render(root, [b.dataset.f]);
    }));
    keyHandler && document.removeEventListener('keydown', keyHandler);
    keyHandler = e => {
      if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey) return;
      const item = state?.current;
      if (!item) return;
      if (kindOf(item.sub) === 'genus') {
        const g = { 1: 'der', 2: 'die', 3: 'das' }[e.key];
        if (g) $(`#g button[data-g="${g}"]`)?.click();
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!state.flipped) flip(); }
      if (state.flipped && ['1', '2', '3', '4'].includes(e.key)) grade(Number(e.key) - 1);
    };
    document.addEventListener('keydown', keyHandler);
    renderCard();
  },

  async leave() {
    keyHandler && document.removeEventListener('keydown', keyHandler);
    keyHandler = null;
    clearTimeout(waitTimer);
    const graded = state?.graded;
    state = null;
    if (graded) await sync(`${graded} Karten`);
  },
};

// Anki's three numbers: new, learning, review cards still to come in this session.
function renderCounts() {
  const { pools, current } = state;
  const n = { new: pools.news.length, learning: pools.learning.length, review: pools.reviews.length };
  if (current) n[current.kind === 'new' ? 'new' : current.kind === 'learning' ? 'learning' : 'review']++;
  const cur = current?.kind;
  $('#counts').innerHTML = `
    <span class="c-new ${cur === 'new' ? 'on' : ''}" title="Neue Karten">${n.new}<small>neu</small></span>
    <span class="c-learn ${cur === 'learning' ? 'on' : ''}" title="Im Lernen, kommen heute wieder">${n.learning}<small>lernen</small></span>
    <span class="c-review ${cur === 'review' ? 'on' : ''}" title="Fällige Wiederholungen">${n.review}<small>wiederholen</small></span>`;
}

function renderCard() {
  const stage = $('#stage');
  clearTimeout(waitTimer);
  if (!data.cards.length) {
    stage.innerHTML = `<div class="sheet empty"><b>Noch keine Karten.</b>Claude legt sie in cards/cards.json an, sobald ihr Wörter gesammelt habt. Markierte Wörter aus dem Lesen landen im Eingang.</div>`;
    return;
  }
  state.current = nextCard(state.pools, Date.now(), state.counter++);
  renderCounts();
  if (!state.current) {
    // Only learning cards due in more than 20 minutes are left: wait for them.
    if (state.pools.learning.length) return renderWait();
    return renderDone();
  }
  state.flipped = false;
  const { card, sub, st } = state.current;
  const kind = kindOf(sub);
  const weak = data.mistakes.items?.[card.id];
  const corner = (!st ? 'Neu' : isLearning(st) ? (st.relearn ? 'Wieder lernen' : 'Lernen') : `Intervall ${fmtDays(st.interval)}`) + (weak ? ` · Fehlerheft ×${weak.count}` : '') + (isLeech(st) ? ' · Blutegel' : '');
  const postmark = `<span class="postmark">seit<br>${shortDate(card.added) || '—'}</span>`;

  if (kind === 'genus') {
    stage.innerHTML = `
      <div class="postcard"><div class="face front">
        <span class="corner">Genus · ${escapeHtml(corner)}</span>${postmark}
        <div>
          <div class="lemma">… ${escapeHtml(card.front)}</div>
          <span class="pos">${escapeHtml(card.back)}${card.plural ? ` · Plural: ${escapeHtml(card.plural)}` : ''}</span>
          <div class="genus" id="g">${['der', 'die', 'das'].map(g => `<button type="button" data-g="${g}">${g}</button>`).join('')}</div>
          <p class="ex" id="gx" style="visibility:hidden;margin-top:16px">${escapeHtml(card.example?.de || '')}</p>
        </div></div></div>
      <p class="hint">Genus-Karten werden sofort bewertet · Tasten 1–3</p>`;
    $('#g').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      const ok = b.dataset.g === card.gender;
      $$('#g button').forEach(x => {
        x.disabled = true;
        if (x.dataset.g === card.gender) x.classList.add('right');
        else if (x === b) x.classList.add('wrong');
      });
      $('#gx').style.visibility = 'visible';
      if (!ok) recordMistake({ key: card.id, front: germanText(card), given: `${b.dataset.g} ${card.front}`, expected: `${card.gender} ${card.front}`, source: 'karten', note: 'Genus' });
      setTimeout(() => grade(ok ? 2 : 0, true), ok ? 900 : 1600);
    });
    return;
  }

  const de = kind === 'de';
  const frontHtml = de
    ? `<div class="lemma">${germanHtml(card)}</div><span class="pos">${escapeHtml(posLabel(card))}</span>`
    : `<div class="lemma" style="font-size:clamp(28px,4vw,40px)">${escapeHtml(card.back)}</div><span class="pos">Auf Deutsch?</span>`;
  const backTop = de
    ? `<div class="meaning">${escapeHtml(card.back)}</div>`
    : `<div class="meaning">${germanHtml(card)}</div>`;
  const forms = formsLine(card);
  stage.innerHTML = `
    <div class="postcard" id="pc" tabindex="0" role="button" aria-label="Karte umdrehen">
      <div class="face front"><span class="corner">${escapeHtml(corner)}</span>${postmark}<div>${frontHtml}</div></div>
      <div class="face back"><div>
        ${backTop}
        ${card.example?.de ? `<p class="ex">${escapeHtml(card.example.de)}<small>${escapeHtml(card.example.en || '')}</small></p>` : ''}
        ${forms ? `<p class="forms">${forms}</p>` : ''}
        ${card.notes ? `<p class="cnote">${escapeHtml(card.notes)}</p>` : ''}
      </div><button type="button" class="say-btn" id="say" aria-label="Aussprechen">${icons.speaker}</button></div>
    </div>
    <div class="grade" id="gr" style="visibility:hidden">
      ${['Nochmal', 'Schwer', 'Gut', 'Leicht'].map((l, g) => `<button type="button" data-q="${g}" ${g === 0 ? 'class="again"' : ''}>${l}<small>${fmtPreview(preview(st, g))}</small></button>`).join('')}
    </div>
    <p class="hint" id="ht">Antippen oder Leertaste zum Umdrehen</p>`;
  $('#pc').addEventListener('click', e => { if (!e.target.closest('#say')) flip(); });
  $('#say').addEventListener('click', e => { e.stopPropagation(); speak(card.example?.de ? `${germanText(card)}. ${card.example.de}` : germanText(card)); });
  $('#gr').addEventListener('click', e => { const b = e.target.closest('button'); if (b) grade(Number(b.dataset.q)); });
}

function flip() {
  if (state.flipped) return;
  state.flipped = true;
  $('#pc').classList.add('flipped');
  $('#gr').style.visibility = 'visible';
  $('#ht').textContent = 'Wie gut wusstest du es? Tasten 1–4';
}

function grade(g, mistakeAlreadyRecorded = false) {
  const item = state.current;
  if (!item) return;
  state.current = null;
  const day = today();
  const prev = data.srs.cards[item.sub] || null;
  const wasReview = prev && !isLearning(prev);
  const next = schedule(prev, g, Date.now());
  data.srs.cards[item.sub] = next;
  logToday('reviews');
  if (!prev) logToday('new');
  const log = data.srs.log[day];
  if (!log.place && currentScene()) log.place = cityOf(currentScene());
  state.graded++;
  if (g === 0) {
    logToday('again');
    state.again++;
    if (wasReview && !mistakeAlreadyRecorded) {
      recordMistake({ key: item.card.id, front: germanText(item.card), expected: item.card.back, source: 'karten', note: kindOf(item.sub) === 'en' ? 'Englisch → Deutsch' : 'Deutsch → Englisch' });
    }
  }
  // Still learning: the card comes back in this session after its step (1 or 10 minutes).
  if (next.learn != null) state.pools.learning.push({ ...item, st: next, kind: 'learning', at: Date.parse(next.dueAt) });
  markDirty();
  renderCard();
}

function renderWait() {
  const at = Math.min(...state.pools.learning.map(x => x.at));
  const mins = Math.max(1, Math.ceil((at - Date.now() - LEARN_AHEAD_MIN * 60000) / 60000));
  $('#stage').innerHTML = `
    <div class="sheet" style="max-width:540px">
      <p class="eyebrow">Kurze Pause</p>
      <h2>Die nächste Karte ist in ${mins} ${mins === 1 ? 'Minute' : 'Minuten'} dran.</h2>
      <p class="muted">Wörter im Lernen kommen nach ihrer Lernstufe wieder. Du kannst warten oder später zurückkommen.</p>
      <div class="row mt"><a class="link" href="#test">Kurzer Test</a><a class="link" href="#heute">Fertig</a></div>
    </div>`;
  waitTimer = setTimeout(renderCard, Math.min(60000, Math.max(5000, at - Date.now() - LEARN_AHEAD_MIN * 60000)));
  if (state.graded) sync(`${state.graded} Karten`);
}

function renderDone() {
  const stage = $('#stage');
  const city = cityOf(currentScene());
  const n = state.graded;
  const empty = n === 0;
  const focused = !!state.filter;
  stage.innerHTML = `
    <div class="sheet" style="max-width:540px">
      <p class="eyebrow">${empty ? 'Nichts fällig' : focused ? 'Auswahl geübt' : 'Für heute fertig'}</p>
      <h2>${empty ? (focused ? 'In dieser Auswahl gibt es nichts zu üben.' : 'Heute ist nichts mehr fällig.') : `${numberWord(n, true)} ${n === 1 ? 'Karte' : 'Karten'}${state.again ? `, ${state.again === 1 ? 'einmal' : state.again <= 20 ? `${numberWord(state.again)}mal` : `${state.again}-mal`} „Nochmal“` : ', alles sitzt'}.`}</h2>
      <p class="muted">${empty ? 'Morgen kommen neue Wiederholungen. Mit „Gezielt üben“ kannst du trotzdem weitermachen.' : `Die Wörter kommen wieder, wenn du sie fast vergessen hättest.${city ? ` ${escapeHtml(city)} ist im Reisepass gestempelt.` : ''}`}</p>
      <div class="row mt">
        ${focused ? '<a class="btn" href="#karten">Zur Wiederholung</a>' : '<button class="btn ghost" type="button" id="moreFocus">Gezielt üben</button>'}
        <a class="link" href="#test">Kurzer Test</a>
        <a class="link" href="#heute">Fertig</a>
      </div>
    </div>`;
  $('#moreFocus')?.addEventListener('click', () => { const c = $('#focusChips'); c.hidden = false; $('#focusToggle')?.setAttribute('aria-expanded', 'true'); c.scrollIntoView({ block: 'center' }); });
  if (!empty) sync(`${n} Karten, ${state.again} nochmal`);
}
