export interface Route {
  label: string;
  path: string;
  index?: boolean;
}

const routes: Route[] = [
  {
    index: true,
    label: 'Kai Zhang',
    path: '/',
  },
  {
    label: 'Home',
    path: '/',
  },
  // {
  //   label: 'CV',
  //   path: '/resume',
  // },
  {
    label: 'Research',
    path: '/research',
  },
  // {
  //   label: 'About',
  //   path: '/about',
  // },
  // {
  //   label: 'Stats',
  //   path: '/stats',
  // },
  {
    label: 'Contact',
    path: '/contact',
  },
];

export default routes;
