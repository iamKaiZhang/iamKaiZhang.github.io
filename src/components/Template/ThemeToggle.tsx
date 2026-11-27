'use client';

import React, { useEffect, useState } from 'react';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  // The server always renders the night glyph (it has no visitor to ask),
  // but a visitor in daylight hydrates with day state. Render
  // the night glyph until after hydration so server and client markup
  // match, then show the real theme; this avoids a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDay = mounted && theme === 'day';

  return (
    <button
      aria-label={isDay ? 'Switch to night mode' : 'Switch to day mode'}
      className="theme-toggle"
      onClick={toggle}
      title={isDay ? 'Switch to night mode' : 'Switch to day mode'}
    >
      {/* ︎ forces the monochrome text glyph; iOS otherwise renders the color emoji sun */}
      {isDay ? '⏾' : '☀︎'}
    </button>
  );
}
