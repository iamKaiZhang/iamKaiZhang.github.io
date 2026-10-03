// Render every scene to public/german-learning/scenes/<slug>.jpg and write scenes.json.
//   node tools/scenes/render.mjs                 # all scenes
//   node tools/scenes/render.mjs eiffelturm fuji # only these slugs (scenes.json is still rewritten in full)
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { Print, W, H } from './lib.mjs';
import { SCENES } from './scenes.mjs';

const require = createRequire(import.meta.url);
let playwright;
try {
  playwright = require('playwright');
} catch {
  playwright = require('/opt/node-tools/node_modules/playwright');
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = join(root, 'public', 'german-learning', 'scenes');
const svgDir = join(tmpdir(), 'wortreise-scenes');
mkdirSync(outDir, { recursive: true });
mkdirSync(svgDir, { recursive: true });

const only = process.argv.slice(2);
const todo = only.length ? SCENES.filter((s) => only.includes(s.slug)) : SCENES;

const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
for (const scene of todo) {
  const t = Date.now();
  const P = new Print({ paper: scene.paper, seed: scene.seed });
  scene.draw(P);
  const svg = P.svg();
  const html = `<!doctype html><html><body style="margin:0;background:${scene.paper}">${svg}</body></html>`;
  writeFileSync(join(svgDir, `${scene.slug}.svg`), svg);
  await page.setContent(html);
  await page.screenshot({ path: join(outDir, `${scene.slug}.jpg`), type: 'jpeg', quality: 80, clip: { x: 0, y: 0, width: W, height: H } });
  console.log(`${scene.slug}.jpg  ${Date.now() - t} ms`);
}
await browser.close();

const index = SCENES.map((s) => ({
  file: `${s.slug}.jpg`,
  paper: s.paper,
  focus: s.focus,
  mfocus: s.mfocus,
  place: s.place,
  de: s.de,
  en: s.en,
}));
writeFileSync(join(outDir, 'scenes.json'), JSON.stringify(index, null, 2) + '\n');
console.log(`scenes.json: ${index.length} entries; SVG sources in ${svgDir}`);
