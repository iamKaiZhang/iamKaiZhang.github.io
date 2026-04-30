import React from 'react';

interface Props {
  className?: string;
  mood?: 'idle' | 'happy' | 'jump' | 'eat';
}

export default function ArcanineSVG({ className, mood = 'idle' }: Props) {
  const isJump = mood === 'jump';
  const isHappy = mood === 'happy';
  const isEat = mood === 'eat';

  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.4"
      viewBox="0 0 240 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* === BODY === */}
      <ellipse cx="130" cy={isJump ? 108 : 118} rx="55" ry="35" />

      {/* === NECK === */}
      <path d={`M90 ${isJump ? 95 : 100} Q72 ${isJump ? 80 : 90} 72 ${isJump ? 78 : 88}`} />

      {/* === HEAD === */}
      <circle cx="68" cy={isJump ? 68 : 78} r="28" />

      {/* === MUZZLE === */}
      <ellipse cx="52" cy={isJump ? 80 : 90} rx="16" ry="11" />

      {/* === NOSE === */}
      <ellipse cx="44" cy={isJump ? 79 : 89} fill="currentColor" rx="5" ry="3.5" stroke="none" />

      {/* === EYE === */}
      <circle
        cx={isHappy ? '62' : '60'}
        cy={isJump ? '65' : isHappy ? '72' : '74'}
        fill="currentColor"
        r="4"
        stroke="none"
      />

      {/* Happy eye — closed curve */}
      {isHappy && <path d="M57 72 Q62 67 67 72" strokeWidth="2" />}

      {/* === EARS === */}
      <path d="M58 52 L50 32 L72 50" />
      <path d="M76 50 L82 30 L94 52" />

      {/* === MANE (spiky fluffy shapes around neck/head) === */}
      <path d="M44 88 Q36 78 44 68" />
      <path d="M40 78 Q32 65 42 56" />
      <path d="M48 60 Q44 48 56 44" />
      <path d="M72 52 Q74 40 84 46" />
      <path d="M86 52 Q92 42 98 52" />
      <path d="M95 62 Q104 55 106 66" />

      {/* === BODY FLAME STRIPES === */}
      <path d="M108 98 L120 108" />
      <path d="M120 94 L134 104" />
      <path d="M133 92 L146 102" />

      {/* === TAIL === */}
      <path
        d={
          isHappy
            ? 'M182 100 Q210 70 205 45 Q200 28 188 38 Q185 50 192 58'
            : isJump
              ? 'M182 92 Q215 60 208 35 Q200 18 185 30'
              : 'M182 108 Q205 85 198 60 Q192 42 180 52'
        }
      />

      {/* === LEGS === */}
      {isJump ? (
        <>
          {/* All legs tucked up for jump */}
          <path d="M95 138 Q88 150 82 148" />
          <path d="M113 143 Q110 155 104 152" />
          <path d="M148 140 Q152 152 158 148" />
          <path d="M162 135 Q168 146 174 142" />
        </>
      ) : isEat ? (
        <>
          {/* Front legs lower — crouching to eat */}
          <path d="M95 148 L88 182" />
          <path d="M113 153 L108 187" />
          <path d="M148 150 L155 182" />
          <path d="M163 145 L172 177" />
          {/* Bone on ground */}
          <path d="M30 188 Q35 182 42 188 Q45 180 52 188 Q57 182 62 188" />
          <path d="M30 188 Q25 194 30 200 Q35 194 30 188" />
          <path d="M62 188 Q67 194 62 200 Q57 194 62 188" />
        </>
      ) : (
        <>
          {/* Normal standing legs */}
          <path d="M95 148 L88 180" />
          <path d="M113 153 L108 183" />
          <path d="M148 150 L155 180" />
          <path d="M163 145 L172 177" />
        </>
      )}

      {/* === PAWS === */}
      {!isJump && (
        <>
          <path d="M84 180 Q88 185 92 180" />
          <path d="M104 183 Q108 188 112 183" />
          <path d="M151 180 Q155 185 159 180" />
          <path d="M168 177 Q172 182 176 177" />
        </>
      )}

      {/* === HAPPY HEART === */}
      {isHappy && (
        <g transform="translate(20, 30)">
          <path
            d="M60 42 C60 38 54 34 50 38 C46 34 40 38 40 42 C40 50 50 58 50 58 C50 58 60 50 60 42 Z"
            strokeWidth="2"
          />
        </g>
      )}
    </svg>
  );
}
