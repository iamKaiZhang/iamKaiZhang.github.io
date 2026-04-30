import React from 'react';

interface Props {
  className?: string;
}

export default function SheldonSVG({ className }: Props) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
      viewBox="0 0 180 220"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Whiteboard */}
      <rect height="100" rx="3" width="80" x="88" y="30" />
      {/* Board content: equations */}
      <text fill="currentColor" fontSize="9" stroke="none" x="96" y="55">
        f(v) = V(v-v₀)²
      </text>
      <line x1="96" x2="160" y1="65" y2="65" />
      <text fill="currentColor" fontSize="8" stroke="none" x="96" y="78">
        Karma ∝ 1/n
      </text>
      <path d="M100 88 L155 88" strokeDasharray="4 3" />
      <text fill="currentColor" fontSize="8" stroke="none" x="100" y="100">
        ∑fairness = ♡
      </text>
      {/* Board legs */}
      <line x1="105" x2="100" y1="130" y2="165" />
      <line x1="155" x2="160" y1="130" y2="165" />
      {/* Person body */}
      {/* Head */}
      <circle cx="55" cy="55" r="16" />
      {/* Hair (Sheldon's floppy fringe) */}
      <path d="M40 46 Q48 36 56 44 Q62 36 70 46" />
      {/* Neck */}
      <line x1="55" x2="55" y1="71" y2="85" />
      {/* Torso */}
      <path d="M35 85 L55 85 L75 85 L72 135 L38 135 Z" />
      {/* Superman logo hint on shirt */}
      <path d="M48 105 L55 98 L62 105 L55 112 Z" strokeWidth="1.5" />
      {/* Left arm pointing at board */}
      <path d="M72 90 Q85 85 88 80" />
      {/* Right arm down */}
      <path d="M38 90 Q30 105 32 120" />
      {/* Legs */}
      <path d="M38 135 L34 175 L40 175" />
      <path d="M72 135 L76 175 L70 175" />
      {/* Feet */}
      <path d="M28 175 L42 175" />
      <path d="M68 175 L80 175" />
      {/* Pointing finger detail */}
      <path d="M86 80 L92 78" strokeWidth="3" />
    </svg>
  );
}
