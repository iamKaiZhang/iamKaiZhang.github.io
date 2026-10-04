// Small shared helpers. No dependencies.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Local calendar date as YYYY-MM-DD (scheduling works in the learner's own days).
export function today(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
}

export function daysBetween(a, b) {
  const t = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((t(b) - t(a)) / 86400000);
}

export function formatDate(iso, opts = { day: 'numeric', month: 'long' }) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', opts);
}

const WORDS = ['null', 'eine', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn',
  'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig'];
// German number word (feminine "eine" for 1, e.g. "eine Karte"); digits above twenty.
export function numberWord(n, capital = false) {
  const w = n <= 20 ? WORDS[n] : String(n);
  return capital ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}

// "sieben von zehn", or "3,5 von 7" when a self-graded half point is involved.
export function scoreText(score, of, capital = false) {
  return Number.isInteger(score) ? `${numberWord(score, capital)} von ${numberWord(of)}` : `${String(score).replace('.', ',')} von ${of}`;
}

// Ends a quoted solution with a full stop unless it already has punctuation.
export const withStop = s => (/[.!?…]$/.test(String(s).trim()) ? String(s).trim() : `${String(s).trim()}.`);

export const store = {
  get(k, fallback = null) {
    try { const v = localStorage.getItem(k); return v === null ? fallback : v; } catch { return fallback; }
  },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  remove(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  json(k, fallback = null) {
    const v = store.get(k);
    if (v === null) return fallback;
    try { return JSON.parse(v); } catch { return fallback; }
  },
  setJson(k, v) { store.set(k, JSON.stringify(v)); },
};

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Deterministic pick for "word of the day" style choices.
export function dailyIndex(len, salt = '') {
  const s = today() + salt;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return len ? h % len : 0;
}

// Normalise free-text answers: case, surrounding punctuation, ae/oe/ue/ss spellings.
export function normalizeAnswer(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[.,!?;:„“"»«()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü');
}

let toastTimer;
export function toast(msg, kind = '') {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast show ' + kind;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast ' + kind; }, 2800);
}

// Text-to-speech in German, if the browser has a voice.
export function speak(text) {
  if (!('speechSynthesis' in window) || !text) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  const pref = store.get('wr_voice');
  const voices = speechSynthesis.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith('de'));
  const voice = voices.find(v => v.name === pref) || voices[0];
  if (voice) u.voice = voice;
  u.rate = 0.92;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
  return true;
}

export function slugify(s) {
  return String(s).toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
