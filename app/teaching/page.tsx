import React from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';

import { courses, supervisions } from '@/data/teaching';

export const metadata: Metadata = {
  title: 'Teaching',
  description: 'Courses and Student Supervision',
};

// Supervisions grouped by status; an entry without a status is a past project.
const groups = [
  { label: 'Open Projects', className: 'open', status: 'open' },
  { label: 'Ongoing', className: 'ongoing', status: 'ongoing' },
  { label: 'Past', className: 'past', status: undefined },
].map((group) => ({
  ...group,
  items: supervisions.filter((item) => item.status === group.status),
}));

export default function TeachingPage() {
  return (
    <article className="post" id="teaching">
      <header>
        <div className="title">
          <h1>
            <Link href="/teaching">Teaching</Link>
          </h1>
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
        {groups.map(
          (group) =>
            group.items.length > 0 && (
              <div className="group" key={group.label}>
                <h3 className={`status ${group.className}`}>{group.label}</h3>
                {group.items.map((item) => (
                  <div className="project" key={item.title}>
                    <div className="body">
                      <div className="head">
                        {item.link ? (
                          <a className="title" href={item.link}>
                            {item.title}
                          </a>
                        ) : (
                          <span className="title">{item.title}</span>
                        )}
                      </div>
                      <div className="student">
                        {item.student}
                        <span className="detail">
                          {item.student && ' · '}
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
                    {item.link && (
                      <a className="tag apply" href={item.link}>
                        Apply on SiROP
                        <svg viewBox="0 0 12 12" aria-hidden="true">
                          <path d="M3 9 9 3M4.5 3H9v4.5" />
                        </svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ),
        )}
      </section>
    </article>
  );
}
