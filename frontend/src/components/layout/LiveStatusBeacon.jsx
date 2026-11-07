import React, { useState, useEffect, useCallback } from 'react';
import { getSystemHealth } from '@/services/health.service';
import { cn } from '@/lib/utils';
import { Database, Server, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Real-time Backend & Database Connectivity Status Beacon.
 * Queries actual /health endpoint — zero hardcoded fake status.
 */
export function LiveStatusBeacon({ className }) {
  const [health, setHealth] = useState({
    state: 'checking', // 'checking' | 'connected' | 'degraded' | 'disconnected'
    data: null,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const result = await getSystemHealth();
      setHealth({
        state: result.status,
        data: result,
      });
    } catch {
      setHealth({
        state: 'disconnected',
        data: null,
      });
    } finally {
      setIsManualRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    // Poll every 12 seconds
    const interval = setInterval(checkStatus, 12000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleManualRefresh = (e) => {
    e.stopPropagation();
    setIsManualRefreshing(true);
    checkStatus();
  };

  const getStatusConfig = () => {
    switch (health.state) {
      case 'connected':
        return {
          pillClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
          dotClass: 'bg-emerald-500',
          pulseClass: 'bg-emerald-400',
          label: 'System Operational',
          subtext: 'FastAPI & MongoDB Connected',
        };
      case 'degraded':
        return {
          pillClass: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
          dotClass: 'bg-amber-500',
          pulseClass: 'bg-amber-400',
          label: 'API Online (DB Offline)',
          subtext: 'FastAPI reachable; MongoDB disconnected',
        };
      case 'disconnected':
        return {
          pillClass: 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100',
          dotClass: 'bg-red-500',
          pulseClass: 'bg-red-400',
          label: 'API Disconnected',
          subtext: 'Backend service unreachable',
        };
      default:
        return {
          pillClass: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
          dotClass: 'bg-slate-400',
          pulseClass: 'bg-slate-300',
          label: 'Connecting...',
          subtext: 'Verifying backend health...',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={cn('relative', className)}>
      {/* Clickable Status Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all select-none',
          'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500/50',
          config.pillClass
        )}
        aria-label="System Health Status Details"
        aria-expanded={isOpen}
      >
        <span className="relative flex h-2 w-2">
          {health.state === 'connected' && (
            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', config.pulseClass)} />
          )}
          <span className={cn('relative inline-flex rounded-full h-2 w-2', config.dotClass)} />
        </span>
        <span className="font-semibold">{config.label}</span>
      </button>

      {/* Popover Details Modal / Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-72 sm:w-80 z-40 bg-white rounded-xl shadow-modal border border-slate-200 p-4 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-600" />
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Live System Health
                </h4>
              </div>
              <button
                onClick={handleManualRefresh}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isManualRefreshing && 'animate-spin text-emerald-600')} />
              </button>
            </div>

            <div className="py-3 space-y-2.5">
              {/* Backend API Node */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-slate-400" /> FastAPI Backend:
                </span>
                <span className={cn(
                  'font-semibold inline-flex items-center gap-1',
                  health.data?.isBackendAlive ? 'text-emerald-700' : 'text-red-600'
                )}>
                  {health.data?.isBackendAlive ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Online</>
                  ) : (
                    <><AlertCircle className="w-3.5 h-3.5" /> Offline</>
                  )}
                </span>
              </div>

              {/* MongoDB Database Node */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-400" /> MongoDB:
                </span>
                <span className={cn(
                  'font-semibold inline-flex items-center gap-1',
                  health.data?.isDatabaseConnected ? 'text-emerald-700' : 'text-amber-600'
                )}>
                  {health.data?.isDatabaseConnected ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Connected</>
                  ) : (
                    <><AlertCircle className="w-3.5 h-3.5" /> Disconnected</>
                  )}
                </span>
              </div>

              {/* Ping Latency */}
              {health.data?.latencyMs !== undefined && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Ping Latency:</span>
                  <span className="font-mono">{health.data.latencyMs} ms</span>
                </div>
              )}
            </div>

            <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Endpoint: <code className="text-slate-600">/health</code></span>
              <span>Live telemetry</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

