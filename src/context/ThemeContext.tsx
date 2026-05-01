'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'day' | 'night';

function autoTheme(): Theme {
  const h = new Date().getHours();
  return h >= 6 && h < 20 ? 'day' : 'night';
}

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'day', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(autoTheme);

  useEffect(() => {
    const now = new Date();
    const slot = Math.floor((now.getHours() * 60 + now.getMinutes()) / 10) % 4;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-day-theme', String(slot));
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === 'day' ? 'night' : 'day')), []);

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
