// Test: auto-built from the card collection, Claude-written banks (tests/bank), or an article's annotations.
import { $, $$, escapeHtml, today, shuffle, normalizeAnswer, speak, toast, store, scoreText, withStop } from '../util.js';
import * as S from '../store.js';
import { data } from '../store.js';
import { buildQueue } from '../srs.js';
import { germanText } from '../cardtext.js';
import { parseArticleMd, renderArticle } from '../md.js';
import { sync } from '../sync.js';
import * as icons from '../icons.js';

const LABEL = { mc: 'Multiple Choice', cloze: 'Lückentext', gender: 'Genus', order: 'Satzbau', translate: 'Übersetzung', listen: 'Diktat', speak: 'Sprechen' };
let T = null; // running test

const md = s => escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').replace(/_{3,}/g, '<span class="blank">＿＿＿</span>');
const plain = s => String(s || '').replace(/\*/g, '');

export default {
  refreshable: () => !T,

  async render(root, args) {
    T = null;
    root.innerHTML = '<section class="sheet" id="testSheet"><p class="loading">Wird vorbereitet …</p></section>';
    if (args[0] === 'article' && args[1]) return start(await articleSource(args[1]));
    if (args[0] === 'bank' && args[1]) return start(await bankSource(args[1]));
    if (args[0] === 'grammar' && args[1]) return start(await grammarSource(args[1]));
    return renderSetup();
  },

  async leave() {
    const unsaved = T && T.answers.length && !T.saved;
    T = null;
    if (unsaved) await sync('Test abgebrochen');
  },
};

// ── setup ───────────────────────────────────────────────────────────────────
async function renderSetup() {
  const sheet = $('#testSheet');
  let banks = [];
  try { banks = await S.listBanks(); } catch { /* banks are optional */ }
  const last = store.json('wr_last_article');
  const sources = [
    { id: 'auto', title: 'Aus deinen Karten', sub: 'Multiple Choice, Lückentext und Genus, automatisch aus fälligen und schwachen Wörtern gebaut.', disabled: !data.cards.length },
    ...banks.slice().reverse().map(b => ({ id: `bank:${b.id}`, title: `Von Claude: ${b.title || b.id}`, sub: [b.count ? `${b.count} Fragen` : '', b.date].filter(Boolean).join(' · ') })),
    ...(last?.slug ? [{ id: `article:${last.slug}`, title: 'Aus einem Artikel', sub: `Deine Markierungen in „${last.title}“ als Lückentext und Satzbau.` }] : []),
  ];
  const firstOk = sources.find(s => !s.disabled);
  sheet.innerHTML = `
    <p class="eyebrow">Test</p>
    <h2>Woraus soll der Test bestehen?</h2>
    <div class="choice-list" id="src">
      ${sources.map(s => `<button type="button" data-id="${escapeHtml(s.id)}" aria-pressed="${s === firstOk}" ${s.disabled ? 'disabled' : ''}><b>${escapeHtml(s.title)}</b><span>${escapeHtml(s.sub)}</span></button>`).join('')}
    </div>
    <div class="deckline" id="lenRow"><span>Umfang</span><div class="chips" style="width:auto">${[5, 10, 20].map(n => `<button type="button" data-n="${n}" aria-pressed="${n === 10}">${n} Fragen</button>`).join('')}</div></div>
    <div class="row"><button class="btn" type="button" id="go" ${firstOk ? '' : 'disabled'}>Test starten</button><span class="muted small">Falsche Antworten landen im Fehlerheft.</span></div>`;
  let chosen = firstOk?.id;
  let n = 10;
  const syncLen = () => { $('#lenRow').hidden = !(chosen === 'auto'); };
  syncLen();
  $('#src').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    chosen = b.dataset.id;
    $$('#src button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    syncLen();
  });
  $('#lenRow').addEventListener('click', e => {
    const b = e.target.closest('button[data-n]');
    if (!b) return;
    n = Number(b.dataset.n);
    $$('#lenRow button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  });
  $('#go').addEventListener('click', async () => {
    if (!chosen) return;
    $('#go').disabled = true;
    try {
      if (chosen === 'auto') start(autoSource(n));
      else if (chosen.startsWith('bank:')) start(await bankSource(chosen.slice(5)));
      else start(await articleSource(chosen.slice(8)));
    } catch (e) {
      toast(e.message, 'error');
      $('#go').disabled = false;
    }
  });
}

// ── sources ─────────────────────────────────────────────────────────────────
function autoSource(n) {
  const day = today();
  const due = buildQueue({ cards: data.cards, srs: data.srs, day, settings: data.srs.settings }).map(q => q.card);
  const weak = data.cards.filter(c => data.mistakes.items?.[c.id]);
  const pool = [...new Map([...shuffle(weak), ...shuffle(due), ...shuffle(data.cards)].map(c => [c.id, c])).values()];
  const items = [];
  for (const card of pool) {
    if (items.length >= n) break;
    const options = ['mc', 'mc-rev'];
    if (card.pos === 'noun' && card.gender) options.push('gender');
    const word = card.front.split(' ').length === 1 ? card.front : null;
    if (word && card.example?.de && new RegExp(`\\b${escapeRe(word)}\\b`, 'i').test(card.example.de)) options.push('cloze', 'cloze');
    const type = options[Math.floor(Math.random() * options.length)];
    const item = makeItem(card, type);
    if (item) items.push(item);
  }
  return { id: 'auto', title: 'Aus deinen Karten', items };
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function distractors(card, field, k = 3) {
  const same = data.cards.filter(c => c.id !== card.id && c.pos === card.pos);
  const pool = same.length >= k ? same : data.cards.filter(c => c.id !== card.id);
  return shuffle(pool).slice(0, k).map(c => (field === 'back' ? c.back : germanText(c)));
}

function makeItem(card, type) {
  if (type === 'gender') return { type: 'gender', card: card.id, prompt: card.front, answer: card.gender, why: `${card.gender} ${card.front}${card.plural ? `, Plural: die ${card.plural}` : ''}` };
  if (type === 'cloze') {
    const re = new RegExp(`\\b${escapeRe(card.front)}\\b`, 'i');
    const m = card.example.de.match(re);
    return { type: 'cloze', card: card.id, prompt: card.example.de.replace(re, '___'), hint: card.back, answer: [m[0]], why: card.example.en || '' };
  }
  if (type === 'mc-rev') {
    const choices = shuffle([germanText(card), ...distractors(card, 'front')]);
    return { type: 'mc', card: card.id, prompt: `Wie sagt man „${card.back}“ auf Deutsch?`, choices, answer: choices.indexOf(germanText(card)), why: card.example?.de || '' };
  }
  const choices = shuffle([card.back, ...distractors(card, 'back')]);
  return { type: 'mc', card: card.id, prompt: `Was bedeutet *${germanText(card)}*?`, choices, answer: choices.indexOf(card.back), why: card.example?.de || '' };
}

async function bankSource(id) {
  const banks = await S.listBanks();
  const b = banks.find(x => x.id === id) || { id, path: `tests/bank/${id}.json` };
  const bank = await S.getJson(b.path, null);
  if (!bank) throw new Error(`Test „${id}“ wurde nicht gefunden.`);
  return { id: bank.id || id, title: bank.title || id, items: bank.items || [] };
}

async function grammarSource(slug) {
  const banks = await S.listBanks();
  const items = [];
  for (const b of banks) {
    const bank = await S.getJson(b.path, null);
    if (!bank) continue;
    for (const it of bank.items || []) if (it.grammar === slug) items.push(it);
  }
  if (!items.length) throw new Error('Zu diesem Thema gibt es noch keine Fragen. Claude kann welche anlegen.');
  return { id: `grammar:${slug}`, title: `Grammatik: ${slug}`, items: shuffle(items) };
}

async function articleSource(slug) {
  const articles = await S.listArticles();
  const entry = articles.find(a => a.slug === slug) || { path: `articles/${slug}.md` };
  const raw = await S.getText(entry.path);
  if (raw === null) throw new Error('Artikel nicht gefunden.');
  const meta = parseArticleMd(raw, slug);
  const anns = (await S.loadAnnotations(slug)) || [];
  // Same text the reader shows, so annotation offsets line up.
  const div = document.createElement('div');
  div.innerHTML = renderArticle(meta.text);
  const text = div.textContent;
  const sentenceAt = (offset, len) => {
    let s = offset, e = offset + len;
    while (s > 0 && !/[.!?»]/.test(text[s - 1])) s--;
    while (e < text.length && !/[.!?]/.test(text[e])) e++;
    return text.slice(s, Math.min(text.length, e + 1)).trim();
  };
  const items = [];
  for (const a of anns) {
    if (a.type === 'hard') {
      const tokens = a.text.trim().split(/\s+/);
      if (tokens.length >= 3 && tokens.length <= 16) items.push({ type: 'order', tokens, answer: tokens.join(' '), why: a.note ? `Deine Notiz: ${a.note}` : '' });
    } else if (a.type === 'word' && a.offset != null) {
      const sentence = sentenceAt(a.offset, a.length);
      const local = a.offset - text.indexOf(sentence, Math.max(0, a.offset - sentence.length));
      if (sentence && local >= 0 && sentence.slice(local, local + a.length) === a.text) {
        items.push({ type: 'cloze', prompt: sentence.slice(0, local) + '___' + sentence.slice(local + a.length), hint: a.note || '', answer: [a.text], why: '' });
      }
    }
  }
  if (!items.length) throw new Error('In diesem Artikel gibt es noch keine Markierungen für einen Test. Markiere beim Lesen Wörter oder schwere Sätze.');
  return { id: `article:${slug}`, title: meta.title !== slug ? meta.title : slug, items: shuffle(items) };
}

// ── running ─────────────────────────────────────────────────────────────────
function start(source) {
  if (!source.items.length) { toast('Für diesen Test gibt es keine Fragen.', 'error'); return renderSetup(); }
  T = { source, i: 0, answers: [], started: Date.now(), saved: false };
  renderQ();
}

function renderQ() {
  const sheet = $('#testSheet');
  if (!sheet || !T) return;
  const { items } = T.source;
  if (T.i >= items.length) return finish();
  const q = items[T.i];
  let body = '';
  if (q.type === 'mc') body = `<div class="opts" id="o">${q.choices.map((c, i) => `<button type="button" data-i="${i}">${md(c)}</button>`).join('')}</div>`;
  if (q.type === 'gender') body = `<div class="genus" id="o" style="justify-content:flex-start;margin-top:0">${['der', 'die', 'das'].map(g => `<button type="button" data-g="${g}">${g}</button>`).join('')}</div>`;
  if (q.type === 'cloze') body = `${q.hint ? `<p class="muted small">Hinweis: ${escapeHtml(q.hint)}</p>` : ''}<input class="line" id="f" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Antwort" placeholder="Fehlendes Wort"><div class="row mt"><button class="btn" type="button" id="chk">Prüfen</button></div>`;
  if (q.type === 'order') body = `<div class="tray" id="tray" aria-label="Dein Satz"></div><div class="pool" id="pool">${shuffle(q.tokens.map((t, i) => ({ t, i }))).map(x => `<button type="button" data-i="${x.i}">${escapeHtml(x.t)}</button>`).join('')}</div><div class="row mt"><button class="btn" type="button" id="chk">Prüfen</button></div>`;
  if (q.type === 'translate') body = `<input class="line" id="f" autocomplete="off" aria-label="Übersetzung" placeholder="${q.dir === 'de-en' ? 'In English …' : 'Auf Deutsch …'}"><div class="row mt"><button class="btn" type="button" id="chk">Lösung zeigen</button></div>`;
  if (q.type === 'listen') body = `<div class="row" style="margin-bottom:16px"><button class="btn ghost" type="button" id="play">${icons.speaker} Anhören</button><button class="link" type="button" id="slow">langsam</button></div><input class="line" id="f" autocomplete="off" spellcheck="false" aria-label="Was hörst du?" placeholder="Schreib, was du hörst"><div class="row mt"><button class="btn" type="button" id="chk">Prüfen</button></div>`;
  if (q.type === 'speak') body = `${q.useful?.length ? `<p class="eyebrow" style="margin:0">Nützlich</p><div class="useful">${q.useful.map(u => `<span>${escapeHtml(u)}</span>`).join('')}</div>` : ''}<div class="row"><span class="timer" id="timer">1:00</span><button class="btn" type="button" id="tgo">Start</button><button class="link" type="button" id="tdone">Fertig</button></div>`;

  const promptHtml = q.type === 'gender' ? `… ${escapeHtml(q.prompt)}` : q.type === 'order' ? 'Bring die Wörter in die richtige Reihenfolge.'
    : q.type === 'listen' ? 'Hör zu und schreib den Satz auf.' : md(q.prompt);
  const dirLabel = q.type === 'translate' ? (q.dir === 'de-en' ? ' Deutsch → Englisch' : ' Englisch → Deutsch') : '';
  sheet.innerHTML = `
    <div class="qnum">Frage ${T.i + 1} von ${items.length} · ${LABEL[q.type] || q.type}${dirLabel} · ${escapeHtml(T.source.title)}</div>
    <div class="bar"><i style="width:${(T.i / items.length) * 100}%"></i></div>
    <p class="prompt">${promptHtml}</p>${body}<div id="fb"></div>`;

  const done = (score, given, extra = '') => {
    T.answers.push({ q, score, given });
    const cls = score === 1 ? 'ok' : score === null ? '' : 'no';
    const head = score === 1 ? 'Richtig.' : score === 0.5 ? 'Halb richtig.' : score === null ? 'Gut gemacht.' : 'Nicht ganz.';
    $('#fb').innerHTML = `<div class="fb ${cls}"><b>${head}</b> ${extra} ${q.why ? md(q.why) : ''}<div class="row mt"><button class="btn" type="button" id="nx">${T.i + 1 < items.length ? 'Weiter →' : 'Ergebnis'}</button></div></div>`;
    $$('#o button, #pool button, #tray button, #chk, #f, #play, #slow, #tgo, #tdone').forEach(x => { x.disabled = true; });
    $('#nx').focus();
    $('#nx').addEventListener('click', () => { T.i++; renderQ(); });
  };
  const enter = fn => $('#f')?.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });

  if (q.type === 'mc') $('#o').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const ok = Number(b.dataset.i) === q.answer;
    if (!ok) b.classList.add('wrong');
    $(`#o [data-i="${q.answer}"]`).classList.add('right');
    done(ok ? 1 : 0, plain(q.choices[Number(b.dataset.i)]));
  });
  if (q.type === 'gender') $('#o').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    const ok = b.dataset.g === q.answer;
    b.classList.add(ok ? 'right' : 'wrong');
    if (!ok) $(`#o [data-g="${q.answer}"]`).classList.add('right');
    done(ok ? 1 : 0, b.dataset.g, ok ? '' : `Richtig ist <i>${escapeHtml(q.answer)} ${escapeHtml(q.prompt)}</i>.`);
  });
  if (q.type === 'cloze') {
    const check = () => {
      const v = $('#f').value;
      if (!v.trim()) return;
      const ok = (q.answer || []).some(a => normalizeAnswer(a) === normalizeAnswer(v));
      done(ok ? 1 : 0, v.trim(), ok ? '' : `Lösung: <i>${escapeHtml(withStop(q.answer[0]))}</i>`);
    };
    $('#chk').addEventListener('click', check); enter(check); $('#f').focus();
  }
  if (q.type === 'order') {
    $('#pool').addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.disabled) $('#tray').appendChild(b); });
    $('#tray').addEventListener('click', e => { const b = e.target.closest('button'); if (b && !b.disabled) $('#pool').appendChild(b); });
    $('#chk').addEventListener('click', () => {
      const s = $$('#tray button').map(b => b.textContent).join(' ');
      if (!s) return;
      const ok = normalizeAnswer(s) === normalizeAnswer(q.answer);
      done(ok ? 1 : 0, s, ok ? '' : `Lösung: <i>${escapeHtml(withStop(q.answer))}</i>`);
    });
  }
  if (q.type === 'translate') {
    const show = () => {
      const v = $('#f').value.trim();
      const hits = (q.rubric || []).filter(r => v.toLowerCase().includes(r.toLowerCase()));
      $('#f').disabled = true; $('#chk').disabled = true;
      $('#fb').innerHTML = `<div class="fb"><p style="margin:0 0 6px">Referenz: <b>${escapeHtml(q.reference)}</b></p>
        ${q.rubric?.length ? `<p class="muted small" style="margin:0 0 6px">Schlüsselteile getroffen: ${hits.length} von ${q.rubric.length} (${q.rubric.map(escapeHtml).join(', ')}).</p>` : ''}
        <p class="muted small" style="margin:0 0 14px">Bewerte dich selbst. Claude schaut sich deine Übersetzung in der nächsten Sitzung an.</p>
        <div class="row" id="sg"><button class="link" type="button" data-s="0">Falsch</button><button class="link" type="button" data-s="0.5">Halb richtig</button><button class="btn" type="button" data-s="1">Richtig</button></div></div>`;
      $('#sg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) done(Number(b.dataset.s), v, 'Selbst bewertet.'); }, { once: true });
    };
    $('#chk').addEventListener('click', show); enter(show); $('#f').focus();
  }
  if (q.type === 'listen') {
    const play = slow => {
      if (!speak(q.text)) toast('Dein Browser hat keine deutsche Stimme.', 'error');
      if (slow && 'speechSynthesis' in window) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(q.text); u.lang = 'de-DE'; u.rate = 0.65; speechSynthesis.speak(u); }
    };
    $('#play').addEventListener('click', () => play(false));
    $('#slow').addEventListener('click', () => play(true));
    const check = () => {
      const v = $('#f').value;
      if (!v.trim()) return;
      const ok = normalizeAnswer(v) === normalizeAnswer(q.text);
      done(ok ? 1 : 0, v.trim(), `Der Satz: <i>${escapeHtml(withStop(q.text))}</i>`);
    };
    $('#chk').addEventListener('click', check); enter(check);
  }
  if (q.type === 'speak') {
    let left = 60, timer = null;
    const tick = () => { left--; $('#timer').textContent = `0:${String(Math.max(0, left)).padStart(2, '0')}`; if (left <= 0) { clearInterval(timer); } };
    $('#tgo').addEventListener('click', () => { if (!timer) timer = setInterval(tick, 1000); });
    $('#tdone').addEventListener('click', () => { clearInterval(timer); done(null, '', 'Sprechübungen werden nicht bewertet.'); });
  }
}

async function finish() {
  const sheet = $('#testSheet');
  const scored = T.answers.filter(a => a.score !== null);
  const score = scored.reduce((s, a) => s + a.score, 0);
  const of = scored.length;
  const day = today();
  const wrong = scored.filter(a => a.score < 1);
  for (const a of wrong) {
    const q = a.q;
    const key = q.card || q.grammar || null;
    if (!key) continue;
    const card = data.cards.find(c => c.id === q.card);
    S.recordMistake({
      key, front: card ? germanText(card) : q.card || `Grammatik: ${q.grammar.replace(/-/g, ' ')}`, given: a.given || '', source: 'test', note: LABEL[q.type],
      expected: plain(q.type === 'mc' ? q.choices[q.answer] : q.type === 'translate' ? q.reference : q.type === 'order' ? q.answer : q.type === 'gender' ? `${q.answer} ${q.prompt}` : (q.answer || [])[0] || q.text),
    });
    // Wrong answers bring the word back into today's cards.
    const st = data.srs.cards[`${q.card}#de`];
    if (st) st.due = day;
  }
  const result = {
    bank: T.source.id, title: T.source.title, started: new Date(T.started).toISOString(), seconds: Math.round((Date.now() - T.started) / 1000), score, of,
    items: T.answers.map(a => ({ ref: a.q.card || null, type: a.q.type, prompt: plain(a.q.prompt || a.q.text || a.q.answer), given: a.given, expected: plain(a.q.type === 'mc' ? a.q.choices[a.q.answer] : a.q.reference || (Array.isArray(a.q.answer) ? a.q.answer[0] : a.q.answer) || a.q.text || ''), score: a.score, ...(a.q.type === 'translate' ? { self: true } : {}) })),
  };
  data.srs.tests = [...(data.srs.tests || []), { at: result.started, bank: result.bank, title: result.title, score, of }];
  S.logToday('tests');
  S.markDirty();
  T.saved = true;
  sheet.innerHTML = `
    <p class="eyebrow">Ergebnis · ${escapeHtml(T.source.title)}</p>
    <h2>${scoreText(score, of, true)} richtig.</h2>
    <p class="muted">${wrong.length ? 'Die falschen Antworten stehen jetzt im Fehlerheft, die Wörter dazu sind heute wieder fällig.' : 'Keine Fehler. Sehr gut.'}</p>
    ${wrong.length ? `<div class="list">${wrong.map(a => `<div class="li"><b>${md(a.q.type === 'gender' ? `… ${a.q.prompt}` : a.q.prompt || a.q.text || a.q.answer)}</b><span class="sub">${a.given ? `Deine Antwort: ${escapeHtml(a.given)} · ` : ''}Richtig: ${escapeHtml(result.items[T.answers.indexOf(a)].expected)}</span></div>`).join('')}</div>` : ''}
    <div class="row mt"><a class="btn" href="#test" id="again">Neuer Test</a><a class="link" href="#wiederholen">Zum Fehlerheft</a><a class="link" href="#karten">Karten lernen</a></div>`;
  $('#again').addEventListener('click', e => { e.preventDefault(); T = null; renderSetup(); });
  try {
    await S.saveResult(result);
  } catch (e) {
    toast(`Ergebnis nicht gespeichert: ${e.message}`, 'error');
  }
  await sync(`Test ${score}/${of}`);
  T = null;
}
