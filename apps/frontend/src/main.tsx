import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

import App from './App';

import Home from '@/pages/Home';
import Users, { usersLoader } from '@/pages/Users';
import Design from '@/pages/Design';
import ErrorPage from '@/pages/ErrorPage';

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
    ],
  },
]);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
