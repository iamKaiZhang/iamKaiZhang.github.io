import React from 'react';

import TableRow from './TableRow';
import { TableProps } from './types';

const Table: React.FC<TableProps> = ({ data }) => (
  <ul className="contact-list stats-list">
    {data.map((pair) => (
      <TableRow
        format={pair.format}
        key={pair.label}
        label={pair.label}
        link={pair.link}
        value={pair.value}
      />
    ))}
  </ul>
);

export default Table;
