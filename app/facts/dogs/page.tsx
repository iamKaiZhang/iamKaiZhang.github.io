import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import DogMay2026 from '@/components/Facts/DogMay2026';
import InteractiveDog from '@/components/Facts/InteractiveDog';
import SketchDog from '@/components/Facts/SketchDog';

export const metadata: Metadata = {
  title: 'Generations of the Dog',
  description: 'Every version of the AI-generated interactive dog on the Facts page.',
};

// Dates and models come from the commits that introduced each dog.
const generations = [
  {
    title: 'Generation 1',
    meta: '1 May 2026 · started with Claude Sonnet 4.6',
    dog: <DogMay2026 />,
  },
  {
    title: 'Generation 2',
    meta: '12 July 2026 · Claude Fable 5',
    dog: <InteractiveDog />,
  },
  {
    title: 'Generation 3',
    meta: '25 November 2026 · Claude Fable 5.2 · the current dog',
    dog: <SketchDog />,
  },
];

export default function DogGenerationsPage() {
  return (
    <article className="post" id="dogs">
      <header>
        <div className="title">
          <h1>
            <Link href="/facts/dogs">Generations of the Dog</Link>
          </h1>
          <p>
            Every version of the interactive dog on my <Link href="/facts">facts page</Link>, each
            one generated with AI. All of them can still be fed.
          </p>
        </div>
      </header>

      {generations.map((generation) => (
        <section key={generation.title} data-reveal>
          <h2>{generation.title}</h2>
          <p className="generation-meta">{generation.meta}</p>
          {generation.dog}
        </section>
      ))}
    </article>
  );
}
