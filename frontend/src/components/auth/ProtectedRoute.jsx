import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Route protection guard for the distributor dashboard (/app).
 * Redirects unauthenticated visitors to /login.
 * Never exposes protected canvas during initial session resolution.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-card">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 animate-pulse">
              <path d="M4 18C4 13.5817 7.58172 10 12 10C16.4183 10 20 13.5817 20 18" />
              <path d="M8 18C8 15.7909 9.79086 14 12 14C14.2091 14 16 15.7909 16 18" stroke="#A7F3D0" />
              <circle cx="12" cy="7" r="2" fill="#FFFFFF" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold text-slate-800">
              Vyapaar <span className="text-emerald-600 font-bold">सेतु</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Verifying distributor session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}

