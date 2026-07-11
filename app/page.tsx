import React from 'react';

import type { Metadata } from 'next';

import Hero from '@/components/Home/Hero';

export const metadata: Metadata = {
  description:
    'Kai Zhang is a PhD student at ETH Zürich working at the intersection of game theory and control theory.',
};

export default function HomePage() {
  return <Hero />;
}
