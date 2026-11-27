import React from 'react';

import type { Metadata } from 'next';

import GoogleAnalytics from '@/components/Template/GoogleAnalytics';
import Navigation from '@/components/Template/Navigation';
import { ThemeProvider } from '@/context/ThemeContext';
import { THEME_KEY, pickTheme } from '@/context/sunTheme';
import '@/static/css/main.scss';

import ScrollReveal from './components/ScrollReveal';

export const metadata: Metadata = {
  title: {
    default: 'Kai Zhang',
    template: '%s | Kai Zhang',
  },
  description: "Kai Zhang's personal website.",
  keywords: ['Kai Zhang', 'PhD Student', 'Game Theory', 'Control Theory'],
  authors: [{ name: 'Kai Zhang' }],
  creator: 'Kai Zhang',
  metadataBase: new URL('https://zhangkai.io'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://zhangkai.io',
    siteName: 'Kai Zhang',
    title: 'Kai Zhang',
    description: 'PhD Student at ETH Zurich',
    images: [
      {
        url: '/images/me.jpg',
        width: 1200,
        height: 1200,
        alt: 'Kai Zhang',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Runs before first paint so the page never flashes the wrong theme. The
// picker is inlined from its source, which is why it has to be self-contained.
const themeInitScript = `
(function(){
  var stored = null;
  try { stored = localStorage.getItem('${THEME_KEY}'); } catch (e) {}
  document.documentElement.setAttribute('data-theme', (${pickTheme.toString()})(new Date(), stored));
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set theme before first paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ThemeProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <ScrollReveal />
          <Navigation />
          <main id="main">{children}</main>
          <footer id="site-footer">
            <div>Zürich, Switzerland</div>
            <div>© 2026 Kai Zhang</div>
          </footer>
        </ThemeProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
