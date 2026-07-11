'use client';

import React, { useCallback, useState } from 'react';

import Link from 'next/link';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import contactData from '@/data/contact';

// Number of veiled sentences. Each one toggles independently: click to
// reveal it, click again to veil it. The bar at the top of the viewport
// shows how many sentences the visitor has revealed.
const SENTENCES = 4;

export default function Hero() {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const veil = (index: number) => `veil${revealed.has(index) ? ' is-revealed' : ''}`;

  const onHeroClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') && target.closest('.veil.is-revealed')) return;
    if (target.closest('a') && !target.closest('.veil')) return;
    const piece = target.closest('.veil') as HTMLElement | null;
    if (!piece) return;
    const index = Number(piece.dataset.veilIndex);
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  return (
    <div id="home">
      <div className="bg-photo" aria-hidden="true" />
      <div className="bg-vignette" aria-hidden="true" />
      <div
        className="reveal-progress"
        style={{ width: `${(revealed.size / SENTENCES) * 100}%` }}
        aria-hidden="true"
      />

      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div className="hero" onClick={onHeroClick}>
        <p>
          <span className="hl">
            Hi! I&apos;m{' '}
            <Link className="pill" href="/facts" title="There may be random facts behind this">
              Kai Zhang
            </Link>
            , a PhD student at <a href="https://ethz.ch/en.html">ETH Zürich</a>
            <span className={veil(0)} data-veil-index="0">
              , at the{' '}
              <a href="https://control.ee.ethz.ch/">
                <em>Automatic Control Laboratory</em>
              </a>{' '}
              and the{' '}
              <a href="https://idsc.ethz.ch/research-frazzoli.html">
                <em>Institute for Dynamic Systems and Control</em>
              </a>
              ,
            </span>
          </span>
          <span className="hl">
            <span className={veil(0)} data-veil-index="0">
              {' '}
              advised by <a href="https://www.bsaver.io/">Saverio Bolognani</a>,{' '}
              <a href="https://censi.science/">Andrea Censi</a>,{' '}
              <a href="https://sites.google.com/ethz.ch/florian/">Florian Dörfler</a>, and{' '}
              <a href="https://www.linkedin.com/in/emilio-frazzoli-0404ba3/">Emilio Frazzoli</a>.
            </span>
          </span>
        </p>
        <p>
          <span className="hl">
            My research lies at the intersection of <span className="pill">Game Theory</span> and{' '}
            <span className="pill">Control</span>
            <span className={veil(1)} data-veil-index="1">
              . I use mathematical tools from game theory and optimization to analyse and design
              mechanisms
            </span>
          </span>
          <span className="hl">
            <span className={veil(2)} data-veil-index="2">
              {' '}
              for <span className="pill">Socio-Technical Systems</span>, like energy markets and
              mobility systems, with the aim of promoting <span className="pill">Efficiency</span>{' '}
              and <span className="pill">Fairness</span>.
            </span>
          </span>
        </p>
        <p>
          <span className="hl">
            Outside of the lab, you&apos;ll find me singing,{' '}
            <span className="pill">Snowboarding</span>, <span className="pill">Thai Boxing</span>,
            or playing board games.
          </span>
          <span className="hl">
            <span className={veil(3)} data-veil-index="3">
              {' '}
              <em>
                P.S.: click my <Link href="/facts">name</Link> up there for more fun (or not) facts
                about me.
              </em>
            </span>
          </span>
        </p>
      </div>

      <div className="hero-social">
        {contactData.map((item) => (
          <a
            key={item.label}
            className="pill icon-pill"
            href={item.link}
            aria-label={item.label}
            title={item.label}
          >
            <FontAwesomeIcon icon={item.icon} />
          </a>
        ))}
      </div>
    </div>
  );
}
