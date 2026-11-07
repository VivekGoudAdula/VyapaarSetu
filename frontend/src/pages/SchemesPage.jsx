import React, { useState, useEffect, useCallback } from 'react';
import { schemesService } from '@/services/schemes.service';
import { productsService } from '@/services/products.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Tag,
  Plus,
  Calculator,
  RefreshCw,
  Gift,
  Layers,
  Percent,
  IndianRupee,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  X,
  Loader2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const SCHEME_TYPES = [
  { id: 'BUY_X_GET_Y', label: 'Buy X Get Y (Free Goods)', icon: Gift },
  { id: 'VOLUME_SLAB_DISCOUNT', label: 'Volume Slab Discount', icon: Layers },
  { id: 'PERCENTAGE_DISCOUNT', label: 'Flat Percentage Discount', icon: Percent },
  { id: 'FIXED_AMOUNT_DISCOUNT', label: 'Fixed Cash Discount', icon: IndianRupee },
];

export function SchemesPage() {
  const [schemes, setSchemes] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Metrics
  const [metrics, setMetrics] = useState({
    active: 0,
    upcoming: 0,
    expired: 0,
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);

  // Create form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const initialFormState = {
    name: '',
    description: '',
    scheme_type: 'BUY_X_GET_Y',
    applicable_product_ids: [],
    buy_quantity: 10,
    free_product_id: '',
    free_quantity: 1,
    min_order_quantity: 5,
    discount_percentage: 5,
    discount_amount: 50,
    slabs: [
      { min_quantity: 5, max_quantity: 9, discount_percentage: 2 },
      { min_quantity: 10, max_quantity: 24, discount_percentage: 5 },
      { min_quantity: 25, max_quantity: null, discount_percentage: 8 },
    ],
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: '',
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  // Calculator Sandbox state
  const [calcInput, setCalcInput] = useState({
    product_id: '',
    quantity: 10,
    unit_price: 1400,
  });
  const [calcResult, setCalcResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const loadSchemes = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await schemesService.listSchemes({
        page: 1,
        limit: 50,
        status: statusFilter,
      });

      setSchemes(res.items || []);
      setMetrics({
        active: res.active_count || 0,
        upcoming: res.upcoming_count || 0,
        expired: res.expired_count || 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to load trade promotional schemes.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadSchemes();
    // Load products list for multi-select
    productsService.listProducts({ page: 1, limit: 100 })
      .then((res) => {
        setProductsList(res.items || []);
        if (res.items && res.items.length > 0) {
          setCalcInput((prev) => ({
            ...prev,
            product_id: res.items[0].id,
            unit_price: res.items[0].base_wholesale_price || 1400,
          }));
        }
      })
      .catch((err) => console.error('Failed to load products for schemes', err));
  }, [loadSchemes]);

  const handleOpenCreateModal = () => {
    setFormData({
      ...initialFormState,
      free_product_id: productsList[0]?.id || '',
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleToggleProductSelection = (prodId) => {
    setFormData((prev) => {
      const exists = prev.applicable_product_ids.includes(prodId);
      const updated = exists
        ? prev.applicable_product_ids.filter((id) => id !== prodId)
        : [...prev.applicable_product_ids, prodId];
      return { ...prev, applicable_product_ids: updated };
    });
  };

  const handleCreateScheme = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (formData.applicable_product_ids.length === 0) {
        throw new Error('Please select at least one applicable target product.');
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        scheme_type: formData.scheme_type,
        applicable_product_ids: formData.applicable_product_ids,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
        is_active: formData.is_active,
      };

      if (formData.scheme_type === 'BUY_X_GET_Y') {
        payload.buy_quantity = parseInt(formData.buy_quantity, 10);
        payload.free_quantity = parseInt(formData.free_quantity, 10);
        payload.free_product_id = formData.free_product_id || null;
      } else if (formData.scheme_type === 'VOLUME_SLAB_DISCOUNT') {
        payload.slabs = formData.slabs.map((s) => ({
          min_quantity: parseInt(s.min_quantity, 10),
          max_quantity: s.max_quantity ? parseInt(s.max_quantity, 10) : null,
          discount_percentage: parseFloat(s.discount_percentage),
        }));
      } else if (formData.scheme_type === 'PERCENTAGE_DISCOUNT') {
        payload.min_order_quantity = parseInt(formData.min_order_quantity, 10);
        payload.discount_percentage = parseFloat(formData.discount_percentage);
      } else if (formData.scheme_type === 'FIXED_AMOUNT_DISCOUNT') {
        payload.min_order_quantity = parseInt(formData.min_order_quantity, 10);
        payload.discount_amount = parseFloat(formData.discount_amount);
      }

      await schemesService.createScheme(payload);
      setSuccessMessage(`Trade promotion "${payload.name}" launched successfully.`);
      setIsCreateModalOpen(false);
      loadSchemes(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to create scheme.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSchemeStatus = async (scheme) => {
    try {
      if (scheme.is_active) {
        await schemesService.deleteScheme(scheme.id);
        setSuccessMessage(`Scheme "${scheme.name}" deactivated.`);
      } else {
        await schemesService.updateScheme(scheme.id, { is_active: true });
        setSuccessMessage(`Scheme "${scheme.name}" reactivated.`);
      }
      loadSchemes(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update scheme status.');
    }
  };

  const handleRunCalculation = async () => {
    if (!calcInput.product_id) return;
    setIsCalculating(true);
    setCalcResult(null);

    try {
      const res = await schemesService.calculateSchemes([
        {
          product_id: calcInput.product_id,
          quantity: parseInt(calcInput.quantity, 10) || 1,
          unit_price: parseFloat(calcInput.unit_price) || 0,
        },
      ]);
      setCalcResult(res);
    } catch (err) {
      console.error('Calculation failed', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const renderStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Active Deal
        </span>
      );
    }
    if (status === 'upcoming') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3 text-blue-500" />
          Upcoming
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <XCircle className="w-3 h-3 text-slate-400" />
        Expired / Inactive
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Promotional Schemes & Trade Deals
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Rules Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure Buy-X-Get-Y offers, tiered volume discounts, and test real-time AI cart calculations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSchemes(true)}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsCalcModalOpen(true);
              handleRunCalculation();
            }}
            leftIcon={<Calculator className="w-4 h-4 text-emerald-600" />}
          >
            Scheme Calculator
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Scheme
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

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Trade Promotions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tracking-tight">
            {metrics.active}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Applied automatically during calls</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Upcoming Schemes</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.upcoming}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Scheduled for upcoming dates</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Expired / Inactive</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-700 tracking-tight">
            {metrics.expired}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Archived promotions</p>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <Card className="p-3 bg-white border-slate-200/90 shadow-subtle">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
            Filter Offers:
          </span>
          {[
            { id: 'all', label: `All Schemes (${schemes.length})` },
            { id: 'active', label: `Active (${metrics.active})` },
            { id: 'upcoming', label: `Upcoming (${metrics.upcoming})` },
            { id: 'expired', label: `Expired (${metrics.expired})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap font-medium transition-all ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-subtle'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Schemes List / Cards */}
      {isLoading ? (
        <Card className="p-12 text-center bg-white border-slate-200 shadow-subtle space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading promotional schemes...</p>
        </Card>
      ) : schemes.length === 0 ? (
        <Card className="p-12 text-center bg-white border-slate-200 shadow-subtle space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Gift className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No promotional schemes found</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
            {statusFilter !== 'all'
              ? 'No promotional schemes match the selected filter.'
              : 'Launch your first trade promotion to boost wholesale order sizes and Kirana repeat purchases.'}
          </p>
          <Button size="sm" variant="primary" onClick={handleOpenCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Create Promotional Scheme
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schemes.map((scheme) => {
            const isBuyX = scheme.scheme_type === 'BUY_X_GET_Y';
            const isSlab = scheme.scheme_type === 'VOLUME_SLAB_DISCOUNT';
            const isPct = scheme.scheme_type === 'PERCENTAGE_DISCOUNT';
            const isFixed = scheme.scheme_type === 'FIXED_AMOUNT_DISCOUNT';

            return (
              <Card
                key={scheme.id}
                className="p-5 bg-white border-slate-200/90 shadow-subtle flex flex-col justify-between space-y-4 hover:border-emerald-200 transition-all"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {scheme.scheme_type}
                    </span>
                    {renderStatusBadge(scheme.status)}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {scheme.name}
                    </h3>
                    {scheme.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {scheme.description}
                      </p>
                    )}
                  </div>

                  {/* Conditions & Benefits Highlight */}
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/90 text-xs text-emerald-950 space-y-1">
                    {isBuyX && (
                      <div className="flex items-center gap-1.5 font-bold">
                        <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          Buy {scheme.buy_quantity} Units → Get {scheme.free_quantity} {scheme.free_product_name || 'Free Unit(s)'}
                        </span>
                      </div>
                    )}

                    {isSlab && scheme.slabs && (
                      <div className="space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
                          Volume Slab Tiers:
                        </div>
                        <ul className="text-[11px] space-y-0.5 text-slate-600 pl-5 list-disc">
                          {scheme.slabs.map((s, idx) => (
                            <li key={idx}>
                              {s.min_quantity}{s.max_quantity ? `–${s.max_quantity}` : '+'} units: <strong>{s.discount_percentage}% OFF</strong>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {isPct && (
                      <div className="flex items-center gap-1.5 font-bold">
                        <Percent className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          {scheme.discount_percentage}% OFF on {scheme.min_order_quantity}+ units
                        </span>
                      </div>
                    )}

                    {isFixed && (
                      <div className="flex items-center gap-1.5 font-bold">
                        <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          ₹{scheme.discount_amount} OFF per unit on {scheme.min_order_quantity}+ units
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Applicable Products */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Applicable Products ({scheme.applicable_product_names?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {(scheme.applicable_product_names || []).slice(0, 3).map((pName, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {pName}
                        </span>
                      ))}
                      {(scheme.applicable_product_names || []).length > 3 && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                          +{(scheme.applicable_product_names?.length || 0) - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(scheme.starts_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      {scheme.ends_at ? ` – ${new Date(scheme.ends_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` : ' (Evergreen)'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleSchemeStatus(scheme)}
                    className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                      scheme.is_active
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {scheme.is_active ? 'Deactivate' : 'Reactivate'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE SCHEME MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Create Promotional Trade Scheme
                </h3>
                <p className="text-xs text-slate-500">
                  Define offer parameters, target SKUs, volume discount tiers, and validity windows.
                </p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateScheme} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheme Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Parle Monsoon Bonanza Buy 10 Get 1"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marketing Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Valid on all 100g biscuit cartons throughout July"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Scheme Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Scheme Structure Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SCHEME_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = formData.scheme_type === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setFormData({ ...formData, scheme_type: t.id })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 select-none ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 shadow-subtle ring-1 ring-emerald-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                            {t.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Target Products Multi-select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Eligible Target Products * ({formData.applicable_product_ids.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50">
                  {productsList.length === 0 ? (
                    <p className="text-xs text-slate-400 p-2 text-center">No products found in catalog.</p>
                  ) : (
                    productsList.map((prod) => {
                      const isChecked = formData.applicable_product_ids.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleToggleProductSelection(prod.id)}
                          className={`p-2 rounded-lg flex items-center justify-between text-xs cursor-pointer select-none transition-colors ${
                            isChecked ? 'bg-white border border-emerald-300 font-semibold text-emerald-900 shadow-sm' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100">
                              {prod.sku}
                            </span>
                            <span>{prod.name}</span>
                          </div>
                          <span className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Type-Specific Parameters */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Offer Benefit Parameters
                </span>

                {formData.scheme_type === 'BUY_X_GET_Y' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Buy Quantity (Cartons)
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.buy_quantity}
                        onChange={(e) => setFormData({ ...formData, buy_quantity: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Free Quantity Given
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.free_quantity}
                        onChange={(e) => setFormData({ ...formData, free_quantity: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Free Product SKU
                      </label>
                      <select
                        value={formData.free_product_id}
                        onChange={(e) => setFormData({ ...formData, free_product_id: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="">Same as purchased item</option>
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {formData.scheme_type === 'VOLUME_SLAB_DISCOUNT' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500">
                      Tiered percentage discounts based on order quantity:
                    </p>
                    {formData.slabs.map((slab, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 items-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Min Qty</span>
                          <input
                            type="number"
                            min="1"
                            value={slab.min_quantity}
                            onChange={(e) => {
                              const updated = [...formData.slabs];
                              updated[idx].min_quantity = e.target.value;
                              setFormData({ ...formData, slabs: updated });
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Max Qty (Blank = +)</span>
                          <input
                            type="number"
                            placeholder="Unbounded"
                            value={slab.max_quantity || ''}
                            onChange={(e) => {
                              const updated = [...formData.slabs];
                              updated[idx].max_quantity = e.target.value ? e.target.value : null;
                              setFormData({ ...formData, slabs: updated });
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Discount %</span>
                          <input
                            type="number"
                            step="0.1"
                            value={slab.discount_percentage}
                            onChange={(e) => {
                              const updated = [...formData.slabs];
                              updated[idx].discount_percentage = e.target.value;
                              setFormData({ ...formData, slabs: updated });
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg font-bold text-emerald-700"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {formData.scheme_type === 'PERCENTAGE_DISCOUNT' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Minimum Order Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.min_order_quantity}
                        onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Discount Percentage (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        required
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                      />
                    </div>
                  </div>
                )}

                {formData.scheme_type === 'FIXED_AMOUNT_DISCOUNT' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Minimum Order Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.min_order_quantity}
                        onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Cash Discount Amount (₹ per unit)
                      </label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={formData.discount_amount}
                        onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Validity Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date & Time (Leave blank for evergreen)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmitting}
                >
                  Launch Promotional Scheme
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEME CALCULATOR SANDBOX MODAL */}
      {isCalcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Trade Scheme Calculation Engine
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live deterministic verification of active promotional discounts on order items.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsCalcModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Test Input Form */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  Simulate Order Line Item
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Product SKU
                    </label>
                    <select
                      value={calcInput.product_id}
                      onChange={(e) => {
                        const sel = productsList.find((p) => p.id === e.target.value);
                        setCalcInput({
                          ...calcInput,
                          product_id: e.target.value,
                          unit_price: sel ? sel.base_wholesale_price : calcInput.unit_price,
                        });
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {productsList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Order Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={calcInput.quantity}
                      onChange={(e) => setCalcInput({ ...calcInput, quantity: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Wholesale Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={calcInput.unit_price}
                      onChange={(e) => setCalcInput({ ...calcInput, unit_price: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg font-semibold"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleRunCalculation}
                    isLoading={isCalculating}
                    leftIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Evaluate Schemes
                  </Button>
                </div>
              </div>

              {/* Calculation Output */}
              {calcResult && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-900 block">
                    Calculation Results:
                  </span>

                  <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-subtle space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                      <span className="text-slate-500">Gross Subtotal:</span>
                      <span className="font-semibold text-slate-800">
                        ₹{calcResult.subtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100 text-emerald-700">
                      <span className="font-semibold">Applied Trade Savings:</span>
                      <span className="font-bold">
                        -₹{calcResult.total_savings.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm pt-1">
                      <span className="font-bold text-slate-900">Final Order Total:</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        ₹{calcResult.final_total.toFixed(2)}
                      </span>
                    </div>

                    {/* Free goods breakdown */}
                    {calcResult.free_goods_summary?.length > 0 && (
                      <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong>Free Goods Yielded: </strong>
                          {calcResult.free_goods_summary.map((fg, i) => (
                            <span key={i}>
                              +{fg.quantity} Free Unit(s)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCalcModalOpen(false)}
              >
                Close Sandbox
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
