import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import Markdown from 'markdown-to-jsx';

import { teachingMarkdown } from '@/data/teaching';

import PageWrapper from '../components/PageWrapper';

export const metadata: Metadata = {
  title: 'Teaching',
  description: 'Courses and Student Supervision',
};

export default function TeachingPage() {
  return (
    <PageWrapper>
      <article className="post" id="teaching">
        <header>
          <div className="title">
            <h2>
              <Link href="/teaching">Teaching</Link>
            </h2>
            <p>Courses and student projects that I am TAing.</p>
          </div>
        </header>
        <Markdown>{teachingMarkdown}</Markdown>
      </article>
    </PageWrapper>
  );
}
