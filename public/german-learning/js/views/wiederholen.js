// Wiederholen: the Fehlerheft, the inbox waiting for Claude, grammar to revisit, and the daily journal.
import { $, escapeHtml, today, formatDate, toast } from '../util.js';
import * as S from '../store.js';
import { data } from '../store.js';
import { renderMarkdown } from '../md.js';

export default {
  async render(root) {
    const items = Object.entries(data.mistakes.items || {})
      .sort((a, b) => (b[1].leech - a[1].leech) || (b[1].count - a[1].count) || String(b[1].last).localeCompare(String(a[1].last)));
    const cardIds = new Set(data.cards.map(c => c.id));
    const inbox = data.inbox.items || [];
    const d = today();
    root.innerHTML = `
      <section class="sheet">
        <p class="eyebrow">Fehlerheft</p>
        <h2>${items.length ? 'Was dir noch schwerfällt' : 'Das Fehlerheft ist leer.'}</h2>
        <p class="muted">Jede falsche Antwort landet hier. Claude liest diese Liste zu Beginn jeder Sitzung.</p>
        ${items.length ? `<div class="list">${items.slice(0, 40).map(([key, it]) => {
          const e = (it.errors || []).at(-1) || {};
          const detail = [e.given ? `„${e.given}“` : '', e.expected ? `richtig: ${e.expected}` : '', e.note || ''].filter(Boolean).join(' · ');
          return `<${cardIds.has(key) ? 'a href="#karten/fehler"' : 'div'} class="li"><b>${escapeHtml(it.front || key)}${it.leech ? '<span class="tag">Blutegel</span>' : ''}</b>
            <span class="sub">${escapeHtml(detail)}${it.last ? ` · zuletzt ${escapeHtml(formatDate(it.last))}` : ''}</span>
            <span class="count">${it.count}<small>falsch</small></span></${cardIds.has(key) ? 'a' : 'div'}>`;
        }).join('')}</div>
        <div class="row mt"><a class="btn" href="#karten/fehler">Diese Wörter üben</a><a class="link" href="#test">Test aus schwachen Wörtern</a></div>` : ''}
      </section>

      ${inbox.length ? `
      <section class="sheet">
        <p class="eyebrow">Eingang · wartet auf Claude</p>
        <h3>${inbox.length} ${inbox.length === 1 ? 'markiertes Wort' : 'markierte Wörter'}</h3>
        <p class="muted small">Claude macht daraus in der nächsten Sitzung richtige Karten mit Genus, Plural und Beispiel.</p>
        <div class="list">${inbox.map(i => `<div class="li"><b>${escapeHtml(i.text)}</b><span class="sub">${escapeHtml([i.note, i.context].filter(Boolean).join(' · ').slice(0, 160))}</span></div>`).join('')}</div>
      </section>` : ''}

      <section class="sheet" id="gramSheet">
        <p class="eyebrow">Grammatik wieder ansehen</p>
        <div id="gramList"><p class="loading">Wird geladen …</p></div>
      </section>

      <section class="sheet">
        <p class="eyebrow">Tagebuch · zwei Sätze auf Deutsch</p>
        <h3>${escapeHtml(formatDate(d, { weekday: 'long', day: 'numeric', month: 'long' }))}</h3>
        <textarea class="line" id="journal" placeholder="Heute habe ich …" aria-label="Tagebucheintrag"></textarea>
        <div class="row mt"><button class="btn" type="button" id="saveJournal">Speichern</button><span class="muted small">Claude korrigiert den Eintrag in der nächsten Sitzung.</span></div>
        <div id="pastJournal"></div>
      </section>`;

    $('#saveJournal').addEventListener('click', async () => {
      const text = $('#journal').value.trim();
      if (!text) { toast('Schreib zuerst ein, zwei Sätze.'); return; }
      $('#saveJournal').disabled = true;
      try { await S.saveJournal(d, text); toast('Tagebuch gespeichert.'); } catch (e) { toast(`Nicht gespeichert: ${e.message}`, 'error'); }
      $('#saveJournal').disabled = false;
    });

    loadGrammar();
    loadJournal(d);
  },
};

async function loadGrammar() {
  const el = $('#gramList');
  try {
    const topics = await S.listGrammar();
    if (!el?.isConnected) return;
    if (!topics.length) { el.innerHTML = '<p class="muted">Noch keine Grammatikthemen. Claude legt sie in grammar/ an.</p>'; return; }
    const byCard = new Map(data.cards.map(c => [c.id, c]));
    const weight = slug => Object.entries(data.mistakes.items || {}).reduce((n, [k, it]) =>
      n + ((k === slug || byCard.get(k)?.grammar?.includes(slug)) ? it.count : 0), 0);
    const rows = topics.map(t => ({ ...t, w: weight(t.slug) })).sort((a, b) => b.w - a.w);
    el.innerHTML = `<div class="list">${rows.map(t => `<a class="li" href="#grammatik/${encodeURIComponent(t.slug)}"><b>${escapeHtml(t.title || t.slug)}</b>
      <span class="sub">${escapeHtml((t.tags || []).join(' · ') || 'Regeln und Beispiele')}</span>
      <span class="count ${t.w ? '' : 'quiet'}">${t.w ? `${t.w}<small>Fehler</small>` : 'lesen'}</span></a>`).join('')}</div>`;
  } catch (e) {
    if (el) el.innerHTML = `<p class="banner error">${escapeHtml(e.message)}</p>`;
  }
}

async function loadJournal(d) {
  try {
    const todayText = await S.getText(S.journalPath(d));
    const box = $('#journal');
    if (todayText && box && !box.value) box.value = todayText.replace(/^# .*\n+/, '').split('\n## Korrektur')[0].trim();
    const files = (await S.list('journal')).filter(f => /^\d{4}-\d{2}-\d{2}\.md$/.test(f.name) && f.name !== `${d}.md`)
      .sort((a, b) => b.name.localeCompare(a.name)).slice(0, 3);
    const el = $('#pastJournal');
    if (!files.length || !el) return;
    const texts = await Promise.all(files.map(f => S.getText(f.path)));
    if (!el.isConnected) return;
    el.innerHTML = `<p class="eyebrow" style="margin:34px 0 0">Frühere Einträge</p>` + files.map((f, i) =>
      `<details class="li" style="display:block"><summary style="cursor:pointer"><b>${escapeHtml(formatDate(f.name.slice(0, 10), { weekday: 'long', day: 'numeric', month: 'long' }))}</b>${texts[i]?.includes('## Korrektur') ? '<span class="tag" style="color:var(--moss)">korrigiert</span>' : ''}</summary>
        <div class="prose" style="margin-top:10px">${renderMarkdown((texts[i] || '').replace(/^# .*\n+/, ''))}</div></details>`).join('');
  } catch { /* journal is optional */ }
}
