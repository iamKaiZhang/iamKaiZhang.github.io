import React, { isValidElement } from 'react';

import { TableRowProps } from './types';

const TableRow: React.FC<TableRowProps> = ({ label, link = null, value = null, format }) => {
  // If value is a React element, render it directly
  const displayValue = isValidElement(value) ? value : format ? format(value) : String(value);

  return (
    <li>
      <span className="label">{label}</span>
      <span className="value">{link ? <a href={link}>{displayValue}</a> : displayValue}</span>
    </li>
  );
};

export default TableRow;
