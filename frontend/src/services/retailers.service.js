import { apiRequest } from './api';

/**
 * Frontend API client for Retailer Directory and Customer Profiles.
 */
export const retailersService = {
  /**
   * Lists retailers with search filter and pagination.
   */
  async listRetailers({ page = 1, limit = 20, search = '' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    return apiRequest(`/api/v1/retailers?${params.toString()}`);
  },

  /**
   * Retrieves single retailer account.
   */
  async getRetailer(retailerId) {
    return apiRequest(`/api/v1/retailers/${retailerId}`);
  },

  /**
   * Registers a new retailer account.
   */
  async createRetailer(data) {
    return apiRequest('/api/v1/retailers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing retailer account.
   */
  async updateRetailer(retailerId, data) {
    return apiRequest(`/api/v1/retailers/${retailerId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deactivates a retailer.
   */
  async deleteRetailer(retailerId) {
    return apiRequest(`/api/v1/retailers/${retailerId}`, {
      method: 'DELETE',
    });
  },
};
