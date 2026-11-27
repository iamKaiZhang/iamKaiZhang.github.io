export type Theme = 'day' | 'night';

// Where a manual choice is remembered: "<theme>|<date it was made>"
export const THEME_KEY = 'kz-theme-choice';

/**
 * Picks the theme for a visitor: day between sunrise and sunset where they
 * are, night otherwise. A manual choice (see THEME_KEY) wins for the rest of
 * the day it was made on.
 *
 * The visitor's position is estimated from their time zone, with no
 * permission prompt and no network request: a table for common zones, and
 * otherwise the zone's UTC offset for longitude and its region for latitude.
 * Sunrise and sunset can be off by up to about an hour, which is fine for
 * choosing between two themes.
 *
 * This function is also inlined into the page as a script that runs before
 * first paint (see app/layout.tsx), so it must stay self-contained: no
 * imports, no outer variables, and no syntax that compiles to helpers.
 */
export function pickTheme(now: Date, stored: string | null): Theme {
  if (stored) {
    const parts = stored.split('|');
    if ((parts[0] === 'day' || parts[0] === 'night') && parts[1] === now.toDateString()) {
      return parts[0];
    }
  }

  // [latitude, longitude] of common time zones
  const known: Record<string, number[]> = {
    'Europe/Zurich': [47, 9],
    'Europe/London': [52, 0],
    'Europe/Paris': [49, 2],
    'Europe/Berlin': [52, 13],
    'Europe/Madrid': [40, -4],
    'Europe/Rome': [42, 12],
    'Europe/Stockholm': [59, 18],
    'Europe/Moscow': [56, 38],
    'Europe/Istanbul': [41, 29],
    'America/New_York': [41, -74],
    'America/Chicago': [42, -88],
    'America/Denver': [40, -105],
    'America/Los_Angeles': [34, -118],
    'America/Toronto': [44, -79],
    'America/Vancouver': [49, -123],
    'America/Mexico_City': [19, -99],
    'America/Bogota': [5, -74],
    'America/Lima': [-12, -77],
    'America/Sao_Paulo': [-24, -47],
    'America/Santiago': [-33, -71],
    'America/Argentina/Buenos_Aires': [-35, -58],
    'Asia/Shanghai': [31, 121],
    'Asia/Hong_Kong': [22, 114],
    'Asia/Tokyo': [36, 140],
    'Asia/Seoul': [38, 127],
    'Asia/Singapore': [1, 104],
    'Asia/Kolkata': [21, 79],
    'Asia/Dubai': [25, 55],
    'Asia/Bangkok': [14, 101],
    'Asia/Jakarta': [-6, 107],
    'Australia/Sydney': [-34, 151],
    'Australia/Melbourne': [-38, 145],
    'Australia/Brisbane': [-27, 153],
    'Australia/Perth': [-32, 116],
    'Pacific/Auckland': [-37, 175],
    'Africa/Cairo': [30, 31],
    'Africa/Lagos': [6, 3],
    'Africa/Nairobi': [-1, 37],
    'Africa/Johannesburg': [-26, 28],
  };
  // A typical latitude for every other zone, by its region
  const regions: Record<string, number> = {
    Europe: 50,
    America: 40,
    Asia: 30,
    Africa: 5,
    Atlantic: 35,
    Australia: -30,
    Pacific: -15,
    Indian: -10,
    Antarctica: -75,
    Arctic: 78,
  };

  const year = now.getFullYear();
  // Minutes ahead of UTC, in January, in July, and right now
  const january = -new Date(year, 0, 1).getTimezoneOffset();
  const july = -new Date(year, 6, 1).getTimezoneOffset();
  const current = -now.getTimezoneOffset();

  let zone = '';
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    // No time zone name; the UTC offset below still gives a longitude
  }

  let latitude = 40;
  let longitude = (Math.min(january, july) / 60) * 15;
  if (known[zone]) {
    latitude = known[zone][0];
    longitude = known[zone][1];
  } else {
    const region = regions[zone.split('/')[0]];
    if (region !== undefined) latitude = region;
    // Summer time in January means the southern hemisphere
    if (january > july) latitude = -Math.abs(latitude);
  }

  // Length of the day from the sun's declination on this day of the year
  const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / 86400000);
  const declination = -23.44 * Math.cos((2 * Math.PI * (dayOfYear + 10)) / 365);
  const toRadians = Math.PI / 180;
  const cosHalfDay = -Math.tan(latitude * toRadians) * Math.tan(declination * toRadians);
  // Hours from solar noon to sunset; 0 in polar night, 12 under the midnight sun
  const halfDay =
    cosHalfDay >= 1 ? 0 : cosHalfDay <= -1 ? 12 : (Math.acos(cosHalfDay) * 12) / Math.PI;

  // Solar noon on the visitor's clock, and how far the clock is from it
  const solarNoon = 12 + current / 60 - longitude / 15;
  const clock = now.getHours() + now.getMinutes() / 60;
  const fromNoon = Math.abs(((clock - solarNoon + 36) % 24) - 12);

  return fromNoon < halfDay ? 'day' : 'night';
}
