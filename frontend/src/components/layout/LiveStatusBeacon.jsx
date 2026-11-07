import React, { useState, useEffect, useCallback } from 'react';
import { getSystemHealth } from '@/services/health.service';
import { cn } from '@/lib/utils';
import { Database, Server, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Cpu } from 'lucide-react';

/**
 * Enterprise Telemetry Beacon for Vyapaar सेतु.
 * Queries actual /health endpoint — provides live diagnostic telemetry without fake states.
 */
export function LiveStatusBeacon({ className }) {
  const [health, setHealth] = useState({
    state: 'checking', // 'checking' | 'connected' | 'degraded' | 'disconnected'
    data: null,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    // Poll every 10 seconds for real-time responsiveness
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  const handleManualRefresh = (e) => {
    e.stopPropagation();
    setIsRefreshing(true);
    checkStatus();
  };

  const getStatusConfig = () => {
    switch (health.state) {
      case 'connected':
        return {
          pillClass: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/80',
          dotClass: 'bg-emerald-500',
          pulseClass: 'bg-emerald-400',
          label: 'Atlas Live',
          subtext: 'FastAPI & MongoDB Atlas Operational',
        };
      case 'degraded':
        return {
          pillClass: 'bg-amber-50/90 text-amber-800 border-amber-200/80 hover:bg-amber-100/80',
          dotClass: 'bg-amber-500',
          pulseClass: 'bg-amber-400',
          label: 'DB Offline',
          subtext: 'FastAPI online; Database unreachable',
        };
      case 'disconnected':
        return {
          pillClass: 'bg-red-50/90 text-red-800 border-red-200/80 hover:bg-red-100/80',
          dotClass: 'bg-red-500',
          pulseClass: 'bg-red-400',
          label: 'API Offline',
          subtext: 'Backend service unreachable',
        };
      default:
        return {
          pillClass: 'bg-slate-100/90 text-slate-700 border-slate-200 hover:bg-slate-200',
          dotClass: 'bg-slate-400',
          pulseClass: 'bg-slate-300',
          label: 'Connecting...',
          subtext: 'Verifying system telemetry...',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={cn('relative', className)}>
      {/* Sleek Status Trigger Pill */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 select-none shadow-subtle',
          'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500/40',
          config.pillClass
        )}
        aria-label="System Telemetry Details"
        aria-expanded={isOpen}
      >
        <span className="relative flex h-2 w-2">
          {health.state === 'connected' && (
            <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', config.pulseClass)} />
          )}
          <span className={cn('relative inline-flex rounded-full h-2 w-2', config.dotClass)} />
        </span>
        <span className="font-medium tracking-tight">{config.label}</span>
        {health.data?.latencyMs !== undefined && health.state === 'connected' && (
          <span className="text-[10px] text-emerald-600/80 font-mono font-medium pl-0.5 border-l border-emerald-300/60">
            {health.data.latencyMs}ms
          </span>
        )}
      </button>

      {/* Popover Diagnostic Drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-72 sm:w-80 z-40 bg-white rounded-xl shadow-popover border border-slate-200/90 p-4 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                  Live Infrastructure Status
                </h4>
              </div>
              <button
                onClick={handleManualRefresh}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Refresh telemetry"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin text-emerald-600')} />
              </button>
            </div>

            <div className="py-3 space-y-2.5">
              {/* API Node */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-slate-400" /> FastAPI Gateway:
                </span>
                <span className={cn(
                  'font-semibold inline-flex items-center gap-1',
                  health.data?.isBackendAlive ? 'text-emerald-700' : 'text-red-600'
                )}>
                  {health.data?.isBackendAlive ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> v{health.data.version}</>
                  ) : (
                    <><XCircle className="w-3.5 h-3.5" /> Offline</>
                  )}
                </span>
              </div>

              {/* MongoDB Atlas Node */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-slate-400" /> MongoDB Atlas:
                </span>
                <span className={cn(
                  'font-semibold inline-flex items-center gap-1',
                  health.data?.isDatabaseConnected ? 'text-emerald-700' : 'text-amber-600'
                )}>
                  {health.data?.isDatabaseConnected ? (
                    <><CheckCircle2 className="w-3.5 h-3.5" /> Connected ({health.data.databaseName})</>
                  ) : (
                    <><AlertTriangle className="w-3.5 h-3.5" /> Disconnected</>
                  )}
                </span>
              </div>

              {/* Driver info */}
              {health.data?.driver && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Async Driver:</span>
                  <span className="font-mono text-slate-700 text-[11px]">{health.data.driver}</span>
                </div>
              )}

              {/* Latency */}
              {health.data?.latencyMs !== undefined && (
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Ping Latency:</span>
                  <span className="font-mono text-slate-700">{health.data.latencyMs} ms</span>
                </div>
              )}
            </div>

            <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Endpoint: <code className="text-slate-600">/health</code></span>
              <span>Atlas telemetry</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
