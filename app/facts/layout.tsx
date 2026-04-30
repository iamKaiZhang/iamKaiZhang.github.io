'use client';

import React, { useEffect } from 'react';

export default function FactsLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add('facts-page');
    return () => {
      document.body.classList.remove('facts-page');
    };
  }, []);

  return <>{children}</>;
}
