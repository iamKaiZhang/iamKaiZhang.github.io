import { $, $$, escapeHtml, today, speak, numberWord } from '../util.js';
import { data, markDirty, recordMistake, logToday } from '../store.js';
import { buildQueue, schedule, nextInterval, kindOf, isLeech } from '../srs.js';
import { germanHtml, germanText, posLabel, formsLine, shortDate } from '../cardtext.js';
import { currentScene, cityOf } from '../scenes.js';
import { sync } from '../sync.js';

const FILTERS = [
  { key: 'due', label: 'Fällig' },
  { key: 'new', label: 'Neu', match: c => !Object.keys(data.srs.cards).some(k => k.startsWith(c.id + '#')) },
  { key: 'fehler', label: 'Fehlerheft', match: c => !!data.mistakes.items?.[c.id] },
  { key: 'noun', label: 'Nomen', match: c => c.pos === 'noun' },
  { key: 'verb', label: 'Verben', match: c => c.pos === 'verb' },
  { key: 'phrase', label: 'Wendungen', match: c => c.pos === 'phrase' || c.pos === 'connector' },
];
const FILTER_LIMIT = 25;
const fmt = n => (n === 0 ? '10 Min' : n === 1 ? '1 Tag' : `${n} Tage`);

let state = null;
let keyHandler = null;

function makeQueue(filterKey) {
  const day = today();
  const f = FILTERS.find(x => x.key === filterKey) || FILTERS[0];
  return buildQueue({
    cards: data.cards, srs: data.srs, day, settings: data.srs.settings,
    match: f.match || null, newDoneToday: data.srs.log?.[day]?.new || 0,
    limit: f.match ? FILTER_LIMIT : 200,
  });
}

function counts() {
  const out = {};
  for (const f of FILTERS) out[f.key] = f.match ? data.cards.filter(f.match).length : makeQueue('due').length;
  return out;
}

export default {
  refreshable: () => !(state && state.graded > 0),

  render(root, args) {
    const filter = FILTERS.some(f => f.key === args[0]) ? args[0] : 'due';
    state = { filter, queue: makeQueue(filter), i: 0, graded: 0, again: 0, flipped: false };
    const c = counts();
    root.innerHTML = `
      <section>
        <div class="deckline">
          <div class="chips" role="group" aria-label="Karten filtern">
            ${FILTERS.map(f => `<button type="button" data-f="${f.key}" aria-pressed="${f.key === filter}">${f.label}<small>${c[f.key]}</small></button>`).join('')}
          </div>
          <select class="plain" id="dir" aria-label="Richtung">
            <option value="both">Deutsch ↔ Englisch</option>
            <option value="de">nur Deutsch → Englisch</option>
            <option value="en">nur Englisch → Deutsch</option>
          </select>
          <span id="count"></span>
        </div>
        <div id="stage"></div>
      </section>`;
    $('#dir').value = data.srs.settings.directions || 'both';
    $('#dir').addEventListener('change', e => {
      data.srs.settings.directions = e.target.value;
      markDirty();
      this.render(root, [state.filter]);
    });
    $$('.chips button', root).forEach(b => b.addEventListener('click', () => {
      history.replaceState(null, '', b.dataset.f === 'due' ? '#karten' : `#karten/${b.dataset.f}`);
      this.render(root, [b.dataset.f]);
    }));
    keyHandler && document.removeEventListener('keydown', keyHandler);
    keyHandler = e => {
      if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey) return;
      const item = state.queue[state.i];
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
    const graded = state?.graded;
    state = null;
    if (graded) await sync(`${graded} Karten`);
  },
};

function renderCard() {
  const stage = $('#stage');
  const { queue, i } = state;
  $('#count').textContent = i < queue.length ? `${i + 1} von ${queue.length}` : '';
  if (!data.cards.length) {
    stage.innerHTML = `<div class="sheet empty"><b>Noch keine Karten.</b>Claude legt sie in cards/cards.json an, sobald ihr Wörter gesammelt habt. Markierte Wörter aus dem Lesen landen im Eingang.</div>`;
    return;
  }
  if (i >= queue.length) return renderDone();
  state.flipped = false;
  const { card, sub, st } = queue[i];
  const kind = kindOf(sub);
  const weak = data.mistakes.items?.[card.id];
  const corner = (st && st.reps > 0 ? `Intervall ${fmt(st.interval)}` : 'Neu') + (weak ? ` · Fehlerheft ×${weak.count}` : '') + (isLeech(st) ? ' · Blutegel' : '');
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
      </div><button type="button" class="say-btn" id="say" aria-label="Aussprechen">🔊</button></div>
    </div>
    <div class="grade" id="gr" style="visibility:hidden">
      ${['Nochmal', 'Schwer', 'Gut', 'Leicht'].map((l, g) => `<button type="button" data-q="${g}" ${g === 0 ? 'class="again"' : ''}>${l}<small>${fmt(nextInterval(st, g))}</small></button>`).join('')}
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
  const item = state.queue[state.i];
  if (!item) return;
  const day = today();
  const prev = data.srs.cards[item.sub] || null;
  const next = schedule(prev, g, day);
  data.srs.cards[item.sub] = next;
  logToday('reviews');
  if (!prev) logToday('new');
  const log = data.srs.log[day];
  if (!log.place && currentScene()) log.place = cityOf(currentScene());
  state.graded++;
  if (g === 0) {
    logToday('again');
    state.again++;
    if (prev && prev.reps > 0 && !mistakeAlreadyRecorded) {
      recordMistake({ key: item.card.id, front: germanText(item.card), expected: item.card.back, source: 'karten', note: kindOf(item.sub) === 'en' ? 'Englisch → Deutsch' : 'Deutsch → Englisch' });
    }
    // "Nochmal": the card comes back later in this session.
    const at = Math.min(state.queue.length, state.i + 4);
    state.queue.splice(at, 0, { ...item, st: next, kind: 'review' });
  }
  markDirty();
  state.i++;
  renderCard();
}

function renderDone() {
  const stage = $('#stage');
  const city = cityOf(currentScene());
  const n = state.graded;
  const empty = n === 0;
  stage.innerHTML = `
    <div class="sheet" style="max-width:540px">
      <p class="eyebrow">${empty ? 'Nichts fällig' : 'Sitzung beendet'}</p>
      <h2>${empty ? 'In dieser Auswahl wartet gerade nichts.' : `${numberWord(n, true)} ${n === 1 ? 'Karte' : 'Karten'}${state.again ? `, ${numberWord(state.again)} noch einmal` : ', alles sitzt'}.`}</h2>
      <p class="muted">${empty ? 'Wähle oben einen anderen Filter, oder mach einen kurzen Test.' : `Dein Lernstand wird gespeichert.${city ? ` ${escapeHtml(city)} ist im Reisepass gestempelt.` : ''}`}</p>
      <div class="row mt">
        ${empty ? '' : '<button class="btn" type="button" id="again">Noch eine Runde</button>'}
        <a class="link" href="#test">Jetzt testen</a>
        <a class="link" href="#heute">Fertig</a>
      </div>
    </div>`;
  $('#again')?.addEventListener('click', () => {
    state.queue = makeQueue(state.filter);
    state.i = 0;
    renderCard();
  });
  if (!empty) sync(`${n} Karten, ${state.again} nochmal`);
}
