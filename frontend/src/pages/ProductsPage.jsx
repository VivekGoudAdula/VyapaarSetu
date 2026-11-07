import React, { useState, useEffect, useCallback } from 'react';
import { productsService } from '@/services/products.service';
import { inventoryService } from '@/services/inventory.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Tag,
  Boxes,
  IndianRupee,
  X,
  Loader2,
  Check,
  ChevronRight
} from 'lucide-react';

const COMMON_CATEGORIES = [
  'All',
  'Edible Oils',
  'Staples & Grains',
  'Spices & Masalas',
  'Biscuits & Snacks',
  'Beverages',
  'Dairy & Bakery',
  'Personal Care',
  'Cleaning & Household',
  'General'
];

const PACKAGING_UNITS = ['CARTON', 'BOX', 'BORI', 'CASE', 'PETI', 'BAG', 'PACKET'];
const BASE_UNITS = ['PIECE', 'PACKET', 'KG', 'G', 'LITRE', 'ML', 'POUCH'];

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(COMMON_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // New product form data
  const initialFormState = {
    sku: '',
    name: '',
    brand: '',
    category: 'Staples & Grains',
    description: '',
    base_unit: 'PIECE',
    packaging_unit: 'CARTON',
    conversion_factor: 12,
    mrp: '',
    base_wholesale_price: '',
    min_order_quantity: 1,
    hsn_code: '',
    tax_rate_percentage: 5,
    aliases: '',
    initial_stock: 50,
    low_stock_threshold: 10,
    is_available: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  // Quick adjust form state
  const [adjustData, setAdjustData] = useState({
    movement_type: 'MANUAL_ADJUSTMENT',
    quantity_delta: 0,
    reason: 'Routine stock audit check',
    notes: '',
  });

  const loadProducts = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await productsService.listProducts({
        page,
        limit: 15,
        search: searchQuery,
        category: selectedCategory,
      });

      setProducts(res.items || []);
      setTotalProducts(res.total || 0);
      setTotalPages(res.pages || 1);

      if (res.categories && res.categories.length > 0) {
        const merged = Array.from(new Set(['All', ...res.categories, ...COMMON_CATEGORIES]));
        setCategories(merged);
      }
    } catch (err) {
      setError(err.message || 'Failed to load product catalogue.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, searchQuery, selectedCategory]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku,
      name: prod.name,
      brand: prod.brand || '',
      category: prod.category || 'General',
      description: prod.description || '',
      base_unit: prod.packaging?.base_unit || 'PIECE',
      packaging_unit: prod.packaging?.packaging_unit || 'CARTON',
      conversion_factor: prod.packaging?.conversion_factor || 1,
      mrp: prod.mrp,
      base_wholesale_price: prod.base_wholesale_price,
      min_order_quantity: prod.min_order_quantity || 1,
      hsn_code: prod.hsn_code || '',
      tax_rate_percentage: prod.tax_rate_percentage || 0,
      aliases: (prod.aliases || []).join(', '),
      initial_stock: prod.current_stock || 0,
      low_stock_threshold: 10,
      is_available: prod.is_available,
    });
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const aliasList = formData.aliases
        ? formData.aliases.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        sku: formData.sku.trim().toUpperCase(),
        name: formData.name.trim(),
        brand: formData.brand.trim() || null,
        category: formData.category,
        description: formData.description.trim() || null,
        packaging: {
          base_unit: formData.base_unit,
          packaging_unit: formData.packaging_unit,
          conversion_factor: parseInt(formData.conversion_factor, 10) || 1,
        },
        mrp: parseFloat(formData.mrp) || 0,
        base_wholesale_price: parseFloat(formData.base_wholesale_price) || 0,
        min_order_quantity: parseInt(formData.min_order_quantity, 10) || 1,
        hsn_code: formData.hsn_code.trim() || null,
        tax_rate_percentage: parseFloat(formData.tax_rate_percentage) || 0,
        aliases: aliasList,
        is_available: formData.is_available,
      };

      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id, payload);
        setSuccessMessage(`Product "${payload.name}" updated successfully.`);
      } else {
        payload.initial_stock = parseInt(formData.initial_stock, 10) || 0;
        payload.low_stock_threshold = parseInt(formData.low_stock_threshold, 10) || 10;
        await productsService.createProduct(payload);
        setSuccessMessage(`Product "${payload.name}" registered with opening stock.`);
      }

      setIsCreateModalOpen(false);
      loadProducts(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setFormError(err.message || 'Error saving product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdjustModal = (prod) => {
    setAdjustingProduct(prod);
    setAdjustData({
      movement_type: 'MANUAL_ADJUSTMENT',
      quantity_delta: 0,
      reason: 'Physical inventory audit',
      notes: '',
    });
    setFormError(null);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      const delta = parseInt(adjustData.quantity_delta, 10);
      if (isNaN(delta) || delta === 0) {
        throw new Error('Please enter a non-zero adjustment delta (positive or negative).');
      }

      await inventoryService.adjustStock({
        product_id: adjustingProduct.id,
        movement_type: adjustData.movement_type,
        quantity_delta: delta,
        reason: adjustData.reason,
        notes: adjustData.notes || null,
      });

      setSuccessMessage(`Inventory adjusted for ${adjustingProduct.name}.`);
      setAdjustingProduct(null);
      loadProducts(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to apply stock adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleProductStatus = async (prod) => {
    try {
      if (prod.is_available) {
        await productsService.deleteProduct(prod.id);
        setSuccessMessage(`Product ${prod.sku} deactivated.`);
      } else {
        await productsService.updateProduct(prod.id, { is_available: true });
        setSuccessMessage(`Product ${prod.sku} reactivated.`);
      }
      loadProducts(true);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    }
  };

  // Status badge styling
  const renderStatusBadge = (status, stockQty, unit) => {
    if (status === 'out_of_stock' || stockQty <= 0) {
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
          {stockQty} {unit}s (Low)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        {stockQty} {unit}s
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
              Product Master Catalogue
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
              Wholesale Tier
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage wholesale SKUs, packaging conversions, base prices, and trade stock availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadProducts(true)}
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
            Add New SKU
          </Button>
        </div>
      </div>

      {/* Success / Error Alerts */}
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

      {/* Metrics Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total SKUs</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {totalProducts}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Catalogued products</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Categories</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">
            {categories.length - 1}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Active merchandise groups</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Trade SKUs</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700 tracking-tight">
            {products.filter((p) => p.is_available).length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Orderable over phone</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200/90 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Stock Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 tracking-tight">
            {products.filter((p) => p.stock_status === 'low_stock' || p.stock_status === 'out_of_stock').length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Below safe reorder mark</p>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 bg-white border-slate-200/90 shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by SKU, product name, brand, or vernacular alias (e.g. 'fortune tel')..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-subtle'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Products Table Card */}
      <Card className="bg-white border-slate-200/90 shadow-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm text-slate-500">Loading catalogued products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No products found</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedCategory !== 'All'
                ? 'No items match your active search or category filters. Try clearing them.'
                : 'Your product catalogue is currently empty. Add your first wholesale SKU to enable voice ordering.'}
            </p>
            <Button size="sm" variant="primary" onClick={handleOpenCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
              Add First Wholesale SKU
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none">
                  <th className="py-3 px-4">SKU & Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Packaging & Pack Size</th>
                  <th className="py-3 px-4">Wholesale Rate</th>
                  <th className="py-3 px-4">Live Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                {products.map((prod) => {
                  const pkg = prod.packaging || { packaging_unit: 'CARTON', base_unit: 'PIECE', conversion_factor: 1 };
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                              {prod.sku}
                            </span>
                            {prod.brand && (
                              <span className="text-[11px] text-emerald-700 font-medium">
                                {prod.brand}
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-slate-900 leading-tight">
                            {prod.name}
                          </div>
                          {prod.aliases && prod.aliases.length > 0 && (
                            <div className="text-[11px] text-slate-400 italic">
                              Aliases: {prod.aliases.join(', ')}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          {prod.category}
                        </span>
                      </td>

                      {/* Packaging Hierarchy */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800">
                            1 {pkg.packaging_unit}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            = {pkg.conversion_factor} {pkg.base_unit}s
                          </div>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 flex items-center">
                            ₹{prod.base_wholesale_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            <span className="text-[11px] text-slate-400 font-normal ml-1">/{pkg.packaging_unit}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            MRP: ₹{prod.mrp.toFixed(2)}/{pkg.base_unit}
                          </div>
                        </div>
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderStatusBadge(prod.stock_status, prod.available_stock, pkg.packaging_unit)}
                      </td>

                      {/* Availability Toggle */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleProductStatus(prod)}
                          title={prod.is_available ? 'Click to deactivate' : 'Click to activate'}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                            prod.is_available
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${prod.is_available ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {prod.is_available ? 'Active' : 'Inactive'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAdjustModal(prod)}
                            title="Adjust inventory"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            title="Edit product"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalProducts} total SKUs)
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

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingProduct ? 'Edit Wholesale Product' : 'Add New Wholesale SKU'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure SKU attributes, packaging conversions, pricing, and vernacular aliases.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. FMCG-OIL-FORT-1L"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Unique distributor item code</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Commercial Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Fortune Refined Sunflower Oil 1L Pouch"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Adani Wilmar / Fortune"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    {COMMON_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Packaging Unit Hierarchies */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  Packaging Hierarchy & Conversions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Trade Packaging Unit
                    </label>
                    <select
                      value={formData.packaging_unit}
                      onChange={(e) => setFormData({ ...formData, packaging_unit: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {PACKAGING_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-0.5">Unit billed to retailer</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Conversion Factor
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.conversion_factor}
                      onChange={(e) => setFormData({ ...formData, conversion_factor: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Base units per pack</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Base Retail Unit
                    </label>
                    <select
                      value={formData.base_unit}
                      onChange={(e) => setFormData({ ...formData, base_unit: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {BASE_UNITS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-0.5">Smallest consumer unit</p>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/50">
                  Example: 1 <strong>{formData.packaging_unit}</strong> contains{' '}
                  <strong>{formData.conversion_factor}</strong> individual <strong>{formData.base_unit}s</strong>.
                </div>
              </div>

              {/* Pricing & GST */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wholesale Price (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.base_wholesale_price}
                      onChange={(e) => setFormData({ ...formData, base_wholesale_price: e.target.value })}
                      placeholder="e.g. 1400.00"
                      className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Rate per {formData.packaging_unit}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    MRP (₹) per {formData.base_unit} *
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.mrp}
                      onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                      placeholder="e.g. 155.00"
                      className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Consumer printed price</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Rate (%)
                  </label>
                  <select
                    value={formData.tax_rate_percentage}
                    onChange={(e) => setFormData({ ...formData, tax_rate_percentage: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="0">0% (Exempted)</option>
                    <option value="5">5% (Staples / Edibles)</option>
                    <option value="12">12% (Processed Foods)</option>
                    <option value="18">18% (Standard FMCG)</option>
                    <option value="28">28% (Luxury / Aerated)</option>
                  </select>
                </div>
              </div>

              {/* Initial stock (only on create) */}
              {!editingProduct && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Opening Stock ({formData.packaging_unit}s)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.initial_stock}
                      onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Initial stock placed in warehouse</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Low-Stock Warning Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Alerts trigger when stock drops below this</p>
                  </div>
                </div>
              )}

              {/* Vernacular Voice Aliases */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vernacular Voice Aliases (Spoken Synonyms)
                </label>
                <input
                  type="text"
                  value={formData.aliases}
                  onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                  placeholder="e.g. fortune tel, sunflower oil 1 litre, peela fortune"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Comma-separated vernacular words callers might say in Hindi or Telugu to refer to this item.
                </p>
              </div>

              {/* Modal Footer */}
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
                  {editingProduct ? 'Save Changes' : 'Register Wholesale SKU'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK STOCK ADJUSTMENT MODAL */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Adjust Inventory Balance
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {adjustingProduct.sku} — {adjustingProduct.name}
                </p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Current Stock on Hand:</span>
                <span className="font-bold text-slate-900">
                  {adjustingProduct.current_stock} {adjustingProduct.packaging?.packaging_unit || 'Units'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjustment Type *
                </label>
                <select
                  value={adjustData.movement_type}
                  onChange={(e) => setAdjustData({ ...adjustData, movement_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="MANUAL_ADJUSTMENT">Manual Stock Count Adjustment</option>
                  <option value="STOCK_DAMAGED">Damaged / Expired Goods Write-off</option>
                  <option value="STOCK_RETURNED">Customer Return Restock</option>
                  <option value="STOCK_CORRECTION">System Count Correction</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity Delta ({adjustingProduct.packaging?.packaging_unit || 'Units'}) *
                </label>
                <input
                  type="number"
                  required
                  value={adjustData.quantity_delta}
                  onChange={(e) => setAdjustData({ ...adjustData, quantity_delta: e.target.value })}
                  placeholder="e.g. +10 or -5"
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Use negative values (e.g. -5) to write off damaged goods, positive (e.g. +10) to add stock.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  placeholder="e.g. Warehouse count mismatch during weekly audit"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  value={adjustData.notes}
                  onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                  placeholder="Additional supervisor notes..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdjustingProduct(null)}
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
                  Apply & Record in Ledger
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

