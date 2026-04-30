import React from 'react';

interface Props {
  className?: string;
}

export default function ScalesSVG({ className }: Props) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
      viewBox="0 0 160 180"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Central pole */}
      <line x1="80" x2="80" y1="20" y2="155" />
      {/* Base */}
      <path d="M55 155 Q80 165 105 155" />
      <line x1="50" x2="110" y1="165" y2="165" />
      {/* Top ornament */}
      <circle cx="80" cy="22" r="5" />
      {/* Horizontal beam — slightly tilted for realism */}
      <line x1="22" x2="138" y1="45" y2="48" />
      {/* Left pan chains */}
      <line x1="28" x2="24" y1="45" y2="80" />
      <line x1="36" x2="38" y1="45" y2="80" />
      {/* Left pan */}
      <path d="M16 80 Q31 90 46 80" />
      <line x1="16" x2="46" y1="80" y2="80" />
      {/* Right pan chains */}
      <line x1="125" x2="122" y1="47" y2="82" />
      <line x1="133" x2="137" y1="47" y2="82" />
      {/* Right pan */}
      <path d="M114 82 Q129 92 144 82" />
      <line x1="114" x2="144" y1="82" y2="82" />
      {/* Left pan label: fairness */}
      <text fill="currentColor" fontSize="7" stroke="none" textAnchor="middle" x="31" y="100">
        fair
      </text>
      {/* Right pan label: equality */}
      <text fill="currentColor" fontSize="7" stroke="none" textAnchor="middle" x="129" y="104">
        equal
      </text>
      {/* Decorative stars */}
      <text fill="currentColor" fontSize="10" stroke="none" x="68" y="140">
        ★
      </text>
    </svg>
  );
}
