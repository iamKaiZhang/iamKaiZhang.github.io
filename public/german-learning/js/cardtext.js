// How a card's fields are shown. Shared by Karten, Heute and Test.
import { escapeHtml } from './util.js';

const POS = { noun: 'Nomen', verb: 'Verb', adj: 'Adjektiv', adv: 'Adverb', phrase: 'Wendung', connector: 'Konnektor', other: '' };

export function posLabel(card) {
  const parts = [POS[card.pos] || ''];
  const f = card.forms || {};
  if (f.separable) parts.push('trennbar');
  if (f.case) parts.push('+ ' + f.case.charAt(0).toUpperCase() + f.case.slice(1));
  return parts.filter(Boolean).join(' · ');
}

// German side with article for nouns, as HTML.
export function germanHtml(card) {
  const art = card.pos === 'noun' && card.gender ? `<span class="art">${escapeHtml(card.gender)}</span> ` : '';
  return art + escapeHtml(card.front);
}
export const germanText = card => (card.pos === 'noun' && card.gender ? `${card.gender} ${card.front}` : card.front);

export function formsLine(card) {
  const bits = [];
  if (card.pos === 'noun') bits.push(card.plural ? `Plural: die ${card.plural}` : 'kein Plural');
  const f = card.forms || {};
  if (f.perfekt) bits.push(`Perfekt: ${f.perfekt}`);
  if (f.praeteritum) bits.push(`Präteritum: ${f.praeteritum}`);
  return bits.map(escapeHtml).join(' · ');
}

export function shortDate(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-').map(Number);
  return `${d}.${m}.`;
}
