import { pickTheme } from '@/context/sunTheme';

// Pretends the visitor is in a given time zone: its name, and how many
// hours it is ahead of UTC in January and in July. Dates in these tests are
// built from local clock values, so only the zone and its offsets matter.
const inZone = (zone: string, january: number, july: number, run: () => void) => {
  const offset = jest
    .spyOn(Date.prototype, 'getTimezoneOffset')
    .mockImplementation(function offsetFor(this: Date) {
      const summer = this.getMonth() >= 3 && this.getMonth() <= 8;
      return -(summer ? july : january) * 60;
    });
  const format = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
    () =>
      ({
        resolvedOptions: () => ({ timeZone: zone }),
      }) as Intl.DateTimeFormat,
  );
  try {
    run();
  } finally {
    offset.mockRestore();
    format.mockRestore();
  }
};

describe('pickTheme', () => {
  it('follows the long summer day in Zürich', () => {
    inZone('Europe/Zurich', 1, 2, () => {
      expect(pickTheme(new Date(2026, 5, 21, 13, 0), null)).toBe('day');
      expect(pickTheme(new Date(2026, 5, 21, 20, 30), null)).toBe('day');
      expect(pickTheme(new Date(2026, 5, 21, 23, 0), null)).toBe('night');
      expect(pickTheme(new Date(2026, 5, 21, 4, 0), null)).toBe('night');
    });
  });

  it('follows the short winter day in Zürich', () => {
    inZone('Europe/Zurich', 1, 2, () => {
      expect(pickTheme(new Date(2026, 11, 21, 12, 0), null)).toBe('day');
      expect(pickTheme(new Date(2026, 11, 21, 18, 0), null)).toBe('night');
      expect(pickTheme(new Date(2026, 11, 21, 7, 0), null)).toBe('night');
    });
  });

  it('flips the seasons in the southern hemisphere', () => {
    inZone('Australia/Sydney', 11, 10, () => {
      // A December evening is still light in Sydney
      expect(pickTheme(new Date(2026, 11, 21, 19, 30), null)).toBe('day');
      // A June evening is dark
      expect(pickTheme(new Date(2026, 5, 21, 18, 0), null)).toBe('night');
    });
  });

  it('estimates a zone that is not in the table', () => {
    inZone('Europe/Vienna', 1, 2, () => {
      expect(pickTheme(new Date(2026, 5, 21, 13, 0), null)).toBe('day');
      expect(pickTheme(new Date(2026, 11, 21, 23, 0), null)).toBe('night');
    });
  });

  it('lets a manual choice win, but only on the day it was made', () => {
    inZone('Europe/Zurich', 1, 2, () => {
      const noon = new Date(2026, 5, 21, 13, 0);
      expect(pickTheme(noon, `night|${noon.toDateString()}`)).toBe('night');
      expect(pickTheme(noon, 'night|Sat Jun 20 2026')).toBe('day');
      expect(pickTheme(noon, 'nonsense')).toBe('day');
    });
  });
});
