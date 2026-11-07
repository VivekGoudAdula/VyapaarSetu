import { apiRequest } from './api';

/**
 * Frontend API client for Promotional Schemes & Calculation Engine.
 */
export const schemesService = {
  /**
   * Lists schemes with status breakdown (active/upcoming/expired).
   */
  async listSchemes({ page = 1, limit = 20, status = 'all' } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (status && status !== 'all') {
      params.append('status', status);
    }

    return apiRequest(`/api/v1/schemes?${params.toString()}`);
  },

  /**
   * Retrieves single scheme details.
   */
  async getScheme(schemeId) {
    return apiRequest(`/api/v1/schemes/${schemeId}`);
  },

  /**
   * Creates a promotional scheme.
   */
  async createScheme(data) {
    return apiRequest('/api/v1/schemes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Updates an existing scheme.
   */
  async updateScheme(schemeId, data) {
    return apiRequest(`/api/v1/schemes/${schemeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Deactivates a scheme.
   */
  async deleteScheme(schemeId) {
    return apiRequest(`/api/v1/schemes/${schemeId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Evaluates line items against active schemes deterministically.
   */
  async calculateSchemes(items) {
    return apiRequest('/api/v1/schemes/calculate', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
  },
};

