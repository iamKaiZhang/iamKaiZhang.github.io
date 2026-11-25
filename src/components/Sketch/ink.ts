// Shared helpers for the pen-sketch figures (the snowboarder and the dog).
// Figures are posed in 3D, projected isometrically, and drawn as tubes with
// an ink outline, a paper fill and looser second pen passes.

export type V2 = [number, number];
export type V3 = [number, number, number];

export const COS = Math.cos(Math.PI / 6);
export const SIN = Math.sin(Math.PI / 6);

// Isometric projection: +x runs down-right, +y down-left (toward the
// viewer), +z up.
export const P = (x: number, y: number, z: number): V2 => [(x - y) * COS, (x + y) * SIN - z];
export const flat = (v: V3): V2 => P(v[0], v[1], v[2]);
export const pts = (list: V2[]) =>
  list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

// A copy of a line shifted sideways, like a second pass of the pen
export const shifted = (line: V2[], by: number): V2[] =>
  line.map((p, i) => {
    const a = line[Math.max(i - 1, 0)];
    const b = line[Math.min(i + 1, line.length - 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [p[0] - ((b[1] - a[1]) / len) * by, p[1] + ((b[0] - a[0]) / len) * by];
  });

// A quick zigzag between two points: fabric folds, fur
export const scribble = (a: V2, b: V2, amp: number, turns: number): V2[] => {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / len;
  const ny = (b[0] - a[0]) / len;
  return Array.from({ length: turns + 1 }, (_, i): V2 => {
    const f = 0.15 + (0.7 * i) / turns;
    const side = i % 2 ? amp : -amp;
    return [a[0] + (b[0] - a[0]) * f + nx * side, a[1] + (b[1] - a[1]) * f + ny * side];
  });
};

export const mix = (a: V3, b: V3, f: number): V3 => [
  a[0] + (b[0] - a[0]) * f,
  a[1] + (b[1] - a[1]) * f,
  a[2] + (b[2] - a[2]) * f,
];
