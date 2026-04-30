'use client';

import React from 'react';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      aria-label={theme === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
      className="theme-toggle"
      onClick={toggle}
      title={theme === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
    >
      {theme === 'day' ? '☾' : '☀'}
    </button>
  );
}
