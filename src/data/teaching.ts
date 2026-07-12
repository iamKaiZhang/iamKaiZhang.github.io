export interface Course {
  title: string;
  link?: string;
  detail: string;
  when: string;
}

export interface SupervisorLink {
  name: string;
  link?: string;
}

export interface Supervision {
  title: string;
  student: string;
  project: string;
  ongoing?: boolean;
  supervisors: SupervisorLink[];
}

export const courses: Course[] = [
  {
    title: 'Game Theory and Control',
    link: 'https://www.bsaver.io/teaching/game-theory-and-control',
    detail: 'Tutorials and exam preparation, with Saverio Bolognani',
    when: 'Fall 2023 / 2025',
  },
  {
    title: 'Control Systems',
    detail: 'Exam preparation, with Florian Dörfler',
    when: 'Spring 2025 / 2026',
  },
];

export const supervisions: Supervision[] = [
  {
    title: 'Adversarial Interaction Attacks in Refugee Matching',
    student: 'Sophia Lahrech',
    project: 'Semester Project 2026',
    supervisors: [{ name: 'Stefania Ionescu' }],
  },
  {
    title: "The 'Give-and-Take' in Recommender Systems: A Karma Economy for Fair Exploration",
    student: 'Kim Kleinlogel',
    project: 'Bachelor Thesis 2026',
    supervisors: [{ name: 'Stefania Ionescu' }],
  },
  {
    title: 'Fair Redesign of Online Ad Auctions with a Karma Economy',
    student: 'Idriss Benhallam',
    project: 'Semester Project 2026',
    supervisors: [{ name: 'Stefania Ionescu' }],
  },
  {
    title: 'CO2 Karma Policy',
    student: 'Luise Lenné',
    project: 'Master Thesis 2025',
    supervisors: [
      { name: 'Ezzat Elokda', link: 'https://www.elokda.info' },
      { name: 'Saverio Bolognani', link: 'https://www.bsaver.io' },
    ],
  },
];
