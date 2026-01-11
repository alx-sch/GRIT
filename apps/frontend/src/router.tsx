import Home from '@/pages/home/Page';
import Users, { usersLoader } from '@/pages/users/Page';
import Design from '@/pages/design/Page';
import ErrorPage from '@/pages/error/Page';
import EventFeed from '@/pages/events/Page';
import { createBrowserRouter } from 'react-router-dom';
import { DefaultLayout } from '@/components/layout/DefaultLayout';

export const router = createBrowserRouter([
  {
    Component: DefaultLayout,
    ErrorBoundary: ErrorPage,
    children: [
      {
        index: true,
        Component: Home,
      },
      {
        path: 'design',
        Component: Design,
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
