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
  student?: string;
  project: string;
  status?: 'open' | 'ongoing';
  link?: string;
  supervisors: SupervisorLink[];
}

export const courses: Course[] = [
  {
    title: 'Game Theory and Control',
    link: 'https://www.bsaver.io/teaching/game-theory-and-control',
    detail: 'Tutorials and exam preparation, with Saverio Bolognani',
    when: 'Fall 2023 / 2025 / 2026',
  },
  {
    title: 'Control Systems',
    detail: 'Exam preparation, with Florian Dörfler',
    when: 'Spring 2025 / 2026',
  },
];

// Teaching outside the university
export const offCampus: Course[] = [
  {
    title: 'Certified Snowboard Instructor',
    detail: 'Anwärter, international Level 2, Vienna Ski and Snowboard Instructor Association',
    when: 'Since 2026',
  },
];

export const supervisions: Supervision[] = [
  {
    title:
      "The 'Give-and-Take' in Recommender Systems: A Karma Economy for Fair Visibility Allocation",
    project: 'Bachelor Thesis / Semester Project / Master Thesis',
    status: 'open',
    link: 'https://sirop.org/app/ab476f30-5b8a-4413-b298-6e67f3f064e9',
    supervisors: [{ name: 'Stefania Ionescu', link: 'https://www.sionescu.ro' }],
  },
  {
    title: 'Demand Response for Agentic LLM Serving',
    student: 'Niclas Fischli',
    project: 'Bachelor Thesis 2026',
    status: 'ongoing',
    supervisors: [{ name: 'Leonardo Pedroso', link: 'https://leonardopedroso.github.io' }],
  },
  {
    title: 'Adversarial Interaction-proof Refugee Allocation',
    student: 'Louis Richardt',
    project: 'Bachelor Thesis 2026',
    status: 'ongoing',
    supervisors: [{ name: 'Stefania Ionescu', link: 'https://www.sionescu.ro' }],
  },
  {
    title: 'Adversarial Interaction Attacks in Refugee Matching',
    student: 'Sophia Lahrech',
    project: 'Semester Project 2026',
    supervisors: [{ name: 'Stefania Ionescu', link: 'https://www.sionescu.ro' }],
  },
  {
    title: "The 'Give-and-Take' in Recommender Systems: A Karma Economy for Fair Exploration",
    student: 'Kim Kleinlogel',
    project: 'Bachelor Thesis 2026',
    supervisors: [{ name: 'Stefania Ionescu', link: 'https://www.sionescu.ro' }],
  },
  {
    title: 'Fair Redesign of Online Ad Auctions with a Karma Economy',
    student: 'Idriss Benhallam',
    project: 'Semester Project 2026',
    supervisors: [{ name: 'Stefania Ionescu', link: 'https://www.sionescu.ro' }],
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
