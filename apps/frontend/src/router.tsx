import Home from '@/pages/home/Page';
import Users, { usersLoader } from '@/pages/users/Page';
import Design from '@/pages/design/Page';
import ErrorPage from '@/pages/error/Page';
import EventFeed from '@/pages/events/Page';
import { createBrowserRouter } from 'react-router-dom';
import { DefaultLayout } from '@/components/layout/DefaultLayout';

export interface NavRoute {
  path: `/${string}`;
  label: string;
}

// NOTE: let's define single source of truth for our routes here
export const navConfig: NavRoute[] = [
  { path: '/', label: 'Home' },
  { path: '/design', label: 'Design' },
  { path: '/users', label: 'Users' },
  { path: '/events', label: 'Events' },
] as const;

export const router = createBrowserRouter([
  {
    Component: DefaultLayout,
    ErrorBoundary: ErrorPage,
    children: [
      {
        index: true,
        Component: Home,
        handle: { title: 'Home' },
      },
      {
        path: 'design',
        Component: Design,
        handle: { title: 'Design' },
      },
      {
        path: 'users',
        Component: Users,
        loader: usersLoader,
      },
      {
        path: 'events',
        Component: EventFeed,
      },
    ],
  },
]);
