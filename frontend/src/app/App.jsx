import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

/**
 * Root Application component providing routing context.
 * Global AuthProvider is mounted inside RootLayout within the router tree.
 */
export function App() {
  return <RouterProvider router={router} />;
}

