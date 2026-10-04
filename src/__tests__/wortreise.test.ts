import { parseArticleMd, renderArticle } from '../../public/german-learning/js/md.js';
import {
  buildQueue,
  mergeSrs,
  nextInterval,
  schedule,
  subIds,
} from '../../public/german-learning/js/srs.js';

const day = '2026-10-03';
const card = (id: string, pos = 'verb', gender: string | null = null) => ({
  id,
  front: id,
  back: id,
  pos,
  gender,
});

describe('Wortreise spaced repetition', () => {
  it('makes three sub-cards for nouns and two for other words', () => {
    expect(subIds(card('see', 'noun', 'der'))).toEqual(['see#de', 'see#en', 'see#genus']);
    expect(subIds(card('gehen'))).toEqual(['gehen#de', 'gehen#en']);
    expect(subIds(card('gehen'), 'de')).toEqual(['gehen#de']);
  });

  it('schedules new cards 1 day, then 6 days, then by ease', () => {
    const a = schedule(null, 2, day);
    expect(a).toMatchObject({ interval: 1, reps: 1, due: '2026-10-04', ease: 2.5 });
    const b = schedule(a, 2, '2026-10-04');
    expect(b).toMatchObject({ interval: 6, reps: 2, due: '2026-10-10' });
    const c = schedule(b, 2, '2026-10-10');
    expect(c.interval).toBe(15);
    expect(c.due).toBe('2026-10-25');
  });

  it('adjusts ease and never drops below 1.3', () => {
    let st = schedule(null, 2, day);
    for (let i = 0; i < 12; i++) st = schedule(st, 1, day);
    expect(st.ease).toBe(1.3);
    expect(schedule(st, 3, day).ease).toBeCloseTo(1.45);
  });

  it('counts a lapse only for cards that were already learned', () => {
    const fresh = schedule(null, 0, day);
    expect(fresh).toMatchObject({ lapses: 0, reps: 0, interval: 0, due: day });
    const learned = schedule(schedule(null, 2, day), 2, day);
    const lapsed = schedule(learned, 0, day);
    expect(lapsed).toMatchObject({ lapses: 1, reps: 0, interval: 0, due: day });
    expect(lapsed.ease).toBeCloseTo(2.3);
  });

  it('previews intervals for the grade buttons', () => {
    expect([0, 1, 2, 3].map((g) => nextInterval(null, g))).toEqual([0, 1, 1, 4]);
    const st = { interval: 10, ease: 2.5, reps: 3 };
    expect([1, 2, 3].map((g) => nextInterval(st, g))).toEqual([12, 25, 33]);
  });

  it('builds a due queue with siblings buried and a new-card limit', () => {
    const cards = [card('a'), card('b'), card('c'), card('d')];
    const srs = {
      cards: {
        'a#de': { due: '2026-10-01', interval: 3, ease: 2.5, reps: 2, lapses: 0 },
        'a#en': { due: '2026-10-02', interval: 3, ease: 2.5, reps: 2, lapses: 0 },
        'b#de': { due: '2026-10-09', interval: 6, ease: 2.5, reps: 2, lapses: 0 },
      },
    };
    const q = buildQueue({ cards, srs, day, settings: { newPerDay: 1, directions: 'both' } });
    expect(q.map((x) => x.sub)).toEqual(['a#de', 'b#en']);
    expect(q.filter((x) => x.card.id === 'a')).toHaveLength(1);
  });

  it('merges two devices per card by the later review', () => {
    const remote = {
      cards: { x: { last: '2026-10-01', reps: 2 }, y: { last: '2026-10-03', reps: 4 } },
      log: { [day]: { reviews: 3 } },
      tests: [{ at: '1' }],
    };
    const local = {
      cards: { x: { last: '2026-10-02', reps: 3 }, y: { last: '2026-10-01', reps: 1 } },
      log: { [day]: { reviews: 5 } },
      tests: [{ at: '1' }, { at: '2' }],
    };
    const m = mergeSrs(remote, local);
    expect(m.cards.x.reps).toBe(3);
    expect(m.cards.y.reps).toBe(4);
    expect(m.log[day].reviews).toBe(5);
    expect(m.tests).toHaveLength(2);
  });
});

describe('Wortreise article rendering', () => {
  // Saved annotations use character offsets into the rendered text, so this must not change.
  it('keeps the rendered text identical to the original reader', () => {
    const raw =
      '---\ntitle: Test\ndate: 2026-04-06\n---\n\n# Titel\n\nErster **Satz**.\nZweite Zeile.\n\n- eins\n- zwei';
    const meta = parseArticleMd(raw, 'x');
    expect(meta.title).toBe('Test');
    const div = document.createElement('div');
    div.innerHTML = renderArticle(meta.text);
    expect(div.textContent).toBe('TitelErster Satz.Zweite Zeile.einszwei');
    expect(div.querySelectorAll('br')).toHaveLength(1);
  });
});
