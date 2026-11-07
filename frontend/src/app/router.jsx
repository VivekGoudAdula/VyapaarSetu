import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { AppShell } from '@/layouts/AppShell';
import { OverviewPage } from '@/pages/OverviewPage';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { SchemesPage } from '@/pages/SchemesPage';
import { RetailersPage } from '@/pages/RetailersPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/auth/PublicOnlyRoute';

/**
 * Master Router configuration using React Router v6.
 * 
 * Distinct experiences:
 * - RootLayout   -> Houses AuthProvider and global context
 * - `/`          -> Public Product Marketing Landing Page (Vyapaar सेतु)
 * - `/login`     -> Distributor Sign In (PublicOnlyRoute)
 * - `/register`  -> Wholesale Business Onboarding (PublicOnlyRoute)
 * - `/app`       -> Protected Distributor Dashboard & Operational Workspace (ProtectedRoute)
 *   - `/app`           -> Operational Overview
 *   - `/app/products`  -> Product Catalogue CRUD & Packaging Hierarchy
 *   - `/app/inventory` -> Live Stock Balances & Movement Ledger
 *   - `/app/schemes`   -> Promotional Schemes & Rules Engine
 *   - `/app/retailers` -> Retailer Directory & Caller Book
 *   - `/app/settings`  -> Business Operating Schedules & Zones
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
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
            path: 'products',
            element: <ProductsPage />,
          },
          {
            path: 'inventory',
            element: <InventoryPage />,
          },
          {
            path: 'schemes',
            element: <SchemesPage />,
          },
          {
            path: 'retailers',
            element: <RetailersPage />,
          },
          {
            path: 'settings',
            element: <SettingsPage />,
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
    ],
  },
]);
