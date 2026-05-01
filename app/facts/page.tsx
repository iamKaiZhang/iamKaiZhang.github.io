import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import Personal from '@/components/Facts/Personal';
import TextFacts from '@/components/Facts/TextFacts';

import PageWrapper from '../components/PageWrapper';

export const metadata: Metadata = {
  title: 'Facts',
  description: 'Some random facts about Kai Zhang.',
};

export default function FactsPage() {
  return (
    <PageWrapper>
      <article className="post" id="facts">
        <header>
          <div className="title">
            <h2>
              <Link href="/facts">Random Facts</Link>
            </h2>
            <p>
              The random facts about me are small yet certain proofs that I&apos;m unlike anyone
              else in this world.
            </p>
          </div>
        </header>

        <div className="facts-content">
          <Personal />
          <TextFacts />
        </div>
      </article>
    </PageWrapper>
  );
}
