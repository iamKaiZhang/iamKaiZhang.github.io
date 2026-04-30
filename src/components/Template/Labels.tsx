import React from 'react';

export interface Label {
  title: string;
  category: string[];
}

export interface Category {
  name: string;
  color: string;
}

export interface LabelsProps {
  labels: Label[];
  categories?: Category[];
}

const pillStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.3em 0.85em',
  borderRadius: '100px',
  border: '1px solid var(--clr-accent)',
  color: 'var(--clr-fg-bold)',
  background: 'var(--clr-accent-05)',
  fontSize: '0.72em',
  fontFamily: 'var(--font-source-sans, sans-serif)',
  letterSpacing: '0.03em',
  whiteSpace: 'nowrap' as const,
};

const Labels: React.FC<LabelsProps> = ({ labels }) => (
  <div className="labels" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45em' }}>
    {labels.map((label) => (
      <span key={label.title} style={pillStyle}>
        {label.title}
      </span>
    ))}
  </div>
);

export default Labels;
