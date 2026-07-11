'use client';

import React from 'react';

import Markdown from 'markdown-to-jsx';

import { textFactsMarkdown } from '@/data/facts/textfacts';

const TextFacts: React.FC = () => (
  <div className="text-facts">
    <Markdown>{textFactsMarkdown}</Markdown>
  </div>
);

export default TextFacts;
