'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { P, flat, mix, pts, scribble, shifted } from '@/components/Sketch/ink';
import type { V2, V3 } from '@/components/Sketch/ink';

// A snowboarder drawn as a loose pen sketch. The rider carves in place:
// speed streaks, snow spray and a carved track show the motion. Clicking
// (or space/enter) throws the next trick.

const OMEGA = (2 * Math.PI) / 2400; // one full toe-heel carve cycle
const SPEED = 0.05; // drawing units the snow moves per millisecond

const MOVES = [
  { name: 'ollie', spins: 0, height: 15, ms: 700 },
  { name: '360', spins: 1, height: 21, ms: 880 },
  { name: '720', spins: 2, height: 26, ms: 1080 },
];

interface Frame {
  t: number; // simulation time in ms
  jumpStart: number; // -1 while on the snow
  move: number;
  gapFrom: number; // the last stretch spent in the air leaves no track
  gapTo: number;
  tricks: number;
}

// One body part: a round-capped tube drawn as an ink outline with a paper
// fill on top, plus a looser second pen pass and optional fold scribbles.
interface Part {
  key: string;
  points: V3[];
  width: number;
  folds?: number;
  strap?: V3[]; // a binding strap drawn across a boot
}

const STREAKS = [
  { y: -22, len: 13, phase: 0 },
  { y: -14, len: 9, phase: 37 },
  { y: -8, len: 15, phase: 71 },
  { y: 10, len: 11, phase: 19 },
  { y: 17, len: 15, phase: 55 },
  { y: 24, len: 8, phase: 84 },
];

const Sketch = ({ frame }: { frame: Frame }) => {
  const { t } = frame;
  const move = MOVES[frame.move];
  const inAir = frame.jumpStart >= 0;
  const s = inAir ? Math.min(1, (t - frame.jumpStart) / move.ms) : 0;

  // How much of the carving sway applies: none in the air, eased back in
  // after landing.
  const settle = frame.gapTo < 0 ? 1 : Math.min(1, (t - frame.gapTo) / 300);
  const grip = inAir ? Math.max(0, 1 - s * 6) : settle;
  const phase = OMEGA * t;
  const lean = Math.sin(phase) * grip; // +1 toe side, -1 heel side
  const yaw = 0.3 * Math.cos(phase) * grip + 2 * Math.PI * move.spins * s;
  const air = inAir ? move.height * 4 * s * (1 - s) : 0;
  // Crouch: a small bob while carving, a tuck in the air
  const k = inAir ? 1 - 0.2 * Math.sin(Math.PI * s) : 1 - 0.05 * Math.cos(2 * phase) * grip;

  const bx = Math.cos(yaw);
  const by = Math.sin(yaw);
  // Body frame: `along` the board, toward the `toe` edge, and `up`. The
  // lean tilts the body sideways, more the higher up it is.
  const at = (along: number, toe: number, up: number): V3 => {
    const tilt = (lean * up * 9) / 25;
    return [bx * along - by * toe, by * along + bx * toe + tilt, 1 + air + up];
  };

  const hip = at(-0.5, -2.5, 12.5 * k);
  const chest = at(1, 4, 22.5 * k);
  const head = at(2, 5, 29.5 * k);
  // The front hand reaches for the snow on a toe-side carve and grabs the
  // board in the air.
  const reach = inAir ? 1 : Math.max(0, lean);
  const handFront = mix(at(11, 4, 14 * k), inAir ? at(7, 4.5, 3) : at(10.5, 9, 6.5), reach);
  const handBack = at(-11.5, 3.5, 13 * k);

  const parts: Part[] = [
    { key: 'leg-b', width: 7.4, folds: 4, points: [at(-9, 0, 2.5), at(-8, 5.5, 9 * k), hip] },
    { key: 'leg-f', width: 7.4, folds: 4, points: [at(9, 0, 2.5), at(8, 5.5, 9 * k), hip] },
    {
      key: 'boot-b',
      width: 6.2,
      points: [at(-10.5, 0, 3), at(-7, 1, 3)],
      strap: [at(-8.6, -3.2, 5), at(-8.6, 3.8, 5.4)],
    },
    {
      key: 'boot-f',
      width: 6.2,
      points: [at(7, 1, 3), at(10.5, 0, 3)],
      strap: [at(8.6, -3.2, 5), at(8.6, 3.8, 5.4)],
    },
    { key: 'torso', width: 12, folds: 5, points: [hip, chest] },
    { key: 'arm-b', width: 5.2, points: [at(-4.5, 3.5, 22 * k), at(-9, 2.5, 17.5 * k), handBack] },
    { key: 'arm-f', width: 5.2, points: [at(5.5, 4.5, 21.5 * k), at(9, 7, 14 * k), handFront] },
  ];
  // Paint far parts first: nearer means a larger x + y
  const depth = (part: Part) =>
    part.points.reduce((sum, p) => sum + p[0] + p[1], 0) / part.points.length;
  parts.sort((p, q) => depth(p) - depth(q));

  // The board is a flat deck lying on the snow: rounded nose and tail, a
  // slightly narrower waist. It rolls onto its edge with the lean.
  const halfWidth = (along: number) => 5.9 * (0.88 + 0.12 * (along / 21) ** 2);
  const deck = (along: number, across: number): V3 =>
    at(along, across * halfWidth(along), 0.4 + 0.3 * 5.9 * (Math.abs(lean) - across * lean));
  const outline = Array.from({ length: 36 }, (_, i): V2 => {
    const a = (i / 36) * 2 * Math.PI;
    const round = (v: number) => Math.sign(v) * Math.abs(v) ** 0.55;
    return flat(deck(21 * round(Math.cos(a)), round(Math.sin(a))));
  });
  const [glowX, glowY] = flat(deck(0, 0));
  // Quick slanted marker strokes across the deck
  const hatch = Array.from({ length: 17 }, (_, i) => {
    const along = -17.6 + i * 2.2;
    return [flat(deck(along - 1.3, -0.8)), flat(deck(along + 1.3, 0.8))];
  });
  const [hx, hy] = flat(head);
  const [hoodX, hoodY] = flat(at(0.4, 3.6, 27.5 * k));

  // The carved track trails behind the board and drifts away with the
  // snow. Nothing is carved while the rider is in the air.
  const gapTo = inAir ? Infinity : frame.gapTo;
  const track: { d: number; p: V2 }[][] = [[]];
  for (let d = 0; d <= 51; d += 3) {
    const then = t - d / SPEED;
    if (then > frame.gapFrom && then < gapTo) {
      if (track[track.length - 1].length) track.push([]);
    } else {
      const off = 5 * (Math.sin(OMEGA * then) - Math.sin(phase));
      track[track.length - 1].push({ d, p: P(-20 - d, off, 0.3) });
    }
  }

  // Snow thrown to the outside of the turn
  const edge = Math.sign(lean) || 1;
  const sprayOn = Math.max(0, Math.min(1, (Math.abs(lean) - 0.35) * 2.5));

  return (
    <>
      <g filter="url(#sketch-boil)">
        {track.map((run) => (
          <React.Fragment key={run[0]?.d ?? -1}>
            <polyline
              className="ink track"
              points={pts(run.filter((q) => q.d >= 15).map((q) => q.p))}
            />
            <polyline
              className="spot trail lit"
              filter="url(#sketch-glow)"
              points={pts(run.filter((q) => q.d <= 18).map((q) => q.p))}
            />
          </React.Fragment>
        ))}

        {STREAKS.map((streak) => {
          const f = ((t * SPEED + streak.phase) % 70) / 70;
          const x = 30 - 70 * f;
          return (
            <polyline
              key={streak.y}
              className="ink streak"
              opacity={Math.sin(Math.PI * f) * 0.7}
              points={pts([P(x, streak.y, 0), P(x - streak.len, streak.y, 0)])}
            />
          );
        })}

        <ellipse
          className="shadow"
          cx={0}
          cy={1}
          rx={20 - air * 0.3}
          ry={7 - air * 0.1}
          opacity={0.1 - air * 0.002}
        />

        {sprayOn > 0 &&
          [0, 1, 2, 3, 4, 5, 6].map((j) => {
            const u = (t / 520 + j / 7) % 1;
            const [cx, cy] = flat(at(-11 - 15 * u, -edge * (3 + 10 * u), 10 * u - 12 * u * u));
            return (
              <circle
                key={j}
                className="spray"
                cx={cx}
                cy={cy}
                r={0.75}
                opacity={(1 - u) * sprayOn}
              />
            );
          })}

        <ellipse
          className="halo"
          filter="url(#sketch-bloom)"
          cx={glowX}
          cy={glowY}
          rx={21}
          ry={9}
        />
        <polygon className="deck" points={pts(outline)} />
        <g className="lit" filter="url(#sketch-glow-soft)">
          {hatch.map((line) => (
            <polyline key={pts(line)} className="spot" points={pts(line)} />
          ))}
        </g>
        <polygon className="ink loose" points={pts(shifted(outline, 0.9))} />

        {parts.map((part, index) => {
          const line = part.points.map(flat);
          const side = index % 2 ? 1 : -1;
          return (
            <g key={part.key}>
              <polyline className="ink" strokeWidth={part.width + 0.8} points={pts(line)} />
              <polyline className="paper" strokeWidth={part.width} points={pts(line)} />
              <polyline
                className="ink loose"
                points={pts(shifted(line, side * (part.width / 2 + 1.2)))}
              />
              <polyline
                className="ink loose"
                points={pts(shifted(line, -side * (part.width / 2 - 1.1)))}
              />
              {part.strap && <polyline className="ink loose" points={pts(part.strap.map(flat))} />}
              {part.folds && (
                <polyline
                  className="ink loose"
                  points={pts(
                    scribble(
                      line[line.length - 2],
                      line[line.length - 1],
                      part.width * 0.27,
                      part.folds,
                    ),
                  )}
                />
              )}
            </g>
          );
        })}

        {[flat(handBack), flat(handFront)].map(([cx, cy], i) => (
          <circle key={i === 0 ? 'back' : 'front'} className="mitt" cx={cx} cy={cy} r={3} />
        ))}
        <circle className="hood" cx={hoodX} cy={hoodY} r={6.4} />
        <circle className="hood" cx={hx} cy={hy} r={4.9} />
        <path
          className="ink loose"
          d={`M${(hx - 5.6).toFixed(1)},${(hy + 1.5).toFixed(1)} A5.8,5.8 0 0 1 ${(hx + 4).toFixed(1)},${(hy - 4.6).toFixed(1)}`}
        />
        <polyline
          className="goggles"
          points={pts([flat(at(5.6, 5, 30.2 * k)), flat(at(3, 8.6, 30.2 * k))])}
        />
      </g>
    </>
  );
};

const SnowboardFigure: React.FC = () => {
  // The first frame is a fixed toe-side pose: it is what the server renders
  // and what stays on screen under prefers-reduced-motion.
  const [frame, setFrame] = useState<Frame>({
    t: 400,
    jumpStart: -1,
    move: 0,
    gapFrom: -1,
    gapTo: -1,
    tricks: 0,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const sim = useRef<Frame>({ ...frame });

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const s = sim.current;
      // Simulation time only advances while the figure is on screen
      s.t += last ? Math.min(now - last, 50) : 0;
      last = now;
      if (s.jumpStart >= 0 && s.t - s.jumpStart >= MOVES[s.move].ms) {
        s.jumpStart = -1;
        s.gapTo = s.t;
      }
      setFrame({ ...s });
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(raf);
      last = 0;
      if (entry.isIntersecting) raf = requestAnimationFrame(tick);
    });
    observer.observe(root);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  const trick = useCallback(() => {
    const s = sim.current;
    if (s.jumpStart >= 0) return;
    s.move = s.tricks % MOVES.length;
    s.tricks += 1;
    s.jumpStart = s.t;
    s.gapFrom = s.t;
    s.gapTo = -1;
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    trick();
  };

  return (
    <>
      <div
        className="sketch"
        ref={rootRef}
        role="button"
        tabIndex={0}
        aria-label="Animated pen sketch of a snowboarder carving. Press space for a trick."
        onClick={trick}
        onKeyDown={onKeyDown}
      >
        <svg viewBox="-58 -60 100 80" aria-hidden="true">
          <defs>
            {/* Night theme only: a halo on the board's strokes and a pool of light under it */}
            <filter
              id="sketch-glow"
              filterUnits="userSpaceOnUse"
              x="-58"
              y="-60"
              width="100"
              height="80"
            >
              <feGaussianBlur stdDeviation="1.3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id="sketch-glow-soft"
              filterUnits="userSpaceOnUse"
              x="-58"
              y="-60"
              width="100"
              height="80"
            >
              <feGaussianBlur stdDeviation="0.9" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id="sketch-bloom"
              filterUnits="userSpaceOnUse"
              x="-58"
              y="-60"
              width="100"
              height="80"
            >
              <feGaussianBlur stdDeviation="4" />
            </filter>
            {/* Hand-drawn wobble that "boils": the seed steps a few times a second */}
            <filter
              id="sketch-boil"
              filterUnits="userSpaceOnUse"
              x="-58"
              y="-60"
              width="100"
              height="80"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.09"
                numOctaves="2"
                seed={1 + (Math.floor(frame.t / 170) % 5)}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="2.1"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
          <Sketch frame={frame} />
        </svg>
      </div>
      <div className="sketch-meta">
        <span>Click or press space for a trick</span>
        <a href="https://iso-glow.vercel.app">Made with ISO-GLOW ↗</a>
      </div>
    </>
  );
};

export default SnowboardFigure;
