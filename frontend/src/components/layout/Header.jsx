import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Globe, Building2, User, LogOut, ShieldCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { LiveStatusBeacon } from './LiveStatusBeacon';
import { cn } from '@/lib/utils';

/**
 * Top Application Header.
 * Features page context, breadcrumbs, authenticated organization pill, user profile menu, and live telemetry.
 */
export function Header({ onToggleMobileSidebar }) {
  const navigate = useNavigate();
  const { user, organization, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Navigation Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium select-none">
            <Link to="/" className="hover:text-emerald-700 transition-colors">
              Vyapaar सेतु
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium truncate max-w-[140px] sm:max-w-xs">
              {organization?.name || 'Workspace'}
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight leading-tight flex items-center gap-2">
            <span>Distributor Desk</span>
            {organization?.role === 'ORGANIZATION_OWNER' && (
              <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-semibold">
                OWNER
              </span>
            )}
          </h1>
        </div>
      </div>

      {/* Right: Live Telemetry Beacon, Organization Chip, & User Menu */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Link back to marketing website */}
        <Link
          to="/"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent transition-colors select-none"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Public Site</span>
        </Link>

        {/* Workspace Organization Chip */}
        <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60 text-xs text-slate-700 font-medium select-none max-w-[200px]">
          <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{organization?.name || 'Mandi Hub'}</span>
        </div>

        {/* Real-time Atlas & API Health Beacon */}
        <LiveStatusBeacon />

        {/* User Account Popover */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full border border-slate-200/90 bg-white hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none shadow-subtle"
            aria-expanded={userMenuOpen}
            aria-label="User account menu"
          >
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60 flex items-center justify-center text-xs font-bold shrink-0">
              {getInitials(user?.name)}
            </div>
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-800 max-w-[100px] truncate">
              {user?.name || 'Account'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setUserMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-64 z-40 bg-white rounded-xl shadow-popover border border-slate-200/90 p-3 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* User info */}
                <div className="pb-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {user?.email}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                      {organization?.role || 'ORGANIZATION_OWNER'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {organization?.business_type}
                    </span>
                  </div>
                </div>

                {/* Organization Details */}
                <div className="py-2.5 border-b border-slate-100 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Organization:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                      {organization?.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Tenant Slug:</span>
                    <span className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                      {organization?.slug}
                    </span>
                  </div>
                </div>

                {/* Logout action */}
                <div className="pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
