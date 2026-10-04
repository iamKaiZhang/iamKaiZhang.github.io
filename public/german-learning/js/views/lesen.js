// Lesen: article list, paste-your-own-text, and the annotating reader.
// The annotation model and offset logic are ported from the original reader, so files in
// annotations/<slug>.json keep the same shape: { slug, annotations: [{ id, type, text, note, offset, length }] }.
import { $, $$, escapeHtml, store, toast, today, formatDate, slugify } from '../util.js';
import * as S from '../store.js';
import { data } from '../store.js';
import { parseArticleMd, renderArticle } from '../md.js';

const TYPE_LABEL = { word: 'Wort', hard: 'Schwerer Satz', comment: 'Notiz' };
const CLASS = { word: 'highlight-word', hard: 'highlight-hard', comment: 'highlight-comment' };
const pasted = new Map(); // slug → meta for texts pasted in this visit and not yet saved
// Long texts are split into pages of about this many characters, at paragraph boundaries.
// The whole text stays in the DOM (other pages are only hidden), so annotation offsets never change.
const PAGE_CHARS = 2200;

let A = null;          // current reader state
let cleanup = [];      // listeners to remove on leave

function on(target, ev, fn, opts) { target.addEventListener(ev, fn, opts); cleanup.push(() => target.removeEventListener(ev, fn, opts)); }

const prettySlug = slug => slug.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase());

export default {
  refreshable: () => !A,

  async render(root, args) {
    if (args[0]) return renderReader(root, args[0]);
    return renderList(root);
  },

  async leave() {
    cleanup.forEach(fn => fn());
    cleanup = [];
    $('#toolbar')?.remove();
    $('#popover')?.remove();
    if (A?.dirty) await save(true);
    A = null;
  },

  onHide() { if (A?.dirty) save(true); },
};

// ── list ───────────────────────────────────────────────────────────────────
async function renderList(root) {
  root.innerHTML = `
    <section class="sheet">
      <p class="eyebrow">Lesen</p>
      <h2>Was liest du heute?</h2>
      <div class="tabs" role="tablist">
        <button type="button" role="tab" aria-selected="true" data-tab="list">Deine Artikel</button>
        <button type="button" role="tab" aria-selected="false" data-tab="paste">Text einfügen</button>
      </div>
      <div id="tab-list"><p class="loading">Artikel werden geladen …</p></div>
      <form id="tab-paste" hidden>
        <div class="field"><label for="pTitle">Titel</label><input id="pTitle" autocomplete="off" placeholder="Titel des Artikels"></div>
        <div class="grid2">
          <div class="field"><label for="pLevel">Niveau</label><select id="pLevel">${['A1', 'A2', 'B1', 'B2', 'C1'].map(l => `<option ${l === 'A2' ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="field"><label for="pDate">Datum</label><input id="pDate" type="date" value="${today()}"></div>
        </div>
        <div class="field"><label for="pSource">Quelle (optional)</label><input id="pSource" autocomplete="off" placeholder="https://…"></div>
        <div class="field"><label for="pText">Deutscher Text</label><textarea id="pText" rows="8" placeholder="Text hier einfügen …"></textarea></div>
        <button class="btn" type="submit">Lesen beginnen</button>
      </form>
    </section>`;
  $$('.tabs button', root).forEach(b => b.addEventListener('click', () => {
    $$('.tabs button', root).forEach(x => x.setAttribute('aria-selected', String(x === b)));
    $('#tab-list').hidden = b.dataset.tab !== 'list';
    $('#tab-paste').hidden = b.dataset.tab !== 'paste';
  }));
  $('#tab-paste').addEventListener('submit', e => {
    e.preventDefault();
    const text = $('#pText').value.trim();
    if (!text) { toast('Bitte zuerst einen deutschen Text einfügen.'); return; }
    const title = $('#pTitle').value.trim() || 'Ohne Titel';
    const date = $('#pDate').value || today();
    const slug = `${date}-${slugify(title) || 'text'}`;
    pasted.set(slug, { slug, title, date, difficulty: $('#pLevel').value, source: $('#pSource').value.trim(), text, _pasted: true });
    location.hash = `#lesen/${encodeURIComponent(slug)}`;
  });
  try {
    const articles = await S.listArticles();
    const listEl = $('#tab-list');
    if (!listEl) return;
    listEl.innerHTML = articles.length ? `<div class="article-list">${articles.map(a => `
        <a href="#lesen/${encodeURIComponent(a.slug)}">
          <b>${escapeHtml(a.title || prettySlug(a.slug))}</b>
          <span>${escapeHtml([a.date ? formatDate(a.date, { day: 'numeric', month: 'long', year: 'numeric' }) : '', a.source].filter(Boolean).join(' · '))}</span>
          <span class="lvl">${escapeHtml(a.difficulty || '')}</span>
        </a>`).join('')}</div>`
      : '<p class="empty"><b>Noch keine Artikel.</b>Füge oben einen Text ein, oder lass Claude einen Artikel in articles/ anlegen.</p>';
  } catch (e) {
    const listEl = $('#tab-list');
    if (listEl) listEl.innerHTML = `<p class="banner error">Artikel konnten nicht geladen werden: ${escapeHtml(e.message)}</p>`;
  }
}

// ── reader ─────────────────────────────────────────────────────────────────
async function renderReader(root, slug) {
  root.innerHTML = '<p class="loading">Artikel wird geladen …</p>';
  let meta = pasted.get(slug);
  if (!meta) {
    const articles = await S.listArticles();
    const entry = articles.find(a => a.slug === slug) || { slug, path: `articles/${slug}.md` };
    const raw = await S.getText(entry.path);
    if (raw === null) throw new Error(`Artikel „${slug}“ wurde nicht gefunden.`);
    meta = parseArticleMd(raw, slug);
    meta.title = meta.title !== slug ? meta.title : entry.title || meta.displayTitle || prettySlug(slug);
    meta.date = meta.date || entry.date || '';
    meta.difficulty = meta.difficulty || entry.difficulty || '';
    meta.source = meta.source || entry.source || '';
  }
  A = { meta, annotations: {}, counter: 0, active: null, savedRange: null, dirty: false };
  store.setJson('wr_last_article', { slug, title: meta.title });

  root.innerHTML = `
    <article class="sheet">
      <p class="eyebrow"><a class="link" style="border:0;padding:0" href="#lesen">Lesen</a>${meta.difficulty ? ` · ${escapeHtml(meta.difficulty)}` : ''}${meta.source ? ` · ${escapeHtml(meta.source.replace(/^https?:\/\//, '').slice(0, 40))}` : ''}</p>
      <h2>${escapeHtml(meta.title)}</h2>
      <p class="meta" id="readerMeta"></p>
      <div class="reader-bar">
        <span class="status" id="saveStatus"></span>
        <button class="link" type="button" id="btnSave">Speichern</button>
        <button class="link" type="button" id="btnCopy">Markierungen kopieren</button>
        <a class="link red" href="#test/article/${encodeURIComponent(slug)}">Aus diesem Artikel testen</a>
      </div>
      <div class="legend"><span class="mk-word">Wort</span><span class="mk-hard">Schwerer Satz</span><span class="mk-comment">Notiz</span><span>Text auswählen zum Markieren</span></div>
      <div class="pager" id="pagerTop" role="navigation" aria-label="Seiten" hidden></div>
      <div id="articleBody" lang="de">${renderArticle(meta.text)}</div>
      <div class="pager" id="pagerBottom" role="navigation" aria-label="Seiten" hidden></div>
      <div class="notes" id="notes"></div>
    </article>`;

  document.body.insertAdjacentHTML('beforeend', `
    <div id="toolbar" class="floating" role="toolbar" aria-label="Markieren">
      <button type="button" data-type="word"><i style="background:var(--ochre)"></i>Wort</button>
      <button type="button" data-type="hard"><i style="background:var(--vermilion)"></i>Schwer</button>
      <button type="button" data-type="comment"><i style="background:var(--moss)"></i>Notiz</button>
    </div>
    <div id="popover" class="floating" role="dialog" aria-label="Markierung bearbeiten">
      <div class="ptext" id="pText2"></div>
      <textarea id="pNote" placeholder="Notiz (optional)"></textarea>
      <div class="row"><button class="btn" type="button" id="pSave">Notiz speichern</button><button class="link" type="button" id="pCard">+ Karte</button><button class="link red" type="button" id="pDelete">Löschen</button></div>
    </div>`);

  // Restore saved annotations.
  try {
    const saved = await S.loadAnnotations(slug);
    if (saved?.length) reapplyAnnotations(saved);
  } catch (e) {
    toast(`Markierungen konnten nicht geladen werden: ${e.message}`, 'error');
  }
  paginate();
  showPage(Math.min(Number(store.get(`wr_page:${slug}`, 0)) || 0, A.pages - 1), false);
  updateMeta();
  setStatus();

  const body = $('#articleBody');
  on(root, 'click', e => {
    const b = e.target.closest('.pager button[data-go]');
    if (b && !b.disabled) showPage(A.page + Number(b.dataset.go), b.closest('#pagerBottom') !== null);
  });
  on(document, 'keydown', e => {
    if (!A || A.pages < 2 || e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    if ($('#popover')?.classList.contains('visible')) return;
    if (e.key === 'ArrowRight' && A.page < A.pages - 1) showPage(A.page + 1, true);
    if (e.key === 'ArrowLeft' && A.page > 0) showPage(A.page - 1, true);
  });
  on(document, 'mouseup', onSelectionChange);
  on(document, 'touchend', onSelectionChange);
  on(document, 'selectionchange', onSelectionChange);
  on($('#toolbar'), 'mousedown', e => e.preventDefault()); // keep the selection while clicking
  on($('#toolbar'), 'click', e => { const b = e.target.closest('button'); if (b) annotate(b.dataset.type); });
  on(body, 'click', e => {
    const mark = e.target.closest('mark[data-annotation-id]');
    if (!mark) { hidePopover(); return; }
    showPopover(mark.dataset.annotationId, e.clientX, e.clientY);
  });
  on(document, 'click', e => {
    const pop = $('#popover');
    if (pop?.classList.contains('visible') && !pop.contains(e.target) && !e.target.closest('mark[data-annotation-id]') && !e.target.closest('.n')) hidePopover();
  });
  on(window, 'beforeunload', e => { if (A?.dirty && !S.isDemo()) { e.preventDefault(); e.returnValue = ''; } });
  $('#pSave').addEventListener('click', () => {
    if (!A.active) return;
    A.annotations[A.active].note = $('#pNote').value.trim();
    changed();
    hidePopover();
  });
  $('#pDelete').addEventListener('click', () => A.active && deleteAnnotation(A.active));
  $('#pCard').addEventListener('click', () => A.active && sendToInbox(A.active));
  $('#btnSave').addEventListener('click', () => save(false));
  $('#btnCopy').addEventListener('click', copyAnnotations);
}

function bodyEl() { return $('#articleBody'); }

// Assign each top-level block (paragraph, heading, list) to a page.
function paginate() {
  let page = 0, acc = 0;
  for (const block of bodyEl().children) {
    const len = block.textContent.length;
    if (acc > 0 && acc + len > PAGE_CHARS) { page++; acc = 0; }
    block.dataset.page = String(page);
    acc += len;
  }
  A.pages = page + 1;
}

const pageOfMark = id => Number($(`mark[data-annotation-id="${id}"]`)?.closest('#articleBody > *')?.dataset.page ?? -1);

function showPage(n, scroll) {
  A.page = Math.max(0, Math.min(n, A.pages - 1));
  for (const block of bodyEl().children) block.hidden = Number(block.dataset.page) !== A.page;
  store.set(`wr_page:${A.meta.slug}`, String(A.page));
  window.getSelection()?.removeAllRanges();
  $('#toolbar')?.classList.remove('visible');
  hidePopover();
  for (const id of ['pagerTop', 'pagerBottom']) {
    const el = $(`#${id}`);
    el.hidden = A.pages < 2;
    if (A.pages < 2) continue;
    el.innerHTML = `
      <button type="button" class="link" data-go="-1" ${A.page === 0 ? 'disabled' : ''}>← Zurück</button>
      <span class="pager-pos">Seite ${A.page + 1} von ${A.pages}</span>
      <button type="button" class="link" data-go="1" ${A.page === A.pages - 1 ? 'disabled' : ''}>Weiter →</button>
      <span class="pager-bar" aria-hidden="true"><i style="width:${((A.page + 1) / A.pages) * 100}%"></i></span>`;
  }
  renderNotes();
  if (scroll) $('#pagerTop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getRangeAtTextOffset(body, offset, length) {
  let charCount = 0;
  let startNode = null, startOff = 0, endNode = null, endOff = 0;
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const len = node.textContent.length;
    if (!startNode && charCount + len > offset) { startNode = node; startOff = offset - charCount; }
    if (startNode && charCount + len >= offset + length) { endNode = node; endOff = offset + length - charCount; break; }
    charCount += len;
  }
  if (!startNode || !endNode) return null;
  const range = document.createRange();
  range.setStart(startNode, startOff);
  range.setEnd(endNode, endOff);
  return range;
}

function wrap(range, type, id) {
  const mark = document.createElement('mark');
  mark.className = CLASS[type] || CLASS.comment;
  mark.dataset.annotationId = id;
  try { range.surroundContents(mark); } catch {
    const frag = range.extractContents();
    mark.appendChild(frag);
    range.insertNode(mark);
  }
}

function reapplyAnnotations(arr) {
  const body = bodyEl();
  const text = body.textContent;
  const resolved = [];
  for (const ann of arr) {
    let { offset, length } = ann;
    if (offset == null || length == null) {
      const idx = text.indexOf(ann.text);
      if (idx === -1) continue;
      offset = idx; length = ann.text.length;
    }
    resolved.push({ ann, offset, length });
  }
  resolved.sort((a, b) => b.offset - a.offset);
  for (const { ann, offset, length } of resolved) {
    const range = getRangeAtTextOffset(body, offset, length);
    if (!range) continue;
    wrap(range, ann.type, ann.id);
    A.annotations[ann.id] = { id: ann.id, type: ann.type, text: ann.text, note: ann.note || '', offset, length };
    const num = parseInt(String(ann.id).replace('ann-', ''), 10);
    if (!isNaN(num) && num > A.counter) A.counter = num;
  }
}

let selTimer;
function onSelectionChange() {
  clearTimeout(selTimer);
  selTimer = setTimeout(() => {
    const tb = $('#toolbar');
    if (!tb || !A) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) { tb.classList.remove('visible'); A.savedRange = null; return; }
    const range = sel.getRangeAt(0);
    if (!bodyEl().contains(range.commonAncestorContainer)) { tb.classList.remove('visible'); return; }
    const rect = range.getBoundingClientRect();
    const w = 270, h = 46, gap = 10;
    let top = rect.top - h - gap;
    if (top < 8) top = rect.bottom + gap;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - w / 2, window.innerWidth - w - 8));
    tb.style.top = `${top}px`;
    tb.style.left = `${left}px`;
    tb.classList.add('visible');
    A.savedRange = range.cloneRange();
  }, 120);
}

function selectionOffset(range) {
  const pre = document.createRange();
  pre.selectNodeContents(bodyEl());
  pre.setEnd(range.startContainer, range.startOffset);
  return pre.toString().length;
}

function annotate(type) {
  const range = A.savedRange;
  if (!range || range.collapsed) return;
  // Trim surrounding whitespace so the stored offset matches the stored text.
  const raw = range.toString();
  const lead = raw.length - raw.trimStart().length;
  const text = raw.trim();
  if (!text) return;
  const offset = selectionOffset(range) + lead;
  const id = `ann-${++A.counter}`;
  const exact = getRangeAtTextOffset(bodyEl(), offset, text.length) || range;
  wrap(exact, type, id);
  A.annotations[id] = { id, type, text, note: '', offset, length: text.length };
  window.getSelection()?.removeAllRanges();
  $('#toolbar').classList.remove('visible');
  A.savedRange = null;
  changed();
  if (type !== 'word') {
    const m = $(`mark[data-annotation-id="${id}"]`);
    const r = m?.getBoundingClientRect();
    if (r) showPopover(id, r.left + r.width / 2, r.bottom);
  }
}

function showPopover(id, x, y) {
  const ann = A.annotations[id];
  if (!ann) return;
  A.active = id;
  $$('#articleBody mark').forEach(m => m.classList.toggle('sel', m.dataset.annotationId === id));
  $('#pText2').textContent = ann.text;
  $('#pNote').value = ann.note || '';
  const card = $('#pCard');
  const st = wordStatus(ann);
  card.hidden = ann.type !== 'word' || !!st;
  const pop = $('#popover');
  const w = 280, h = 220;
  pop.style.left = `${Math.max(8, Math.min(x - w / 2, window.innerWidth - w - 8))}px`;
  pop.style.top = `${Math.max(8, Math.min(y + 12, window.innerHeight - h - 8))}px`;
  pop.classList.add('visible');
}

function hidePopover() {
  $('#popover')?.classList.remove('visible');
  $$('#articleBody mark.sel').forEach(m => m.classList.remove('sel'));
  if (A) A.active = null;
}

function deleteAnnotation(id) {
  $$(`mark[data-annotation-id="${id}"]`).forEach(mark => {
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });
  delete A.annotations[id];
  hidePopover();
  changed();
}

function changed() {
  A.dirty = true;
  setStatus();
  updateMeta();
  renderNotes();
}

function setStatus(text) {
  const el = $('#saveStatus');
  if (!el) return;
  if (text) { el.textContent = text; el.className = 'status'; return; }
  el.textContent = A.dirty ? 'Ungespeichert' : S.isDemo() ? 'Beispiel · nur in diesem Browser' : 'Gespeichert';
  el.className = 'status' + (A.dirty ? ' dirty' : '');
}

function updateMeta() {
  const n = Object.keys(A.annotations).length;
  const m = A.meta;
  $('#readerMeta').textContent = [m.date ? formatDate(m.date, { day: 'numeric', month: 'long', year: 'numeric' }) : '', `${n} ${n === 1 ? 'Markierung' : 'Markierungen'}`].filter(Boolean).join(' · ');
}

const norm = s => s.toLowerCase().replace(/^(der|die|das|ein|eine|einen|dem|den)\s+/, '').replace(/[.,!?;:„“"»«]/g, '').trim();
function wordStatus(ann) {
  if (ann.type !== 'word') return null;
  const t = norm(ann.text);
  if (data.cards.some(c => norm(c.front) === t || (c.plural && norm(c.plural) === t))) return 'card';
  if ((data.inbox.items || []).some(i => norm(i.text) === t)) return 'inbox';
  return null;
}

function sentenceAround(offset) {
  const text = bodyEl().textContent;
  let s = offset, e = offset;
  while (s > 0 && !/[.!?»]/.test(text[s - 1])) s--;
  while (e < text.length && !/[.!?]/.test(text[e])) e++;
  return text.slice(s, Math.min(text.length, e + 1)).trim().slice(0, 300);
}

async function sendToInbox(id) {
  const ann = A.annotations[id];
  hidePopover();
  try {
    await S.addToInbox({ text: ann.text, note: ann.note || '', context: sentenceAround(ann.offset), article: A.meta.slug });
    toast(`„${ann.text}“ liegt im Eingang. Claude macht daraus eine Karte.`);
  } catch (e) {
    toast(`Nicht gespeichert: ${e.message}`, 'error');
  }
  renderNotes();
}

function renderNotes() {
  const el = $('#notes');
  if (!el) return;
  const all = Object.values(A.annotations).sort((a, b) => a.offset - b.offset);
  const items = A.pages > 1 ? all.filter(a => pageOfMark(a.id) === A.page) : all;
  if (!items.length) { el.innerHTML = ''; return; }
  const heading = A.pages > 1 ? `Markierungen auf dieser Seite · ${items.length} von ${all.length}` : 'Markierungen';
  // Long lists start folded so the page stays short; the reader can still tap marks in the text.
  const open = items.length <= 6 || store.get('wr_notes_open') === '1';
  el.innerHTML = `<details id="notesBox" ${open ? 'open' : ''}><summary class="eyebrow">${heading}</summary>` + items.map(a => {
    let act = '';
    if (a.type === 'word') {
      const st = wordStatus(a);
      act = st === 'card' ? '<span class="act done">Karte vorhanden</span>' : st === 'inbox' ? '<span class="act done">Im Eingang</span>' : '<button type="button" class="act" data-card>+ Karte</button>';
    } else if (a.type === 'hard') {
      act = `<a class="act" href="#test/article/${encodeURIComponent(A.meta.slug)}">Als Übung</a>`;
    }
    return `<div class="n" data-id="${a.id}"><b>${escapeHtml(a.text)}</b><span class="t">${TYPE_LABEL[a.type] || 'Notiz'}</span>${a.note ? `<span class="q">${escapeHtml(a.note)}</span>` : ''}${act}</div>`;
  }).join('') + '</details>';
  $('#notesBox').addEventListener('toggle', e => { if (items.length > 6) store.set('wr_notes_open', e.target.open ? '1' : '0'); });
  $$('.n', el).forEach(n => n.addEventListener('click', e => {
    const id = n.dataset.id;
    if (e.target.closest('[data-card]')) { sendToInbox(id); return; }
    if (e.target.closest('a')) return;
    const mark = $(`mark[data-annotation-id="${id}"]`);
    if (!mark) return;
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { const r = mark.getBoundingClientRect(); showPopover(id, r.left + r.width / 2, r.bottom); }, 380);
  }));
}

async function save(quiet) {
  if (!A) return;
  const state = A;
  setStatus('Speichert …');
  try {
    if (state.meta._pasted) {
      await S.saveArticle(state.meta);
      state.meta._pasted = false;
      pasted.delete(state.meta.slug);
    }
    await S.saveAnnotations(state.meta.slug, Object.values(state.annotations));
    state.dirty = false;
    if (A === state) setStatus();
    if (!quiet) toast('Markierungen gespeichert.');
  } catch (e) {
    if (A === state) setStatus();
    toast(`Speichern fehlgeschlagen: ${e.message}`, 'error');
  }
}

function copyAnnotations() {
  const all = Object.values(A.annotations).sort((a, b) => a.offset - b.offset);
  const group = (type, label) => {
    const items = all.filter(a => a.type === type);
    if (!items.length) return '';
    return `${label} (${items.length})\n` + items.map(a => `- ${a.text}${a.note ? ` → ${a.note}` : ''}`).join('\n') + '\n\n';
  };
  const text = `Artikel: ${A.meta.title}\nDatum: ${A.meta.date || ''}\n\n` +
    (group('word', 'WÖRTER') + group('hard', 'SCHWERE SÄTZE') + group('comment', 'NOTIZEN') || '(keine Markierungen)');
  navigator.clipboard.writeText(text).then(() => toast('Markierungen kopiert.')).catch(() => toast('Kopieren hat nicht geklappt.', 'error'));
}
