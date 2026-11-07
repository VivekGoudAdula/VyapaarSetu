import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell';
import { OverviewPage } from '@/pages/OverviewPage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/auth/PublicOnlyRoute';

/**
 * Master Router configuration using React Router v6.
 * 
 * Distinct experiences:
 * - `/`          -> Public Product Marketing Landing Page (Vyapaar सेतु)
 * - `/login`     -> Distributor Sign In (PublicOnlyRoute)
 * - `/register`  -> Wholesale Business Onboarding (PublicOnlyRoute)
 * - `/app`       -> Protected Distributor Dashboard & Operational Workspace (ProtectedRoute)
 * - Redirects for legacy/convenience paths (`/overview`, `/dashboard`) to `/app`
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
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
