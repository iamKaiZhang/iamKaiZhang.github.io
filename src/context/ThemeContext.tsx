'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { THEME_KEY, pickTheme } from './sunTheme';
import type { Theme } from './sunTheme';

function storedChoice(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    // localStorage unavailable (private mode, etc.)
    return null;
  }
}

// Day between the visitor's sunrise and sunset, unless they chose a theme
// themselves today. The server render has no visitor, so it uses night.
function currentTheme(): Theme {
  if (typeof window === 'undefined') return 'night';
  return pickTheme(new Date(), storedChoice());
}

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'day', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Follow the sun while the page stays open: switch at sunrise and sunset
  useEffect(() => {
    const timer = setInterval(() => setTheme(currentTheme()), 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const toggle = useCallback(
    () =>
      setTheme((t) => {
        const next = t === 'day' ? 'night' : 'day';
        try {
          // A manual choice holds for the rest of the day it was made on
          localStorage.setItem(THEME_KEY, `${next}|${new Date().toDateString()}`);
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
