import React from 'react';
import { Link } from 'react-router-dom';

import Main from '../layouts/Main';

// import Cell from '../components/Research/Cell';
// import data from '../data/research';

const Research = () => (
  <Main title="Research" description="Learn about Kai Zhang's research.">
    <article className="post" id="research">
      <header>
        <div className="title">
          <h2>
            <Link to="/research">Research</Link>
          </h2>
          <p>A selection of research projects that I&apos;m not too ashamed of</p>
        </div>
      </header>
      <h2>Coming Soon!</h2>
      {/* {data.map((research) => (
        <Cell data={research} key={research.title} />
      ))} */}
    </article>
  </Main>
);

export default Research;
