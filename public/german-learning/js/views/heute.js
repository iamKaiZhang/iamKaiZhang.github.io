import { escapeHtml, today, addDays, numberWord, formatDate, store, dailyIndex, speak, scoreText, $ } from '../util.js';
import { data, isDemo } from '../store.js';
import { buildQueue } from '../srs.js';
import { germanHtml, germanText } from '../cardtext.js';
import { currentScene, onSceneChange, show, allScenes } from '../scenes.js';

function wordOfTheDay() {
  const byId = new Map(data.cards.map(c => [c.id, c]));
  const weak = Object.entries(data.mistakes.items || {})
    .filter(([id]) => byId.has(id))
    .sort((a, b) => (b[1].count - a[1].count) || String(b[1].last).localeCompare(String(a[1].last)))
    .slice(0, 6);
  if (weak.length) return { card: byId.get(weak[dailyIndex(weak.length, 'wotd')][0]), weak: true };
  if (data.cards.length) return { card: data.cards[dailyIndex(data.cards.length, 'wotd')], weak: false };
  return null;
}

function streak() {
  const log = data.srs.log || {};
  const active = d => { const e = log[d]; return !!e && ((e.reviews || 0) + (e.tests || 0) > 0); };
  const d0 = today();
  const days = [];
  for (let i = 20; i >= 0; i--) { const d = addDays(d0, -i); days.push({ d, on: active(d), now: i === 0 }); }
  let run = 0;
  let d = active(d0) ? d0 : addDays(d0, -1);
  while (active(d)) { run++; d = addDays(d, -1); }
  return { days, run };
}

export default {
  render(root) {
    const day = today();
    const queue = buildQueue({ cards: data.cards, srs: data.srs, day, settings: data.srs.settings, newDoneToday: data.srs.log?.[day]?.new || 0 });
    const due = queue.length;
    const fehler = queue.filter(q => data.mistakes.items?.[q.card.id]).length;
    const lastTest = (data.srs.tests || []).at(-1);
    const lastArticle = store.json('wr_last_article');
    const h = new Date().getHours();
    const greet = (h < 11 ? 'Guten Morgen' : h < 18 ? 'Guten Tag' : 'Guten Abend') + ' · ' +
      new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

    let headline;
    if (!data.cards.length) headline = 'Willkommen bei <em>Wortreise</em>.';
    else if (due === 0) headline = 'Für heute ist alles <em>erledigt</em>.';
    else if (due === 1) headline = 'Eine Karte <em>wartet</em> auf dich.';
    else headline = `${numberWord(due, true)} Karten <em>warten</em> auf dich.`;

    const lede = [];
    if (!data.cards.length) {
      lede.push(isDemo() ? 'Hier entsteht deine Kartensammlung.' : 'Sobald Claude deine Wörter in cards/cards.json gesammelt hat, erscheinen sie hier als Karten. Bis dahin kannst du lesen und markieren.');
    } else if (due === 0) {
      lede.push('Morgen kommen neue Wiederholungen. Ein kurzer Test oder ein Artikel geht immer.');
    } else if (fehler) {
      lede.push(`${numberWord(fehler, true)} davon ${fehler === 1 ? 'steht' : 'stehen'} im Fehlerheft.`);
    }
    if (lastTest) lede.push(`Dein letzter Test lag bei ${scoreText(lastTest.score, lastTest.of)}.`);
    if (lastArticle?.title) lede.push(`<i>${escapeHtml(lastArticle.title)}</i> wartet beim Lesen.`);

    const w = wordOfTheDay();
    const s = streak();
    const scene = currentScene();
    const lastHref = lastArticle?.slug ? `#lesen/${encodeURIComponent(lastArticle.slug)}` : '#lesen';

    root.innerHTML = `
      <section id="s-heute">
        ${isDemo() ? `<p class="banner">Du siehst Beispieldaten. Verbinde dein GitHub-Repo in den <a href="#einstellungen">Einstellungen</a>, um mit deinen eigenen Karten zu lernen.</p>` : ''}
        ${data.error ? `<p class="banner error">Offline-Kopie · ${escapeHtml(data.error)}</p>` : ''}
        <p class="eyebrow">${escapeHtml(greet)}</p>
        <h1 class="hello">${headline}</h1>
        <p class="lede">${lede.join(' ')}</p>
        <div class="row">
          ${due ? '<a class="btn" href="#karten">Karten lernen <span aria-hidden="true">→</span></a>' : '<a class="btn" href="#test">Kurzer Test <span aria-hidden="true">→</span></a>'}
          <a class="link" href="${lastHref}">${lastArticle ? 'Weiterlesen' : 'Lesen'}</a>
          ${due ? '<a class="link hide-narrow" href="#test">Kurzer Test</a>' : '<a class="link hide-narrow" href="#wiederholen">Wiederholen</a>'}
        </div>
        ${w ? `
        <div class="wotd">
          <p class="eyebrow">Wort des Tages${w.weak ? '<span class="hide-narrow"> · aus dem Fehlerheft</span>' : ''}</p>
          <span class="w">${germanHtml(w.card)}</span>
          <span class="m">${escapeHtml(w.card.back)} <button class="say" type="button" id="sayWotd" aria-label="Aussprechen">🔊</button></span>
          ${w.card.example?.de ? `<span class="wex">${escapeHtml(w.card.example.de)}</span>` : ''}
          <div class="slipcap"><span id="slipCap"></span><button type="button" id="shuffle2" aria-label="Andere Szene">↻</button></div>
        </div>` : ''}
        ${data.cards.length ? `
        <div class="days" aria-label="Lerntage der letzten drei Wochen">
          ${s.days.map(x => `<i class="${x.on ? 'on' : ''} ${x.now ? 'now' : ''}" title="${formatDate(x.d)}"></i>`).join('')}
          <span>${s.run ? (s.run === 1 ? 'Ein Tag in Folge' : `${numberWord(s.run, true)} Tage in Folge`) : 'Heute ist ein guter Tag zum Anfangen'}</span>
        </div>` : ''}
      </section>`;

    const setCap = sc => { const el = $('#slipCap'); if (el && sc) el.textContent = `${sc.de} · ${sc.place}`; };
    setCap(scene);
    onSceneChange(setCap);
    $('#shuffle2')?.addEventListener('click', () => {
      const all = allScenes();
      if (all.length > 1) { let i; do { i = Math.floor(Math.random() * all.length); } while (all[i] === currentScene()); show(i); }
    });
    $('#sayWotd')?.addEventListener('click', () => speak(w.card.example?.de || germanText(w.card)));
  },
};
