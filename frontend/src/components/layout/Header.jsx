import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { LiveStatusBeacon } from './LiveStatusBeacon';

/**
 * Top Application Header.
 * Features page context, mobile menu trigger, and real-time backend/database connectivity beacon.
 */
export function Header({ onToggleSidebar }) {
  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Page Context */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-emerald-500"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium select-none">
            <span>Workspace</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Overview</span>
          </div>
          <h1 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight leading-tight">
            Distributor Hub
          </h1>
        </div>
      </div>

      {/* Right: Real-time Telemetry & Quick Indicators */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Genuine Health Beacon */}
        <LiveStatusBeacon />

        {/* Minimal Bell Icon (Visual placeholder ready for Phase 7 real-time alerts) */}
        <div className="relative">
          <button
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="Real-time order alerts will activate upon distributor onboarding"
            aria-label="Alerts"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

