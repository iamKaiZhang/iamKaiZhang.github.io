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
  }, [clearTimers, setGazeToBone]);

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
                d="M235 114 C260 68, 308 80, 292 121 C314 130, 296 171, 254 162 C229 157, 220 134, 235 114 Z"
              />
              <path
                className="dog-line"
                d="M235 114 C260 68, 308 80, 292 121 C314 130, 296 171, 254 162 C229 157, 220 134, 235 114 Z"
              />
              <path className="dog-line-thin" d="M259 103 C276 116, 275 139, 256 151" />
            </g>

            <g className="dog-body-group">
              <path
                className="dog-fill-soft"
                d="M108 154 C116 116, 151 98, 196 103 C236 108, 258 134, 251 170 C244 205, 199 216, 149 205 C117 198, 100 178, 108 154 Z"
              />
              <path
                className="dog-line"
                d="M108 154 C116 116, 151 98, 196 103 C236 108, 258 134, 251 170 C244 205, 199 216, 149 205 C117 198, 100 178, 108 154 Z"
              />
              <path className="dog-line-thin" d="M160 113 C173 123, 178 137, 174 152" />
              <path className="dog-line-thin" d="M194 112 C210 125, 215 141, 210 158" />
              <path className="dog-line-thin" d="M130 169 C148 180, 177 182, 202 176" />
              <path
                className="dog-line"
                d="M122 184 C116 205, 104 218, 89 216 C82 215, 80 208, 86 202 C95 193, 109 187, 122 184 Z"
              />
              <path
                className="dog-line"
                d="M153 187 C148 209, 135 222, 120 220 C113 219, 111 212, 117 204 C126 194, 140 189, 153 187 Z"
              />
              <path
                className="dog-line"
                d="M218 184 C220 206, 210 221, 195 220 C188 219, 185 212, 190 204 C197 193, 208 187, 218 184 Z"
              />
              <path
                className="dog-line"
                d="M245 176 C256 194, 256 213, 242 219 C234 222, 229 216, 231 206 C234 194, 239 184, 245 176 Z"
              />
            </g>

            <g className="dog-head" ref={headRef}>
              <path
                className="dog-fill-soft"
                d="M66 130 C52 96, 70 65, 101 60 C132 56, 158 76, 162 107 C166 139, 141 163, 106 166 C84 168, 70 153, 66 130 Z"
              />
              <path
                className="dog-line"
                d="M66 130 C52 96, 70 65, 101 60 C132 56, 158 76, 162 107 C166 139, 141 163, 106 166 C84 168, 70 153, 66 130 Z"
              />
              <path className="dog-line" d="M74 94 L60 48 L96 80" />
              <path className="dog-line-thin" d="M74 84 L67 61 L87 79" />
              <path className="dog-line" d="M116 65 L134 34 L150 83" />
              <path className="dog-line-thin" d="M123 70 L133 50 L143 81" />
              <path
                className="dog-line"
                d="M86 69 C91 49, 104 52, 104 68 C115 47, 129 54, 121 74"
              />
              <path
                className="dog-line"
                d="M67 123 C51 123, 45 133, 55 141 C43 145, 44 158, 58 162"
              />
              <path
                className="dog-line"
                d="M149 120 C164 123, 166 136, 153 142 C166 149, 158 162, 143 161"
              />

              <g className="dog-eye-group">
                <g className="dog-eye-whites">
                  <ellipse cx="91" cy="130" rx="8" ry="6.5" />
                  <ellipse cx="123" cy="126" rx="8" ry="6.5" />
                </g>
                <g className="dog-eye-pupils">
                  <ellipse className="dog-eye" cx="91" cy="130" rx="4.1" ry="5" />
                  <ellipse className="dog-eye" cx="123" cy="126" rx="4.1" ry="5" />
                </g>
              </g>

              <ellipse className="dog-nose" cx="79" cy="148" rx="7" ry="5" />
              <path
                className="dog-line-thin dog-mouth-smile"
                d="M86 152 C97 163, 117 163, 129 149"
              />
              <path className="dog-line-thin" d="M84 116 C91 111, 100 112, 105 117" />
              <path className="dog-line-thin" d="M116 112 C125 108, 135 111, 140 117" />
            </g>
          </g>

          <g className="dog-eating-pose" aria-hidden="true">
            <path
              className="dog-fill-soft"
              d="M106 176 C119 143, 156 129, 204 133 C246 137, 269 158, 264 187 C258 216, 209 225, 151 215 C113 209, 96 195, 106 176 Z"
            />
            <path
              className="dog-line"
              d="M106 176 C119 143, 156 129, 204 133 C246 137, 269 158, 264 187 C258 216, 209 225, 151 215 C113 209, 96 195, 106 176 Z"
            />
            <path
              className="dog-line"
              d="M232 136 C258 92, 305 105, 289 145 C312 153, 292 188, 252 178 C228 172, 218 153, 232 136 Z"
            />
            <path className="dog-line-thin" d="M258 125 C274 139, 272 160, 254 170" />
            <g transform="translate(-8 38) rotate(-10 102 130)">
              <path
                className="dog-fill-soft"
                d="M66 130 C52 96, 70 65, 101 60 C132 56, 158 76, 162 107 C166 139, 141 163, 106 166 C84 168, 70 153, 66 130 Z"
              />
              <path
                className="dog-line"
                d="M66 130 C52 96, 70 65, 101 60 C132 56, 158 76, 162 107 C166 139, 141 163, 106 166 C84 168, 70 153, 66 130 Z"
              />
              <path className="dog-line" d="M74 94 L60 48 L96 80" />
              <path className="dog-line" d="M116 65 L134 34 L150 83" />
              <path
                className="dog-line"
                d="M86 69 C91 49, 104 52, 104 68 C115 47, 129 54, 121 74"
              />
              <path
                className="dog-line"
                d="M67 123 C51 123, 45 133, 55 141 C43 145, 44 158, 58 162"
              />
              <path
                className="dog-line"
                d="M149 120 C164 123, 166 136, 153 142 C166 149, 158 162, 143 161"
              />
              <ellipse className="dog-eye" cx="89" cy="133" rx="3.8" ry="4.7" />
              <ellipse className="dog-eye" cx="119" cy="129" rx="3.8" ry="4.7" />
              <ellipse className="dog-nose" cx="78" cy="150" rx="7" ry="5" />
              <path className="dog-line-thin dog-chew-line" d="M84 154 C96 161, 114 161, 126 151" />
            </g>
            <path
              className="dog-line"
              d="M118 195 C106 216, 89 221, 78 212 C73 208, 77 199, 87 196"
            />
            <path
              className="dog-line"
              d="M151 197 C139 219, 119 224, 108 214 C104 209, 108 200, 119 197"
            />
            <path className="dog-line" d="M223 193 C222 213, 212 224, 198 222" />
            <path className="dog-line" d="M254 187 C265 204, 264 219, 250 223" />
            <path className="dog-line-thin dog-eaten-bone" d="M55 213 L106 199" />
            <circle className="dog-bone-end" cx="52" cy="214" r="7.5" />
            <circle className="dog-bone-end" cx="108" cy="198" r="7.5" />
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
