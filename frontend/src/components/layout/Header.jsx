import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Globe } from 'lucide-react';
import { LiveStatusBeacon } from './LiveStatusBeacon';

/**
 * Top Application Header.
 * Features page context, breadcrumbs, responsive navigation triggers, and live MongoDB Atlas telemetry.
 */
export function Header({ onToggleMobileSidebar }) {
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
            <span className="text-slate-600 font-medium">Workspace</span>
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight leading-tight">
            Distributor Overview
          </h1>
        </div>
      </div>

      {/* Right: Live Telemetry Beacon, Branch Pill, & Landing Page Link */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Link back to marketing website */}
        <Link
          to="/"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent transition-colors select-none"
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Public Site</span>
        </Link>

        {/* Workspace Branch Chip */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200/60 text-xs text-slate-600 font-medium select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Primary Mandi Branch</span>
        </div>

        {/* Real-time Atlas & API Health Beacon */}
        <LiveStatusBeacon />
      </div>
    </header>
  );
}
