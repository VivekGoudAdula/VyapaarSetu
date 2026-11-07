import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { OverviewPage } from '@/pages/OverviewPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Application Router configuration using React Router v6.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <OverviewPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

