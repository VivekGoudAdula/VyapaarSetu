import { apiRequest } from './api';

/**
 * Frontend API client for Inventory Balances and Movement Ledger.
 */
export const inventoryService = {
  /**
   * Lists inventory items with status filtering.
   */
  async listInventory({ page = 1, limit = 20, status = 'all' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (status && status !== 'all') {
      params.append('status', status);
    }

    return apiRequest(`/api/v1/inventory?${params.toString()}`);
  },

  /**
   * Retrieves single inventory record by product ID.
   */
  async getInventory(productId) {
    return apiRequest(`/api/v1/inventory/${productId}`);
  },

  /**
   * Records newly received stock shipment.
   */
  async receiveStock(data) {
    return apiRequest('/api/v1/inventory/receive', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Records manual stock adjustment or damaged goods.
   */
  async adjustStock(data) {
    return apiRequest('/api/v1/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Retrieves movement ledger audit history for a product.
   */
  async getProductLedger(productId, { page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    return apiRequest(`/api/v1/inventory/${productId}/ledger?${params.toString()}`);
  },
};

