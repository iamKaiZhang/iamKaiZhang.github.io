import React from 'react';

interface Props {
  className?: string;
}

export default function MuayThaiSVG({ className }: Props) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
      viewBox="0 0 150 220"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Head */}
      <circle cx="75" cy="35" r="18" />
      {/* Neck */}
      <line x1="75" x2="75" y1="53" y2="68" />
      {/* Torso */}
      <path d="M50 68 L75 68 L100 68 L95 115 L55 115 Z" />
      {/* Left guard arm — raised, fist forward */}
      <path d="M55 78 L30 65 L22 60" />
      {/* Left fist */}
      <rect height="12" rx="3" width="14" x="14" y="54" />
      {/* Right arm — elbow raised for a strike */}
      <path d="M95 78 L118 60 L128 50" />
      {/* Right fist */}
      <rect height="12" rx="3" width="14" x="126" y="44" />
      {/* Left leg — standing, slightly bent */}
      <path d="M60 115 L55 155 L50 195" />
      <path d="M50 195 L38 198" />
      {/* Right leg — raised kick, knee up, leg extended forward */}
      <path d="M90 115 Q100 130 105 148" />
      {/* Knee joint */}
      <circle cx="104" cy="148" r="4" />
      {/* Lower leg extended in kick */}
      <path d="M104 148 L130 135" />
      {/* Foot/kick pad */}
      <path d="M128 130 L136 138 L124 143 Z" />
      {/* Shorts band */}
      <path d="M55 115 Q75 120 95 115" />
      {/* Headband */}
      <path d="M58 28 Q75 22 92 28" />
      {/* Motion lines for the kick */}
      <path d="M138 128 L145 122" strokeDasharray="3 2" />
      <path d="M135 122 L142 116" strokeDasharray="3 2" />
      <path d="M130 118 L137 112" strokeDasharray="3 2" />
    </svg>
  );
}
