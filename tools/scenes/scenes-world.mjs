// Scenes outside the German-speaking world.
import { C, rect, circle, poly, path, bar, arch, lancet, smooth, sag, blobs, crown, waterLines, birds, hatch, construction } from './lib.mjs';

const ring = (cx, cy, r, w) => circle(cx, cy, r, `fill="none" stroke="currentColor" stroke-width="${w}"`);
const stroke = (d, w) => path(d, `fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`);

// Cross-hatch lattice pattern (for iron structures); returns pattern id.
function lattice(P, size = 22, w = 2.6, color = C.ink) {
  const id = `lat${P.n++}`;
  P.defs.push(`<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><path d="M0,0 L${size},${size} M${size},0 L0,${size} M0,${size / 2} H${size}" stroke="${color}" stroke-width="${w}" fill="none"/></pattern>`);
  return id;
}

// ─── 9. Eiffelturm ─────────────────────────────────────────────
function eiffelturm(P) {
  const X = 1060, base = 1720, p1 = 1390, p2 = 1130, top = 700;
  const hw = (y) => 16 + 256 * Math.pow((y - top) / (base - top), 1.9);
  P.dissolve({ cx: 1100, cy: 1350, rx: 740, ry: 880, soft: 0.42, freq: 0.02 });
  P.wash(P.grad([[0, C.sky, 0], [0.45, C.sky, 0.85], [1, C.sky, 0.3]], 0, 620, 0, 1700), rect(380, 620, 1100, 1100), { mask: true });
  P.layer(C.verm, circle(1270, 1060, 150), { speck: 0.28 });
  P.stamp(C.white, blobs(P, 820, 940, 130, 34, { n: 14 }) + blobs(P, 1360, 1240, 110, 30, { n: 12 }), { opacity: 0.9 });

  // silhouette pieces
  const outer = (side, y0, y1, n = 16) => {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const y = y0 + ((y1 - y0) * i) / n;
      pts.push([X + side * hw(y), y]);
    }
    return pts;
  };
  const archPts = (side) => {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const a = (Math.PI / 2) * (i / 16);
      pts.push([X + side * 175 * Math.cos(a), base - 250 * Math.sin(a)]);
    }
    return pts; // from foot inward up to apex
  };
  let sil = '';
  for (const side of [-1, 1]) {
    // lower leg: outer edge base→p1, then along p1 inward to centre, down the arch to inner foot
    sil += poly([...outer(side, base, p1), [X, p1], ...archPts(side).reverse(), [X + side * 175, base]]);
    // middle legs between platforms
    const inner = (y) => hw(y) * (0.55 - 0.25 * ((p1 - y) / (p1 - p2)));
    const pts = outer(side, p1, p2, 10);
    for (let i = 10; i >= 0; i--) {
      const y = p1 + ((p2 - p1) * i) / 10;
      pts.push([X + side * inner(y), y]);
    }
    sil += poly(pts);
  }
  sil += poly([...outer(-1, p2, top, 14), ...outer(1, top, p2, 14)]);
  const lat = lattice(P, 20, 2.4);
  P.layer(C.ochre, sil, { speck: 0.3, opacity: 0.75, rough: 3 });
  P.layer(C.ink, `<g fill="url(#${lat})">${sil}</g>`, { speck: 0.35, rough: 2, micro: 1.2, opacity: 0.8 });
  // bold edges, platforms, top
  let e = '';
  for (const side of [-1, 1]) {
    e += stroke('M' + outer(side, base, top, 30).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L'), 7);
    e += stroke('M' + archPts(side).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L'), 6);
  }
  e += rect(X - hw(p1) - 16, p1 - 10, 2 * hw(p1) + 32, 30) + rect(X - hw(p2) - 12, p2 - 8, 2 * hw(p2) + 24, 20);
  for (let k = 0; k < 12; k++) e += arch(X - hw(p1) - 6 + k * ((2 * hw(p1) + 12) / 12), p1 + 26, 12, 14);
  e += rect(X - 20, top - 46, 40, 50) + poly([[X - 24, top - 44], [X + 24, top - 44], [X, top - 70]]) + rect(X - 3, top - 120, 6, 60);
  P.layer(C.ink, e, { speck: 0.25, rough: 2, micro: 1.2 });

  // Paris roofs (left) and Champ-de-Mars trees
  let fac = '', roofs = '';
  const blocks = [[440, 1560, 140], [580, 1600, 120], [700, 1640, 110]];
  for (const [x, y, w] of blocks) {
    fac += rect(x, y, w, 1800 - y);
    roofs += poly([[x - 4, y + 4], [x + 10, y - 40], [x + w - 10, y - 40], [x + w + 4, y + 4]]) + rect(x + 20, y - 60, 14, 24) + rect(x + w - 40, y - 60, 14, 24);
  }
  P.layer(C.white, fac, { mask: true, speck: 0.2 });
  P.layer(C.indigo, roofs, { mask: true, speck: 0.3, opacity: 0.7 });
  let fw = '';
  for (const [x, y, w] of blocks) for (let r = 0; y + 20 + r * 40 < 1780; r++) for (let c = 0; c < 4; c++) fw += rect(x + 14 + c * (w / 4.2), y + 20 + r * 40, 10, 22);
  P.layer(C.ink, fw, { mask: true, speck: 0.3, opacity: 0.55, rough: 2, micro: 1 });
  P.stamp(C.mossLt, crown(P, 820, 1700, 220, 120) + crown(P, 1330, 1690, 260, 130), { mask: true });
  P.stamp(C.moss, crown(P, 930, 1760, 240, 120) + crown(P, 1220, 1760, 280, 130) + crown(P, 1440, 1720, 160, 160), { mask: true });
  // Seine
  P.layer(C.stone, rect(420, 1790, 1100, 22), { mask: true });
  P.wash(C.sky, rect(380, 1812, 1100, 120), { mask: true });
  P.layer(C.indigo, waterLines(P, 380, 1500, 1820, 1920, { gap: 18, th: 5 }), { mask: true });
  P.layer(C.ink, birds([[700, 820, 1.5], [760, 790, 1.1], [660, 760, 0.9]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[X, 560, X, 1900], [400, base, 1440, base], [X - 300, base + 40, X - 20, top - 60], [X + 300, base + 40, X + 20, top - 60], [420, p1, 1440, p1]]) + hatch(P, 400, 1460, 300, 360, { angle: 60 }), { opacity: 0.28 });
}

// ─── 10. Rialtobrücke ──────────────────────────────────────────
function rialto(P) {
  const X = 1000, water = 1520;
  P.dissolve({ cx: 1080, cy: 1380, rx: 740, ry: 800, soft: 0.45, freq: 0.02 });
  P.wash(P.grad([[0, C.ochre, 0], [0.5, C.ochre, 0.4], [1, C.sand, 0.6]], 0, 760, 0, 1500), rect(380, 760, 1100, 760), { mask: true });
  // palazzi either side
  P.layer('#d9a77a', rect(1320, 1020, 160, 500), { mask: true, speck: 0.3 });
  P.layer(C.verm, rect(1310, 1000, 180, 24), { mask: true, opacity: 0.8 });
  let pw = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) pw += lancet(1338 + c * 44, 1080 + r * 100, 22, 50);
  P.layer(C.ink, pw, { mask: true, opacity: 0.7, rough: 2, micro: 1 });
  P.layer(C.sand, rect(470, 1180, 130, 340) + rect(600, 1240, 90, 280), { mask: true, speck: 0.3 });
  P.layer(C.verm, rect(462, 1166, 146, 18) + rect(594, 1228, 102, 16), { mask: true, opacity: 0.6 });

  const stoneW = '#f3ecdc';
  // parapet line (extrados) and intrados
  const ext = (x) => water - 120 - 170 * (1 - Math.pow((x - X) / 480, 2));
  const intr = (x) => water - 220 * (1 - Math.pow((x - X) / 400, 2));
  const extPts = [], intPts = [];
  for (let x = 520; x <= 1480; x += 20) extPts.push([x, ext(x)]);
  for (let x = 1400; x >= 600; x -= 20) intPts.push([x, intr(x)]);
  // arcades on top: two sloping ranges + central portico
  let arc = '';
  arc += poly([[560, ext(560)], [X - 70, ext(X - 70)], [X - 70, ext(X - 70) - 110], [560, ext(560) - 70]]);
  arc += poly([[1440, ext(1440)], [X + 70, ext(X + 70)], [X + 70, ext(X + 70) - 110], [1440, ext(1440) - 70]]);
  arc += rect(X - 74, ext(X) - 190, 148, 190);
  P.layer(stoneW, poly([...extPts, [1480, water], [1400, water], ...intPts, [600, water], [520, water]]) + arc, { speck: 0.2 });
  // soffit shadow + side shading
  P.layer(C.stone, poly([...intPts.map(([x, y]) => [x, y]), ...intPts.slice().reverse().map(([x, y]) => [x, y + 30])]), { speck: 0.35, opacity: 0.9 });
  // arcade openings
  let op = '';
  for (let k = 0; k < 6; k++) {
    const lx = 590 + k * 54, rx = 1350 - k * 54;
    op += arch(lx, ext(lx + 20) - 52 - (k * 4), 26, 46);
    op += arch(rx, ext(rx + 6) - 52 - (k * 4), 26, 46);
  }
  op += arch(X - 34, ext(X) - 150, 68, 150);
  P.layer(C.ink, op, { speck: 0.3, rough: 2, micro: 1.2, opacity: 0.85 });
  // roofs + pediment
  let rf = '';
  rf += poly([[548, ext(560) - 66], [X - 64, ext(X - 70) - 106], [X - 64, ext(X - 70) - 132], [556, ext(560) - 92]]);
  rf += poly([[1452, ext(1440) - 66], [X + 64, ext(X + 70) - 106], [X + 64, ext(X + 70) - 132], [1444, ext(1440) - 92]]);
  P.layer(C.verm, rf, { speck: 0.3 });
  P.layer(stoneW, poly([[X - 90, ext(X) - 186], [X + 90, ext(X) - 186], [X, ext(X) - 250]]), { speck: 0.2 });
  P.layer(C.stone, poly([[X - 90, ext(X) - 186], [X + 90, ext(X) - 186], [X, ext(X) - 250]], 'fill="none" stroke="currentColor" stroke-width="7"') + rect(X - 90, ext(X) - 192, 180, 10), { speck: 0.3 });
  // balustrade along parapet
  let bal = '';
  for (let x = 540; x < 1460; x += 14) bal += rect(x, ext(x) - 8, 5, 16);
  bal += path('M' + extPts.map(([x, y]) => `${x},${y - 10}`).join(' L') + ' L' + extPts.slice().reverse().map(([x, y]) => `${x},${y - 4}`).join(' L') + 'Z');
  P.layer(C.ink, bal, { speck: 0.35, rough: 2, micro: 1, opacity: 0.6 });

  // Grand Canal, reflection, gondola, paline
  P.wash(P.grad([[0, C.sky, 0.95], [1, '#a9bdb6', 0.9]], 0, water, 0, 1920), rect(380, water, 1100, 420), { mask: true });
  let refl = '';
  for (let y = water + 10; y < water + 200; y += P.rand(10, 18)) {
    const half = 400 * Math.sqrt(Math.max(0, 1 - (y - water) / 230));
    refl += rect(X - half - P.rand(40, 90), y, P.rand(40, 90), 6) + rect(X + half + P.rand(0, 20), y, P.rand(40, 90), 6);
  }
  P.layer(C.white, refl, { mask: true, speck: 0.35 });
  P.layer(C.indigo, waterLines(P, 380, 1500, water + 20, 1920, { gap: 22, th: 5, fill: 0.45 }), { mask: true, opacity: 0.8 });
  // gondola: long black hull, ferro at the prow, gondolier at the stern
  let g = path('M860,1752 Q1100,1790 1340,1726 Q1360,1716 1372,1690 L1380,1694 Q1372,1730 1340,1744 Q1100,1812 870,1768 Q850,1762 846,1744 Z');
  g += path('M1366,1700 l14,-46 l10,2 l-6,20 l16,0 l-2,8 l-16,0 l-2,8 l16,0 l-2,8 l-16,0 l-4,10 z'); // ferro
  g += rect(886, 1652, 16, 92) + circle(894, 1640, 12); // gondolier
  g += bar(906, 1680, 980, 1850, 5); // oar
  P.layer(C.ink, g, { speck: 0.2, rough: 2, micro: 1.2 });
  P.layer(C.verm, rect(880, 1680, 28, 12) + rect(890, 1700, 10, 10), { speck: 0.2 });
  let pal = '';
  for (const px of [1250, 1290, 1410]) for (let k = 0; k < 7; k++) pal += rect(px, 1560 + k * 40, 14, 20);
  P.layer(C.verm, pal, { speck: 0.25 });
  P.layer(C.white, [1250, 1290, 1410].map((px) => rect(px, 1580, 14, 260)).join(''), { speck: 0.2, opacity: 0.6 });
  P.layer(C.ink, birds([[720, 860, 1.5], [780, 830, 1.1]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[400, water, 1440, water], [X, 640, X, 1700], [520, ext(520), X, ext(X) - 250], [1480, ext(1480), X, ext(X) - 250]]) + hatch(P, 400, 1380, 260, 380, { angle: 60 }), { opacity: 0.28 });
}

// ─── 11. Fushimi Inari: rows of torii ──────────────────────────
function fushimiInari(P) {
  const VP = [1170, 1290];
  P.dissolve({ cx: 1080, cy: 1350, rx: 760, ry: 860, soft: 0.45, freq: 0.02 });
  // forest beyond and above the gates
  P.stamp(C.mossLt, crown(P, 1150, 820, 560, 240) + crown(P, 760, 900, 260, 200), { mask: true });
  P.stamp(C.moss, crown(P, 1320, 720, 360, 200) + crown(P, 960, 780, 300, 180) + crown(P, 700, 840, 200, 150), { mask: true });
  P.stamp(C.moss, blobs(P, 330, 560, 52, 46, { n: 10 }) + blobs(P, 470, 700, 30, 26, { n: 7 }), { opacity: 0.9 });
  // stone path
  P.layer(C.stone, poly([[VP[0] - 20, VP[1] + 20], [VP[0] + 20, VP[1] + 20], [1480, 1940], [560, 1940]]), { mask: true, speck: 0.4, opacity: 0.6 });

  const near = { lx: 730, rx: 1520, pw: 60, foot: 1960, kasa: 760, nuki: 900 };
  const T = (x, y, s) => [VP[0] + (x - VP[0]) * s, VP[1] + (y - VP[1]) * s];
  const N = 15;
  // far end of the tunnel glows; dark interior between the gates
  const sIn = 1 / (1 + 0.2 * 1);
  const [ia, ib] = T(near.lx + near.pw, near.kasa + 80, sIn), [ic, id] = T(near.rx, near.foot, sIn);
  P.layer(P.rgrad([[0, C.ochre, 0.1], [0.25, C.indigo, 0.35], [1, C.ink, 0.8]], VP[0], VP[1], 520), rect(ia, ib, ic - ia, id - ib), { speck: 0.4 });
  // dark forest seen between the posts, on both sides of the corridor
  const [wa, wb] = T(near.lx - 40, near.kasa + 40, 1);
  P.layer('#3e4630', poly([[wa, wb], [VP[0] - 30, VP[1] - 60], [VP[0] - 30, VP[1] + 120], [wa, 1940]]) + poly([[1500, wb], [VP[0] + 30, VP[1] - 60], [VP[0] + 30, VP[1] + 120], [1500, 1940]]), { speck: 0.45, opacity: 0.85 });
  // dappled light on the path
  let dap = '';
  for (let k = 0; k < 18; k++) {
    const t = P.rand(0.25, 1), x = VP[0] + (P.rand(-0.6, 0.6) * 500 + 0) * t, y = VP[1] + 650 * t;
    dap += path(`M${x},${y} m-${30 * t},0 a${30 * t},${7 * t} 0 1 0 ${60 * t},0 a${30 * t},${7 * t} 0 1 0 -${60 * t},0`);
  }
  P.layer(C.ochre, dap, { speck: 0.4, opacity: 0.55, rough: 6 });
  for (let i = N; i >= 0; i--) {
    const s = 1 / (1 + 0.2 * i);
    const q = (x, y) => T(x, y, s);
    let red = '', dark = '', shade = '';
    for (const [x, sideShade] of [[near.lx, 1], [near.rx, 0]]) {
      const [a, b] = q(x, near.kasa + 40), [c, d] = q(x + near.pw, near.foot);
      red += rect(a, b, c - a, d - b);
      const [, kb] = q(x, near.foot - 120);
      dark += rect(a, kb, c - a, d - kb);
      shade += sideShade ? rect(a + (c - a) * 0.55, b, (c - a) * 0.45, d - b) : rect(a, b, (c - a) * 0.4, d - b);
    }
    const [n0x, n0y] = q(near.lx - 46, near.nuki), [n1x, n1y] = q(near.rx + near.pw + 46, near.nuki + 46);
    red += rect(n0x, n0y, n1x - n0x, n1y - n0y);
    const [s0x, s0y] = q(near.lx - 70, near.kasa + 34), [s1x, s1y] = q(near.rx + near.pw + 70, near.kasa + 72);
    red += rect(s0x, s0y, s1x - s0x, s1y - s0y);
    const L = near.lx - 110, R = near.rx + near.pw + 110, k = near.kasa;
    const kp = [[L - 20, k - 34], [L + 50, k - 6], [R - 50, k - 6], [R + 20, k - 34], [R - 10, k + 4], [R - 50, k + 36], [L + 50, k + 36], [L + 10, k + 4]].map(([x, y]) => q(x, y));
    dark += poly(kp);
    // each gate is its own little print so the overlaps stay crisp; far ones fade
    const fade = Math.min(1, 0.35 + 0.65 * s * 1.1);
    P.layer(C.verm, red, { speck: 0.28, rough: 3, micro: 1.4, opacity: fade, dx: 0, dy: 0 });
    P.layer('#8f3520', shade, { speck: 0.4, rough: 2, micro: 1, opacity: 0.5 * fade, dx: 0, dy: 0 });
    P.layer(C.ink, dark, { speck: 0.3, rough: 2, micro: 1.2, opacity: fade, dx: 0, dy: 0 });
  }
  // stone lantern
  const lan = rect(470, 1740, 60, 160) + rect(450, 1720, 100, 24) + rect(476, 1660, 48, 60) + poly([[440, 1662], [560, 1662], [500, 1610]]) + circle(500, 1600, 10) + rect(456, 1896, 88, 24);
  P.layer(C.stone, lan, { mask: true, speck: 0.35 });
  P.layer(C.ink, rect(488, 1676, 24, 30), { mask: true, opacity: 0.6 });
  P.stamp(C.moss, crown(P, 520, 1900, 220, 110), { mask: true });
  P.layer(C.ink, birds([[640, 760, 1.4], [700, 730, 1]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[VP[0], VP[1], 420, 640], [VP[0], VP[1], 1440, 700], [VP[0], VP[1], 1440, 1920], [VP[0], VP[1], 560, 1920], [420, VP[1], 1440, VP[1]]]) + hatch(P, 400, 1240, 260, 380, { angle: 64 }), { opacity: 0.24 });
}

// ─── 12. Fuji mit Chureito-Pagode ──────────────────────────────
function fuji(P) {
  P.dissolve({ cx: 1100, cy: 1380, rx: 760, ry: 860, soft: 0.45, freq: 0.02 });
  P.wash(P.grad([[0, C.sky, 0], [0.4, C.sky, 0.9], [1, C.sand, 0.6]], 0, 680, 0, 1500), rect(380, 680, 1100, 820), { mask: true });
  P.layer(C.verm, circle(1340, 760, 46), { speck: 0.25, opacity: 0.9 });
  // mountain: flat crater rim, long concave slopes
  const top = 840, l = 1060, r = 1230;
  const mtn = `M${l},${top} Q${l - 20},${top + 6} ${l - 40},${top + 20} Q${l - 230},${top + 330} 470,${top + 760} L1560,${top + 760} Q${r + 230},${top + 330} ${r + 40},${top + 20} Q${r + 20},${top + 6} ${r},${top} Q${(l + r) / 2},${top - 14} ${l},${top} Z`;
  P.layer(P.grad([[0, C.indigo, 1], [0.55, C.indigo, 0.8], [1, C.indigo, 0.2]], 0, top, 0, top + 760), path(mtn), { speck: 0.25, rough: 4, mask: true });
  // snow cap with uneven gullies
  const edgeL = (y) => l - 40 - (y - top - 20) * 0.62, edgeR = (y) => r + 40 + (y - top - 20) * 0.62;
  let snow = `M${l},${top} Q${(l + r) / 2},${top - 14} ${r},${top} L${r + 40},${top + 20}`;
  const ys = [1010, 980, 1100, 1000, 1160, 1030, 1080, 990, 1130, 1010, 1060, 975, 1120, 1000, 1050, 990];
  const ny = ys.length;
  for (let i = 0; i < ny; i++) {
    const t = (i + 0.5) / ny;
    const yy = ys[i];
    const xx = edgeR(yy) + (edgeL(yy) - edgeR(yy)) * t;
    snow += ` L${xx.toFixed(1)},${yy}`;
    const t2 = (i + 1) / ny, y2 = Math.min(ys[i], ys[(i + 1) % ny]) - 50;
    snow += ` L${(edgeR(y2) + (edgeL(y2) - edgeR(y2)) * t2).toFixed(1)},${y2}`;
  }
  snow += ` L${l - 40},${top + 20} Z`;
  P.layer(C.white, path(snow), { speck: 0.15, rough: 5, micro: 3 });
  P.layer(C.sky, `<clipPath id="snowc"><path d="${snow}"/></clipPath><g clip-path="url(#snowc)">${rect(1150, 820, 300, 400)}</g>`, { speck: 0.3, opacity: 0.7 });

  // hillside with pagoda
  const hill = smooth([[420, 1640], [560, 1560], [700, 1520], [860, 1550], [1060, 1590], [1300, 1580], [1480, 1560], [1480, 1940], [420, 1940]], true, 0.4);
  P.layer(C.moss, path(hill), { mask: true, speck: 0.3, rough: 10 });
  const cx = 700;
  let body = '', roofs = '', rail = '';
  for (let i = 0; i < 5; i++) {
    const y = 1520 - i * 92, rw = 128 - i * 15, bw = 70 - i * 9;
    body += rect(cx - bw, y - 66, 2 * bw, 70);
    roofs += path(`M${cx - rw - 16},${y - 76} Q${cx - rw + 20},${y - 52} ${cx - rw + 50},${y - 56} L${cx + rw - 50},${y - 56} Q${cx + rw - 20},${y - 52} ${cx + rw + 16},${y - 76} L${cx + rw * 0.55},${y - 100} L${cx - rw * 0.55},${y - 100} Z`);
    rail += rect(cx - bw - 6, y - 50, 2 * bw + 12, 5);
    for (let k = -2; k <= 2; k++) rail += rect(cx + k * bw * 0.4 - 4, y - 40, 8, 30);
  }
  body += rect(cx - 82, 1520, 164, 30);
  P.layer(C.verm, body, { speck: 0.25 });
  P.layer(C.white, rail, { speck: 0.3, opacity: 0.75, rough: 2, micro: 1 });
  let spire = rect(cx - 4, 1050, 8, 110);
  for (let k = 0; k < 7; k++) spire += rect(cx - 12, 1070 + k * 12, 24, 5);
  P.layer(C.ink, roofs + spire + circle(cx, 1048, 8), { speck: 0.25, rough: 3 });
  // cherry blossom + pines
  const sakura = '#e6b2a2';
  P.stamp(sakura, crown(P, 900, 1560, 300, 160) + crown(P, 520, 1600, 200, 140) + crown(P, 1250, 1740, 420, 220) + blobs(P, 560, 1460, 70, 50, { n: 12 }), { mask: true });
  P.stamp('#d38f80', crown(P, 1000, 1640, 240, 120) + crown(P, 1400, 1800, 220, 180), { mask: true, opacity: 0.85 });
  P.stamp(C.moss, crown(P, 760, 1760, 360, 160) + crown(P, 1120, 1860, 400, 160), { mask: true });
  P.stamp(sakura, blobs(P, 300, 520, 40, 32, { n: 9 }) + blobs(P, 420, 640, 22, 18, { n: 6 }), { opacity: 0.9 });
  P.layer(C.ink, birds([[820, 760, 1.4], [880, 730, 1]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[cx, 980, cx, 1700], [420, 1560, 1440, 1560], [l - 40, top + 20, 470, top + 760], [r + 40, top + 20, 1560, top + 760]]) + hatch(P, 400, 1500, 260, 340, { angle: 62 }), { opacity: 0.28 });
}

// ─── 13. Golden Gate Bridge ────────────────────────────────────
function goldenGate(P) {
  const orange = '#c9532c';
  P.dissolve({ cx: 1120, cy: 1300, rx: 760, ry: 860, soft: 0.45, freq: 0.02 });
  P.wash(P.grad([[0, C.ochre, 0], [0.5, C.ochre, 0.45], [1, C.sand, 0.8]], 0, 640, 0, 1400), rect(380, 640, 1100, 760), { mask: true });
  // Marin headlands
  const hills = smooth([[420, 1380], [560, 1290], [700, 1250], [860, 1300], [1000, 1360], [1000, 1460], [420, 1460]], true, 0.4);
  P.layer(C.mossLt, path(hills), { mask: true, rough: 10, opacity: 0.8 });
  P.layer(C.ochre, path(smooth([[420, 1400], [560, 1340], [700, 1320], [820, 1360], [820, 1460], [420, 1460]], true, 0.4)), { mask: true, rough: 10, opacity: 0.6 });

  const near = 1140, far = 650;
  const deckY = (x) => 1350 + (near - x) * 0.07;
  // cables + suspenders
  const main = sag(near, 660, far, 1120, 300, 40);
  let cab = stroke('M' + main.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L'), 7);
  const side = sag(near, 660, 1560, 1300, 140, 20);
  cab += stroke('M' + side.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L'), 8);
  for (const [x, y] of main.slice(1, -1)) cab += rect(x - 1, y, 2.4, deckY(x) - y);
  for (const [x, y] of side.slice(1, -1)) cab += rect(x - 1.2, y, 3, deckY(x) - y);
  cab += stroke(`M${far},1120 L${far - 160},1300`, 5);
  P.layer(orange, cab, { speck: 0.3, rough: 2, micro: 1.2 });
  // deck
  P.layer(orange, poly([[420, deckY(420) + 10], [1480, deckY(1480) - 6], [1480, deckY(1480) + 30], [420, deckY(420) + 26]]), { mask: true, speck: 0.3 });
  P.layer('#8a3a22', poly([[420, deckY(420) + 22], [1480, deckY(1480) + 22], [1480, deckY(1480) + 40], [420, deckY(420) + 30]]), { mask: true, speck: 0.35, opacity: 0.7 });
  // towers (two legs, portal struts, setbacks)
  const tower = (cx, top, bottom, s) => {
    let t = '';
    const lw = [30, 26, 22, 19].map((v) => v * s), gap = 52 * s;
    const levels = [bottom, top + (bottom - top) * 0.62, top + (bottom - top) * 0.36, top + (bottom - top) * 0.14, top];
    for (let k = 0; k < 4; k++) {
      t += rect(cx - gap - lw[k], levels[k + 1], lw[k], levels[k] - levels[k + 1]);
      t += rect(cx + gap, levels[k + 1], lw[k], levels[k] - levels[k + 1]);
      t += rect(cx - gap, levels[k + 1] + 6 * s, 2 * gap, 22 * s);
    }
    t += rect(cx - gap - 10 * s, top - 10 * s, 2 * gap + 20 * s, 14 * s);
    t += rect(cx - gap - lw[0] - 6 * s, bottom, 2 * (gap + lw[0] + 6 * s), 200 * s);
    return t;
  };
  P.layer(orange, tower(far, 1120, 1400, 0.45), { speck: 0.3, rough: 2, micro: 1.2, opacity: 0.85 });
  P.layer(orange, tower(near, 650, 1350, 1.35), { speck: 0.25, rough: 3, micro: 1.4 });
  // tower shading: inner faces + recessed panels
  let ts = '';
  for (const k of [0, 1, 2, 3]) {
    const levels = [1350, 650 + 700 * 0.62, 650 + 700 * 0.36, 650 + 700 * 0.14, 650];
    const w = [30, 26, 22, 19][k] * 1.35;
    ts += rect(near + 52 * 1.35 + w * 0.6, levels[k + 1], w * 0.4, levels[k] - levels[k + 1]) + rect(near - 52 * 1.35 - w * 0.4, levels[k + 1], w * 0.4, levels[k] - levels[k + 1]);
    for (let j = 0; j < 3; j++) ts += rect(near - 52 * 1.35 - w * 0.75, levels[k + 1] + 50 + j * 60, w * 0.35, 36);
  }
  P.layer('#8a3a22', ts, { speck: 0.35, opacity: 0.65 });

  // fog bank rolling under the bridge
  P.stamp(C.white, crown(P, 640, 1440, 520, 120) + crown(P, 1000, 1470, 400, 90) + blobs(P, 1340, 1460, 140, 40, { n: 14 }), { mask: true, opacity: 0.95, speck: 0.3 });
  // water
  P.wash(C.indigo, rect(380, 1500, 1100, 440), { mask: true, opacity: 0.35 });
  P.layer(C.indigo, waterLines(P, 380, 1500, 1520, 1920, { gap: 22, th: 5 }), { mask: true });
  let refl = '';
  for (let y = 1530; y < 1800; y += P.rand(12, 22)) refl += rect(near - 90 + P.rand(-20, 20), y, P.rand(30, 60), 6) + rect(near + 50 + P.rand(-20, 20), y, P.rand(30, 60), 6);
  P.layer(orange, refl, { mask: true, opacity: 0.6, speck: 0.5 });
  P.layer(C.ink, birds([[720, 800, 1.5], [790, 770, 1.1], [860, 820, 0.9]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[near, 560, near, 1900], [far, 900, far, 1700], [400, 1400, 1440, 1340], [400, 1120, 1440, 1120]]) + hatch(P, 400, 1500, 280, 340, { angle: 30, gap: 11 }), { opacity: 0.28 });
}

// ─── 14. Sydney Opera House ────────────────────────────────────
function sydneyOpera(P) {
  const podium = 1440;
  P.dissolve({ cx: 1080, cy: 1380, rx: 760, ry: 800, soft: 0.45, freq: 0.02 });
  P.wash(P.grad([[0, C.verm, 0], [0.5, C.ochre, 0.35], [1, C.sand, 0.7]], 0, 780, 0, 1450), rect(380, 780, 1100, 680), { mask: true });
  // Harbour Bridge, faint, behind
  const bA = sag(1020, 1390, 1720, 1390, -380, 30), bB = sag(1050, 1390, 1690, 1390, -310, 30);
  let hb = stroke('M' + bA.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L'), 10) + stroke('M' + bB.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L'), 6);
  for (let k = 1; k < 30; k++) hb += bar(bA[k][0], bA[k][1], bB[k][0], bB[k][1], 3);
  hb += rect(980, 1336, 520, 12) + rect(990, 1250, 54, 140);
  P.layer(C.indigo, hb, { speck: 0.4, opacity: 0.32, rough: 3 });

  // A shell is a curved triangle: base from x0 to x0+w, apex leaning by `lean` (negative = faces left).
  const shell = (x0, w, h, lean, yb = podium) => {
    const ax = (lean < 0 ? x0 : x0 + w) + lean, ay = yb - h;
    return lean < 0
      ? `M${x0},${yb} Q${x0 + lean * 0.2},${yb - h * 0.6} ${ax},${ay} Q${x0 + w * 0.7},${yb - h * 0.75} ${x0 + w},${yb} Z`
      : `M${x0 + w},${yb} Q${x0 + w + lean * 0.2},${yb - h * 0.6} ${ax},${ay} Q${x0 + w * 0.3},${yb - h * 0.75} ${x0},${yb} Z`;
  };
  const shadeOf = (x0, w, h, lean, yb = podium) => {
    const ax = (lean < 0 ? x0 : x0 + w) + lean, ay = yb - h;
    return lean < 0
      ? `M${x0 + w * 0.45},${yb} Q${x0 + w * 0.35},${yb - h * 0.55} ${ax},${ay} Q${x0 + w * 0.7},${yb - h * 0.75} ${x0 + w},${yb} Z`
      : `M${x0 + w * 0.55},${yb} Q${x0 + w * 0.65},${yb - h * 0.55} ${ax},${ay} Q${x0 + w * 0.3},${yb - h * 0.75} ${x0},${yb} Z`;
  };
  const mouth = (x0, w, h, lean, yb = podium) => (lean < 0 ? poly([[x0 - 4, yb], [x0 + lean * 0.12, yb - h * 0.32], [x0 + w * 0.32, yb]]) : poly([[x0 + w + 4, yb], [x0 + w + lean * 0.12, yb - h * 0.32], [x0 + w * 0.68, yb]]));
  // groups, back to front: restaurant, opera theatre (behind, left), concert hall (front, right)
  const groups = [
    [[560, 90, 140, -20], [610, 100, 180, -26]],
    [[900, 200, 330, 34], [690, 150, 240, -30], [760, 190, 340, -42], [840, 210, 410, -52]],
    [[1270, 220, 400, 40], [990, 170, 290, -36], [1070, 220, 410, -52], [1160, 250, 520, -66]],
  ];
  for (const g of groups) {
    P.layer(C.indigo, g.map((s) => mouth(...s)).join(''), { speck: 0.3, opacity: 0.8, rough: 2 });
    for (const s of g) {
      P.layer(C.white, path(shell(...s)), { speck: 0.1, rough: 2, micro: 1.2, dx: 0, dy: 0 });
      let rib = '';
      const [x0, w, h, lean] = s;
      for (let k = 1; k < 7; k++) {
        const t = k / 7;
        const bx = lean < 0 ? x0 + w * t : x0 + w * (1 - t);
        const ax = (lean < 0 ? x0 : x0 + w) + lean;
        rib += stroke(`M${bx},${podium} Q${(bx + ax) / 2 + (lean < 0 ? w * 0.12 : -w * 0.12)},${podium - h * 0.62} ${ax},${podium - h + 4}`, 2);
      }
      P.layer(C.stone, path(shadeOf(...s)) + rib, { speck: 0.45, opacity: 0.5, rough: 2, micro: 1, dx: 0, dy: 0 });
    }
  }
  // podium
  P.layer('#d4a47a', rect(500, podium, 1000, 66) + poly([[520, podium + 66], [1480, podium + 66], [1480, podium + 104], [480, podium + 104]]), { speck: 0.3 });
  let steps = '';
  for (let k = 0; k < 6; k++) steps += rect(500, podium + 8 + k * 10, 1000, 3);
  P.layer(C.ink, steps, { speck: 0.4, opacity: 0.35, rough: 2, micro: 1 });

  // harbour
  P.wash(C.sky, rect(380, podium + 104, 1100, 400), { mask: true });
  let refl = '';
  for (let y = podium + 116; y < podium + 320; y += P.rand(10, 18)) refl += rect(P.rand(620, 1440), y, P.rand(50, 160), 6);
  P.layer(C.white, refl, { mask: true, speck: 0.3 });
  P.layer(C.indigo, waterLines(P, 380, 1500, podium + 126, 1920, { gap: 22, th: 5 }), { mask: true });
  P.layer(C.white, poly([[820, 1800], [820, 1660], [880, 1800]]) + poly([[812, 1806], [812, 1690], [770, 1806]]), { speck: 0.15 });
  P.layer(C.ink, rect(760, 1806, 140, 14, 'rx="6"') + rect(818, 1650, 4, 160), { speck: 0.2 });
  P.layer(C.ink, birds([[720, 900, 1.5], [790, 870, 1.1]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[400, podium, 1440, podium], [400, podium + 104, 1440, podium + 104], [1098, 900, 1098, 1700], [560, 1900, 1300, 960]]) + hatch(P, 400, 1460, 280, 360, { angle: 25, gap: 11 }), { opacity: 0.28 });
}

// ─── 15. Oia, Santorini ────────────────────────────────────────
function oia(P) {
  const blue = '#2f5f9e';
  P.dissolve({ cx: 1080, cy: 1380, rx: 760, ry: 820, soft: 0.45, freq: 0.02 });
  P.wash(P.grad([[0, C.ochre, 0], [0.45, C.ochre, 0.4], [1, C.verm, 0.25]], 0, 760, 0, 1400), rect(380, 760, 1100, 640), { mask: true });
  P.layer(C.verm, circle(620, 1300, 70), { speck: 0.25 });
  // sea
  P.wash(P.grad([[0, C.indigo, 0.55], [1, C.indigo, 0.85]], 0, 1360, 0, 1920), rect(380, 1360, 1100, 560), { mask: true });
  P.layer(C.ochre, waterLines(P, 440, 820, 1370, 1460, { gap: 12, th: 4, maxLen: 120 }), { mask: true, opacity: 0.8 });
  P.layer(C.sky, waterLines(P, 380, 1500, 1470, 1920, { gap: 24, th: 4, fill: 0.4 }), { mask: true, opacity: 0.7 });
  // caldera cliff
  const cliff = smooth([[700, 1940], [740, 1640], [820, 1520], [940, 1400], [1080, 1250], [1240, 1100], [1440, 960], [1500, 950], [1500, 1940]], true, 0.4);
  P.layer(P.grad([[0, '#c08060', 1], [0.6, '#9a5a42', 1], [1, '#6d4436', 1]], 0, 950, 0, 1940), path(cliff), { speck: 0.35, rough: 8 });
  let strata = '';
  for (let k = 0; k < 40; k++) {
    const y = P.rand(1150, 1900), x = P.rand(720, 1440), l = P.rand(60, 220);
    strata += path(`M${x},${y} l${l},${P.rand(-14, 6)} l${P.rand(-10, 10)},${P.rand(10, 26)} l-${l * P.rand(0.6, 1)},${P.rand(-6, 8)} z`);
  }
  P.layer(C.ink, `<clipPath id="clf"><path d="${cliff}"/></clipPath><g clip-path="url(#clf)">${strata}</g>`, { opacity: 0.28, speck: 0.5, rough: 6 });
  let strata2 = '';
  for (let k = 0; k < 26; k++) {
    const y = P.rand(1100, 1800), x = P.rand(720, 1440), l = P.rand(40, 160);
    strata2 += path(`M${x},${y} l${l},${P.rand(-10, 6)} l0,${P.rand(8, 16)} l-${l},0 z`);
  }
  P.layer(C.ochre, `<clipPath id="clf2"><path d="${cliff}"/></clipPath><g clip-path="url(#clf2)">${strata2}</g>`, { opacity: 0.5, speck: 0.45, rough: 5 });

  // white cubes, stepped down the cliff
  const cubes = [];
  const rows = [[1000, 1180, 4], [1090, 1060, 5], [1180, 960, 6], [1270, 880, 7], [1360, 860, 7], [1450, 900, 6], [1540, 980, 5], [1630, 1080, 4], [1720, 1200, 3]];
  for (const [y, x0, n] of rows) {
    let x = x0;
    for (let i = 0; i < n && x < 1480; i++) {
      const w = P.rand(70, 120), h = P.rand(60, 95);
      cubes.push([x, y - h + P.rand(-12, 12) + (x - x0) * -0.08, w, h + 30]);
      x += w + P.rand(-8, 10);
    }
  }
  cubes.sort((a, b) => a[1] - b[1]);
  P.layer(C.white, cubes.map(([x, y, w, h]) => rect(x, y, w, h, 'rx="4"')).join(''), { speck: 0.1, rough: 3 });
  P.layer(C.sky, cubes.map(([x, y, w, h]) => rect(x + w * 0.72, y, w * 0.28, h)).join(''), { speck: 0.35, opacity: 0.75 });
  let doors = '';
  for (const [x, y, w, h] of cubes) {
    if (P.r() < 0.7) doors += arch(x + w * 0.25, y + h * 0.45, 14, 22);
    if (P.r() < 0.5) doors += rect(x + w * 0.5, y + h * 0.35, 12, 14);
  }
  P.layer(blue, doors, { speck: 0.3, rough: 2, micro: 1, opacity: 0.85 });
  // churches with blue domes + bell tower
  const domes = [[1070, 1010, 62], [1270, 930, 54], [930, 1200, 50]];
  let ch = '', dm = '';
  for (const [x, y, r] of domes) {
    ch += rect(x - r - 6, y, 2 * r + 12, 120) + rect(x - r * 0.75, y - r * 0.15, r * 1.5, 30);
    dm += path(`M${x - r},${y} A${r},${r * 1.05} 0 0 1 ${x + r},${y} Z`) + rect(x - 3, y - r * 1.05 - 26, 6, 28) + rect(x - 11, y - r * 1.05 - 16, 22, 5);
  }
  ch += rect(1150, 950, 56, 150) + rect(1144, 940, 68, 14) + poly([[1154, 942], [1202, 942], [1178, 900]]);
  P.layer(C.white, ch, { speck: 0.1, rough: 3 });
  P.layer(blue, dm, { speck: 0.2, rough: 3 });
  P.layer(C.ink, arch(1166, 980, 24, 34) + arch(1166, 1040, 24, 30) + circle(1178, 1004, 6), { speck: 0.2, rough: 1.5, micro: 1, opacity: 0.8 });
  P.layer(C.sky, domes.map(([x, y, r]) => path(`M${x + r * 0.2},${y - r * 0.9} A${r},${r} 0 0 1 ${x + r},${y} L${x + r * 0.55},${y} Z`)).join(''), { speck: 0.4, opacity: 0.35 });
  P.layer(C.verm, circle(1240, 1120, 8) + circle(1258, 1126, 6) + circle(1000, 1290, 7) + circle(1340, 1210, 7), { speck: 0.3, opacity: 0.85 }); // bougainvillea dots
  P.layer(C.ink, birds([[700, 880, 1.5], [760, 850, 1.1]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[400, 1360, 1440, 1360], [620, 1200, 620, 1500], [700, 1940, 1500, 1100], [1010, 860, 1010, 1300]]) + hatch(P, 400, 1460, 300, 400, { angle: 20, gap: 12 }), { opacity: 0.26 });
}

// ─── 16. Tower Bridge ──────────────────────────────────────────
function towerBridge(P) {
  const blue = '#8fabbd';
  const deck = 1400, water = 1520;
  const towers = [740, 1170], tw = 160;
  P.dissolve({ cx: 1080, cy: 1340, rx: 760, ry: 820, soft: 0.45, freq: 0.02 });
  P.wash(P.grad([[0, C.sky, 0], [0.5, C.sky, 0.85], [1, C.sand, 0.6]], 0, 640, 0, 1500), rect(380, 640, 1100, 860), { mask: true });

  // suspension chains on the side spans
  let ch = '';
  const leftC = sag(towers[0], 960, 420, 1330, 50, 20), rightC = sag(towers[1] + tw, 960, 1500, 1330, 50, 20);
  for (const c of [leftC, rightC]) {
    ch += stroke('M' + c.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' L'), 14);
    for (const [x, y] of c.slice(1, -1)) ch += rect(x - 1.5, y, 3, deck - y);
  }
  P.layer(blue, ch, { speck: 0.3, rough: 2, micro: 1.2, mask: true });
  // walkways between the towers (lattice)
  const lat = lattice(P, 26, 3, C.white);
  P.layer(blue, rect(towers[0] + tw - 10, 880, towers[1] - towers[0] - tw + 20, 70), { speck: 0.25 });
  P.layer(C.white, `<g fill="url(#${lat})">${rect(towers[0] + tw, 892, towers[1] - towers[0] - tw, 46)}</g>`, { speck: 0.3, rough: 1.5, micro: 1, opacity: 0.85 });
  // deck (bascules) + side spans
  P.layer(blue, rect(420, deck, 1100, 26), { speck: 0.3, mask: true });
  P.layer(C.white, rect(420, deck + 8, 1100, 6), { speck: 0.3, mask: true, opacity: 0.8 });

  // towers
  let t = '', sh = '', rf = '', win = '';
  for (const x of towers) {
    t += rect(x, 860, tw, water - 860);
    t += rect(x - 12, 860, 26, water - 860) + rect(x + tw - 14, 860, 26, water - 860); // corner turrets
    sh += rect(x + tw * 0.6, 860, tw * 0.4, water - 860) + rect(x + tw - 14, 860, 26, water - 860);
    rf += poly([[x + 6, 864], [x + tw - 6, 864], [x + tw - 30, 770], [x + 30, 770]]) + poly([[x + 30, 772], [x + tw - 30, 772], [x + tw / 2, 700]]) + rect(x + tw / 2 - 2, 650, 4, 54);
    for (const tx of [x - 12, x + tw - 14]) rf += poly([[tx - 4, 864], [tx + 30, 864], [tx + 13, 760]]) + rect(tx + 11, 736, 4, 28);
    win += lancet(x + 34, 970, 18, 60) + lancet(x + 58, 970, 18, 60) + lancet(x + tw - 76, 970, 18, 60) + lancet(x + tw - 52, 970, 18, 60);
    win += lancet(x + 40, 1100, 24, 60) + lancet(x + tw - 64, 1100, 24, 60) + rect(x - 6, 900, 10, 26) + rect(x - 6, 1000, 10, 26) + rect(x + tw - 4, 900, 10, 26) + rect(x + tw - 4, 1000, 10, 26);
    win += lancet(x + tw / 2 - 30, 1250, 60, deck - 1250); // arch over the roadway
    win += rect(x + tw / 2 - 12, 800, 24, 40);
  }
  P.layer('#ece0c6', t, { speck: 0.12, rough: 3 });
  P.layer(C.stone, sh, { speck: 0.35, opacity: 0.8 });
  P.layer(C.stone, towers.map((x) => [940, 1060, 1180, 1200].map((y) => rect(x - 14, y, tw + 28, 8)).join('')).join(''), { speck: 0.35 });
  P.layer(C.indigo, rf, { speck: 0.25, rough: 3 });
  P.layer(C.ink, win, { speck: 0.3, rough: 2, micro: 1.2, opacity: 0.85 });
  // piers
  P.layer(C.stone, towers.map((x) => rect(x - 30, water - 20, tw + 60, 60)).join(''), { speck: 0.35 });

  // Thames
  P.wash(P.grad([[0, C.ochre, 0.5], [1, C.sky, 0.7]], 0, water, 0, 1920), rect(380, water + 30, 1100, 400), { mask: true });
  let refl = '';
  for (let y = water + 50; y < water + 260; y += P.rand(10, 18)) for (const x of towers) refl += rect(x + P.rand(-10, tw - 40), y, P.rand(30, 70), 6);
  P.layer(C.white, refl, { mask: true, speck: 0.35 });
  P.layer(C.indigo, waterLines(P, 380, 1500, water + 40, 1920, { gap: 22, th: 5 }), { mask: true });
  // boat
  P.layer(C.verm, path('M900,1760 L1180,1760 L1160,1790 L920,1790 Z'), { speck: 0.2 });
  P.layer(C.white, rect(960, 1724, 150, 36), { speck: 0.15 });
  P.layer(C.ink, [0, 1, 2, 3, 4].map((k) => rect(972 + k * 28, 1734, 14, 12)).join('') + rect(1060, 1700, 14, 26), { speck: 0.2 });
  P.layer(C.ink, birds([[640, 820, 1.5], [700, 790, 1.1]]), { rough: 2, speck: 0.15, micro: 1 });
  P.pencil(construction([[400, deck, 1440, deck], [400, water, 1440, water], [towers[0] + tw / 2, 600, towers[0] + tw / 2, 1700], [towers[1] + tw / 2, 600, towers[1] + tw / 2, 1700], [400, 880, 1440, 880]]) + hatch(P, 400, 1460, 280, 380, { angle: 60 }), { opacity: 0.28 });
}

export const SCENES_WORLD = [
  { slug: 'eiffelturm', seed: 91, paper: '#f0e4cc', focus: '90% 90%', mfocus: '90% 94%', place: 'Eiffelturm · Paris', de: 'Eisen, leicht wie Spitze.', en: 'Iron, light as lace.', draw: eiffelturm },
  { slug: 'rialto', seed: 101, paper: '#efe2c8', focus: '90% 90%', mfocus: '90% 94%', place: 'Rialtobrücke · Venedig', de: 'Die Stadt schwimmt im Licht.', en: 'The city floats in the light.', draw: rialto },
  { slug: 'fushimi-inari', seed: 111, paper: '#efe4cf', focus: '90% 90%', mfocus: '90% 94%', place: 'Fushimi Inari · Kyōto', de: 'Tausend Tore in den Wald.', en: 'A thousand gates into the forest.', draw: fushimiInari },
  { slug: 'fuji', seed: 121, paper: '#f0e6d2', focus: '90% 90%', mfocus: '90% 94%', place: 'Fuji & Chureito-Pagode · Japan', de: 'Der Frühling wartet am Berg.', en: 'Spring waits at the mountain.', draw: fuji },
  { slug: 'golden-gate', seed: 131, paper: '#ede3cf', focus: '90% 90%', mfocus: '90% 94%', place: 'Golden Gate Bridge · San Francisco', de: 'Der Nebel kommt leise.', en: 'The fog comes quietly.', draw: goldenGate },
  { slug: 'sydney-opera', seed: 141, paper: '#eee4cf', focus: '90% 90%', mfocus: '90% 94%', place: 'Opernhaus · Sydney', de: 'Segel aus Stein am Hafen.', en: 'Sails of stone in the harbour.', draw: sydneyOpera },
  { slug: 'oia-santorini', seed: 151, paper: '#f1e8d6', focus: '90% 90%', mfocus: '90% 94%', place: 'Oia · Santorini', de: 'Das Licht trifft das Meer.', en: 'The light meets the sea.', draw: oia },
  { slug: 'tower-bridge', seed: 161, paper: '#ece2cc', focus: '90% 90%', mfocus: '90% 94%', place: 'Tower Bridge · London', de: 'Die Brücke öffnet sich.', en: 'The bridge opens up.', draw: towerBridge },
];
