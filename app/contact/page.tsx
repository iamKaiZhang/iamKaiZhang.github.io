import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import contactData from '@/data/contact';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Multiple ways to contact Kai Zhang',
};

export default function ContactPage() {
  return (
    <article className="post" id="contact">
      <header>
        <div className="title">
          <h2>
            <Link href="/contact">Contact</Link>
          </h2>
          <p>Feel free to get in touch.</p>
        </div>
      </header>
      <section>
        <ul className="contact-list">
          {contactData.map((item) => (
            <li key={item.label}>
              <span className="label">{item.label}</span>
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                {item.display ??
                  item.link.replace('mailto:', '').replace(/^https?:\/\/(www\.)?/, '')}
              </a>
            </li>
          ))}
          <li>
            <span className="label">Office</span>
            <span>
              Automatic Control Laboratory (IfA)
              <br />
              ETH Zürich
              <br />
              Physikstrasse 3, ETL K11
              <br />
              CH-8092 Zürich
            </span>
          </li>
        </ul>
      </section>
    </article>
  );
}
