'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

export default function InteractiveDog() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const boneRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);

  const draggingRef = useRef(false);
  const bonePosRef = useRef({ x: 12, y: 12 });
  const boneOffsetRef = useRef({ x: 0, y: 0 });
  const eatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isEating, setIsEating] = useState(false);
  const [isHappy, setIsHappy] = useState(false);
  const [isExcited, setIsExcited] = useState(false);

  const clientToLocal = useCallback((clientX: number, clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const setHeadLookAt = useCallback((localX: number, localY: number) => {
    const head = headRef.current;
    const wrap = wrapRef.current;
    if (!head || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const svgX = (localX / rect.width) * 320;
    const svgY = (localY / rect.height) * 220;
    const dx = svgX - 88;
    const dy = svgY - 104;
    const rotate = Math.max(-8, Math.min(8, dx * 0.035));
    const tx = Math.max(-3, Math.min(3, dx * 0.015));
    const ty = Math.max(-2, Math.min(2, dy * 0.012));
    head.style.transform = `translate(${tx}px, ${ty}px) rotate(${rotate}deg)`;
  }, []);

  const isBoneNearMouth = useCallback(() => {
    const wrap = wrapRef.current;
    const bone = boneRef.current;
    if (!wrap || !bone) return false;
    const wrapRect = wrap.getBoundingClientRect();
    const boneRect = bone.getBoundingClientRect();
    const boneCenter = {
      x: boneRect.left + boneRect.width / 2 - wrapRect.left,
      y: boneRect.top + boneRect.height / 2 - wrapRect.top,
    };
    const mouth = {
      x: wrapRect.width * 0.22,
      y: wrapRect.height * 0.53,
    };
    return Math.hypot(boneCenter.x - mouth.x, boneCenter.y - mouth.y) < 65;
  }, []);

  const showHappy = useCallback(() => {
    setIsEating(false);
    setIsHappy(true);
    setIsExcited(true);
    setTimeout(() => setIsHappy(false), 1300);
    setTimeout(() => setIsExcited(false), 2200);
  }, []);

  const startEating = useCallback(() => {
    if (eatingTimerRef.current) clearTimeout(eatingTimerRef.current);
    setIsEating(true);
    setIsExcited(true);
    if (boneRef.current) boneRef.current.style.opacity = '0';
    if (hintRef.current) hintRef.current.style.opacity = '0';

    eatingTimerRef.current = setTimeout(() => {
      showHappy();
      setTimeout(() => {
        bonePosRef.current = { x: 12, y: 12 };
        if (boneRef.current) {
          boneRef.current.style.left = '12px';
          boneRef.current.style.top = '12px';
          boneRef.current.style.opacity = '1';
        }
        if (hintRef.current) hintRef.current.style.opacity = '0.65';
      }, 900);
    }, 1200);
  }, [showHappy]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const wrap = wrapRef.current;
      if (!wrap || draggingRef.current) return;
      const rect = wrap.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        setHeadLookAt(e.clientX - rect.left, e.clientY - rect.top);
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [setHeadLookAt]);

  const onBonePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      const p = clientToLocal(e.clientX, e.clientY);
      boneOffsetRef.current = {
        x: p.x - bonePosRef.current.x,
        y: p.y - bonePosRef.current.y,
      };
      setIsExcited(true);
    },
    [clientToLocal],
  );

  const onBonePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      const p = clientToLocal(e.clientX, e.clientY);
      const x = p.x - boneOffsetRef.current.x;
      const y = p.y - boneOffsetRef.current.y;
      bonePosRef.current = { x, y };
      if (boneRef.current) {
        boneRef.current.style.left = `${x}px`;
        boneRef.current.style.top = `${y}px`;
      }
      setHeadLookAt(p.x, p.y);
    },
    [clientToLocal, setHeadLookAt],
  );

  const onBonePointerUp = useCallback(() => {
    draggingRef.current = false;
    if (isBoneNearMouth()) {
      startEating();
    } else {
      setIsExcited(false);
    }
  }, [isBoneNearMouth, startEating]);

  const wrapClass = [
    'dog-wrap',
    isEating && 'is-eating',
    isHappy && 'is-happy',
    isExcited && 'is-excited',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="dog-mascot-wrapper">
      <div
        ref={wrapRef}
        className={wrapClass}
        onMouseEnter={() => setIsExcited(true)}
        onMouseLeave={() => !draggingRef.current && setIsExcited(false)}
        aria-label="Interactive dog mascot — drag the bone to feed it"
      >
        <svg className="dog-svg" viewBox="0 0 320 220" role="img" aria-hidden="true">
          {/* Shadow */}
          <ellipse className="dog-shadow" cx="164" cy="178" rx="112" ry="13" />

          <g className="dog-body-group">
            {/* Tail */}
            <g className="dog-tail">
              <path
                className="dog-line"
                d="M224 92 C255 52, 294 76, 271 111 C292 115, 280 153, 243 148 C226 145, 219 130, 225 115"
              />
              <path className="dog-line-thin" d="M252 91 C263 101, 261 119, 249 132" />
            </g>

            {/* Body */}
            <path
              className="dog-fill-soft"
              d="M92 133 C104 95, 166 83, 217 100 C238 108, 251 136, 239 163 C215 177, 131 176, 98 165 C87 158, 86 145, 92 133 Z"
            />
            <path
              className="dog-line"
              d="M88 136 C100 94, 167 82, 220 101 C246 111, 254 143, 237 164 C213 178, 128 178, 98 166 C87 158, 83 147, 88 136 Z"
            />

            {/* Body fur details */}
            <path className="dog-line-thin" d="M151 102 C162 108, 166 117, 165 128" />
            <path className="dog-line-thin" d="M177 101 C190 110, 196 122, 195 135" />
            <path className="dog-line-thin" d="M205 112 C213 124, 215 138, 211 151" />
            <path className="dog-line-thin" d="M112 151 C126 158, 145 160, 165 158" />

            {/* Legs */}
            <path
              className="dog-line"
              d="M108 157 C101 174, 91 184, 78 184 C72 183, 70 177, 75 171 C82 163, 93 159, 108 157 Z"
            />
            <path
              className="dog-line"
              d="M136 157 C130 176, 119 187, 105 185 C99 184, 98 178, 102 172 C109 164, 121 160, 136 157 Z"
            />
            <path
              className="dog-line"
              d="M210 158 C210 177, 201 188, 190 187 C183 186, 181 180, 185 173 C190 164, 199 159, 210 158 Z"
            />
            <path
              className="dog-line"
              d="M235 154 C244 169, 244 184, 233 187 C226 189, 222 184, 224 176 C226 166, 230 160, 235 154 Z"
            />

            {/* Chest fluff */}
            <path
              className="dog-line"
              d="M94 126 C82 124, 75 132, 80 143 C68 144, 65 157, 77 164 C85 170, 99 167, 106 158"
            />
          </g>

          {/* Head — tracks cursor via inline transform */}
          <g className="dog-head" ref={headRef}>
            <path
              className="dog-fill-soft"
              d="M54 104 C43 77, 61 52, 91 52 C121 53, 140 77, 132 105 C124 133, 84 146, 62 127 C54 120, 50 113, 54 104 Z"
            />
            <path
              className="dog-line"
              d="M58 103 C44 78, 60 52, 89 51 C121 50, 142 78, 132 107 C122 136, 84 148, 61 127 C53 120, 50 111, 58 103 Z"
            />

            {/* Ears */}
            <path className="dog-line" d="M59 75 L48 35 L76 61" />
            <path className="dog-line-thin" d="M58 65 L54 47 L69 61" />
            <path className="dog-line" d="M96 55 L107 27 L124 65" />
            <path className="dog-line-thin" d="M101 58 L108 41 L117 64" />
            <path className="dog-line" d="M72 58 C74 42, 86 44, 87 55 C96 38, 106 45, 101 62" />

            {/* Cheek fluff */}
            <path className="dog-line" d="M58 97 C45 96, 39 103, 47 111 C37 113, 36 124, 48 127" />
            <path
              className="dog-line"
              d="M122 96 C137 98, 139 109, 127 114 C139 120, 134 132, 120 131"
            />

            {/* Eyes */}
            <g className="dog-eye-group">
              <ellipse className="dog-eye" cx="77" cy="101" rx="4.4" ry="5.4" />
              <ellipse className="dog-eye" cx="105" cy="98" rx="4.4" ry="5.4" />
            </g>

            {/* Nose & mouth */}
            <ellipse className="dog-nose" cx="62" cy="115" rx="6" ry="4.8" />
            <path className="dog-line-thin" d="M67 119 C76 128, 92 128, 101 117" />

            {/* Brow marks */}
            <path className="dog-line-thin" d="M74 89 C80 84, 87 84, 92 88" />
            <path className="dog-line-thin" d="M101 85 C108 80, 116 82, 121 88" />
          </g>

          {/* Sparkle */}
          <path
            className="dog-line-thin"
            d="M34 100 L39 110 L49 115 L39 120 L34 130 L29 120 L19 115 L29 110 Z"
          />

          {/* Heart (shown on is-happy) */}
          <g className="dog-heart">
            <path
              className="dog-heart-fill"
              d="M252 42 C252 33, 265 31, 269 41 C274 31, 288 34, 287 44 C286 56, 269 66, 269 66 C269 66, 252 55, 252 42 Z"
            />
          </g>
        </svg>

        {/* Draggable bone */}
        <div
          ref={boneRef}
          className="dog-bone-wrap"
          style={{ left: '12px', top: '12px' }}
          onPointerDown={onBonePointerDown}
          onPointerMove={onBonePointerMove}
          onPointerUp={onBonePointerUp}
          role="button"
          tabIndex={0}
          aria-label="Drag the bone to the dog"
        >
          <svg viewBox="0 0 90 52" width="52" height="32">
            <path
              className="dog-bone-path"
              d="M21 13 C14 4, 2 9, 6 20 C-2 25, 3 38, 15 35 C18 48, 34 44, 31 32 L59 20 C64 29, 78 28, 77 17 C89 13, 86 -1, 74 4 C67 -5, 53 2, 58 13 L30 24 C30 19, 26 15, 21 13 Z"
            />
          </svg>
        </div>

        <span ref={hintRef} className="dog-hint" aria-hidden="true">
          drag the bone ✦
        </span>
      </div>
    </div>
  );
}
