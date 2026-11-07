import React, { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '@/services/inventory.service';
import { productsService } from '@/services/products.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Boxes,
  PlusCircle,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  X,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  FileText,
  Truck
} from 'lucide-react';

export function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Metrics
  const [metrics, setMetrics] = useState({
    totalSkus: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  // Modals state
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [ledgerDrawerProduct, setLedgerDrawerProduct] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const [receiveForm, setReceiveForm] = useState({
    product_id: '',
    quantity_received: '',
    supplier_invoice: '',
    batch_number: '',
    notes: '',
  });

  const [adjustForm, setAdjustForm] = useState({
    product_id: '',
    movement_type: 'MANUAL_ADJUSTMENT',
    quantity_delta: '',
    reason: '',
    notes: '',
  });

  const loadInventory = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await inventoryService.listInventory({
        page,
        limit: 15,
        status: statusFilter,
      });

      setInventoryItems(res.items || []);
      setTotalItems(res.total || 0);
      setTotalPages(res.pages || 1);
      setMetrics({
        totalSkus: res.total_skus || 0,
        lowStock: res.low_stock_count || 0,
        outOfStock: res.out_of_stock_count || 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to load inventory balances.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  // Load products for dropdown select options
  const loadProductOptions = async () => {
    try {
      const res = await productsService.listProducts({ page: 1, limit: 100 });
      setProductsList(res.items || []);
    } catch (err) {
      console.error('Failed to load products for dropdown', err);
    }
  };

  const handleOpenReceiveModal = () => {
    loadProductOptions();
    setReceiveForm({
      product_id: inventoryItems[0]?.product_id || '',
      quantity_received: '',
      supplier_invoice: '',
      batch_number: '',
      notes: '',
    });
    setFormError(null);
    setIsReceiveModalOpen(true);
  };

  const handleOpenAdjustModal = (item = null) => {
    loadProductOptions();
    setAdjustForm({
      product_id: item ? item.product_id : (inventoryItems[0]?.product_id || ''),
      movement_type: 'MANUAL_ADJUSTMENT',
      quantity_delta: '',
      reason: 'Physical count audit',
      notes: '',
    });
    setFormError(null);
    setIsAdjustModalOpen(true);
  };

  const handleOpenLedger = async (item) => {
    setLedgerDrawerProduct(item);
    setIsLedgerLoading(true);
    try {
      const res = await inventoryService.getProductLedger(item.product_id, { page: 1, limit: 50 });
      setLedgerEntries(res.items || []);
    } catch (err) {
      console.error('Failed to load ledger', err);
    } finally {
      setIsLedgerLoading(false);
    }
  };

  const handleReceiveStockSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const qty = parseInt(receiveForm.quantity_received, 10);
      if (isNaN(qty) || qty <= 0) {
        throw new Error('Please enter a valid quantity received greater than 0.');
      }

      await inventoryService.receiveStock({
        product_id: receiveForm.product_id,
        quantity_received: qty,
        supplier_invoice: receiveForm.supplier_invoice.trim() || null,
        batch_number: receiveForm.batch_number.trim() || null,
        notes: receiveForm.notes.trim() || null,
      });

      setSuccessMessage('Inbound stock shipment successfully recorded and added to ledger.');
      setIsReceiveModalOpen(false);
      loadInventory(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to record received stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStockSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const delta = parseInt(adjustForm.quantity_delta, 10);
      if (isNaN(delta) || delta === 0) {
        throw new Error('Please enter a non-zero quantity delta.');
      }
      if (!adjustForm.reason.trim()) {
        throw new Error('Please provide an audit justification reason.');
      }

      await inventoryService.adjustStock({
        product_id: adjustForm.product_id,
        movement_type: adjustForm.movement_type,
        quantity_delta: delta,
        reason: adjustForm.reason.trim(),
        notes: adjustForm.notes.trim() || null,
      });

      setSuccessMessage('Inventory balance adjusted and audit movement logged.');
      setIsAdjustModalOpen(false);
      loadInventory(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to adjust stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBadge = (status, qty, unit) => {
    if (status === 'out_of_stock' || qty <= 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-500" />
          Out of Stock
        </span>
      );
    }
    if (status === 'low_stock') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          Low Stock Alert
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        Healthy ({qty} {unit}s)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Warehouse Inventory & Ledger
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Live Stock
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time wholesale stock levels, reorder threshold alerts, and immutable movement audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadInventory(true)}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenAdjustModal()}
            leftIcon={<Sliders className="w-4 h-4" />}
          >
            Adjust Balance
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenReceiveModal}
            leftIcon={<Truck className="w-4 h-4" />}
          >
            Receive Stock
          </Button>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tracked SKUs</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {metrics.totalSkus}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Active warehouse items</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Low Stock Warnings</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 tracking-tight">
            {metrics.lowStock}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Below reorder mark</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Out of Stock</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-700 tracking-tight">
            {metrics.outOfStock}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Requires replenishment</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Healthy Stock</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-teal-700 tracking-tight">
            {Math.max(0, metrics.totalSkus - metrics.lowStock - metrics.outOfStock)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Sufficient for orders</p>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card className="p-3 bg-white border-slate-200/90 shadow-subtle">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-2 shrink-0">
            Stock Status:
          </span>
          {[
            { id: 'all', label: `All Balances (${metrics.totalSkus})` },
            { id: 'in_stock', label: 'In Stock Only' },
            { id: 'low_stock', label: `Low Stock Alerts (${metrics.lowStock})` },
            { id: 'out_of_stock', label: `Out of Stock (${metrics.outOfStock})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
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

      {/* Inventory Balances Table */}
      <Card className="bg-white border-slate-200/90 shadow-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Loading stock balances...</p>
          </div>
        ) : inventoryItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Boxes className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No inventory records</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              {statusFilter !== 'all'
                ? 'No products currently match this stock filter.'
                : 'No inventory recorded yet. Add products or record an incoming shipment.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
                  <th className="py-3 px-4">SKU & Product Name</th>
                  <th className="py-3 px-4">Packaging Unit</th>
                  <th className="py-3 px-4 text-center">On Hand</th>
                  <th className="py-3 px-4 text-center">Reserved</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4 text-center">Reorder Mark</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ledger & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                {inventoryItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* SKU & Product */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {item.product_sku}
                        </span>
                        <div className="font-semibold text-slate-900 leading-tight">
                          {item.product_name}
                        </div>
                      </div>
                    </td>

                    {/* Packaging Unit */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-800">
                        {item.packaging_unit}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        (1 = {item.conversion_factor} {item.base_unit}s)
                      </span>
                    </td>

                    {/* On Hand */}
                    <td className="py-3 px-4 text-center whitespace-nowrap font-semibold text-slate-800">
                      {item.quantity_on_hand}
                    </td>

                    {/* Reserved */}
                    <td className="py-3 px-4 text-center whitespace-nowrap font-medium text-slate-500">
                      {item.quantity_reserved}
                    </td>

                    {/* Available Stock */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="text-sm font-bold text-slate-900">
                        {item.quantity_available}
                      </span>
                    </td>

                    {/* Reorder Threshold */}
                    <td className="py-3 px-4 text-center whitespace-nowrap text-slate-500">
                      {item.reorder_threshold}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {renderStatusBadge(item.status, item.quantity_available, item.packaging_unit)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenLedger(item)}
                          title="View movement ledger"
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors flex items-center gap-1"
                        >
                          <History className="w-3.5 h-3.5" />
                          Ledger
                        </button>
                        <button
                          onClick={() => handleOpenAdjustModal(item)}
                          title="Adjust balance"
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Sliders className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalItems} balances)
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

      {/* RECEIVE STOCK SHIPMENT MODAL */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Record Inbound Stock Receipt
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add new shipment to on-hand inventory balance and create ledger entry.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsReceiveModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveStockSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Product SKU *
                </label>
                <select
                  required
                  value={receiveForm.product_id}
                  onChange={(e) => setReceiveForm({ ...receiveForm, product_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="" disabled>Select a product to restock</option>
                  {(productsList.length > 0 ? productsList : inventoryItems).map((p) => (
                    <option key={p.id || p.product_id} value={p.id || p.product_id}>
                      {p.sku || p.product_sku} — {p.name || p.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={receiveForm.quantity_received}
                    onChange={(e) => setReceiveForm({ ...receiveForm, quantity_received: e.target.value })}
                    placeholder="e.g. 50 Cartons"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">In packaging units</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Supplier Invoice / GRN
                  </label>
                  <input
                    type="text"
                    value={receiveForm.supplier_invoice}
                    onChange={(e) => setReceiveForm({ ...receiveForm, supplier_invoice: e.target.value })}
                    placeholder="e.g. INV-2026-8819"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch / Lot Number (Optional)
                </label>
                <input
                  type="text"
                  value={receiveForm.batch_number}
                  onChange={(e) => setReceiveForm({ ...receiveForm, batch_number: e.target.value })}
                  placeholder="e.g. BATCH-OCT26-04"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warehouse Receipt Notes
                </label>
                <textarea
                  rows="2"
                  value={receiveForm.notes}
                  onChange={(e) => setReceiveForm({ ...receiveForm, notes: e.target.value })}
                  placeholder="e.g. Received intact via Delhivery transport, verified seals."
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReceiveModalOpen(false)}
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
                  Confirm Inbound Receipt
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST INVENTORY MODAL */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Manual Inventory Adjustment
                </h3>
                <p className="text-xs text-slate-500">
                  Correct physical discrepancies, record write-offs, or restock customer returns.
                </p>
              </div>
              <button onClick={() => setIsAdjustModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStockSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Product SKU *
                </label>
                <select
                  required
                  value={adjustForm.product_id}
                  onChange={(e) => setAdjustForm({ ...adjustForm, product_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {(productsList.length > 0 ? productsList : inventoryItems).map((p) => (
                    <option key={p.id || p.product_id} value={p.id || p.product_id}>
                      {p.sku || p.product_sku} — {p.name || p.product_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Movement Justification Type *
                </label>
                <select
                  value={adjustForm.movement_type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, movement_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="MANUAL_ADJUSTMENT">Manual Stock Count Adjustment</option>
                  <option value="STOCK_DAMAGED">Damaged / Expired Goods Write-off</option>
                  <option value="STOCK_RETURNED">Customer Return Restock</option>
                  <option value="STOCK_CORRECTION">System Correction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity Delta (Packaging Units) *
                </label>
                <input
                  type="number"
                  required
                  value={adjustForm.quantity_delta}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity_delta: e.target.value })}
                  placeholder="e.g. +10 (restock) or -5 (damaged)"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Negative values deduct stock, positive values increase stock.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. 2 cartons torn in godown water leakage"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdjustModalOpen(false)}
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
                  Apply & Log in Ledger
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVEMENT LEDGER DRAWER */}
      {ledgerDrawerProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/30 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white text-slate-800 font-bold border border-slate-200">
                    {ledgerDrawerProduct.product_sku}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Audit Trail</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {ledgerDrawerProduct.product_name}
                </h3>
              </div>
              <button
                onClick={() => setLedgerDrawerProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Snapshot Bar */}
            <div className="p-4 bg-emerald-50/70 border-b border-emerald-100/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-emerald-800 font-medium">Current Available Stock:</span>
                <span className="ml-1.5 font-bold text-emerald-950 text-sm">
                  {ledgerDrawerProduct.quantity_available} {ledgerDrawerProduct.packaging_unit}s
                </span>
              </div>
              <span className="text-[11px] text-emerald-700">
                1 {ledgerDrawerProduct.packaging_unit} = {ledgerDrawerProduct.conversion_factor} {ledgerDrawerProduct.base_unit}s
              </span>
            </div>

            {/* Drawer Content / Ledger Entries */}
            <div className="flex-1 overflow-y-auto p-5">
              {isLedgerLoading ? (
                <div className="py-12 text-center space-y-2">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs text-slate-500">Loading immutable movement ledger...</p>
                </div>
              ) : ledgerEntries.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No movement history recorded for this SKU.
                </div>
              ) : (
                <div className="space-y-4">
                  {ledgerEntries.map((entry) => {
                    const isPositive = entry.quantity_delta > 0;
                    return (
                      <div
                        key={entry.id}
                        className="p-3.5 rounded-xl border border-slate-200/90 bg-white shadow-subtle space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            {entry.movement_type}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                            isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                            {isPositive ? `+${entry.quantity_delta}` : entry.quantity_delta}
                          </span>
                        </div>

                        <div className="text-xs font-medium text-slate-800">
                          {entry.reason || 'Inventory movement'}
                        </div>

                        {entry.notes && (
                          <p className="text-[11px] text-slate-500 italic">
                            Notes: {entry.notes}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span>
                            Balance: {entry.quantity_before} → <strong className="text-slate-700">{entry.quantity_after}</strong>
                          </span>
                          <span>
                            {new Date(entry.created_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLedgerDrawerProduct(null)}
              >
                Close Drawer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
