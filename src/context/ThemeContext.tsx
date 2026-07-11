'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'day' | 'night';

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'night';
  try {
    // Versioned key: older stored preferences are deliberately ignored
    const stored = localStorage.getItem('kz-theme');
    if (stored === 'day' || stored === 'night') return stored;
  } catch {
    // localStorage unavailable; fall through to the default
  }
  // Night is the site's default look; day stays available via the toggle
  return 'night';
}

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'day', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggle = useCallback(
    () =>
      setTheme((t) => {
        const next = t === 'day' ? 'night' : 'day';
        try {
          localStorage.setItem('kz-theme', next);
        } catch {
          // ignore write failures (private mode, etc.)
        }
        return next;
      }),
    [],
  );

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
