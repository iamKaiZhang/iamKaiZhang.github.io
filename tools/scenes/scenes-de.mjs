// Scenes in German-speaking places.
import { C, rect, circle, poly, path, bar, arch, lancet, smooth, sag, blobs, crown, waterLines, ridge, jagged, birds, hatch, construction } from './lib.mjs';

const ring = (cx, cy, r, w) => circle(cx, cy, r, `fill="none" stroke="currentColor" stroke-width="${w}"`);
const stroke2 = (d, w) => path(d, `fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round"`);

// ─── 1. Brandenburger Tor ──────────────────────────────────────
// Horse forepart in profile facing left, rearing (local coords, origin at chest base).
const HORSE = [[58, 0], [60, -40], [50, -62], [42, -84], [32, -102], [30, -116], [24, -104], [16, -101], [2, -84], [-6, -74], [-2, -67], [12, -70], [22, -64], [20, -46], [12, -38], [-6, -44], [-22, -34], [-20, -18], [-12, -19], [-10, -28], [4, -26], [14, -12], [18, 0]];
const horse = (x, y, s, dir) => poly(HORSE.map(([hx, hy]) => [x + hx * s * dir, y + hy * s]));

function brandenburgerTor(P) {
  const cx = 1000, ground = 1640, colTop = 1150;
  const colW = 64, passes = [96, 96, 140, 96, 96];
  const x0 = cx - (6 * colW + passes.reduce((a, b) => a + b)) / 2;
  const x1 = 2 * cx - x0;
  const cols = [];
  let x = x0;
  for (let i = 0; i < 6; i++) {
    cols.push(x);
    x += colW + (passes[i] ?? 0);
  }

  P.dissolve({ cx: 1150, cy: 1400, rx: 760, ry: 980, soft: 0.42, freq: 0.02 });
  // sky bokashi + sun
  P.wash(P.grad([[0, C.sky, 0], [0.35, C.sky, 0.9], [1, C.sky, 0.5]], 0, 640, 0, 1640), rect(380, 640, 1100, 1000), { mask: true });
  P.layer(C.verm, circle(1262, 800, 84), { speck: 0.25 });
  // Tiergarten trees behind the gate
  P.stamp(C.mossLt, crown(P, 600, 1450, 260, 300) + crown(P, 1420, 1250, 200, 260), { mask: true });

  // gate body (sandstone)
  let body = '';
  body += rect(x0 - 28, 1046, x1 - x0 + 56, 24); // cornice
  body += rect(x0 - 12, 1070, x1 - x0 + 24, 80); // frieze + architrave
  body += rect(x0 + 8, 930, x1 - x0 - 16, 118); // attic
  body += rect(cx - 230, 906, 460, 26) + rect(cx - 160, 882, 320, 26); // stepped top
  for (const c of cols) body += rect(c, colTop, colW, ground - colTop) + rect(c - 8, colTop - 14, colW + 16, 16) + rect(c - 9, ground - 16, colW + 18, 20);
  P.layer('#e3cba2', body, { speck: 0.3 });

  // deep passages – indigo bokashi, darkest under the lintel
  const passG = P.grad([[0, C.indigo, 1], [0.55, C.indigo, 0.75], [1, C.indigo, 0.25]], 0, colTop, 0, ground);
  P.layer(C.indigo, `<g fill="${passG}">${cols.slice(0, 5).map((c, i) => rect(c + colW, colTop, passes[i], ground - colTop)).join('')}</g>`, { speck: 0.3 });
  // shadows: column right halves, under cornice, attic panels
  let sh = '';
  for (const c of cols) sh += rect(c + colW * 0.58, colTop, colW * 0.42, ground - colTop - 16) + rect(c + colW * 0.58, colTop - 14, colW * 0.42 + 8, 16);
  sh += rect(x0 - 12, 1070, x1 - x0 + 24, 12) + rect(x0 + 8, 1034, x1 - x0 - 16, 12);
  sh += rect(cx - 160, 952, 320, 62) + rect(x0 + 44, 966, 210, 48) + rect(x1 - 254, 966, 210, 48);
  P.layer(C.ochre, sh, { speck: 0.4, opacity: 0.8 });
  // ink: cornice lines, triglyph rhythm, column fluting hints
  let ink = rect(x0 - 28, 1066, x1 - x0 + 56, 5) + rect(x0 + 8, 926, x1 - x0 - 16, 5) + rect(x0 - 12, 1146, x1 - x0 + 24, 4);
  for (let t = x0 + 10; t < x1 - 14; t += 38) ink += rect(t, 1090, 10, 34);
  P.layer(C.ink, ink, { speck: 0.35, opacity: 0.7, micro: 1.5 });
  let flute = '';
  for (const c of cols) for (const k of [0.2, 0.4]) flute += rect(c + colW * k, colTop + 16, 3, ground - colTop - 48);
  P.layer(C.ochre, flute, { speck: 0.5, opacity: 0.6, micro: 1.2 });

  // Quadriga (patinated copper): four rearing horses, chariot, Victoria with staff
  const qy = 884, s = 1.3;
  P.layer('#3f5747', horse(cx - 48, qy - 8, s * 0.95, -1) + horse(cx + 48, qy - 8, s * 0.95, 1), { speck: 0.25, rough: 3, micro: 1.4 });
  let q = rect(cx - 140, qy - 12, 280, 12);
  q += horse(cx - 112, qy - 10, s, -1) + horse(cx + 112, qy - 10, s, 1);
  q += poly([[cx - 34, qy - 12], [cx + 34, qy - 12], [cx + 28, qy - 62], [cx - 28, qy - 62]]); // chariot
  q += poly([[cx - 17, qy - 60], [cx + 17, qy - 60], [cx + 13, qy - 166], [cx - 13, qy - 166]]); // Victoria
  q += circle(cx, qy - 178, 12);
  q += path(`M${cx - 12},${qy - 150} q-46,-34 -54,-90 q28,26 58,62 z`) + path(`M${cx + 12},${qy - 150} q46,-34 54,-90 q-28,26 -58,62 z`); // wings
  q += bar(cx + 24, qy - 40, cx + 32, qy - 276, 6); // staff
  q += ring(cx + 32, qy - 292, 17, 5) + bar(cx + 32, qy - 314, cx + 32, qy - 272, 4) + bar(cx + 18, qy - 294, cx + 46, qy - 294, 4);
  q += path(`M${cx + 12},${qy - 318} q20,-18 40,0 q-20,-5 -20,8 z`); // eagle
  P.layer('#55705a', q, { speck: 0.25, rough: 3, micro: 1.6 });

  // ground: long column shadows on the square
  P.layer(C.sand, rect(380, ground + 4, 1100, 300), { mask: true, opacity: 0.85 });
  P.layer(C.indigo, cols.map((c) => poly([[c + 4, ground + 4], [c + colW + 4, ground + 4], [c + colW + 150, ground + 170], [c + 90, ground + 170]])).join(''), { mask: true, opacity: 0.22, speck: 0.5 });
  P.stamp(C.moss, crown(P, 1440, 1440, 160, 340) + crown(P, 470, 1560, 150, 160), { mask: true });
  P.layer(C.ink, birds([[690, 800, 1.8], [770, 760, 1.3], [640, 735, 1.1]]), { rough: 2, speck: 0.15, micro: 1 });
  P.stamp(C.moss, blobs(P, 300, 470, 50, 44, { n: 10 }) + blobs(P, 420, 600, 26, 24, { n: 6 }), { opacity: 0.85 });

  // graphite construction
  P.pencil(
    construction([[380, ground, 1440, ground], [400, 1046, 1440, 1046], [cx, 560, cx, 1760], [x0, 900, x0, 1800], [440, 1820, 1440, 1740], [560, 1680, 860, 1920], [400, 930, 760, 930]]) +
      hatch(P, 390, 1600, 300, 280, { angle: 62, gap: 10 }) + hatch(P, 1180, 1700, 260, 220, { angle: 118, gap: 12 }),
    { opacity: 0.35 },
  );
}

// ─── 4. Kölner Dom am Rhein ────────────────────────────────────
function koelnerDom(P) {
  const base = 1360;
  P.transform = 'translate(1250 640) scale(1.2) translate(-1250 -640)';
  P.dissolve({ cx: 1040, cy: 1400, rx: 700, ry: 900, soft: 0.5, freq: 0.02 });
  P.wash(P.rgrad([[0, C.ochre, 0.75], [0.6, C.ochre, 0.35], [1, C.ochre, 0]], 1180, 1060, 620, 0.8), rect(300, 400, 1300, 1200), { fixed: true });
  P.layer(C.verm, circle(1330, 1010, 105), { speck: 0.3 });

  // cathedral silhouette
  let d = '';
  const tower = (tx, w) => {
    let s = rect(tx, 1010, w, base - 1010);
    s += rect(tx + w * 0.12, 860, w * 0.76, 160); // octagon stage
    // spire with crockets
    const top = 660, sx0 = tx + w * 0.16, sx1 = tx + w * 0.84, mid = tx + w / 2;
    let pts = [[sx0, 862]];
    for (let k = 1; k < 9; k++) {
      const t = k / 9, y = 862 - (862 - top) * t, xl = sx0 + (mid - 4 - sx0) * t;
      pts.push([xl, y + 6], [xl - 9, y - 4], [xl + 2, y - 2]);
    }
    pts.push([mid - 4, top], [mid - 3, top - 22], [mid - 14, top - 30], [mid - 3, top - 34], [mid, top - 52], [mid + 3, top - 34], [mid + 14, top - 30], [mid + 3, top - 22], [mid + 4, top]);
    for (let k = 8; k >= 1; k--) {
      const t = k / 9, y = 862 - (862 - top) * t, xr = sx1 - (sx1 - mid - 4) * t;
      pts.push([xr - 2, y - 2], [xr + 9, y - 4], [xr, y + 6]);
    }
    pts.push([sx1, 862]);
    s += poly(pts);
    // pinnacles around the octagon and lower stages
    for (const [px, py, ph] of [[tx + 4, 1010, 90], [tx + w - 14, 1010, 90], [tx + w * 0.12, 860, 70], [tx + w * 0.88 - 10, 860, 70], [tx + 4, 1190, 60], [tx + w - 14, 1190, 60]])
      s += poly([[px, py + 2], [px + 10, py + 2], [px + 5, py - ph]]);
    return s;
  };
  d += tower(905, 130) + tower(1085, 130);
  d += rect(1035, 1060, 50, base - 1060) + poly([[1035, 1062], [1085, 1062], [1060, 1010]]); // west gable between towers
  d += rect(640, 1150, 270, base - 1150); // nave/choir
  d += poly([[620, 1152], [905, 1152], [905, 1080], [700, 1080]]); // roof
  d += poly([[760, 1082], [790, 1082], [775, 990]]); // ridge turret
  for (let px = 600; px < 905; px += 34) d += poly([[px, 1240], [px + 12, 1240], [px + 6, 1150 - (px % 3) * 8]]) + rect(px + 2, 1240, 8, base - 1240); // flying-buttress pinnacles
  d += rect(560, base - 70, 680, 70); // terrace
  P.layer(C.ink, d, { speck: 0.12, opacity: 0.94, rough: 4, micro: 2.5 });

  // tracery / windows in sky colour
  let win = '';
  for (const tx of [905, 1085]) {
    for (const wx of [tx + 22, tx + 74]) win += lancet(wx, 1120, 34, 170) + lancet(wx + 4, 1270, 26, 60);
    win += lancet(tx + 40, 900, 22, 100) + lancet(tx + 68, 900, 22, 100);
    for (let k = 1; k < 7; k++) win += rect(tx + 46, 860 - k * 28, 38 - k * 5, 5);
  }
  win += lancet(1046, 1110, 28, 180);
  for (let wx = 660; wx < 890; wx += 46) win += lancet(wx, 1190, 22, 110);
  P.layer(C.sky, win, { speck: 0.5, rough: 3, micro: 2, opacity: 0.85 });

  // Hohenzollern bridge: three bowstring arches
  let br = '';
  const deck = 1450;
  const spans = [[600, 810], [810, 1020], [1020, 1230]];
  br += rect(560, deck, 720, 18);
  for (const [a, b] of spans) {
    const outer = sag(a, deck, b, deck, -150, 30), inner = sag(a + 16, deck, b - 16, deck, -122, 30);
    br += poly([...outer, ...inner.reverse()]);
    for (let k = 1; k < 10; k++) {
      const t = k / 10, xx = a + (b - a) * t, yy = deck - 150 * 4 * t * (1 - t);
      br += rect(xx - 2, yy, 4, deck - yy);
      if (k < 9) br += bar(xx, yy + 10, a + (b - a) * (t + 0.1), deck, 3);
    }
  }
  P.layer(C.indigo, br, { mask: true, speck: 0.35, rough: 4, micro: 2.5 });
  P.layer(C.verm, rect(660, deck - 32, 330, 28, 'rx="8"'), { mask: true }); // regional train
  P.layer(C.stone, [600, 810, 1020, 1230].map((px) => rect(px - 22, deck + 16, 44, 64)).join(''), { mask: true });

  // river, reflections, boat
  P.wash(C.sky, rect(380, 1480, 1100, 520), { mask: true });
  let refl = '';
  for (let y = 1500; y < 1760; y += P.rand(14, 26)) {
    const w = 120 * (1 - (y - 1500) / 300);
    refl += rect(970 + P.rand(-w, w * 0.2), y, P.rand(30, 90), 6) + rect(1150 + P.rand(-w * 0.2, w * 0.2), y, P.rand(20, 60), 6);
  }
  P.layer(C.ink, refl, { opacity: 0.55, speck: 0.5 });
  P.layer(C.indigo, waterLines(P, 380, 1600, 1500, 1920, { gap: 24, th: 5 }), { mask: true });
  P.layer(C.white, rect(1180, 1580, 220, 26, 'rx="6"') + rect(1210, 1554, 150, 28), { speck: 0.15 });
  P.layer(C.ink, rect(1170, 1604, 240, 12, 'rx="5"') + [0, 1, 2, 3, 4, 5].map((k) => rect(1220 + k * 22, 1562, 12, 10)).join(''), { speck: 0.2 });

  P.layer(C.ink, birds([[740, 860, 1.4], [800, 830, 1]]), { rough: 2, speck: 0.2 });
  P.pencil(construction([[380, deck, 1440, deck], [380, base, 1440, base - 10], [970, 560, 970, 1500], [1150, 560, 1150, 1500], [440, 1500, 1440, 1460]]) + hatch(P, 380, 1300, 260, 380, { angle: 70 }), { opacity: 0.32 });
}

// ─── 8. Riesenrad im Prater ────────────────────────────────────
function riesenrad(P) {
  const hx = 1130, hy = 1170, R = 470;
  P.dissolve({ cx: 1150, cy: 1300, rx: 700, ry: 760, soft: 0.45 });
  P.layer(C.ochre, circle(hx, hy, 300), { opacity: 0.45, speck: 0.3, rough: 10 });
  P.wash(C.sky, path(smooth([[560, 1180], [700, 900], [1000, 760], [1400, 700], [1500, 1600], [800, 1660]], true)), { mask: true, opacity: 0.6 });

  // supports (lattice A-frames)
  let sup = '';
  for (const [fx, fy] of [[860, 1800], [1420, 1800]]) {
    sup += bar(hx, hy, fx, fy, 16) + bar(hx, hy, fx + (fx < hx ? 70 : -70), fy, 10);
    for (let k = 1; k < 12; k++) {
      const t = k / 12;
      const ax = hx + (fx - hx) * t, ay = hy + (fy - hy) * t, bx = hx + (fx + (fx < hx ? 70 : -70) - hx) * t;
      sup += bar(ax, ay, bx, ay, 4);
      if (k < 11) sup += bar(ax, ay, hx + (fx + (fx < hx ? 70 : -70) - hx) * (t + 1 / 12), ay + (fy - hy) / 12, 3);
    }
  }
  sup += bar(860, 1800, 1420, 1800, 10) + bar(960, 1620, 1320, 1620, 6);
  P.layer(C.ink, sup, { speck: 0.3, rough: 3, micro: 2 });

  // wheel
  let wh = ring(hx, hy, R, 7) + ring(hx, hy, R - 30, 5) + ring(hx, hy, 40, 12) + circle(hx, hy, 18);
  for (let k = 0; k < 120; k++) {
    const a = (k / 120) * Math.PI * 2, b = ((k + 1) / 120) * Math.PI * 2;
    wh += bar(hx + Math.cos(a) * R, hy + Math.sin(a) * R, hx + Math.cos(b) * (R - 30), hy + Math.sin(b) * (R - 30), 2.5);
  }
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * Math.PI * 2;
    wh += bar(hx + Math.cos(a) * 40, hy + Math.sin(a) * 40, hx + Math.cos(a + 0.05) * (R - 30), hy + Math.sin(a + 0.05) * (R - 30), 2.2);
  }
  P.layer(C.ink, wh, { speck: 0.32, rough: 3, micro: 1.6, opacity: 0.92 });

  // gondolas
  let gon = '', gwin = '', groof = '';
  for (let k = 0; k < 15; k++) {
    const a = (k / 15) * Math.PI * 2 + 0.12;
    const px = hx + Math.cos(a) * R, py = hy + Math.sin(a) * R;
    if (px > 1500) continue;
    gon += rect(px - 34, py + 8, 68, 46, 'rx="3"');
    groof += rect(px - 40, py + 2, 80, 9, 'rx="2"') + rect(px - 3, py - 4, 6, 10);
    gwin += rect(px - 26, py + 16, 14, 16) + rect(px - 7, py + 16, 14, 16) + rect(px + 12, py + 16, 14, 16);
  }
  P.layer(C.verm, gon, { speck: 0.25, rough: 3, micro: 2 });
  P.layer(C.ink, groof, { speck: 0.2, rough: 2, micro: 1.5 });
  P.layer(C.white, gwin, { speck: 0.3, rough: 2, micro: 1.5, opacity: 0.9 });

  // Prater trees + booths
  P.stamp(C.mossLt, crown(P, 640, 1660, 260, 200) + crown(P, 1300, 1700, 340, 220), { mask: true });
  P.layer(C.ochre, poly([[930, 1700], [1010, 1640], [1090, 1700]]) + rect(940, 1700, 140, 90), { opacity: 0.9 });
  P.layer(C.verm, [0, 1, 2].map((k) => poly([[950 + k * 46, 1700], [970 + k * 46, 1660], [990 + k * 46, 1700]])).join(''), { opacity: 0.8 });
  P.stamp(C.moss, crown(P, 780, 1760, 300, 220) + crown(P, 1200, 1800, 360, 240) + crown(P, 1440, 1720, 200, 260), { mask: true });
  P.wash(C.ochre, rect(400, 1840, 1100, 100), { mask: true, opacity: 0.5 });

  P.layer(C.ink, birds([[560, 900, 1.5], [620, 870, 1.1], [520, 840, 0.9]]), { rough: 2, speck: 0.2 });
  P.pencil(ring(hx, hy, R + 60, 1) + ring(hx, hy, R - 120, 1) + construction([[hx, 560, hx, 1920], [440, hy, 1440, hy], [560, 1800, 1440, 1800]]) + hatch(P, 420, 1500, 300, 300, { angle: 64 }), { opacity: 0.3 });
}

// ─── 2. Fernsehturm ────────────────────────────────────────────
function fernsehturm(P) {
  const tx = 1080, sy = 1010, sr = 80;
  P.dissolve({ cx: 1120, cy: 1450, rx: 720, ry: 900, soft: 0.45, freq: 0.02 });
  P.layer(C.ochre, circle(tx + 40, sy + 30, 230), { speck: 0.3, rough: 10, opacity: 0.55 });
  P.stamp(C.sky, blobs(P, 1330, 860, 120, 40, { n: 14 }) + blobs(P, 760, 1180, 150, 36, { n: 14 }), { opacity: 0.9 });

  // shaft, upper shaft, base pavilion
  let tw = poly([[tx - 60, 1800], [tx + 60, 1800], [tx + 20, sy + sr - 6], [tx - 20, sy + sr - 6]]);
  tw += rect(tx - 11, sy - sr - 90, 22, 100) + rect(tx - 20, sy - sr - 16, 40, 20);
  P.layer('#ddd3c0', tw, { speck: 0.3, rough: 3, micro: 1.5 });
  P.layer(C.stone, poly([[tx + 8, 1800], [tx + 60, 1800], [tx + 20, sy + sr - 6], [tx + 5, sy + sr - 6]]), { speck: 0.4, rough: 3, micro: 1.5, opacity: 0.85 });
  // sphere
  P.layer(C.indigo, circle(tx, sy, sr), { speck: 0.25, rough: 2, micro: 1.2 });
  let facets = '';
  for (let k = -3; k <= 3; k++) facets += path(`M${tx + k * 22},${sy - Math.sqrt(sr * sr - (k * 22) ** 2)} Q${tx + k * 30},${sy} ${tx + k * 22},${sy + Math.sqrt(sr * sr - (k * 22) ** 2)}`, 'fill="none" stroke="currentColor" stroke-width="2.5"');
  for (const dy of [-48, -22, 36, 60]) facets += rect(tx - Math.sqrt(sr * sr - dy * dy), sy + dy, 2 * Math.sqrt(sr * sr - dy * dy), 2);
  P.layer(C.sky, facets, { speck: 0.4, rough: 1.5, micro: 1, opacity: 0.6 });
  P.layer(C.ink, rect(tx - sr + 2, sy + 2, 2 * sr - 4, 16) + rect(tx - sr + 8, sy - 8, 2 * sr - 16, 5), { speck: 0.2, rough: 2, micro: 1 });
  // antenna, red and white bands
  let ant = '';
  for (let k = 0; k < 5; k++) ant += rect(tx - 7 + k * 0.5, sy - sr - 110 - k * 48, 14 - k, 24);
  P.layer(C.white, rect(tx - 7, sy - sr - 350, 14, 260), { speck: 0.2, rough: 2, micro: 1 });
  P.layer(C.verm, ant + rect(tx - 2, sy - sr - 380, 4, 34), { speck: 0.2, rough: 2, micro: 1 });

  // city: back row, Rotes Rathaus, Marienkirche, front trees
  let back = '';
  for (let x = 440; x < 1440; x += P.rand(50, 110)) back += rect(x, 1560 - P.rand(0, 90), P.rand(60, 120), 400);
  P.layer(C.sky, back, { mask: true, speck: 0.4 });
  // Rotes Rathaus
  let rh = rect(520, 1580, 360, 340) + rect(660, 1380, 80, 200) + poly([[652, 1384], [748, 1384], [700, 1330]]) + rect(698, 1300, 4, 34);
  for (const cxx of [520, 860]) rh += rect(cxx - 6, 1560, 30, 40);
  P.layer(C.verm, rh, { mask: true, speck: 0.3 });
  let rw = '';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) rw += rect(536 + c * 28, 1610 + r * 60, 12, 30, 'rx="5"');
  rw += rect(676, 1410, 16, 40, 'rx="7"') + rect(708, 1410, 16, 40, 'rx="7"') + circle(700, 1490, 16);
  P.layer(C.ink, rw, { mask: true, speck: 0.3, opacity: 0.8 });
  // Marienkirche
  P.layer(C.stone, rect(1190, 1600, 260, 320) + rect(1200, 1470, 80, 140), { mask: true, speck: 0.3 });
  P.layer('#5e7a62', poly([[1196, 1474], [1284, 1474], [1252, 1420], [1244, 1300], [1236, 1420]]) + poly([[1186, 1602], [1450, 1602], [1450, 1556], [1300, 1556]]), { mask: true, speck: 0.25 });
  P.stamp(C.moss, crown(P, 900, 1820, 320, 200) + crown(P, 1320, 1840, 300, 200) + crown(P, 560, 1860, 240, 160), { mask: true });

  P.layer(C.ink, birds([[820, 820, 1.5], [870, 790, 1.1]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[tx, 480, tx, 1900], [420, sy, 1440, sy], [400, 1580, 1440, 1560], [tx - 260, 1900, tx, 500], [tx + 300, 1900, tx, 500]]) + `<circle cx="${tx}" cy="${sy}" r="${sr + 40}" />` + hatch(P, 400, 1500, 280, 380, { angle: 66 }), { opacity: 0.3 });
}

// ─── 3. Elbphilharmonie & Speicherstadt ────────────────────────
function elbphilharmonie(P) {
  P.dissolve({ cx: 1150, cy: 1380, rx: 760, ry: 760, soft: 0.45, freq: 0.02 });
  P.wash(P.grad([[0, C.sand, 0], [0.4, C.sand, 0.9], [1, C.ochre, 0.3]], 0, 600, 0, 1300), rect(380, 600, 1100, 700), { mask: true, speck: 0.3 });

  // roof wave crests (left → right)
  const crest = [[640, 1010], [780, 880], [880, 960], [1030, 820], [1150, 930], [1330, 740], [1440, 820], [1480, 840]];
  let roof = `M${crest[0][0]},1190 L${crest[0][0]},${crest[0][1]}`;
  for (let i = 1; i < crest.length; i++) {
    const [px, py] = crest[i - 1], [qx, qy] = crest[i];
    // concave sweep up to a sharp peak, then concave fall
    roof += qy < py ? ` Q${qx - (qx - px) * 0.2},${py} ${qx},${qy}` : ` Q${px + (qx - px) * 0.25},${qy} ${qx},${qy}`;
  }
  roof += ' L1480,1190 Z';
  P.layer(P.grad([[0, '#b9cdd2', 1], [1, '#dfe6e2', 1]], 0, 740, 0, 1190), path(roof), { speck: 0.2, rough: 3 });
  P.layer(C.white, `<path d="${roof}" fill="none" stroke="currentColor" stroke-width="9"/>`, { speck: 0.15, rough: 2, micro: 1 });
  // glass pattern: floor lines + curved panes
  let g = '';
  for (let y = 900; y < 1190; y += 30) g += rect(600, y, 900, 2.5);
  for (let k = 0; k < 170; k++) {
    const x = P.rand(650, 1440), y = P.rand(840, 1180);
    g += path(`M${x},${y} q10,8 20,0`, 'fill="none" stroke="currentColor" stroke-width="3"');
  }
  P.layer(C.indigo, `<clipPath id="glass"><path d="${roof}"/></clipPath><g clip-path="url(#glass)">${g}</g>`, { speck: 0.4, opacity: 0.7, rough: 2, micro: 1 });
  P.layer(C.indigo, [700, 900, 1080, 1250].map((x) => path(`M${x},1080 v-80 q18,-30 36,0 v80 z`)).join(''), { speck: 0.4, opacity: 0.7 });
  P.layer(C.ink, rect(630, 1180, 860, 34) + [680, 760, 840, 920, 1000, 1080, 1160, 1240, 1320, 1400].map((x) => rect(x, 1180, 10, 34)).join(''), { speck: 0.3, opacity: 0.9 });
  // brick Kaispeicher
  const brick = '#9b4a33';
  P.layer(brick, poly([[620, 1214], [1480, 1214], [1480, 1520], [640, 1520]]), { speck: 0.3 });
  let bw = '';
  for (let r = 0; r < 7; r++) for (let x = 660; x < 1440; x += 22) bw += rect(x, 1232 + r * 40, 9, 20);
  P.layer(C.ink, bw, { speck: 0.4, opacity: 0.55, rough: 2, micro: 1.2 });
  P.layer(C.ink, poly([[620, 1214], [700, 1214], [710, 1520], [640, 1520]]), { speck: 0.4, opacity: 0.3 });

  // Elbe between the concert hall and the Speicherstadt
  P.wash(C.sky, rect(380, 1520, 1100, 300), { mask: true });
  let refl = '';
  for (let y = 1534; y < 1660; y += P.rand(12, 20)) refl += rect(P.rand(660, 1300), y, P.rand(40, 160), 7);
  P.layer(brick, refl, { mask: true, opacity: 0.55, speck: 0.5 });
  P.layer(C.indigo, waterLines(P, 380, 1500, 1532, 1780, { gap: 20, th: 4 }), { mask: true });
  P.layer(C.ink, path('M600,1640 L840,1640 L824,1662 L616,1662 Z') + rect(760, 1610, 46, 32), { mask: true, speck: 0.2 });
  P.layer(C.verm, rect(630, 1624, 110, 16), { mask: true, speck: 0.2 });

  // Speicherstadt: brick warehouses with stepped gables and copper turrets, foreground
  const ws = [[700, 1790, 130, 70], [830, 1760, 150, 96], [980, 1780, 130, 80], [1110, 1740, 170, 104], [1280, 1770, 180, 90]];
  let sp = '', cu = '', sw = '';
  for (const [x, y, w, g] of ws) {
    sp += rect(x, y, w, 1940 - y);
    const steps = 4;
    for (let k = 0; k < steps; k++) sp += rect(x + (w / 2) * (k / steps) * 0.9, y - (g * (k + 1)) / steps, w - w * (k / steps) * 0.9, g / steps + 1);
    cu += poly([[x + w / 2 - 14, y - g + 2], [x + w / 2 + 14, y - g + 2], [x + w / 2, y - g - 60]]) + rect(x + w / 2 - 16, y - g, 32, 14);
    for (let r = 0; y + 30 + r * 54 < 1920; r++) for (let c = 0; c < Math.floor(w / 34); c++) sw += rect(x + 16 + c * 34, y + 30 + r * 54, 14, 30, 'rx="7"');
  }
  P.layer('#7d4535', sp, { mask: true, speck: 0.3 });
  P.layer('#5e7a62', cu, { mask: true, speck: 0.25 });
  P.layer(C.ink, sw, { mask: true, opacity: 0.55, speck: 0.35, rough: 2, micro: 1 });
  P.layer(C.ink, ws.map(([x, y, w]) => rect(x + w - 10, y, 10, 1940 - y)).join(''), { mask: true, opacity: 0.25 });

  P.layer(C.ink, birds([[760, 700, 1.6], [830, 670, 1.2], [1040, 640, 1]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[400, 1214, 1440, 1214], [400, 1520, 1440, 1520], [1330, 560, 1330, 1600], [480, 1600, 1440, 1560]]) + hatch(P, 400, 1540, 300, 300, { angle: 20, gap: 12 }), { opacity: 0.3 });
}

// ─── 5. Schloss Neuschwanstein ─────────────────────────────────
function neuschwanstein(P) {
  P.dissolve({ cx: 1120, cy: 1350, rx: 720, ry: 860, soft: 0.45, freq: 0.02 });
  // mountains behind
  const mtn = [[700, 1400], [820, 1240], [900, 1170], [980, 1200], [1120, 1000], [1200, 1060], [1260, 1030], [1350, 900], [1440, 980], [1500, 1010], [1500, 1400]];
  P.layer(P.grad([[0, C.indigo, 0.7], [1, C.indigo, 0.08]], 0, 900, 0, 1400), poly(mtn), { mask: true, rough: 8 });
  P.layer(C.white, poly([[1300, 958], [1350, 900], [1400, 950], [1376, 948], [1360, 976], [1340, 952], [1318, 972]]) + poly([[1080, 1050], [1120, 1000], [1162, 1032], [1140, 1034], [1126, 1060], [1108, 1040], [1094, 1066]]), { rough: 4, opacity: 0.9 });
  const back = jagged(P, 420, 1460, (x) => 1250 - (x - 420) * 0.12, 40, 12);
  P.layer(C.sky, ridge(back, 1600), { mask: true });
  // lake
  P.layer(C.indigo, waterLines(P, 420, 900, 1420, 1500, { gap: 14, th: 4 }), { mask: true, opacity: 0.6 });

  // crag
  const crag = [[640, 1330], [700, 1280], [760, 1290], [820, 1250], [1290, 1250], [1330, 1290], [1400, 1300], [1460, 1340], [1460, 1520], [600, 1520]];
  P.layer(P.grad([[0, C.stone, 1], [1, C.stone, 0.4]], 0, 1250, 0, 1520), poly(crag), { mask: true, speck: 0.35 });
  let cracks = '';
  for (let k = 0; k < 26; k++) {
    const x = P.rand(700, 1440), y = P.rand(1270, 1420);
    cracks += path(`M${x},${y} l${P.rand(-20, 20)},${P.rand(30, 70)} l${P.rand(-14, 14)},${P.rand(20, 50)}`, 'fill="none" stroke="currentColor" stroke-width="3"');
  }
  P.layer(C.ink, cracks, { mask: true, opacity: 0.45, speck: 0.4 });

  // castle walls
  const wall = C.white;
  let w = '';
  w += rect(1060, 880, 200, 380); // Palas
  w += rect(1010, 740, 50, 520); // slender stair tower
  w += rect(1250, 820, 34, 440); // Palas corner turret
  w += rect(860, 860, 84, 400); // square tower
  w += rect(760, 990, 300, 270); // connecting wing
  w += rect(944, 940, 70, 320);
  P.layer(wall, w, { speck: 0.15, rough: 3 });
  // gatehouse (red-ochre brick)
  P.layer(C.ochre, rect(650, 1080, 130, 190) + poly([[650, 1082], [668, 1040], [686, 1082]]) + poly([[744, 1082], [762, 1040], [780, 1082]]) + rect(690, 1030, 50, 60), { speck: 0.3 });
  P.layer(C.verm, poly([[686, 1032], [744, 1032], [715, 990]]), { speck: 0.3, opacity: 0.8 });
  // shadows on walls
  let shd = rect(1180, 880, 80, 380) + rect(1040, 740, 20, 520) + rect(1270, 820, 14, 440) + rect(912, 860, 32, 400) + rect(980, 940, 34, 320) + rect(760, 1180, 300, 80);
  P.layer(C.sky, shd, { speck: 0.35, opacity: 0.95 });
  // slate roofs
  let rf = '';
  rf += poly([[1050, 882], [1270, 882], [1160, 760]]); // Palas gable
  rf += poly([[1004, 744], [1066, 744], [1035, 610]]); // stair tower cone
  rf += poly([[1244, 824], [1290, 824], [1267, 720]]);
  rf += poly([[852, 864], [952, 864], [902, 770]]); // square tower pyramid
  for (const [x, y] of [[852, 864], [936, 864]]) rf += poly([[x - 6, y + 4], [x + 22, y + 4], [x + 8, y - 50]]);
  rf += poly([[752, 994], [1064, 994], [1040, 950], [776, 950]]);
  rf += poly([[938, 944], [1020, 944], [979, 880]]);
  P.layer(C.indigo, rf, { speck: 0.25, rough: 3 });
  let win = '';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) win += arch(1072 + c * 30, 920 + r * 62, 12, 22);
  for (let r = 0; r < 4; r++) win += arch(1028, 800 + r * 90, 12, 24) + arch(890, 900 + r * 80, 14, 24);
  for (let c = 0; c < 8; c++) win += arch(776 + c * 34, 1020, 12, 20) + arch(776 + c * 34, 1090, 12, 20);
  P.layer(C.ink, win, { speck: 0.3, rough: 2, micro: 1, opacity: 0.85 });
  P.layer(C.ink, rect(1033, 590, 4, 24) + rect(1265, 700, 3, 22) + rect(1158, 736, 4, 26), { rough: 1.5, micro: 1 });

  // forest
  let pines = '';
  for (let k = 0; k < 16; k++) {
    const x = P.rand(620, 1460), y = P.rand(1440, 1640), h = P.rand(120, 200);
    pines += poly([[x, y - h], [x + h * 0.14, y - h * 0.5], [x + h * 0.2, y], [x - h * 0.2, y], [x - h * 0.14, y - h * 0.5]]);
  }
  P.stamp(C.mossLt, crown(P, 800, 1440, 360, 180) + crown(P, 1360, 1450, 260, 170) + crown(P, 1080, 1480, 300, 140), { mask: true, speck: 0.3 });
  P.layer('#4f5a35', pines, { mask: true, speck: 0.35, rough: 6 });
  P.stamp(C.moss, crown(P, 900, 1660, 560, 260) + crown(P, 1320, 1640, 320, 260) + crown(P, 1100, 1840, 600, 220), { mask: true, speck: 0.3 });
  P.stamp('#4f5a35', crown(P, 1000, 1760, 420, 160) + crown(P, 1400, 1800, 200, 200), { mask: true, speck: 0.35, opacity: 0.9 });

  P.layer(C.ink, birds([[700, 760, 1.6], [760, 720, 1.2]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[1035, 540, 1035, 1300], [420, 1260, 1440, 1260], [560, 1500, 1440, 1440], [860, 860, 420, 1100]]) + hatch(P, 420, 1300, 300, 400, { angle: 58 }), { opacity: 0.3 });
}

// ─── 6. Grossmünster & Limmat ──────────────────────────────────
function grossmuenster(P) {
  P.dissolve({ cx: 1100, cy: 1380, rx: 760, ry: 820, soft: 0.45, freq: 0.02 });
  P.wash(P.grad([[0, C.sky, 0], [0.5, C.sky, 0.8], [1, C.sky, 0.4]], 0, 700, 0, 1300), rect(380, 700, 1100, 640), { mask: true });
  // distant Alps
  const alps = jagged(P, 420, 1460, (x) => 1200 - Math.sin(x / 90) * 30, 34, 14);
  P.layer(C.indigo, ridge(alps, 1300), { mask: true, opacity: 0.35, rough: 6 });
  P.layer(C.white, alps.slice(0, -1).map(([x, y], i) => (i % 2 ? poly([[x - 16, y + 18], [x, y + 2], [x + 16, y + 20]]) : '')).join(''), { mask: true, opacity: 0.8 });

  const towers = [880, 1100], tw = 120;
  const stoneC = '#dcc6a0';
  let t = '';
  for (const x of towers) {
    t += rect(x, 960, tw, 420);
    t += rect(x + 10, 880, tw - 20, 84); // belfry stage
  }
  t += rect(1000, 1060, 100, 320) + poly([[1000, 1062], [1100, 1062], [1050, 1010]]); // west front between towers
  t += rect(620, 1160, 260, 220); // nave side
  P.layer(stoneC, t, { speck: 0.3 });
  P.layer(C.verm, poly([[600, 1164], [884, 1164], [884, 1080], [680, 1080]]), { speck: 0.35, opacity: 0.75 }); // nave roof
  let sh = '';
  for (const x of towers) sh += rect(x + tw * 0.62, 960, tw * 0.38, 420) + rect(x + tw * 0.58, 880, (tw - 20) * 0.42 + 10, 84) + rect(x - 4, 952, tw + 8, 12) + rect(x - 4, 1120, tw + 8, 10) + rect(x - 4, 1250, tw + 8, 10);
  P.layer(C.ochre, sh, { speck: 0.45, opacity: 0.6 });
  // domed caps
  let dome = '';
  for (const x of towers) {
    const cx = x + tw / 2;
    dome += path(`M${x + 6},${884} C${x + 6},${830} ${cx - 30},${810} ${cx - 8},${780} L${cx - 4},${740} L${cx + 4},${740} L${cx + 8},${780} C${cx + 30},${810} ${x + tw - 6},${830} ${x + tw - 6},${884} Z`);
    dome += rect(cx - 2, 712, 4, 32) + circle(cx, 708, 6);
  }
  P.layer(C.ink, dome, { speck: 0.25, rough: 3, micro: 1.5 });
  let win = '';
  for (const x of towers) {
    win += arch(x + 26, 1000, 26, 70) + arch(x + 68, 1000, 26, 70);
    win += arch(x + 26, 905, 16, 46) + arch(x + 52, 905, 16, 46) + arch(x + 78, 905, 16, 46);
    win += arch(x + 46, 1160, 28, 60) + arch(x + 46, 1290, 28, 60);
  }
  win += arch(1032, 1120, 36, 120);
  for (let c = 0; c < 5; c++) win += arch(650 + c * 46, 1230, 20, 50);
  P.layer(C.ink, win, { speck: 0.3, rough: 2, micro: 1, opacity: 0.8 });
  P.layer(C.ochre, towers.map((x) => circle(x + tw / 2, 1100, 15)).join(''), { speck: 0.2 }); // clock faces

  // old-town quay houses
  const cols = [C.sand, '#e2c69a', C.white, '#d9c3a6', C.sky, C.sand, '#e8c9a0'];
  let hx = 480;
  const houses = [];
  while (hx < 1460) {
    const w = P.rand(70, 120), top = P.rand(1300, 1380);
    houses.push([hx, top, w]);
    hx += w + 2;
  }
  houses.forEach(([x, top, w], i) => P.layer(cols[i % cols.length], rect(x, top, w, 1580 - top), { mask: true, speck: 0.3, dx: 0, dy: 0 }));
  P.layer(C.verm, houses.map(([x, top, w]) => poly([[x - 4, top + 2], [x + w + 4, top + 2], [x + w / 2, top - w * 0.45]])).join(''), { mask: true, speck: 0.35, opacity: 0.8 });
  let hw = '';
  for (const [x, top, w] of houses) for (let r = 0; top + 30 + r * 50 < 1540; r++) for (let c = 0; c < Math.floor(w / 30); c++) hw += rect(x + 12 + c * 30, top + 30 + r * 50, 12, 22);
  P.layer(C.ink, hw, { mask: true, speck: 0.3, opacity: 0.6, rough: 2, micro: 1 });
  P.layer(C.stone, rect(420, 1580, 1100, 24), { mask: true });

  // Limmat
  P.wash(C.sky, rect(380, 1604, 1100, 320), { mask: true });
  let refl = '';
  for (let y = 1620; y < 1800; y += P.rand(12, 22)) refl += rect(P.rand(870, 1000), y, P.rand(30, 80), 6) + rect(P.rand(1090, 1220), y, P.rand(30, 80), 6);
  P.layer(C.ink, refl, { mask: true, opacity: 0.4, speck: 0.5 });
  P.layer(C.indigo, waterLines(P, 380, 1500, 1620, 1920, { gap: 22, th: 5 }), { mask: true });
  P.layer(C.white, path('M1240,1720 q30,-6 50,4 q10,-30 -2,-44 q12,-6 16,4 q-4,20 -6,40 q16,0 22,8 q-40,14 -80,-12z'), { speck: 0.1 }); // swan
  P.layer(C.ink, birds([[700, 820, 1.5], [760, 790, 1.1]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[400, 1580, 1440, 1580], [940, 640, 940, 1700], [1160, 640, 1160, 1700], [420, 1700, 1440, 1660]]) + hatch(P, 400, 1420, 260, 360, { angle: 64 }), { opacity: 0.3 });
}

// ─── 7. Matterhorn ─────────────────────────────────────────────
function matterhorn(P) {
  P.dissolve({ cx: 1080, cy: 1300, rx: 760, ry: 900, soft: 0.42, freq: 0.02 });
  P.wash(P.grad([[0, C.sky, 0], [0.45, C.sky, 0.9], [1, C.sky, 0.3]], 0, 620, 0, 1500), rect(380, 620, 1100, 900), { mask: true });

  const S = [1050, 690];
  const left = [S, [1030, 712], [1012, 760], [985, 800], [962, 860], [930, 900], [905, 960], [870, 1000], [840, 1060], [790, 1110], [750, 1170], [690, 1220], [640, 1290], [560, 1360], [470, 1430]];
  const hornli = [S, [1062, 752], [1086, 860], [1112, 950], [1150, 990], [1178, 1080], [1214, 1200], [1262, 1330], [1300, 1480]];
  const right = [[1062, 690], [1086, 702], [1094, 722], [1086, 744], [1100, 790], [1124, 850], [1160, 916], [1222, 958], [1262, 1030], [1334, 1110], [1460, 1220]];
  const east = [...left, [470, 1540], [1300, 1540], ...hornli.slice().reverse()];
  const north = [...hornli, [1300, 1540], [1460, 1540], ...right.slice().reverse()];
  // alpenglow on the lit face, cold shadow on the north face
  P.layer(P.grad([[0, '#e7b48a', 1], [0.5, '#ecd0b0', 1], [1, C.white, 1]], 0, 690, 0, 1500), poly(east), { speck: 0.18, rough: 4 });
  P.layer(C.indigo, poly(north), { speck: 0.25, rough: 4 });
  // snow streaks on the lit face, rock ribs, snow on the shadow face
  let ls = '';
  for (let k = 0; k < 30; k++) {
    const y = P.rand(780, 1420), x = P.rand(560, 1250);
    ls += path(`M${x},${y} l${P.rand(-30, -8)},${P.rand(40, 110)} l${P.rand(8, 18)},${P.rand(-6, 6)} z`);
  }
  P.layer(C.white, `<clipPath id="eastc">${poly(east)}</clipPath><g clip-path="url(#eastc)">${ls}</g>`, { speck: 0.2, rough: 4, opacity: 0.9 });
  let rib = '';
  for (let k = 0; k < 9; k++) {
    const y = 760 + k * 70;
    rib += stroke2(`M${1060 - k * 40},${y} q${30 + k * 6},${30} ${70 + k * 10},${90}`, 5);
  }
  P.layer(C.ochre, `<clipPath id="eastc2">${poly(east)}</clipPath><g clip-path="url(#eastc2)">${rib}</g>`, { speck: 0.45, opacity: 0.55, rough: 3 });
  let snow = '';
  for (let k = 0; k < 22; k++) {
    const y = P.rand(780, 1380), x = P.rand(1080, 1440);
    snow += path(`M${x},${y} l${P.rand(-14, 14)},${P.rand(40, 120)} l${P.rand(6, 16)},0 z`);
  }
  snow += poly([[1160, 916], [1222, 958], [1250, 1000], [1180, 1000]]);
  P.layer(C.white, `<clipPath id="northc">${poly(north)}</clipPath><g clip-path="url(#northc)">${snow}</g>`, { speck: 0.25, rough: 5, opacity: 0.9 });
  P.layer(C.ink, bar(1062, 752, 1112, 950, 4), { speck: 0.3, rough: 3, opacity: 0.4 });
  // cloud banner off the summit
  P.stamp(C.white, blobs(P, 1230, 760, 110, 30, { n: 14 }) + blobs(P, 1350, 790, 80, 24, { n: 10 }), { opacity: 0.95 });

  // lower ridges, forest, chalets
  const r1 = jagged(P, 420, 1460, (x) => 1460 - (x - 420) * 0.08, 36, 14);
  P.layer(C.mossLt, ridge(r1, 1920), { mask: true, rough: 10 });
  let pines = '';
  for (let k = 0; k < 40; k++) {
    const x = P.rand(520, 1460), y = P.rand(1480, 1760), h = P.rand(70, 150);
    pines += poly([[x, y - h], [x + h * 0.22, y], [x - h * 0.22, y]]);
  }
  P.layer(C.moss, pines, { mask: true, rough: 6, speck: 0.35 });
  const ch = [[820, 1740, 110], [980, 1700, 130], [1160, 1730, 120], [1310, 1690, 140]];
  P.layer('#6b4a33', ch.map(([x, y, w]) => rect(x, y, w, w * 0.7)).join(''), { mask: true, speck: 0.3 });
  P.layer(C.stone, ch.map(([x, y, w]) => poly([[x - w * 0.15, y + 4], [x + w / 2, y - w * 0.4], [x + w * 1.15, y + 4]])).join(''), { mask: true, speck: 0.3 });
  P.layer(C.ochre, ch.map(([x, y, w]) => rect(x + w * 0.2, y + w * 0.2, w * 0.18, w * 0.16) + rect(x + w * 0.6, y + w * 0.2, w * 0.18, w * 0.16)).join(''), { mask: true, speck: 0.2 });
  P.stamp(C.moss, crown(P, 700, 1860, 300, 140) + crown(P, 1400, 1860, 220, 160), { mask: true });
  P.layer(C.ink, birds([[760, 720, 1.5], [820, 690, 1.1]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[S[0], 600, S[0], 1600], [420, 1540, 1440, 1540], [480, 1420, 1060, 680], [1460, 1230, 1050, 690]]) + hatch(P, 420, 1280, 300, 300, { angle: 50 }), { opacity: 0.3 });
}

export const SCENES_DE = [
  {
    slug: 'fernsehturm',
    seed: 22,
    paper: '#f0e5cf',
    focus: '90% 90%',
    mfocus: '90% 94%',
    place: 'Fernsehturm · Berlin',
    de: 'Die Stadt schaut nach oben.',
    en: 'The city looks up.',
    draw: fernsehturm,
  },
  {
    slug: 'elbphilharmonie',
    seed: 33,
    paper: '#ede2cb',
    focus: '90% 90%',
    mfocus: '90% 94%',
    place: 'Elbphilharmonie · Hamburg',
    de: 'Wellen aus Glas über dem Hafen.',
    en: 'Waves of glass above the harbour.',
    draw: elbphilharmonie,
  },
  {
    slug: 'neuschwanstein',
    seed: 55,
    paper: '#eee3cc',
    focus: '90% 90%',
    mfocus: '90% 94%',
    place: 'Schloss Neuschwanstein · Bayern',
    de: 'Ein Märchen aus Stein.',
    en: 'A fairy tale made of stone.',
    draw: neuschwanstein,
  },
  {
    slug: 'grossmuenster',
    seed: 66,
    paper: '#efe5d2',
    focus: '90% 90%',
    mfocus: '90% 94%',
    place: 'Grossmünster · Zürich',
    de: 'Zwei Türme spiegeln sich im Fluss.',
    en: 'Two towers mirrored in the river.',
    draw: grossmuenster,
  },
  {
    slug: 'matterhorn',
    seed: 77,
    paper: '#ece6d6',
    focus: '90% 90%',
    mfocus: '90% 94%',
    place: 'Matterhorn · Zermatt',
    de: 'Der Berg trägt eine Wolke.',
    en: 'The mountain wears a cloud.',
    draw: matterhorn,
  },
  {
    slug: 'brandenburger-tor',
    seed: 11,
    paper: '#efe4cf',
    focus: '90% 88%',
    mfocus: '90% 94%',
    place: 'Brandenburger Tor · Berlin',
    de: 'Ein Tor für alle Wege.',
    en: 'A gate for every path.',
    draw: brandenburgerTor,
  },
  {
    slug: 'koelner-dom',
    seed: 44,
    paper: '#ece0c8',
    focus: '90% 90%',
    mfocus: '90% 94%',
    place: 'Kölner Dom · Köln',
    de: 'Zwei Türme über dem Rhein.',
    en: 'Two towers above the Rhine.',
    draw: koelnerDom,
  },
  {
    slug: 'riesenrad-prater',
    seed: 88,
    paper: '#f1e6d0',
    focus: '90% 90%',
    mfocus: '90% 94%',
    place: 'Riesenrad im Prater · Wien',
    de: 'Langsam dreht sich die Stadt.',
    en: 'Slowly, the city turns.',
    draw: riesenrad,
  },
];
