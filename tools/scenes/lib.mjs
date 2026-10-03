// Shared drawing primitives for the Wortreise woodblock-print scenes.
// Everything returns SVG markup strings; a Print collects colour layers,
// each rendered through its own "stamped ink" filter.

export const W = 1440;
export const H = 1920;

// Shared palette (scene-specific accents are passed in by the scene itself).
export const C = {
  ink: '#2b2622',
  verm: '#c2482a',
  moss: '#6d7440',
  mossLt: '#959563',
  ochre: '#c9963a',
  indigo: '#3d5a73',
  sky: '#cdd6d3',
  sand: '#e8d3b0',
  stone: '#b3a58c',
  white: '#f8f2e3',
};

// Deterministic PRNG (mulberry32).
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => Math.round(n * 10) / 10;

// ─── basic shapes ──────────────────────────────────────────────
export const rect = (x, y, w, h, extra = '') =>
  `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" ${extra}/>`;
export const circle = (cx, cy, r, extra = '') =>
  `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" ${extra}/>`;
export const ellipse = (cx, cy, rx, ry, extra = '') =>
  `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" ${extra}/>`;
export const poly = (pts, extra = '') =>
  `<polygon points="${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(' ')}" ${extra}/>`;
export const path = (d, extra = '') => `<path d="${d}" ${extra}/>`;
export const line = (x1, y1, x2, y2, w = 2, extra = '') =>
  `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="currentColor" stroke-width="${w}" ${extra}/>`;
// Thick straight bar between two points as a polygon (fills, no stroke).
export function bar(x1, y1, x2, y2, w) {
  const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1;
  const nx = (-dy / l) * (w / 2), ny = (dx / l) * (w / 2);
  return poly([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]]);
}
// Smooth closed/open curve through points (Catmull-Rom → cubic Bézier).
export function smooth(pts, closed = false, t = 0.5) {
  const p = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${f(p[1][0])},${f(p[1][1])}`;
  for (let i = 1; i < p.length - 2; i++) {
    const [x0, y0] = p[i - 1], [x1, y1] = p[i], [x2, y2] = p[i + 1], [x3, y3] = p[i + 2];
    d += ` C${f(x1 + ((x2 - x0) * t) / 3)},${f(y1 + ((y2 - y0) * t) / 3)} ${f(x2 - ((x3 - x1) * t) / 3)},${f(y2 - ((y3 - y1) * t) / 3)} ${f(x2)},${f(y2)}`;
  }
  return closed ? d + 'Z' : d;
}
// Round-topped arch opening: x,y = top-left of the rectangle part's top (springing line).
export function arch(x, y, w, h) {
  const r = w / 2;
  return path(`M${f(x)},${f(y + h)} V${f(y)} A${f(r)},${f(r)} 0 0 1 ${f(x + w)},${f(y)} V${f(y + h)} Z`);
}
// Pointed (Gothic) arch: springing line at y, total height h below apex at y - w*0.8.
export function lancet(x, y, w, h) {
  const r = w * 0.9;
  return path(`M${f(x)},${f(y + h)} V${f(y)} A${f(r)},${f(r)} 0 0 1 ${f(x + w / 2)},${f(y - w * 0.78)} A${f(r)},${f(r)} 0 0 1 ${f(x + w)},${f(y)} V${f(y + h)} Z`);
}
// Quadratic sag/catenary-ish curve sampled as points.
export function sag(x1, y1, x2, y2, depth, n = 24) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t + depth * 4 * t * (1 - t)]);
  }
  return pts;
}

// ─── print object ──────────────────────────────────────────────
export class Print {
  constructor({ paper, seed = 1 }) {
    this.paper = paper;
    this.r = rng(seed * 7919 + 13);
    this.defs = [];
    this.body = [];
    this.n = 0;
    this.hasDissolve = false;
  }
  rand(a = 0, b = 1) {
    return a + (b - a) * this.r();
  }
  pick(arr) {
    return arr[Math.floor(this.r() * arr.length)];
  }
  seed() {
    return Math.floor(this.r() * 9000) + 1;
  }

  // Stamped-ink filter: rough displaced edges + speckled/mottled coverage.
  //  rough  – displacement scale (px) of the edge wobble
  //  edge   – base frequency of the edge wobble
  //  speck  – amount of fine paper showing through (0..1)
  //  mottle – amount of large-scale uneven density (0..1)
  filter({ rough = 6, edge = 0.03, speck = 0.35, mottle = 0.25, grain = 0.34, micro = 2.5 } = {}) {
    const id = `ink${this.n++}`;
    // pores: alpha = 1 + k * (noise - T) – solid ink where the (fine + coarse) noise is high,
    // crisp little holes of paper where it is low; coarse noise makes the inking uneven.
    const k = 9;
    const T = 0.31 + 0.22 * speck;
    this.defs.push(`
<filter id="${id}" filterUnits="userSpaceOnUse" x="-60" y="-60" width="${W + 120}" height="${H + 120}" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="${edge}" numOctaves="3" seed="${this.seed()}" result="wob"/>
  <feDisplacementMap in="SourceGraphic" in2="wob" scale="${rough}" xChannelSelector="R" yChannelSelector="G" result="shape0"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="1" seed="${this.seed()}" result="wob2"/>
  <feDisplacementMap in="shape0" in2="wob2" scale="${micro}" xChannelSelector="R" yChannelSelector="G" result="shape"/>
  <feTurbulence type="fractalNoise" baseFrequency="${grain}" numOctaves="2" seed="${this.seed()}" result="fine"/>
  <feColorMatrix in="fine" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="fineG"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="${this.seed()}" result="coarse"/>
  <feColorMatrix in="coarse" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="coarseG"/>
  <feComposite in="fineG" in2="coarseG" operator="arithmetic" k2="1" k3="${mottle * 1.6}" k4="${(-mottle * 0.8).toFixed(3)}" result="mix"/>
  <feColorMatrix in="mix" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${k} 0 0 0 ${(1 - k * T).toFixed(3)}" result="poreA"/>
  <feComposite in="shape" in2="poreA" operator="in"/>
</filter>`);
    return id;
  }

  // Register a linear gradient ("bokashi") and return its url(); stops = [[offset, color, opacity], ...]
  grad(stops, x1, y1, x2, y2) {
    const id = `gr${this.n++}`;
    this.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops
      .map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`)
      .join('')}</linearGradient>`);
    return `url(#${id})`;
  }
  rgrad(stops, cx, cy, r, sy = 1) {
    const id = `gr${this.n++}`;
    this.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}" gradientTransform="translate(${cx} ${cy}) scale(1 ${sy}) translate(${-cx} ${-cy})">${stops
      .map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`)
      .join('')}</radialGradient>`);
    return `url(#${id})`;
  }

  // Add one flat colour layer. Content uses fill="currentColor"-less shapes; colour is inherited.
  layer(color, content, opts = {}) {
    const id = this.filter(opts);
    const dx = opts.dx ?? this.rand(-3, 3);
    const dy = opts.dy ?? this.rand(-3, 3);
    const op = opts.opacity ?? 1;
    const inner = `<g transform="translate(${f(dx)} ${f(dy)})"><g filter="url(#${id})" fill="${color}" color="${color}" opacity="${op}">${this.xf(content, opts)}</g></g>`;
    this.body.push(opts.mask ? `<g mask="url(#${opts.mask === true ? 'dissolve' : opts.mask})">${inner}</g>` : inner);
    return this;
  }
  // Foliage / cloud stamp: heavy crinkly edge like a carved block.
  stamp(color, content, opts = {}) {
    return this.layer(color, content, { rough: 16, edge: 0.07, speck: 0.4, mottle: 0.35, grain: 0.42, micro: 4, ...opts });
  }
  // Soft wash (sky, water tint): big wobble, more mottled.
  wash(color, content, opts = {}) {
    return this.layer(color, content, { rough: 20, edge: 0.012, speck: 0.4, mottle: 0.4, grain: 0.38, micro: 3, ...opts });
  }
  // Graphite pencil lines – thin grainy strokes, low opacity.
  pencil(content, opts = {}) {
    const id = `pen${this.n++}`;
    this.defs.push(`
<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${this.seed()}" result="w"/>
  <feDisplacementMap in="SourceGraphic" in2="w" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="s"/>
  <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="${this.seed()}" result="g"/>
  <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4 0 0 0 -1.3" result="ga"/>
  <feComposite in="s" in2="ga" operator="in"/>
</filter>`);
    const inner = `<g filter="url(#${id})" fill="none" stroke="${opts.color ?? C.ink}" stroke-linecap="round" opacity="${opts.opacity ?? 0.42}">${this.xf(content, opts)}</g>`;
    this.body.push(opts.mask ? `<g mask="url(#${opts.mask === true ? 'dissolve' : opts.mask})">${inner}</g>` : inner);
    return this;
  }
  // Optional whole-scene transform (set P.transform = 'translate(..) scale(..)'); layers pass {fixed:true} to opt out.
  xf(content, opts) {
    return this.transform && !opts.fixed ? `<g transform="${this.transform}">${content}</g>` : content;
  }
  raw(svg) {
    this.body.push(svg);
    return this;
  }

  // Ragged dissolve mask: fully visible around (cx,cy) inside radii rx/ry,
  // breaking up into speckle towards the outside. Layers opt in via {mask:true}.
  dissolve({ cx, cy, rx, ry, id = 'dissolve', soft = 0.35, freq = 0.03 }) {
    this.defs.push(`
<radialGradient id="${id}G" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${rx}" gradientTransform="translate(${cx} ${cy}) scale(1 ${ry / rx}) translate(${-cx} ${-cy})">
  <stop offset="0" stop-color="#fff"/><stop offset="${1 - soft}" stop-color="#fff"/><stop offset="1" stop-color="#000"/>
</radialGradient>
<filter id="${id}F" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" seed="${this.seed()}" result="n"/>
  <feColorMatrix in="n" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="ng"/>
  <feComposite in="SourceGraphic" in2="ng" operator="arithmetic" k2="1" k3="0.9" k4="-0.45" result="m"/>
  <feComponentTransfer in="m">
    <feFuncR type="linear" slope="4" intercept="-1.5"/><feFuncG type="linear" slope="4" intercept="-1.5"/><feFuncB type="linear" slope="4" intercept="-1.5"/>
  </feComponentTransfer>
</filter>
<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="url(#${id}G)" filter="url(#${id}F)"/>
</mask>`);
    return this;
  }
  // Linear dissolve: visible past (x1,y1), gone before (x0,y0).
  dissolveLinear({ x0, y0, x1, y1, id = 'dissolve', freq = 0.03 }) {
    this.defs.push(`
<linearGradient id="${id}G" gradientUnits="userSpaceOnUse" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}">
  <stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/>
</linearGradient>
<filter id="${id}F" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" seed="${this.seed()}" result="n"/>
  <feColorMatrix in="n" type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="ng"/>
  <feComposite in="SourceGraphic" in2="ng" operator="arithmetic" k2="1" k3="0.9" k4="-0.45" result="m"/>
  <feComponentTransfer in="m">
    <feFuncR type="linear" slope="4" intercept="-1.5"/><feFuncG type="linear" slope="4" intercept="-1.5"/><feFuncB type="linear" slope="4" intercept="-1.5"/>
  </feComponentTransfer>
</filter>
<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="url(#${id}G)" filter="url(#${id}F)"/>
</mask>`);
    return this;
  }

  // Paper: flat colour + mean-neutral grain and soft cloudiness, so the average tone stays
  // exactly `paper` (the web page uses that colour around the image).
  paperLayer() {
    const [pr, pg, pb] = [1, 3, 5].map((i) => parseInt(this.paper.slice(i, i + 2), 16) / 255);
    const tone = (k) => `${k} 0 0 0 ${(pr - k / 2).toFixed(4)}  ${k} 0 0 0 ${(pg - k / 2).toFixed(4)}  ${(k * 1.1).toFixed(3)} 0 0 0 ${(pb - (k * 1.1) / 2).toFixed(4)}  0 0 0 0 1`;
    return `
<rect width="${W}" height="${H}" fill="${this.paper}"/>
<filter id="paperGrain" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="2" seed="${this.seed()}"/>
  <feColorMatrix type="matrix" values="${tone(0.4)}"/>
</filter>
<filter id="paperCloud" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.004" numOctaves="3" seed="${this.seed()}"/>
  <feColorMatrix type="matrix" values="${tone(0.4)}"/>
</filter>
<filter id="paperFeather"><feGaussianBlur stdDeviation="70"/></filter>
<mask id="paperEdge" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="180" y="180" width="${W - 360}" height="${H - 360}" fill="#fff" filter="url(#paperFeather)"/></mask>
<rect width="${W}" height="${H}" filter="url(#paperCloud)" opacity="0.2" mask="url(#paperEdge)"/>
<rect width="${W}" height="${H}" filter="url(#paperGrain)" opacity="0.14"/>`;
  }

  svg() {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${this.defs.join('\n')}</defs>
${this.paperLayer()}
${this.body.join('\n')}
</svg>`;
  }
}

// ─── higher-level motifs ───────────────────────────────────────

// Cluster of circles inside an ellipse – becomes a crinkly foliage/cloud stamp.
export function blobs(P, cx, cy, rx, ry, { n = 24, rmin = 0.24, rmax = 0.5, flatBottom = false } = {}) {
  let s = '';
  const base = Math.min(rx, ry);
  for (let i = 0; i < n; i++) {
    const a = P.rand(0, Math.PI * 2);
    const d = Math.sqrt(P.r());
    let x = cx + Math.cos(a) * d * rx * 0.8;
    let y = cy + Math.sin(a) * d * ry * 0.8;
    const r = base * P.rand(rmin, rmax) * (1.15 - d * 0.4);
    if (flatBottom && y + r > cy + ry * 0.5) y = cy + ry * 0.5 - r;
    s += circle(x, y, r);
  }
  return s;
}

// A loose tree: clustered crown above a short trunk (trunk drawn separately if wanted).
export function crown(P, cx, cy, w, h, n = 22) {
  let s = '';
  const lobes = Math.max(3, Math.round(w / 60));
  for (let i = 0; i < lobes; i++) {
    const lx = cx + P.rand(-0.38, 0.38) * w;
    const ly = cy + P.rand(-0.3, 0.3) * h;
    s += blobs(P, lx, ly, w * P.rand(0.22, 0.34), h * P.rand(0.25, 0.38), { n: Math.round(n / lobes) + 10 });
  }
  return s;
}

// Horizontal water strokes (rounded dashes). Density grows towards the bottom.
export function waterLines(P, x0, x1, y0, y1, { gap = 22, minLen = 30, maxLen = 220, th = 5, fill = 0.55 } = {}) {
  let s = '';
  for (let y = y0; y < y1; y += gap * P.rand(0.7, 1.3)) {
    const t = (y - y0) / (y1 - y0);
    let x = x0 + P.rand(-maxLen, 0);
    while (x < x1) {
      const len = P.rand(minLen, maxLen) * (0.6 + t * 0.6);
      if (P.r() < fill * (0.6 + t * 0.6)) {
        const h = th * (0.6 + t * 0.8);
        s += rect(x, y, len, h, `rx="${f(h / 2)}"`);
      }
      x += len + P.rand(14, 80);
    }
  }
  return s;
}

// Mountain ridge polygon from a list of [x,y] crest points down to yBase.
export function ridge(pts, yBase) {
  return poly([[pts[0][0], yBase], ...pts, [pts[pts.length - 1][0], yBase]]);
}
// Jagged crest generator between two x positions.
export function jagged(P, x0, x1, yFn, step = 30, amp = 20) {
  const pts = [];
  for (let x = x0; x <= x1 + 0.1; x += step * P.rand(0.6, 1.4)) pts.push([x, yFn(x) + P.rand(-amp, amp)]);
  pts.push([x1, yFn(x1)]);
  return pts;
}

// Small birds as two curved strokes (filled thin crescents).
export function birds(list) {
  return list
    .map(([x, y, s = 1]) =>
      path(`M${x - 14 * s},${y - 4 * s} Q${x - 6 * s},${y - 9 * s} ${x},${y} Q${x + 7 * s},${y - 10 * s} ${x + 16 * s},${y - 6 * s} Q${x + 7 * s},${y - 6 * s} ${x},${y + 2.5 * s} Q${x - 6 * s},${y - 5 * s} ${x - 14 * s},${y - 4 * s}Z`),
    )
    .join('');
}

// Parallel hatching inside a box, at angle (deg).
export function hatch(P, x, y, w, h, { angle = 60, gap = 9, w0 = 1.1, jitter = 0.25, clip } = {}) {
  const a = (angle * Math.PI) / 180, dx = Math.cos(a), dy = Math.sin(a);
  const L = Math.hypot(w, h);
  let s = '';
  for (let k = -L; k < L; k += gap) {
    const cx = x + w / 2 + -dy * k, cy = y + h / 2 + dx * k;
    const l = (L / 2) * P.rand(0.4, 1);
    const off = P.rand(-jitter, jitter) * l;
    s += `<line x1="${f(cx - dx * l + dx * off)}" y1="${f(cy - dy * l + dy * off)}" x2="${f(cx + dx * l * P.rand(0.7, 1))}" y2="${f(cy + dy * l * P.rand(0.7, 1))}" stroke-width="${w0}"/>`;
  }
  const cid = `hc${Math.floor(P.r() * 1e9)}`;
  return `<clipPath id="${cid}">${clip ?? rect(x, y, w, h)}</clipPath><g clip-path="url(#${cid})">${s}</g>`;
}

// Long faint construction lines (graphite) – pass list of [x1,y1,x2,y2].
export function construction(list, w = 1) {
  return list.map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke-width="${w}"/>`).join('');
}

// Disk (sun / moon)
export const disk = (cx, cy, r) => circle(cx, cy, r);
