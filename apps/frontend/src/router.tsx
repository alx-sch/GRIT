import Home from '@/pages/home/Page';
import Users, { usersLoader } from '@/pages/users/Page';
import { eventsLoader } from '@/pages/events/EventFeedPage';
import Design from '@/pages/design/Page';
import ErrorPage from '@/pages/error/Page';
import EventFeedPage from '@/pages/events/EventFeedPage';
import { createBrowserRouter } from 'react-router-dom';
import { DefaultLayout } from '@/components/layout/DefaultLayout';
import { eventLoader } from '@/pages/events/EventPage';
import { EventPage } from '@/pages/events/EventPage';
import { eventCreationLoader } from '@/pages/create/event/Page';
import { LoginPage, loginPageAction, loginPageLoader } from '@/pages/login/Page';
import type { NavRoute } from '@/types/navroute';
import { LogoutPage, logoutPageLoader } from '@/pages/logout/Page';
import { ProtectedLayout, protectedLayoutLoader } from '@/components/layout/ProtectedLayout';
import CreateEventPage from '@/pages/create/event/Page';
import { ChatPage } from '@/pages/chat/ChatPage';
import { ChatFeedPage } from '@/pages/chat/ChatFeedPage';

// NOTE: let's define single source of truth for our routes here
export const baseNavConfig: NavRoute[] = [
  { path: '/', label: 'Home' },
  { path: '/design', label: 'Design' },
  { path: '/users', label: 'Users' },
  { path: '/events', label: 'Events' },
  { path: '/create/event', label: 'Add Event' },
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
        path: 'chat',
        handle: { title: 'Chat' },
        children: [
          {
            index: true,
            Component: ChatFeedPage,
          },
          {
            path: ':id',
            Component: ChatPage,
          },
        ],
      },
      {
        path: 'create',
        Component: ProtectedLayout,
        loader: protectedLayoutLoader,
        children: [
          {
            path: 'event',
            Component: CreateEventPage,
            loader: eventCreationLoader,
          },
        ],
      },
      {
        path: 'design',
        Component: Design,
        handle: { title: 'Design' },
      },
      {
        path: 'events',
        children: [
          {
            index: true,
            Component: EventFeedPage,
            loader: eventsLoader,
            handle: { title: 'Events' },
          },
          {
            path: ':id',
            Component: EventPage,
            loader: eventLoader,
          },
        ],
      },
      {
        path: 'login',
        Component: LoginPage,
        action: loginPageAction,
        loader: loginPageLoader,
      },
      {
        path: 'logout',
        Component: LogoutPage,
        loader: logoutPageLoader,
      },
      {
        path: 'users',
        Component: Users,
        loader: usersLoader,
        handle: { title: 'Users' },
      },
    ],
  },
]);
