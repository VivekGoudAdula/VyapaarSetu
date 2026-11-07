import React, { useState, useEffect, useCallback } from 'react';
import { retailersService } from '@/services/retailers.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Phone,
  MapPin,
  CreditCard,
  Building,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  Store,
  Languages,
  PlusCircle
} from 'lucide-react';

const INDIAN_LANGUAGES = [
  { id: 'hi-IN', label: 'Hindi (हिंदी)' },
  { id: 'te-IN', label: 'Telugu (తెలుగు)' },
  { id: 'en-IN', label: 'Indian English' },
];

export function RetailersPage() {
  const [retailers, setRetailers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Pagination & metrics
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRetailers, setTotalRetailers] = useState(0);
  const [totalCreditAllocated, setTotalCreditAllocated] = useState(0);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRetailer, setEditingRetailer] = useState(null);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const initialFormState = {
    store_name: '',
    owner_name: '',
    primary_phone: '',
    alternate_phone: '',
    gstin: '',
    credit_limit: 25000,
    current_balance: 0,
    preferred_language: 'hi-IN',
    notes: '',
    delivery_addresses: [
      {
        id: 'addr-1',
        label: 'Main Shop Counter',
        address_line1: '',
        address_line2: '',
        city: 'Hyderabad',
        state: 'Telangana',
        pin_code: '500012',
        is_default: true,
      },
    ],
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  const loadRetailers = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await retailersService.listRetailers({
        page,
        limit: 15,
        search: searchQuery,
      });

      setRetailers(res.items || []);
      setTotalRetailers(res.total || 0);
      setTotalPages(res.pages || 1);
      setTotalCreditAllocated(res.total_credit_allocated || 0);
    } catch (err) {
      setError(err.message || 'Failed to load retailer directory.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    loadRetailers();
  }, [loadRetailers]);

  const handleOpenCreateModal = () => {
    setEditingRetailer(null);
    setFormData(initialFormState);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ret) => {
    setEditingRetailer(ret);
    setFormData({
      store_name: ret.store_name,
      owner_name: ret.owner_name,
      primary_phone: ret.primary_phone,
      alternate_phone: ret.alternate_phone || '',
      gstin: ret.gstin || '',
      credit_limit: ret.credit_limit || 0,
      current_balance: ret.current_balance || 0,
      preferred_language: ret.preferred_language || 'hi-IN',
      notes: ret.notes || '',
      delivery_addresses: ret.delivery_addresses?.length > 0 ? ret.delivery_addresses : [
        {
          id: 'addr-1',
          label: 'Main Shop',
          address_line1: '',
          address_line2: '',
          city: 'Hyderabad',
          state: 'Telangana',
          pin_code: '500012',
          is_default: true,
        },
      ],
      is_active: ret.is_active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddAddress = () => {
    setFormData((prev) => ({
      ...prev,
      delivery_addresses: [
        ...prev.delivery_addresses,
        {
          id: `addr-${Date.now()}`,
          label: `Godown / Branch ${prev.delivery_addresses.length + 1}`,
          address_line1: '',
          address_line2: '',
          city: prev.delivery_addresses[0]?.city || 'Hyderabad',
          state: prev.delivery_addresses[0]?.state || 'Telangana',
          pin_code: prev.delivery_addresses[0]?.pin_code || '500012',
          is_default: false,
        },
      ],
    }));
  };

  const handleRemoveAddress = (index) => {
    if (formData.delivery_addresses.length <= 1) return;
    setFormData((prev) => {
      const updated = prev.delivery_addresses.filter((_, i) => i !== index);
      if (!updated.some((a) => a.is_default)) {
        updated[0].is_default = true;
      }
      return { ...prev, delivery_addresses: updated };
    });
  };

  const handleSaveRetailer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        store_name: formData.store_name.trim(),
        owner_name: formData.owner_name.trim(),
        primary_phone: formData.primary_phone.trim(),
        alternate_phone: formData.alternate_phone.trim() || null,
        gstin: formData.gstin.trim() ? formData.gstin.trim().toUpperCase() : null,
        credit_limit: parseFloat(formData.credit_limit) || 0,
        current_balance: parseFloat(formData.current_balance) || 0,
        preferred_language: formData.preferred_language,
        notes: formData.notes.trim() || null,
        delivery_addresses: formData.delivery_addresses.map((addr) => ({
          id: addr.id,
          label: addr.label.trim() || 'Shop',
          address_line1: addr.address_line1.trim(),
          address_line2: addr.address_line2?.trim() || null,
          city: addr.city.trim(),
          state: addr.state.trim(),
          pin_code: addr.pin_code.trim(),
          is_default: !!addr.is_default,
        })),
        is_active: formData.is_active,
      };

      if (editingRetailer) {
        await retailersService.updateRetailer(editingRetailer.id, payload);
        setSuccessMessage(`Retailer "${payload.store_name}" updated.`);
      } else {
        await retailersService.createRetailer(payload);
        setSuccessMessage(`Retailer "${payload.store_name}" registered.`);
      }

      setIsModalOpen(false);
      loadRetailers(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setFormError(err.message || 'Error saving retailer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleRetailerStatus = async (ret) => {
    try {
      if (ret.is_active) {
        await retailersService.deleteRetailer(ret.id);
        setSuccessMessage(`Retailer "${ret.store_name}" deactivated.`);
      } else {
        await retailersService.updateRetailer(ret.id, { is_active: true });
        setSuccessMessage(`Retailer "${ret.store_name}" reactivated.`);
      }
      loadRetailers(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Retailer Directory & Caller Book
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Kirana Accounts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered wholesale retail customers, caller ID associations, delivery addresses, and credit lines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadRetailers(true)}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Register Retailer
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
            <span className="text-xs font-medium text-slate-500">Registered Kiranas</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {totalRetailers}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Wholesale customer accounts</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Credit Line</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tracking-tight">
            ₹{totalCreditAllocated.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Approved aggregate limit</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Phone Caller Recognition</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            100%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Instant AI caller ID resolution</p>
        </Card>
      </div>

      {/* Search Input */}
      <Card className="p-3 bg-white border-slate-200/90 shadow-subtle">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by store name, owner name, mobile number, GSTIN, or city..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 placeholder-slate-400"
          />
        </div>
      </Card>

      {/* Retailers Table */}
      <Card className="bg-white border-slate-200/90 shadow-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Loading retailer directory...</p>
          </div>
        ) : retailers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No retailers registered</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'No retailers match your search query.'
                : 'Register Kirana store customers to recognize incoming voice callers and automate their purchase orders.'}
            </p>
            <Button size="sm" variant="primary" onClick={handleOpenCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
              Register First Retailer
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
                  <th className="py-3 px-4">Store & Owner</th>
                  <th className="py-3 px-4">Primary Phone (Caller ID)</th>
                  <th className="py-3 px-4">Delivery Address</th>
                  <th className="py-3 px-4">Credit Terms</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                {retailers.map((ret) => {
                  const defaultAddr = ret.delivery_addresses?.find((a) => a.is_default) || ret.delivery_addresses?.[0];
                  return (
                    <tr key={ret.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Store Name & Owner */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 leading-snug">
                            {ret.store_name}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span>Prop: {ret.owner_name}</span>
                            {ret.gstin && (
                              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                GST: {ret.gstin}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Primary Phone */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <a
                            href={`tel:+91${ret.primary_phone}`}
                            className="font-mono font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            +91 {ret.primary_phone}
                          </a>
                          {ret.alternate_phone && (
                            <span className="text-[11px] text-slate-400 font-mono block">
                              Alt: +91 {ret.alternate_phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Delivery Address */}
                      <td className="py-3 px-4">
                        {defaultAddr ? (
                          <div className="space-y-0.5 max-w-xs">
                            <div className="font-medium text-slate-800 truncate">
                              {defaultAddr.label}: {defaultAddr.address_line1}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {defaultAddr.city}, {defaultAddr.state} – {defaultAddr.pin_code}
                              {ret.delivery_addresses.length > 1 && (
                                <span className="ml-1 text-emerald-600 font-semibold">
                                  (+{ret.delivery_addresses.length - 1} more)
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No address on file</span>
                        )}
                      </td>

                      {/* Credit Limit & Balance */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">
                            Limit: ₹{ret.credit_limit.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Balance: ₹{ret.current_balance.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </td>

                      {/* Preferred Language */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          {ret.preferred_language === 'hi-IN' ? 'Hindi' : (ret.preferred_language === 'te-IN' ? 'Telugu' : 'English')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleRetailerStatus(ret)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            ret.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${ret.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {ret.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditModal(ret)}
                          title="Edit retailer profile"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalRetailers} registered accounts)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ADD / EDIT RETAILER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingRetailer ? 'Edit Kirana Customer Profile' : 'Register New Kirana Retailer'}
                </h3>
                <p className="text-xs text-slate-500">
                  Associate phone number for automated AI voice caller recognition and order delivery.
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRetailer} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              {/* Store & Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kirana Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.store_name}
                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                    placeholder="e.g. Laxmi Kirana & General Store"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Owner / Proprietor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.owner_name}
                    onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                    placeholder="e.g. Laxmi Narayana"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Phone (10-Digit Mobile) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength="10"
                      value={formData.primary_phone}
                      onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="9848012345"
                      className="w-full pl-11 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Used by Vobiz for caller ID lookup</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Alternate Phone (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength="10"
                      value={formData.alternate_phone}
                      onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="9848098765"
                      className="w-full pl-11 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN (15-Character, Optional)
                  </label>
                  <input
                    type="text"
                    maxLength="15"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="36AAACS1429B1Z0"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred AI Voice Language
                  </label>
                  <select
                    value={formData.preferred_language}
                    onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {INDIAN_LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Credit Line & Balance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Approved Wholesale Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.credit_limit}
                    onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Outstanding Balance (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.current_balance}
                    onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Multiple Delivery Addresses Manager */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Delivery Addresses & Godowns ({formData.delivery_addresses.length})
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="text-xs text-emerald-700 font-semibold hover:text-emerald-800 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Add Another Address
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.delivery_addresses.map((addr, idx) => (
                    <div key={addr.id} className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">
                          Location #{idx + 1}
                        </span>
                        {formData.delivery_addresses.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAddress(idx)}
                            className="text-rose-600 hover:text-rose-700 text-xs flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500">Label</label>
                          <input
                            type="text"
                            required
                            value={addr.label}
                            onChange={(e) => {
                              const updated = [...formData.delivery_addresses];
                              updated[idx].label = e.target.value;
                              setFormData({ ...formData, delivery_addresses: updated });
                            }}
                            placeholder="e.g. Main Shop Front"
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-medium text-slate-500">Address Line 1 *</label>
                          <input
                            type="text"
                            required
                            value={addr.address_line1}
                            onChange={(e) => {
                              const updated = [...formData.delivery_addresses];
                              updated[idx].address_line1 = e.target.value;
                              setFormData({ ...formData, delivery_addresses: updated });
                            }}
                            placeholder="e.g. Shop No. 12, Main Mandi Road"
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500">City *</label>
                          <input
                            type="text"
                            required
                            value={addr.city}
                            onChange={(e) => {
                              const updated = [...formData.delivery_addresses];
                              updated[idx].city = e.target.value;
                              setFormData({ ...formData, delivery_addresses: updated });
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-slate-500">State *</label>
                          <input
                            type="text"
                            required
                            value={addr.state}
                            onChange={(e) => {
                              const updated = [...formData.delivery_addresses];
                              updated[idx].state = e.target.value;
                              setFormData({ ...formData, delivery_addresses: updated });
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-medium text-slate-500">PIN Code *</label>
                          <input
                            type="text"
                            maxLength="6"
                            required
                            value={addr.pin_code}
                            onChange={(e) => {
                              const updated = [...formData.delivery_addresses];
                              updated[idx].pin_code = e.target.value.replace(/\D/g, '');
                              setFormData({ ...formData, delivery_addresses: updated });
                            }}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded font-mono"
                          />
                        </div>
                      </div>

                      <div className="pt-1 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`def-${addr.id}`}
                          checked={addr.is_default}
                          onChange={(e) => {
                            const updated = formData.delivery_addresses.map((a, i) => ({
                              ...a,
                              is_default: i === idx,
                            }));
                            setFormData({ ...formData, delivery_addresses: updated });
                          }}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor={`def-${addr.id}`} className="text-xs text-slate-600 cursor-pointer">
                          Default Primary Delivery Destination
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Delivery & Distributor Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Deliver before 11 AM; unload at back gate."
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
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
                  {editingRetailer ? 'Save Changes' : 'Register Retailer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
