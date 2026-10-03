import { escapeHtml } from './util.js';

// ── Articles ───────────────────────────────────────────────────────────────
// renderArticle() and parseArticleMd() are ported unchanged from the original reader.
// Saved annotations store character offsets into the rendered text, so the produced
// textContent must stay exactly the same or old annotations would drift.

export function parseArticleMd(raw, slug) {
  const lines = raw.split('\n');
  const meta = { slug, title: slug, date: '', difficulty: '', source: '', text: '', displayTitle: '' };
  let i = 0;
  if (lines[0] === '---') {
    i = 1;
    while (i < lines.length && lines[i] !== '---') {
      const m = lines[i].match(/^(\w+):\s*(.+)/);
      if (m) meta[m[1].trim()] = m[2].trim();
      i++;
    }
    i++;
  }
  while (i < lines.length && lines[i].trim() === '') i++;
  meta.text = lines.slice(i).join('\n').trim();
  if (meta.title === slug) {
    const h = meta.text.match(/^#\s+(?:Article:\s*)?(.+)/m);
    if (h) meta.displayTitle = h[1].trim();
  }
  return meta;
}

export function renderMarkdownInline(str) {
  return escapeHtml(str)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

export function renderArticle(text) {
  const blocks = text.split(/\n\n+/);
  return blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    const h3 = trimmed.match(/^###\s+(.+)/);
    if (h3) return `<h3>${renderMarkdownInline(h3[1])}</h3>`;
    const h2 = trimmed.match(/^##\s+(.+)/);
    if (h2) return `<h2>${renderMarkdownInline(h2[1])}</h2>`;
    const h1 = trimmed.match(/^#\s+(.+)/);
    if (h1) return `<h1>${renderMarkdownInline(h1[1])}</h1>`;
    const lines = trimmed.split('\n');
    const isListBlock = lines.every(l => /^[-*]\s/.test(l.trim()) || l.trim() === '');
    if (isListBlock) {
      const items = lines.filter(l => l.trim())
        .map(l => `<li>${renderMarkdownInline(l.replace(/^[-*]\s+/, ''))}</li>`).join('');
      return `<ul>${items}</ul>`;
    }
    return `<p>${lines.map(renderMarkdownInline).join('<br>')}</p>`;
  }).join('');
}

// ── General markdown (grammar notes, journal, sessions) ───────────────────

export function stripFrontmatter(raw) {
  const meta = {};
  if (!raw.startsWith('---\n')) return { meta, body: raw };
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return { meta, body: raw };
  for (const line of raw.slice(4, end).split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.startsWith('[') && v.endsWith(']')) v = v.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    meta[m[1]] = v;
  }
  return { meta, body: raw.slice(end + 4).replace(/^\n+/, '') };
}

function inline(str) {
  return escapeHtml(str)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

export function renderMarkdown(raw) {
  const { body } = stripFrontmatter(raw);
  const lines = body.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    let m;
    if ((m = line.match(/^(#{1,4})\s+(.+)/))) {
      const lvl = Math.min(4, m[1].length + 1);
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`); i++; continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
    if (line.trim().startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++]);
      const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const body2 = rows.filter(r => !/^\s*\|?\s*:?-{2,}/.test(r));
      const [head, ...rest] = body2;
      out.push(`<div class="tbl"><table><thead><tr>${cells(head).map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${
        rest.map(r => `<tr>${cells(r).map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
      out.push(`<ul>${items.map(t => `<li>${inline(t)}</li>`).join('')}</ul>`);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
      out.push(`<ol>${items.map(t => `<li>${inline(t)}</li>`).join('')}</ol>`);
      continue;
    }
    if (line.startsWith('>')) {
      const q = [];
      while (i < lines.length && lines[i].startsWith('>')) q.push(lines[i++].replace(/^>\s?/, ''));
      out.push(`<blockquote>${q.map(inline).join('<br>')}</blockquote>`);
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\||\s*[-*]\s|\s*\d+[.)]\s|>|-{3,})/.test(lines[i])) para.push(lines[i++]);
    if (!para.length) para.push(lines[i++]);
    out.push(`<p>${para.map(inline).join('<br>')}</p>`);
  }
  return out.join('\n');
}
