'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

const BONE_START = { x: 18, y: 18 };
const SVG_SIZE = { width: 360, height: 260 };
const SVG_MOUTH = { x: 82, y: 150 };
const FEED_DISTANCE = 64;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function InteractiveDog() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const boneRef = useRef<HTMLDivElement>(null);
  const eatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const happyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const draggingRef = useRef(false);
  const bonePosRef = useRef(BONE_START);
  const boneOffsetRef = useRef({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [isEating, setIsEating] = useState(false);
  const [isHappy, setIsHappy] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const [isNearDrop, setIsNearDrop] = useState(false);
  const [isBoneHidden, setIsBoneHidden] = useState(false);

  const clearTimers = useCallback(() => {
    if (eatingTimerRef.current) clearTimeout(eatingTimerRef.current);
    if (happyTimerRef.current) clearTimeout(happyTimerRef.current);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  const clientToLocal = useCallback((clientX: number, clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const setHeadPose = useCallback(
    (headX: number, headY: number, headRotate: number, eyeX: number, eyeY: number) => {
      const head = headRef.current;
      if (!head) return;

      head.style.setProperty('--dog-head-x', `${headX}px`);
      head.style.setProperty('--dog-head-y', `${headY}px`);
      head.style.setProperty('--dog-head-rotate', `${headRotate}deg`);
      head.style.setProperty('--dog-eye-x', `${eyeX}px`);
      head.style.setProperty('--dog-eye-y', `${eyeY}px`);
    },
    [],
  );

  const localToSvg = useCallback((localX: number, localY: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return { x: SVG_MOUTH.x, y: SVG_MOUTH.y };

    const rect = wrap.getBoundingClientRect();
    return {
      x: (localX / rect.width) * SVG_SIZE.width,
      y: (localY / rect.height) * SVG_SIZE.height,
    };
  }, []);

  const setGaze = useCallback(
    (localX: number, localY: number) => {
      if (isEating || isHappy) return;

      const target = localToSvg(localX, localY);
      const dx = target.x - 106;
      const dy = target.y - 130;

      setHeadPose(
        clamp(dx * 0.024, -5.5, 5.5),
        clamp(dy * 0.017, -3.5, 4),
        clamp(dx * 0.034, -9, 9),
        clamp(dx * 0.026, -4.5, 4.5),
        clamp(dy * 0.02, -3.2, 3.2),
      );
    },
    [isEating, isHappy, localToSvg, setHeadPose],
  );

  const getBoneCenter = useCallback(() => {
    const wrap = wrapRef.current;
    const bone = boneRef.current;
    if (!wrap || !bone) return null;

    const wrapRect = wrap.getBoundingClientRect();
    const boneRect = bone.getBoundingClientRect();

    return {
      x: boneRect.left + boneRect.width / 2 - wrapRect.left,
      y: boneRect.top + boneRect.height / 2 - wrapRect.top,
    };
  }, []);

  const setGazeToBone = useCallback(() => {
    const boneCenter = getBoneCenter();
    if (boneCenter) setGaze(boneCenter.x, boneCenter.y);
  }, [getBoneCenter, setGaze]);

  const isBoneNearMouth = useCallback(() => {
    const wrap = wrapRef.current;
    const boneCenter = getBoneCenter();
    if (!wrap || !boneCenter) return false;

    const rect = wrap.getBoundingClientRect();
    const mouth = {
      x: (SVG_MOUTH.x / SVG_SIZE.width) * rect.width,
      y: (SVG_MOUTH.y / SVG_SIZE.height) * rect.height,
    };

    return Math.hypot(boneCenter.x - mouth.x, boneCenter.y - mouth.y) < FEED_DISTANCE;
  }, [getBoneCenter]);

  const moveBone = useCallback(
    (x: number, y: number) => {
      const wrap = wrapRef.current;
      const bone = boneRef.current;
      if (!wrap || !bone) return;

      const maxX = wrap.clientWidth - bone.offsetWidth;
      const maxY = wrap.clientHeight - bone.offsetHeight;
      const next = {
        x: clamp(x, 0, maxX),
        y: clamp(y, 0, maxY),
      };

      bonePosRef.current = next;
      bone.style.left = `${next.x}px`;
      bone.style.top = `${next.y}px`;
      setGaze(next.x + bone.offsetWidth / 2, next.y + bone.offsetHeight / 2);
    },
    [setGaze],
  );

  const resetBone = useCallback(() => {
    moveBone(BONE_START.x, BONE_START.y);
    setIsBoneHidden(false);
    setIsFocused(true);
    requestAnimationFrame(setGazeToBone);
  }, [moveBone, setGazeToBone]);

  const startEating = useCallback(() => {
    clearTimers();
    setIsDragging(false);
    setIsNearDrop(false);
    setIsFocused(false);
    setIsBoneHidden(true);
    setIsEating(true);
    setIsHappy(false);
    setHeadPose(0, 0, 0, 0, 0);

    eatingTimerRef.current = setTimeout(() => {
      setIsEating(false);
      setIsHappy(true);
      setHeadPose(1, -3, 5, 0, -1);
    }, 1150);

    happyTimerRef.current = setTimeout(() => {
      setIsHappy(false);
      setIsFocused(true);
    }, 2700);

    resetTimerRef.current = setTimeout(resetBone, 3300);
  }, [clearTimers, resetBone, setHeadPose]);

  useEffect(() => {
    requestAnimationFrame(setGazeToBone);

    const onResize = () => requestAnimationFrame(setGazeToBone);
    window.addEventListener('resize', onResize);

    return () => {
      clearTimers();
      window.removeEventListener('resize', onResize);
    };
    // Mount/unmount only: setGazeToBone depends on isEating/isHappy, so
    // listing it would re-run this cleanup mid-meal and clear the eating
    // timers, freezing the dog in the eating pose forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onWrapPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (draggingRef.current || isEating || isHappy) return;

      const local = clientToLocal(e.clientX, e.clientY);
      setIsFocused(true);
      setGaze(local.x, local.y);
    },
    [clientToLocal, isEating, isHappy, setGaze],
  );

  const onWrapPointerLeave = useCallback(() => {
    if (draggingRef.current || isEating || isHappy) return;
    setGazeToBone();
  }, [isEating, isHappy, setGazeToBone]);

  const onBonePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isEating || isHappy) return;

      clearTimers();
      draggingRef.current = true;
      setIsDragging(true);
      setIsFocused(true);
      setIsNearDrop(false);
      e.currentTarget.setPointerCapture(e.pointerId);

      const local = clientToLocal(e.clientX, e.clientY);
      boneOffsetRef.current = {
        x: local.x - bonePosRef.current.x,
        y: local.y - bonePosRef.current.y,
      };
      setGaze(local.x, local.y);
    },
    [clearTimers, clientToLocal, isEating, isHappy, setGaze],
  );

  const onBonePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;

      const local = clientToLocal(e.clientX, e.clientY);
      moveBone(local.x - boneOffsetRef.current.x, local.y - boneOffsetRef.current.y);
      setIsNearDrop(isBoneNearMouth());
    },
    [clientToLocal, isBoneNearMouth, moveBone],
  );

  const onBoneKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isEating || isHappy) return;

      const step = e.shiftKey ? 24 : 12;
      const current = bonePosRef.current;
      let next = current;

      if (e.key === 'ArrowLeft') next = { ...current, x: current.x - step };
      if (e.key === 'ArrowRight') next = { ...current, x: current.x + step };
      if (e.key === 'ArrowUp') next = { ...current, y: current.y - step };
      if (e.key === 'ArrowDown') next = { ...current, y: current.y + step };

      if (next !== current) {
        e.preventDefault();
        setIsFocused(true);
        moveBone(next.x, next.y);
        setIsNearDrop(isBoneNearMouth());
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (isBoneNearMouth()) startEating();
      }
    },
    [isBoneNearMouth, isEating, isHappy, moveBone, startEating],
  );

  const finishDrag = useCallback(() => {
    if (!draggingRef.current) return;

    draggingRef.current = false;
    setIsDragging(false);

    if (isBoneNearMouth()) {
      startEating();
      return;
    }

    setIsNearDrop(false);
    setIsFocused(true);
    setGazeToBone();
  }, [isBoneNearMouth, setGazeToBone, startEating]);

  const wrapClass = [
    'dog-wrap',
    isFocused && 'is-focused',
    isDragging && 'is-dragging',
    isEating && 'is-eating',
    isHappy && 'is-happy',
    isNearDrop && 'is-near-drop',
    isBoneHidden && 'is-bone-hidden',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="dog-mascot-wrapper">
      <div
        ref={wrapRef}
        className={wrapClass}
        onPointerLeave={onWrapPointerLeave}
        onPointerMove={onWrapPointerMove}
        aria-label="Interactive dog mascot. Drag the bone to feed the dog."
      >
        <svg className="dog-svg" viewBox="0 0 360 260" role="img" aria-hidden="true">
          <ellipse className="dog-shadow" cx="178" cy="217" rx="104" ry="12" />

          <g className="dog-standing-pose">
            <g className="dog-tail">
              <path
                className="dog-fill-soft"
                d="M230 128 C224 94, 258 78, 276 98 C290 114, 280 138, 258 136 C268 122, 262 108, 248 110 C240 112, 233 119, 230 128 Z"
              />
              <path
                className="dog-line"
                d="M230 128 C224 94, 258 78, 276 98 C290 114, 280 138, 258 136 C268 122, 262 108, 248 110 C240 112, 233 119, 230 128 Z"
              />
            </g>

            <g className="dog-body-group">
              <path
                className="dog-fill-soft"
                d="M122 112 C150 98, 188 100, 214 118 C240 134, 254 160, 248 186 C244 202, 230 210, 212 210 L130 210 C116 210, 107 197, 108 178 C109 152, 112 128, 122 112 Z"
              />
              <path
                className="dog-line"
                d="M122 112 C150 98, 188 100, 214 118 C240 134, 254 160, 248 186 C244 202, 230 210, 212 210 L130 210 C116 210, 107 197, 108 178 C109 152, 112 128, 122 112 Z"
              />
              <path className="dog-line-thin" d="M196 210 C186 192, 190 168, 206 156" />
              <path
                className="dog-fill-soft"
                d="M124 156 L122 198 C122 206, 126 210, 133 210 L143 210 C150 210, 152 205, 151 198 L146 156 Z"
              />
              <path
                className="dog-line"
                d="M124 156 L122 198 C122 206, 126 210, 133 210 L143 210 C150 210, 152 205, 151 198 L146 156"
              />
              <path
                className="dog-line"
                d="M166 168 L166 198 C166 206, 170 210, 177 210 L185 210 C191 210, 193 205, 192 199 L190 172"
              />
              <path
                className="dog-line"
                d="M196 210 C196 202, 202 198, 210 199 C218 200, 222 205, 221 210"
              />
            </g>

            <g className="dog-head" ref={headRef}>
              <path
                className="dog-fill-soft"
                d="M68 96 C58 72, 66 52, 82 46 C90 58, 92 76, 88 92 Z"
              />
              <path className="dog-line" d="M68 96 C58 72, 66 52, 82 46 C90 58, 92 76, 88 92 Z" />
              <path
                className="dog-fill-soft"
                d="M118 90 C118 64, 128 46, 144 44 C150 58, 148 78, 140 94 Z"
              />
              <path
                className="dog-line"
                d="M118 90 C118 64, 128 46, 144 44 C150 58, 148 78, 140 94 Z"
              />
              <path className="dog-line-thin" d="M74 84 C70 72, 72 62, 78 56" />
              <path className="dog-line-thin" d="M128 80 C128 68, 132 58, 138 52" />
              <path
                className="dog-fill-soft"
                d="M62 112 C64 84, 84 66, 108 66 C134 66, 152 86, 152 112 C152 138, 134 156, 106 158 C80 160, 60 140, 62 112 Z"
              />
              <path
                className="dog-line"
                d="M62 112 C64 84, 84 66, 108 66 C134 66, 152 86, 152 112 C152 138, 134 156, 106 158 C80 160, 60 140, 62 112 Z"
              />
              <path
                className="dog-fill-soft"
                d="M55 134 C51 148, 61 161, 77 163 C93 165, 105 157, 105 145 C105 133, 93 125, 77 125 C65 125, 58 128, 55 134 Z"
              />
              <path
                className="dog-line"
                d="M55 134 C51 148, 61 161, 77 163 C93 165, 105 157, 105 145 C105 133, 93 125, 77 125 C65 125, 58 128, 55 134 Z"
              />
              <ellipse className="dog-nose" cx="61" cy="136" rx="7" ry="5.5" />
              <path className="dog-line-thin dog-mouth-smile" d="M65 146 C73 155, 87 156, 95 149" />

              <g className="dog-eye-group">
                <g className="dog-eye-whites">
                  <ellipse cx="92" cy="114" rx="8.5" ry="7.5" />
                  <ellipse cx="126" cy="112" rx="8.5" ry="7.5" />
                </g>
                <g className="dog-eye-pupils">
                  <ellipse className="dog-eye" cx="92" cy="114" rx="4.3" ry="5.4" />
                  <ellipse className="dog-eye" cx="126" cy="112" rx="4.3" ry="5.4" />
                </g>
              </g>
              <path className="dog-line-thin" d="M84 100 C90 96, 98 96, 103 100" />
              <path className="dog-line-thin" d="M118 98 C124 94, 132 94, 137 98" />
            </g>
          </g>

          <g className="dog-eating-pose" aria-hidden="true">
            <path
              className="dog-fill-soft"
              d="M226 150 C220 116, 254 100, 272 120 C286 136, 276 160, 254 158 C264 144, 258 130, 244 132 C236 134, 229 141, 226 150 Z"
            />
            <path
              className="dog-line"
              d="M226 150 C220 116, 254 100, 272 120 C286 136, 276 160, 254 158 C264 144, 258 130, 244 132 C236 134, 229 141, 226 150 Z"
            />
            <path
              className="dog-fill-soft"
              d="M118 148 C146 132, 186 134, 212 150 C238 164, 250 184, 246 200 C242 212, 228 216, 210 216 L126 216 C112 216, 104 206, 105 190 C106 172, 110 158, 118 148 Z"
            />
            <path
              className="dog-line"
              d="M118 148 C146 132, 186 134, 212 150 C238 164, 250 184, 246 200 C242 212, 228 216, 210 216 L126 216 C112 216, 104 206, 105 190 C106 172, 110 158, 118 148 Z"
            />
            <path className="dog-line-thin" d="M194 216 C186 200, 190 180, 204 170" />
            <path
              className="dog-line"
              d="M124 176 C112 190, 102 204, 96 214 C94 218, 98 221, 104 220 L124 216"
            />
            <path
              className="dog-line"
              d="M158 182 C150 194, 144 206, 141 214 C140 218, 144 221, 150 220 L166 216"
            />
            <g transform="translate(-6 40) rotate(-12 102 130)">
              <path
                className="dog-fill-soft"
                d="M68 96 C58 72, 66 52, 82 46 C90 58, 92 76, 88 92 Z"
              />
              <path className="dog-line" d="M68 96 C58 72, 66 52, 82 46 C90 58, 92 76, 88 92 Z" />
              <path
                className="dog-fill-soft"
                d="M118 90 C118 64, 128 46, 144 44 C150 58, 148 78, 140 94 Z"
              />
              <path
                className="dog-line"
                d="M118 90 C118 64, 128 46, 144 44 C150 58, 148 78, 140 94 Z"
              />
              <path
                className="dog-fill-soft"
                d="M62 112 C64 84, 84 66, 108 66 C134 66, 152 86, 152 112 C152 138, 134 156, 106 158 C80 160, 60 140, 62 112 Z"
              />
              <path
                className="dog-line"
                d="M62 112 C64 84, 84 66, 108 66 C134 66, 152 86, 152 112 C152 138, 134 156, 106 158 C80 160, 60 140, 62 112 Z"
              />
              <path
                className="dog-fill-soft"
                d="M55 134 C51 148, 61 161, 77 163 C93 165, 105 157, 105 145 C105 133, 93 125, 77 125 C65 125, 58 128, 55 134 Z"
              />
              <path
                className="dog-line"
                d="M55 134 C51 148, 61 161, 77 163 C93 165, 105 157, 105 145 C105 133, 93 125, 77 125 C65 125, 58 128, 55 134 Z"
              />
              <ellipse className="dog-nose" cx="61" cy="136" rx="7" ry="5.5" />
              <path className="dog-line-thin dog-chew-line" d="M65 146 C73 155, 87 156, 95 149" />
              <path className="dog-line-thin" d="M86 112 C90 108, 96 107, 100 110" />
              <path className="dog-line-thin" d="M118 110 C122 106, 128 105, 132 108" />
            </g>
            <path className="dog-line-thin dog-eaten-bone" d="M48 214 L96 204" />
            <circle className="dog-bone-end" cx="45" cy="215" r="7.5" />
            <circle className="dog-bone-end" cx="99" cy="203" r="7.5" />
          </g>

          <g className="dog-heart" aria-hidden="true">
            <path
              className="dog-heart-fill"
              d="M276 57 C276 44, 293 41, 300 55 C308 40, 327 46, 325 62 C323 80, 300 94, 300 94 C300 94, 276 75, 276 57 Z"
            />
            <path
              className="dog-line-thin"
              d="M276 57 C276 44, 293 41, 300 55 C308 40, 327 46, 325 62 C323 80, 300 94, 300 94 C300 94, 276 75, 276 57 Z"
            />
          </g>

          <g className="dog-spark" aria-hidden="true">
            <path
              className="dog-line-thin"
              d="M36 138 L42 150 L54 156 L42 162 L36 174 L30 162 L18 156 L30 150 Z"
            />
          </g>
        </svg>

        <div
          ref={boneRef}
          className="dog-bone-wrap"
          style={{ left: `${BONE_START.x}px`, top: `${BONE_START.y}px` }}
          onPointerCancel={finishDrag}
          onPointerDown={onBonePointerDown}
          onKeyDown={onBoneKeyDown}
          onPointerMove={onBonePointerMove}
          onPointerUp={finishDrag}
          role="button"
          tabIndex={0}
          aria-label="Drag the bone to the dog"
        >
          <svg className="dog-bone-svg" viewBox="0 0 120 72" aria-hidden="true">
            <path
              className="dog-bone-path"
              d="M28 21 C21 8, 6 13, 10 27 C-3 33, 4 52, 20 47 C24 64, 45 58, 41 41 L79 27 C86 42, 107 39, 105 22 C121 16, 113 -3, 97 5 C88 -8, 69 2, 76 18 L38 32 C38 27, 33 22, 28 21 Z"
            />
          </svg>
        </div>

        <span className="dog-hint" aria-hidden="true">
          drag the bone
        </span>
      </div>
    </div>
  );
}
