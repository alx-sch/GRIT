import Home from '@/pages/home/Page';
import Users, { usersLoader } from '@/pages/users/Page';
import { eventsLoader } from '@/pages/events/Page';
import Design from '@/pages/design/Page';
import ErrorPage from '@/pages/error/Page';
import EventFeed from '@/pages/events/Page';
import { createBrowserRouter } from 'react-router-dom';
import { DefaultLayout } from '@/components/layout/DefaultLayout';
import EventCreation from '@/pages/create-event/Page';
import { eventCreationLoader } from '@/pages/create-event/Page';

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
  { path: '/create-event', label: 'Add Event' },
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
        handle: { title: 'Users' },
      },
      {
        path: 'events',
        Component: EventFeed,
        loader: eventsLoader,
        handle: { title: 'Events' },
      },
      {
        path: 'create-event',
        Component: EventCreation,
        loader: eventCreationLoader,
        handle: { title: ' Create Event' },
      },
    ],
  },
]);
