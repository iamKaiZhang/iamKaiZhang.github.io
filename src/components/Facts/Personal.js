import React from 'react';
import Table from './Table';
import data from '../../data/facts/personal';

const PersonalStats = () => (
  <>
    <h3>Some stats about me</h3>
    <Table data={data} />
  </>
);

export default PersonalStats;
