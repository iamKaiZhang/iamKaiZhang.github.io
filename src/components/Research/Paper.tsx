import React from 'react';

import { PaperData } from './types';

interface PaperProps {
  data: PaperData;
}

const Paper: React.FC<PaperProps> = ({ data }) => (
  <div className="paper" data-reveal>
    <div className="title-row">
      <span className="title">{data.title}</span>
      {data.tags.map((tag) => (
        <span className="tag" key={tag}>
          {tag}
        </span>
      ))}
    </div>
    <div className="meta">{data.authors}</div>
    <div className="venue">
      {data.status ? (
        <em>{data.status}</em>
      ) : (
        <>
          {data.journal}
          {data.year ? ` · ${data.year}` : ''}
        </>
      )}
    </div>
    {data.remark && <div className="meta">{data.remark}</div>}
    {data.links && data.links.length > 0 && (
      <div className="paper-links">
        {data.links.map((item) => (
          <a key={item.link} href={item.link} target="_blank" rel="noopener noreferrer">
            {item.text || item.link}
          </a>
        ))}
      </div>
    )}
  </div>
);

export default Paper;
