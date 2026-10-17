import { parseArticleMd, renderArticle } from '../../public/german-learning/js/md.js';
import {
  buildQueue,
  isLearning,
  mergeSrs,
  nextCard,
  preview,
  schedule,
  studyPools,
  subIds,
} from '../../public/german-learning/js/srs.js';

const day = '2026-10-03';
const noon = new Date(2026, 9, 3, 12, 0).getTime();
const MIN = 60000;
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

  it('walks a new card through 1- and 10-minute steps before it graduates to a day', () => {
    expect([0, 1, 2, 3].map((g) => preview(null, g))).toEqual([
      { minutes: 1 },
      { minutes: 6 },
      { minutes: 10 },
      { days: 4 },
    ]);
    const a = schedule(null, 2, noon);
    expect(a).toMatchObject({ learn: 1, reps: 0, due: day });
    expect(Date.parse(a.dueAt) - noon).toBe(10 * MIN);
    expect(isLearning(a)).toBe(true);
    const b = schedule(a, 2, noon + 10 * MIN);
    expect(b).toMatchObject({ interval: 1, reps: 1, due: '2026-10-04' });
    expect(b.learn).toBeUndefined();
    expect(b.dueAt).toBeUndefined();
    expect(schedule(null, 3, noon)).toMatchObject({ interval: 4, due: '2026-10-07' });
  });

  it('sends a missed learning card back to the first step', () => {
    const a = schedule(schedule(null, 2, noon), 0, noon);
    expect(a.learn).toBe(0);
    expect(Date.parse(a.dueAt) - noon).toBe(1 * MIN);
    expect(a.lapses).toBe(0);
  });

  it('grows review intervals by ease and never lets ease drop below 1.3', () => {
    const st = { interval: 10, ease: 2.5, reps: 3, lapses: 0, due: day };
    expect([1, 2, 3].map((g) => preview(st, g).days)).toEqual([12, 25, 33]);
    expect(schedule(st, 2, noon)).toMatchObject({ interval: 25, reps: 4, due: '2026-10-28' });
    let r: Record<string, unknown> = st;
    for (let i = 0; i < 12; i++) r = schedule(r, 1, noon);
    expect(r.ease).toBe(1.3);
  });

  it('relearns a missed review card for 10 minutes, then restarts at one day', () => {
    const st = { interval: 20, ease: 2.5, reps: 4, lapses: 0, due: day };
    const lapsed = schedule(st, 0, noon);
    expect(lapsed).toMatchObject({ lapses: 1, relearn: true, learn: 0, interval: 1 });
    expect(lapsed.ease).toBeCloseTo(2.3);
    expect(Date.parse(lapsed.dueAt) - noon).toBe(10 * MIN);
    expect(schedule(lapsed, 2, noon + 10 * MIN)).toMatchObject({ interval: 1, due: '2026-10-04' });
  });

  it('treats older data that only marked a miss with interval 0 as learning', () => {
    expect(isLearning({ reps: 0, interval: 0, due: day })).toBe(true);
    expect(isLearning({ reps: 1, interval: 1, due: day })).toBe(false);
  });

  it('builds the day from learning, due reviews and a limited number of new cards', () => {
    const cards = [card('a'), card('b'), card('c'), card('d'), card('e')];
    const srs = {
      cards: {
        'a#de': { due: '2026-10-01', interval: 3, ease: 2.5, reps: 2, lapses: 0 },
        'a#en': { due: '2026-10-02', interval: 3, ease: 2.5, reps: 2, lapses: 0 },
        'b#de': { due: '2026-10-09', interval: 6, ease: 2.5, reps: 2, lapses: 0 },
        'e#de': {
          due: day,
          interval: 0,
          reps: 0,
          learn: 1,
          dueAt: new Date(noon + 5 * MIN).toISOString(),
        },
      },
    };
    const pools = studyPools({
      cards,
      srs,
      now: noon,
      settings: { newPerDay: 1, directions: 'both' },
    });
    expect(pools.learning.map((x) => x.sub)).toEqual(['e#de']);
    expect(pools.reviews.map((x) => x.sub)).toEqual(['a#de']);
    expect(pools.news.map((x) => x.sub)).toEqual(['b#en']);
    expect(
      buildQueue({ cards, srs, now: noon, settings: { newPerDay: 1, directions: 'both' } }),
    ).toHaveLength(3);
  });

  it('shows a learning card when its step is due, and early only when nothing else is left', () => {
    const lrn = { sub: 'x#de', kind: 'learning', at: noon + 5 * MIN };
    const rev = { sub: 'y#de', kind: 'review' };
    const pools = { learning: [lrn], reviews: [rev], news: [] };
    expect(nextCard(pools, noon, 0)?.sub).toBe('y#de');
    expect(nextCard(pools, noon, 1)?.sub).toBe('x#de');
    const later = { learning: [{ ...lrn, at: noon + 30 * MIN }], reviews: [], news: [] };
    expect(nextCard(later, noon, 0)).toBeNull();
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
