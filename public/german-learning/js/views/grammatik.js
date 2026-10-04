import { $, escapeHtml } from '../util.js';
import * as S from '../store.js';
import { renderMarkdown, stripFrontmatter } from '../md.js';

export default {
  async render(root, args) {
    const topics = await S.listGrammar();
    const slug = args[0];
    if (!slug) {
      root.innerHTML = `<section class="sheet"><p class="eyebrow">Grammatik</p><h2>Themen</h2>
        <div class="list">${topics.map(t => `<a class="li" href="#grammatik/${encodeURIComponent(t.slug)}"><b>${escapeHtml(t.title || t.slug)}</b><span class="sub">${escapeHtml((t.tags || []).join(' · '))}</span></a>`).join('') || '<p class="muted">Noch keine Themen.</p>'}</div></section>`;
      return;
    }
    const t = topics.find(x => x.slug === slug) || { slug, path: `grammar/${slug}.md` };
    const raw = await S.getText(t.path);
    if (raw === null) throw new Error(`Grammatikthema „${slug}“ nicht gefunden.`);
    const { meta, body } = stripFrontmatter(raw);
    // The first heading becomes the page title.
    const h = body.match(/^#\s+(?:Grammar:\s*)?(.+)$/m);
    const title = meta.title || (h ? h[1] : slug);
    const rest = h ? body.replace(h[0], '') : body;
    root.innerHTML = `
      <article class="sheet">
        <p class="eyebrow"><a class="link" style="border:0;padding:0" href="#wiederholen">Wiederholen</a> · Grammatik</p>
        <h2>${escapeHtml(title)}</h2>
        <div class="prose">${renderMarkdown(rest)}</div>
        <div class="row mt"><a class="btn" href="#test/grammar/${encodeURIComponent(slug)}">Fragen zu diesem Thema</a><a class="link" href="#wiederholen">Zurück</a></div>
      </article>`;
  },
};
