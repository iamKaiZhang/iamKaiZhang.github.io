'use client';

import { useEffect, useRef } from 'react';

import { usePathname } from 'next/navigation';

/**
 * Reveals [data-reveal] elements as they scroll into view.
 * Elements are only hidden after this component mounts (html.reveal-ready),
 * so content stays visible without JS. Honors prefers-reduced-motion.
 * Also scrolls to the top on route changes.
 */
export default function ScrollReveal() {
  const pathname = usePathname();
  const lastPathname = useRef<string | null>(null);

  useEffect(() => {
    if (lastPathname.current !== null && lastPathname.current !== pathname) {
      window.scrollTo(0, 0);
    }
    lastPathname.current = pathname;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const els = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-visible)'),
    );
    if (els.length === 0 || !('IntersectionObserver' in window)) return undefined;

    document.documentElement.classList.add('reveal-ready');

    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, i) => {
            const el = entry.target as HTMLElement;
            el.style.setProperty('--reveal-delay', `${i * 80}ms`);
            el.classList.add('is-visible');
            observer.unobserve(el);
          });
      },
      { rootMargin: '0px 0px -8% 0px' },
    );

    els.forEach((el) => observer.observe(el));

    // Safety net: if the observer never reports, show everything rather
    // than leave content hidden.
    const fallback = window.setTimeout(() => {
      if (!els.some((el) => el.classList.contains('is-visible'))) {
        document.documentElement.classList.remove('reveal-ready');
      }
    }, 2000);

    return () => {
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}
