import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

/**
 * AppShell: Master layout for Vyapaar सेतु.
 * Manages responsive sidebar drawer on mobile and collapsible state on desktop.
 */
export function AppShell() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        isCollapsed={desktopCollapsed}
        onToggleCollapse={() => setDesktopCollapsed(!desktopCollapsed)}
      />

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {/* Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
