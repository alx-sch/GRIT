import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

import App from './App';

import Home from '@/pages/home/Page';
import Users, { usersLoader } from '@/pages/users/Page';
import Design from '@/pages/design/Page';
import ErrorPage from '@/pages/error/Page';
import EventFeed from '@/pages/events/Page';
import { ThemeProvider } from '@/providers/theme-provider';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'design',
        element: <Design />,
      },
      {
        path: 'users',
        element: <Users />,
        loader: usersLoader,
        errorElement: <ErrorPage />,
      },
      {
        path: 'profile',
        element: <div>Profile Page (Todo)</div>,
      },
      {
        path: 'events',
        element: <EventFeed />,
      },
    ],
  },
]);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
