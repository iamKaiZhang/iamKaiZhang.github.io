export interface Route {
  label: string;
  path: string;
  index?: boolean;
}

const routes: Route[] = [
  {
    label: 'Home',
    path: '/',
  },
  {
    label: 'Research',
    path: '/research',
  },
  {
    label: 'Teaching',
    path: '/teaching',
  },
  {
    label: 'Contact',
    path: '/contact',
  },
];

export default routes;
