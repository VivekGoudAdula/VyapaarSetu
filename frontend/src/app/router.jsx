import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { OverviewPage } from '@/pages/OverviewPage';
import { LandingPage } from '@/pages/LandingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Master Router configuration using React Router v6.
 * 
 * Distinct experiences:
 * - `/`      -> Public Product Marketing Landing Page (Vyapaar सेतु)
 * - `/app`   -> Distributor Dashboard & Operational Workspace (AppShell)
 * - Redirects for legacy/convenience paths (`/overview`, `/dashboard`) to `/app`
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/app',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <OverviewPage />,
      },
      {
        path: 'overview',
        element: <Navigate to="/app" replace />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: '/overview',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '/dashboard',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
