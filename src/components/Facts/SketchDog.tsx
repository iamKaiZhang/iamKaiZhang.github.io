'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { COS, P, SIN, mix, pts, scribble, shifted } from '@/components/Sketch/ink';
import type { V2, V3 } from '@/components/Sketch/ink';

// The dog as a loose pen sketch, in the same hand as the snowboarder. It
// wags, breathes and watches the bone. Drag the bone to the bowl (or click
// it) and the dog eats, then hops with a heart. The one spot of color is on
// what matters to the dog: its collar, the bone and the heart.

const VIEW = { x: -46, y: -52, w: 104, h: 88 };
const BONE_REST: V2 = P(-10, 26, 0);
const BOWL: V2 = P(37, 2, 4);
const HEAD: V2 = P(19, 0, 29);
const FEED_RADIUS = 14;
const EAT_MS = 1400;
const HAPPY_MS = 2300;

type Phase = 'idle' | 'eating' | 'happy';

interface TubeProps {
  line: V2[];
  width: number;
  folds?: number;
  side?: number;
  fill?: string;
}

// A round-capped tube: ink outline, paper fill, a looser second pen pass
// and optional fur scribbles.
const Tube = ({ line, width, folds, side = 1, fill = 'paper' }: TubeProps) => (
  <g>
    <polyline className="ink" strokeWidth={width + 0.8} points={pts(line)} />
    <polyline className={fill} strokeWidth={width} points={pts(line)} />
    <polyline className="ink loose" points={pts(shifted(line, side * (width / 2 + 1.1)))} />
    {folds && (
      <polyline
        className="ink loose"
        points={pts(scribble(line[line.length - 2], line[line.length - 1], width * 0.24, folds))}
      />
    )}
  </g>
);

interface DogProps {
  t: number; // animation time in ms
  phase: Phase;
  phaseT: number; // ms since the phase began
  yaw: number; // where the head is turned
  eager: boolean; // the bone is close to the bowl
}

const Dog = ({ t, phase, phaseT, yaw, eager }: DogProps) => {
  const eating = phase === 'eating';
  const happy = phase === 'happy';

  const breathe = 0.4 * Math.sin(t / 700);
  const hop = happy ? Math.max(0, Math.sin((phaseT / 260) * Math.PI)) * 3.2 : 0;
  const wagRate = happy ? 70 : eating || eager ? 110 : 300;
  const wag = Math.sin(t / wagRate) * (happy ? 8 : 5);
  // An ear flick every few seconds
  const flick = Math.max(0, Math.sin(t / 130)) * (Math.sin(t / 2100) > 0.94 ? 1 : 0);

  const at = (x: number, y: number, z: number): V2 => P(x, y, z + hop);

  // Head: turns toward what the dog is watching, drops into the bowl to eat
  const neckBase: V3 = [11, 0, 20];
  const headBase: V3 = eating ? [22, 0, 21.5] : [19, 0, 29 + breathe];
  const pitch = eating ? 0.8 + 0.2 * Math.sin(phaseT / 85) : happy ? -0.2 : 0;
  const turn = eating ? 0 : yaw;
  const hp = (along: number, lat: number, up: number): V2 => {
    const a = along * Math.cos(pitch) + up * Math.sin(pitch);
    const u = -along * Math.sin(pitch) + up * Math.cos(pitch);
    return at(
      headBase[0] + a * Math.cos(turn) - lat * Math.sin(turn),
      headBase[1] + a * Math.sin(turn) + lat * Math.cos(turn),
      headBase[2] + u,
    );
  };

  const leg = (x: number, lat: number, hind: boolean): V2[] =>
    hind
      ? [at(x, lat, 13), at(x - 3.5, lat, 7.5), at(x, lat, 1.8)]
      : [at(x, lat, 14), at(x + 1, lat, 1.8)];
  const paw = (x: number, lat: number): V2[] => [at(x, lat, 1.6), at(x + 3, lat, 1.6)];

  const collarAt = mix(neckBase, headBase, 0.6);
  const collar = [-4, 4].map(
    (lat): V2 => at(collarAt[0], collarAt[1] + lat, collarAt[2] - lat * 0.18),
  );
  const [heartX, heartY] = at(headBase[0] + 3, 0, headBase[2] + 15 + Math.sin(t / 260) * 0.8);

  return (
    <>
      <Tube line={[at(-15, 0, 20), at(-19, 0, 25), at(-20.5, wag, 29)]} width={2.8} />
      <Tube line={leg(-13, -4.5, true)} width={4.4} side={-1} />
      <Tube line={paw(-13, -4.5)} width={4.6} />
      <Tube line={leg(11, -4, false)} width={4.4} side={-1} />
      <Tube line={paw(12, -4)} width={4.6} />
      <Tube line={[at(-14, 0, 16.5), at(12, 0, 18 + breathe)]} width={13} />
      <Tube line={leg(-13, 4.5, true)} width={4.4} />
      <Tube line={paw(-13, 4.5)} width={4.6} />
      <Tube line={leg(11, 4, false)} width={4.4} />
      <Tube line={paw(12, 4)} width={4.6} />
      <Tube line={[at(...neckBase), at(...headBase)]} width={8} />
      <g className="lit" filter="url(#dog-glow)">
        <polyline className="spot collar" points={pts(collar)} />
      </g>

      <Tube line={[hp(0.5, -4.8, 5.5), hp(-1.5, -6.4, -2.5 + flick)]} width={3.4} folds={3} />
      <Tube line={[hp(0, 0, 1.8), hp(6.5, 0, 1.8)]} width={12.5} />
      <Tube line={[hp(7, 0, 0), hp(14.5, 0, -1.5)]} width={7} />
      <polyline className="ink loose" points={pts([hp(9, 3, -3.6), hp(14, 1.8, -4.3)])} />
      {happy && (
        <polyline className="spot tongue" points={pts([hp(12, 1, -4.6), hp(12.5, 1.6, -8.6)])} />
      )}
      <Tube line={[hp(0.5, 4.8, 5.5), hp(-1.5, 6.4, -2.5 + flick)]} width={3.4} folds={3} />

      {happy && (
        <g
          className="lit heart"
          filter="url(#dog-glow)"
          transform={`translate(${heartX.toFixed(1)} ${heartY.toFixed(1)}) scale(0.5)`}
        >
          <path d="M0,8 L-9,-2 A5,5 0 0 1 0,-6 A5,5 0 0 1 9,-2 Z" />
        </g>
      )}
    </>
  );
};

// The bone: a round shaft with two knuckles at each end. It has volume
// (highlights on top, shading underneath) and casts a shadow on the ground,
// which it lifts away from when picked up.
const BONE_A: V2 = P(-5, 0, 0);
const BONE_B: V2 = P(5, 0, 0);
const KNUCKLES: V2[] = [BONE_A, BONE_B].flatMap((end): V2[] => [
  [end[0] - 1.1, end[1] + 1.7],
  [end[0] + 1.1, end[1] - 1.7],
]);

const Bone = ({ lift }: { lift: number }) => (
  <>
    <ellipse
      className="shadow"
      cx={0}
      cy={1.2}
      rx={8.5 - lift * 0.35}
      ry={3 - lift * 0.15}
      opacity={0.2}
    />
    <g className="lit" filter="url(#dog-glow)" transform={`translate(0 ${-2.2 - lift})`}>
      <polyline className="spot shaft" points={pts([BONE_A, BONE_B])} />
      {KNUCKLES.map(([cx, cy]) => (
        <circle key={`${cx},${cy}`} className="knob" cx={cx} cy={cy} r={2.5} />
      ))}
      <polyline className="paper" strokeWidth={3} points={pts([BONE_A, BONE_B])} />
      {KNUCKLES.map(([cx, cy]) => (
        <circle key={`${cx},${cy}`} className="paper-fill" cx={cx} cy={cy} r={1.9} />
      ))}
      {/* Shading under the shaft, highlights on top of the knuckles */}
      {[-2.4, -0.8, 0.8, 2.4].map((f) => (
        <polyline
          key={f}
          className="spot shade"
          points={pts([
            [f * 0.866 - 0.3, f * 0.5 + 0.3],
            [f * 0.866 + 0.5, f * 0.5 + 1.3],
          ])}
        />
      ))}
      {KNUCKLES.map(([cx, cy]) => (
        <path
          key={`${cx},${cy}`}
          className="spot shade"
          d={`M${(cx - 1.1).toFixed(1)},${(cy - 0.4).toFixed(1)} a1.2,1.2 0 0 1 1.3,-0.9`}
        />
      ))}
    </g>
  </>
);

export default function SketchDog() {
  const svgRef = useRef<SVGSVGElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const grab = useRef<V2 | null>(null); // pointer offset inside the bone while dragging
  const sim = useRef({ t: 0, phaseStart: 0, yaw: 0, look: BONE_REST });

  const [phase, setPhase] = useState<Phase>('idle');
  const [bone, setBone] = useState<V2>(BONE_REST);
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState(false);
  // The first frame is a fixed pose: it is what the server renders and what
  // stays on screen under prefers-reduced-motion.
  const [frame, setFrame] = useState({ t: 0, yaw: 0.35 });

  const lookAt = useCallback((p: V2) => {
    sim.current.look = p;
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const pending = timers.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => pending.forEach(clearTimeout);
    }

    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const s = sim.current;
      const dt = last ? Math.min(now - last, 50) : 0;
      last = now;
      s.t += dt;
      // Turn the watched point into a head angle on the ground plane
      const a = (s.look[0] - HEAD[0]) / COS;
      const b = (s.look[1] - HEAD[1] + 8) / SIN;
      const target = Math.max(
        -0.3,
        Math.min(0.55, Math.atan2((b - a) / 2, Math.max((a + b) / 2, 6))),
      );
      s.yaw += (target - s.yaw) * Math.min(1, dt / 140);
      setFrame({ t: s.t, yaw: s.yaw });
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
      pending.forEach(clearTimeout);
    };
  }, []);

  const enter = useCallback((next: Phase) => {
    sim.current.phaseStart = sim.current.t;
    setPhase(next);
  }, []);

  const toSvg = useCallback((clientX: number, clientY: number): V2 => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [
      VIEW.x + ((clientX - rect.left) / rect.width) * VIEW.w,
      VIEW.y + ((clientY - rect.top) / rect.height) * VIEW.h,
    ];
  }, []);

  const nearBowl = (p: V2) => Math.hypot(p[0] - BOWL[0], p[1] - BOWL[1]) < FEED_RADIUS;

  const eat = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current.length = 0;
    setDragging(false);
    setFlying(false);
    setBone(BOWL);
    lookAt(BOWL);
    enter('eating');
    timers.current.push(
      setTimeout(() => enter('happy'), EAT_MS),
      setTimeout(() => {
        enter('idle');
        setBone(BONE_REST);
        lookAt(BONE_REST);
      }, EAT_MS + HAPPY_MS),
    );
  }, [enter, lookAt]);

  // Click or keyboard: the bone flies to the bowl on its own.
  const toss = useCallback(() => {
    if (phase !== 'idle' || flying) return;
    setFlying(true);
    setBone(BOWL);
    lookAt(BOWL);
    timers.current.push(setTimeout(eat, 520));
  }, [eat, flying, lookAt, phase]);

  const onBoneDown = (event: React.PointerEvent<SVGGElement>) => {
    if (phase !== 'idle' || flying) return;
    const p = toSvg(event.clientX, event.clientY);
    grab.current = [p[0] - bone[0], p[1] - bone[1]];
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const onBoneMove = (event: React.PointerEvent<SVGGElement>) => {
    if (!grab.current) return;
    const p = toSvg(event.clientX, event.clientY);
    const next: V2 = [p[0] - grab.current[0], p[1] - grab.current[1]];
    setBone(next);
    lookAt(next);
  };

  const onBoneUp = () => {
    if (!grab.current) return;
    const moved = Math.hypot(bone[0] - BONE_REST[0], bone[1] - BONE_REST[1]) > 1.5;
    grab.current = null;
    setDragging(false);
    if (nearBowl(bone)) eat();
    else if (!moved) toss();
    else {
      setBone(BONE_REST);
      lookAt(BONE_REST);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    toss();
  };

  // The dog watches the pointer, or the bone while it is being carried.
  const onPointerMove = (event: React.PointerEvent) => {
    if (phase === 'idle' && !grab.current && !flying) lookAt(toSvg(event.clientX, event.clientY));
  };

  const phaseT = frame.t - sim.current.phaseStart;
  const eager = dragging && nearBowl(bone);
  // The bone shrinks as it is eaten
  const boneScale =
    phase === 'eating' ? Math.max(0, 1 - phaseT / EAT_MS) : phase === 'happy' ? 0 : 1;
  const rx = 7.6 * 1.2247;
  const ry = 7.6 * 0.7071;

  return (
    <>
      <div
        className={`sketch sketch-dog${dragging ? ' is-dragging' : ''}`}
        ref={rootRef}
        onPointerMove={onPointerMove}
        onPointerLeave={() => phase === 'idle' && !grab.current && !flying && lookAt(BONE_REST)}
      >
        <svg
          ref={svgRef}
          viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
          role="img"
          aria-label="Pen sketch of a dog with a bowl. Drag the bone to the bowl to feed it, or focus the bone and press space."
        >
          <defs>
            <filter
              id="dog-glow"
              filterUnits="userSpaceOnUse"
              x={VIEW.x}
              y={VIEW.y}
              width={VIEW.w}
              height={VIEW.h}
            >
              <feGaussianBlur stdDeviation="0.9" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Hand-drawn wobble that "boils": the seed steps a few times a second */}
            <filter
              id="dog-boil"
              filterUnits="userSpaceOnUse"
              x={VIEW.x}
              y={VIEW.y}
              width={VIEW.w}
              height={VIEW.h}
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.09"
                numOctaves="2"
                seed={1 + (Math.floor(frame.t / 170) % 5)}
              />
              <feDisplacementMap
                in="SourceGraphic"
                scale="1.9"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>

          <g filter="url(#dog-boil)">
            <ellipse
              className="shadow"
              cx={P(0, 0, 0)[0]}
              cy={P(0, 0, 0)[1] + 1}
              rx={26}
              ry={8}
              opacity={0.1}
            />
            <Dog t={frame.t} phase={phase} phaseT={phaseT} yaw={frame.yaw} eager={eager} />

            {/* Bowl */}
            <path
              className="deck"
              d={`M${BOWL[0] - rx},${BOWL[1]} Q${BOWL[0] - rx * 0.85},${BOWL[1] + 7.5} ${BOWL[0] - rx * 0.55},${BOWL[1] + 8} L${BOWL[0] + rx * 0.55},${BOWL[1] + 8} Q${BOWL[0] + rx * 0.85},${BOWL[1] + 7.5} ${BOWL[0] + rx},${BOWL[1]} Z`}
            />
            <ellipse className="deck" cx={BOWL[0]} cy={BOWL[1]} rx={rx} ry={ry} />
            <ellipse
              className="ink loose"
              cx={BOWL[0]}
              cy={BOWL[1] + 0.4}
              rx={rx * 0.74}
              ry={ry * 0.72}
            />

            <g
              className={`bone${flying ? ' is-flying' : ''}`}
              style={{ transform: `translate(${bone[0]}px, ${bone[1]}px) scale(${boneScale})` }}
              role="button"
              tabIndex={0}
              aria-label="Bone. Press space to feed the dog."
              onPointerDown={onBoneDown}
              onPointerMove={onBoneMove}
              onPointerUp={onBoneUp}
              onPointerCancel={onBoneUp}
              onKeyDown={onKeyDown}
            >
              <circle className="grab" r="9" />
              <Bone lift={dragging || flying ? 3.5 : 0} />
            </g>
          </g>
        </svg>
      </div>
      <div className="sketch-meta">
        <span>Drag the bone to the bowl, or click it</span>
        <a href="https://iso-glow.vercel.app">
          Made with ISO-GLOW
          <svg viewBox="0 0 12 12" aria-hidden="true">
            <path d="M3 9 9 3M4.5 3H9v4.5" />
          </svg>
        </a>
      </div>
    </>
  );
}
