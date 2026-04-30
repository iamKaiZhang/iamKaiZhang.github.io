import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import InteractiveArcanine from '@/components/Facts/InteractiveArcanine';
import Personal from '@/components/Facts/Personal';
import TextFacts from '@/components/Facts/TextFacts';
import CoinStackSVG from '@/components/Facts/illustrations/CoinStackSVG';
import MuayThaiSVG from '@/components/Facts/illustrations/MuayThaiSVG';
import ScalesSVG from '@/components/Facts/illustrations/ScalesSVG';
import SheldonSVG from '@/components/Facts/illustrations/SheldonSVG';

import PageWrapper from '../components/PageWrapper';

export const metadata: Metadata = {
  title: 'Facts',
  description: 'Some random facts about Kai Zhang.',
};

export default function FactsPage() {
  return (
    <PageWrapper>
      <article className="post" id="facts">
        {/* Background illustrations */}
        <div className="facts-illustrations" aria-hidden="true">
          <ScalesSVG className="facts-illus facts-illus--scales" />
          <CoinStackSVG className="facts-illus facts-illus--coins" />
          <MuayThaiSVG className="facts-illus facts-illus--muay" />
          <SheldonSVG className="facts-illus facts-illus--sheldon" />
        </div>

        <header>
          <div className="title">
            <h2>
              <Link href="/facts">Facts</Link>
            </h2>
            <p>
              The random facts about me are small yet certain proofs that I am unlike anyone else in
              this world.
            </p>
          </div>
        </header>

        <div className="facts-content">
          <Personal />
          <TextFacts />
        </div>
      </article>

      {/* Arcanine is fixed-position, lives outside the article flow */}
      <InteractiveArcanine />
    </PageWrapper>
  );
}
