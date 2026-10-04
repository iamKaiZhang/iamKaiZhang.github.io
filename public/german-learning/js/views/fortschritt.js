import { escapeHtml, today, addDays, formatDate } from '../util.js';
import { data } from '../store.js';
import * as S from '../store.js';
import { cardStage } from '../srs.js';
import { allScenes, cityOf } from '../scenes.js';

export default {
  async render(root) {
    const stages = { new: 0, learning: 0, young: 0, mature: 0 };
    for (const c of data.cards) stages[cardStage(c, data.srs)]++;
    let articles = data.manifest?.articles?.length;
    let grammar = data.manifest?.grammar?.length;
    if (articles == null) { try { articles = (await S.listArticles()).length; } catch { articles = 0; } }
    if (grammar == null) { try { grammar = (await S.listGrammar()).length; } catch { grammar = 0; } }
    const log = data.srs.log || {};

    // 16 weeks, one column per week (Monday first), ending this week.
    const d0 = today();
    const dow = (new Date().getDay() + 6) % 7;
    const start = addDays(d0, -(15 * 7 + dow));
    const cells = [];
    for (let i = 0; i < 16 * 7; i++) {
      const d = addDays(start, i);
      if (d > d0) { cells.push('<i style="visibility:hidden"></i>'); continue; }
      const e = log[d] || {};
      const v = (e.reviews || 0) + 5 * (e.tests || 0);
      const lvl = v === 0 ? '' : v < 10 ? 'a' : v < 30 ? 'b' : 'c';
      cells.push(`<i class="${lvl} ${d === d0 ? 't' : ''}" title="${escapeHtml(formatDate(d))}: ${e.reviews || 0} Karten${e.tests ? `, ${e.tests} Test` : ''}"></i>`);
    }
    const studyDays = Object.values(log).filter(e => (e.reviews || 0) + (e.tests || 0) > 0).length;

    const stampDates = {};
    for (const [d, e] of Object.entries(log).sort()) if (e.place && !stampDates[e.place]) stampDates[e.place] = d;
    const cities = [...new Set(allScenes().map(cityOf))];
    const tests = (data.srs.tests || []).slice(-8).reverse();

    root.innerHTML = `
      <section class="sheet">
        <p class="eyebrow">Fortschritt</p>
        <h2>${data.cards.length} Wörter, ${articles || 0} Artikel, ${grammar || 0} ${grammar === 1 ? 'Grammatikthema' : 'Grammatikthemen'}</h2>
        <div class="nums">
          <div style="--c:var(--ochre)"><b>${stages.new}</b><span>Neu</span></div>
          <div style="--c:var(--vermilion)"><b>${stages.learning}</b><span>Im Lernen</span></div>
          <div style="--c:#b9a27a"><b>${stages.young}</b><span>Jung</span></div>
          <div style="--c:var(--moss)"><b>${stages.mature}</b><span>Gefestigt</span></div>
        </div>
        <p class="muted small">Jung: Intervall unter drei Wochen. Gefestigt: drei Wochen oder mehr.</p>

        <div class="section"><p class="eyebrow">Lerntage · sechzehn Wochen · ${studyDays} insgesamt</p><div class="heat">${cells.join('')}</div></div>

        <div class="section"><p class="eyebrow">Tests</p>
          ${tests.length ? `<div class="list">${tests.map(t => `<div class="li"><b>${escapeHtml(t.title || t.bank)}</b><span class="sub">${escapeHtml(formatDate(t.at.slice(0, 10), { day: 'numeric', month: 'long', year: 'numeric' }))}</span><span class="count">${String(t.score).replace('.', ',')}<small>von ${t.of}</small></span></div>`).join('')}</div>`
            : '<p class="muted">Noch keine Tests in der App. <a class="link" href="#test">Ersten Test machen</a></p>'}
        </div>

        ${cities.length ? `<div class="section"><p class="eyebrow">Reisepass · jeder Lerntag stempelt die Stadt des Tages</p>
          <div class="stamps">${cities.map(c => `<div class="stamp ${stampDates[c] ? 'on' : ''}"><b>${escapeHtml(c)}</b>${stampDates[c] ? escapeHtml(formatDate(stampDates[c], { day: 'numeric', month: 'short' })) : 'offen'}</div>`).join('')}</div></div>` : ''}
      </section>`;
  },
};
