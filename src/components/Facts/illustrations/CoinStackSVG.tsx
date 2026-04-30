import React from 'react';

interface Props {
  className?: string;
}

export default function CoinStackSVG({ className }: Props) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.2"
      viewBox="0 0 120 160"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Stack of coins — 5 coins */}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = 130 - i * 22;
        return (
          <g key={i}>
            {/* Coin sides */}
            <line x1="20" x2="20" y1={y} y2={y + 10} />
            <line x1="100" x2="100" y1={y} y2={y + 10} />
            <path d={`M20 ${y + 10} Q60 ${y + 18} 100 ${y + 10}`} />
            {/* Coin top face */}
            <ellipse cx="60" cy={y} rx="40" ry="10" />
            {/* K symbol on top coin */}
            {i === 4 && (
              <text
                fill="currentColor"
                fontSize="12"
                stroke="none"
                textAnchor="middle"
                x="60"
                y={y + 4}
              >
                κ
              </text>
            )}
          </g>
        );
      })}
      {/* Label */}
      <text fill="currentColor" fontSize="8" stroke="none" textAnchor="middle" x="60" y="152">
        karma token
      </text>
    </svg>
  );
}
