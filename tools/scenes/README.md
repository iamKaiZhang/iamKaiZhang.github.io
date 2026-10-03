# Wortreise background scenes

Procedural woodblock / risograph prints of 16 famous places, used as page backgrounds in
`public/german-learning/`. Each scene is drawn as SVG (flat colour layers run through a
"stamped ink" filter on cream paper) and screenshotted with headless Chromium.

## Re-render

```bash
node tools/scenes/render.mjs                       # all scenes
node tools/scenes/render.mjs fuji rialto           # only these slugs
```

Output: `public/german-learning/scenes/<slug>.jpg` (1440×1920, JPEG q80) and
`public/german-learning/scenes/scenes.json` (always rewritten with every scene).
The intermediate SVGs go to `$TMPDIR/wortreise-scenes/` for inspection.

Playwright is loaded from the local `node_modules` if present, otherwise from
`/opt/node-tools/node_modules/playwright`. A Chromium build must already be installed.

Contact sheet for review (ImageMagick):

```bash
cd public/german-learning/scenes && montage *.jpg -tile 4x -geometry 300x400+4+4 /tmp/sheet.jpg
```

## Files

- `lib.mjs` – canvas size, shared palette `C`, shape helpers (`rect`, `poly`, `arch`, `lancet`,
  `sag`, `smooth` …), motifs (`blobs`/`crown` for stamped foliage and clouds, `waterLines`,
  `birds`, `hatch`, `construction`) and the `Print` class:
  - `P.layer(color, svg, opts)` – one flat colour layer with rough edges, paper pores and a
    small random misregistration offset. Options: `rough`, `edge`, `micro` (edge wobble),
    `speck` (how much paper shows through), `mottle` (uneven inking), `opacity`, `dx`/`dy`,
    `mask: true` (fade out through the scene's dissolve mask), `fixed: true` (ignore
    `P.transform`). `color` may also be a gradient from `P.grad()` / `P.rgrad()` (bokashi).
  - `P.stamp()` – heavy crinkly edge for foliage and clouds; `P.wash()` – soft large areas.
  - `P.pencil(svg)` – thin graphite strokes (construction lines, hatching).
  - `P.dissolve({cx, cy, rx, ry})` – ragged radial mask where the scene breaks up into paper.
  - `P.transform` – optional transform applied to every layer (to rescale a whole scene).
- `scenes-de.mjs`, `scenes-world.mjs` – one draw function per scene plus its metadata.
- `scenes.mjs` – registry; `ORDER` sets the order in `scenes.json`.
- `render.mjs` – renders and writes `scenes.json`.

## Adding a scene

1. Write `function myPlace(P) { … }` in one of the scene modules. Build it back to front with
   `P.layer` / `P.stamp` / `P.wash`, one call per colour, using the shared palette `C` and only
   adding a scene-specific accent colour when the landmark needs it.
2. Composition: the app's text sits on the empty paper. Keep the top ~35 % (y < 670) and the
   left ~30 % (x < 430) of the 1440×1920 canvas nearly empty (a sun, a bird, a stray leaf at
   most) and put the landmark in the lower right, running off the right/bottom edge where
   natural. No text or lettering in the image.
3. Add an entry `{ slug, seed, paper, focus, mfocus, place, de, en, draw }` to the module's
   exported array and the slug to `ORDER` in `scenes.mjs`.
   - `paper` is the exact background colour of the print (the page uses it to hide the edge).
   - `focus` / `mfocus` are CSS `object-position` values for desktop (image covers the right
     two thirds of a landscape screen) and phone (image covers the lower 60 %).
   - `de` / `en`: a short A2–B1 poster line and its translation.
4. Render it (`node tools/scenes/render.mjs <slug>`), look at it, iterate. Aim for 120–420 KB;
   large areas of dark, speckled ink are what make files big.
