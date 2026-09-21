import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import { courses, supervisions } from '@/data/teaching';

export const metadata: Metadata = {
  title: 'Teaching',
  description: 'Courses and Student Supervision',
};

export default function TeachingPage() {
  return (
    <article className="post" id="teaching">
      <header>
        <div className="title">
          <h2>
            <Link href="/teaching">Teaching</Link>
          </h2>
          <p>Courses and student projects that I am TAing.</p>
        </div>
      </header>

      <section data-reveal>
        <h2>Courses</h2>
        {courses.map((course) => (
          <div className="course" key={course.title}>
            <div className="what">
              {course.link ? <a href={course.link}>{course.title}</a> : course.title}
              <small>{course.detail}</small>
            </div>
            <div className="when">{course.when}</div>
          </div>
        ))}
      </section>

      <section data-reveal>
        <h2>Student Supervision</h2>
        {supervisions.map((item) => (
          <div className="project" key={item.title}>
            <div className="head">
              <span className="title">{item.title}</span>
              {item.ongoing && <span className="tag accent">Ongoing</span>}
            </div>
            <div className="student">
              {item.student}
              <span className="detail">
                {' · '}
                {item.project} · with{' '}
                {item.supervisors.map((s, i) => (
                  <React.Fragment key={s.name}>
                    {i > 0 && ' and '}
                    {s.link ? <a href={s.link}>{s.name}</a> : s.name}
                  </React.Fragment>
                ))}
              </span>
            </div>
          </div>
        ))}
      </section>
    </article>
  );
}
