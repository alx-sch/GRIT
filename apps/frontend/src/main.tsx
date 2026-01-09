import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

import App from './App';

import Home from '@/pages/Home';
import Users, { usersLoader } from '@/pages/Users';
import Design from '@/pages/Design';
import ErrorPage from '@/pages/ErrorPage';
import EventFeed from '@/pages/eventsFeed/Page';
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
