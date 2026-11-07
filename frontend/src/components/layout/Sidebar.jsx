import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Users,
  Mic,
  PhoneCall,
  BarChart3,
  Settings,
  X,
  Radio,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const NAVIGATION_GROUPS = [
  {
    title: 'WORKSPACE',
    items: [
      {
        name: 'Overview',
        path: '/',
        icon: LayoutDashboard,
        isImplemented: true,
      },
    ],
  },
  {
    title: 'BUSINESS',
    items: [
      {
        name: 'Orders Desk',
        icon: ShoppingBag,
        isImplemented: false,
        phase: 'Phase 7',
      },
      {
        name: 'Product Catalogue',
        icon: Package,
        isImplemented: false,
        phase: 'Phase 3',
      },
      {
        name: 'Inventory Ledger',
        icon: Boxes,
        isImplemented: false,
        phase: 'Phase 3',
      },
      {
        name: 'Retailer Book',
        icon: Users,
        isImplemented: false,
        phase: 'Phase 3',
      },
    ],
  },
  {
    title: 'AI OPERATIONS',
    items: [
      {
        name: 'Voice Agent (Vobiz)',
        icon: Mic,
        isImplemented: false,
        phase: 'Phase 4 & 5',
      },
      {
        name: 'Call History & Audio',
        icon: PhoneCall,
        isImplemented: false,
        phase: 'Phase 4',
      },
    ],
  },
  {
    title: 'INSIGHTS & ADMIN',
    items: [
      {
        name: 'Analytics Hub',
        icon: BarChart3,
        isImplemented: false,
        phase: 'Phase 9',
      },
      {
        name: 'Settings & Telephony',
        icon: Settings,
        isImplemented: false,
        phase: 'Roadmap',
      },
    ],
  },
];

/**
 * Enterprise Sidebar for Vyapaar सेतु.
 * Features brand wordmark, Devanagari logo, and cleanly differentiates active vs future planned modules.
 */
export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col',
          'transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Visual Connection Arch Icon */}
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm text-white shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M4 18C4 13.5817 7.58172 10 12 10C16.4183 10 20 13.5817 20 18" />
                <path d="M8 18C8 15.7909 9.79086 14 12 14C14.2091 14 16 15.7909 16 18" stroke="#A7F3D0" />
                <circle cx="12" cy="7" r="2" fill="#FFFFFF" />
              </svg>
            </div>

            <div>
              <div className="text-base font-bold text-slate-900 tracking-tight leading-none flex items-center gap-1">
                <span>Vyapaar</span>
                <span className="text-emerald-600 font-semibold">सेतु</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight mt-1">
                Baatcheet se business tak.
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Body */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAVIGATION_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                {group.title}
              </h3>

              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  if (item.isImplemented) {
                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => onClose && onClose()}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors select-none',
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 font-semibold'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          )
                        }
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      </NavLink>
                    );
                  }

                  // Non-implemented planned roadmap items
                  return (
                    <div
                      key={item.name}
                      className="group flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-slate-400 rounded-lg cursor-not-allowed select-none transition-colors hover:bg-slate-50/70"
                      title={`${item.name} is scheduled for ${item.phase} per roadmap`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono font-medium">
                        {item.phase}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Tenant / Environment Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-subtle flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                Phase 1 Active
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                Foundation & UI Shell
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

