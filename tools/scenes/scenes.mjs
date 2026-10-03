// Scene registry: order here is the order in scenes.json.
import { SCENES_DE } from './scenes-de.mjs';
import { SCENES_WORLD } from './scenes-world.mjs';

const ALL = [...SCENES_DE, ...SCENES_WORLD];
const ORDER = [
  'brandenburger-tor', 'fernsehturm', 'elbphilharmonie', 'koelner-dom', 'neuschwanstein', 'grossmuenster',
  'matterhorn', 'riesenrad-prater', 'eiffelturm', 'rialto', 'fushimi-inari', 'fuji', 'golden-gate',
  'sydney-opera', 'oia-santorini', 'tower-bridge',
];
export const SCENES = ORDER.map((slug) => ALL.find((s) => s.slug === slug)).filter(Boolean);
