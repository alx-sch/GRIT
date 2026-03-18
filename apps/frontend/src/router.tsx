import { DefaultLayout } from '@/components/layout/DefaultLayout';
import { ProtectedLayout, protectedLayoutLoader } from '@/components/layout/ProtectedLayout';
import { ChatFeedLayout, ChatFeedLoader } from '@/features/chat/ChatFeedLayout';
import AdminPage, { adminLoader } from '@/pages/admin/Page';
import { ChatFeedPage } from '@/pages/chat/ChatFeedPage';
import { ChatPage } from '@/pages/chat/ChatPage';
import CreateEventPage, { eventCreationLoader } from '@/pages/create/event/Page';
import Design from '@/pages/design/Page';
import ErrorPage from '@/pages/error/Page';
import EventFeedPage, { eventsLoader } from '@/pages/events/EventFeedPage';
import { EventPage, eventLoader } from '@/pages/events/EventPage';
import { LoginPage, loginPageAction, loginPageLoader } from '@/pages/login/Page';
import { LogoutPage, logoutPageLoader } from '@/pages/logout/Page';
import { Page as MyEventsPage, myEventsLoader } from '@/pages/my-events/Page';
import { Page as ProfilePage, profileLoader } from '@/pages/profile/Page';
import PublicProfilePage, { publicProfileLoader } from '@/pages/public-profile/Page';
import { RegisterPage, registerPageAction, registerPageLoader } from '@/pages/register/Page';
import Users, { usersLoader } from '@/pages/users/Page';
import { useCurrentUserStore } from '@/store/currentUserStore';
import type { NavRoute } from '@/types/navroute';
import { createBrowserRouter, redirect } from 'react-router-dom';
import EditEventPage, { editEventLoader } from './pages/events/EditEventPage';
import FriendsPage, { friendsLoader } from './pages/my-friends/Page';
import { ToSPage } from './pages/legal/ToSPages';
import { ImprintPage } from './pages/legal/ImprintPage';
import { DataPrivacyPage } from './pages/legal/DataPrivacyPage';

export const useBaseNavConfig = (): NavRoute[] => {
  const user = useCurrentUserStore((s) => s.user);

  // NOTE: let's define single source of truth for our routes here.
  const baseNavConfig: NavRoute[] = [
    { path: '/users', label: 'Users' },
    { path: '/events', label: 'Events' },
  ];

  // Only show admin tab if user is admin.
  if (user?.isAdmin) {
    baseNavConfig.push({ path: '/admin', label: 'Admin' });
  }

  return baseNavConfig;
};

export const router = createBrowserRouter([
  {
    Component: DefaultLayout,
    ErrorBoundary: ErrorPage,
    HydrateFallback: () => null,
    children: [
      {
        index: true,
        loader: ({ request }) => {
          const url = new URL(request.url);
          const searchParams = url.searchParams.toString();
          return redirect(`/events${searchParams ? `?${searchParams}` : ''}`);
        },
        Component: () => null,
      },
      {
        path: 'design',
        Component: Design,
        handle: { title: 'Design' },
      },
      {
        path: 'admin',
        Component: AdminPage,
        loader: adminLoader,
        handle: { title: 'Admin Dashboard' },
      },
      {
        path: 'users',
        children: [
          {
            index: true,
            Component: Users,
            loader: usersLoader,
            handle: { title: 'Users' },
          },
          {
            path: ':id',
            Component: PublicProfilePage,
            loader: publicProfileLoader,
            handle: { title: 'Profile' },
          },
        ],
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
            children: [
              {
                index: true,
                Component: EventPage,
                loader: eventLoader,
              },
              {
                path: 'edit',
                Component: ProtectedLayout,
                loader: protectedLayoutLoader,
                children: [
                  {
                    index: true,
                    Component: EditEventPage,
                    loader: editEventLoader,
                  },
                ],
              },
            ],
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
        path: 'register',
        Component: RegisterPage,
        action: registerPageAction,
        loader: registerPageLoader,
      },
      {
        path: 'logout',
        Component: LogoutPage,
        loader: logoutPageLoader,
      },
      {
        path: 'chat',
        id: 'chat-feed',
        handle: { title: 'Chat' },
        Component: ChatFeedLayout,
        loader: ChatFeedLoader,
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
        path: 'profile',
        Component: ProtectedLayout,
        loader: protectedLayoutLoader,
        children: [
          {
            index: true,
            Component: ProfilePage,
            loader: profileLoader,
            handle: { title: 'Profile' },
          },
          {
            path: 'my-events',
            Component: MyEventsPage,
            loader: myEventsLoader,
            handle: { title: 'My Events' },
          },
          {
            path: 'my-friends',
            Component: FriendsPage,
            loader: friendsLoader,
            handle: { title: 'My Friends' },
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
        path: 'terms-of-service',
        Component: ToSPage,
      },
      {
        path: 'imprint',
        Component: ImprintPage,
      },
      {
        path: 'data-privacy',
        Component: DataPrivacyPage,
      },
    ],
  },
]);
