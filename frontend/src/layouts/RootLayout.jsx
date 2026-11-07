import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';

/**
 * Root Router Layout.
 * Ensures the entire React Router tree is wrapped inside the AuthProvider.
 */
export function RootLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
