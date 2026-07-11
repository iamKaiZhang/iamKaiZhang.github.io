'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import routes from '../../data/routes';
import ThemeToggle from './ThemeToggle';

// Site header: serif nav plus theme toggle.
const Navigation: React.FC = () => {
  // Normalize the trailing slash from static export URLs
  const pathname = usePathname().replace(/\/+$/, '') || '/';

  return (
    <header id="header">
      <nav aria-label="Main">
        {routes.map((route) => (
          <Link
            key={route.label}
            href={route.path}
            aria-current={pathname === route.path ? 'page' : undefined}
          >
            {route.label}
          </Link>
        ))}
      </nav>
      <div className="header-right">
        <ThemeToggle />
      </div>
    </header>
  );
};

export default Navigation;
