import React, { useState, useEffect, useCallback } from 'react';
import { settingsService } from '@/services/settings.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Settings,
  Building2,
  Clock,
  Truck,
  Languages,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Save,
  RefreshCw,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';

const WEEKDAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [settings, setSettings] = useState({
    organization_name: '',
    legal_name: '',
    trade_name: '',
    gstin: '',
    category: 'FMCG_STAPLES',
    contact_phone: '',
    contact_email: '',
    minimum_order_value: 1500,
    order_cutoff_time: '18:00',
    default_language: 'hi-IN',
    supported_languages: ['hi-IN', 'te-IN', 'en-IN'],
    operating_hours: {
      monday: { is_open: true, open_time: '08:00', close_time: '20:00' },
      tuesday: { is_open: true, open_time: '08:00', close_time: '20:00' },
      wednesday: { is_open: true, open_time: '08:00', close_time: '20:00' },
      thursday: { is_open: true, open_time: '08:00', close_time: '20:00' },
      friday: { is_open: true, open_time: '08:00', close_time: '20:00' },
      saturday: { is_open: true, open_time: '08:00', close_time: '21:00' },
      sunday: { is_open: false, open_time: '08:00', close_time: '14:00' },
    },
    delivery_areas: {
      cities: ['Hyderabad', 'Secunderabad'],
      states: ['Telangana'],
      pin_codes: ['500012', '500001', '500002'],
      delivery_notes: 'Standard morning delivery for orders confirmed before 6 PM.',
    },
  });

  // String helpers for list fields
  const [citiesInput, setCitiesInput] = useState('');
  const [statesInput, setStatesInput] = useState('');
  const [pincodesInput, setPincodesInput] = useState('');

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await settingsService.getSettings();
      setSettings(res);
      setCitiesInput((res.delivery_areas?.cities || []).join(', '));
      setStatesInput((res.delivery_areas?.states || []).join(', '));
      setPincodesInput((res.delivery_areas?.pin_codes || []).join(', '));
    } catch (err) {
      setError(err.message || 'Failed to load business configuration.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const citiesList = citiesInput.split(',').map((s) => s.trim()).filter(Boolean);
      const statesList = statesInput.split(',').map((s) => s.trim()).filter(Boolean);
      const pincodesList = pincodesInput.split(',').map((s) => s.trim().replace(/\D/g, '')).filter((s) => s.length === 6);

      const payload = {
        profile: {
          legal_name: settings.legal_name || null,
          trade_name: settings.trade_name || null,
          gstin: settings.gstin ? settings.gstin.trim().toUpperCase() : null,
          category: settings.category || null,
          contact_phone: settings.contact_phone || null,
          contact_email: settings.contact_email || null,
        },
        operating_hours: settings.operating_hours,
        delivery_areas: {
          cities: citiesList,
          states: statesList,
          pin_codes: pincodesList,
          delivery_notes: settings.delivery_areas?.delivery_notes || null,
        },
        minimum_order_value: parseFloat(settings.minimum_order_value) || 0,
        order_cutoff_time: settings.order_cutoff_time || '18:00',
        default_language: settings.default_language || 'hi-IN',
        supported_languages: settings.supported_languages || ['hi-IN'],
      };

      const res = await settingsService.updateSettings(payload);
      setSettings(res);
      setSuccessMessage('Business operating configuration saved successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update business configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWeekdayChange = (dayKey, field, val) => {
    setSettings((prev) => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [dayKey]: {
          ...prev.operating_hours[dayKey],
          [field]: val,
        },
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Business Operating Settings
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Distributor Hub
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure trade name, GSTIN, operating schedules, minimum order thresholds, and delivery pin codes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSettings}
            isLoading={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Reload
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <Card className="p-2 bg-white border-slate-200/90 shadow-subtle">
        <div className="flex items-center gap-2">
          {[
            { id: 'profile', label: 'Business Profile', icon: Building2 },
            { id: 'hours', label: 'Operating Schedules', icon: Clock },
            { id: 'delivery', label: 'Delivery & Policy', icon: Truck },
            { id: 'voice', label: 'AI Voice & Languages', icon: Languages },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-subtle'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Settings Form Body */}
      {isLoading ? (
        <Card className="p-12 text-center bg-white border-slate-200 shadow-subtle space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading business configuration...</p>
        </Card>
      ) : (
        <form onSubmit={handleSave}>
          {/* TAB 1: BUSINESS PROFILE */}
          {activeTab === 'profile' && (
            <Card className="p-6 bg-white border-slate-200/90 shadow-subtle space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Wholesale Distributor Profile
                </h3>
                <p className="text-xs text-slate-500">
                  Legal entity registration details and primary contact information.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trade Display Name
                  </label>
                  <input
                    type="text"
                    value={settings.trade_name || ''}
                    onChange={(e) => setSettings({ ...settings, trade_name: e.target.value })}
                    placeholder="e.g. Sri Balaji Traders"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Spoken by AI during phone greetings</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Legal Entity Name
                  </label>
                  <input
                    type="text"
                    value={settings.legal_name || ''}
                    onChange={(e) => setSettings({ ...settings, legal_name: e.target.value })}
                    placeholder="e.g. Sri Balaji Traders Private Limited"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN (15-Character)
                  </label>
                  <input
                    type="text"
                    maxLength="15"
                    value={settings.gstin || ''}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                    placeholder="36AAACS1429B1Z0"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wholesale Category
                  </label>
                  <select
                    value={settings.category || 'FMCG_STAPLES'}
                    onChange={(e) => setSettings({ ...settings, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="FMCG_STAPLES">FMCG & Food Staples</option>
                    <option value="EDIBLE_OILS">Edible Oils & Mandi</option>
                    <option value="BEVERAGES_SNACKS">Beverages & Confectionery</option>
                    <option value="CLEANING_PERSONAL">Personal Care & Hygiene</option>
                    <option value="GENERAL_WHOLESALE">General Wholesale Merchant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Contact Phone
                  </label>
                  <input
                    type="text"
                    value={settings.contact_phone || ''}
                    onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Support Email
                  </label>
                  <input
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    placeholder="orders@sribalaji.com"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* TAB 2: OPERATING HOURS */}
          {activeTab === 'hours' && (
            <Card className="p-6 bg-white border-slate-200/90 shadow-subtle space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Weekly Operating Schedules
                </h3>
                <p className="text-xs text-slate-500">
                  Define when orders are actively accepted. Calls received outside hours inform retailers of opening timings.
                </p>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {WEEKDAYS.map((day) => {
                  const schedule = settings.operating_hours?.[day.key] || { is_open: true, open_time: '08:00', close_time: '20:00' };
                  return (
                    <div
                      key={day.key}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                        schedule.is_open ? 'bg-white' : 'bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`chk-${day.key}`}
                          checked={schedule.is_open}
                          onChange={(e) => handleWeekdayChange(day.key, 'is_open', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label
                          htmlFor={`chk-${day.key}`}
                          className={`text-xs sm:text-sm font-semibold cursor-pointer ${
                            schedule.is_open ? 'text-slate-900' : 'text-slate-400 line-through'
                          }`}
                        >
                          {day.label}
                        </label>
                      </div>

                      {schedule.is_open ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={schedule.open_time}
                            onChange={(e) => handleWeekdayChange(day.key, 'open_time', e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                          />
                          <span className="text-xs text-slate-400">to</span>
                          <input
                            type="time"
                            value={schedule.close_time}
                            onChange={(e) => handleWeekdayChange(day.key, 'close_time', e.target.value)}
                            className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Closed (Calls inform retailer)</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* TAB 3: DELIVERY & POLICY */}
          {activeTab === 'delivery' && (
            <Card className="p-6 bg-white border-slate-200/90 shadow-subtle space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delivery Zones & Order Policies
                </h3>
                <p className="text-xs text-slate-500">
                  Minimum invoice requirements, dispatch cut-off times, and serviced postal PIN codes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Order Value (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={settings.minimum_order_value}
                      onChange={(e) => setSettings({ ...settings, minimum_order_value: e.target.value })}
                      placeholder="e.g. 1500"
                      className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Orders below this amount prompt caller to add more items</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Daily Order Cut-off Time
                  </label>
                  <input
                    type="time"
                    value={settings.order_cutoff_time || '18:00'}
                    onChange={(e) => setSettings({ ...settings, order_cutoff_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Orders after cut-off dispatched next day</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serviced Cities (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={citiesInput}
                    onChange={(e) => setCitiesInput(e.target.value)}
                    placeholder="e.g. Hyderabad, Secunderabad, Warangal"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Serviced Indian States
                  </label>
                  <input
                    type="text"
                    value={statesInput}
                    onChange={(e) => setStatesInput(e.target.value)}
                    placeholder="e.g. Telangana, Andhra Pradesh"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Whitelisted Postal PIN Codes (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={pincodesInput}
                    onChange={(e) => setPincodesInput(e.target.value)}
                    placeholder="e.g. 500012, 500001, 500002, 500028"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dispatch & Delivery Guidelines Note
                  </label>
                  <textarea
                    rows="2"
                    value={settings.delivery_areas?.delivery_notes || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      delivery_areas: { ...settings.delivery_areas, delivery_notes: e.target.value }
                    })}
                    placeholder="e.g. Morning van dispatches depart warehouse at 7:00 AM."
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* TAB 4: AI VOICE & LANGUAGES */}
          {activeTab === 'voice' && (
            <Card className="p-6 bg-white border-slate-200/90 shadow-subtle space-y-5 animate-in fade-in">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Multilingual AI Voice Persona
                </h3>
                <p className="text-xs text-slate-500">
                  Default language for incoming phone calls and spoken catalogue responses.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Spoken Language
                  </label>
                  <select
                    value={settings.default_language}
                    onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="hi-IN">Hindi (हिंदी) — Default</option>
                    <option value="te-IN">Telugu (తెలుగు)</option>
                    <option value="en-IN">Indian English</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-950">
                    <strong>Automatic Code-Switching:</strong> The voice AI identifies caller dialect (e.g. Hindi, Telugu, or Hinglish) and adapts responses smoothly.
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Save Button Bar */}
          <div className="pt-4 flex items-center justify-end">
            <Button
              type="submit"
              variant="primary"
              size="default"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Configuration
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
