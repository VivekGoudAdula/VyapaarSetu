import React, { useState, useEffect, useCallback } from 'react';
import { telephonyService } from '@/services/telephony.service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PhoneCall,
  Phone,
  Radio,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Edit2,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Clock,
  UserCheck,
  UserX,
  Volume2,
  Layers,
  ChevronRight,
  X,
  Activity,
  Globe,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';

export function TelephonyPage() {
  const [config, setConfig] = useState(null);
  const [calls, setCalls] = useState([]);
  const [totalCalls, setTotalCalls] = useState(0);
  const [todayCallsCount, setTodayCallsCount] = useState(0);
  const [activeCallsCount, setActiveCallsCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Twilio Connection Test State
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Config Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: '',
    is_active: true,
    greeting_name: '',
    default_language: 'hi-IN',
    agent_gender: 'FEMALE',
    fallback_forward_phone: '',
  });

  // Call Detail Drawer State
  const [selectedCall, setSelectedCall] = useState(null);
  const [isLoadingCallDetail, setIsLoadingCallDetail] = useState(false);
  const [callDetail, setCallDetail] = useState(null);

  // Copy to clipboard helper
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [configData, callsData] = await Promise.all([
        telephonyService.getConfig(),
        telephonyService.listCalls({ page, limit: 15, status: statusFilter }),
      ]);

      setConfig(configData);
      setCalls(callsData.items || []);
      setTotalCalls(callsData.total || 0);
      setTotalPages(callsData.pages || 1);
      setTodayCallsCount(callsData.total_calls_today || 0);
      setActiveCallsCount(callsData.active_calls_count || 0);

      // Pre-fill edit modal form
      setFormData({
        phone_number: configData.phone_number || '',
        is_active: configData.is_active ?? true,
        greeting_name: configData.voice_persona?.greeting_name || '',
        default_language: configData.voice_persona?.default_language || 'hi-IN',
        agent_gender: configData.voice_persona?.agent_gender || 'FEMALE',
        fallback_forward_phone: configData.voice_persona?.fallback_forward_phone || '',
      });
    } catch (err) {
      console.error('Failed to load telephony data:', err);
      setError(err.message || 'Unable to load telephony configuration.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const result = await telephonyService.testConnection();
      setConnectionStatus(result);
    } catch (err) {
      setConnectionStatus({
        connected: false,
        provider: 'twilio',
        status: 'DISCONNECTED',
        notice: err.message || 'Network error verifying Twilio credentials.',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setError(null);

    try {
      const payload = {
        phone_number: formData.phone_number.trim(),
        is_active: formData.is_active,
        voice_persona: {
          greeting_name: formData.greeting_name.trim() || null,
          default_language: formData.default_language,
          agent_gender: formData.agent_gender,
          fallback_forward_phone: formData.fallback_forward_phone.trim() || null,
        },
      };

      const updated = await telephonyService.updateConfig(payload);
      setConfig(updated);
      setIsEditModalOpen(false);
      setSuccessMessage('Telephony configuration updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to save telephony config:', err);
      setError(err.message || 'Failed to update phone configuration.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleViewCallDetail = async (call) => {
    setSelectedCall(call);
    setIsLoadingCallDetail(true);
    setCallDetail(null);
    try {
      const detail = await telephonyService.getCallDetail(call.id);
      setCallDetail(detail);
    } catch (err) {
      console.error('Failed to load call detail:', err);
    } finally {
      setIsLoadingCallDetail(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '—';
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
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Twilio Voice & Stream Channels</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Twilio Programmable Voice
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dedicated business phone line, live webhook endpoints, and real-time audio streams for Vyapaar सेतु.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRefreshing || isLoading}
            className="text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            {testingConnection ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Activity className="w-3.5 h-3.5 mr-1.5" />
            )}
            Test Twilio Credentials
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Twilio Connection Status Diagnostic Card */}
      {connectionStatus && (
        <div
          className={`p-4 rounded-xl border transition-all shadow-subtle ${
            connectionStatus.connected
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {connectionStatus.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">
                  {connectionStatus.connected ? 'Twilio Cloud Connection: Verified' : 'Twilio Connection Diagnostic'}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    connectionStatus.connected ? 'bg-emerald-200 text-emerald-800' : 'bg-amber-200 text-amber-800'
                  }`}
                >
                  {connectionStatus.status}
                </span>
              </div>
              <p className="text-xs mt-1 text-slate-700 leading-relaxed">{connectionStatus.notice}</p>
            </div>
            <button
              onClick={() => setConnectionStatus(null)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* INDIA TELEPHONY REGULATORY NOTICE BANNER */}
      <div className="p-4 sm:p-5 rounded-xl bg-amber-50/90 border border-amber-300/80 text-amber-950 shadow-subtle">
        <div className="flex items-start gap-3.5">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold tracking-tight text-amber-900">
                Official India Telephony Regulatory Notice (Twilio)
              </h4>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                Critical Compliance
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">
              Official Twilio regulatory guidelines state that <strong>domestic inbound calling to standard Indian local numbers (+91) is not supported</strong>.
              Inbound voice calls within India require a <strong>Twilio Indian Toll-Free (1800) number</strong> or an international number with international dialing enabled on the caller&apos;s carrier.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-amber-800/90">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                Trial Accounts: 75 free voice minutes &amp; pre-verified caller IDs required.
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                Trial Call Limit: 10 minutes maximum duration.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Phone Line</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              {config?.phone_number || 'Unconfigured'}
            </span>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${config?.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              {config?.is_active ? 'Routing to Media Streams' : 'Inactive / Paused'}
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calls Today</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{todayCallsCount}</span>
            <p className="text-xs text-slate-500 mt-1">Retailer inbound enquiries today</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Calls</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Radio className={`w-4 h-4 ${activeCallsCount > 0 ? 'animate-pulse text-amber-600' : ''}`} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{activeCallsCount}</span>
            <p className="text-xs text-slate-500 mt-1">Concurrent in-progress streams</p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Handled</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">{totalCalls}</span>
            <p className="text-xs text-slate-500 mt-1">Lifetime incoming call records</p>
          </div>
        </Card>
      </div>

      {/* Twilio Configuration & Webhook Endpoints Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Twilio Integration &amp; Webhook Endpoints
            </CardTitle>
            <CardDescription>
              Configure your Twilio Console with these exact webhook URLs to route audio through Vyapaar सेतु.
            </CardDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="text-slate-700 hover:bg-slate-50 border-slate-200"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Configure Number &amp; Persona
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Webhook URLs Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Inbound Voice Webhook */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  Primary Voice Webhook (TwiML)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                  HTTP POST
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Set this in Twilio Console under <em>Voice Configuration &rarr; A Call Comes In</em>:
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-white px-3 py-2 rounded-lg border border-slate-200 flex-1 truncate text-slate-800">
                  {config?.webhook_url || '—'}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(config?.webhook_url, 'webhook')}
                  className="shrink-0 h-8 px-2.5 text-xs text-slate-700"
                >
                  {copiedKey === 'webhook' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Media Stream WebSocket */}
            <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  Media Stream URL (WebSocket)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  WSS (PCMU 8kHz)
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated stream endpoint dynamically requested in TwiML <code className="text-emerald-700">&lt;Stream&gt;</code>:
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono bg-white px-3 py-2 rounded-lg border border-slate-200 flex-1 truncate text-slate-800">
                  {config?.websocket_url || '—'}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(config?.websocket_url, 'websocket')}
                  className="shrink-0 h-8 px-2.5 text-xs text-slate-700"
                >
                  {copiedKey === 'websocket' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Voice Persona Active Configuration Details */}
          <div className="p-4 rounded-xl bg-white border border-slate-200/80">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
              Active Voice Persona &amp; Escalation Policy
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Spoken Language</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  {config?.voice_persona?.default_language === 'hi-IN'
                    ? 'Hindi (हिंदी)'
                    : config?.voice_persona?.default_language === 'te-IN'
                    ? 'Telugu (తెలుగు)'
                    : 'Indian English'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Voice Persona Gender</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                  {config?.voice_persona?.agent_gender === 'FEMALE' ? 'Female Voice' : 'Male Voice'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Custom Greeting Name</span>
                <span className="font-semibold text-slate-800">
                  {config?.voice_persona?.greeting_name || 'Default Organization Name'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Human Staff Escalation Forward</span>
                <span className="font-semibold text-slate-800">
                  {config?.voice_persona?.fallback_forward_phone || 'None configured (Direct Voice Agent)'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inbound Call Records Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              Incoming Voice Call Log
            </CardTitle>
            <CardDescription>
              Chronological log of retailer calls received on Twilio with automated Kirana caller ID resolution.
            </CardDescription>
          </div>

          {/* Filter by Status */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="RINGING">Ringing</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
              <option value="BUSY">Busy</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-xs">Loading call records from MongoDB Atlas...</span>
            </div>
          ) : calls.length === 0 ? (
            <div className="py-16 text-center space-y-3 px-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">No incoming calls recorded yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                When retailers dial your Twilio number, calls will appear here in real time with automatic Kirana store caller ID resolution.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Time (IST)</th>
                    <th className="py-3 px-4">Caller (From)</th>
                    <th className="py-3 px-4">Kirana Store</th>
                    <th className="py-3 px-4">Twilio Call SID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4 text-right">Audit Trail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {calls.map((call) => {
                    const isKnownRetailer = Boolean(call.retailer_id);
                    const isTerminal = ['COMPLETED', 'FAILED', 'BUSY', 'NO_ANSWER'].includes(call.status);

                    let statusBadgeClass = 'bg-slate-100 text-slate-700';
                    if (call.status === 'COMPLETED') statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    else if (call.status === 'IN_PROGRESS') statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
                    else if (call.status === 'RINGING') statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                    else if (call.status === 'FAILED' || call.status === 'BUSY') statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';

                    return (
                      <tr key={call.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {formatTimestamp(call.created_at)}
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                          {call.from_phone}
                        </td>

                        <td className="py-3 px-4">
                          {isKnownRetailer ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              {call.retailer_name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                              <UserX className="w-3 h-3 text-slate-400" />
                              Unknown Retailer
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          <span title={call.call_sid}>
                            {call.call_sid ? `${call.call_sid.slice(0, 10)}...` : '—'}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadgeClass}`}>
                            {call.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                          {formatDuration(call.duration_seconds)}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCallDetail(call)}
                            className="h-7 px-2.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 font-medium"
                          >
                            View Audit Trace
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {page} of {totalPages} ({totalCalls} total calls)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-3 text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-3 text-xs"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Number & Persona Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Configure Telephony &amp; Persona</h3>
                <p className="text-xs text-slate-500">Update your Twilio phone number and voice defaults.</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4 text-xs">
              {/* Twilio Assigned Phone Number */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Twilio Assigned Phone Number (E.164 format)
                </label>
                <input
                  type="text"
                  required
                  placeholder="+14155552671 or +911800..."
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Must be in E.164 format (e.g. +14155552671). In India, toll-free 1800 numbers are required for domestic inbound.
                </span>
              </div>

              {/* Status active toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active_toggle"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="is_active_toggle" className="font-semibold text-slate-700 cursor-pointer">
                  Accept incoming voice streams on this line
                </label>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-3">
                  Voice Agent Persona
                </h4>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Business Greeting Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Trading Co."
                      value={formData.greeting_name}
                      onChange={(e) => setFormData({ ...formData, greeting_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Spoken Language</label>
                      <select
                        value={formData.default_language}
                        onChange={(e) => setFormData({ ...formData, default_language: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="hi-IN">Hindi (हिंदी)</option>
                        <option value="te-IN">Telugu (తెలుగు)</option>
                        <option value="en-IN">Indian English</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">Voice Agent Gender</label>
                      <select
                        value={formData.agent_gender}
                        onChange={(e) => setFormData({ ...formData, agent_gender: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="FEMALE">Female</option>
                        <option value="MALE">Male</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1">
                      Staff Phone for Human Escalation (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="+919876543210"
                      value={formData.fallback_forward_phone}
                      onChange={(e) => setFormData({ ...formData, fallback_forward_phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 -mx-5 -mb-5 mt-5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingConfig}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSavingConfig ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call Detail & Audit Trail Slide-Out Drawer */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Call Audit Trail</h3>
                <p className="text-xs font-mono text-slate-500">{selectedCall.call_sid}</p>
              </div>
              <button
                onClick={() => setSelectedCall(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Call Overview Header */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Retailer</span>
                  <span className="font-semibold text-slate-900">{selectedCall.retailer_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Caller Phone</span>
                  <span className="font-mono text-slate-800">{selectedCall.from_phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Dialed Number</span>
                  <span className="font-mono text-slate-800">{selectedCall.to_phone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-semibold text-slate-900">{formatDuration(selectedCall.duration_seconds)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Final Outcome</span>
                  <span className="font-semibold text-emerald-700">{selectedCall.status}</span>
                </div>
              </div>

              {/* Chronological Audit Events */}
              <div>
                <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  Lifecycle Event Timeline
                </h4>

                {isLoadingCallDetail ? (
                  <div className="py-8 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading audit trail...</span>
                  </div>
                ) : !callDetail || callDetail.events.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No events recorded for this session.</p>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-200">
                    {callDetail.events.map((evt, idx) => (
                      <div key={evt.id || idx} className="relative pl-6">
                        <span className="absolute left-0.5 top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800 text-[11px]">{evt.event_type}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {formatTimestamp(evt.created_at)}
                            </span>
                          </div>
                          {evt.payload && Object.keys(evt.payload).length > 0 && (
                            <pre className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200/60 overflow-x-auto mt-1.5">
                              {JSON.stringify(evt.payload, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
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
