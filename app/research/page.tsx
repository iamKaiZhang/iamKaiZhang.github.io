import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import Paper from '@/components/Research/Paper';
import { researchData } from '@/data/research';

export const metadata: Metadata = {
  title: 'Research',
  description: "Learn about Kai Zhang's research projects.",
};

export default function ResearchPage() {
  return (
    <article className="post" id="research">
      <header>
        <div className="title">
          <h2>
            <Link href="/research">Research</Link>
          </h2>
          <p>A selection of my research projects that I&apos;m excited about.</p>
        </div>
      </header>
      <section>
        {researchData.map((topic) =>
          topic.papers?.map((paper) => <Paper key={paper.title} data={paper} area={topic.title} />),
        )}
      </section>
    </article>
  );
}
