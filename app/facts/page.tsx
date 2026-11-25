import React from 'react';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import Personal from '@/components/Facts/Personal';
import SketchDog from '@/components/Facts/SketchDog';
import TextFacts from '@/components/Facts/TextFacts';

export const metadata: Metadata = {
  title: 'Facts',
  description: 'Some random facts about Kai Zhang.',
};

export default function FactsPage() {
  return (
    <article className="post" id="facts">
      <header className="with-portrait">
        <div className="title">
          <h1>
            <Link href="/facts">Random Facts</Link>
          </h1>
          <p>
            The random facts about me are small yet certain proofs that I&apos;m unlike anyone else
            in this world.
          </p>
        </div>
        <Image
          className="portrait"
          src="/images/me03.jpg"
          alt="Kai Zhang"
          width={216}
          height={216}
        />
      </header>

      <div className="facts-content">
        <section data-reveal>
          <h2>Some stats about me</h2>
          <Personal />
        </section>
        <section data-reveal>
          <h2>Other facts</h2>
          <TextFacts />
        </section>
        <section data-reveal>
          <h2>Feed the dog</h2>
          <SketchDog />
          <p className="dog-note">
            I&apos;ve been trying to use AI to generate an interactive dog here. Obviously it is not
            perfect (limited by the capability and my time spent on it). But on the other hand, we
            can also see that AI has been evolving fast.{' '}
            <Link href="/facts/dogs">Click here to see the past versions of the dog.</Link>
          </p>
        </section>
      </div>
    </article>
  );
}
