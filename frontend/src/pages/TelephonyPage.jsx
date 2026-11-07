import React, { useState, useEffect, useCallback } from 'react';
import { telephonyService } from '@/services/telephony.service';
import { retailersService } from '@/services/retailers.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  PhoneCall,
  Radio,
  Settings,
  RefreshCw,
  Phone,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Copy,
  Clock,
  ExternalLink,
  Store,
  HelpCircle,
  Activity,
  ShieldCheck,
  Play,
  Volume2,
  FileCode,
  Server
} from 'lucide-react';

export function TelephonyPage() {
  // Telephony config & status
  const [config, setConfig] = useState(null);
  const [connectionTest, setConnectionTest] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Calls list & pagination
  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCalls, setTotalCalls] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');

  // Config modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configForm, setConfigForm] = useState({
    phone_number: '',
    display_label: 'Primary Wholesale Sales Line',
    is_active: true,
  });
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);
  const [configError, setConfigError] = useState(null);

  // Detail drawer
  const [selectedCall, setSelectedCall] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Simulate call modal
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [simulateForm, setSimulateForm] = useState({
    from_number: '',
    duration_seconds: 45,
  });
  const [registeredRetailers, setRegisteredRetailers] = useState([]);
  const [isSubmittingSimulate, setIsSubmittingSimulate] = useState(false);
  const [simulateError, setSimulateError] = useState(null);

  // Copy helper
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError(null);
    try {
      const [configRes, callsRes] = await Promise.all([
        telephonyService.getPhoneConfig(),
        telephonyService.listCalls({
          page,
          limit: 15,
          status: statusFilter,
          caller_classification: classificationFilter,
        }),
      ]);

      setConfig(configRes);
      if (configRes) {
        setConfigForm({
          phone_number: configRes.phone_number || '',
          display_label: configRes.display_label || 'Primary Wholesale Sales Line',
          is_active: configRes.is_active ?? true,
        });
      }

      setCalls(callsRes.items || []);
      setTotalPages(callsRes.pages || 1);
      setTotalCalls(callsRes.total || 0);
    } catch (err) {
      console.error('Failed to load telephony data:', err);
      setError(err.message || 'Could not fetch telephony configuration and call records.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, statusFilter, classificationFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load retailers list for the simulation helper
  useEffect(() => {
    const fetchRetailers = async () => {
      try {
        const res = await retailersService.listRetailers({ limit: 50 });
        setRegisteredRetailers(res.items || []);
        if (res.items && res.items.length > 0 && !simulateForm.from_number) {
          setSimulateForm((prev) => ({ ...prev, from_number: res.items[0].primary_phone }));
        }
      } catch (e) {
        // Non-critical
      }
    };
    fetchRetailers();
  }, []);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTest(null);
    try {
      const res = await telephonyService.testConnection();
      setConnectionTest(res);
    } catch (err) {
      setConnectionTest({
        status: 'ERROR',
        is_connected: false,
        message: err.message || 'Connection test failed.',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsSubmittingConfig(true);
    setConfigError(null);
    try {
      const updated = await telephonyService.updatePhoneConfig(configForm);
      setConfig(updated);
      setIsConfigModalOpen(false);
      setSuccessMessage('Business phone line configuration saved successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setConfigError(err.message || 'Failed to update phone line.');
    } finally {
      setIsSubmittingConfig(false);
    }
  };

  const handleSimulateCall = async (e) => {
    e.preventDefault();
    setIsSubmittingSimulate(true);
    setSimulateError(null);
    try {
      const res = await telephonyService.simulateCall({
        from_number: simulateForm.from_number,
        duration_seconds: Number(simulateForm.duration_seconds) || 0,
      });
      setIsSimulateModalOpen(false);
      setSuccessMessage(`Simulated call processed! Caller classified as: ${res.caller_classification}`);
      setTimeout(() => setSuccessMessage(null), 5000);
      loadData(true);
      // Auto-open detail drawer
      setSelectedCall(res);
    } catch (err) {
      setSimulateError(err.message || 'Failed to simulate call.');
    } finally {
      setIsSubmittingSimulate(false);
    }
  };

  const handleViewCallDetail = async (callId) => {
    setIsLoadingDetail(true);
    try {
      const detail = await telephonyService.getCallDetail(callId);
      setSelectedCall(detail);
    } catch (err) {
      console.error('Failed to load call detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  // Metrics computation
  const registeredCount = calls.filter((c) => c.caller_classification === 'REGISTERED_RETAILER').length;
  const matchRate = calls.length > 0 ? Math.round((registeredCount / calls.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Telephony & Lines</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              Vobiz Voice API
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Connect your dedicated Vobiz business number, verify webhook endpoints, and inspect Kirana caller identification logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsRefreshing(true);
              loadData(true);
            }}
            disabled={isRefreshing}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTestConnection}
            disabled={isTestingConnection}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {isTestingConnection ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-emerald-600" />
            ) : (
              <Radio className="w-4 h-4 mr-2 text-emerald-600" />
            )}
            Test Vobiz Line
          </Button>

          <Button
            size="sm"
            onClick={() => setIsSimulateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Simulate Call
          </Button>
        </div>
      </div>

      {/* Connection Test Result Alert */}
      {connectionTest && (
        <div
          className={`p-4 rounded-lg border text-sm flex items-start justify-between gap-3 ${
            connectionTest.is_connected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {connectionTest.is_connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-semibold">{connectionTest.message}</div>
              <div className="text-xs mt-1 text-slate-600">
                Status: <span className="font-mono uppercase">{connectionTest.status}</span>
                {connectionTest.auth_id_configured ? ' • Vobiz Auth ID Configured' : ' • Vobiz Auth ID Not Set in Environment'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setConnectionTest(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: Assigned Phone Number */}
        <Card className="p-5 border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assigned Business Line
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                config?.is_active
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {config?.is_active ? 'Active' : 'Unconfigured'}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-slate-900">
              {config?.phone_number || 'No Number Set'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{config?.display_label || 'Vobiz Virtual Line'}</span>
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="text-emerald-600 hover:text-emerald-700 font-medium underline"
            >
              Configure
            </button>
          </div>
        </Card>

        {/* Card 2: Total Call Sessions */}
        <Card className="p-5 border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Inbound Calls
            </span>
            <PhoneCall className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">{totalCalls}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Recorded call sessions with state logs
          </p>
        </Card>

        {/* Card 3: Kirana Match Rate */}
        <Card className="p-5 border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Retailer Identification
            </span>
            <Store className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{matchRate}%</span>
            <span className="text-xs text-slate-500">({registeredCount} matched)</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Auto-resolved to registered Kirana stores
          </p>
        </Card>

        {/* Card 4: Audio Stream Status */}
        <Card className="p-5 border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Bidirectional Audio
            </span>
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-semibold text-slate-900">PCM 16kHz Streaming Ready</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            VobizXML &lt;Stream&gt; protocol active
          </p>
        </Card>
      </div>

      {/* Integration Endpoints Panel */}
      <Card className="p-5 border-slate-200 shadow-sm bg-slate-50/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Vobiz Telephony Webhook Endpoints</h3>
          </div>
          <span className="text-xs text-slate-500">
            Paste these URLs into your Vobiz Voice API phone number configuration
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Answer Webhook */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">Answer Webhook URL (HTTP POST)</span>
              <span className="text-emerald-700 font-mono text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
                Returns VobizXML
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-200/80">
              <code className="text-xs font-mono text-slate-800 break-all select-all">
                {config?.webhook_url || 'http://localhost:8000/api/v1/webhooks/vobiz/inbound-call'}
              </code>
              <button
                onClick={() =>
                  copyToClipboard(
                    config?.webhook_url || 'http://localhost:8000/api/v1/webhooks/vobiz/inbound-call',
                    'webhook'
                  )
                }
                className="text-slate-500 hover:text-emerald-600 flex-shrink-0 p-1"
                title="Copy Answer URL"
              >
                {copiedField === 'webhook' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* WebSocket Stream */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">WebSocket Audio Stream (WSS)</span>
              <span className="text-teal-700 font-mono text-[11px] bg-teal-50 px-1.5 py-0.5 rounded">
                Bidirectional PCM 16kHz
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded border border-slate-200/80">
              <code className="text-xs font-mono text-slate-800 break-all select-all">
                {config?.websocket_url || 'ws://localhost:8000/api/v1/webhooks/vobiz/media-stream'}
              </code>
              <button
                onClick={() =>
                  copyToClipboard(
                    config?.websocket_url || 'ws://localhost:8000/api/v1/webhooks/vobiz/media-stream',
                    'websocket'
                  )
                }
                className="text-slate-500 hover:text-emerald-600 flex-shrink-0 p-1"
                title="Copy WebSocket URL"
              >
                {copiedField === 'websocket' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Call History Table Section */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        {/* Table Filters & Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900">Inbound Call Logs</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {totalCalls} calls
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Call Statuses</option>
              <option value="INITIATED">Initiated</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="BUSY">Busy</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Classification Filter */}
            <select
              value={classificationFilter}
              onChange={(e) => {
                setClassificationFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">All Callers</option>
              <option value="REGISTERED_RETAILER">Registered Kiranas</option>
              <option value="UNKNOWN">Unknown Callers</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Caller ID & Store</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Destination Line</th>
                <th className="py-3 px-4">Call Status</th>
                <th className="py-3 px-4">Stream Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Audit Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    Loading call session records...
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <PhoneCall className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No calls recorded yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click <strong className="text-slate-600">"Simulate Call"</strong> above to test Kirana caller resolution.
                    </p>
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Caller ID & Store */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 font-mono text-xs">
                        {call.from_number}
                      </div>
                      {call.retailer_store_name ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium mt-0.5">
                          <Store className="w-3.5 h-3.5" />
                          <span>{call.retailer_store_name}</span>
                          {call.retailer_name && (
                            <span className="text-slate-400 font-normal">({call.retailer_name})</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mt-0.5">Unregistered Caller</div>
                      )}
                    </td>

                    {/* Classification */}
                    <td className="py-3.5 px-4">
                      {call.caller_classification === 'REGISTERED_RETAILER' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Kirana Retailer
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Unknown
                        </span>
                      )}
                    </td>

                    {/* Destination Line */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {call.to_number}
                    </td>

                    {/* Call Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          call.call_status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : call.call_status === 'IN_PROGRESS' || call.call_status === 'INITIATED'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {call.call_status}
                      </span>
                    </td>

                    {/* Stream Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          call.stream_status === 'STREAMING'
                            ? 'text-teal-700 font-semibold'
                            : call.stream_status === 'DISCONNECTED'
                            ? 'text-slate-500'
                            : 'text-amber-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            call.stream_status === 'STREAMING'
                              ? 'bg-teal-500 animate-pulse'
                              : call.stream_status === 'DISCONNECTED'
                              ? 'bg-slate-300'
                              : 'bg-amber-400'
                          }`}
                        />
                        {call.stream_status}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      {formatDuration(call.duration_seconds)}
                    </td>

                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatTimestamp(call.created_at)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCallDetail(call.id)}
                        className="text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-medium"
                      >
                        <Activity className="w-3.5 h-3.5 mr-1" />
                        Timeline ({call.events_count || 1})
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 px-2.5 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 px-2.5 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal 1: Configure Business Phone Line */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Business Phone Line</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assign your Vobiz virtual number to this distributor organization
                </p>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4">
              {configError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{configError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Vobiz Virtual Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+918012345678 or 10-digit mobile"
                  value={configForm.phone_number}
                  onChange={(e) =>
                    setConfigForm((prev) => ({ ...prev, phone_number: e.target.value }))
                  }
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Must be globally unique. Stored and resolved in E.164 format.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Display Label
                </label>
                <input
                  type="text"
                  placeholder="Primary Wholesale Sales Line"
                  value={configForm.display_label}
                  onChange={(e) =>
                    setConfigForm((prev) => ({ ...prev, display_label: e.target.value }))
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="lineActiveCheck"
                  checked={configForm.is_active}
                  onChange={(e) =>
                    setConfigForm((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="lineActiveCheck" className="text-xs font-medium text-slate-700">
                  Accept incoming calls on this number
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsConfigModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingConfig}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                >
                  {isSubmittingConfig ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving Line...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Simulate Inbound Call */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Simulate Inbound Telephony Call</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify Kirana directory caller matching and state transitions
                </p>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateCall} className="p-5 space-y-4">
              {simulateError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{simulateError}</span>
                </div>
              )}

              {/* Quick Pick From Registered Retailers */}
              {registeredRetailers.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Select Kirana Retailer (Quick Pick)
                  </label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        setSimulateForm((prev) => ({ ...prev, from_number: e.target.value }));
                      }
                    }}
                    className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">— Or choose from directory —</option>
                    {registeredRetailers.map((r) => (
                      <option key={r.id} value={r.primary_phone}>
                        {r.store_name} ({r.primary_phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Caller Phone Number ('From') <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210"
                  value={simulateForm.from_number}
                  onChange={(e) =>
                    setSimulateForm((prev) => ({ ...prev, from_number: e.target.value }))
                  }
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  If this matches a retailer in your directory, caller will be resolved to Kirana store.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Call Duration (seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1800"
                  value={simulateForm.duration_seconds}
                  onChange={(e) =>
                    setSimulateForm((prev) => ({
                      ...prev,
                      duration_seconds: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSimulateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingSimulate}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                >
                  {isSubmittingSimulate ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    'Fire Inbound Webhook'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-out Call Detail & Audit Timeline Drawer */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Call Session Audit</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      selectedCall.call_status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedCall.call_status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  UUID: {selectedCall.vobiz_call_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {/* Caller Summary Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Caller Identification
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {selectedCall.from_number}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      selectedCall.caller_classification === 'REGISTERED_RETAILER'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {selectedCall.caller_classification === 'REGISTERED_RETAILER'
                      ? 'Verified Kirana'
                      : 'Unknown'}
                  </span>
                </div>
                {selectedCall.retailer_store_name && (
                  <div className="pt-2 border-t border-slate-200 text-xs">
                    <div className="font-semibold text-slate-900">{selectedCall.retailer_store_name}</div>
                    <div className="text-slate-500">Owner: {selectedCall.retailer_name || '—'}</div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">Duration:</span>{' '}
                    <strong className="font-mono text-slate-800">
                      {formatDuration(selectedCall.duration_seconds)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Stream:</span>{' '}
                    <strong className="font-mono text-teal-700">{selectedCall.stream_status}</strong>
                  </div>
                </div>
              </div>

              {/* Event Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Chronological State Transitions
                </h4>

                {(!selectedCall.events || selectedCall.events.length === 0) ? (
                  <p className="text-xs text-slate-400">No events logged yet for this call.</p>
                ) : (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {selectedCall.events.map((evt, idx) => (
                      <div key={evt.id || idx} className="relative group">
                        {/* Dot indicator */}
                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-white" />

                        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold font-mono text-slate-800">
                              {evt.event_type}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {formatTimestamp(evt.event_timestamp)}
                            </span>
                          </div>

                          {(evt.previous_state || evt.new_state) && (
                            <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                              <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
                                {evt.previous_state || 'null'}
                              </span>
                              <span>→</span>
                              <span className="font-mono text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-1 py-0.5 rounded">
                                {evt.new_state}
                              </span>
                            </div>
                          )}

                          {evt.safe_metadata && Object.keys(evt.safe_metadata).length > 0 && (
                            <div className="mt-2 bg-slate-50 p-2 rounded text-[11px] font-mono text-slate-700 overflow-x-auto">
                              {JSON.stringify(evt.safe_metadata, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Vyapaar सेतु Audit Trail</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCall(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

