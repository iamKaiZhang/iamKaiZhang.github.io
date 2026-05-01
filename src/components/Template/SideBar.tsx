'use client';

import React, { useEffect, useMemo, useRef } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { categories, labels } from '@/data/labels';

import ContactIcons from '../Contact/ContactIcons';
import Labels from './Labels';

interface SideBarProps {
  showFooter?: boolean;
}

const IMAGES = ['/images/me01.jpg', '/images/me02.jpg', '/images/me03.jpg'];

/**
 * Sample the dominant light-muted color from an image via Canvas,
 * then lighten it so it works as a soft background tint.
 */
function extractLightMuted(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const SIZE = 64; // downsample for speed
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        ctx.drawImage(img, 0, 0, SIZE, SIZE);
        const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Skip near-white and near-black pixels (they skew the average)
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness < 30 || brightness > 230) continue;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }

        if (count === 0) return resolve(null);

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Lighten toward white so it works as a background
        const lighten = 0.68;
        r = Math.round(r + (255 - r) * lighten);
        g = Math.round(g + (255 - g) * lighten);
        b = Math.round(b + (255 - b) * lighten);

        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const SideBar: React.FC<SideBarProps> = ({ showFooter = true }) => {
  const selectedImage = useMemo(() => {
    return IMAGES[new Date().getHours() % IMAGES.length];
  }, []);

  const introRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;

    extractLightMuted(selectedImage).then((color) => {
      if (cancelled || !color || !introRef.current) return;
      introRef.current.style.background = color;
    });

    return () => {
      cancelled = true;
    };
  }, [selectedImage]);

  return (
    <section id="sidebar">
      <section id="intro" ref={introRef}>
        <Link href="/" className="logo">
          <Image src={selectedImage} alt="Kai Zhang" width={240} height={240} priority />
        </Link>
        <header>
          <h2>Kai Zhang</h2>
          <p>
            <a href="mailto:zhangkai@ethz.ch">zhangkai@ethz.ch</a>
          </p>
          {!showFooter && <ContactIcons />}
        </header>
      </section>

      <section className="blurb">
        <h2>Key Words</h2>
        <div className="link-container" style={{ marginBottom: '1.5em' }}>
          <Labels labels={labels} categories={categories} />
        </div>
      </section>

      {showFooter && (
        <section id="footer">
          <ContactIcons />
          <p className="copyright">&copy; 2025 Kai Zhang (NO. 131085e).</p>
        </section>
      )}
    </section>
  );
};

export default SideBar;
