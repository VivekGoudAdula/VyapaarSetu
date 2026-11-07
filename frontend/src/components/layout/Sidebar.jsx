import React from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  Lock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Globe
} from 'lucide-react';

const NAVIGATION_GROUPS = [
  {
    title: 'WORKSPACE',
    items: [
      {
        name: 'Overview',
        path: '/app',
        icon: LayoutDashboard,
        isImplemented: true,
      },
    ],
  },
  {
    title: 'BUSINESS OPERATIONS',
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
    title: 'VOICE COMMERCE',
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
    title: 'INSIGHTS & CONFIG',
    items: [
      {
        name: 'Analytics Hub',
        icon: BarChart3,
        isImplemented: false,
        phase: 'Phase 9',
      },
      {
        name: 'Settings',
        icon: Settings,
        isImplemented: false,
        phase: 'Roadmap',
      },
    ],
  },
];

/**
 * Enterprise Navigation Sidebar for Vyapaar सेतु.
 * Features collapsible desktop state, mobile drawer, and refined roadmap presentation.
 */
export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }) {
  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200/90 flex flex-col',
          'transition-all duration-200 ease-in-out lg:static shrink-0 select-none',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-100/90 flex items-center justify-between">
          <Link to="/app" className="flex items-center gap-3 overflow-hidden group">
            {/* Visual Bridge Arch Logo */}
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-subtle group-hover:bg-emerald-700 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M4 18C4 13.5817 7.58172 10 12 10C16.4183 10 20 13.5817 20 18" />
                <path d="M8 18C8 15.7909 9.79086 14 12 14C14.2091 14 16 15.7909 16 18" stroke="#A7F3D0" />
                <circle cx="12" cy="7" r="2" fill="#FFFFFF" />
              </svg>
            </div>

            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-150">
                <div className="text-base font-bold text-slate-900 tracking-tight leading-none flex items-center gap-1">
                  <span>Vyapaar</span>
                  <span className="text-emerald-600 font-semibold">सेतु</span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-tight mt-1 truncate">
                  Baatcheet se business tak.
                </p>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAVIGATION_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider select-none">
                  {group.title}
                </h3>
              )}

              <div className="space-y-0.5 pt-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  if (item.isImplemented) {
                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => onClose && onClose()}
                        title={isCollapsed ? item.name : undefined}
                        className={({ isActive }) =>
                          cn(
                            'group flex items-center gap-3 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all select-none',
                            isCollapsed && 'justify-center px-2',
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-subtle'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          )
                        }
                      >
                        <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                        {!isCollapsed && (
                          <div className="flex-1 flex items-center justify-between">
                            <span>{item.name}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          </div>
                        )}
                      </NavLink>
                    );
                  }

                  // Planned Roadmap Navigation Items
                  return (
                    <div
                      key={item.name}
                      title={isCollapsed ? `${item.name} (${item.phase})` : `Planned for ${item.phase}`}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2 text-xs sm:text-sm text-slate-400 rounded-lg cursor-not-allowed select-none transition-colors hover:bg-slate-50/60',
                        isCollapsed && 'justify-center px-2'
                      )}
                    >
                      <Icon className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0" />
                      {!isCollapsed && (
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-slate-400">{item.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">
                            {item.phase}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Desktop Collapse Toggle */}
        <div className="hidden lg:flex px-3 py-2 border-t border-slate-100/90">
          <button
            onClick={onToggleCollapse}
            className={cn(
              'w-full flex items-center gap-2 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors',
              isCollapsed && 'justify-center'
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse sidebar</span>
              </>
            )}
          </button>
        </div>

        {/* Workspace Footer Card & Website Link */}
        <div className="p-3 border-t border-slate-100/90 bg-slate-50/40 space-y-2">
          <Link
            to="/"
            title="Return to Public Website"
            className={cn(
              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-emerald-700 hover:bg-white border border-transparent hover:border-slate-200/80 transition-all select-none',
              isCollapsed && 'justify-center p-2'
            )}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            {!isCollapsed && <span>Public Website</span>}
          </Link>

          <div className={cn('p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-subtle flex items-center gap-2.5', isCollapsed && 'justify-center p-2')}>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  Wholesale Hub
                </p>
                <p className="text-[10px] text-emerald-600 font-medium truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Atlas Connected
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
