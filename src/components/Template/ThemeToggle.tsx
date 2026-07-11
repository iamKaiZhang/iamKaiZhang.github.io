'use client';

import React, { useEffect, useState } from 'react';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  // The server always renders the day glyph, but a visitor with a stored
  // night preference hydrates with night state. Render the day glyph until
  // after hydration so server and client markup match, then show the real
  // theme; this avoids a React hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDay = !mounted || theme === 'day';

  return (
    <button
      aria-label={isDay ? 'Switch to night mode' : 'Switch to day mode'}
      className="theme-toggle"
      onClick={toggle}
      title={isDay ? 'Switch to night mode' : 'Switch to day mode'}
    >
      {isDay ? '⏾' : '☀'}
    </button>
  );
}
